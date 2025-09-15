import { NextRequest, NextResponse } from 'next/server'
import { createPoll, getPolls } from '@/lib/database'
import { supabase } from '@/lib/database'
import { CreatePollForm, PollFilters } from '@/types/database'

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
      { data: poll, message: 'Poll created successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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

    const { data: polls, error: fetchError, count } = await getPolls(filters, user?.id)

    if (fetchError) {
      console.error('Polls fetch error:', fetchError)
      return NextResponse.json(
        { error: fetchError.message || 'Failed to fetch polls' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: polls || [],
      pagination: {
        total: count || 0,
        limit: filters.limit || 20,
        offset: filters.offset || 0,
        hasNext: (count || 0) > (filters.offset || 0) + (filters.limit || 20),
        hasPrev: (filters.offset || 0) > 0,
      }
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
