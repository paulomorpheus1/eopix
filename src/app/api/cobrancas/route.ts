import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createPixPayment } from '@/lib/asaas'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('cobrancas')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ cobrancas: data })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { userId, clientName, clientPhone, clientWhatsapp, value, description, dueDate } = body

  if (!userId || !clientName || !value || !dueDate) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase.from('cobrancas').insert({
    user_id: userId,
    client_name: clientName,
    client_phone: clientPhone,
    client_whatsapp: clientWhatsapp,
    value,
    description,
    due_date: dueDate,
    status: 'pending',
  }).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  try {
    const payment = await createPixPayment({
      customer: body.asaasCustomerId || '',
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
        .eq('id', data.id)
    }
  } catch (err) {
    console.error('Failed to create PIX payment:', err)
  }

  return NextResponse.json({ cobranca: data })
}
