import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { 
  successResponse, 
  errorResponse,
  validationErrorResponse 
} from '@/lib/api/response'
import { handleApiError, NotFoundError } from '@/lib/api/errors'
import { requireAuth } from '@/lib/api/auth'
import { updateInvoiceSchema } from '@/lib/validations/schemas'

/**
 * GET /api/invoices/[id] - Get invoice details with case info
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        case: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            lawyer: {
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

    if (!invoice) {
      throw new NotFoundError('Invoice')
    }

    return successResponse(invoice)
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}

/**
 * PATCH /api/invoices/[id] - Update invoice (amount, status, dates)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    // Validate input
    const validationResult = updateInvoiceSchema.safeParse(body)

    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error.format())
    }

    const data = validationResult.data

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: params.id },
    })

    if (!existingInvoice) {
      throw new NotFoundError('Invoice')
    }

    // Prepare update data
    const updateData: any = {}
    if (data.amount !== undefined) updateData.amount = data.amount
    if (data.status !== undefined) updateData.status = data.status
    if (data.issueDate !== undefined) updateData.issueDate = new Date(data.issueDate)
    if (data.dueDate !== undefined) updateData.dueDate = new Date(data.dueDate)
    if (data.paidDate !== undefined) updateData.paidDate = new Date(data.paidDate)

    // Update invoice
    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData,
      include: {
        case: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            lawyer: {
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
        caseId: existingInvoice.caseId,
        type: 'PAYMENT_RECEIVED',
        action: 'updated',
        description: `Updated invoice: ${existingInvoice.invoiceNumber}`,
      },
    })

    return successResponse(invoice)
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}

/**
 * DELETE /api/invoices/[id] - Delete an invoice
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()

    // Check if invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
    })

    if (!invoice) {
      throw new NotFoundError('Invoice')
    }

    // Delete invoice
    await prisma.invoice.delete({
      where: { id: params.id },
    })

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        caseId: invoice.caseId,
        type: 'PAYMENT_RECEIVED',
        action: 'deleted',
        description: `Deleted invoice: ${invoice.invoiceNumber}`,
      },
    })

    return successResponse({ message: 'Invoice deleted successfully' })
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}
