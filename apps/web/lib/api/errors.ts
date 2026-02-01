/**
 * Custom API Error classes
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource', details?: any) {
    super(`${resource} not found`, 404, 'NOT_FOUND', details)
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends ApiError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized', details?: any) {
    super(message, 401, 'UNAUTHORIZED', details)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden', details?: any) {
    super(message, 403, 'FORBIDDEN', details)
    this.name = 'ForbiddenError'
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad request', details?: any) {
    super(message, 400, 'BAD_REQUEST', details)
    this.name = 'BadRequestError'
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Resource already exists', details?: any) {
    super(message, 409, 'CONFLICT', details)
    this.name = 'ConflictError'
  }
}

/**
 * Handle errors in API routes
 */
export function handleApiError(error: unknown): {
  message: string
  statusCode: number
  code?: string
  details?: any
} {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      details: error.details,
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      statusCode: 500,
      code: 'INTERNAL_ERROR',
    }
  }

  return {
    message: 'An unexpected error occurred',
    statusCode: 500,
    code: 'UNKNOWN_ERROR',
  }
}
