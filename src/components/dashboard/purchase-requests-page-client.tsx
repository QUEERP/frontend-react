import { toast } from 'sonner';
import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom';
import {  useLocation, useNavigate  } from 'react-router-dom';
import { ClipboardList, Plus, Search, Clock, CheckCircle, XCircle, ArrowRightCircle, FileText, Filter, ChevronRight, DownloadIcon, Eye, ShoppingCart, MoreHorizontal, Pencil, Trash } from 'lucide-react'
import { purchaseRequestsAPI, PurchaseRequest, PR_STATUS } from '@/lib/api/purchase'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  DRAFT: { label: 'Draft', color: 'bg-muted text-foreground dark:bg-slate-800 dark:text-slate-300 border-border dark:border-slate-700', icon: FileText },
  PENDING_APPROVAL: { label: 'Pending', color: 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20', icon: Clock },
  APPROVED: { label: 'Approved', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20', icon: XCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700', icon: XCircle },
  CONVERTED_TO_PO: { label: 'Converted to PO', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20', icon: ArrowRightCircle },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-muted text-foreground dark:bg-slate-800 dark:text-slate-300 border-border dark:border-slate-700', icon: FileText }
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border shadow-sm ${cfg.color}`}>
      <Icon className="h-3 w-3" />{cfg.label}
    </span>
  )
}

function WorkflowPipeline({ counts }: { counts: Record<string, number> }) {
  const kpis = [
    { label: 'Draft', value: counts['DRAFT'] || 0, sub: 'Initial requests', icon: FileText, color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-50 border-slate-100 dark:bg-slate-800/40 dark:border-slate-700' },
    { label: 'Pending Approval', value: counts['PENDING_APPROVAL'] || 0, sub: 'Awaiting manager signoff', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800' },
    { label: 'Approved', value: counts['APPROVED'] || 0, sub: 'Ready for purchase order', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800' },
    { label: 'Converted to PO', value: counts['CONVERTED_TO_PO'] || 0, sub: 'Fulfillment in progress', icon: ArrowRightCircle, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800' },
  ]

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map(stat => (
        <Card key={stat.label} className="border-border bg-card shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-black text-foreground mt-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground font-medium mt-1">{stat.sub}</p>
              </div>
              <div className={`flex items-center justify-center h-12 w-12 rounded-xl border ${stat.bg} ${stat.color} shadow-sm shrink-0`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function PurchaseRequestsPageClient() {
  const pathname = useLocation().pathname
  const navigate = useNavigate()
  const { toast } = useToast()
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || ''

  const [requests, setRequests] = useState<PurchaseRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchData = useCallback(async () => {
    if (!businessId) return
    try {
      setIsLoading(true)
      const res = await purchaseRequestsAPI.getAll(businessId)
      setRequests(res.requests || [])
    } catch {
      toast({ title: 'Failed to load purchase requests', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [businessId])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = useMemo(() => {
    return requests.filter(r => {
      const term = search.toLowerCase()
      const matchSearch = !term || r.requestNumber.toLowerCase().includes(term)
      const matchStatus = statusFilter === 'all' || r.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [requests, search, statusFilter])

  const counts = useMemo(() => {
    return requests.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }), {} as Record<string, number>)
  }, [requests])

  const downloadReport = () => {
    if (requests.length === 0) {
      toast({ title: 'No data to export', variant: 'destructive' })
      return
    }

    const headers = ['Request #', 'Requester', 'Priority', 'Expected Date', 'Items', 'Status']
    const csvContent = [
      headers.join(','),
      ...requests.map(r => [
        `"${r.requestNumber}"`,
        `"${r.requester?.user?.name || ''}"`,
        `"${r.priority || ''}"`,
        r.expectedDate ? new Date(r.expectedDate).toLocaleDateString() : '',
        r.items?.length || 0,
        `"${r.status}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `PurchaseRequests_Report_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast({ title: 'Report downloaded successfully' })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20'
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
      case 'LOW':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
      default:
        return 'bg-muted text-foreground dark:bg-slate-800 dark:text-slate-300 border-border dark:border-slate-700'
    }
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0 max-w-full overflow-x-hidden">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Purchase Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and approve internal purchase requisitions</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={downloadReport} className="h-10 rounded-xl border-border bg-card hover:bg-muted text-foreground font-medium gap-2 shadow-sm cursor-pointer px-4">
            <DownloadIcon className="h-4 w-4 text-blue-600" />
            Export
          </Button>
          <Button asChild className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium gap-2 shadow-sm cursor-pointer px-5">
            <Link to={`/dashboard/${businessId}/purchase-requests/new`}>
              <Plus className="h-4 w-4" />
              New Request
            </Link>
          </Button>
        </div>
      </div>

      {!isLoading && <WorkflowPipeline counts={counts} />}

      {/* Main Content Area */}
      <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden flex-1 flex flex-col w-full min-w-0 max-w-full">
        <CardHeader className="border-b border-border bg-muted/50 pb-5 pt-6 px-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Directory</CardTitle>
              <CardDescription className="text-sm font-medium text-muted-foreground mt-1">
                Showing <span className="text-foreground font-semibold">{filtered.length}</span> of {requests.length} total requests
              </CardDescription>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by request number..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-10 rounded-xl border-border bg-card focus-visible:ring-blue-500 text-sm shadow-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 w-full sm:w-44 rounded-xl border-border bg-card shadow-sm">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border">
                  <SelectItem value="all">All Status</SelectItem>
                  {PR_STATUS.map(s => <SelectItem key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <div className="p-0 border-t-0 flex-1 overflow-x-auto max-w-full w-full min-w-0 custom-scrollbar">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center">
              <div className="p-4 bg-muted rounded-full mb-4">
                <ClipboardList className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-foreground">No purchase requests found</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm mb-4">
                {search || statusFilter !== 'all' ? 'Try adjusting your search or status filters.' : 'Create your first purchase request to get started.'}
              </p>
              {!(search || statusFilter !== 'all') && (
                <Link to={`/dashboard/${businessId}/purchase-requests/new`}>
                  <Button variant="outline" className="rounded-xl border-border">Create First Request</Button>
                </Link>
              )}
            </div>
          ) : (
            <Table className="w-full min-w-[850px]">
              <TableHeader className="bg-muted dark:bg-[#181a20] sticky top-0 z-10 border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <TableRow className="hover:bg-muted dark:hover:bg-[#181a20] border-b border-border">
                    <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 px-6">Request #</TableHead>
                    <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 px-4">Requester</TableHead>
                    <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 px-4">Priority</TableHead>
                    <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 px-4">Expected Date</TableHead>
                    <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 px-4">Items</TableHead>
                    <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 px-4">Status</TableHead>
                    <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 px-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(r => (
                    <TableRow key={r.id} className="hover:bg-muted/50 dark:hover:bg-slate-800/30 border-border dark:border-slate-800 transition-colors">
                      <TableCell className="px-6 py-4 font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                        {r.requestNumber}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm font-medium text-foreground dark:text-slate-200">
                        {r.requester?.user?.name || '—'}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        {r.priority && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm ${getPriorityColor(r.priority)}`}>
                            {r.priority}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm font-medium text-muted-foreground dark:text-slate-400">
                        {r.expectedDate ? new Date(r.expectedDate).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm font-medium text-muted-foreground dark:text-slate-400">
                        <span className="bg-muted dark:bg-slate-800 text-muted-foreground dark:text-slate-300 font-bold px-2 py-0.5 rounded-md text-[11px]">
                          {r.items?.length || 0}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <StatusBadge status={r.status} />
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {r.status === 'APPROVED' && (
                            <button
                              type="button"
                              title="Convert to Purchase Order"
                              onClick={() => navigate(`/dashboard/${businessId}/purchase-orders/add?fromPR=${r.id}`)}
                              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wide bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors cursor-pointer"
                            >
                              <ShoppingCart className="h-3.5 w-3.5" />
                              Convert to PO
                            </button>
                          )}
                          {r.status === 'CONVERTED_TO_PO' && (
                            <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wide bg-indigo-100 text-indigo-700 border border-indigo-200">
                              <ArrowRightCircle className="h-3.5 w-3.5" />
                              Converted
                            </span>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => navigate(`/dashboard/${businessId}/purchase-requests/${r.id}`)}>
                                <Eye className="h-4 w-4 mr-2" /> View Request
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/dashboard/${businessId}/purchase-requests/${r.id}/edit`)}>
                                <Pencil className="h-4 w-4 mr-2" /> Edit Request
                              </DropdownMenuItem>
                              {r.status !== 'APPROVED' && r.status !== 'CONVERTED_TO_PO' && (
                                <DropdownMenuItem onClick={async () => {
                                  try {
                                    await purchaseRequestsAPI.update(businessId as string, r.id, { status: 'APPROVED' });
                                    toast({ title: 'Approved' });
                                    fetchData();
                                  } catch (err) {}
                                }}>
                                  <CheckCircle className="h-4 w-4 mr-2 text-emerald-600" /> Mark as Approved
                                </DropdownMenuItem>
                              )}
                              {r.status !== 'REJECTED' && r.status !== 'CONVERTED_TO_PO' && (
                                <DropdownMenuItem onClick={async () => {
                                  try {
                                    await purchaseRequestsAPI.update(businessId as string, r.id, { status: 'REJECTED' });
                                    toast({ title: 'Rejected' });
                                    fetchData();
                                  } catch (err) {}
                                }}>
                                  <XCircle className="h-4 w-4 mr-2 text-red-600" /> Mark as Rejected
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={async () => {
                                if (window.confirm('Delete this request?')) {
                                  try {
                                    await purchaseRequestsAPI.delete(businessId as string, r.id);
                                    toast({ title: 'Deleted' });
                                    fetchData();
                                  } catch (err) {}
                                }
                              }}>
                                <Trash className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          )}
          {filtered.length > 0 && (
            <div className="border-t border-border dark:border-slate-800 px-6 py-4">
              <p className="text-xs font-medium text-muted-foreground dark:text-slate-400">
                Showing {filtered.length} of {requests.length} total requests
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
