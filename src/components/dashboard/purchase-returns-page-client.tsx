import { toast } from 'sonner';
import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import {  useLocation  } from 'react-router-dom';
import { Undo2, Search, Plus, ArrowUpRight } from 'lucide-react'
import { purchaseReturnsAPI, PurchaseReturn } from '@/lib/api/purchase'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
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
  }, [businessId, toast])
  
  useEffect(() => { fetchData() }, [fetchData])

  const filtered = returns.filter(r => !search || r.returnNumber.toLowerCase().includes(search.toLowerCase()) || (r.vendor?.name || '').toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background dark:bg-[#121418] px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card dark:bg-[#181a20] p-6 rounded-2xl border border-border dark:border-[#23272c] shadow-sm">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="sm:hidden -ml-2 size-9 rounded-full relative cursor-pointer border border-border/60 bg-muted hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 shadow-sm transition-all dark:bg-[#181a20] dark:border-[#23272c] dark:hover:bg-[#1c2128] dark:hover:border-blue-900/50" />
          <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl hidden sm:flex items-center justify-center">
            <Undo2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground dark:text-slate-100 tracking-tight">Purchase Returns</h1>
            <p className="text-sm font-medium text-muted-foreground dark:text-slate-400 mt-0.5">Manage goods returned to vendors and refunds</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link to={`/dashboard/${businessId}/purchase-returns/new`} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2">
              <Plus className="h-4 w-4" />
              <span className="font-semibold">New Return</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <Card className="rounded-2xl border-border dark:border-[#23272c] shadow-sm bg-card dark:bg-[#181a20] overflow-hidden flex-1 flex flex-col min-w-0">
        <div className="p-6 border-b border-border dark:border-[#23272c] bg-muted/50 dark:bg-[#181a20] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search return # or vendor…" 
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
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 pl-6">Return #</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">Vendor</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">Status</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">Refund Status</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 text-right">Amount</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 pr-6">Date</TableHead>
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
                        <Undo2 className="h-8 w-8 text-slate-400 dark:text-muted-foreground" />
                      </div>
                      <p className="text-base font-semibold text-foreground dark:text-slate-200">No purchase returns found</p>
                      <p className="text-sm text-muted-foreground dark:text-slate-400 max-w-sm mx-auto">
                        {search ? 'Try adjusting your search query.' : 'Create a new purchase return to track returned goods.'}
                      </p>
                      {search && (
                        <Button
                          variant="outline"
                          onClick={() => setSearch('')}
                          className="mt-4 rounded-xl border-border dark:border-[#23272c]"
                        >
                          Clear Search
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(r => (
                  <TableRow key={r.id} className="group hover:bg-muted/50 dark:hover:bg-[#1c2128]/50 border-b border-border dark:border-[#23272c] transition-colors">
                    <TableCell className="pl-6 py-4">
                      <Link to={`/dashboard/${businessId}/purchase-returns/${r.id}`} className="font-mono font-bold text-sm text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1">
                        {r.returnNumber}
                        <ArrowUpRight className="size-3 opacity-50" />
                      </Link>
                    </TableCell>
                    <TableCell className="py-4 font-semibold text-foreground dark:text-slate-200 text-sm">
                      {r.vendor?.name || '—'}
                    </TableCell>
                    <TableCell className="py-4">
                      <ReturnStatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="py-4">
                      <RefundStatusBadge status={r.refundStatus} />
                    </TableCell>
                    <TableCell className="py-4 text-right font-bold text-sm text-foreground dark:text-slate-200">
                      ₹{Number(r.totalAmount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell className="pr-6 py-4 text-sm font-medium text-muted-foreground dark:text-slate-400">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {filtered.length > 0 && (
          <div className="border-t border-border dark:border-[#23272c] px-6 py-4 bg-muted/50 dark:bg-[#181a20]">
            <p className="text-xs font-medium text-muted-foreground dark:text-slate-400">Showing <span className="font-bold text-foreground dark:text-slate-200">{filtered.length}</span> of {returns.length} returns</p>
          </div>
        )}
      </Card>
    </div>
  )
}
