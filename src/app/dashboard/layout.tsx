'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [plan, setPlan] = useState<{ subscribed: boolean; remaining: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)

      const res = await fetch('/api/subscriptions/status', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      if (res.ok) {
        setPlan(await res.json())
      }

      setLoading(false)
    })
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/cobrancas', label: 'Cobranças', icon: '💳' },
    { href: '/cobrancas/nova', label: 'Nova cobrança', icon: '➕' },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-lg font-bold text-eopix-700">
              EoPIX
            </Link>
            {plan && (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                plan.subscribed
                  ? 'bg-eopix-100 text-eopix-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {plan.subscribed ? 'Assinante' : `${plan.remaining}/3 grátis`}
              </span>
            )}
          </div>
          <nav className="hidden items-center gap-6 sm:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition ${
                  pathname === item.href
                    ? 'text-eopix-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {plan && !plan.subscribed && (
              <Link
                href="/dashboard#assinar"
                className="rounded-lg bg-eopix-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-eopix-700"
              >
                Assinar R$14,90
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <nav className="border-b border-gray-200 bg-white sm:hidden">
        <div className="flex justify-around px-2 py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium rounded-md transition ${
                pathname === item.href
                  ? 'bg-eopix-50 text-eopix-700'
                  : 'text-gray-600'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
