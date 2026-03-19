import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, notFoundResponse, errorResponse } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const publicCase = await prisma.publicCase.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            citingCases: true,
            citedByCases: true,
          },
        },
      },
    })

    if (!publicCase) {
      return notFoundResponse('Public case not found')
    }

    return successResponse(publicCase)
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}
