import { toast } from 'sonner';
import React, { useEffect, useMemo, useState } from 'react'
import { ArrowLeftIcon, DownloadIcon, Loader2Icon } from 'lucide-react'
import {  useNavigate  } from 'react-router-dom';

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

type PayslipRow = {
  id: string
  employeeName: string
  designation: string
  basicSalary: number
  allowance: number
  deduction: number
  netSalary: number
  status: string
  pdfUrl: string
  createdAt: string
}

const PAGE_SIZE = 10

export function PayrollDetailPageClient({ businessId, payrollId }: { businessId: string; payrollId: string }) {
  const navigate = useNavigate()
  const { loading: businessLoading, currencySymbol } = useBusinessData()
  const { toast } = useToast()

  const [loadingPayslips, setLoadingPayslips] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [downloadingPayslipId, setDownloadingPayslipId] = useState<string | null>(null)
  const [periodLabel, setPeriodLabel] = useState('-')
  const [payslips, setPayslips] = useState<PayslipRow[]>([])

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

  const toMonthLabel = (month: number) => {
    if (!month || month < 1 || month > 12) return '-'
    const d = new Date(2000, month - 1, 1)
    return d.toLocaleString('en-US', { month: 'short' })
  }

  const fetchPayslips = React.useCallback(async () => {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) return

    setLoadingPayslips(true)
    try {
      const res = await fetch(`${API_BASE}/api/payrolls/${encodeURIComponent(payrollId)}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
      })

      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to load payroll details')
      }

      const payroll = data?.data || null
      if (!payroll) {
        setPayslips([])
        setPeriodLabel('-')
        return
      }

      setPeriodLabel(`${toMonthLabel(Number(payroll.month || 0))} ${Number(payroll.year || 0) || ''}`.trim())

      const rows = (Array.isArray(payroll?.payslips) ? payroll.payslips : []).map((item: any) => ({
        id: String(item?.id || ''),
        employeeName: String(item?.employeeName || item?.employee?.name || ''),
        designation: String(item?.employee?.designation || ''),
        basicSalary: Number(item?.basicSalary || 0),
        allowance: Number(item?.allowance || 0),
        deduction: Number(item?.deduction || 0),
        netSalary: Number(item?.netSalary || 0),
        status: String(item?.status || 'pending'),
        pdfUrl: sanitizeUrl(item?.pdfUrl),
        createdAt: String(item?.createdAt || ''),
      }))

      setPayslips(rows)
    } catch (err: any) {
      toast({
        title: 'Failed to load payslips',
        description: err?.message || 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setLoadingPayslips(false)
    }
  }, [API_BASE, businessId, payrollId, toast])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  useEffect(() => {
    if (!businessLoading) {
      void fetchPayslips()
    }
  }, [businessLoading, fetchPayslips])

  const handleDownloadPayslip = async (payslip: PayslipRow) => {
    const url = sanitizeUrl(payslip.pdfUrl)
    if (!url) {
      toast({
        title: 'Payslip unavailable',
        description: 'No PDF URL is available for this payslip.',
        variant: 'destructive',
      })
      return
    }

    setDownloadingPayslipId(payslip.id)
    try {
      const token = getCookie('token') || getCookie('accessToken')
      const downloadUrl = `${API_BASE}/api/payrolls/payslip/${payslip.id}/download-pdf`

      const response = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId
        }
      })
      
      if (!response.ok) {
        throw new Error('Unable to download payslip file')
      }

      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const safeEmployeeName = String(payslip.employeeName || payslip.id)
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .trim()

      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `${safeEmployeeName || payslip.id}_${periodLabel.replace(/\s+/g, '_')}_payslip.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(objectUrl)
    } catch (error: any) {
      toast({
        title: 'Download failed',
        description: error?.message || 'Unable to download payslip.',
        variant: 'destructive',
      })
    } finally {
      setDownloadingPayslipId(null)
    }
  }

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return payslips
    return payslips.filter((row) => {
      const base = `${row.employeeName} ${row.designation} ${row.status} ${row.id}`.toLowerCase()
      return base.includes(q)
    })
  }, [payslips, searchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const pageRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filteredRows.slice(start, start + PAGE_SIZE)
  }, [filteredRows, safePage])

  if (businessLoading) {
    return <DashboardPageSkeleton />
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-10 pt-0 sm:px-6 lg:px-8">
      <div className="-mx-4 border-b border-border bg-background px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mb-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate(`/dashboard/${businessId}/payrolls`)}>
              <ArrowLeftIcon className="size-4" />
              Back
            </Button>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-foreground">Payroll Payslips</span>
              <span className="text-xs text-muted-foreground">Period: {periodLabel}</span>
            </div>
          </div>

          
        </header>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Payslips</CardTitle>
          <CardDescription>Payslips for selected payroll period.</CardDescription>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search employee, role, status"
              className="h-8 w-64 text-xs"
            />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {loadingPayslips ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              <Loader2Icon className="mr-2 size-4 animate-spin" /> Loading payslips...
            </div>
          ) : pageRows.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">No payslips found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Basic</TableHead>
                  <TableHead>Allowance</TableHead>
                  <TableHead>Deduction</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Download</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium text-sm">{row.employeeName || '-'}</TableCell>
                    <TableCell className="text-sm">{row.designation || '-'}</TableCell>
                    <TableCell className="text-sm">{currencySymbol} {Number(row.basicSalary || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{currencySymbol} {Number(row.allowance || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{currencySymbol} {Number(row.deduction || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-sm font-medium">{currencySymbol} {Number(row.netSalary || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={row.status.toLowerCase() === 'paid' ? 'secondary' : 'outline'} className="text-xs">
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer text-xs"
                        onClick={() => void handleDownloadPayslip(row)}
                        disabled={downloadingPayslipId === row.id}
                      >
                        {downloadingPayslipId === row.id ? (
                          <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />
                        ) : (
                          <DownloadIcon className="mr-1.5 size-3.5" />
                        )}
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Page {safePage} of {totalPages}</p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage <= 1 || loadingPayslips}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages || loadingPayslips}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
