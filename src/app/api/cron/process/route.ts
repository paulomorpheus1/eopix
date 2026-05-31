import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const hasWhatsAppApi = !!(process.env.WHATSAPP_API_KEY && process.env.WHATSAPP_PHONE_NUMBER_ID)

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')?.replace('Bearer ', '')
  if (auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const results = { auto_sent: 0, overdue_marked: 0, ready_to_send: 0 }

  // 1. Vence cobranças atrasadas (due_date < today, ainda 'pending')
  const { data: overdueCobrancas } = await supabase
    .from('cobrancas')
    .update({ status: 'overdue' })
    .eq('status', 'pending')
    .lt('due_date', today)
    .select('id')

  if (overdueCobrancas) results.overdue_marked = overdueCobrancas.length

  // 2. Vence cobranças 'sent' ignoradas por mais de 3 dias
  const threeDaysAgo = new Date(now)
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  const { data: staleCobrancas } = await supabase
    .from('cobrancas')
    .update({ status: 'overdue' })
    .eq('status', 'sent')
    .lt('sent_at', threeDaysAgo.toISOString())
    .select('id')

  if (staleCobrancas) results.overdue_marked += staleCobrancas.length

  // 3. Cobranças vencendo HOJE com status 'pending'
  const { data: todayCobrancas } = await supabase
    .from('cobrancas')
    .select('id, client_name, client_whatsapp, value, description, pix_copy_paste')
    .eq('status', 'pending')
    .eq('due_date', today)

  if (todayCobrancas) {
    for (const cob of todayCobrancas) {
      const pixKey = cob.pix_copy_paste || ''
      const value = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cob.value)

      let msg = `*EoPIX* 💸 - Lembrete de cobrança\n\n`
      msg += `Olá *${cob.client_name}*! 👋\n\n`
      msg += `Sua cobrança de *${value}* vence *hoje*.\n\n`
      if (pixKey) {
        msg += `💳 *PIX (copia e cola):*\n\`${pixKey}\`\n\n`
      }
      msg += `✅ Após o pagamento, envie o comprovante.\n`
      msg += `Qualquer dúvida, é só responder. 👍`

      const encoded = encodeURIComponent(msg)
      const whatsappUrl = `https://wa.me/${cob.client_whatsapp}?text=${encoded}`

      if (hasWhatsAppApi) {
        try {
          await sendWhatsAppCloud(cob.client_whatsapp, msg)
          await supabase
            .from('cobrancas')
            .update({ status: 'sent', sent_at: now.toISOString() })
            .eq('id', cob.id)
          results.auto_sent++
        } catch (err) {
          console.error(`WhatsApp send failed for ${cob.id}, leaving as pending:`, err)
        }
      } else {
        // Sem API, só prepara o link e deixa como 'pending'
        // O usuário vê na fila de envio e dispara manualmente
        await supabase
          .from('cobrancas')
          .update({ pix_copy_paste: cob.pix_copy_paste || pixKey })
          .eq('id', cob.id)
        results.ready_to_send++
      }
    }
  }

  return NextResponse.json({
    processed: true,
    timestamp: now.toISOString(),
    has_whatsapp_api: hasWhatsAppApi,
    results,
  })
}

async function sendWhatsAppCloud(to: string, message: string) {
  const token = process.env.WHATSAPP_API_KEY
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!token || !phoneNumberId) return

  const formattedNumber = to.replace(/\D/g, '')
  const fullNumber = `55${formattedNumber.replace(/^55/, '')}`

  const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: fullNumber,
      type: 'text',
      text: { body: message },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`WhatsApp API error: ${err}`)
  }
}
