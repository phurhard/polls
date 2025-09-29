// Unified type definitions that bridge database and frontend inconsistencies
// This file provides consistent types and transformation utilities

import { 
  DbPoll, 
  DbPollOption, 
  DbPollOptionWithStats,
  DbVote, 
  DbUser, 
  DbPollWithRelations,
  CreatePollForm as DbCreatePollForm,
  VoteForm as DbVoteForm,
  PollFilters as DbPollFilters
} from './database'

// =====================================================
// UNIFIED FRONTEND TYPES (camelCase)
// =====================================================

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string | null
  bio?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Poll {
  id: string
  title: string
  description?: string | null
  creatorId: string
  creator?: User
  isActive: boolean
  allowMultipleChoices: boolean
  expiresAt?: Date | null
  categoryId?: string | null
  createdAt: Date
  updatedAt: Date
  options: PollOption[]
  _count?: {
    votes: number
  }
}

export interface PollOption {
  id: string
  pollId: string
  text: string
  order: number
  createdAt: Date
  updatedAt: Date
  votes?: Vote[]
  _count?: {
    votes: number
  }
}

export interface Vote {
  id: string
  userId: string
  user?: User
  pollId: string
  poll?: Poll
  optionId: string
  option?: PollOption
  createdAt: Date
}

// =====================================================
// FORM AND API TYPES
// =====================================================

export interface CreatePollData {
  title: string
  description?: string
  options: string[]
  allowMultipleChoices?: boolean
  expiresAt?: Date | null
  categoryId?: string | null
}

export interface UpdatePollData {
  title?: string
  description?: string | null
  isActive?: boolean
  expiresAt?: Date | null
  categoryId?: string | null
}

export interface VoteData {
  optionIds: string[]
}

export interface PollFilters {
  status?: 'active' | 'expired' | 'inactive' | 'all'
  categoryId?: string
  creatorId?: string
  search?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'totalVotes'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// =====================================================
// AUTHENTICATION TYPES
// =====================================================

export interface AuthUser {
  id: string
  email: string
  name: string
  avatarUrl?: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  name: string
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// =====================================================
// EXTENDED TYPES WITH STATISTICS
// =====================================================

export interface PollWithStats extends Poll {
  totalVotes: number
  uniqueVoters: number
  userVotes?: Vote[]
  hasUserVoted: boolean
  isCurrentlyActive: boolean
}

export interface PollOptionWithStats extends PollOption {
  voteCount: number
  percentage: number
}

// =====================================================
// TRANSFORMATION UTILITIES
// =====================================================

/**
 * Transform database user to frontend user
 */
export function transformDbUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    avatarUrl: dbUser.avatar_url,
    bio: dbUser.bio,
    isActive: dbUser.is_active,
    createdAt: new Date(dbUser.created_at),
    updatedAt: new Date(dbUser.updated_at),
  }
}

/**
 * Transform database poll to frontend poll
 */
export function transformDbPoll(dbPoll: DbPoll, options: PollOption[] = []): Poll {
  return {
    id: dbPoll.id,
    title: dbPoll.title,
    description: dbPoll.description,
    creatorId: dbPoll.creator_id,
    isActive: dbPoll.is_active,
    allowMultipleChoices: dbPoll.allow_multiple_choices,
    expiresAt: dbPoll.expires_at ? new Date(dbPoll.expires_at) : null,
    categoryId: dbPoll.category_id,
    createdAt: new Date(dbPoll.created_at),
    updatedAt: new Date(dbPoll.updated_at),
    options,
  }
}

/**
 * Transform database poll option to frontend poll option
 */
export function transformDbPollOption(
  dbOption: DbPollOption | DbPollOptionWithStats
): PollOption {
  const base: PollOption = {
    id: dbOption.id,
    pollId: dbOption.poll_id,
    text: dbOption.text,
    order: dbOption.order,
    createdAt: new Date(dbOption.created_at),
    updatedAt: new Date(dbOption.updated_at),
  }

  // If coming from the stats view, attach _count.votes so UI can compute percentages
  if ('vote_count' in dbOption && typeof (dbOption as any).vote_count === 'number') {
    (base as any)._count = { votes: (dbOption as any).vote_count }
  }

  return base
}

/**
 * Transform database vote to frontend vote
 */
export function transformDbVote(dbVote: DbVote): Vote {
  return {
    id: dbVote.id,
    userId: dbVote.user_id,
    pollId: dbVote.poll_id,
    optionId: dbVote.option_id,
    createdAt: new Date(dbVote.created_at),
  }
}

/**
 * Transform frontend CreatePollData to database CreatePollForm
 */
export function transformCreatePollData(data: CreatePollData): DbCreatePollForm {
  return {
    title: data.title,
    description: data.description ?? undefined,
    options: data.options,
    allow_multiple_choices: data.allowMultipleChoices || false,
    expires_at: data.expiresAt ?? undefined,
    category_id: data.categoryId ?? null,
  }
}

/**
 * Transform frontend VoteData to database VoteForm
 */
export function transformVoteData(data: VoteData): DbVoteForm {
  return {
    option_ids: data.optionIds,
  }
}

/**
 * Transform frontend PollFilters to database PollFilters
 */
export function transformPollFilters(filters: PollFilters): DbPollFilters {
  return {
    status: filters.status,
    category_id: filters.categoryId,
    creator_id: filters.creatorId,
    search: filters.search,
    sort_by: filters.sortBy === 'totalVotes' ? 'total_votes' : 
             filters.sortBy === 'createdAt' ? 'created_at' :
             filters.sortBy === 'updatedAt' ? 'updated_at' : 
             filters.sortBy,
    sort_order: filters.sortOrder,
    limit: filters.limit,
    offset: filters.offset,
  }
}
