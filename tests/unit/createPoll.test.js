polls/tests/unit/createPoll.test.js
```
```js
import { createPoll } from '@/lib/database';
import { supabase } from '@/tests/__mocks__/supabaseClient';

// Mock data
const mockPollData = {
  title: "New Poll",
  options: ["Option 1", "Option 2"],
};

jest.mock('@/lib/database', () => ({
  createPoll: jest.fn(),
}));

jest.mock('@/tests/__mocks__/supabaseClient');

describe('Create Poll Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create a poll with valid data', async () => {
    supabase.from().insert.mockResolvedValueOnce({ data: mockPollData, error: null });

    const result = await createPoll(mockPollData, 'mock-user-id');

    expect(supabase.from).toHaveBeenCalledWith('polls');
    expect(supabase.from().insert).toHaveBeenCalledWith(expect.objectContaining({
      title: mockPollData.title,
    }));
    expect(result.data).toEqual(mockPollData);
    expect(result.error).toBeNull();
  });

  test('should return an error if the poll title is missing', async () => {
    const invalidPollData = { ...mockPollData, title: '' };

    const result = await createPoll(invalidPollData, 'mock-user-id');

    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error.message).toBe('Poll title is required');
  });

  test('should return an error if less than 2 options are provided', async () => {
    const invalidPollData = { ...mockPollData, options: ['Only one option'] };

    const result = await createPoll(invalidPollData, 'mock-user-id');

    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error.message).toBe('At least 2 options are required');
  });

  test('should return an error if duplicate options are provided', async () => {
    const invalidPollData = { ...mockPollData, options: ['Option 1', 'Option 1'] };

    const result = await createPoll(invalidPollData, 'mock-user-id');

    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error.message).toBe('All options must be unique');
  });

  test('should handle database insertion errors gracefully', async () => {
    const dbError = { message: 'Database error' };
    supabase.from().insert.mockResolvedValueOnce({ data: null, error: dbError });

    const result = await createPoll(mockPollData, 'mock-user-id');

    expect(result.data).toBeNull();
    expect(result.error).toEqual(dbError);
  });
});
