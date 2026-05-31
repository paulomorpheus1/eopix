const ASAAS_API_URL = process.env.ASAAS_ENVIRONMENT === 'production'
  ? 'https://api.asaas.com/v3'
  : 'https://sandbox.asaas.com/api/v3'

const ASAAS_API_KEY = process.env.ASAAS_API_KEY || ''

interface AsaasCustomer {
  id: string
  name: string
  email: string
  phone: string
  cpfCnpj: string
}

interface AsaasPayment {
  id: string
  customer: string
  value: number
  netValue: number
  description: string
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD'
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'CANCELLED'
  dueDate: string
  invoiceUrl: string
  pixQrCode?: {
    encodedImage: string
    payload: string
  }
}

async function asaasFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${ASAAS_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAAS_API_KEY,
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Asaas API error: ${res.status} - ${error}`)
  }

  return res.json()
}

export async function createCustomer(data: {
  name: string
  email: string
  phone: string
  cpfCnpj: string
}): Promise<AsaasCustomer> {
  return asaasFetch('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function findCustomerByEmail(email: string): Promise<AsaasCustomer | null> {
  const result = await asaasFetch<{ data: AsaasCustomer[] }>(`/customers?email=${encodeURIComponent(email)}`)
  return result.data?.[0] || null
}

export async function findOrCreateCustomer(data: {
  name: string
  email: string
  phone: string
  cpfCnpj: string
}): Promise<AsaasCustomer> {
  const existing = await findCustomerByEmail(data.email)
  if (existing) return existing
  return createCustomer(data)
}

export async function createPixPayment(data: {
  customer: string
  value: number
  dueDate: string
  description: string
}): Promise<AsaasPayment> {
  const payment = await asaasFetch<AsaasPayment>('/payments', {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      billingType: 'PIX',
    }),
  })

  if (payment.id) {
    const qrCode = await asaasFetch<{ encodedImage: string; payload: string }>(
      `/payments/${payment.id}/pixQrCode`
    )
    payment.pixQrCode = qrCode
  }

  return payment
}

export async function getPayment(id: string): Promise<AsaasPayment> {
  return asaasFetch(`/payments/${id}`)
}

export async function createSubscription(data: {
  customer: string
  value: number
  dueDate: string
  description: string
  cycle: 'MONTHLY'
}): Promise<{ id: string; status: string }> {
  return asaasFetch('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      billingType: 'PIX',
    }),
  })
}

export function parseWebhookEvent(body: any): {
  event: string
  paymentId: string
  status: string
} {
  const event = body.event
  const paymentId = body.payment?.id || body.id
  const status = body.payment?.status || body.status
  return { event, paymentId, status }
}
