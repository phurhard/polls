import { createClient } from '@supabase/supabase-js'
import {
  Database,
  DbPoll,
  DbPollWithRelations,
  DbPollOption,
  DbVote,
  DbUser,
  DbPollInsert,
  DbPollOptionInsert,
  DbVoteInsert,
  PollFilters,
  CreatePollForm,
  VoteForm,
  DatabaseResponse,
  DatabaseListResponse,
  PollResults
} from '@/types/database'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Service role client for server-side operations
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    .update(updates)
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
  // Start a transaction-like operation
  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .insert({
      title: pollData.title,
      description: pollData.description,
      creator_id: userId,
      allow_multiple_choices: pollData.allow_multiple_choices || false,
      expires_at: pollData.expires_at?.toISOString(),
      category_id: pollData.category_id,
    })
    .select('*')
    .single()

  if (pollError || !poll) {
    return { data: null, error: pollError }
  }

  // Create poll options
  const optionsData: DbPollOptionInsert[] = pollData.options.map((text, index) => ({
    poll_id: poll.id,
    text: text.trim(),
    order: index,
  }))

  const { data: options, error: optionsError } = await supabase
    .from('poll_options')
    .insert(optionsData)
    .select('*')

  if (optionsError) {
    // Cleanup: delete the poll if options creation failed
    await supabase.from('polls').delete().eq('id', poll.id)
    return { data: null, error: optionsError }
  }

  // Get creator info
  const { data: creator } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  // Return poll with relations
  const pollWithRelations: DbPollWithRelations = {
    ...poll,
    creator: creator!,
    options: options.map(option => ({
      ...option,
      vote_count: 0,
      vote_percentage: 0,
    })),
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
    .from('poll_options_with_stats')
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
  const totalVotes = options.reduce((sum, option) => sum + option.vote_count, 0)

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
  filters: PollFilters = {},
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

  if (error) {
    return { data: null, error, count }
  }

  // For each poll, get options and user votes
  const pollsWithRelations: DbPollWithRelations[] = await Promise.all(
    (polls || []).map(async (poll) => {
      // Get options with stats
      const { data: options } = await supabase
        .from('poll_options_with_stats')
        .select('*')
        .eq('poll_id', poll.id)
        .order('order')

      // Get user votes if user is provided
      let userVotes: DbVote[] = []
      if (userId) {
        const { data: votes } = await supabase
          .from('votes')
          .select('*')
          .eq('poll_id', poll.id)
          .eq('user_id', userId)

        userVotes = votes || []
      }

      return {
        ...poll,
        options: options || [],
        user_votes: userVotes,
        _count: { votes: poll.total_votes }
      }
    })
  )

  return { data: pollsWithRelations, error: null, count }
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
    .update(updates)
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
  // First, get poll info to validate voting rules
  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select('*')
    .eq('id', pollId)
    .single()

  if (pollError || !poll) {
    return { data: null, error: pollError }
  }

  // Check if poll is active and not expired
  if (!poll.is_active) {
    return {
      data: null,
      error: { message: 'Poll is not active', code: 'POLL_INACTIVE' }
    }
  }

  if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
    return {
      data: null,
      error: { message: 'Poll has expired', code: 'POLL_EXPIRED' }
    }
  }

  // If multiple choices not allowed, delete existing votes first
  if (!poll.allow_multiple_choices) {
    await supabase
      .from('votes')
      .delete()
      .eq('poll_id', pollId)
      .eq('user_id', userId)
  }

  // Create new votes
  const votesData: DbVoteInsert[] = voteData.option_ids.map(optionId => ({
    user_id: userId,
    poll_id: pollId,
    option_id: optionId,
  }))

  const { data, error } = await supabase
    .from('votes')
    .insert(votesData)
    .select()

  return { data, error }
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
  })

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
  })

  return { data, error }
}

/**
 * Get user's votes for a specific poll
 */
export async function getUserVotes(
  pollId: string,
  userId: string
): Promise<DatabaseResponse<any[]>> {
  const { data, error } = await supabase.rpc('get_user_votes', {
    poll_uuid: pollId,
    user_uuid: userId
  })

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
  callback: (payload: any) => void
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
  callback: (payload: any) => void
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
