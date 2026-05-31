import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { findOrCreateCustomer, createPixPayment } from '@/lib/asaas'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!authHeader) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader)
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const nameParts = (user.user_metadata?.name || user.email || '').split(' ')
  const cpfCnpj = user.user_metadata?.cpfCnpj || ''

  let asaasCustomerId = ''
  try {
    const customer = await findOrCreateCustomer({
      name: nameParts[0] || 'Usuário',
      email: user.email!,
      phone: user.phone || '',
      cpfCnpj,
    })
    asaasCustomerId = customer.id
  } catch (err) {
    console.error('Failed to create Asaas customer:', err)
    return NextResponse.json({ error: 'Erro ao criar cliente de pagamento' }, { status: 500 })
  }

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 1)

  try {
    const payment = await createPixPayment({
      customer: asaasCustomerId,
      value: 14.90,
      dueDate: dueDate.toISOString().split('T')[0],
      description: 'EoPIX - Assinatura Mensal',
    })

    const periodStart = new Date()
    const periodEnd = new Date()
    periodEnd.setDate(periodEnd.getDate() + 30)

    await supabase.from('subscriptions').insert({
      user_id: user.id,
      status: 'inactive',
      asaas_subscription_id: payment.id,
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
    })

    return NextResponse.json({
      pix_qr_code: payment.pixQrCode?.encodedImage,
      pix_copy_paste: payment.pixQrCode?.payload,
      payment_id: payment.id,
      value: 14.90,
    })
  } catch (err) {
    console.error('Failed to create subscription PIX:', err)
    return NextResponse.json({ error: 'Erro ao gerar pagamento' }, { status: 500 })
  }
}
