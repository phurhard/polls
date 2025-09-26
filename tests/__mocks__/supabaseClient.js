// Comprehensive Supabase client mock for testing purposes
// Updated to match current unified type system

const mockUser = {
  id: 'mock-user-id',
  email: 'test@example.com',
  name: 'Test User',
  avatar_url: null,
  bio: null,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockPoll = {
  id: 'mock-poll-id',
  title: 'Mock Poll',
  description: 'Mock poll description',
  creator_id: 'mock-user-id',
  is_active: true,
  allow_multiple_choices: false,
  expires_at: null,
  category_id: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const supabase = {
  auth: {
    getUser: jest.fn(() => ({
      data: { user: mockUser },
      error: null,
    })),
    signInWithPassword: jest.fn(() => ({
      data: { user: mockUser },
      error: null,
    })),
    signUp: jest.fn(() => ({
      data: { user: mockUser },
      error: null,
    })),
    signOut: jest.fn(() => ({
      data: {},
      error: null,
    })),
    onAuthStateChange: jest.fn(() => ({
      subscription: {
        unsubscribe: jest.fn(),
      },
    })),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    rangeGt: jest.fn().mockReturnThis(),
    rangeGte: jest.fn().mockReturnThis(),
    rangeLt: jest.fn().mockReturnThis(),
    rangeLte: jest.fn().mockReturnThis(),
    rangeAdjacent: jest.fn().mockReturnThis(),
    overlaps: jest.fn().mockReturnThis(),
    textSearch: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockReturnThis(),
    csv: jest.fn().mockReturnThis(),
    geojson: jest.fn().mockReturnThis(),
    explain: jest.fn().mockReturnThis(),
    rollback: jest.fn().mockReturnThis(),
    returns: jest.fn().mockReturnThis(),
    then: jest.fn((callback) =>
      callback({
        data: [mockPoll],
        error: null,
        count: 1,
      })
    ),
  })),
  rpc: jest.fn(() => ({
    then: jest.fn((callback) =>
      callback({
        data: null,
        error: null,
      })
    ),
  })),
};

module.exports = { supabase, mockUser, mockPoll };
