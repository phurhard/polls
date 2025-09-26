import { NextRequest, NextResponse } from 'next/server'
import { LoginCredentials, User, ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: LoginCredentials = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email and password are required'
        } as ApiResponse<null>,
        { status: 400 }
      )
    }

    // TODO: Replace with actual authentication logic
    // - Validate credentials against database
    // - Hash password comparison
    // - Generate JWT token
    // - Handle rate limiting

    // Mock authentication for development
    if (email === 'demo@example.com' && password === 'password') {
      const user: User = {
        id: '1',
        email: email,
        name: 'Demo User',
        avatarUrl: null,
        bio: null,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      }

      const token = 'mock-jwt-token' // Replace with actual JWT

      return NextResponse.json({
        success: true,
        data: {
          user,
          token,
        },
        message: 'Sign in successful',
      } as ApiResponse<{ user: User; token: string }>)
    }

    // Invalid credentials
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid email or password'
      } as ApiResponse<null>,
      { status: 401 }
    )

  } catch (error) {
    console.error('Sign in API error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>,
      { status: 500 }
    )
  }
}

// OPTIONS method for CORS preflight
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  )
}
