export interface User {
  id: string
  email: string
  name: string
  phone: string
  created_at: string
}

export interface Cobranca {
  id: string
  user_id: string
  client_name: string
  client_phone: string
  client_whatsapp: string
  value: number
  description: string
  due_date: string
  status: 'pending' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  pix_qr_code?: string
  pix_copy_paste?: string
  asaas_payment_id?: string
  sent_at?: string
  paid_at?: string
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  status: 'active' | 'inactive' | 'cancelled'
  asaas_subscription_id?: string
  current_period_start: string
  current_period_end: string
  created_at: string
}

export type CobrancaFormData = {
  client_name: string
  client_phone: string
  client_whatsapp: string
  value: number
  description: string
  due_date: string
}
