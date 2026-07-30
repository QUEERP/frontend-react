import {  useParams, useNavigate, useSearchParams  } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { PurchaseOrderForm } from '@/components/dashboard/purchase-order-form'
import { purchaseOrdersAPI } from '@/lib/api/purchase-orders'
import { purchaseRequestsAPI } from '@/lib/api/purchase'
import { getCookie } from '@/lib/utils'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

export default function AddPurchaseOrderPage() {
  const routerParams = useParams() as any;
  const { businessId } = routerParams;

  const navigate = useNavigate()
  const params = useParams()
  const [searchParams] = useSearchParams()
  
  const fromPRId = searchParams.get('fromPR')

  const [initialData, setInitialData] = useState<any>(null)
  const [sourcePRId, setSourcePRId] = useState<string | null>(null)
  const [loading, setLoading] = useState(!!fromPRId)

  // If navigated from a PR, fetch it and pre-fill
  useEffect(() => {
    if (!fromPRId) return

    const fetch = async () => {
      setLoading(true)
      try {
        const res = await purchaseRequestsAPI.getById(businessId, fromPRId)
        if (res.success && res.request) {
          const pr = res.request
          setSourcePRId(pr.id)

          // Map PR items → PO item shape
          const items = (pr.items || []).map((it: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            productId: it.productId || '',
            warehouseId: '',               // User must fill
            description: it.description || '',
            itemType: it.itemType || 'GOODS',
            hsnSacCode: it.hsnSacCode || '',
            quantity: it.quantity || 1,
            price: it.estimatedPrice || 0, // Est. price as starting rate
            taxPercent: 0,                 // User must fill
          }))

          setInitialData({
            // Pre-fill from PR
            vendorId: pr.vendorId || '',   // If preferred vendor was set on PR
            notes: pr.notes || '',
            expectedDeliveryDate: pr.expectedDate
              ? new Date(pr.expectedDate).toISOString().slice(0, 10)
              : '',
            orderDate: new Date().toISOString().slice(0, 10),
            items,
            _sourcePR: pr, // carry for banner
          })
        }
      } catch (e) {
        toast.error('Failed to load Purchase Request details')
      } finally {
        setLoading(false)
      }
    }

    fetch()
  }, [fromPRId, businessId])

  const handleSubmit = async (data: any) => {
    const response = await purchaseOrdersAPI.createPurchaseOrder(businessId, data)
    if (response.success) {
      toast.success('Purchase order created successfully')

      // Mark the source PR as CONVERTED
      if (sourcePRId) {
        try {
          await purchaseRequestsAPI.update(businessId, sourcePRId, { status: 'CONVERTED' as any })
        } catch {
          // Non-critical — PO was created, just warn
          toast.error('PO created but failed to mark PR as Converted. Please update it manually.')
        }
      }

      navigate(`/dashboard/${businessId}/purchase-orders`)
    }
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-[#f8fafc] dark:bg-[#121418] px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#181a20] p-6 rounded-2xl border border-slate-200 dark:border-[#23272c] shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(`/dashboard/${businessId}/purchase-orders`)} className="size-10 rounded-xl border-slate-200 dark:border-[#23272c] hover:bg-slate-50 dark:hover:bg-[#1c2128]">
            <ArrowLeft className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {fromPRId ? 'Convert to Purchase Order' : 'Add Purchase Order'}
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              {fromPRId ? 'Pre-filled from Purchase Request — review and complete before saving' : 'Create a new vendor purchase order'}
            </p>
          </div>
        </div>
      </div>

      {/* PR conversion banner */}
      {fromPRId && initialData?._sourcePR && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-5 py-3 text-sm font-medium">
          <span className="font-bold">Source PR:</span>
          {initialData._sourcePR.requestNumber} — items and notes have been pre-filled.
          Vendor, currency, warehouse and tax % must be filled in before saving.
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-3 text-slate-500 font-medium">Loading Purchase Request data…</span>
        </div>
      ) : (
        <PurchaseOrderForm
          businessId={businessId as string}
          title="Purchase Order Information"
          description={fromPRId ? "Line items pre-filled from Purchase Request. Complete vendor, currency and warehouse details." : "Fill in vendor, optional assignment, items, and date details."}
          submitLabel="Create Purchase Order"
          mode="create"
          initialData={initialData}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}
