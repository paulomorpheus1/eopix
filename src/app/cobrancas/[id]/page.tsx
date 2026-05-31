'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { Cobranca } from '@/types'
import { formatCurrency, formatDate, getStatusLabel, getStatusColor, formatPhone } from '@/lib/utils'

export default function CobrancaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [cobranca, setCobranca] = useState<Cobranca | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCobranca()
  }, [])

  async function loadCobranca() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('cobrancas')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (data) setCobranca(data)
    setLoading(false)
  }

  async function handleSend() {
    if (!cobranca) return

    const value = formatCurrency(cobranca.value)
    const pixKey = cobranca.pix_copy_paste || ''
    const date = formatDate(cobranca.due_date)

    let msg = `*EoPIX* 💸 - Lembrete de cobrança\n\n`
    msg += `Olá *${cobranca.client_name}*! 👋\n\n`
    msg += `Valor: *${value}*\n`
    msg += `Vencimento: *${date}*\n`
    msg += `Descrição: ${cobranca.description}\n\n`

    if (pixKey) {
      msg += `💳 *PIX (copia e cola):*\n\`${pixKey}\`\n\n`
      msg += `Ou use o QR Code na próxima mensagem.\n\n`
    } else {
      msg += `💳 *PIX:* disponível no app EoPIX\n\n`
    }

    msg += `Após o pagamento, envie o comprovante por aqui. ✅\n`
    msg += `Qualquer dúvida, é só responder. 👍`

    const encoded = encodeURIComponent(msg)
    window.open(`https://wa.me/${cobranca.client_whatsapp}?text=${encoded}`, '_blank')

    await supabase
      .from('cobrancas')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', cobranca.id)

    loadCobranca()
  }

  async function handleMarkPaid() {
    if (!cobranca) return
    await supabase
      .from('cobrancas')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', cobranca.id)
    loadCobranca()
  }

  async function handleCancel() {
    if (!cobranca) return
    await supabase
      .from('cobrancas')
      .update({ status: 'cancelled' })
      .eq('id', cobranca.id)
    loadCobranca()
  }

  if (loading) return <p className="text-gray-500">Carregando...</p>
  if (!cobranca) return <p className="text-gray-500">Cobrança não encontrada</p>

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="mb-4 text-sm text-gray-500 hover:text-gray-700"
      >
        ← Voltar
      </button>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{cobranca.client_name}</h1>
            <p className="mt-1 text-gray-500">{cobranca.description}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(cobranca.status)}`}>
            {getStatusLabel(cobranca.status)}
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">Valor</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(cobranca.value)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Vencimento</p>
            <p className="text-lg font-medium text-gray-900">{formatDate(cobranca.due_date)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Telefone</p>
            <p className="text-lg font-medium text-gray-900">{formatPhone(cobranca.client_phone)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">WhatsApp</p>
            <p className="text-lg font-medium text-gray-900">{formatPhone(cobranca.client_whatsapp)}</p>
          </div>
        </div>

        {cobranca.pix_qr_code || cobranca.pix_copy_paste ? (
          <div className="mt-6 rounded-xl border-2 border-eopix-100 bg-eopix-50 p-6">
            <p className="mb-4 text-center text-sm font-semibold text-eopix-800">
              💳 Pagamento via PIX
            </p>
            {cobranca.pix_qr_code && (
              <div className="text-center">
                <img
                  src={cobranca.pix_qr_code}
                  alt="PIX QR Code"
                  className="mx-auto h-48 w-48 rounded-lg border-2 border-white bg-white shadow-sm"
                />
              </div>
            )}
            {cobranca.pix_copy_paste && (
              <div className="mt-4 text-center">
                <p className="mb-2 text-xs text-eopix-700">Ou copie a chave PIX:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={cobranca.pix_copy_paste}
                    className="flex-1 rounded-lg border border-eopix-200 bg-white px-3 py-2 text-xs font-mono text-gray-700"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(cobranca.pix_copy_paste!)}
                    className="rounded-lg bg-eopix-600 px-4 py-2 text-sm font-medium text-white hover:bg-eopix-700"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border-2 border-dashed border-yellow-300 bg-yellow-50 p-6">
            <p className="text-center text-sm font-medium text-yellow-800">
              ⚠️ PIX ainda não gerado
            </p>
            <p className="mt-1 text-center text-xs text-yellow-600">
              Clique em "Enviar WhatsApp" para gerar o PIX automaticamente.
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {(cobranca.status === 'pending') && (
            <>
              <button
                onClick={handleSend}
                className="rounded-lg bg-eopix-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-eopix-700"
              >
                Enviar WhatsApp agora
              </button>
              <div className="relative group">
                <button className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  ...
                </button>
                <div className="absolute right-0 top-full z-10 mt-1 hidden min-w-[180px] rounded-lg border border-gray-200 bg-white shadow-lg group-hover:block">
                  <button
                    onClick={handleMarkPaid}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-green-700 hover:bg-green-50"
                  >
                    ✓ Marcar como paga
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    ✕ Cancelar cobrança
                  </button>
                </div>
              </div>
            </>
          )}
          {cobranca.status === 'sent' && (
            <>
              <button
                onClick={handleSend}
                className="rounded-lg border border-eopix-300 bg-eopix-50 px-6 py-2.5 text-sm font-medium text-eopix-700 hover:bg-eopix-100"
              >
                Reenviar WhatsApp
              </button>
              <button
                onClick={handleMarkPaid}
                className="rounded-lg border border-green-300 bg-green-50 px-6 py-2.5 text-sm font-medium text-green-700 hover:bg-green-100"
              >
                Marcar como paga
              </button>
              <button
                onClick={handleCancel}
                className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
