import { toast } from 'sonner';
import React, { useEffect, useMemo, useState } from 'react'
import {
  Loader2Icon,
  PlusIcon,
  HandCoinsIcon,
  SearchIcon,
  TrashIcon,
  EditIcon,
  MoreHorizontalIcon,
  BanknoteIcon,
  CreditCardIcon,
  BadgeCheckIcon,
  TrendingDownIcon,
  FileTextIcon,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { DashboardModeToggle } from '@/components/dashboard/mode-toggle'
import { UserMenu } from './user-menu'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { useToast } from '@/components/ui/use-toast'
import { DashboardPageSkeleton } from '@/components/dashboard/dashboard-page-skeleton'

type EmployeeOption = {
  id: string
  name: string
  designation?: string
}

type LoanItem = {
  id: string
  employeeId: string
  employeeName: string
  designation: string
  totalAmount: number
  remainingAmount: number
  emiAmount: number
  startDate: string
  status: string
  createdAt: string
}

type CreateFormData = {
  employeeId: string
  totalAmount: string
  emiAmount: string
  startDate: string
}

type EditFormData = {
  totalAmount: string
  emiAmount: string
  status: string
}

const PAGE_SIZE = 10

export function LoanPageClient({ businessId }: { businessId: string }) {
  const { toast } = useToast()
  const { loading: businessLoading, currencySymbol } = useBusinessData()

  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [loanList, setLoanList] = useState<LoanItem[]>([])
  const [pageLoading, setPageLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Create form
  const [formData, setFormData] = useState<CreateFormData>({
    employeeId: '',
    totalAmount: '',
    emiAmount: '',
    startDate: new Date().toISOString().split('T')[0],
  })

  // Edit dialog
  const [editItem, setEditItem] = useState<LoanItem | null>(null)
  const [editFormData, setEditFormData] = useState<EditFormData>({ totalAmount: '', emiAmount: '', status: '' })
  const [editSubmitting, setEditSubmitting] = useState(false)

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(
      new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\\^])/g, '\\$1') + '=([^;]*)'),
    )
    return match ? decodeURIComponent(match[1]) : ''
  }

  // ─── Fetch Data ───────────────────────────────────────────────────────────

  const fetchData = React.useCallback(async () => {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) return

    setPageLoading(true)
    try {
      const [empRes, loanRes] = await Promise.all([
        fetch(`${API_BASE}/api/employees`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-business-id': businessId,
          },
        }),
        fetch(`${API_BASE}/api/loans`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-business-id': businessId,
          },
        }),
      ])

      const empData = await empRes.json()
      const loanData = await loanRes.json()

      if (!empRes.ok || !empData?.success) {
        throw new Error(empData?.message || 'Failed to load employees')
      }

      const employeeRows: EmployeeOption[] = (Array.isArray(empData?.data) ? empData.data : []).map(
        (item: any) => ({
          id: String(item?.id || ''),
          name: String(item?.name || ''),
          designation: String(item?.designation || ''),
        }),
      )
      setEmployees(employeeRows)

      const empMap = new Map(employeeRows.map((e) => [e.id, e]))

      if (loanRes.ok && loanData?.success) {
        const rows: LoanItem[] = (Array.isArray(loanData?.data) ? loanData.data : []).map(
          (item: any) => {
            const emp = empMap.get(String(item?.employeeId || '')) || item?.employee
            return {
              id: String(item?.id || ''),
              employeeId: String(item?.employeeId || ''),
              employeeName: String(emp?.name || item?.employee?.name || ''),
              designation: String(emp?.designation || item?.employee?.designation || ''),
              totalAmount: Number(item?.totalAmount || 0),
              remainingAmount: Number(item?.remainingAmount || 0),
              emiAmount: Number(item?.emiAmount || 0),
              startDate: item?.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '',
              status: String(item?.status || 'active'),
              createdAt: item?.createdAt || '',
            }
          },
        )
        setLoanList(rows)
      } else {
        setLoanList([])
      }

      if (!formData.employeeId && employeeRows.length > 0) {
        setFormData((prev) => ({ ...prev, employeeId: employeeRows[0].id }))
      }
    } catch (err: any) {
      toast({
        title: 'Failed to load loan data',
        description: err?.message || 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setPageLoading(false)
    }
  }, [API_BASE, businessId, formData.employeeId])

  useEffect(() => {
    if (!businessLoading) {
      void fetchData()
    }
  }, [businessLoading, fetchData])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // ─── Stats ────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const totalLoans = loanList.length
    const activeLoans = loanList.filter((l) => l.status === 'active').length
    const totalDisbursed = loanList.reduce((sum, l) => sum + l.totalAmount, 0)
    const totalRemaining = loanList.reduce((sum, l) => sum + l.remainingAmount, 0)
    return { totalLoans, activeLoans, totalDisbursed, totalRemaining }
  }, [loanList])

  // ─── Search + Pagination ──────────────────────────────────────────────────

  const filteredList = useMemo(() => {
    const query = searchTerm.toLowerCase()
    return loanList.filter((item) => {
      const base = `${item.employeeName} ${item.designation} ${item.status} ${item.totalAmount}`.toLowerCase()
    })
  }, [loanList, searchTerm])

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedList = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filteredList.slice(start, start + PAGE_SIZE)
  }, [filteredList, safePage])

  // ─── Create Loan ──────────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.employeeId) {
      toast({ title: 'Validation error', description: 'Please select an employee.', variant: 'destructive' })
      return
    }
    if (!formData.totalAmount || Number(formData.totalAmount) <= 0) {
      toast({ title: 'Validation error', description: 'Total amount must be greater than 0.', variant: 'destructive' })
      return
    }
    if (!formData.emiAmount || Number(formData.emiAmount) <= 0) {
      toast({ title: 'Validation error', description: 'EMI amount must be greater than 0.', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const token = getCookie('token') || getCookie('accessToken')
      const res = await fetch(`${API_BASE}/api/loans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
        body: JSON.stringify({
          employeeId: formData.employeeId,
          totalAmount: Number(formData.totalAmount),
          emiAmount: Number(formData.emiAmount),
          startDate: formData.startDate || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to create loan')
      }

      toast({ title: 'Loan created', description: 'Loan/advance has been recorded successfully.' })

      setFormData((prev) => ({
        ...prev,
        totalAmount: '',
        emiAmount: '',
        startDate: new Date().toISOString().split('T')[0],
      }))
      await fetchData()
    } catch (err: any) {
      toast({
        title: 'Failed to create loan',
        description: err?.message || 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Edit Loan ────────────────────────────────────────────────────────────

  const openEditDialog = (item: LoanItem) => {
    setEditItem(item)
    setEditFormData({
      totalAmount: String(item.totalAmount),
      emiAmount: String(item.emiAmount),
      status: item.status,
    })
  }

  const handleEdit = async () => {
    if (!editItem) return

    if (!editFormData.totalAmount || Number(editFormData.totalAmount) <= 0) {
      toast({ title: 'Validation error', description: 'Total amount must be greater than 0.', variant: 'destructive' })
      return
    }
    if (!editFormData.emiAmount || Number(editFormData.emiAmount) <= 0) {
      toast({ title: 'Validation error', description: 'EMI amount must be greater than 0.', variant: 'destructive' })
      return
    }

    setEditSubmitting(true)
    try {
      const token = getCookie('token') || getCookie('accessToken')
      const res = await fetch(`${API_BASE}/api/loans/${encodeURIComponent(editItem.id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
        body: JSON.stringify({
          totalAmount: Number(editFormData.totalAmount),
          emiAmount: Number(editFormData.emiAmount),
          status: editFormData.status,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to update loan')
      }

      toast({ title: 'Loan updated', description: 'Loan details have been updated successfully.' })
      setEditItem(null)
      await fetchData()
    } catch (err: any) {
      toast({
        title: 'Failed to update loan',
        description: err?.message || 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setEditSubmitting(false)
    }
  }

  // ─── Delete Loan ──────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteId) return

    setDeleting(true)
    try {
      const token = getCookie('token') || getCookie('accessToken')
      const res = await fetch(`${API_BASE}/api/loans/${encodeURIComponent(deleteId)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
      })

      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to delete loan')
      }

      toast({ title: 'Loan deleted', description: 'Loan entry has been removed.', variant: 'destructive' })
      setLoanList((prev) => prev.filter((item) => item.id !== deleteId))
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
  }

  // ─── Loading Gate ─────────────────────────────────────────────────────────

  if (businessLoading) {
    return <DashboardPageSkeleton />
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-svh flex-col gap-8 bg-muted/50 dark:bg-slate-950/50 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm">
            <HandCoinsIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Loans & Advances
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage employee loans, advances, and EMI payments.</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-x border-t border-b-[3px] border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all group overflow-hidden hover:border-b-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Total Loans</p>
                <p className="text-3xl font-bold mt-2 bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">{stats.totalLoans}</p>
              </div>
              <div className="rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 p-4 transition-transform duration-300 group-hover:scale-110 shadow-sm">
                <FileTextIcon className="h-6 w-6 dark:opacity-80" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-x border-t border-b-[3px] border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all group overflow-hidden hover:border-b-emerald-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Active Loans</p>
                <p className="text-3xl font-bold mt-2 bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">{stats.activeLoans}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 p-4 transition-transform duration-300 group-hover:scale-110 shadow-sm">
                <BadgeCheckIcon className="h-6 w-6 dark:opacity-80" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-x border-t border-b-[3px] border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all group overflow-hidden hover:border-b-indigo-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Total Disbursed</p>
                <p className="text-3xl font-bold mt-2 bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent line-clamp-1">{currencySymbol}{stats.totalDisbursed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 p-4 transition-transform duration-300 group-hover:scale-110 shadow-sm">
                <BanknoteIcon className="h-6 w-6 dark:opacity-80" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-x border-t border-b-[3px] border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all group overflow-hidden hover:border-b-amber-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Outstanding</p>
                <p className="text-3xl font-bold mt-2 bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent line-clamp-1">{currencySymbol}{stats.totalRemaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 p-4 transition-transform duration-300 group-hover:scale-110 shadow-sm">
                <TrendingDownIcon className="h-6 w-6 dark:opacity-80" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Loan Form */}
      <Card className="rounded-2xl border border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/50 pb-4 bg-muted/50 dark:bg-slate-900/50">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <PlusIcon className="h-5 w-5 text-blue-500" />
            Issue Loan or Advance
          </CardTitle>
          <CardDescription>
            Select an employee, enter loan amount, EMI schedule, and start date.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleCreate} className="grid gap-6 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] items-end">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Employee</Label>
              <Select
                value={formData.employeeId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, employeeId: value }))}
              >
                <SelectTrigger className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10 w-full">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}{emp.designation ? ` — ${emp.designation}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Total Amount</Label>
              <Input
                type="number"
                step="0.01"
                min="1"
                placeholder="e.g. 5000"
                value={formData.totalAmount}
                onChange={(e) => setFormData((prev) => ({ ...prev, totalAmount: e.target.value }))}
                className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10 w-full"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">EMI Amount</Label>
              <Input
                type="number"
                step="0.01"
                min="1"
                placeholder="e.g. 500"
                value={formData.emiAmount}
                onChange={(e) => setFormData((prev) => ({ ...prev, emiAmount: e.target.value }))}
                className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10 w-full"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Start Date</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10 w-full"
              />
            </div>

            <div className="flex items-center justify-end w-full">
              <Button type="submit" disabled={submitting || pageLoading} className="rounded-xl h-10 w-full lg:w-auto px-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-sm transition-all hover:shadow-md gap-2">
                {submitting ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <PlusIcon className="h-4 w-4" />}
                {submitting ? 'Creating...' : 'Issue Loan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Loans Table */}
      <Card className="rounded-2xl border border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm overflow-hidden flex-1">
        <CardHeader className="border-b border-border/50 pb-4 bg-muted/50 dark:bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <CreditCardIcon className="h-5 w-5 text-blue-500" />
              Loan Directory
            </CardTitle>
            <CardDescription className="mt-1">All loan and advance records for this business.</CardDescription>
          </div>
          <div className="relative max-w-sm w-full">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, status..."
              className="pl-9 rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10 w-full"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {pageLoading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              <Loader2Icon className="mr-2 h-5 w-5 animate-spin text-blue-500" /> Loading loan records...
            </div>
          ) : paginatedList.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
              <HandCoinsIcon className="h-8 w-8 text-slate-300 dark:text-foreground" />
              No loan records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full text-sm">
                <TableHeader>
                  <TableRow className="bg-muted/50 dark:bg-slate-900/50 border-b border-border dark:border-slate-800">
                    <TableHead className="text-left px-6 py-4 font-semibold text-muted-foreground dark:text-slate-400 uppercase text-xs tracking-wider">Employee</TableHead>
                    <TableHead className="text-left px-6 py-4 font-semibold text-muted-foreground dark:text-slate-400 uppercase text-xs tracking-wider">Principal</TableHead>
                    <TableHead className="text-left px-6 py-4 font-semibold text-muted-foreground dark:text-slate-400 uppercase text-xs tracking-wider">Remaining</TableHead>
                    <TableHead className="text-left px-6 py-4 font-semibold text-muted-foreground dark:text-slate-400 uppercase text-xs tracking-wider">EMI/Mo</TableHead>
                    <TableHead className="text-left px-6 py-4 font-semibold text-muted-foreground dark:text-slate-400 uppercase text-xs tracking-wider">Start Date</TableHead>
                    <TableHead className="text-left px-6 py-4 font-semibold text-muted-foreground dark:text-slate-400 uppercase text-xs tracking-wider">Status</TableHead>
                    <TableHead className="text-right px-6 py-4 font-semibold text-muted-foreground dark:text-slate-400 uppercase text-xs tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {paginatedList.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50 dark:hover:bg-slate-800/30 transition-colors">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/40 dark:to-indigo-800/40 text-indigo-700 dark:text-indigo-300 font-semibold text-xs shadow-sm shrink-0">
                            {getInitials(item.employeeName || 'U')}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground dark:text-slate-100 line-clamp-1">{item.employeeName || '-'}</span>
                            <span className="text-xs text-muted-foreground dark:text-slate-400">{item.designation || 'No Role'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 font-bold text-foreground dark:text-slate-300">
                        {currencySymbol}{item.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="px-6 py-4 font-bold text-rose-600 dark:text-rose-400">
                        {currencySymbol}{item.remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">
                        {currencySymbol}{item.emiAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-muted-foreground dark:text-slate-400 font-medium">{item.startDate || '-'}</TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge 
                          variant="outline" 
                          className={`font-semibold border ${
                            item.status === 'active' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                              : 'bg-muted text-foreground border-border dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                          }`}
                        >
                          {item.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="rounded-xl h-8 w-8 p-0 hover:bg-muted dark:hover:bg-slate-800">
                              <MoreHorizontalIcon className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuLabel className="text-xs font-semibold uppercase text-muted-foreground">Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openEditDialog(item)} className="text-xs font-medium cursor-pointer rounded-lg">
                              <EditIcon className="mr-2 h-4 w-4 text-blue-500" />
                              Edit Entry
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteId(item.id)}
                              className="text-xs font-medium text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-500/10 cursor-pointer rounded-lg"
                            >
                              <TrashIcon className="mr-2 h-4 w-4" />
                              Delete Entry
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-border dark:border-slate-800 bg-muted/50 dark:bg-slate-900/50 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Showing <span className="text-foreground dark:text-slate-100">{paginatedList.length > 0 ? (safePage - 1) * PAGE_SIZE + 1 : 0}</span> to <span className="text-foreground dark:text-slate-100">{Math.min(safePage * PAGE_SIZE, filteredList.length)}</span> of {filteredList.length} records
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="rounded-xl h-8 border-border dark:border-slate-800 bg-card dark:bg-slate-950"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className="rounded-xl h-8 border-border dark:border-slate-800 bg-card dark:bg-slate-950"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => { if (!open) setEditItem(null) }}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <EditIcon className="h-5 w-5 text-blue-500" />
              Edit Loan
            </DialogTitle>
            <DialogDescription className="pt-2">
              Update loan for <strong>{editItem?.employeeName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Total Amount</Label>
              <Input
                type="number"
                step="0.01"
                min="1"
                value={editFormData.totalAmount}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, totalAmount: e.target.value }))}
                className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 h-11 bg-card dark:bg-slate-950 border-border dark:border-slate-800 w-full"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">EMI Amount</Label>
              <Input
                type="number"
                step="0.01"
                min="1"
                value={editFormData.emiAmount}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, emiAmount: e.target.value }))}
                className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 h-11 bg-card dark:bg-slate-950 border-border dark:border-slate-800 w-full"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Status</Label>
              <Select
                value={editFormData.status}
                onValueChange={(value) => setEditFormData((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 h-11 bg-card dark:bg-slate-950 border-border dark:border-slate-800 w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-3 sm:gap-3 pt-2">
            <Button variant="outline" onClick={() => setEditItem(null)} disabled={editSubmitting} className="rounded-xl border-border dark:border-slate-800 bg-card dark:bg-slate-950 cursor-pointer">
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={editSubmitting} className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white gap-2 shadow-sm cursor-pointer">
              {editSubmitting ? <Loader2Icon className="size-4 animate-spin" /> : <EditIcon className="size-4" />}
              {editSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null) }}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-rose-600">
              <TrashIcon className="h-5 w-5" />
              Delete Loan
            </DialogTitle>
            <DialogDescription className="pt-2 text-base">
              Are you sure you want to delete this loan? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 sm:gap-3 pt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting} className="rounded-xl border-border dark:border-slate-800 bg-card dark:bg-slate-950 cursor-pointer">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white gap-2 shadow-sm cursor-pointer">
              {deleting ? <Loader2Icon className="size-4 animate-spin" /> : <TrashIcon className="size-4" />}
              {deleting ? 'Deleting...' : 'Delete Loan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
