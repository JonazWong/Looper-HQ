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
  invoiceSchema, 
  paginationSchema, 
  invoiceFilterSchema 
} from '@/lib/validations/schemas'

/**
 * GET /api/invoices - List all invoices with filters
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
    const filterResult = invoiceFilterSchema.safeParse({
      status: searchParams.get('status'),
      caseId: searchParams.get('caseId'),
    })

    if (!filterResult.success) {
      return validationErrorResponse(filterResult.error.format())
    }

    const filters = filterResult.data

    // Build where clause
    const where: any = {}
    
    if (filters.status) where.status = filters.status
    if (filters.caseId) where.caseId = filters.caseId

    // Get total count
    const total = await prisma.invoice.count({ where })

    // Get invoices
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title_zh: true,
            title_en: true,
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * perPage,
      take: perPage,
    })

    return successResponse(invoices, {
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
 * POST /api/invoices - Create a new invoice
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    // Validate input
    const validationResult = invoiceSchema.safeParse(body)

    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error.format())
    }

    const data = validationResult.data

    // Generate invoice number (format: INV-YYYYMMDD-NNN)
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    
    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: {
          startsWith: `INV-${dateStr}-`,
        },
      },
      orderBy: {
        invoiceNumber: 'desc',
      },
    })

    let invoiceNumber = `INV-${dateStr}-001`
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2])
      invoiceNumber = `INV-${dateStr}-${String(lastNumber + 1).padStart(3, '0')}`
    }

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        caseId: data.caseId,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
        dueDate: new Date(data.dueDate),
        paidDate: data.paidDate ? new Date(data.paidDate) : null,
      },
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title_zh: true,
            title_en: true,
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        caseId: data.caseId,
        type: 'PAYMENT_RECEIVED',
        action: 'created',
        description: `Created invoice: ${invoiceNumber}`,
      },
    })

    return successResponse(invoice)
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}
