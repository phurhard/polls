export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Poll {
  id: string;
  title: string;
  description?: string;
  creatorId: string;
  creator?: User;
  options: PollOption[];
  isActive: boolean;
  allowMultipleChoices: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    votes: number;
  };
}

export interface PollOption {
  id: string;
  pollId: string;
  text: string;
  order: number;
  votes: Vote[];
  _count?: {
    votes: number;
  };
}

export interface Vote {
  id: string;
  userId: string;
  user?: User;
  pollId: string;
  poll?: Poll;
  optionId: string;
  option?: PollOption;
  createdAt: Date;
}

export interface CreatePollData {
  title: string;
  description?: string;
  options: string[];
  allowMultipleChoices?: boolean;
  expiresAt?: Date;
}

export interface UpdatePollData {
  title?: string;
  description?: string;
  isActive?: boolean;
  expiresAt?: Date;
}

export interface VoteData {
  optionIds: string[];
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface PollWithStats extends Poll {
  totalVotes: number;
  userVotes?: Vote[];
  hasUserVoted: boolean;
}

export interface PollOptionWithStats extends PollOption {
  voteCount: number;
  percentage: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PollFilters {
  status?: 'active' | 'expired' | 'all';
  creatorId?: string;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'votes';
  sortOrder?: 'asc' | 'desc';
}
