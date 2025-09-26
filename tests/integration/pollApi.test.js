import request from 'supertest';
import { createServer } from '@/server';
import { supabase } from '@/tests/__mocks__/supabaseClient';
import { CreatePollData, ApiResponse } from '@/types';

jest.mock('@/lib/database');
jest.mock('@/tests/__mocks__/supabaseClient');

describe('Poll API Integration Tests', () => {
  let app;
  const mockPollData: CreatePollData = {
    title: 'Integration Poll Test',
    description: 'Test poll for integration testing',
    options: ['Integration Option 1', 'Integration Option 2'],
    allowMultipleChoices: false,
    expiresAt: null,
    categoryId: null,
  };

  beforeAll(() => {
    app = createServer();
  });

  test('should create a poll with valid input', async () => {
    const mockResponse: ApiResponse<any> = {
      success: true,
      data: mockPollData,
      message: 'Poll created successfully'
    };

    supabase.from().insert.mockResolvedValueOnce({ data: mockPollData, error: null });

    const response = await request(app)
      .post('/api/polls')
      .send(mockPollData)
      .set('Authorization', `Bearer mock-token`);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe(mockPollData.title);
    expect(response.body.data.options).toEqual(expect.arrayContaining(mockPollData.options));
    expect(supabase.from().insert).toHaveBeenCalledWith(expect.objectContaining({
      title: mockPollData.title,
    }));
  });

  test('should fail to create a poll without a title', async () => {
    const invalidPollData: CreatePollData = { ...mockPollData, title: '' };

    const response = await request(app)
      .post('/api/polls')
      .send(invalidPollData)
      .set('Authorization', `Bearer mock-token`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Poll title is required');
  });

  test('should fail to create a poll with less than two options', async () => {
    const invalidPollData: CreatePollData = { ...mockPollData, options: ['Only one option'] };

    const response = await request(app)
      .post('/api/polls')
      .send(invalidPollData)
      .set('Authorization', `Bearer mock-token`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('At least 2 options are required');
  });

  test('should fail to create a poll with duplicate options', async () => {
    const invalidPollData: CreatePollData = { ...mockPollData, options: ['Dup Option', 'Dup Option'] };

    const response = await request(app)
      .post('/api/polls')
      .send(invalidPollData)
      .set('Authorization', `Bearer mock-token`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('All options must be unique');
  });

  test('should handle database errors gracefully', async () => {
    const dbError = { message: 'Database error' };
    supabase.from().insert.mockResolvedValueOnce({ data: null, error: dbError });

    const response = await request(app)
      .post('/api/polls')
      .send(mockPollData)
      .set('Authorization', `Bearer mock-token`);

    expect(response.status).toBe(500);
    expect(response.body.error).toBe(dbError.message);
  });
});
