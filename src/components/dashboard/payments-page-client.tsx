import { toast } from 'sonner';
import React, { useEffect, useMemo, useState } from 'react'
import { BellIcon, Loader2Icon, FileDownIcon, DollarSignIcon, SearchIcon, DownloadIcon } from 'lucide-react'
import { exportToExcel } from '@/lib/export-utils'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { UserMenu } from './user-menu'
import { DashboardModeToggle } from './mode-toggle'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { DashboardPageSkeleton } from '@/components/dashboard/dashboard-page-skeleton'
import { getCurrencySymbol } from '@/lib/currencies'

type PaymentItem = {
  id: string
  invoiceId: string
  invoiceNumber: string
  amount: number
  paymentDate: string
  paymentMode: string
  transactionId: string
  note: string
  createdAt: string
  pdfUrl: string
  currency: string     // inherited from linked invoice
}

export function PaymentsPageClient({ businessId }: { businessId: string }) {
  const { loading: businessLoading, currencySymbol } = useBusinessData()
  const { toast } = useToast()
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [downloadingPaymentId, setDownloadingPaymentId] = useState<string | null>(null)
  const [exportLoading, setExportLoading] = useState(false)

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\^])/g, '\\$1') + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : ''
  }

  const sanitizeUrl = (value: unknown) => {
    const raw = String(value || '').trim()
    if (!raw) return ''
    return raw.replace(/^`+|`+$/g, '').replace(/^"+|"+$/g, '').replace(/^'+|'+$/g, '').trim()
  }

  const handleDownloadPaySlip = async (payment: PaymentItem) => {
    setDownloadingPaymentId(payment.id)
    try {
      const downloadUrl = `${API_BASE}/api/payments/download/${payment.id}?token=${getCookie('token') || getCookie('accessToken')}&x-business-id=${businessId}`
      
      const link = document.createElement('a')
      link.href = downloadUrl
      link.target = '_self'
      link.download = `Payment_Slip_${payment.invoiceNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error: any) {
      toast({
        title: 'Download failed',
        description: error?.message || 'Unable to download pay slip.',
        variant: 'destructive',
      })
    } finally {
      setDownloadingPaymentId(null)
    }
  }

  const handleExport = async () => {
    try {
      setExportLoading(true)
      const token = getCookie('token') || getCookie('accessToken')
      if (!token) return

      // Fetch all payments without pagination limit
      const params = new URLSearchParams()
      params.set('page', '1')
      params.set('limit', '1000') 
      if (searchTerm.trim()) params.set('search', searchTerm.trim())
      if (fromDate) params.set('fromDate', fromDate)
      if (toDate) params.set('toDate', toDate)

      const res = await fetch(`${API_BASE}/api/payments?${params.toString()}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
      })

      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Export failed')

      const payload = data?.data
      const paymentList = Array.isArray(payload) ? payload : (payload?.items || [])

      const exportData = paymentList.map((p: any) => ({
        'Invoice Number': p.invoice?.invoiceNumber || p.invoiceId || '-',
        'Amount': Number(p.amount || 0),
        'Payment Date': p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '',
        'Payment Mode': p.paymentMode || '-',
        'Transaction ID': p.transactionId || '-',
        'Note': p.note || ''
      }))

      exportToExcel(exportData, `Payments_Report_${new Date().toISOString().split('T')[0]}`, 'Payments')
      toast({ title: 'Report Generated', description: 'Your payments report has been downloaded.' })
    } catch (err: any) {
      toast({ title: 'Export Failed', description: err.message, variant: 'destructive' })
    } finally {
      setExportLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, fromDate, toDate])

  useEffect(() => {
    const fetchPayments = async () => {
      const token = getCookie('token') || getCookie('accessToken')
      if (!token) return

      setLoadingPayments(true)
      try {
        const params = new URLSearchParams()
        params.set('page', String(currentPage))
        params.set('limit', '10')
        if (searchTerm.trim()) params.set('search', searchTerm.trim())
        if (fromDate) params.set('fromDate', fromDate)
        if (toDate) params.set('toDate', toDate)

        const res = await fetch(`${API_BASE}/api/payments?${params.toString()}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'x-business-id': businessId,
          },
        })

        const data = await res.json()
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || 'Failed to load payments')
        }

        const payload = data?.data
        const paymentList = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : []

        const rows = paymentList.map((p: any) => {
          let proj = p.invoice?.project || (p.quotation?.projects && p.quotation.projects[0]) || null;
          let refNumber = proj ? (proj.projectName || proj.projectCode) : (p.invoice?.invoiceNumber || p.quotation?.quoteNumber || '-');
          
          return {
            id: p.id,
            invoiceId: p.invoice?.id || p.invoiceId || p.quotation?.id || '',
            invoiceNumber: refNumber,
            projectId: proj?.id || '',
            projectName: proj?.projectName || '',
            amount: Number(p.amount || 0),
            paymentDate: p.paymentDate ? new Date(p.paymentDate).toISOString().split('T')[0] : '',
            paymentMode: p.paymentMode || '-',
            transactionId: p.transactionId || '-',
            note: p.note || '-',
            createdAt: p.createdAt || '',
            pdfUrl: sanitizeUrl(p.pdfUrl),
            currency: p.invoice?.currency || p.quotation?.currency || p.currency || '',
          };
        })

        setPayments(rows)
        setTotalPages(Number(payload && !Array.isArray(payload) ? payload?.pagination?.totalPages || 1 : 1))
      } catch (err: any) {
        toast({
          title: 'Failed to load payments',
          description: err?.message || 'Unknown error',
          variant: 'destructive',
        })
      } finally {
        setLoadingPayments(false)
      }
    }

    if (!businessLoading) {
      fetchPayments()
    }
  }, [API_BASE, businessId, businessLoading, currentPage, fromDate, searchTerm, toDate, toast])

  const totalAmount = useMemo(() => {
    return payments.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  }, [payments])

  if (businessLoading) {
    return <DashboardPageSkeleton />
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <header className="flex items-center justify-between gap-4 w-full">
          <div className="flex min-w-0 items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl hidden sm:block">
              <DollarSignIcon className="h-6 w-6" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-2xl font-bold text-foreground tracking-tight">Payments</span>
              <span className="text-sm font-medium text-muted-foreground mt-0.5">View all recorded payments</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="h-10 rounded-xl cursor-pointer border-border text-muted-foreground hover:bg-muted gap-2 shadow-sm"
              onClick={handleExport}
              disabled={exportLoading}
            >
              {exportLoading ? <Loader2Icon className="size-4 animate-spin text-blue-600" /> : <FileDownIcon className="size-4" />}
              <span className="hidden sm:inline font-semibold">Export Payments</span>
            </Button>
          </div>
        </header>
      </div>

      <Card className="rounded-2xl border-border shadow-sm bg-card overflow-hidden flex-1 flex flex-col">
        <div className="p-6 border-b border-border bg-muted/50 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
          <div className="relative w-full xl:w-80">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search invoice #, transaction ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 rounded-xl border-border bg-card w-full focus-visible:ring-blue-500 shadow-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-10 w-[140px] rounded-xl border-border text-sm shadow-sm"
            />
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-10 w-[140px] rounded-xl border-border text-sm shadow-sm"
            />
          </div>
        </div>
        <div className="p-0 border-t-0 flex-1 overflow-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-muted/80 sticky top-0 z-10 backdrop-blur-sm">
              <TableRow className="hover:bg-background border-b border-border">
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Reference / Project</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Amount</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Payment Date</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Mode</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Transaction ID</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground max-w-[200px]">Note</TableHead>
                <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingPayments ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                      <Loader2Icon className="h-6 w-6 animate-spin text-blue-600" />
                      <p className="text-sm font-medium">Loading payments...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-2">
                        <DollarSignIcon className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-base font-semibold text-foreground">No payments found</p>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        We couldn't find any payments matching your filters.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id} className="group hover:bg-muted/50 border-b border-border transition-colors">
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground">{payment.invoiceNumber}</span>
                        {(payment as any).projectName && (
                          <span className="text-[11px] text-muted-foreground font-medium mt-0.5 truncate max-w-[150px]" title={(payment as any).projectName}>
                            {(payment as any).projectName}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-foreground">
                        {payment.currency ? getCurrencySymbol(payment.currency) : currencySymbol} {Number(payment.amount || 0).toLocaleString((payment.currency || currencySymbol) === 'CAD' ? 'en-CA' : 'en-IN')}
                      </span>
                        {payment.currency && (
                          <span className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-wider">{payment.currency}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-sm font-medium text-muted-foreground">
                      {payment.paymentDate || '-'}
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className="bg-muted text-foreground border-border font-semibold px-2.5 py-0.5">
                        {payment.paymentMode}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-sm text-muted-foreground">
                      {payment.transactionId || '-'}
                    </TableCell>
                    <TableCell className="py-4 text-sm text-muted-foreground max-w-[200px] truncate" title={payment.note}>
                      {payment.note || '-'}
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg cursor-pointer bg-card border-border text-blue-600 hover:bg-blue-50 gap-2 font-semibold shadow-sm"
                        onClick={() => void handleDownloadPaySlip(payment)}
                        disabled={downloadingPaymentId === payment.id}
                      >
                        {downloadingPaymentId === payment.id ? (
                          <Loader2Icon className="size-3.5 animate-spin" />
                        ) : (
                          <DownloadIcon className="size-3.5" />
                        )}
                        Pay Slip
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
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
              disabled={currentPage <= 1 || loadingPayments}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg cursor-pointer border-border bg-card"
              disabled={currentPage >= totalPages || loadingPayments}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
