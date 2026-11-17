import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CustomerEmailPageClient } from '@/components/dashboard/customer-email-page-client'
import { API_ROOT } from '@/config/api'
import { getCookie } from '@/lib/utils'
import { Loader2Icon, AlertCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function InvoiceEmailPage() {
  const { businessId, id } = useParams<{ businessId: string; id: string }>()
  const navigate = useNavigate()
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadInvoice() {
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

        const res = await fetch(`${API_ROOT}/invoices/${encodeURIComponent(id)}`, { headers })
        const data = await res.json()
        if (res.ok && data?.success && data?.invoice) {
          const inv = data.invoice
          const targetCustomerId = inv.customerId || inv.customer?.id
          if (targetCustomerId) {
            setCustomerId(targetCustomerId)
          } else {
            setError('This invoice does not have an associated customer record.')
          }
        } else {
          setError(data?.message || 'Invoice not found')
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load invoice')
      } finally {
        setLoading(false)
      }
    }
    loadInvoice()
  }, [businessId, id])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2Icon className="size-8 animate-spin text-blue-600" />
        <p className="text-sm text-muted-foreground font-medium">Preparing email composer for invoice...</p>
      </div>
    )
  }

  if (error || !customerId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 max-w-md mx-auto text-center p-6">
        <AlertCircleIcon className="size-10 text-rose-500" />
        <h2 className="text-lg font-bold text-foreground">Cannot Send Invoice Email</h2>
        <p className="text-sm text-muted-foreground">{error || 'Customer information could not be determined.'}</p>
        <Button variant="outline" onClick={() => navigate(`/dashboard/${businessId}/invoices`)}>
          Back to Invoices
        </Button>
      </div>
    )
  }

  return <CustomerEmailPageClient businessId={businessId!} customerId={customerId} />
}

