import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')?.replace('Bearer ', '')
  if (auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const results = { sent: 0, overdue: 0, reminders: 0 }

  // 1. Mark overdue cobrancas (due_date < today, status = 'pending')
  const { data: overdueCobrancas } = await supabase
    .from('cobrancas')
    .update({ status: 'overdue' })
    .eq('status', 'pending')
    .lt('due_date', today)
    .select('id')

  if (overdueCobrancas) results.overdue = overdueCobrancas.length

  // 2. Cobrancas vencidas há mais de 3 dias com status 'sent' -> marca como overdue
  const threeDaysAgo = new Date(now)
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  const { data: staleCobrancas } = await supabase
    .from('cobrancas')
    .update({ status: 'overdue' })
    .eq('status', 'sent')
    .lt('sent_at', threeDaysAgo.toISOString())
    .select('id')

  if (staleCobrancas) results.overdue += staleCobrancas.length

  // 3. Cobrancas com vencimento HOJE e status 'pending' -> enviar WhatsApp
  const { data: todayCobrancas } = await supabase
    .from('cobrancas')
    .select('id, client_name, client_whatsapp, value, description, pix_copy_paste')
    .eq('status', 'pending')
    .eq('due_date', today)

  if (todayCobrancas) {
    for (const cob of todayCobrancas) {
      try {
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

        // If WhatsApp Cloud API is configured, send via API
        if (process.env.WHATSAPP_API_KEY) {
          await sendWhatsAppCloud(cob.client_whatsapp, msg)
        }

        // Update cobranca status to 'sent' + store the WhatsApp link
        await supabase
          .from('cobrancas')
          .update({
            status: 'sent',
            sent_at: now.toISOString(),
          })
          .eq('id', cob.id)

        results.sent++
      } catch (err) {
        console.error(`Failed to process cobranca ${cob.id}:`, err)
      }
    }
  }

  return NextResponse.json({
    processed: true,
    timestamp: now.toISOString(),
    results,
  })
}

async function sendWhatsAppCloud(to: string, message: string) {
  const token = process.env.WHATSAPP_API_KEY
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!token || !phoneNumberId) return

  const formattedNumber = to.replace(/\D/g, '')
  const countryCode = '55'
  const fullNumber = `${countryCode}${formattedNumber.replace(/^55/, '')}`

  await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
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
}
