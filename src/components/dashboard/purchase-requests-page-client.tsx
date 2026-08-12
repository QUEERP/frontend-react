import { toast } from 'sonner';
import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom';
import {  useLocation, useNavigate  } from 'react-router-dom';
import { ClipboardList, Plus, Search, Clock, CheckCircle, XCircle, ArrowRightCircle, FileText, Filter, ChevronRight, DownloadIcon, Eye, ShoppingCart } from 'lucide-react'
import { purchaseRequestsAPI, PurchaseRequest, PR_STATUS } from '@/lib/api/purchase'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  DRAFT: { label: 'Draft', color: 'bg-muted text-foreground dark:bg-slate-800 dark:text-slate-300 border-border dark:border-slate-700', icon: FileText },
  PENDING_APPROVAL: { label: 'Pending', color: 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20', icon: Clock },
  APPROVED: { label: 'Approved', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20', icon: XCircle },
  CONVERTED: { label: 'Converted', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20', icon: ArrowRightCircle },
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
  const steps = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'CONVERTED']
  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      {steps.map((s, i) => {
        const cfg = STATUS_CONFIG[s]
        const Icon = cfg.icon
        return (
          <React.Fragment key={s}>
            <div className={`flex flex-1 w-full flex-col items-center justify-center rounded-2xl border px-4 py-5 shadow-sm transition-colors ${cfg.color}`}>
              <Icon className="h-6 w-6 mb-2 opacity-80" />
              <span className="text-3xl font-bold">{counts[s] || 0}</span>
              <span className="text-[11px] font-bold uppercase tracking-wider mt-1 opacity-90">{cfg.label}</span>
            </div>
            {i < steps.length - 1 && <ChevronRight className="hidden sm:block h-5 w-5 shrink-0 text-slate-300 dark:text-muted-foreground mx-1" />}
          </React.Fragment>
        )
      })}
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
    <div className="flex min-h-svh flex-col gap-6 bg-background dark:bg-slate-950 px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0 transition-colors">
      {/* Modernized Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card dark:bg-slate-900 p-6 rounded-2xl border border-border dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex min-w-0 items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl hidden sm:block">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-2xl font-bold text-foreground dark:text-slate-100 tracking-tight">Purchase Requests</span>
            <span className="text-sm font-medium text-muted-foreground dark:text-slate-400 mt-0.5">Manage and approve internal purchase requisitions</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={downloadReport} className="h-10 rounded-xl border-border dark:border-slate-700 bg-card dark:bg-slate-800 hover:bg-muted dark:hover:bg-slate-800/80 text-foreground dark:text-slate-200 font-semibold gap-2 shadow-sm cursor-pointer transition-colors">
            <DownloadIcon className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            Export
          </Button>
          <Link to={`/dashboard/${businessId}/purchase-requests/new`}>
            <Button className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 shadow-sm cursor-pointer transition-colors">
              <Plus className="h-4 w-4" />
              New Request
            </Button>
          </Link>
        </div>
      </div>

      {!isLoading && <WorkflowPipeline counts={counts} />}

      {/* Main Content Area */}
      <div className="rounded-2xl border border-border dark:border-slate-800 bg-card dark:bg-slate-900 shadow-sm overflow-hidden transition-colors">
        <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between border-b border-border dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted dark:bg-slate-800/50 text-muted-foreground dark:text-slate-400 rounded-lg">
              <Filter className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
                Directory
                <span className="bg-muted dark:bg-slate-800 text-muted-foreground dark:text-slate-300 font-semibold px-2 py-0.5 rounded-md text-xs">
                  {filtered.length}
                </span>
              </h2>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full max-w-sm sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-muted-foreground" />
              <Input
                placeholder="Search by request number..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-xl border-border dark:border-slate-700 bg-muted dark:bg-slate-950 focus-visible:ring-blue-500 dark:text-slate-100 transition-colors shadow-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-full sm:w-44 rounded-xl border-border dark:border-slate-700 bg-muted dark:bg-slate-950 dark:text-slate-100 focus:ring-blue-500 transition-colors shadow-sm">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border dark:border-slate-800 dark:bg-slate-900">
                <SelectItem value="all">All Status</SelectItem>
                {PR_STATUS.map(s => <SelectItem key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl dark:bg-slate-800" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center">
              <div className="p-4 bg-muted dark:bg-slate-800/50 rounded-full mb-4">
                <ClipboardList className="h-8 w-8 text-slate-400 dark:text-muted-foreground" />
              </div>
              <h3 className="text-base font-bold text-foreground dark:text-slate-200">No purchase requests found</h3>
              <p className="mt-1 text-sm text-muted-foreground dark:text-slate-400 max-w-sm mb-4">
                {search || statusFilter !== 'all' ? 'Try adjusting your search or status filters.' : 'Create your first purchase request to get started.'}
              </p>
              {!(search || statusFilter !== 'all') && (
                <Link to={`/dashboard/${businessId}/purchase-requests/new`}>
                  <Button variant="outline" className="rounded-xl border-border dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Create First Request</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/80 dark:bg-slate-900/50">
                  <TableRow className="hover:bg-background border-border dark:border-slate-800">
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
                          {r.status === 'CONVERTED' && (
                            <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wide bg-indigo-100 text-indigo-700 border border-indigo-200">
                              <ArrowRightCircle className="h-3.5 w-3.5" />
                              Converted
                            </span>
                          )}
                          <Link to={`/dashboard/${businessId}/purchase-requests/${r.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-500/10 rounded-lg">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {filtered.length > 0 && (
            <div className="border-t border-border dark:border-slate-800 px-6 py-4">
              <p className="text-xs font-medium text-muted-foreground dark:text-slate-400">
                Showing {filtered.length} of {requests.length} total requests
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
