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

    const msg = encodeURIComponent(
      `Olá ${cobranca.client_name}! 👋\n\n` +
      `Lembrando da sua cobrança de *${formatCurrency(cobranca.value)}* referente a "${cobranca.description}".\n\n` +
      `📱 PIX: ${cobranca.pix_copy_paste || 'Chave disponível no app'}\n\n` +
      `Qualquer dúvida, estou à disposição. 👍`
    )

    window.open(`https://wa.me/${cobranca.client_whatsapp}?text=${msg}`, '_blank')

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

        {cobranca.pix_qr_code && (
          <div className="mt-6 text-center">
            <p className="mb-2 text-sm font-medium text-gray-700">QR Code PIX</p>
            <img
              src={cobranca.pix_qr_code}
              alt="PIX QR Code"
              className="mx-auto h-48 w-48 rounded-lg border border-gray-200"
            />
            {cobranca.pix_copy_paste && (
              <button
                onClick={() => navigator.clipboard.writeText(cobranca.pix_copy_paste!)}
                className="mt-2 text-sm text-eopix-600 hover:text-eopix-700"
              >
                Copiar chave PIX
              </button>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {(cobranca.status === 'pending') && (
            <>
              <button
                onClick={handleSend}
                className="rounded-lg bg-eopix-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-eopix-700"
              >
                Enviar WhatsApp agora
              </button>
              <button
                onClick={handleMarkPaid}
                className="rounded-lg border border-green-300 bg-green-50 px-6 py-2.5 text-sm font-medium text-green-700 hover:bg-green-100"
              >
                Marcar como paga
              </button>
            </>
          )}
          {['pending', 'sent'].includes(cobranca.status) && (
            <button
              onClick={handleCancel}
              className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar cobrança
            </button>
          )}
          {cobranca.status === 'sent' && (
            <button
              onClick={handleSend}
              className="rounded-lg border border-eopix-300 bg-eopix-50 px-6 py-2.5 text-sm font-medium text-eopix-700 hover:bg-eopix-100"
            >
              Reenviar WhatsApp
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
