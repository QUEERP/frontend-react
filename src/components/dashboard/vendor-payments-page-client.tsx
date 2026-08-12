import { toast } from 'sonner';
import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import {  useLocation  } from 'react-router-dom';
import { Wallet, Search, CreditCard, Calendar, ArrowUpRight } from 'lucide-react'
import { vendorPaymentsAPI, VendorPayment, billsAPI, Bill } from '@/lib/api/purchase'
import { useToast } from '@/components/ui/use-toast'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className="flex min-h-svh flex-col gap-6 bg-background dark:bg-[#121418] px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card dark:bg-[#181a20] p-6 rounded-2xl border border-border dark:border-[#23272c] shadow-sm">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="sm:hidden -ml-2 size-9 rounded-full relative cursor-pointer border border-border/60 bg-muted hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 shadow-sm transition-all dark:bg-[#181a20] dark:border-[#23272c] dark:hover:bg-[#1c2128] dark:hover:border-blue-900/50" />
          <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl hidden sm:flex items-center justify-center">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground dark:text-slate-100 tracking-tight">Vendor Payments</h1>
            <p className="text-sm font-medium text-muted-foreground dark:text-slate-400 mt-0.5">Track all outgoing payments made to vendors</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="rounded-2xl border-border dark:border-[#23272c] shadow-sm bg-card dark:bg-[#181a20] hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground dark:text-slate-400">Total Payments</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold text-foreground dark:text-slate-100">{payments.length}</div>}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border dark:border-[#23272c] shadow-sm bg-card dark:bg-[#181a20] hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground dark:text-slate-400">Total Paid</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-32" /> : <div className="text-2xl font-bold text-foreground dark:text-slate-100">₹{totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border dark:border-[#23272c] shadow-sm bg-card dark:bg-[#181a20] hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground dark:text-slate-400">This Month</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold text-foreground dark:text-slate-100">{payments.filter(p => new Date(p.paymentDate).getMonth() === new Date().getMonth()).length}</div>}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="rounded-2xl border-border dark:border-[#23272c] shadow-sm bg-card dark:bg-[#181a20] overflow-hidden flex-1 flex flex-col min-w-0">
        <div className="p-6 border-b border-border dark:border-[#23272c] bg-muted/50 dark:bg-[#181a20] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by vendor, reference, or bill #…" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-9 h-10 rounded-xl border-border dark:border-[#23272c] bg-card dark:bg-[#121418] w-full focus-visible:ring-blue-500" 
            />
          </div>
        </div>

        <div className="p-0 border-t-0 flex-1 overflow-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-muted/80 dark:bg-[#121418]/80 sticky top-0 z-10 backdrop-blur-sm">
              <TableRow className="hover:bg-background border-b border-border dark:border-[#23272c]">
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 pl-6">Vendor</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">Bill #</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">Payment Date</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">Method</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">Reference</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 text-right pr-6">Amount</TableHead>
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
                      <div className="h-16 w-16 rounded-full bg-muted dark:bg-[#121418] flex items-center justify-center mb-2">
                        <Wallet className="h-8 w-8 text-slate-400 dark:text-muted-foreground" />
                      </div>
                      <p className="text-base font-semibold text-foreground dark:text-slate-200">No vendor payments found</p>
                      <p className="text-sm text-muted-foreground dark:text-slate-400 max-w-sm mx-auto">
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
                  <TableRow key={p.id} className="group hover:bg-muted/50 dark:hover:bg-[#1c2128]/50 border-b border-border dark:border-[#23272c] transition-colors">
                    <TableCell className="pl-6 py-4 font-semibold text-foreground dark:text-slate-200 text-sm">
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
                    <TableCell className="py-4 text-sm font-medium text-muted-foreground dark:text-slate-400">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="py-4">
                      <PaymentMethodBadge method={p.paymentMethod || 'UNKNOWN'} />
                    </TableCell>
                    <TableCell className="py-4 font-mono text-xs font-medium text-muted-foreground dark:text-slate-400">
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
          <div className="border-t border-border dark:border-[#23272c] px-6 py-4 bg-muted/50 dark:bg-[#181a20]">
            <p className="text-xs font-medium text-muted-foreground dark:text-slate-400">Showing <span className="font-bold text-foreground dark:text-slate-200">{filtered.length}</span> of {payments.length} payments</p>
          </div>
        )}
      </Card>
    </div>
  )
}
