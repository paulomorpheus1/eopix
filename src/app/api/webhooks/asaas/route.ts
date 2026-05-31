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

  const updates: any = { status: mappedStatus }
  if (mappedStatus === 'paid') {
    updates.paid_at = new Date().toISOString()
  }

  await supabase
    .from('cobrancas')
    .update(updates)
    .eq('asaas_payment_id', paymentId)

  return NextResponse.json({ received: true })
}
