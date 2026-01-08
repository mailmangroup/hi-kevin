export type ErrorCode = 'CREDENTIALS_MISSING' | 'PROFILE_FETCH_FAILED' | 'AUTH_REQUIRED' | 'UNKNOWN'

export interface ApiError extends Error {
  code?: string
  redirect?: string
  status?: number
}

export const isApiError = (error: any): error is ApiError => {
  return error instanceof Error && ('status' in error || 'code' in error)
}

export const ERROR_MESSAGES: Record<string, string> = {
  CREDENTIALS_MISSING: 'KAWO credentials are missing. Please configure them in settings.',
  PROFILE_FETCH_FAILED: 'Failed to load user profile. Please try again.',
  AUTH_REQUIRED: 'Authentication required. Please log in.',
}

export const getErrorMessage = (error: any): string => {
  if (isApiError(error) && error.code && ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code]
  }
  return error.message || 'An unexpected error occurred'
}
