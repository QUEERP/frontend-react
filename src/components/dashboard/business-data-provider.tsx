import * as React from 'react'
import { useToast } from '@/components/ui/use-toast'
import { getCookie, clearCookie } from '@/lib/utils'

type Business = any

type BusinessDataContextValue = {
  businessId: string
  business: Business | null
  role: any | null
  permissions: string[]
  country: string
  countryCode?: string
  taxType?: string
  currency: string
  currencySymbol: string
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const BusinessDataContext =
  React.createContext<BusinessDataContextValue | null>(null)

export function BusinessDataProvider({
  businessId,
  children,
}: {
  businessId: string
  children: React.ReactNode
}) {
  const [business, setBusiness] = React.useState<Business | null>(null)
  const [role, setRole] = React.useState<any | null>(null)
  const [permissions, setPermissions] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)
  const [error, setError] = React.useState<string | null>(null)
  const { toast } = (useToast?.() as any) || { toast: () => {} }

  const API_BASE =
    import.meta.env.VITE_API_BASE || ''
  const MIN_LOADING_MS = 260

  const fetchBusinessInternal = React.useCallback(async (emitSuccess: boolean) => {
    const requestStartedAt = Date.now()
    try {
      setLoading(true)
      setError(null)
      const token = getCookie('token') || getCookie('accessToken')
      if (!token || token.trim().length === 0) {
        throw new Error('Missing token')
      }
      const idFromCookie = getCookie('activeBusinessId')
      let id = businessId && String(businessId).trim().length > 0 ? businessId : (idFromCookie || '')
      if (!id && typeof window !== 'undefined') {
        const m = window.location.pathname.match(/\/dashboard\/([^/]+)/)
        if (m && m[1]) id = decodeURIComponent(m[1])
      }
      if (!id) {
        throw new Error('Missing businessId')
      }
      const res = await fetch(
        `${API_BASE}/api/business/${encodeURIComponent(id)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Accept': 'application/json',
            'X-Business-Id': id,
          },
          credentials: 'omit',
        },
      )
      const data = await res.json()
      if (res.status === 401 || data?.message === 'User not found') {
        clearCookie('token')
        clearCookie('accessToken')
        if (typeof window !== 'undefined') {
          window.location.href = '/signin'
        }
        return
      }
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to load business data')
      }
      setBusiness(data.business || null)
      setRole(data.Role || null)
      setPermissions(Array.isArray(data.Permissions) ? data.Permissions : [])
      if (emitSuccess) {
        toast?.({
          title: 'Business data updated',
          description: data.business?.name || 'Loaded successfully',
        })
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load business data')
      toast?.({
        title: 'Failed to load business',
        description: err?.message || 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      const elapsed = Date.now() - requestStartedAt
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed)
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining))
      }
      setLoading(false)
    }
  }, [API_BASE, businessId])

  React.useEffect(() => {
    fetchBusinessInternal(false)
  }, [fetchBusinessInternal])

  const settings = React.useMemo(() => {
    const s = (business as any)?.settings
    return Array.isArray(s) ? s[0] || null : s || null
  }, [business])

  const currency = React.useMemo(() => {
    if (business?.currencyCode) return business.currencyCode;
    const country = (business as any)?.country
    if (country === 'INDIA') return 'INR'
    if (country === 'UAE') return 'AED'
    return settings?.currency || (business as any)?.currency || 'USD'
  }, [business, settings])

  const currencySymbol = React.useMemo(() => {
    if (business?.currencySymbol) return business.currencySymbol;
    const country = (business as any)?.country
    if (country === 'INDIA') return '₹'
    if (country === 'UAE') return 'AED'
    const map: Record<string, string> = { INR: '₹', USD: '$', AED: 'AED', EUR: '€', GBP: '£' }
    return map[currency] || currency
  }, [business, currency, settings])

  const value = React.useMemo<BusinessDataContextValue>(
    () => ({
      businessId: businessId || getCookie('activeBusinessId') || '',
      business,
      role,
      permissions,
      country: business?.country || 'INDIA',
      countryCode: business?.countryCode,
      taxType: business?.taxType,
      currency,
      currencySymbol,
      loading,
      error,
      refresh: async () => {
        await fetchBusinessInternal(true)
      },
    }),
    [businessId, business, role, permissions, currency, currencySymbol, loading, error, fetchBusinessInternal],
  )

  return (
    <BusinessDataContext.Provider value={value}>
      {children}
    </BusinessDataContext.Provider>
  )
}

export function useBusinessData() {
  const ctx = React.useContext(BusinessDataContext)
  if (!ctx) {
    throw new Error(
      'useBusinessData must be used within <BusinessDataProvider />',
    )
  }
  return ctx
}

