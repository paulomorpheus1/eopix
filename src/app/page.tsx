import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💸</span>
            <span className="text-xl font-bold text-eopix-700">EoPIX</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Entrar
            </Link>
            <Link
              href="/login?tab=signup"
              className="rounded-lg bg-eopix-600 px-4 py-2 text-sm font-medium text-white hover:bg-eopix-700"
            >
              Criar conta grátis
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Nunca mais esqueça de cobrar
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Envie lembretes automáticos via WhatsApp com QR Code PIX.
              Seus clientes pagam na hora. Você recebe mais rápido.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link
                href="/login?tab=signup"
                className="rounded-lg bg-eopix-600 px-6 py-3 text-base font-medium text-white hover:bg-eopix-700"
              >
                Começar grátis
              </Link>
              <Link
                href="#como-funciona"
                className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                Como funciona
              </Link>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="border-t border-gray-200 bg-white py-16">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-center text-2xl font-bold text-gray-900">
              Como funciona
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {[
                {
                  step: '1',
                  title: 'Cadastre a cobrança',
                  desc: 'Nome do cliente, valor, data de vencimento e WhatsApp. Leva 30 segundos.',
                },
                {
                  step: '2',
                  title: 'Sistema envia lembrete',
                  desc: 'No dia do vencimento, o cliente recebe um WhatsApp automático com QR Code PIX.',
                },
                {
                  step: '3',
                  title: 'Receba o pagamento',
                  desc: 'Cliente paga via PIX. Você recebe na hora. Status atualiza automaticamente.',
                },
              ].map((item) => (
                <div key={item.step} className="rounded-xl border border-gray-200 p-6 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-eopix-100 text-eopix-700 font-bold text-lg">
                    {item.step}
                  </div>
                  <h3 className="mt-4 font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-2xl font-bold text-gray-900">Preço único</h2>
            <div className="mt-8 rounded-xl border-2 border-eopix-500 bg-white p-8">
              <p className="text-sm text-gray-500">Apenas</p>
              <p className="text-5xl font-bold text-eopix-600">R$ 14,90</p>
              <p className="mt-1 text-sm text-gray-500">por mês</p>
              <p className="mt-4 text-gray-600">Cobranças ilimitadas. Cancele quando quiser.</p>
              <Link
                href="/login?tab=signup"
                className="mt-6 inline-block rounded-lg bg-eopix-600 px-8 py-3 text-base font-medium text-white hover:bg-eopix-700"
              >
                Criar conta grátis
              </Link>
              <p className="mt-2 text-xs text-gray-400">Sem cartão de crédito. Pague via PIX.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="mx-auto max-w-5xl px-4 text-center text-sm text-gray-500">
          <p>EoPIX — E aí, PIX? Feito no Brasil 🇧🇷</p>
        </div>
      </footer>
    </div>
  )
}
