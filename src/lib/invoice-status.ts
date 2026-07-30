export const INVOICE_STATUSES = ['UNPAID', 'PARTIALLY_PAID', 'PAID'] as const

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number]

const INVOICE_STATUS_SET = new Set<string>(INVOICE_STATUSES)

export function isInvoiceStatus(value: unknown): value is InvoiceStatus {
  return typeof value === 'string' && INVOICE_STATUS_SET.has(value)
}

export function normalizeInvoiceStatus(value: unknown): InvoiceStatus {
  if (isInvoiceStatus(value)) return value
  return 'UNPAID'
}

export function invoiceStatusLabel(status: InvoiceStatus): string {
  if (status === 'PARTIALLY_PAID') return 'Partially Paid'
  if (status === 'PAID') return 'Paid'
  return 'Unpaid'
}
