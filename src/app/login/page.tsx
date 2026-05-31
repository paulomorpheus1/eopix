'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone },
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-eopix-700">
            EoPIX
          </Link>
          <p className="mt-1 text-sm text-gray-500">
            {tab === 'login' ? 'Entre na sua conta' : 'Crie sua conta grátis'}
          </p>
        </div>

        <div className="mb-6 flex rounded-lg border border-gray-200 bg-white p-1">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
              tab === 'login' ? 'bg-eopix-600 text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => setTab('signup')}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
              tab === 'signup' ? 'bg-eopix-600 text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Cadastrar
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={tab === 'login' ? handleLogin : handleSignup} className="space-y-4">
          {tab === 'signup' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-eopix-500 focus:outline-none focus:ring-1 focus:ring-eopix-500"
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">WhatsApp</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-eopix-500 focus:outline-none focus:ring-1 focus:ring-eopix-500"
                  placeholder="(31) 99999-9999"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-eopix-500 focus:outline-none focus:ring-1 focus:ring-eopix-500"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Senha</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-eopix-500 focus:outline-none focus:ring-1 focus:ring-eopix-500"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-eopix-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-eopix-700 disabled:opacity-50"
          >
            {loading ? 'Aguarde...' : tab === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        {tab === 'signup' && (
          <p className="mt-4 text-center text-xs text-gray-400">
            Ao criar conta, você aceita os termos de uso.
          </p>
        )}
      </div>
    </div>
  )
}
