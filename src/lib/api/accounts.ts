import { API_ROOT } from "@/config/api";

export const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'INCOME', 'EXPENSE', 'EQUITY'] as const

export type AccountType = (typeof ACCOUNT_TYPES)[number]

export interface Account {
  id: string
  businessId: string
  name: string
  type: AccountType
  code?: string | null
  isActive: boolean
  createdAt: string
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  account?: Account
  accounts?: Account[]
  data?: T
}

function buildHeaders(token: string, businessId: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'x-business-id': businessId,
  }
}

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.message || `Request failed: ${response.status}`)
  }
  return payload
}

export async function getAccounts(token: string, businessId: string): Promise<Account[]> {
  const response = await fetch(`${API_ROOT}/accounts`, {
    headers: buildHeaders(token, businessId),
  })

  const data = await parseResponse<Account[]>(response)
  return Array.isArray(data.accounts) ? data.accounts : []
}

export async function getAccountById(token: string, businessId: string, id: string): Promise<Account> {
  const response = await fetch(`${API_ROOT}/accounts/${id}`, {
    headers: buildHeaders(token, businessId),
  })

  const data = await parseResponse<Account>(response)
  if (!data.account) {
    throw new Error('Account not found')
  }

  return data.account
}

export async function createAccount(
  token: string,
  businessId: string,
  payload: { name: string; type: AccountType; code?: string }
): Promise<Account> {
  const response = await fetch(`${API_ROOT}/accounts`, {
    method: 'POST',
    headers: buildHeaders(token, businessId),
    body: JSON.stringify(payload),
  })

  const data = await parseResponse<Account>(response)
  if (!data.account) {
    throw new Error('Failed to create account')
  }

  return data.account
}

export async function updateAccount(
  token: string,
  businessId: string,
  id: string,
  payload: { name: string; type: AccountType; code?: string; isActive?: boolean }
): Promise<Account> {
  const response = await fetch(`${API_ROOT}/accounts/${id}`, {
    method: 'PUT',
    headers: buildHeaders(token, businessId),
    body: JSON.stringify(payload),
  })

  const data = await parseResponse<Account>(response)
  if (!data.account) {
    throw new Error('Failed to update account')
  }

  return data.account
}

export async function deleteAccount(token: string, businessId: string, id: string): Promise<void> {
  const response = await fetch(`${API_ROOT}/accounts/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(token, businessId),
  })

  await parseResponse<void>(response)
}

export async function createDefaultAccounts(token: string, businessId: string): Promise<string> {
  const response = await fetch(`${API_ROOT}/accounts/default`, {
    method: 'POST',
    headers: buildHeaders(token, businessId),
  })

  const data = await parseResponse<void>(response)
  return data.message || 'Default accounts created'
}
