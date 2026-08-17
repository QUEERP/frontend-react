import { toast } from 'sonner';
import React, { useEffect, useMemo, useState } from 'react'
import { ArrowRightIcon, Loader2Icon, WalletCardsIcon, CalendarDaysIcon, FileTextIcon, CheckCircle2Icon, PlusIcon, SearchIcon, BanknoteIcon } from 'lucide-react'
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
import { useToast } from '@/components/ui/use-toast'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { UserMenu } from './user-menu'
import { DashboardModeToggle } from './mode-toggle'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { DashboardPageSkeleton } from '@/components/dashboard/dashboard-page-skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type PayslipRow = {
  id: string
  month: number
  year: number
  status: string
  createdAt: string
}

const PAGE_SIZE = 10

export function PayrollsPageClient({ businessId }: { businessId: string }) {
  const navigate = useNavigate()
  const { loading: businessLoading } = useBusinessData()
  const { toast } = useToast()

  const [loadingPayrolls, setLoadingPayrolls] = useState(false)
  const [rows, setRows] = useState<PayslipRow[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [creatingPayroll, setCreatingPayroll] = useState(false)
  const [payrollMonth, setPayrollMonth] = useState(String(new Date().getMonth() + 1))
  const [payrollYear, setPayrollYear] = useState(String(new Date().getFullYear()))

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5002'

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\^])/g, '\\$1') + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : ''
  }

  const toMonthLabel = (month: number) => {
    if (!month || month < 1 || month > 12) return '-'
    const d = new Date(2000, month - 1, 1)
    return d.toLocaleString('en-US', { month: 'short' })
  }

  const monthOptions = useMemo(
    () => [
      { value: '1', label: 'January' },
      { value: '2', label: 'February' },
      { value: '3', label: 'March' },
      { value: '4', label: 'April' },
      { value: '5', label: 'May' },
      { value: '6', label: 'June' },
      { value: '7', label: 'July' },
      { value: '8', label: 'August' },
      { value: '9', label: 'September' },
      { value: '10', label: 'October' },
      { value: '11', label: 'November' },
      { value: '12', label: 'December' },
    ],
    [],
  )

  const fetchPayrolls = React.useCallback(async () => {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) return

    setLoadingPayrolls(true)
    try {
      const payrollRes = await fetch(`${API_BASE}/api/payrolls`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
      })

      const payrollData = await payrollRes.json()
      if (!payrollRes.ok || !payrollData?.success) {
        throw new Error(payrollData?.message || 'Failed to load payrolls')
      }

      const payrolls = Array.isArray(payrollData?.data) ? payrollData.data : []
      const mapped = payrolls
        .map((payroll: any) => ({
          id: String(payroll?.id || ''),
          month: Number(payroll?.month || 0),
          year: Number(payroll?.year || 0),
          status: String(payroll?.status || 'draft'),
          createdAt: String(payroll?.createdAt || ''),
        }))
        .sort((a: PayslipRow, b: PayslipRow) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      setRows(mapped)
    } catch (err: any) {
      toast({
        title: 'Failed to load payrolls',
        description: err?.message || 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setLoadingPayrolls(false)
    }
  }, [API_BASE, businessId])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  useEffect(() => {
    if (!businessLoading) {
      void fetchPayrolls()
    }
  }, [businessLoading, fetchPayrolls])

  const handleCreatePayroll = async () => {
    const month = Number(payrollMonth)
    const year = Number(payrollYear)

    if (!month || month < 1 || month > 12) {
      toast({
        title: 'Validation error',
        description: 'Please select a valid month.',
        variant: 'destructive',
      })
      return
    }

    if (!year || year < 2000 || year > 2100) {
      toast({
        title: 'Validation error',
        description: 'Please enter a valid year.',
        variant: 'destructive',
      })
      return
    }

    setCreatingPayroll(true)
    try {
      const token = getCookie('token') || getCookie('accessToken')
      const res = await fetch(`${API_BASE}/api/payrolls/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
        body: JSON.stringify({ month, year }),
      })

      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to run payroll')
      }

      toast({
        title: 'Payroll created',
        description: `Payroll for ${toMonthLabel(month)} ${year} has been generated.`,
      })
      setCreateOpen(false)
      await fetchPayrolls()
    } catch (err: any) {
      toast({
        title: 'Failed to create payroll',
        description: err?.message || 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setCreatingPayroll(false)
    }
  }

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) => {
      const period = `${toMonthLabel(row.month)} ${row.year}`.toLowerCase()
      const base = `${row.id} ${row.status} ${period}`.toLowerCase()
      return base.includes(q)
    })
  }, [rows, searchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const pageRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filteredRows.slice(start, start + PAGE_SIZE)
  }, [filteredRows, safePage])

  const stats = useMemo(() => {
    const totalPayrolls = rows.length
    const draftPayrolls = rows.filter((row) => row.status.toLowerCase() === 'draft').length
    const processedPayrolls = rows.filter((row) => row.status.toLowerCase() !== 'draft').length
    const latestPeriod = rows[0] ? `${toMonthLabel(rows[0].month)} ${rows[0].year}` : '-'

    return {
      totalPayrolls,
      draftPayrolls,
      processedPayrolls,
      latestPeriod,
    }
  }, [rows])

  if (businessLoading) {
    return <DashboardPageSkeleton />
  }

  return (
    <div className="flex min-h-svh flex-col gap-8 bg-muted/50 dark:bg-slate-950/50 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm">
            <WalletCardsIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Payroll Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Generate, view, and process monthly payroll runs.</p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="rounded-xl h-10 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-sm transition-all hover:shadow-md gap-2">
          <PlusIcon className="h-4 w-4" />
          Run Payroll
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-x border-t border-b-[3px] border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all group overflow-hidden hover:border-b-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Total Payrolls</p>
                <p className="text-3xl font-bold mt-2 bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">{stats.totalPayrolls}</p>
              </div>
              <div className="rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 p-4 transition-transform duration-300 group-hover:scale-110 shadow-sm">
                <FileTextIcon className="h-6 w-6 dark:opacity-80" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-x border-t border-b-[3px] border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all group overflow-hidden hover:border-b-amber-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Draft Payrolls</p>
                <p className="text-3xl font-bold mt-2 bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">{stats.draftPayrolls}</p>
              </div>
              <div className="rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 p-4 transition-transform duration-300 group-hover:scale-110 shadow-sm">
                <WalletCardsIcon className="h-6 w-6 dark:opacity-80" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-x border-t border-b-[3px] border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all group overflow-hidden hover:border-b-emerald-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Processed</p>
                <p className="text-3xl font-bold mt-2 bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">{stats.processedPayrolls}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 p-4 transition-transform duration-300 group-hover:scale-110 shadow-sm">
                <CheckCircle2Icon className="h-6 w-6 dark:opacity-80" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-x border-t border-b-[3px] border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all group overflow-hidden hover:border-b-indigo-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Latest Period</p>
                <p className="text-xl font-bold mt-2 bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent line-clamp-1">{stats.latestPeriod}</p>
              </div>
              <div className="rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 p-4 transition-transform duration-300 group-hover:scale-110 shadow-sm">
                <CalendarDaysIcon className="h-6 w-6 dark:opacity-80" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm overflow-hidden flex-1">
        <CardHeader className="border-b border-border/50 pb-4 bg-muted/50 dark:bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <BanknoteIcon className="h-5 w-5 text-blue-500" />
              Payroll History
            </CardTitle>
            <CardDescription className="mt-1">Click a payroll entry to view detailed payslips.</CardDescription>
          </div>
          <div className="relative max-w-sm w-full">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by month or year..."
              className="pl-9 rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10 w-full"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingPayrolls ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              <Loader2Icon className="mr-2 size-5 animate-spin text-blue-500" /> Loading payroll entries...
            </div>
          ) : pageRows.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
              <FileTextIcon className="h-8 w-8 text-slate-300 dark:text-foreground" />
              No payroll entries found matching your criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full text-sm">
                <TableHeader>
                  <TableRow className="bg-muted/50 dark:bg-slate-900/50 border-b border-border dark:border-slate-800">
                    <TableHead className="text-left px-6 py-4 font-semibold text-muted-foreground dark:text-slate-400 uppercase text-xs tracking-wider">Period</TableHead>
                    <TableHead className="text-left px-6 py-4 font-semibold text-muted-foreground dark:text-slate-400 uppercase text-xs tracking-wider">Payroll ID</TableHead>
                    <TableHead className="text-left px-6 py-4 font-semibold text-muted-foreground dark:text-slate-400 uppercase text-xs tracking-wider">Created At</TableHead>
                    <TableHead className="text-right px-6 py-4 font-semibold text-muted-foreground dark:text-slate-400 uppercase text-xs tracking-wider">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {pageRows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => navigate(`/dashboard/${businessId}/payrolls/${row.id}`)}>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/40 dark:to-indigo-800/40 text-indigo-700 dark:text-indigo-300 font-semibold text-xs shadow-sm shrink-0">
                            {toMonthLabel(row.month).substring(0, 3).toUpperCase()}
                          </div>
                          <span className="font-semibold text-foreground dark:text-slate-100">{toMonthLabel(row.month)} {row.year || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-muted-foreground dark:text-slate-400 font-mono text-xs">
                        {row.id}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-muted-foreground dark:text-slate-400 font-medium">
                        {row.createdAt ? new Date(row.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl h-8 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/dashboard/${businessId}/payrolls/${row.id}`)
                          }}
                        >
                          View Payslips
                          <ArrowRightIcon className="ml-1.5 h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="px-6 py-4 border-t border-border dark:border-slate-800 bg-muted/50 dark:bg-slate-900/50 flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Showing Page <span className="text-foreground dark:text-slate-100">{safePage}</span> of {totalPages}</p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl h-8 border-border dark:border-slate-800 bg-card dark:bg-slate-950"
                disabled={safePage <= 1 || loadingPayrolls}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl h-8 border-border dark:border-slate-800 bg-card dark:bg-slate-950"
                disabled={safePage >= totalPages || loadingPayrolls}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <WalletCardsIcon className="h-5 w-5 text-blue-500" />
              Run Payroll
            </DialogTitle>
            <DialogDescription className="pt-2">
              Generate payslips for all active employees for a specific period.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 md:grid-cols-2 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Month</label>
              <Select value={payrollMonth} onValueChange={setPayrollMonth}>
                <SelectTrigger className="rounded-xl w-full transition-all focus:ring-2 focus:ring-blue-500/20 h-11 bg-card dark:bg-slate-950 border-border dark:border-slate-800">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {monthOptions.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Year</label>
              <Input
                type="number"
                min="2000"
                max="2100"
                value={payrollYear}
                onChange={(e) => setPayrollYear(e.target.value)}
                placeholder="YYYY"
                className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 h-11 bg-card dark:bg-slate-950 border-border dark:border-slate-800"
              />
            </div>
          </div>

          <DialogFooter className="gap-3 sm:gap-3 pt-2">
            <Button variant="outline" className="rounded-xl cursor-pointer border-border dark:border-slate-800 bg-card dark:bg-slate-950" onClick={() => setCreateOpen(false)} disabled={creatingPayroll}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreatePayroll()} disabled={creatingPayroll} className="rounded-xl cursor-pointer bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white gap-2 shadow-sm">
              {creatingPayroll ? <Loader2Icon className="size-4 animate-spin" /> : <PlusIcon className="size-4" />}
              Generate Payroll
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
