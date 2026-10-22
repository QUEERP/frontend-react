import { exportGRNToPDF } from '@/lib/utils/grn-pdf';
import { FileDown } from 'lucide-react';
import { toast } from 'sonner';
import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import {  useLocation  } from 'react-router-dom';
import { Truck, Plus, Search, Filter, CheckCircle, Clock, Package, MoreVertical, Eye, Trash2, Loader2, Download, CheckCircle2 } from 'lucide-react'
import { grnAPI, GRN } from '@/lib/api/purchase'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useBusinessData } from '@/components/dashboard/business-data-provider'

function GRNStatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase()
  if (['CONFIRMED', 'RECEIVED'].includes(s)) {
    return <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">{status}</Badge>
  }
  if (['PARTIAL'].includes(s)) {
    return <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">{status}</Badge>
  }
  if (['DRAFT', 'PENDING'].includes(s)) {
    return <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider border bg-muted text-foreground border-border dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">{status}</Badge>
  }
  return <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider border">{status}</Badge>
}

export default function GRNPageClient() {
  const { business } = useBusinessData();
  const pathname = useLocation().pathname
  const { toast } = useToast()
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || ''

  const [grns, setGrns] = useState<GRN[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    if (!businessId) return
    try {
      setIsLoading(true)
      const res = await grnAPI.getAll(businessId)
      setGrns(res.grns || [])
    } catch {
      toast({ title: 'Failed to load GRNs', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [businessId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true)
      await grnAPI.delete(businessId, id)
      toast({ title: 'GRN deleted successfully' })
      fetchData()
    } catch (error: any) {
      toast({ title: 'Failed to delete GRN', description: error?.message, variant: 'destructive' })
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const filtered = grns.filter(g => {
    const term = search.toLowerCase()
    const matchSearch = !term || g.grnNumber.toLowerCase().includes(term) || (g.vendor?.name || '').toLowerCase().includes(term)
    const matchStatus = statusFilter === 'all' || g.status === statusFilter
    return matchSearch && matchStatus
  })

  const confirmed = grns.filter(g => g.status === 'CONFIRMED').length
  const pending = grns.filter(g => g.status === 'DRAFT').length
  const partial = grns.filter(g => g.status === 'PARTIAL').length

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background dark:bg-[#121418]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-500" />
          <p className="text-sm font-medium text-muted-foreground dark:text-slate-400">Loading goods receive notes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="sm:hidden -ml-2 size-9 rounded-full relative cursor-pointer border border-border/60 bg-muted hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 shadow-sm transition-all" />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Goods Receive Notes
            </h1>
            <p className="text-sm font-medium text-muted-foreground mt-1">
              Track goods received against purchase orders.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to={`/dashboard/${businessId}/grn/new`}>
            <Button className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm gap-2">
              <Plus className="h-4 w-4" />
              <span>New GRN</span>
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
                  Total GRNs
                </p>
                <div className="text-2xl font-black text-foreground">
                  {grns.length}
                </div>
                <p className="text-xs font-medium text-muted-foreground">All-time recorded</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
                <Package className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Confirmed
                </p>
                <div className="text-2xl font-black text-foreground">
                  {confirmed}
                </div>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Stock updated</p>
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
                  Partial
                </p>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-500">
                  {partial}
                </div>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-500">Incomplete delivery</p>
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
                  Pending Drafts
                </p>
                <div className="text-2xl font-black text-foreground">
                  {pending}
                </div>
                <p className="text-xs font-medium text-muted-foreground">Needs confirmation</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
                <Truck className="h-6 w-6" />
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
                Showing <span className="text-foreground font-semibold">{filtered.length}</span> of {grns.length} total GRNs
              </CardDescription>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search GRN # or vendor…" 
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
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <div className="p-0 border-t-0 flex-1 overflow-x-auto max-w-full w-full min-w-0 custom-scrollbar">
          <Table className="w-full min-w-[950px]">
            <TableHeader className="bg-muted dark:bg-[#181a20] sticky top-0 z-10 border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <TableRow className="hover:bg-muted dark:hover:bg-[#181a20] border-b border-border">
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground pl-6">GRN #</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Vendor</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">PO Number</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Warehouse</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Received Date</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Items</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Received</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-2">
                        <Truck className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-base font-semibold text-foreground">No Goods Receive Notes found</p>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        {search || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Create a GRN from an approved Purchase Order.'}
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
                filtered.map(g => {
                  const poNum = g.purchaseOrder?.poNumber || (g as any).poNumber || '—'
                  const whName = g.warehouse?.name || (g as any).warehouseName || '—'
                  const vendorName = g.vendor?.name || g.purchaseOrder?.vendor?.name || '—'
                  const totalItems = g.items?.length || 0
                  const totalQty = g.items?.reduce((s, i) => s + (i.quantityReceived || 0), 0) ?? 0

                  return (
                    <TableRow key={g.id} className="group hover:bg-muted/50 border-b border-border transition-colors">
                      <TableCell className="pl-6 py-4">
                        <Link to={`/dashboard/${businessId}/grn/${g.id}`} className="font-bold text-sm text-blue-700 dark:text-blue-400 hover:underline">
                          {g.grnNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="py-4 font-semibold text-foreground text-sm">{vendorName}</TableCell>
                      <TableCell className="py-4 font-mono text-sm text-muted-foreground">{poNum}</TableCell>
                      <TableCell className="py-4 text-sm text-muted-foreground">{whName}</TableCell>
                      <TableCell className="py-4 text-sm text-muted-foreground">{new Date(g.receivedDate).toLocaleDateString()}</TableCell>
                      <TableCell className="py-4 text-sm font-medium text-foreground">{totalItems}</TableCell>
                      <TableCell className="py-4 text-sm font-bold text-foreground">{totalQty}</TableCell>
                      <TableCell className="py-4"><GRNStatusBadge status={g.status} /></TableCell>
                      <TableCell className="py-4 text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-border bg-card">
                            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link to={`/dashboard/${businessId}/grn/${g.id}`} className="cursor-pointer font-medium py-2.5">
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer font-medium text-blue-600 dark:text-blue-400 py-2.5" onClick={() => exportGRNToPDF(g, business)}>
                              <FileDown className="mr-2 h-4 w-4" /> Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="cursor-pointer font-medium text-rose-600 dark:text-rose-400 focus:text-rose-700 focus:bg-rose-50 dark:focus:bg-rose-500/10 py-2.5"
                              onClick={() => setDeleteId(g.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete GRN
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
            <p className="text-xs font-medium text-muted-foreground">
              Showing {filtered.length} of {grns.length} total GRNs
            </p>
          </div>
        )}
      </Card>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl border-border dark:border-[#23272c] bg-card dark:bg-[#181a20]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold tracking-tight text-foreground dark:text-slate-100">Delete GRN</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground dark:text-slate-400">
              Are you sure you want to delete this Goods Receive Note? This will reverse any stock increases associated with it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-10 rounded-xl border-border dark:border-[#23272c] hover:bg-muted dark:hover:bg-[#1c2128]">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                deleteId && handleDelete(deleteId);
              }}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}






