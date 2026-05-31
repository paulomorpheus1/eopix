'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Cobranca } from '@/types'
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from '@/lib/utils'
import Link from 'next/link'

export default function CobrancasPage() {
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([])
  const [filter, setFilter] = useState<string>('all')

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

    if (data) setCobrancas(data)
  }

  const filtered = filter === 'all'
    ? cobrancas
    : cobrancas.filter(c => c.status === filter)

  const tabs = [
    { key: 'all', label: 'Todas' },
    { key: 'pending', label: 'Pendentes' },
    { key: 'sent', label: 'Enviadas' },
    { key: 'paid', label: 'Pagas' },
    { key: 'overdue', label: 'Vencidas' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Cobranças</h1>
        <Link
          href="/cobrancas/nova"
          className="rounded-lg bg-eopix-600 px-4 py-2 text-sm font-medium text-white hover:bg-eopix-700"
        >
          Nova cobrança
        </Link>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === t.key
                ? 'bg-eopix-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">Nenhuma cobrança encontrada</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {filtered.map((c) => (
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
  )
}
