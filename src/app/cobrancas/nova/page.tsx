'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function NovaCobrancaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    client_name: '',
    client_phone: '',
    client_whatsapp: '',
    value: '',
    description: '',
    due_date: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError('Usuário não autenticado')
      setLoading(false)
      return
    }

    const value = parseFloat(form.value.replace(',', '.'))
    if (isNaN(value) || value <= 0) {
      setError('Valor inválido')
      setLoading(false)
      return
    }

    const res = await fetch('/api/cobrancas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        clientName: form.client_name,
        clientPhone: form.client_phone,
        clientWhatsapp: form.client_whatsapp,
        value,
        description: form.description,
        dueDate: form.due_date,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      if (data.code === 'subscription_required') {
        setError('Limite grátis de 3 cobranças atingido. Assine por R$14,90/mês para cobranças ilimitadas.')
        setLoading(false)
        return
      }
      setError(data.error || 'Erro ao criar cobrança')
      setLoading(false)
      return
    }

    router.push('/cobrancas')
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Nova cobrança</h1>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nome do cliente</label>
          <input
            type="text"
            name="client_name"
            required
            value={form.client_name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-eopix-500 focus:outline-none focus:ring-1 focus:ring-eopix-500"
            placeholder="João Silva"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Telefone do cliente</label>
          <input
            type="tel"
            name="client_phone"
            required
            value={form.client_phone}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-eopix-500 focus:outline-none focus:ring-1 focus:ring-eopix-500"
            placeholder="(31) 99999-9999"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">WhatsApp do cliente</label>
          <input
            type="tel"
            name="client_whatsapp"
            required
            value={form.client_whatsapp}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-eopix-500 focus:outline-none focus:ring-1 focus:ring-eopix-500"
            placeholder="(31) 99999-9999"
          />
          <p className="mt-1 text-xs text-gray-400">Número com DDD, igual ao WhatsApp</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Valor (R$)</label>
          <input
            type="text"
            name="value"
            required
            value={form.value}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-eopix-500 focus:outline-none focus:ring-1 focus:ring-eopix-500"
            placeholder="49,90"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Descrição</label>
          <input
            type="text"
            name="description"
            value={form.description}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-eopix-500 focus:outline-none focus:ring-1 focus:ring-eopix-500"
            placeholder="Serviço de design - Maio 2026"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Data de vencimento</label>
          <input
            type="date"
            name="due_date"
            required
            min={today}
            value={form.due_date}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-eopix-500 focus:outline-none focus:ring-1 focus:ring-eopix-500"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-eopix-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-eopix-700 disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'Criar cobrança'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
