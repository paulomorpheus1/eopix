'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Cobranca } from '@/types'
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from '@/lib/utils'
import Link from 'next/link'

export default function DashboardPage() {
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([])
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, overdue: 0 })

  useEffect(() => {
    loadCobrancas()
  }, [])

  async function loadCobrancas() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('cobrancas')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) {
      setCobrancas(data)
      setStats({
        total: data.length,
        paid: data.filter(c => c.status === 'paid').length,
        pending: data.filter(c => c.status === 'pending').length,
        overdue: data.filter(c => c.status === 'overdue').length,
      })
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
