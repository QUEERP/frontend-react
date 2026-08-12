import { toast } from 'sonner';
import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import {  useLocation  } from 'react-router-dom';
import { Truck, Plus, Search, Filter, CheckCircle, Clock, Package, MoreVertical, Eye, Trash2, Loader2, Download, CheckCircle2 } from 'lucide-react'
import { grnAPI, GRN } from '@/lib/api/purchase'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { SidebarTrigger } from '@/components/ui/sidebar'

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
    <div className="flex min-h-svh flex-col gap-6 bg-background dark:bg-[#121418] px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card dark:bg-[#181a20] p-6 rounded-2xl border border-border dark:border-[#23272c] shadow-sm">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="sm:hidden -ml-2 size-9 rounded-full relative cursor-pointer border border-border/60 bg-muted hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 shadow-sm transition-all dark:bg-[#181a20] dark:border-[#23272c] dark:hover:bg-[#1c2128] dark:hover:border-blue-900/50" />
          <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl hidden sm:flex items-center justify-center">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground dark:text-slate-100 tracking-tight">Goods Receive Notes</h1>
            <p className="text-sm font-medium text-muted-foreground dark:text-slate-400 mt-0.5">
              Track goods received against purchase orders.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link to={`/dashboard/${businessId}/grn/new`} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2">
              <Plus className="h-4 w-4" />
              <span className="font-semibold">New GRN</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl border-border dark:border-[#23272c] shadow-sm bg-card dark:bg-[#181a20] hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground dark:text-slate-400">Total GRNs</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground dark:text-slate-100">{grns.length}</div>
            <p className="text-xs font-medium text-muted-foreground dark:text-slate-400 mt-1">All-time recorded</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border dark:border-[#23272c] shadow-sm bg-card dark:bg-[#181a20] hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground dark:text-slate-400">Confirmed</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground dark:text-slate-100">{confirmed}</div>
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1">Stock updated</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border dark:border-[#23272c] shadow-sm bg-card dark:bg-[#181a20] hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground dark:text-slate-400">Partial</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground dark:text-slate-100">{partial}</div>
            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-1">Incomplete delivery</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border dark:border-[#23272c] shadow-sm bg-card dark:bg-[#181a20] hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground dark:text-slate-400">Pending Drafts</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-muted dark:bg-slate-800 flex items-center justify-center">
              <Truck className="h-4 w-4 text-muted-foreground dark:text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground dark:text-slate-100">{pending}</div>
            <p className="text-xs font-medium text-muted-foreground dark:text-slate-400 mt-1">Needs confirmation</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="rounded-2xl border-border dark:border-[#23272c] shadow-sm bg-card dark:bg-[#181a20] overflow-hidden flex-1 flex flex-col min-w-0">
        <div className="p-6 border-b border-border dark:border-[#23272c] bg-muted/50 dark:bg-[#181a20] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search GRN # or vendor…" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="pl-9 h-10 rounded-xl border-border dark:border-[#23272c] bg-card dark:bg-[#121418] w-full focus-visible:ring-blue-500" 
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 rounded-xl border-border dark:border-[#23272c] bg-card dark:bg-[#121418] w-full sm:w-40 text-foreground dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <SelectValue placeholder="All Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-0 border-t-0 flex-1 overflow-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-muted/80 dark:bg-[#121418]/80 sticky top-0 z-10 backdrop-blur-sm">
              <TableRow className="hover:bg-background border-b border-border dark:border-[#23272c]">
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 pl-6">GRN #</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">Vendor</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">PO Number</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">Warehouse</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">Received Date</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">Items</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">Total Received</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">Status</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-16 w-16 rounded-full bg-muted dark:bg-[#121418] flex items-center justify-center mb-2">
                        <Truck className="h-8 w-8 text-slate-400 dark:text-muted-foreground" />
                      </div>
                      <p className="text-base font-semibold text-foreground dark:text-slate-200">No Goods Receive Notes found</p>
                      <p className="text-sm text-muted-foreground dark:text-slate-400 max-w-sm mx-auto">
                        {search || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Create a GRN from an approved Purchase Order.'}
                      </p>
                      {(search || statusFilter !== 'all') && (
                        <Button
                          variant="outline"
                          onClick={() => { setSearch(''); setStatusFilter('all'); }}
                          className="mt-4 rounded-xl border-border dark:border-[#23272c]"
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(g => {
                  const totalReceived = g.items?.reduce((s, i) => s + (i.quantityReceived || 0), 0) || 0
                  const totalDamaged = g.items?.reduce((s, i) => s + (i.quantityDamaged || 0), 0) || 0
                  return (
                    <TableRow key={g.id} className="group hover:bg-muted/50 dark:hover:bg-[#1c2128]/50 border-b border-border dark:border-[#23272c] transition-colors">
                      <TableCell className="pl-6 py-4">
                        <Link to={`/dashboard/${businessId}/grn/${g.id}`} className="font-bold text-sm text-blue-700 dark:text-blue-400 cursor-pointer hover:underline">
                          {g.grnNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="py-4 font-semibold text-foreground dark:text-slate-200 text-sm">
                        {g.vendor?.name || '—'}
                      </TableCell>
                      <TableCell className="py-4 text-sm font-mono font-medium text-muted-foreground dark:text-slate-400">
                        {g.purchaseOrder?.poNumber || '—'}
                      </TableCell>
                      <TableCell className="py-4 text-sm text-foreground dark:text-slate-300">
                        {g.warehouse?.name || '—'}
                      </TableCell>
                      <TableCell className="py-4 text-sm font-medium text-muted-foreground dark:text-slate-400">
                        {new Date(g.receivedDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="py-4 text-sm font-bold text-foreground dark:text-slate-300">
                        {g.items?.length || 0}
                      </TableCell>
                      <TableCell className="py-4 text-sm">
                        <span className="font-bold text-foreground dark:text-slate-200">{totalReceived}</span>
                        {totalDamaged > 0 && <span className="text-xs font-semibold text-rose-500 ml-1">({totalDamaged} dmg)</span>}
                      </TableCell>
                      <TableCell className="py-4">
                        <GRNStatusBadge status={g.status} />
                      </TableCell>
                      <TableCell className="pr-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg cursor-pointer text-slate-400 hover:text-foreground hover:bg-muted dark:hover:bg-[#23272c] dark:hover:text-slate-200">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-border dark:border-[#23272c] dark:bg-[#181a20]">
                            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild className="cursor-pointer font-medium text-foreground dark:text-slate-300 py-2.5">
                              <Link to={`/dashboard/${businessId}/grn/${g.id}`} className="flex items-center gap-2">
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="dark:bg-[#23272c]" />
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
