import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  const body = await request.json()
  const event = body.event
  const paymentId = body.payment?.id || body.id
  const paymentStatus = body.payment?.status || body.status

  if (!paymentId || !paymentStatus) {
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
  }

  const statusMap: Record<string, string> = {
    RECEIVED: 'paid',
    CONFIRMED: 'paid',
    OVERDUE: 'overdue',
    CANCELLED: 'cancelled',
    PENDING: 'pending',
  }

  const mappedStatus = statusMap[paymentStatus]
  if (!mappedStatus) {
    return NextResponse.json({ received: true })
  }

  // Update cobranca if this payment matches one
  const updates: any = { status: mappedStatus }
  if (mappedStatus === 'paid') {
    updates.paid_at = new Date().toISOString()
  }

  const { data: cobrancaUpdate } = await supabase
    .from('cobrancas')
    .update(updates)
    .eq('asaas_payment_id', paymentId)
    .select('user_id')

  // If no cobranca matched, check if it's a subscription payment
  if (!cobrancaUpdate || cobrancaUpdate.length === 0) {
    if (mappedStatus === 'paid') {
      const { data: sub } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('asaas_subscription_id', paymentId)
        .eq('status', 'inactive')
        .select('user_id')
        .single()

      if (sub) {
        console.log(`Subscription activated for user ${sub.user_id}`)
      }
    }
  }

  return NextResponse.json({ received: true })
}
