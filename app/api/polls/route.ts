import { NextRequest, NextResponse } from 'next/server'
import { getPollsUnified, createPollWithClient } from '@/lib/database'
import { supabase } from '@/lib/database'
import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from '@/lib/config'
import {
  ApiResponse,
  Poll,
  PollFilters,
  CreatePollData
} from '@/types'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' } as ApiResponse<null>,
        { status: 401 }
      )
    }
    const token = authHeader.replace('Bearer ', '').trim()

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' } as ApiResponse<null>,
        { status: 401 }
      )
    }

    const body: CreatePollData = await request.json()
    const { title, description, options, allowMultipleChoices, expiresAt, categoryId } = body

    // Validate input
    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Poll title is required' } as ApiResponse<null>,
        { status: 400 }
      )
    }

    if (!options || options.length < 2) {
      return NextResponse.json(
        { success: false, error: 'At least 2 options are required' } as ApiResponse<null>,
        { status: 400 }
      )
    }

    if (options.length > 10) {
      return NextResponse.json(
        { success: false, error: 'Maximum 10 options allowed' } as ApiResponse<null>,
        { status: 400 }
      )
    }

    const cleanedOptions = options.map(opt => opt.trim()).filter(Boolean)
    if (cleanedOptions.length < 2) {
      return NextResponse.json(
        { success: false, error: 'At least 2 non-empty options are required' } as ApiResponse<null>,
        { status: 400 }
      )
    }

    const unique = new Set(cleanedOptions.map(opt => opt.toLowerCase()))
    if (unique.size !== cleanedOptions.length) {
      return NextResponse.json(
        { success: false, error: 'All options must be unique' } as ApiResponse<null>,
        { status: 400 }
      )
    }

    if (expiresAt && new Date(expiresAt) <= new Date()) {
      return NextResponse.json(
        { success: false, error: 'Expiry date must be in the future' } as ApiResponse<null>,
        { status: 400 }
      )
    }

    // Create a Supabase client bound to the user's token so RLS uses auth.uid()
    const tokenClient = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, detectSessionInUrl: false },
    })

    // Create poll using token-bound client
    const { data: poll, error: createError } = await createPollWithClient(
      {
        title: title.trim(),
        description: description?.trim() || undefined,
        options: cleanedOptions,
        allow_multiple_choices: allowMultipleChoices || false,
        expires_at: expiresAt ? new Date(expiresAt) : null,
        category_id: categoryId || null,
      },
      user.id,
      tokenClient
    )

    if (createError) {
      console.error('Poll creation error:', createError)
      return NextResponse.json(
        { success: false, error: createError.message || 'Failed to create poll' } as ApiResponse<null>,
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
      { success: false, error: 'Internal server error' } as ApiResponse<null>,
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
    const status = (searchParams.get('status') as 'active' | 'expired' | 'inactive' | 'all') || 'active'
    const categoryId = searchParams.get('category_id') || undefined
    const creatorId = searchParams.get('creator_id') || undefined
    const search = searchParams.get('search') || undefined
    const sortByDb = (searchParams.get('sort_by') as 'created_at' | 'updated_at' | 'title' | 'total_votes') || 'created_at'
    const sortOrder = (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Convert to frontend filters and use unified API
    const frontendFilters: PollFilters = {
      status,
      categoryId,
      creatorId,
      search,
      sortBy: sortByDb === 'total_votes' ? 'totalVotes' :
              sortByDb === 'created_at' ? 'createdAt' :
              sortByDb === 'updated_at' ? 'updatedAt' :
              sortByDb,
      sortOrder,
      limit,
      offset
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
        limit: limit || 20,
        offset: offset || 0,
        hasNext: (result.data?.length || 0) === (limit || 20),
        hasPrev: (offset || 0) > 0,
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
