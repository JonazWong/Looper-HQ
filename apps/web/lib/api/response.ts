import { NextResponse } from 'next/server'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    details?: any
  }
  meta?: {
    page?: number
    perPage?: number
    total?: number
    totalPages?: number
  }
}

/**
 * Create a successful API response
 */
export function successResponse<T>(
  data: T,
  meta?: ApiResponse['meta']
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    ...(meta && { meta }),
  })
}

/**
 * Create an error API response
 */
export function errorResponse(
  message: string,
  status: number = 500,
  code?: string,
  details?: any
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        ...(code && { code }),
        ...(details && { details }),
      },
    },
    { status }
  )
}

/**
 * Create a not found response
 */
export function notFoundResponse(resource: string = 'Resource'): NextResponse<ApiResponse> {
  return errorResponse(`${resource} not found`, 404, 'NOT_FOUND')
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(
  errors: any
): NextResponse<ApiResponse> {
  return errorResponse('Validation failed', 400, 'VALIDATION_ERROR', errors)
}

/**
 * Create an unauthorized response
 */
export function unauthorizedResponse(
  message: string = 'Unauthorized'
): NextResponse<ApiResponse> {
  return errorResponse(message, 401, 'UNAUTHORIZED')
}

/**
 * Create a forbidden response
 */
export function forbiddenResponse(
  message: string = 'Forbidden'
): NextResponse<ApiResponse> {
  return errorResponse(message, 403, 'FORBIDDEN')
}
