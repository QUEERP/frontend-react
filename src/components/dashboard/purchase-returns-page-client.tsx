import { toast } from 'sonner';
import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import {  useLocation  } from 'react-router-dom';
import { Undo2, Search, Plus, ArrowUpRight, CheckCircle2, Clock, DollarSign } from 'lucide-react'
import { purchaseReturnsAPI, PurchaseReturn } from '@/lib/api/purchase'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

function ReturnStatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase()
  if (['RETURNED', 'COMPLETED'].includes(s)) {
    return <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">{s}</Badge>
  }
  if (['DRAFT'].includes(s)) {
    return <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider border bg-muted text-foreground border-border dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">{s}</Badge>
  }
  return <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">{s}</Badge>
}

function RefundStatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase()
  if (['REFUNDED', 'SETTLED'].includes(s)) {
    return <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">{s}</Badge>
  }
  if (['PARTIAL'].includes(s)) {
    return <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">{s}</Badge>
  }
  return <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider border bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">{s}</Badge>
}

export default function PurchaseReturnsPageClient() {
  const pathname = useLocation().pathname
  const { toast } = useToast()
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || ''
  const [returns, setReturns] = useState<PurchaseReturn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async () => {
    if (!businessId) return
    try { 
      setIsLoading(true)
      const r = await purchaseReturnsAPI.getAll(businessId)
      setReturns(r.returns || []) 
    }
    catch { toast({ title: 'Failed to load purchase returns', variant: 'destructive' }) }
    finally { setIsLoading(false) }
  }, [businessId])
  
  useEffect(() => { fetchData() }, [fetchData])

  const filtered = returns.filter(r => !search || r.returnNumber.toLowerCase().includes(search.toLowerCase()) || (r.vendor?.name || '').toLowerCase().includes(search.toLowerCase()))

  const totalAmount = returns.reduce((s, r) => s + Number(r.totalAmount || 0), 0)
  const settled = returns.filter(r => ['REFUNDED', 'SETTLED'].includes((r.refundStatus || '').toUpperCase())).length
  const pending = returns.filter(r => ['PENDING', 'PARTIAL', 'DRAFT'].includes((r.refundStatus || '').toUpperCase()) || r.status === 'DRAFT').length
  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0 max-w-full overflow-x-hidden">
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="sm:hidden -ml-2 size-9 rounded-full relative cursor-pointer border border-border/60 bg-muted hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 shadow-sm transition-all" />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Purchase Returns
            </h1>
            <p className="text-sm font-medium text-muted-foreground mt-1">
              Manage goods returned to vendors and refunds.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to={`/dashboard/${businessId}/purchase-returns/new`}>
            <Button className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm gap-2">
              <Plus className="h-4 w-4" />
              <span>New Return</span>
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
                  Total Returns
                </p>
                <div className="text-2xl font-black text-foreground">
                  {isLoading ? <Skeleton className="h-8 w-20" /> : returns.length}
                </div>
                <p className="text-xs font-medium text-muted-foreground">All returned goods</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
                <Undo2 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Settled / Refunded
                </p>
                <div className="text-2xl font-black text-foreground">
                  {isLoading ? <Skeleton className="h-8 w-20" /> : settled}
                </div>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Refund completed</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Pending Refund
                </p>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-500">
                  {isLoading ? <Skeleton className="h-8 w-20" /> : pending}
                </div>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-500">Awaiting credit note/refund</p>
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
                  Total Value
                </p>
                <div className="text-2xl font-black text-foreground truncate max-w-[170px]" title={`₹${totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}>
                  {isLoading ? <Skeleton className="h-8 w-32" /> : `₹${totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                </div>
                <p className="text-xs font-medium text-muted-foreground">Total value returned</p>
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
                Showing <span className="text-foreground font-semibold">{filtered.length}</span> of {returns.length} returns
              </CardDescription>
            </div>
            
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search return # or vendor…" 
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
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground pl-6">Return #</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Vendor</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Refund Status</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">Amount</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground pr-6 text-right">Date</TableHead>
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
                        <Undo2 className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-base font-semibold text-foreground">No purchase returns found</p>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        {search ? 'Try adjusting your search query.' : 'Create a new purchase return to track returned goods.'}
                      </p>
                      {search && (
                        <Button
                          variant="outline"
                          onClick={() => setSearch('')}
                          className="mt-4 rounded-xl border-border"
                        >
                          Clear Search
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(r => (
                  <TableRow key={r.id} className="group hover:bg-muted/50 border-b border-border transition-colors">
                    <TableCell className="pl-6 py-4">
                      <Link to={`/dashboard/${businessId}/purchase-returns/${r.id}`} className="font-mono font-bold text-sm text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1">
                        {r.returnNumber}
                        <ArrowUpRight className="size-3 opacity-50" />
                      </Link>
                    </TableCell>
                    <TableCell className="py-4 font-semibold text-foreground text-sm">
                      {r.vendor?.name || '—'}
                    </TableCell>
                    <TableCell className="py-4">
                      <ReturnStatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="py-4">
                      <RefundStatusBadge status={r.refundStatus} />
                    </TableCell>
                    <TableCell className="py-4 text-right font-bold text-sm text-foreground">
                      ₹{Number(r.totalAmount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell className="pr-6 py-4 text-right text-sm font-medium text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {filtered.length > 0 && (
          <div className="border-t border-border px-6 py-4">
            <p className="text-xs font-medium text-muted-foreground">Showing <span className="font-bold text-foreground">{filtered.length}</span> of {returns.length} returns</p>
          </div>
        )}
      </Card>
    </div>
  )
}
