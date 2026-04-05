/**
 * POST /api/admin/payments/create-intent
 * Admin only — manually create a Payment Intent for a specific user.
 * Used for VIP/enterprise deals negotiated by the sales team.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/api/auth'
import { handleApiError } from '@/lib/api/errors'
import { z } from 'zod'

const adminCreateIntentSchema = z.object({
  userId: z.string().min(1),
  tier: z.enum(['STANDARD', 'PREMIUM', 'PREMIER']),
  amount: z.number().positive(),
  currency: z.string().default('HKD'),
  description: z.string().optional(),
})

async function getAirwallexToken(): Promise<string> {
  const clientId = process.env.AIRWALLEX_CLIENT_ID
  const apiKey = process.env.AIRWALLEX_API_KEY
  const env = process.env.AIRWALLEX_ENV ?? 'demo'
  const baseUrl = env === 'prod'
    ? 'https://api.airwallex.com'
    : 'https://api-demo.airwallex.com'

  const res = await fetch(`${baseUrl}/api/v1/authentication/login`, {
    method: 'POST',
    headers: {
      'x-client-id': clientId ?? '',
      'x-api-key': apiKey ?? '',
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) throw new Error(`Airwallex auth failed: ${await res.text()}`)
  const data = await res.json()
  return data.token as string
}

export async function POST(request: NextRequest) {
  try {
    await requireRole('ADMIN')

    const clientId = process.env.AIRWALLEX_CLIENT_ID
    const apiKey = process.env.AIRWALLEX_API_KEY
    if (!clientId || clientId === 'your-airwallex-client-id' || !apiKey || apiKey === 'your-airwallex-api-key') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Airwallex 尚未設定。請配置 AIRWALLEX_CLIENT_ID、AIRWALLEX_API_KEY 後再試。',
          },
        },
        { status: 503 }
      )
    }

    const body = await request.json()
    const parsed = adminCreateIntentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request', details: parsed.error.format() } },
        { status: 400 }
      )
    }

    const { userId, tier, amount, currency, description } = parsed.data

    // Verify the target user exists
    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: { message: 'User not found' } },
        { status: 404 }
      )
    }

    const orderId = `order_${tier.toLowerCase()}_admin_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
    const env = process.env.AIRWALLEX_ENV ?? 'demo'
    const baseUrl = env === 'prod'
      ? 'https://api.airwallex.com'
      : 'https://api-demo.airwallex.com'

    const token = await getAirwallexToken()

    const res = await fetch(`${baseUrl}/api/v1/pa/payment_intents/create`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        merchant_order_id: orderId,
        descriptor: description ?? `Looper HQ ${tier} Membership (Admin)`,
        customer_id: userId,
      }),
    })

    if (!res.ok) {
      throw new Error(`Airwallex create intent failed: ${await res.text()}`)
    }

    const intent = await res.json() as { id: string; client_secret: string }

    const planRecord = await prisma.membershipPlan.findUnique({ where: { tier } })

    const payment = await prisma.payment.create({
      data: {
        userId,
        planId: planRecord?.id ?? null,
        intentId: intent.id,
        orderId,
        amount,
        currency,
        targetTier: tier,
        status: 'PENDING',
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        intentId: intent.id,
        clientSecret: intent.client_secret,
        orderId,
        amount,
        currency,
        targetUser: { id: targetUser.id, email: targetUser.email, name: targetUser.name },
      },
    })
  } catch (error) {
    const { message, statusCode } = handleApiError(error)
    return NextResponse.json(
      { success: false, error: { message } },
      { status: statusCode }
    )
  }
}
