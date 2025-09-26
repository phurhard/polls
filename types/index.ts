// Re-export all unified types as the primary interface
// This maintains backward compatibility while using the new unified type system

export {
  // Core types
  User,
  Poll,
  PollOption,
  Vote,

  // Form and API types
  CreatePollData,
  UpdatePollData,
  VoteData,
  PollFilters,

  // Authentication types
  AuthUser,
  LoginCredentials,
  RegisterCredentials,

  // API response types
  ApiResponse,
  PaginatedResponse,

  // Extended types with statistics
  PollWithStats,
  PollOptionWithStats,

  // Transformation utilities
  transformDbUser,
  transformDbPoll,
  transformDbPollOption,
  transformDbVote,
  transformCreatePollData,
  transformVoteData,
  transformPollFilters,
} from './unified'

// Legacy exports for backward compatibility
// These will be deprecated in future versions
export type { User as LegacyUser } from './unified'
export type { Poll as LegacyPoll } from './unified'
export type { PollOption as LegacyPollOption } from './unified'
export type { Vote as LegacyVote } from './unified'
