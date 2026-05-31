# EoPIX — E aí, PIX? 💸

Lembretes de cobrança via WhatsApp com QR Code PIX.

## Stack

- **Frontend**: Next.js 14 + Tailwind CSS + TypeScript
- **Backend/Database**: Supabase (Postgres, Auth, RLS)
- **Payments**: Asaas API (PIX)
- **Hosting**: Vercel (gratuito)

## Setup

### 1. Clone e instale

```bash
npm install
```

### 2. Supabase

1. Crie conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá em `SQL Editor` e cole o conteúdo de `supabase/migrations/001_initial.sql`
4. Vá em `Project Settings > API` e copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Asaas (PIX)

1. Crie conta em [asaas.com](https://www.asaas.com)
2. Vá em `Configurações > Chave de API`
3. Gere uma chave → `ASAAS_API_KEY`

### 4. Variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha.

### 5. Rodar

```bash
npm run dev
```

### 6. Deploy na Vercel

1. Push pro GitHub
2. Conecte o repositório na [Vercel](https://vercel.com)
3. Adicione as mesmas env vars
4. Deploy automático ✅

## Monetização

- **R$ 14,90/mês** via PIX recorrente
- Cobranças ilimitadas
- Pagamento via Asaas (PIX Automático)
