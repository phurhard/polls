polls/tests/__mocks__/supabaseClient.js
```
```js
// Mocking the Supabase client for testing purposes

const supabase = {
  auth: {
    getUser: jest.fn(() => ({
      data: { user: { id: 'mock-user-id' } },
      error: null,
    })),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    then: jest.fn((callback) =>
      callback({
        data: null,
        error: null,
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

module.exports = { supabase };
