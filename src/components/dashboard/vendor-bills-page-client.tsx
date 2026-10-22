import { toast } from 'sonner';
import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import {  useLocation  } from 'react-router-dom';
import { Receipt, Plus, Search, Filter, AlertCircle, Clock, DollarSign, CheckCircle2, FileDown } from 'lucide-react'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { exportVendorBillToPDF } from '@/lib/utils/vendor-bill-pdf'
import { billsAPI, Bill, BILL_STATUS } from '@/lib/api/purchase'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const BILL_STATUS_MAP: Record<string, string> = {
  DRAFT: 'Draft',
  UNPAID: 'Unpaid',
  PARTIALLY_PAID: 'Partial',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
}

function BillStatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase()
  if (['PAID'].includes(s)) {
    return <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">{BILL_STATUS_MAP[s] || s}</Badge>
  }
  if (['PARTIALLY_PAID'].includes(s)) {
    return <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">{BILL_STATUS_MAP[s] || s}</Badge>
  }
  if (['UNPAID'].includes(s)) {
    return <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider border bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">{BILL_STATUS_MAP[s] || s}</Badge>
  }
  if (['OVERDUE'].includes(s)) {
    return <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider border bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">{BILL_STATUS_MAP[s] || s}</Badge>
  }
  if (['DRAFT', 'CANCELLED'].includes(s)) {
    return <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider border bg-muted text-foreground border-border dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">{BILL_STATUS_MAP[s] || s}</Badge>
  }
  return <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider border">{BILL_STATUS_MAP[s] || s}</Badge>
}

function isDueOverdue(dueDate?: string | null) {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

export default function VendorBillsPageClient() {
  const { business } = useBusinessData();
  const pathname = useLocation().pathname
  const { toast } = useToast()
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || ''

  const [bills, setBills] = useState<Bill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchData = useCallback(async () => {
    if (!businessId) return
    try {
      setIsLoading(true)
      const res = await billsAPI.getAll(businessId)
      setBills(res.bills || [])
    } catch {
      toast({ title: 'Failed to load vendor bills', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [businessId])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = bills.filter(b => {
    const term = search.toLowerCase()
    const matchSearch = !term || b.billNumber.toLowerCase().includes(term) || (b.vendor?.name || '').toLowerCase().includes(term)
    const matchStatus = statusFilter === 'all' || b.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalOutstanding = bills.reduce((s, b) => s + Number(b.outstandingAmount || 0), 0)
  const overdue = bills.filter(b => b.status !== 'PAID' && b.status !== 'CANCELLED' && isDueOverdue(b.dueDate)).length
  const unpaid = bills.filter(b => ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'].includes(b.status)).length

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="sm:hidden -ml-2 size-9 rounded-full relative cursor-pointer border border-border/60 bg-muted hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 shadow-sm transition-all" />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Vendor Bills
            </h1>
            <p className="text-sm font-medium text-muted-foreground mt-1">
              Track payables and outstanding vendor balances.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to={`/dashboard/${businessId}/vendor-bills/new`}>
            <Button className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm gap-2">
              <Plus className="h-4 w-4" />
              <span>New Bill</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Total Bills
                </p>
                <div className="text-2xl font-black text-foreground">
                  {isLoading ? <Skeleton className="h-8 w-20" /> : bills.length}
                </div>
                <p className="text-xs font-medium text-muted-foreground">All recorded bills</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
                <Receipt className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Unpaid
                </p>
                <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                  {isLoading ? <Skeleton className="h-8 w-20" /> : unpaid}
                </div>
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400">Awaiting payment</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900/50">
                <AlertCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Overdue
                </p>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-500">
                  {isLoading ? <Skeleton className="h-8 w-20" /> : overdue}
                </div>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-500">Past payment deadline</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Outstanding
                </p>
                <div className="text-2xl font-black text-foreground truncate max-w-[170px]" title={`₹${totalOutstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}>
                  {isLoading ? <Skeleton className="h-8 w-32" /> : `₹${totalOutstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                </div>
                <p className="text-xs font-medium text-muted-foreground">Total payable balance</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
                <DollarSign className="h-6 w-6" />
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
                Showing <span className="text-foreground font-semibold">{filtered.length}</span> of {bills.length} bills
              </CardDescription>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search bill # or vendor…" 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  className="pl-9 h-10 rounded-xl border-border bg-card focus-visible:ring-blue-500 text-sm shadow-sm" 
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 rounded-xl border-border bg-card w-full sm:w-40 text-sm shadow-sm">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-400" />
                    <SelectValue placeholder="All Status" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border">
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(BILL_STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <div className="p-0 border-t-0 flex-1 overflow-x-auto max-w-full w-full min-w-0 custom-scrollbar">
          <Table className="w-full min-w-[950px]">
            <TableHeader className="bg-muted dark:bg-[#181a20] sticky top-0 z-10 border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <TableRow className="hover:bg-muted dark:hover:bg-[#181a20] border-b border-border">
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground pl-6">Bill #</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Vendor</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Bill Date</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Due Date</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">Total</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">Outstanding</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-4">
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-2">
                        <Receipt className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-base font-semibold text-foreground">No vendor bills found</p>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        {search || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Create a new vendor bill to start tracking payables.'}
                      </p>
                      {(search || statusFilter !== 'all') && (
                        <Button
                          variant="outline"
                          onClick={() => { setSearch(''); setStatusFilter('all'); }}
                          className="mt-4 rounded-xl border-border"
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(b => {
                  const isOver = b.status !== 'PAID' && b.status !== 'CANCELLED' && isDueOverdue(b.dueDate)
                  return (
                    <TableRow key={b.id} className={cn(
                      "group hover:bg-muted/50 border-b border-border transition-colors",
                      isOver && "bg-red-50/20 hover:bg-red-50/50"
                    )}>
                      <TableCell className="pl-6 py-4">
                        <Link to={`/dashboard/${businessId}/vendor-bills/${b.id}`} className="font-bold text-sm text-blue-700 dark:text-blue-400 cursor-pointer hover:underline">
                          {b.billNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="py-4 font-semibold text-foreground text-sm">
                        {b.vendor?.name || '—'}
                      </TableCell>
                      <TableCell className="py-4 text-sm font-medium text-muted-foreground">
                        {new Date(b.billDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="py-4 text-sm font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className={isOver ? 'text-red-600 font-semibold' : 'text-muted-foreground'}>
                            {b.dueDate ? new Date(b.dueDate).toLocaleDateString() : '—'}
                          </span>
                          {isOver && <AlertCircle className="size-3.5 text-red-500" />}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-right text-sm font-bold text-foreground">
                        ₹{Number(b.totalAmount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="py-4 text-right text-sm font-bold text-rose-600 dark:text-rose-400">
                        ₹{Number(b.outstandingAmount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="py-4">
                        <BillStatusBadge status={b.status} />
                      </TableCell>
                      <TableCell className="pr-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/dashboard/${businessId}/vendor-bills/${b.id}`}>
                            <Button variant="outline" size="sm" className="h-8 rounded-lg border-border hover:bg-muted font-medium">
                              View
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm" className="h-8 rounded-lg border-border hover:bg-muted" onClick={() => exportVendorBillToPDF(b, business)}>
                            <FileDown className="h-4 w-4" />
                          </Button>
                          {['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'].includes(b.status) && (
                            <Link to={`/dashboard/${businessId}/vendor-bills/${b.id}/pay`}>
                              <Button size="sm" className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm">
                                Pay
                              </Button>
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
        {filtered.length > 0 && (
          <div className="border-t border-border px-6 py-4">
            <p className="text-xs font-medium text-muted-foreground">Showing <span className="font-bold text-foreground">{filtered.length}</span> of {bills.length} bills</p>
          </div>
        )}
      </Card>
    </div>
  )
}
