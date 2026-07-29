import { useEffect } from 'react'
import { toast } from 'sonner'

const CRUD_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

type MaybeRecord = Record<string, unknown>

function getHeaderValue(headers: HeadersInit | undefined, key: string): string | null {
  if (!headers) return null

  if (headers instanceof Headers) {
    return headers.get(key)
  }

  if (Array.isArray(headers)) {
    const entry = headers.find(([headerKey]) => headerKey.toLowerCase() === key.toLowerCase())
    return entry?.[1] ?? null
  }

  const record = headers as Record<string, string>
  const matchKey = Object.keys(record).find((headerKey) => headerKey.toLowerCase() === key.toLowerCase())
  return matchKey ? record[matchKey] : null
}

function isWarningPayload(payload: MaybeRecord | null): boolean {
  if (!payload) return false

  const status = typeof payload.status === 'string' ? payload.status.toLowerCase() : ''
  const severity = typeof payload.severity === 'string' ? payload.severity.toLowerCase() : ''
  const hasWarningsArray = Array.isArray(payload.warnings) && payload.warnings.length > 0

  return Boolean(payload.warning) || status === 'warning' || severity === 'warning' || hasWarningsArray
}

function pickMessage(payload: MaybeRecord | null, fallback: string): string {
  if (!payload) return fallback

  const candidates = [
    payload.message,
    payload.error,
    payload.warning,
    (payload.details as MaybeRecord | undefined)?.message,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate
    }
  }

  return fallback
}

function defaultMessageByMethod(method: string): string {
  if (method === 'POST') return 'Created successfully.'
  if (method === 'PUT' || method === 'PATCH') return 'Updated successfully.'
  if (method === 'DELETE') return 'Deleted successfully.'
  return 'Operation completed.'
}

export function CrudToastProvider() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const originalFetch = window.fetch.bind(window)

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = (init?.method ?? 'GET').toUpperCase()

      if (!CRUD_METHODS.has(method)) {
        return originalFetch(input, init)
      }

      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url

      const hasAuthHeader = Boolean(getHeaderValue(init?.headers, 'authorization'))
      const hasBusinessHeader = Boolean(getHeaderValue(init?.headers, 'x-business-id'))
      const isApiCall = url.includes('/api/')
      const isPreview = url.includes('/preview')

      if (!isApiCall || !hasAuthHeader || !hasBusinessHeader || isPreview) {
        return originalFetch(input, init)
      }

      let response: Response

      try {
        response = await originalFetch(input, init)
      } catch (error) {
        toast.error('Request failed. Please try again.')
        throw error
      }

      let payload: MaybeRecord | null = null

      try {
        payload = (await response.clone().json()) as MaybeRecord
      } catch {
        payload = null
      }

      const fallback = response.ok
        ? defaultMessageByMethod(method)
        : `Request failed (${response.status}).`

      const message = pickMessage(payload, fallback)

      if (response.ok) {
        if (isWarningPayload(payload)) {
          toast.warning(message)
        } else {
          toast.success(message)
        }
      } else {
        toast.error(message)
      }

      return response
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  return null
}
