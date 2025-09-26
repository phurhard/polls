// Centralized configuration management for the polls application
// This file validates and exports all environment variables and configuration

interface AppConfig {
  // Supabase Configuration
  supabase: {
    url: string
    anonKey: string
    serviceRoleKey?: string
    projectId?: string
  }
  
  // Application Configuration
  app: {
    name: string
    version: string
    environment: 'development' | 'staging' | 'production'
    baseUrl: string
  }
  
  // Feature Flags
  features: {
    enableRegistration: boolean
    enableCategories: boolean
    enableRealtime: boolean
    enableAnalytics: boolean
  }
  
  // API Configuration
  api: {
    defaultPageSize: number
    maxPageSize: number
    rateLimitRequests: number
    rateLimitWindow: number
  }
  
  // Security Configuration
  security: {
    jwtSecret?: string
    sessionTimeout: number
    maxLoginAttempts: number
    lockoutDuration: number
  }
}

// Validate required environment variables
function validateEnvVar(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

// Get optional environment variable with default
function getEnvVar(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue
}

// Get boolean environment variable
function getBooleanEnvVar(name: string, defaultValue: boolean): boolean {
  const value = process.env[name]
  if (value === undefined) return defaultValue
  return value.toLowerCase() === 'true'
}

// Get number environment variable
function getNumberEnvVar(name: string, defaultValue: number): number {
  const value = process.env[name]
  if (value === undefined) return defaultValue
  const parsed = parseInt(value, 10)
  if (isNaN(parsed)) {
    console.warn(`Invalid number for ${name}, using default: ${defaultValue}`)
    return defaultValue
  }
  return parsed
}

// Build configuration object
export const config: AppConfig = {
  supabase: {
    url: validateEnvVar('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: validateEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    projectId: process.env.SUPABASE_PROJECT_ID,
  },
  
  app: {
    name: getEnvVar('NEXT_PUBLIC_APP_NAME', 'Polls App'),
    version: getEnvVar('NEXT_PUBLIC_APP_VERSION', '1.0.0'),
    environment: (getEnvVar('NODE_ENV', 'development') as AppConfig['app']['environment']),
    baseUrl: getEnvVar('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000'),
  },
  
  features: {
    enableRegistration: getBooleanEnvVar('NEXT_PUBLIC_ENABLE_REGISTRATION', true),
    enableCategories: getBooleanEnvVar('NEXT_PUBLIC_ENABLE_CATEGORIES', true),
    enableRealtime: getBooleanEnvVar('NEXT_PUBLIC_ENABLE_REALTIME', false),
    enableAnalytics: getBooleanEnvVar('NEXT_PUBLIC_ENABLE_ANALYTICS', false),
  },
  
  api: {
    defaultPageSize: getNumberEnvVar('API_DEFAULT_PAGE_SIZE', 20),
    maxPageSize: getNumberEnvVar('API_MAX_PAGE_SIZE', 100),
    rateLimitRequests: getNumberEnvVar('API_RATE_LIMIT_REQUESTS', 100),
    rateLimitWindow: getNumberEnvVar('API_RATE_LIMIT_WINDOW', 900), // 15 minutes
  },
  
  security: {
    jwtSecret: process.env.JWT_SECRET,
    sessionTimeout: getNumberEnvVar('SESSION_TIMEOUT', 86400), // 24 hours
    maxLoginAttempts: getNumberEnvVar('MAX_LOGIN_ATTEMPTS', 5),
    lockoutDuration: getNumberEnvVar('LOCKOUT_DURATION', 900), // 15 minutes
  },
}

// Validation functions
export function validateConfig(): void {
  // Validate Supabase URL format
  try {
    new URL(config.supabase.url)
  } catch {
    throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL format')
  }
  
  // Validate environment
  if (!['development', 'staging', 'production'].includes(config.app.environment)) {
    throw new Error('NODE_ENV must be development, staging, or production')
  }
  
  // Validate base URL format
  try {
    new URL(config.app.baseUrl)
  } catch {
    throw new Error('Invalid NEXT_PUBLIC_BASE_URL format')
  }
  
  // Validate numeric ranges
  if (config.api.defaultPageSize > config.api.maxPageSize) {
    throw new Error('API_DEFAULT_PAGE_SIZE cannot be greater than API_MAX_PAGE_SIZE')
  }
  
  if (config.api.defaultPageSize < 1 || config.api.maxPageSize < 1) {
    throw new Error('Page sizes must be positive numbers')
  }
  
  console.log('✅ Configuration validation passed')
}

// Helper functions for common configuration checks
export const isDevelopment = () => config.app.environment === 'development'
export const isProduction = () => config.app.environment === 'production'
export const isStaging = () => config.app.environment === 'staging'

// Feature flag helpers
export const canRegister = () => config.features.enableRegistration
export const hasCategories = () => config.features.enableCategories
export const hasRealtime = () => config.features.enableRealtime
export const hasAnalytics = () => config.features.enableAnalytics

// Export individual config sections for convenience
export const supabaseConfig = config.supabase
export const appConfig = config.app
export const featureFlags = config.features
export const apiConfig = config.api
export const securityConfig = config.security

// Run validation on import (only in Node.js environment)
if (typeof window === 'undefined') {
  try {
    validateConfig()
  } catch (error) {
    console.error('❌ Configuration validation failed:', error)
    if (isProduction()) {
      process.exit(1)
    }
  }
}

export default config
