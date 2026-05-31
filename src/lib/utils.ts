import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

export function generateWhatsAppMessage(cobranca: {
  client_name: string
  value: number
  description: string
  due_date: string
  pix_copy_paste?: string
}): string {
  const date = formatDate(cobranca.due_date)
  const value = formatCurrency(cobranca.value)
  
  let msg = `Olá ${cobranca.client_name}! 👋\n\n`
  msg += `Lembrando que sua cobrança de *${value}* referente a "${cobranca.description}" vence em *${date}*.\n\n`
  msg += `💳 Pix: ${cobranca.pix_copy_paste || 'Copie a chave abaixo'}\n\n`
  msg += `Após o pagamento, o status é atualizado automaticamente.\n`
  msg += `Qualquer dúvida, é só responder essa mensagem. 👍`
  
  return msg
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pendente',
    sent: 'Enviada',
    paid: 'Paga',
    overdue: 'Vencida',
    cancelled: 'Cancelada'
  }
  return map[status] || status
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    sent: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800'
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}

export function generateId(): string {
  return crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15)
}
