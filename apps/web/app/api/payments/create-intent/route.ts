/**
 * POST /api/payments/create-intent
 * Authenticated endpoint — creates an Airwallex Payment Intent for a given plan tier.
 * Returns { intentId, clientSecret } for the frontend Drop-in element.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/api/auth'
import { handleApiError } from '@/lib/api/errors'
import { z } from 'zod'

const createIntentSchema = z.object({
  // For standard plans — resolve amount from DB
  planTier: z.enum(['STANDARD', 'PREMIUM', 'PREMIER']).optional(),
  // For admin-created custom intents (override amount)
  amount: z.number().positive().optional(),
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

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Airwallex auth failed: ${err}`)
  }

  const data = await res.json()
  return data.token as string
}

async function createAirwallexPaymentIntent(opts: {
  amount: number
  currency: string
  orderId: string
  description: string
  customerId?: string
}): Promise<{ id: string; client_secret: string }> {
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
      amount: opts.amount,
      currency: opts.currency,
      merchant_order_id: opts.orderId,
      descriptor: opts.description,
      customer_id: opts.customerId,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Airwallex create intent failed: ${err}`)
  }

  return res.json()
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const parsed = createIntentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request', details: parsed.error.format() } },
        { status: 400 }
      )
    }

    // Guard: Airwallex credentials must be configured
    const clientId = process.env.AIRWALLEX_CLIENT_ID
    const apiKey   = process.env.AIRWALLEX_API_KEY
    if (!clientId || clientId === 'your-airwallex-client-id' || !apiKey || apiKey === 'your-airwallex-api-key') {
      return NextResponse.json(
        { success: false, error: { message: 'Airwallex 尚未設定。請聯絡管理員配置付款憑證後再試。' } },
        { status: 503 }
      )
    }

    const { planTier, currency } = parsed.data
    let { amount } = parsed.data

    // Resolve amount from plan if not explicitly provided
    if (!amount && planTier) {
      const plan = await prisma.membershipPlan.findUnique({
        where: { tier: planTier },
      })
      if (!plan || plan.amount === null) {
        return NextResponse.json(
          { success: false, error: { message: 'This plan requires manual quote. Please contact us.' } },
          { status: 400 }
        )
      }
      amount = Number(plan.amount)
    }

    if (!amount) {
      return NextResponse.json(
        { success: false, error: { message: 'Amount is required' } },
        { status: 400 }
      )
    }

    const orderId = `order_${planTier?.toLowerCase() ?? 'custom'}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
    const targetTier = planTier ?? 'PREMIER'

    // Fetch the plan record for the relation
    const planRecord = planTier
      ? await prisma.membershipPlan.findUnique({ where: { tier: planTier } })
      : null

    // Create Airwallex Payment Intent
    const intent = await createAirwallexPaymentIntent({
      amount,
      currency: currency ?? 'HKD',
      orderId,
      description: `Looper HQ ${planTier ?? 'Custom'} Membership`,
      customerId: session.user?.id,
    })

    // Record the pending payment in DB
    await prisma.payment.create({
      data: {
        userId: session.user!.id,
        planId: planRecord?.id ?? null,
        intentId: intent.id,
        orderId,
        amount,
        currency: currency ?? 'HKD',
        targetTier,
        status: 'PENDING',
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        intentId: intent.id,
        clientSecret: intent.client_secret,
        orderId,
        amount,
        currency: currency ?? 'HKD',
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
