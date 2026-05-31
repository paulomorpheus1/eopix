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

  const body = await request.json()
  const { clientName, clientPhone, clientWhatsapp, value, description, dueDate } = body

  if (!clientName || !value || !dueDate) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
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
  }

  const { data: cobranca, error: insertError } = await supabase.from('cobrancas').insert({
    user_id: user.id,
    client_name: clientName,
    client_phone: clientPhone?.replace(/\D/g, '') || '',
    client_whatsapp: clientWhatsapp?.replace(/\D/g, '') || '',
    value,
    description: description || '',
    due_date: dueDate,
    status: 'pending',
  }).select().single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  if (asaasCustomerId) {
    try {
      const payment = await createPixPayment({
        customer: asaasCustomerId,
        value,
        dueDate,
        description: description || `Cobrança - ${clientName}`,
      })

      if (payment.pixQrCode) {
        await supabase
          .from('cobrancas')
          .update({
            pix_qr_code: payment.pixQrCode.encodedImage,
            pix_copy_paste: payment.pixQrCode.payload,
            asaas_payment_id: payment.id,
          })
          .eq('id', cobranca.id)

        cobranca.pix_qr_code = payment.pixQrCode.encodedImage
        cobranca.pix_copy_paste = payment.pixQrCode.payload
        cobranca.asaas_payment_id = payment.id
      }
    } catch (err) {
      console.error('Failed to create PIX payment:', err)
    }
  }

  return NextResponse.json({ cobranca })
}
