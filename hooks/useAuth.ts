"use client"

import { useState, useEffect, useContext, createContext, ReactNode } from 'react'
import { User, LoginCredentials, RegisterCredentials } from '@/types'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (credentials: LoginCredentials) => Promise<void>
  signUp: (credentials: RegisterCredentials) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for stored auth token
        const token = localStorage.getItem('authToken')
        if (token) {
          // Validate token and get user data
          const userData = await validateToken(token)
          setUser(userData)
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
        localStorage.removeItem('authToken')
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const signIn = async (credentials: LoginCredentials) => {
    setIsLoading(true)
    try {
      // Replace with actual API call
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Sign in failed')
      }

      const { user: userData, token } = await response.json()

      localStorage.setItem('authToken', token)
      setUser(userData)
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (credentials: RegisterCredentials) => {
    setIsLoading(true)
    try {
      // Replace with actual API call
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Sign up failed')
      }

      const { user: userData, token } = await response.json()

      localStorage.setItem('authToken', token)
      setUser(userData)
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    setIsLoading(true)
    try {
      // Call sign out API endpoint
      await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      })
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      localStorage.removeItem('authToken')
      setUser(null)
      setIsLoading(false)
    }
  }

  const refreshUser = async () => {
    const token = localStorage.getItem('authToken')
    if (!token) return

    try {
      const userData = await validateToken(token)
      setUser(userData)
    } catch (error) {
      console.error('Failed to refresh user:', error)
      await signOut()
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Helper function to validate token
async function validateToken(token: string): Promise<User> {
  const response = await fetch('/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Token validation failed')
  }

  return response.json()
}

// Mock implementation for development
export function useMockAuth(): AuthContextType {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const signIn = async (credentials: LoginCredentials) => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    const mockUser: User = {
      id: '1',
      email: credentials.email,
      name: 'Mock User',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setUser(mockUser)
    localStorage.setItem('mockAuthToken', 'mock-token')
    setIsLoading(false)
  }

  const signUp = async (credentials: RegisterCredentials) => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    const mockUser: User = {
      id: '1',
      email: credentials.email,
      name: credentials.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setUser(mockUser)
    localStorage.setItem('mockAuthToken', 'mock-token')
    setIsLoading(false)
  }

  const signOut = async () => {
    setUser(null)
    localStorage.removeItem('mockAuthToken')
  }

  const refreshUser = async () => {
    // Mock refresh
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    refreshUser,
  }
}
