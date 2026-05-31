'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Cobranca } from '@/types'
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from '@/lib/utils'
import Link from 'next/link'

export default function DashboardPage() {
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([])
  const [plan, setPlan] = useState<any>(null)
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, overdue: 0 })
  const [showCheckout, setShowCheckout] = useState(false)
  const [pixData, setPixData] = useState<any>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const [cobrancasRes, planRes] = await Promise.all([
      supabase
        .from('cobrancas')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(10),
      fetch('/api/subscriptions/status', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      }),
    ])

    if (cobrancasRes.data) {
      setCobrancas(cobrancasRes.data)
      setStats({
        total: cobrancasRes.data.length,
        paid: cobrancasRes.data.filter(c => c.status === 'paid').length,
        pending: cobrancasRes.data.filter(c => ['pending', 'sent'].includes(c.status)).length,
        overdue: cobrancasRes.data.filter(c => c.status === 'overdue').length,
      })
    }

    if (planRes.ok) {
      setPlan(await planRes.json())
    }
  }

  async function handleCheckout() {
    setCheckoutLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const res = await fetch('/api/subscriptions/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    })

    const data = await res.json()
    setCheckoutLoading(false)

    if (res.ok) {
      setPixData(data)
      setShowCheckout(true)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-900' },
          { label: 'Pagas', value: stats.paid, color: 'text-green-600' },
          { label: 'Pendentes', value: stats.pending, color: 'text-yellow-600' },
          { label: 'Vencidas', value: stats.overdue, color: 'text-red-600' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">{item.label}</p>
            <p className={`mt-1 text-2xl font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Plan status */}
      <div id="assinar" className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {plan?.subscribed ? ' Plano Assinante' : ' Plano Grátis'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {plan?.subscribed
                ? `Válido até ${formatDate(plan.period_end)}. Cobranças ilimitadas.`
                : `${plan?.remaining || 3} cobranças restantes de 3 grátis.`}
            </p>
          </div>
          {!plan?.subscribed && (
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="rounded-lg bg-eopix-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-eopix-700 disabled:opacity-50"
            >
              {checkoutLoading ? 'Gerando PIX...' : 'Assinar R$14,90/mês'}
            </button>
          )}
        </div>
      </div>

      {/* PIX Checkout Modal */}
      {showCheckout && pixData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-xl">
            <p className="text-lg font-bold text-gray-900">EoPIX - Assinatura</p>
            <p className="mt-1 text-sm text-gray-500">R$ 14,90 / mês</p>

            {pixData.pix_qr_code && (
              <img
                src={pixData.pix_qr_code}
                alt="PIX QR Code"
                className="mx-auto mt-4 h-52 w-52 rounded-lg border-2 border-gray-200"
              />
            )}

            {pixData.pix_copy_paste && (
              <div className="mt-4">
                <p className="mb-2 text-xs text-gray-500">Ou copie a chave PIX:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={pixData.pix_copy_paste}
                    className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-mono"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(pixData.pix_copy_paste)}
                    className="rounded-lg bg-eopix-600 px-4 py-2 text-sm font-medium text-white hover:bg-eopix-700"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            )}

            <p className="mt-4 text-xs text-gray-400">
              Após o pagamento, o plano é ativado automaticamente em até 1 minuto.
            </p>

            <button
              onClick={() => { setShowCheckout(false); loadData() }}
              className="mt-4 text-sm text-gray-500 hover:text-gray-700"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Recent cobrancas */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Últimas cobranças</h2>
          <Link
            href="/cobrancas/nova"
            className="rounded-lg bg-eopix-600 px-4 py-2 text-sm font-medium text-white hover:bg-eopix-700"
          >
            Nova cobrança
          </Link>
        </div>

        {cobrancas.length === 0 ? (
          <div className="mt-4 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-500">Nenhuma cobrança ainda</p>
            <Link
              href="/cobrancas/nova"
              className="mt-2 inline-block text-sm font-medium text-eopix-600 hover:text-eopix-700"
            >
              Criar primeira cobrança
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {cobrancas.map((c) => (
              <Link
                key={c.id}
                href={`/cobrancas/${c.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-4 transition hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{c.client_name}</p>
                    <p className="mt-0.5 text-sm text-gray-500">{c.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(c.value)}</p>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(c.status)}`}>
                      {getStatusLabel(c.status)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  Vence: {formatDate(c.due_date)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
