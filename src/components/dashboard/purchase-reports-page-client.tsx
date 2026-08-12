import { toast } from 'sonner';
import React, { useCallback, useEffect, useState } from 'react'
import {  useLocation  } from 'react-router-dom';
import { BarChart3, TrendingUp, ShoppingCart, Package, DollarSign, AlertCircle } from 'lucide-react'
import { purchaseReportsAPI } from '@/lib/api/purchase'
import { inventoryReportsAPI } from '@/lib/api/inventory'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface Summary { status: string; count: number; totalAmount: number }
interface VendorStat { vendorId: string; vendorName: string; orderCount: number; totalAmount: number }

export default function PurchaseReportsPageClient() {
  const pathname = useLocation().pathname
  const { toast } = useToast()
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || ''
  const [summary, setSummary] = useState<Summary[]>([])
  const [byVendor, setByVendor] = useState<VendorStat[]>([])
  const [lowStockCount, setLowStockCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!businessId) return
    try {
      setIsLoading(true)
      const [sumRes, vendorRes, lowRes] = await Promise.allSettled([
        purchaseReportsAPI.getSummary(businessId),
        purchaseReportsAPI.getByVendor(businessId),
        inventoryReportsAPI.getLowStock(businessId),
      ])
      if (sumRes.status === 'fulfilled') setSummary(sumRes.value.summary || [])
      if (vendorRes.status === 'fulfilled') setByVendor(vendorRes.value.data || [])
      if (lowRes.status === 'fulfilled') setLowStockCount((lowRes.value.alerts || []).length)
    } catch {
      toast({ title: 'Failed to load reports', variant: 'destructive' })
    } finally { setIsLoading(false) }
  }, [businessId])
  useEffect(() => { fetchData() }, [fetchData])

  const totalPOs = summary.reduce((s, r) => s + r.count, 0)
  const totalSpend = summary.reduce((s, r) => s + r.totalAmount, 0)
  const pendingPOs = summary.find(s => s.status === 'DRAFT')?.count || 0

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Purchase Reports</h1>
        <p className="text-sm text-muted-foreground">Analytics and insights for your procurement operations</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />) : (
          <>
            {[
              { icon: ShoppingCart, label: 'Total POs', value: totalPOs, color: 'bg-indigo-500' },
              { icon: DollarSign, label: 'Total Spend', value: `₹${totalSpend.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: 'bg-emerald-500' },
              { icon: TrendingUp, label: 'Pending POs', value: pendingPOs, color: 'bg-amber-500' },
              { icon: AlertCircle, label: 'Low Stock Items', value: lowStockCount, color: 'bg-rose-500' },
            ].map(({ icon: Icon, label, value, color }) => (
              <Card key={label} className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
                      <p className="mt-1 text-2xl font-bold">{value}</p>
                    </div>
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* PO Status Breakdown */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base">PO Status Breakdown</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
              : summary.length === 0 ? <p className="text-sm text-muted-foreground py-6 text-center">No data yet.</p>
              : (
                <div className="space-y-3">
                  {summary.map(s => {
                    const pct = totalPOs > 0 ? Math.round((s.count / totalPOs) * 100) : 0
                    const COLOR: Record<string, string> = { DRAFT: 'bg-gray-400', APPROVED: 'bg-emerald-500', SENT: 'bg-indigo-500', FULLY_RECEIVED: 'bg-teal-500', CANCELLED: 'bg-red-400' }
                    return (
                      <div key={s.status}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-medium">{s.status.replace(/_/g, ' ')}</span>
                          <span className="text-muted-foreground">{s.count} POs · ₹{s.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div className={`h-2 rounded-full ${COLOR[s.status] || 'bg-indigo-400'}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
          </CardContent>
        </Card>

        {/* Top Vendors */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base">Top Vendors by Spend</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
              : byVendor.length === 0 ? <p className="text-sm text-muted-foreground py-6 text-center">No vendor data yet.</p>
              : (
                <div className="space-y-2">
                  {byVendor.slice(0, 8).map((v, i) => (
                    <div key={v.vendorId} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/30">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">{v.vendorName}</p>
                        <p className="text-xs text-muted-foreground">{v.orderCount} orders</p>
                      </div>
                      <span className="text-sm font-semibold text-emerald-700">₹{v.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                  ))}
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
