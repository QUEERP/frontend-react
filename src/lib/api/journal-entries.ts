import { API_ROOT } from "@/config/api";


export interface JournalAccount {
  id: string
  name: string
  type?: string
  code?: string | null
}

export interface JournalEntry {
  id: string
  businessId: string
  accountId: string
  debit: number
  credit: number
  description?: string | null
  date: string
  account?: JournalAccount
}

export interface JournalCreateLine {
  accountId: string
  debit?: number
  credit?: number
}

function round2(value: number | string | undefined): number {
  const numeric = Number(value || 0)
  return Number(numeric.toFixed(2))
}

function headers(token: string, businessId: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'x-business-id': businessId,
  }
}

async function parseResponse(response: Response): Promise<any> {
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.message || `Request failed: ${response.status}`)
  }
  return payload
}

export async function listJournalEntries(token: string, businessId: string): Promise<JournalEntry[]> {
  const response = await fetch(`${API_ROOT}/journal-entries`, {
    headers: headers(token, businessId),
  })

  const data = await parseResponse(response)
  return Array.isArray(data?.entries) ? data.entries : []
}

export async function getJournalEntry(token: string, businessId: string, id: string): Promise<JournalEntry> {
  const response = await fetch(`${API_ROOT}/journal-entries/${id}`, {
    headers: headers(token, businessId),
  })

  const data = await parseResponse(response)
  if (!data?.entry) {
    throw new Error('Entry not found')
  }

  return data.entry
}

export async function createJournalEntry(
  token: string,
  businessId: string,
  payload: { entries: JournalCreateLine[]; description?: string; date?: string }
): Promise<JournalEntry[]> {
  const sanitizedEntries = (Array.isArray(payload.entries) ? payload.entries : [])
    .map((line) => ({
      accountId: line.accountId,
      debit: round2(line.debit),
      credit: round2(line.credit),
    }))
    .filter((line) => line.accountId && (line.debit > 0 || line.credit > 0))

  if (sanitizedEntries.length < 2) {
    throw new Error('At least 2 valid entry lines are required')
  }

  const totalDebit = round2(sanitizedEntries.reduce((sum, line) => sum + line.debit, 0))
  const totalCredit = round2(sanitizedEntries.reduce((sum, line) => sum + line.credit, 0))

  if (totalDebit !== totalCredit) {
    throw new Error('Debit and credit totals must be equal')
  }

  const response = await fetch(`${API_ROOT}/journal-entries`, {
    method: 'POST',
    headers: headers(token, businessId),
    body: JSON.stringify({
      entries: sanitizedEntries,
      description: payload.description?.trim() || undefined,
      date: payload.date || undefined,
    }),
  })

  const data = await parseResponse(response)
  return Array.isArray(data?.entries) ? data.entries : []
}

export async function deleteJournalEntry(token: string, businessId: string, id: string): Promise<void> {
  const response = await fetch(`${API_ROOT}/journal-entries/${id}`, {
    method: 'DELETE',
    headers: headers(token, businessId),
  })

  await parseResponse(response)
}
