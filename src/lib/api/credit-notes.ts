import { getCookie } from '@/lib/utils'
import { API_ROOT } from "@/config/api";


export type CreditNoteStatus = 'OPEN' | 'CLOSED' | string
export type CreditNoteType = 'INVOICE' | 'BILL' | string

export interface CreditNoteCustomer {
  id: string
  name?: string
  company?: string
  email?: string
}

export interface CreditNoteInvoice {
  id: string
  invoiceNumber?: string
  grandTotal?: number
  customer?: CreditNoteCustomer
}

export interface CreditNote {
  id: string
  creditNumber: string
  amount: number
  remainingAmount: number
  status: CreditNoteStatus
  type?: CreditNoteType
  reason?: string | null
  pdfUrl?: string | null
  downloadUrl?: string | null
  createdAt: string
  updatedAt?: string
  customer?: CreditNoteCustomer | null
  invoice?: CreditNoteInvoice | null
}

const normalizeCreditNote = (note: CreditNote): CreditNote => {
  if (!note) return note

  const customer = note.customer
    ? {
        ...note.customer,
        name: note.customer.name || note.customer.company || '',
      }
    : note.customer

  return {
    ...note,
    customer,
  }
}

export const creditNotesAPI = {
  async getCreditNotes(businessId: string): Promise<{ success: boolean; data: CreditNote[]; message?: string }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/credit-notes`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    })

    const payload = await response.json().catch(() => ({}))

    if (!response.ok || !payload?.success) {
      throw new Error(payload?.message || 'Failed to fetch credit notes')
    }

    const list = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.data?.items)
        ? payload.data.items
        : []

    return {
      ...payload,
      data: list.map((item: CreditNote) => normalizeCreditNote(item)),
    }
  },

  async getCreditNoteById(
    businessId: string,
    id: string,
  ): Promise<{ success: boolean; data: CreditNote; message?: string }> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    const response = await fetch(`${API_ROOT}/credit-notes/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    })

    const payload = await response.json().catch(() => ({}))

    if (!response.ok || !payload?.success) {
      throw new Error(payload?.message || 'Failed to fetch credit note details')
    }

    return {
      ...payload,
      data: normalizeCreditNote(payload.data as CreditNote),
    }
  },

  async downloadCreditNotePdf(
    businessId: string,
    note: Pick<CreditNote, 'id' | 'creditNumber' | 'downloadUrl'> & { pdfUrl?: string | null },
  ): Promise<void> {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')

    let url = note.pdfUrl || note.downloadUrl
    let downloadUrl = ''

    if (url) {
      downloadUrl = url.replace("/upload/", "/upload/fl_attachment/")
    } else {
      downloadUrl = `${API_ROOT}/credit-notes/${encodeURIComponent(note.id)}/download?token=${token}&x-business-id=${businessId}`
    }

    const safeNumber = String(note.creditNumber || note.id).replace(/[^a-zA-Z0-9-_]/g, '_')
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `CreditNote_${safeNumber}.pdf`
    link.target = '_self'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  },
}
