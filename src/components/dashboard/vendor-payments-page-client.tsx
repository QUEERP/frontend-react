import { toast } from 'sonner';
import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import {  useLocation  } from 'react-router-dom';
import { Wallet, Search, CreditCard, Calendar, ArrowUpRight } from 'lucide-react'
import { vendorPaymentsAPI, VendorPayment, billsAPI, Bill } from '@/lib/api/purchase'
import { useToast } from '@/components/ui/use-toast'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PaymentWithBill extends Omit<VendorPayment, 'billId'> {
  billVendorName?: string
  billNumber?: string
  billId?: string
}

function PaymentMethodBadge({ method }: { method: string }) {
  const m = method.toUpperCase()
  if (['CASH'].includes(m)) {
    return <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">{method.replace('_', ' ')}</Badge>
  }
  if (['BANK_TRANSFER', 'UPI'].includes(m)) {
    return <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">{method.replace('_', ' ')}</Badge>
  }
  if (['CHEQUE'].includes(m)) {
    return <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider border bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20">{method.replace('_', ' ')}</Badge>
  }
  if (['CREDIT_CARD'].includes(m)) {
    return <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider border bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20">{method.replace('_', ' ')}</Badge>
  }
  return <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider border bg-muted text-foreground border-border dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">{method.replace('_', ' ')}</Badge>
}

export default function VendorPaymentsPageClient() {
  const pathname = useLocation().pathname
  const { toast } = useToast()
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || ''

  const [payments, setPayments] = useState<PaymentWithBill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async () => {
    if (!businessId) return
    try {
      setIsLoading(true)
      const billsRes = await billsAPI.getAll(businessId)
      const bills = billsRes.bills || []
      const allPayments: PaymentWithBill[] = []
      await Promise.allSettled(
        bills.map(async (b: Bill) => {
          const res = await vendorPaymentsAPI.getForBill(businessId, b.id)
          const pymts = (res.payments || []).map((p: VendorPayment) => ({ 
            ...p, 
            billVendorName: b.vendor?.name,
            billNumber: b.billNumber,
            billId: b.id
          }))
          allPayments.push(...pymts)
        })
      )
      allPayments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
      setPayments(allPayments)
    } catch {
      toast({ title: 'Failed to load payments', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [businessId])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = payments.filter(p => {
    const term = search.toLowerCase()
    return !term || (p.billVendorName || '').toLowerCase().includes(term) || (p.referenceNumber || '').toLowerCase().includes(term) || (p.billNumber || '').toLowerCase().includes(term)
  })

  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0)

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0 max-w-full overflow-x-hidden">
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="sm:hidden -ml-2 size-9 rounded-full relative cursor-pointer border border-border/60 bg-muted hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 shadow-sm transition-all" />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Vendor Payments
            </h1>
            <p className="text-sm font-medium text-muted-foreground mt-1">
              Track all outgoing payments made to vendors.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Total Payments
                </p>
                <div className="text-2xl font-black text-foreground">
                  {isLoading ? <Skeleton className="h-8 w-20" /> : payments.length}
                </div>
                <p className="text-xs font-medium text-muted-foreground">All recorded payments</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
                <Wallet className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Total Paid
                </p>
                <div className="text-2xl font-black text-foreground">
                  {isLoading ? <Skeleton className="h-8 w-32" /> : `₹${totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                </div>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Total disbursement</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
                <CreditCard className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  This Month
                </p>
                <div className="text-2xl font-black text-foreground">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : payments.filter(p => new Date(p.paymentDate).getMonth() === new Date().getMonth()).length}
                </div>
                <p className="text-xs font-medium text-muted-foreground">Transactions in current month</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 flex items-center justify-center border border-violet-100 dark:border-violet-900/50">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden flex-1 flex flex-col w-full min-w-0 max-w-full">
        <CardHeader className="border-b border-border bg-muted/50 pb-5 pt-6 px-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Directory</CardTitle>
              <CardDescription className="text-sm font-medium text-muted-foreground mt-1">
                Showing <span className="text-foreground font-semibold">{filtered.length}</span> of {payments.length} payments
              </CardDescription>
            </div>
            
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search by vendor, reference, or bill #…" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="pl-9 h-10 rounded-xl border-border bg-card focus-visible:ring-blue-500 text-sm shadow-sm" 
              />
            </div>
          </div>
        </CardHeader>

        <div className="p-0 border-t-0 flex-1 overflow-x-auto max-w-full w-full min-w-0 custom-scrollbar">
          <Table className="w-full min-w-[850px]">
            <TableHeader className="bg-muted dark:bg-[#181a20] sticky top-0 z-10 border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <TableRow className="hover:bg-muted dark:hover:bg-[#181a20] border-b border-border">
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground pl-6">Vendor</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Bill #</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Payment Date</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Method</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Reference</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right pr-6">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-4">
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-2">
                        <Wallet className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-base font-semibold text-foreground">No vendor payments found</p>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        {search ? 'Try adjusting your search query.' : 'Record a payment from an existing vendor bill to see it here.'}
                      </p>
                      {!search && (
                        <Link to={`/dashboard/${businessId}/vendor-bills`} className="mt-2 text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">
                          Go to Vendor Bills &rarr;
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(p => (
                  <TableRow key={p.id} className="group hover:bg-muted/50 border-b border-border transition-colors">
                    <TableCell className="pl-6 py-4 font-semibold text-foreground text-sm">
                      {p.billVendorName || '—'}
                    </TableCell>
                    <TableCell className="py-4">
                      {p.billNumber ? (
                        <Link to={`/dashboard/${businessId}/vendor-bills/${p.billId}`} className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                          {p.billNumber}
                          <ArrowUpRight className="size-3 opacity-50" />
                        </Link>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="py-4 text-sm font-medium text-muted-foreground">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="py-4">
                      <PaymentMethodBadge method={p.paymentMethod || 'UNKNOWN'} />
                    </TableCell>
                    <TableCell className="py-4 font-mono text-xs font-medium text-muted-foreground">
                      {p.referenceNumber || '—'}
                    </TableCell>
                    <TableCell className="pr-6 py-4 text-right font-bold text-sm text-emerald-600 dark:text-emerald-400">
                      ₹{Number(p.amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {filtered.length > 0 && (
          <div className="border-t border-border px-6 py-4">
            <p className="text-xs font-medium text-muted-foreground">
              Showing <span className="font-bold text-foreground">{filtered.length}</span> of {payments.length} payments
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
