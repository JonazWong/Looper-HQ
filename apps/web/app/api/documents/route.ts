import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse 
} from '@/lib/api/response'
import { handleApiError } from '@/lib/api/errors'
import { requireAuth } from '@/lib/api/auth'
import { 
  documentSchema, 
  paginationSchema, 
  documentFilterSchema 
} from '@/lib/validations/schemas'

/**
 * GET /api/documents - List all documents with filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const searchParams = request.nextUrl.searchParams

    // Parse pagination
    const paginationResult = paginationSchema.safeParse({
      page: searchParams.get('page'),
      perPage: searchParams.get('perPage'),
    })

    if (!paginationResult.success) {
      return validationErrorResponse(paginationResult.error.format())
    }

    const { page, perPage } = paginationResult.data

    // Parse filters
    const filterResult = documentFilterSchema.safeParse({
      caseId: searchParams.get('caseId'),
      category: searchParams.get('category'),
      search: searchParams.get('search'),
    })

    if (!filterResult.success) {
      return validationErrorResponse(filterResult.error.format())
    }

    const filters = filterResult.data

    // Build where clause
    const where: any = {}
    
    if (filters.caseId) where.caseId = filters.caseId
    if (filters.category) where.category = filters.category
    
    if (filters.search) {
      where.OR = [
        { fileName: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    // Get total count
    const total = await prisma.document.count({ where })

    // Get documents
    const documents = await prisma.document.findMany({
      where,
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
      skip: (page - 1) * perPage,
      take: perPage,
    })

    return successResponse(documents, {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    })
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}

/**
 * POST /api/documents - Upload a new document
 * Note: This accepts file metadata. Actual file upload to S3/storage
 * should be handled separately via a file upload endpoint or client-side upload.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    // Validate input
    const validationResult = documentSchema.safeParse(body)

    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error.format())
    }

    const data = validationResult.data

    // Create document record
    const document = await prisma.document.create({
      data: {
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileType: data.fileType,
        fileUrl: data.fileUrl,
        category: data.category,
        description: data.description,
        isConfidential: data.isConfidential,
        caseId: data.caseId,
        uploadedById: session.user.id,
      },
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Log activity if associated with a case
    if (data.caseId) {
      await prisma.activity.create({
        data: {
          userId: session.user.id,
          caseId: data.caseId,
          type: 'DOCUMENT_UPLOADED',
          action: 'uploaded',
          description: `Uploaded document: ${data.fileName}`,
        },
      })
    }

    return successResponse(document)
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}
