/**
 * POST /api/payments/webhook
 * Airwallex Webhook endpoint — NO authentication required.
 * Verifies HMAC-SHA256 signature, then processes payment events.
 *
 * Events handled:
 *  - payment_intent.succeeded → upgrade membership, record payment as SUCCEEDED
 *  - payment_intent.cancelled → mark CANCELLED
 *  - payment_attempt.failed → mark FAILED (Airwallex actual event name)
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) return false
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex')
  // Airwallex sends signature as hex; some versions prefix with "sha256="
  const normalized = signature.replace(/^sha256=/, '')
  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(normalized, 'hex')
  )
}

// Map MembershipTier to Membership benefits
const TIER_BENEFITS: Record<string, { searchLimit: number; caseLimit: number | null }> = {
  BASIC:    { searchLimit: 5,   caseLimit: null },
  STANDARD: { searchLimit: 100, caseLimit: null },
  PREMIUM:  { searchLimit: -1,  caseLimit: null },
  PREMIER:  { searchLimit: -1,  caseLimit: null },
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-airwallex-signature')
  const webhookSecret = process.env.AIRWALLEX_WEBHOOK_SECRET ?? ''

  // Verify signature in production; skip in demo/test when secret not configured
  if (webhookSecret && !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
    console.warn('[webhook] Invalid Airwallex signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: Record<string, unknown>
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventType = event.name as string
  const eventData = event.data as Record<string, unknown>

  console.log(`[webhook] Received event: ${eventType}`)

  try {
    switch (eventType) {
      case 'payment_intent.succeeded': {
        const intentId = eventData.id as string
        if (!intentId) break

        // Find the pending payment record
        const payment = await prisma.payment.findUnique({
          where: { intentId },
          include: { user: true },
        })

        if (!payment) {
          console.warn(`[webhook] Payment not found for intentId: ${intentId}`)
          break
        }

        if (payment.status === 'SUCCEEDED') {
          // Idempotent — already processed
          break
        }

        const targetTier = payment.targetTier
        const benefits = TIER_BENEFITS[targetTier] ?? { searchLimit: 10, caseLimit: null }

        // Calculate membership end date (30 days from now for monthly plans)
        const endDate = new Date()
        endDate.setDate(endDate.getDate() + 30)

        await prisma.$transaction([
          // Mark old active memberships as inactive
          prisma.membership.updateMany({
            where: { userId: payment.userId, isActive: true },
            data: { isActive: false, endDate: new Date() },
          }),
          // Create new active membership
          prisma.membership.create({
            data: {
              userId: payment.userId,
              tier: targetTier,
              startDate: new Date(),
              endDate,
              isActive: true,
              searchLimit: benefits.searchLimit,
              caseLimit: benefits.caseLimit,
            },
          }),
          // Update user's denormalized membership tier
          prisma.user.update({
            where: { id: payment.userId },
            data: { membershipTier: targetTier },
          }),
          // Mark payment as succeeded and store raw event
          prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'SUCCEEDED', rawEvent: event as object },
          }),
        ])

        console.log(`[webhook] ✅ Upgraded user ${payment.userId} to ${targetTier}`)
        break
      }

      case 'payment_intent.cancelled': {
        const intentId = eventData.id as string
        if (!intentId) break

        await prisma.payment.updateMany({
          where: { intentId, status: 'PENDING' },
          data: { status: 'CANCELLED', rawEvent: event as object },
        })

        console.log(`[webhook] ⚠️ Payment ${intentId} → CANCELLED`)
        break
      }

      // Airwallex actual failure event: payment_attempt.failed
      // (Dashboard only shows this option, not payment_intent.payment_failed)
      case 'payment_attempt.failed': {
        // payment_attempt payload: { payment_intent_id: string, ... }
        const intentId = (eventData.payment_intent_id ?? eventData.id) as string
        if (!intentId) break

        await prisma.payment.updateMany({
          where: { intentId, status: 'PENDING' },
          data: { status: 'FAILED', rawEvent: event as object },
        })

        console.log(`[webhook] ❌ Payment ${intentId} → FAILED`)
        break
      }

      default:
        console.log(`[webhook] Unhandled event type: ${eventType}`)
    }
  } catch (error) {
    console.error('[webhook] Processing error:', error)
    // Return 200 to prevent Airwallex from retrying on our internal errors
    return NextResponse.json({ received: true, warning: 'Processing error logged' })
  }

  return NextResponse.json({ received: true })
}
