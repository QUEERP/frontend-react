import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { VendorEmailPageClient } from '@/components/dashboard/vendor-email-page-client'
import { API_ROOT } from '@/config/api'
import { getCookie } from '@/lib/utils'
import { Loader2Icon, AlertCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function VendorBillEmailPage() {
  const { businessId, id } = useParams<{ businessId: string; id: string }>()
  const navigate = useNavigate()
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadBill() {
      if (!businessId || !id) return
      setLoading(true)
      setError(null)
      try {
        const token = getCookie('token') || getCookie('accessToken')
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'x-business-id': businessId,
        }
        if (token) headers['Authorization'] = `Bearer ${token}`

        const res = await fetch(`${API_ROOT}/purchase/bills/${encodeURIComponent(id)}`, { headers })
        const data = await res.json()
        if (res.ok && data?.success && (data?.bill || data?.data)) {
          const b = data.bill || data.data
          const targetVendorId = b.vendorId || b.vendor?.id
          if (targetVendorId) {
            setVendorId(targetVendorId)
          } else {
            setError('This bill does not have an associated vendor record.')
          }
        } else {
          setError(data?.message || 'Bill not found')
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load bill')
      } finally {
        setLoading(false)
      }
    }
    loadBill()
  }, [businessId, id])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2Icon className="size-8 animate-spin text-blue-600" />
        <p className="text-sm text-muted-foreground font-medium">Preparing email composer for vendor bill...</p>
      </div>
    )
  }

  if (error || !vendorId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 max-w-md mx-auto text-center p-6">
        <AlertCircleIcon className="size-10 text-rose-500" />
        <h2 className="text-lg font-bold text-foreground">Cannot Send Bill Email</h2>
        <p className="text-sm text-muted-foreground">{error || 'Vendor information could not be determined.'}</p>
        <Button variant="outline" onClick={() => navigate(`/dashboard/${businessId}/vendor-bills`)}>
          Back to Bills
        </Button>
      </div>
    )
  }

  return <VendorEmailPageClient businessId={businessId!} vendorId={vendorId} />
}

