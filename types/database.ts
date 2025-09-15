// Database-specific TypeScript types for Supabase schema
// Generated to match the database schema in supabase/schema.sql

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          bio: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          avatar_url?: string | null
          bio?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          bio?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      polls: {
        Row: {
          id: string
          title: string
          description: string | null
          creator_id: string
          is_active: boolean
          allow_multiple_choices: boolean
          expires_at: string | null
          category_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          creator_id: string
          is_active?: boolean
          allow_multiple_choices?: boolean
          expires_at?: string | null
          category_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          creator_id?: string
          is_active?: boolean
          allow_multiple_choices?: boolean
          expires_at?: string | null
          category_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      poll_options: {
        Row: {
          id: string
          poll_id: string
          text: string
          order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          poll_id: string
          text: string
          order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          poll_id?: string
          text?: string
          order?: number
          created_at?: string
          updated_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          user_id: string
          poll_id: string
          option_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          poll_id: string
          option_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          poll_id?: string
          option_id?: string
          created_at?: string
        }
      }
      poll_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string
          is_active?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      polls_with_stats: {
        Row: {
          id: string
          title: string
          description: string | null
          creator_id: string
          is_active: boolean
          allow_multiple_choices: boolean
          expires_at: string | null
          category_id: string | null
          created_at: string
          updated_at: string
          total_votes: number
          unique_voters: number
          is_currently_active: boolean
        }
      }
      poll_options_with_stats: {
        Row: {
          id: string
          poll_id: string
          text: string
          order: number
          created_at: string
          updated_at: string
          vote_count: number
          vote_percentage: number
        }
      }
    }
    Functions: {
      get_poll_results: {
        Args: {
          poll_uuid: string
        }
        Returns: {
          option_id: string
          option_text: string
          option_order: number
          vote_count: number
          percentage: number
        }[]
      }
      user_has_voted: {
        Args: {
          poll_uuid: string
          user_uuid?: string
        }
        Returns: boolean
      }
      get_user_votes: {
        Args: {
          poll_uuid: string
          user_uuid?: string
        }
        Returns: {
          vote_id: string
          option_id: string
          option_text: string
          created_at: string
        }[]
      }
      handle_new_user: {
        Args: {}
        Returns: undefined
      }
      validate_vote: {
        Args: {}
        Returns: undefined
      }
      update_updated_at_column: {
        Args: {}
        Returns: undefined
      }
    }
    Enums: {}
  }
}

// Helper types for common database operations
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific table types for easier use
export type DbUser = Tables<'users'>
export type DbPoll = Tables<'polls'>
export type DbPollOption = Tables<'poll_options'>
export type DbVote = Tables<'votes'>
export type DbPollCategory = Tables<'poll_categories'>

// Insert types
export type DbUserInsert = TablesInsert<'users'>
export type DbPollInsert = TablesInsert<'polls'>
export type DbPollOptionInsert = TablesInsert<'poll_options'>
export type DbVoteInsert = TablesInsert<'votes'>
export type DbPollCategoryInsert = TablesInsert<'poll_categories'>

// Update types
export type DbUserUpdate = TablesUpdate<'users'>
export type DbPollUpdate = TablesUpdate<'polls'>
export type DbPollOptionUpdate = TablesUpdate<'poll_options'>
export type DbVoteUpdate = TablesUpdate<'votes'>
export type DbPollCategoryUpdate = TablesUpdate<'poll_categories'>

// View types
export type DbPollWithStats = Database['public']['Views']['polls_with_stats']['Row']
export type DbPollOptionWithStats = Database['public']['Views']['poll_options_with_stats']['Row']

// Function return types
export type PollResults = Database['public']['Functions']['get_poll_results']['Returns']
export type UserVotes = Database['public']['Functions']['get_user_votes']['Returns']

// Extended types with relationships (for application use)
export interface DbPollWithRelations extends DbPoll {
  creator: DbUser
  options: DbPollOptionWithStats[]
  category?: DbPollCategory | null
  user_votes?: DbVote[]
  _count: {
    votes: number
  }
}

export interface DbPollOptionWithRelations extends DbPollOption {
  votes: DbVote[]
  _count: {
    votes: number
  }
}

export interface DbVoteWithRelations extends DbVote {
  user: DbUser
  poll: DbPoll
  option: DbPollOption
}

// Query filter types
export interface PollFilters {
  status?: 'active' | 'expired' | 'inactive' | 'all'
  category_id?: string
  creator_id?: string
  search?: string
  sort_by?: 'created_at' | 'updated_at' | 'title' | 'total_votes'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface VoteFilters {
  poll_id?: string
  user_id?: string
  option_id?: string
  from_date?: string
  to_date?: string
  limit?: number
  offset?: number
}

// API response types
export interface DatabaseResponse<T> {
  data: T | null
  error: {
    message: string
    details?: string
    hint?: string
    code?: string
  } | null
}

export interface DatabaseListResponse<T> {
  data: T[] | null
  error: {
    message: string
    details?: string
    hint?: string
    code?: string
  } | null
  count?: number
}

// Realtime subscription types
export interface RealtimePayload<T> {
  schema: string
  table: string
  commit_timestamp: string
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: T
  old?: T
}

export type PollSubscriptionPayload = RealtimePayload<DbPoll>
export type VoteSubscriptionPayload = RealtimePayload<DbVote>
export type UserSubscriptionPayload = RealtimePayload<DbUser>

// Error types
export interface DatabaseError {
  message: string
  details?: string
  hint?: string
  code?: string
}

// Utility types for form handling
export interface CreatePollForm {
  title: string
  description?: string
  options: string[]
  allow_multiple_choices?: boolean
  expires_at?: Date | null
  category_id?: string | null
}

export interface UpdatePollForm {
  title?: string
  description?: string | null
  is_active?: boolean
  expires_at?: Date | null
  category_id?: string | null
}

export interface VoteForm {
  option_ids: string[]
}

export interface UserProfileForm {
  name: string
  bio?: string | null
  avatar_url?: string | null
}

// Statistics types
export interface PollStatistics {
  total_polls: number
  active_polls: number
  expired_polls: number
  total_votes: number
  average_votes_per_poll: number
  most_popular_category?: string
}

export interface UserStatistics {
  polls_created: number
  votes_cast: number
  most_active_category?: string
  join_date: string
}

// Aggregation types
export interface VoteAggregation {
  option_id: string
  option_text: string
  vote_count: number
  percentage: number
}

export interface CategoryAggregation {
  category_id: string
  category_name: string
  poll_count: number
  total_votes: number
}

// Export default database type
export default Database
