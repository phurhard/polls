/* @ts-nocheck */
import { createClient } from '@supabase/supabase-js'
import {
  Database,
  DbPoll,
  DbPollWithRelations,
  DbUser,
  DbPollOptionInsert,
  DbVoteInsert,
  DbVote,
  CreatePollForm,
  VoteForm,
  DatabaseResponse,
  DatabaseListResponse,
  PollResults,
  PollFilters as DbPollFilters
} from '@/types/database'
import {
  Poll,
  PollFilters,
  transformDbPoll,
  transformDbPollOption,
  transformDbUser,
  transformPollFilters,
  ApiResponse
} from '@/types'

import { supabaseConfig } from './config'

// Initialize Supabase client
export const supabase = createClient<Database>(
  supabaseConfig.url,
  supabaseConfig.anonKey
)

// Service role client for server-side operations (only if service role key is available)
export const supabaseAdmin = supabaseConfig.serviceRoleKey
  ? createClient<Database>(supabaseConfig.url, supabaseConfig.serviceRoleKey)
  : null

// =====================================================
// USER OPERATIONS
// =====================================================

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string): Promise<DatabaseResponse<DbUser>> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  return { data, error }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<DbUser>
): Promise<DatabaseResponse<DbUser>> {
  const { data, error } = await supabase
    .from('users')
    .update(updates as Database['public']['Tables']['users']['Update'])
    .eq('id', userId)
    .select()
    .single()

  return { data, error }
}

// =====================================================
// POLL OPERATIONS
// =====================================================

/**
 * Create a new poll with options
 */
export async function createPoll(
  pollData: CreatePollForm,
  userId: string
): Promise<DatabaseResponse<DbPollWithRelations>> {
  // Use transactional RPC to create poll and options under RLS
  const cleanedOptions = pollData.options.map((t) => t.trim()).filter(Boolean);

  const { data: newId, error: rpcError } = await supabase.rpc('create_poll_tx', {
    p_title: pollData.title.trim(),
    p_description: pollData.description?.trim() || null,
    p_options: cleanedOptions,
    p_allow_multiple: pollData.allow_multiple_choices || false,
    p_expires_at: pollData.expires_at ? pollData.expires_at.toISOString() : null,
    p_category_id: pollData.category_id || null,
  } as any);

  if (rpcError || !newId) {
    return { data: null, error: rpcError as any };
  }

  // Fetch the full poll with relations
  const result = await getPoll(newId as unknown as string, userId);
  if (result.error || !result.data) {
    return { data: null, error: result.error };
  }
  return { data: result.data, error: null };
}

export async function createPollWithClient(
  pollData: CreatePollForm,
  userId: string,
  client: any
): Promise<DatabaseResponse<DbPollWithRelations>> {
  // Create via transactional RPC bound to user's token (RLS)
  const cleanedOptions = pollData.options.map((t) => t.trim()).filter(Boolean);
  const { data: newId, error: rpcError } = await client.rpc('create_poll_tx', {
    p_title: pollData.title.trim(),
    p_description: pollData.description?.trim() || null,
    p_options: cleanedOptions,
    p_allow_multiple: pollData.allow_multiple_choices || false,
    p_expires_at: pollData.expires_at ? pollData.expires_at.toISOString() : null,
    p_category_id: pollData.category_id || null,
  });

  if (rpcError || !newId) {
    return { data: null, error: rpcError }
  }

  // Fetch minimal relations
  const { data: creator } = await client
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  const { data: poll } = await client
    .from('polls')
    .select(`
      *,
      category:poll_categories(*)
    `)
    .eq('id', newId)
    .single()

  const { data: options } = await client
    .from('poll_options_with_stats' as any)
    .select('*')
    .eq('poll_id', newId)
    .order('order')

  if (!poll || !creator) {
    return { data: null, error: { message: 'Failed to fetch created poll' } as any }
  }

  const pollWithRelations: DbPollWithRelations = {
    ...poll,
    creator: creator!,
    options: (options as any[]) || [],
    user_votes: [],
    _count: { votes: 0 }
  }

  return { data: pollWithRelations, error: null }
}

/**
 * Get poll by ID with full relations
 */
export async function getPoll(
  pollId: string,
  userId?: string
): Promise<DatabaseResponse<DbPollWithRelations>> {
  // Get poll with creator
  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select(`
      *,
      creator:users(*),
      category:poll_categories(*)
    `)
    .eq('id', pollId)
    .single()

  if (pollError || !poll) {
    return { data: null, error: pollError }
  }

  // Get options with vote counts
  const { data: options, error: optionsError } = await supabase
    .from('poll_options_with_stats' as any)
    .select('*')
    .eq('poll_id', pollId)
    .order('order')

  if (optionsError) {
    return { data: null, error: optionsError }
  }

  // Get user votes if user is provided
  let userVotes: DbVote[] = []
  if (userId) {
    const { data: votes } = await supabase
      .from('votes')
      .select('*')
      .eq('poll_id', pollId)
      .eq('user_id', userId)

    userVotes = votes || []
  }

  // Calculate total votes
  const totalVotes = (options as any[]).reduce((sum, option) => sum + (option.vote_count || 0), 0)

  const pollWithRelations: DbPollWithRelations = {
    ...poll,
    options,
    user_votes: userVotes,
    _count: { votes: totalVotes }
  }

  return { data: pollWithRelations, error: null }
}

/**
 * Get polls with filtering and pagination
 */
export async function getPolls(
  filters: DbPollFilters = {},
  userId?: string
): Promise<DatabaseListResponse<DbPollWithRelations>> {
  let query = supabase
    .from('polls_with_stats')
    .select(`
      *,
      creator:users(*),
      category:poll_categories(*)
    `)

  // Apply filters
  if (filters.status === 'active') {
    query = query.eq('is_currently_active', true)
  } else if (filters.status === 'expired') {
    query = query.eq('is_currently_active', false).eq('is_active', true)
  } else if (filters.status === 'inactive') {
    query = query.eq('is_active', false)
  }

  if (filters.category_id) {
    query = query.eq('category_id', filters.category_id)
  }

  if (filters.creator_id) {
    query = query.eq('creator_id', filters.creator_id)
  }

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  // Apply sorting
  const sortBy = filters.sort_by || 'created_at'
  const sortOrder = filters.sort_order || 'desc'

  if (sortBy === 'total_votes') {
    query = query.order('total_votes', { ascending: sortOrder === 'asc' })
  } else {
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })
  }

  // Apply pagination
  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
  }

  const { data: polls, error, count } = await query

  console.log(polls);

  if (error) {
    return { data: null, error, count: (count ?? undefined) }
  }

  // Batch-load options and user votes to avoid N+1 queries
  const pollList = ((polls as any[]) || [])
  const ids = pollList.map((p: any) => p.id)

  // Options for all polls
  const optionsByPoll = new Map<string, any[]>()
  if (ids.length > 0) {
    const { data: allOptions } = await supabase
      .from('poll_options_with_stats' as any)
      .select('*')
      .in('poll_id', ids)
      .order('order')

    ;(allOptions || []).forEach((opt: any) => {
      const arr = optionsByPoll.get(opt.poll_id) || []
      arr.push(opt)
      optionsByPoll.set(opt.poll_id, arr)
    })
  }

  // User votes for all polls (optional)
  const userVotesByPoll = new Map<string, DbVote[]>()
  if (userId && ids.length > 0) {
    const { data: votesAll } = await supabase
      .from('votes')
      .select('*')
      .eq('user_id', userId)
      .in('poll_id', ids)

    ;(votesAll || []).forEach((v: any) => {
      const arr = userVotesByPoll.get(v.poll_id) || []
      arr.push(v)
      userVotesByPoll.set(v.poll_id, arr)
    })
  }

  const pollsWithRelations: DbPollWithRelations[] = pollList.map((poll: any) => ({
    ...poll,
    options: optionsByPoll.get(poll.id) || [],
    user_votes: userVotesByPoll.get(poll.id) || [],
    _count: { votes: (poll as any).total_votes }
  }))

  return { data: pollsWithRelations, error: null, count: (count ?? undefined) }
}

// =====================================================
// UNIFIED FRONTEND API FUNCTIONS
// =====================================================

/**
 * Unified function to get polls with proper type transformation
 * Returns frontend-compatible Poll objects
 */
export async function getPollsUnified(
  filters: PollFilters = {},
  userId?: string
): Promise<ApiResponse<Poll[]>> {
  try {
    const dbFilters = transformPollFilters(filters)
    const result = await getPolls(dbFilters, userId)

    if (result.error) {
      return {
        success: false,
        error: result.error.message || 'Failed to fetch polls'
      }
    }

    const transformedPolls = (result.data || []).map(dbPoll => {
      const options = dbPoll.options.map(transformDbPollOption)
      const poll = transformDbPoll(dbPoll, options)

      // Add creator if available
      if (dbPoll.creator) {
        poll.creator = transformDbUser(dbPoll.creator)
      }

      // Add vote count
      if (dbPoll._count) {
        poll._count = { votes: dbPoll._count.votes }
      }

      return poll
    })

    return {
      success: true,
      data: transformedPolls
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Unified function to get a single poll with proper type transformation
 */
export async function getPollUnified(
  pollId: string,
  userId?: string
): Promise<ApiResponse<Poll>> {
  try {
    const result = await getPoll(pollId, userId)

    if (result.error || !result.data) {
      return {
        success: false,
        error: result.error?.message || 'Poll not found'
      }
    }

    const dbPoll = result.data
    const options = dbPoll.options.map(transformDbPollOption)
    const poll = transformDbPoll(dbPoll, options)

    // Add creator if available
    if (dbPoll.creator) {
      poll.creator = transformDbUser(dbPoll.creator)
    }

    // Add vote count
    if (dbPoll._count) {
      poll._count = { votes: dbPoll._count.votes }
    }

    return {
      success: true,
      data: poll
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Update poll
 */
export async function updatePoll(
  pollId: string,
  updates: Partial<DbPoll>,
  userId: string
): Promise<DatabaseResponse<DbPoll>> {
  const { data, error } = await supabase
    .from('polls')
    .update(updates as Database['public']['Tables']['polls']['Update'])
    .eq('id', pollId)
    .eq('creator_id', userId) // Ensure user owns the poll
    .select()
    .single()

  return { data, error }
}

/**
 * Delete poll (and all related data via cascade)
 */
export async function deletePoll(
  pollId: string,
  userId: string
): Promise<DatabaseResponse<null>> {
  const { error } = await supabase
    .from('polls')
    .delete()
    .eq('id', pollId)
    .eq('creator_id', userId) // Ensure user owns the poll

  return { data: null, error }
}

// =====================================================
// VOTING OPERATIONS
// =====================================================

/**
 * Cast a vote (or multiple votes if allowed)
 */
export async function castVote(
  pollId: string,
  voteData: VoteForm,
  userId: string
): Promise<DatabaseResponse<DbVote[]>> {
  // Use transactional RPC which enforces rules + triggers
  const { error } = await supabase.rpc('cast_vote_tx', {
    poll_uuid: pollId,
    option_ids: voteData.option_ids
  } as any)

  if (error) {
    return { data: null, error }
  }

  // Return user's votes after casting
  const { data } = await supabase
    .from('votes')
    .select('*')
    .eq('poll_id', pollId)
    .eq('user_id', userId)

  return { data: (data as DbVote[]) || [], error: null }
}

/**
 * Remove user's vote from a poll
 */
export async function removeVote(
  pollId: string,
  userId: string,
  optionId?: string
): Promise<DatabaseResponse<null>> {
  let query = supabase
    .from('votes')
    .delete()
    .eq('poll_id', pollId)
    .eq('user_id', userId)

  if (optionId) {
    query = query.eq('option_id', optionId)
  }

  const { error } = await query

  return { data: null, error }
}

/**
 * Get poll results using the database function
 */
export async function getPollResults(pollId: string): Promise<DatabaseResponse<PollResults>> {
  const { data, error } = await supabase.rpc('get_poll_results', {
    poll_uuid: pollId
  } as any)

  return { data, error }
}

/**
 * Check if user has voted on a poll
 */
export async function hasUserVoted(
  pollId: string,
  userId: string
): Promise<DatabaseResponse<boolean>> {
  const { data, error } = await supabase.rpc('user_has_voted', {
    poll_uuid: pollId,
    user_uuid: userId
  } as any)

  return { data, error }
}

/**
 * Get user's votes for a specific poll
 */
export async function getUserVotes(
  pollId: string,
  userId: string
): Promise<DatabaseResponse<PollResults>> {
  const { data, error } = await supabase.rpc('get_user_votes', {
    poll_uuid: pollId,
    user_uuid: userId
  } as any)

  return { data, error }
}

// =====================================================
// CATEGORY OPERATIONS
// =====================================================

/**
 * Get all active poll categories
 */
export async function getPollCategories() {
  const { data, error } = await supabase
    .from('poll_categories')
    .select('*')
    .eq('is_active', true)
    .order('name')

  return { data, error }
}

// =====================================================
// REAL-TIME SUBSCRIPTIONS
// =====================================================

/**
 * Subscribe to poll changes
 */
export function subscribeToPoll(
  pollId: string,
  callback: (payload: unknown) => void
) {
  return supabase
    .channel(`poll:${pollId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'polls',
        filter: `id=eq.${pollId}`
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'votes',
        filter: `poll_id=eq.${pollId}`
      },
      callback
    )
    .subscribe()
}

/**
 * Subscribe to user's polls
 */
export function subscribeToUserPolls(
  userId: string,
  callback: (payload: unknown) => void
) {
  return supabase
    .channel(`user-polls:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'polls',
        filter: `creator_id=eq.${userId}`
      },
      callback
    )
    .subscribe()
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Check if poll is currently active (not expired and is_active = true)
 */
export function isPollActive(poll: DbPoll): boolean {
  if (!poll.is_active) return false
  if (!poll.expires_at) return true
  return new Date(poll.expires_at) > new Date()
}

/**
 * Calculate vote percentage for an option
 */
export function calculateVotePercentage(optionVotes: number, totalVotes: number): number {
  if (totalVotes === 0) return 0
  return Math.round((optionVotes / totalVotes) * 100)
}

/**
 * Format poll expiration status
 */
export function getPollStatus(poll: DbPoll): 'active' | 'expired' | 'inactive' {
  if (!poll.is_active) return 'inactive'
  if (poll.expires_at && new Date(poll.expires_at) <= new Date()) return 'expired'
  return 'active'
}

/**
 * Get time remaining for a poll
 */
export function getTimeRemaining(expiresAt: string): {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
} {
  const now = new Date().getTime()
  const end = new Date(expiresAt).getTime()
  const total = end - now

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
  }

  const days = Math.floor(total / (1000 * 60 * 60 * 24))
  const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((total % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds, total }
}

// Export the main supabase client for direct use when needed
export default supabase
