import { NextRequest, NextResponse } from 'next/server'
import { createPoll, getPollsUnified } from '@/lib/database'
import { supabase } from '@/lib/database'
import { CreatePollForm } from '@/types/database'
import {
  ApiResponse,
  Poll,
  PollFilters
} from '@/types'

export async function POST(request: NextRequest) {
  try {
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const pollData: CreatePollForm = body

    // Validate required fields
    if (!pollData.title?.trim()) {
      return NextResponse.json(
        { error: 'Poll title is required' },
        { status: 400 }
      )
    }

    if (!pollData.options || pollData.options.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 options are required' },
        { status: 400 }
      )
    }

    // Filter out empty options
    const validOptions = pollData.options.filter(opt => opt.trim())
    if (validOptions.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 non-empty options are required' },
        { status: 400 }
      )
    }

    // Check for duplicate options
    const uniqueOptions = new Set(validOptions.map(opt => opt.trim().toLowerCase()))
    if (uniqueOptions.size !== validOptions.length) {
      return NextResponse.json(
        { error: 'All options must be unique' },
        { status: 400 }
      )
    }

    // Validate expiry date
    if (pollData.expires_at && new Date(pollData.expires_at) <= new Date()) {
      return NextResponse.json(
        { error: 'Expiry date must be in the future' },
        { status: 400 }
      )
    }

    // Create the poll
    const { data: poll, error: createError } = await createPoll(
      {
        title: pollData.title.trim(),
        description: pollData.description?.trim() || null,
        options: validOptions,
        allow_multiple_choices: pollData.allow_multiple_choices || false,
        expires_at: pollData.expires_at ? new Date(pollData.expires_at) : null,
        category_id: pollData.category_id || null,
      },
      user.id
    )

    if (createError) {
      console.error('Poll creation error:', createError)
      return NextResponse.json(
        { error: createError.message || 'Failed to create poll' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: poll,
        message: 'Poll created successfully'
      } as ApiResponse<typeof poll>,
      { status: 201 }
    )
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>,
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Get the current user (optional for viewing polls)
    const { data: { user } } = await supabase.auth.getUser()

    // Parse query parameters
    const filters: PollFilters = {
      status: searchParams.get('status') as 'active' | 'expired' | 'inactive' | 'all' || 'active',
      category_id: searchParams.get('category_id') || undefined,
      creator_id: searchParams.get('creator_id') || undefined,
      search: searchParams.get('search') || undefined,
      sort_by: searchParams.get('sort_by') as 'created_at' | 'updated_at' | 'title' | 'total_votes' || 'created_at',
      sort_order: searchParams.get('sort_order') as 'asc' | 'desc' || 'desc',
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
    }

    // Convert to frontend filters and use unified API
    const frontendFilters: PollFilters = {
      status: filters.status,
      categoryId: filters.category_id,
      creatorId: filters.creator_id,
      search: filters.search,
      sortBy: filters.sort_by === 'total_votes' ? 'totalVotes' :
              filters.sort_by === 'created_at' ? 'createdAt' :
              filters.sort_by === 'updated_at' ? 'updatedAt' :
              filters.sort_by,
      sortOrder: filters.sort_order,
      limit: filters.limit,
      offset: filters.offset
    }

    const result = await getPollsUnified(frontendFilters, user?.id)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to fetch polls'
        } as ApiResponse<null>,
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data || [],
      pagination: {
        total: result.data?.length || 0,
        limit: filters.limit || 20,
        offset: filters.offset || 0,
        hasNext: (result.data?.length || 0) === (filters.limit || 20),
        hasPrev: (filters.offset || 0) > 0,
      }
    } as ApiResponse<Poll[]>)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>,
      { status: 500 }
    )
  }
}
