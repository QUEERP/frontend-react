import { toast } from 'sonner';
import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom';
import {  useNavigate  } from 'react-router-dom';
import {
  BellIcon,
  Building2Icon,
  SearchIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  UserIcon,
  PlusIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
  DownloadIcon,
  SendIcon,
  FileTextIcon,
  CalendarIcon,
  DollarSignIcon,
  CheckIcon,
  ClockIcon,
  AlertTriangleIcon,
  Loader2Icon,
  RefreshCwIcon,
  ChevronDownIcon,
  MoreVerticalIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DashboardModeToggle } from '@/components/dashboard/mode-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { useToast } from '@/components/ui/use-toast'
import { DashboardPageSkeleton } from '@/components/dashboard/dashboard-page-skeleton'
import {
  INVOICE_STATUSES,
  type InvoiceStatus,
  invoiceStatusLabel,
  normalizeInvoiceStatus,
} from '@/lib/invoice-status'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UserMenu } from './user-menu'
import { exportToExcel } from '@/lib/export-utils'
import { FileDownIcon } from 'lucide-react'

export function InvoicesPageClient({ businessId }: { businessId: string }) {
  const [businessName, setBusinessName] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceStatus>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalInvoicesCount, setTotalInvoicesCount] = useState(0)
  const [listLoading, setListLoading] = useState(false)
  const [invoices, setInvoices] = useState<any[]>([])
  const navigate = useNavigate()
  const { business, refresh, loading, currencySymbol } = useBusinessData()
  const isBasic = business?.businessType?.toLowerCase() === 'basic'
  const { toast } = useToast()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [isBusinessInactiveDialogOpen, setIsBusinessInactiveDialogOpen] = useState(false)
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null)
  const [syncLoading, setSyncLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\^])/g, '\\$1') + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : ''
  }

  // Always request a fresh PDF generation to ensure latest system data (Customer, Settings, etc.) is reflected
  const ensurePdfUrl = async (invoice: any): Promise<string | null> => {
    try {
      setPdfLoadingId(invoice.id)
      const token = getCookie('token') || getCookie('accessToken')
      const res = await fetch(`${API_BASE}/api/invoices/${encodeURIComponent(invoice.id)}/generate-pdf`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
      })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to generate PDF')
      await refresh()
      return data.data?.pdfUrl || null
    } catch (err: any) {
      toast({ title: 'PDF generation failed', description: err?.message || 'Unknown error', variant: 'destructive' })
      return null
    } finally {
      setPdfLoadingId(null)
    }
  }

  const sanitizeUrl = useMemo(() => {
    return (v: any) => {
      const s = String(v ?? '').trim()
      if (!s) return ''
      return s.replace(/^[`'"]+/, '').replace(/[`'"]+$/, '')
    }
  }, [])

  useEffect(() => {
    const storedName = window.localStorage.getItem('businessName')
    if (storedName) {
      setBusinessName(storedName)
    }
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, fromDate, toDate])

  const displayName = useMemo(() => {
    if (businessName && businessName.trim().length > 0) {
      return businessName
    }
    if (!businessId) {
      return 'Your Business'
    }
    return `Business ${businessId.slice(0, 6).toUpperCase()}`
  }, [businessName, businessId])

  useEffect(() => {
    const fetchInvoices = async () => {
      if (loading) return

      const token = getCookie('token') || getCookie('accessToken')
      if (!token) return

      setListLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', String(currentPage))
        params.set('limit', '10')
        if (searchTerm.trim()) params.set('search', searchTerm.trim())
        if (fromDate) params.set('fromDate', fromDate)
        if (toDate) params.set('toDate', toDate)
        if (statusFilter !== 'all') params.set('status', statusFilter)

        const res = await fetch(`${API_BASE}/api/invoices?${params.toString()}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'x-business-id': businessId,
          },
        })

        const data = await res.json()
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || 'Failed to load invoices')
        }

        const rows = (Array.isArray(data?.data) ? data.data : []).map((inv: any) => ({
          id: inv.id,
          number: inv.invoiceNumber,
          customerName: inv.customer?.company ?? '',
          customerId: inv.customerId,
          amount: inv.grandTotal,
          status: normalizeInvoiceStatus(inv.status),
          dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
          issueDate: inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().split('T')[0] : '',
          items: Array.isArray(inv.items) ? inv.items.length : 0,
          tax: inv.totalTax,
          total: inv.grandTotal,
          currency: inv.currency || 'AED',
          pdfUrl: sanitizeUrl(inv.pdfUrl),
        }))

        setInvoices(rows)
        setTotalPages(Number(data?.pagination?.totalPages || 1))
        setTotalInvoicesCount(Number(data?.pagination?.total || rows.length || 0))
      } catch (err: any) {
        toast({
          title: 'Failed to load invoices',
          description: err?.message || 'Unknown error',
          variant: 'destructive',
        })
      } finally {
        setListLoading(false)
      }
    }

    void fetchInvoices()
  }, [API_BASE, businessId, currentPage, fromDate, loading, sanitizeUrl, searchTerm, statusFilter, toDate, toast])

  const handleBulkSync = async () => {
    try {
      setSyncLoading(true)
      const token = getCookie('token') || getCookie('accessToken')
      const res = await fetch(`${API_BASE}/api/invoices/bulk-update`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Business-Id': businessId,
        },
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Sync failed')
      
      toast({
        title: 'Sync Complete',
        description: data.message,
      })
      // Refresh the page to show updated PDFs/currencies
      window.location.reload()
    } catch (err: any) {
      toast({
        title: 'Sync Failed',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setSyncLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      setExportLoading(true)
      const token = getCookie('token') || getCookie('accessToken')
      if (!token) return

      // Fetch all invoices without pagination limit
      const params = new URLSearchParams()
      params.set('page', '1')
      params.set('limit', '1000') // Fetch a large enough number for a report
      if (searchTerm.trim()) params.set('search', searchTerm.trim())
      if (fromDate) params.set('fromDate', fromDate)
      if (toDate) params.set('toDate', toDate)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const res = await fetch(`${API_BASE}/api/invoices?${params.toString()}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
      })

      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Export failed')

      const exportData = (Array.isArray(data?.data) ? data.data : []).map((inv: any) => ({
        'Invoice Number': inv.invoiceNumber || inv.id,
        'Date': inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '',
        'Customer': inv.customer?.company || inv.customer?.name || '',
        'Total Amount': inv.grandTotal,
        'Tax': inv.totalTax,
        'Status': inv.status,
        'Due Date': inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '',
        'Currency': inv.currency || 'AED'
      }))

      exportToExcel(exportData, `Invoices_Report_${new Date().toISOString().split('T')[0]}`, 'Invoices')
      toast({ title: 'Report Generated', description: 'Your invoice report has been downloaded.' })
    } catch (err: any) {
      toast({ title: 'Export Failed', description: err.message, variant: 'destructive' })
    } finally {
      setExportLoading(false)
    }
  }


  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice: any) => {
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
      return matchesStatus
    })
  }, [invoices, statusFilter])


  const stats = useMemo(() => {
    const totalInvoices = totalInvoicesCount
    const paidInvoices = invoices.filter((i: any) => i.status === 'PAID').length
    const pendingInvoices = invoices.filter((i: any) => i.status === 'UNPAID').length
    const partiallyPaidInvoices = invoices.filter((i: any) => i.status === 'PARTIALLY_PAID').length
    const totalRevenue = invoices
      .filter((i: any) => i.status === 'PAID')
      .reduce((sum: number, i: any) => sum + Number(i.total || 0), 0)
    const outstandingAmount = invoices
      .filter((i: any) => i.status === 'UNPAID' || i.status === 'PARTIALLY_PAID')
      .reduce((sum: number, i: any) => sum + Number(i.total || 0), 0)
    return {
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      partiallyPaidInvoices,
      totalRevenue: `${currencySymbol === 'INR' ? '₹' : currencySymbol} ${totalRevenue.toLocaleString(currencySymbol === 'CAD' ? 'en-CA' : 'en-IN')}`,
      outstandingAmount: `${currencySymbol === 'INR' ? '₹' : currencySymbol} ${outstandingAmount.toLocaleString(currencySymbol === 'CAD' ? 'en-CA' : 'en-IN')}`,
    }
  }, [invoices, totalInvoicesCount])

  const handleAddInvoiceClick = () => {
    if (business?.isActive === false) {
      setIsBusinessInactiveDialogOpen(true)
      return
    }
    navigate(`/dashboard/${businessId}/invoices/add`)
  }

  const handleContactTeam = () => {
    window.location.href = 'https://www.queinfotech.com/contact'
  }

  if (loading) {
    return <DashboardPageSkeleton />
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl hidden sm:block">
            <FileTextIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Invoices</h1>
            <p className="text-sm font-medium text-muted-foreground mt-0.5">
              Create, track, and manage your invoices.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button 
            variant="outline" 
            className="flex-1 sm:flex-none items-center gap-2 h-10 px-4 rounded-xl border-border hover:bg-muted cursor-pointer" 
            onClick={handleBulkSync}
            disabled={syncLoading}
          >
            {syncLoading ? <Loader2Icon className="size-4 animate-spin text-blue-600" /> : <RefreshCwIcon className="size-4 text-blue-600" />}
            <span className="text-sm font-semibold text-foreground">Sync Old Records</span>
          </Button>
          <Button 
            className="flex-1 sm:flex-none items-center gap-2 h-10 px-4 rounded-xl cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            onClick={handleAddInvoiceClick}
          >
            <PlusIcon className="size-4" />
            <span className="text-sm font-semibold">New Invoice</span>
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl border-border shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Invoices</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileTextIcon className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalInvoices}</div>
            <p className="text-xs font-medium text-muted-foreground mt-1">All-time invoice count</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Paid Invoices</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckIcon className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.paidInvoices}</div>
            <p className="text-xs font-medium text-emerald-600 mt-1">Successfully paid</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Outstanding</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <ClockIcon className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.outstandingAmount}</div>
            <p className="text-xs font-medium text-amber-600 mt-1">{stats.pendingInvoices + stats.partiallyPaidInvoices} invoices pending</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Revenue</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <TrendingUpIcon className="h-4 w-4 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalRevenue}</div>
            <p className="text-xs font-medium text-muted-foreground mt-1">From paid invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* Main content */}
      <Card className="rounded-2xl border-border shadow-sm bg-card overflow-hidden flex-1 flex flex-col">
        <div className="p-6 border-b border-border bg-muted/50 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
          <div className="relative w-full xl:w-80">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 rounded-xl border-border bg-card w-full focus-visible:ring-blue-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-10 w-[140px] rounded-xl border-border text-sm"
            />
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-10 w-[140px] rounded-xl border-border text-sm"
            />
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
              <SelectTrigger className="h-10 w-[160px] rounded-xl border-border font-medium bg-card">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Statuses</SelectItem>
                {INVOICE_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>{invoiceStatusLabel(status)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              className="h-10 rounded-xl cursor-pointer border-border text-muted-foreground hover:bg-muted gap-2"
              onClick={handleExport}
              disabled={exportLoading}
            >
              {exportLoading ? <Loader2Icon className="size-4 animate-spin text-blue-600" /> : <FileDownIcon className="size-4" />}
              <span className="hidden sm:inline font-semibold">Export</span>
            </Button>
          </div>
        </div>
        <div className="p-0 border-t-0 flex-1 overflow-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-muted/80 sticky top-0 z-10 backdrop-blur-sm">
              <TableRow className="hover:bg-background border-b border-border">
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Invoice</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Customer</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Amount</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Due Date</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Items</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                      <Loader2Icon className="h-6 w-6 animate-spin text-blue-600" />
                      <p className="text-sm font-medium">Loading invoices...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-2">
                        <FileTextIcon className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-base font-semibold text-foreground">No invoices found</p>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        We couldn't find any invoices matching your filters. Try adjusting your search or create a new invoice.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm('')
                          setStatusFilter('all')
                          setFromDate('')
                          setToDate('')
                        }}
                        className="mt-4 rounded-xl cursor-pointer border-border text-blue-600 hover:bg-blue-50"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.map((invoice: any) => (
                <TableRow 
                  key={invoice.id} 
                  className="group hover:bg-muted/50 border-b border-border transition-colors cursor-pointer"
                  onClick={() => {
                    navigate(`/dashboard/${businessId}/invoices/${invoice.id}`)
                  }}
                >
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-blue-700 hover:underline">{invoice.number || invoice.id}</span>
                      <span className="text-xs text-muted-foreground font-medium mt-0.5">{invoice.issueDate}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="font-semibold text-foreground text-sm">{invoice.customerName}</span>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground text-sm">
                        {invoice.currency === 'INR' ? '₹' : invoice.currency} {Number(invoice.amount || 0).toLocaleString(invoice.currency === 'CAD' ? 'en-CA' : 'en-IN')}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-medium mt-0.5">
                        Total: {invoice.currency === 'INR' ? '₹' : invoice.currency} {Number(invoice.total || 0).toLocaleString(invoice.currency === 'CAD' ? 'en-CA' : 'en-IN')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[11px] px-2.5 py-0.5 font-bold border",
                        invoice.status === 'PAID' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        invoice.status === 'UNPAID' ? "bg-rose-50 text-rose-700 border-rose-200" :
                        invoice.status === 'PARTIALLY_PAID' ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-muted text-foreground border-border"
                      )}
                    >
                      <div className="flex items-center gap-1.5 uppercase tracking-wider">
                        {invoice.status === 'PAID' && <CheckIcon className="size-3" />}
                        {invoice.status === 'UNPAID' && <ClockIcon className="size-3" />}
                        {invoice.status === 'PARTIALLY_PAID' && <AlertTriangleIcon className="size-3" />}
                        {invoiceStatusLabel(invoice.status)}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 text-sm font-medium text-muted-foreground">
                    {invoice.dueDate}
                  </TableCell>
                  <TableCell className="py-4 text-sm font-medium text-muted-foreground">
                    {invoice.items} items
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <div className="flex justify-end items-center gap-1">
                      {isBasic ? (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-2 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/dashboard/${businessId}/invoices/payment?invoiceId=${encodeURIComponent(invoice.id)}`)
                            }}
                          >
                            <DollarSignIcon className="size-3 mr-1" />
                            Add Payment
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-2 text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/dashboard/${businessId}/expenses/add?invoiceId=${encodeURIComponent(invoice.id)}&customerId=${encodeURIComponent(invoice.customerId || '')}`)
                            }}
                          >
                            <TrendingDownIcon className="size-3 mr-1" />
                            Add Expense
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Add Payment" 
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/dashboard/${businessId}/invoices/payment?invoiceId=${encodeURIComponent(invoice.id)}`)
                            }}
                          >
                            <DollarSignIcon className="size-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Add Expense" 
                            className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/dashboard/${businessId}/expenses/add?invoiceId=${encodeURIComponent(invoice.id)}&customerId=${encodeURIComponent(invoice.customerId || '')}`)
                            }}
                          >
                            <TrendingDownIcon className="size-4" />
                          </Button>
                        </>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg cursor-pointer text-slate-400 hover:text-foreground hover:bg-muted">
                            <MoreVerticalIcon className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border-border">
                          <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</DropdownMenuLabel>
                          
                          <DropdownMenuItem
                            className="cursor-pointer font-medium text-foreground focus:text-blue-700 focus:bg-blue-50 py-2.5"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/dashboard/${businessId}/invoices/${invoice.id}`)
                            }}
                          >
                            <EyeIcon className="mr-2 size-4" />
                            View Invoice
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            className="cursor-pointer font-medium text-foreground focus:text-amber-700 focus:bg-amber-50 py-2.5"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/dashboard/${businessId}/invoices/add?id=${encodeURIComponent(invoice.id)}`)
                            }}
                          >
                            <EditIcon className="mr-2 size-4" />
                            Edit Invoice
                          </DropdownMenuItem>

                          {!isBasic && (
                            <DropdownMenuItem
                              className="cursor-pointer font-medium text-foreground focus:text-blue-700 focus:bg-blue-50 py-2.5"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/dashboard/${businessId}/invoices/payment?invoiceId=${encodeURIComponent(invoice.id)}`)
                              }}
                            >
                              <DollarSignIcon className="mr-2 size-4" />
                              Record Payment
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            className="cursor-pointer font-medium text-foreground focus:text-blue-700 focus:bg-blue-50 py-2.5"
                            disabled={pdfLoadingId === invoice.id}
                            onClick={async (e) => {
                              e.stopPropagation()
                              const url = await ensurePdfUrl(invoice)
                              if (!url) return
                              
                              try {
                                toast({ title: "Starting Download", description: "Preparing your PDF..." })
                                
                                const downloadUrl = `${API_BASE}/api/invoices/${encodeURIComponent(invoice.id)}/download-pdf?token=${getCookie('token') || getCookie('accessToken')}&x-business-id=${businessId}`
                                
                                const a = document.createElement('a')
                                a.href = downloadUrl
                                a.target = '_self'
                                a.download = `Invoice_${invoice.invoiceNumber || invoice.number || 'file'}.pdf`
                                document.body.appendChild(a)
                                a.click()
                                document.body.removeChild(a)
                              } catch (err) {
                                toast({ title: "Download Failed", description: "Failed to initiate download.", variant: "destructive" })
                              }
                            }}
                          >
                            <DownloadIcon className="mr-2 size-4" />
                            Download PDF
                          </DropdownMenuItem>
                          
                          {!isBasic && (
                            <DropdownMenuItem className="cursor-pointer font-medium text-foreground focus:text-blue-700 focus:bg-blue-50 py-2.5" onClick={(e) => e.stopPropagation()}>
                              <SendIcon className="mr-2 size-4" />
                              Send to Customer
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            className="cursor-pointer font-medium text-rose-600 focus:text-rose-700 focus:bg-rose-50 py-2.5"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteId(invoice.id)
                            }}
                          >
                            <TrashIcon className="mr-2 size-4" />
                            Delete Invoice
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          <div className="p-4 border-t border-border flex items-center justify-between bg-muted/50 mt-auto">
            <p className="text-sm text-muted-foreground font-medium">Page <span className="font-bold text-foreground">{currentPage}</span> of <span className="font-bold text-foreground">{totalPages}</span></p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg cursor-pointer border-border bg-card"
                disabled={currentPage <= 1 || listLoading}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg cursor-pointer border-border bg-card"
                disabled={currentPage >= totalPages || listLoading}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              >
                Next
              </Button>
            </div>
          </div>
      </Card>
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Do you really want to delete this invoice?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={async () => {
                if (!deleteId) return
                setDeleting(true)
                try {
                  const token = getCookie('token') || getCookie('accessToken')
                  const res = await fetch(`${API_BASE}/api/invoices/${encodeURIComponent(deleteId)}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}`, 'x-business-id': businessId },
                  })
                  const data = await res.json()
                  if (!res.ok || !data?.success) {
                    throw new Error(data?.message || 'Failed to delete invoice')
                  }
                  toast({
                    title: 'Invoice deleted',
                    description: data?.message || 'The invoice has been removed.',
                    variant: 'destructive',
                  })
                  try {
                    await refresh()
                  } catch {}
                } catch (err: any) {
                  toast({
                    title: 'Delete failed',
                    description: err?.message || 'Unknown error',
                    variant: 'destructive',
                  })
                } finally {
                  setDeleting(false)
                  setDeleteId(null)
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBusinessInactiveDialogOpen} onOpenChange={setIsBusinessInactiveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Business Inactive</DialogTitle>
            <DialogDescription>
              Please contact the Que Info Tech team.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBusinessInactiveDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={handleContactTeam}>
              Contact Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
