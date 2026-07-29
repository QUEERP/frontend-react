import { toast } from 'sonner';
import React, { useEffect, useMemo, useState } from 'react'
import {  useNavigate  } from 'react-router-dom';
import {
  Loader2Icon,
  PlusIcon,
  ReceiptIcon,
  SearchIcon,
  TrashIcon,
  EditIcon,
  EyeIcon,
  MoreHorizontalIcon,
  WalletIcon,
  PieChartIcon,
  DownloadIcon,
  TrendingUpIcon,
  Building2Icon,
  CalendarIcon,
  CreditCardIcon,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { DashboardModeToggle } from '@/components/dashboard/mode-toggle'
import { UserMenu } from './user-menu'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { useToast } from '@/components/ui/use-toast'
import { DashboardPageSkeleton } from '@/components/dashboard/dashboard-page-skeleton'
import { CurrencySelect } from '@/components/dashboard/currency-select'

type VendorOption = {
  id: string
  name: string
}

type ExpenseItem = {
  id: string
  title: string
  amount: number
  category: string
  paymentMethod: string
  date: string
  notes: string
  vendorId: string
  vendorName: string
  currency: string
  createdAt: string
}

type CreateFormData = {
  title: string
  amount: string
  category: string
  paymentMethod: string
  date: string
  notes: string
  vendorId: string
}

type EditFormData = {
  title: string
  amount: string
  category: string
  paymentMethod: string
  date: string
  notes: string
  vendorId: string
  currency: string
}

const PAGE_SIZE = 10

const CATEGORY_OPTIONS = [
  'Office Supplies',
  'Rent',
  'Utilities',
  'Travel',
  'Marketing',
  'Software',
  'Hardware',
  'Salary',
  'Insurance',
  'Maintenance',
  'Other',
]

const PAYMENT_METHOD_OPTIONS = [
  'Cash',
  'Bank Transfer',
  'Credit Card',
  'Debit Card',
  'Cheque',
  'Online',
  'Other',
]

export function ExpensePageClient({ businessId }: { businessId: string }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { loading: businessLoading, currencySymbol, business } = useBusinessData()
  const isConstruction = business?.businessType === 'Construction'

  const [vendors, setVendors] = useState<VendorOption[]>([])
  const [expenseList, setExpenseList] = useState<ExpenseItem[]>([])
  const [pageLoading, setPageLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Create form
  const [formData, setFormData] = useState<CreateFormData>({
    title: '',
    amount: '',
    category: '',
    paymentMethod: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    vendorId: '',
  })



  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)

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
      const [vendorRes, expenseRes] = await Promise.all([
        fetch(`${API_BASE}/api/purchase/vendors`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-business-id': businessId,
          },
        }),
        fetch(`${API_BASE}/api/expenses`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-business-id': businessId,
          },
        }),
      ])

      const vendorData = await vendorRes.json()
      const expenseData = await expenseRes.json()

      // Vendors (may fail if no permission, that's okay — just no vendor selector)
      const vendorRows: VendorOption[] =
        vendorRes.ok && vendorData?.success
          ? (Array.isArray(vendorData?.data) ? vendorData.data : []).map((item: any) => ({
              id: String(item?.id || ''),
              name: String(item?.name || ''),
            }))
          : []
      setVendors(vendorRows)

      const vendorMap = new Map(vendorRows.map((v) => [v.id, v]))

      if (!expenseRes.ok || !expenseData?.success) {
        throw new Error(expenseData?.message || 'Failed to load expenses')
      }

      const rows: ExpenseItem[] = (Array.isArray(expenseData?.data) ? expenseData.data : []).map(
        (item: any) => {
          const vendor = vendorMap.get(String(item?.vendorId || '')) || item?.vendor
          return {
            id: String(item?.id || ''),
            title: String(item?.title || ''),
            amount: Number(item?.amount || 0),
            category: String(item?.category || ''),
            paymentMethod: String(item?.paymentMethod || ''),
            date: item?.date ? new Date(item.date).toISOString().split('T')[0] : '',
            notes: String(item?.notes || ''),
            vendorId: String(item?.vendorId || ''),
            vendorName: String(vendor?.name || item?.vendor?.name || ''),
            currency: String(item?.currency || 'AED'),
            createdAt: item?.createdAt || '',
          }
        },
      )
      setExpenseList(rows)
    } catch (err: any) {
      toast({
        title: 'Failed to load expense data',
        description: err?.message || 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setPageLoading(false)
    }
  }, [API_BASE, businessId, toast])

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
    const totalExpenses = expenseList.length
    const totalAmount = expenseList.reduce((sum, e) => sum + e.amount, 0)
    const categories = new Set(expenseList.map((e) => e.category)).size
    return { totalExpenses, totalAmount, categories }
  }, [expenseList])

  // ─── Search + Pagination ──────────────────────────────────────────────────

  const filteredList = useMemo(() => {
    const query = searchTerm.toLowerCase()
    return expenseList.filter((item) => {
      const base = `${item.title} ${item.category} ${item.vendorName} ${item.paymentMethod} ${item.notes}`.toLowerCase()
      return base.includes(query)
    })
  }, [expenseList, searchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedList = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filteredList.slice(start, start + PAGE_SIZE)
  }, [filteredList, safePage])

  // ─── Create Expense ───────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast({ title: 'Validation error', description: 'Title is required.', variant: 'destructive' })
      return
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast({ title: 'Validation error', description: 'Amount must be greater than 0.', variant: 'destructive' })
      return
    }
    if (!formData.category) {
      toast({ title: 'Validation error', description: 'Category is required.', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const token = getCookie('token') || getCookie('accessToken')
      const body: Record<string, any> = {
        title: formData.title.trim(),
        amount: Number(formData.amount),
        category: formData.category,
      }
      if (formData.paymentMethod) body.paymentMethod = formData.paymentMethod
      if (formData.date) body.date = formData.date
      if (formData.notes.trim()) body.notes = formData.notes.trim()
      if (formData.vendorId) body.vendorId = formData.vendorId

      const res = await fetch(`${API_BASE}/api/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to create expense')
      }

      toast({ title: 'Expense created', description: 'Expense has been recorded successfully.' })
      setFormData({
        title: '',
        amount: '',
        category: '',
        paymentMethod: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        vendorId: '',
      })
      await fetchData()
    } catch (err: any) {
      toast({
        title: 'Failed to create expense',
        description: err?.message || 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }



  // ─── Download PDF ─────────────────────────────────────────────────────────
  const handleDownloadPdf = (id: string) => {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) return

    const url = `${API_BASE}/api/expenses/${id}/pdf`
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to generate PDF')
        const blob = await res.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `Expense_${id.substring(0, 8)}.pdf`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(downloadUrl)
        toast({ title: 'Success', description: 'PDF downloaded successfully' })
      })
      .catch((err) => {
        toast({
          title: 'Error',
          description: err.message || 'Could not download PDF',
          variant: 'destructive',
        })
      })
  }

  // ─── Delete Expense ───────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteId) return

    setDeleting(true)
    try {
      const token = getCookie('token') || getCookie('accessToken')
      const res = await fetch(`${API_BASE}/api/expenses/${encodeURIComponent(deleteId)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
      })

      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to delete expense')
      }

      toast({ title: 'Expense deleted', description: 'Expense has been removed.', variant: 'destructive' })
      setExpenseList((prev) => prev.filter((item) => item.id !== deleteId))
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Expenses
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage business expenditures
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate(`/dashboard/${businessId}/expenses/add`)}
            className="gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
          >
            <PlusIcon className="size-4" />
            New Expense
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                <p className="text-3xl font-bold tracking-tight">{stats.totalExpenses}</p>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20">
                <ReceiptIcon className="size-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              <TrendingUpIcon className="mr-1 size-3" /> All expense records
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-400" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="text-3xl font-bold tracking-tight">
                  {currencySymbol} {stats.totalAmount.toLocaleString(currencySymbol === 'CAD' ? 'en-CA' : 'en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20">
                <WalletIcon className="size-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              <TrendingUpIcon className="mr-1 size-3" /> Total expenditure
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <p className="text-3xl font-bold tracking-tight">{stats.categories}</p>
              </div>
              <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-900/20">
                <PieChartIcon className="size-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              <PieChartIcon className="mr-1 size-3" /> Distinct expense categories
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col">
          <Card className="rounded-2xl border border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm flex-1 flex flex-col overflow-hidden">
            <CardHeader className="border-b border-border/50 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/50 dark:bg-slate-900/50">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <ReceiptIcon className="size-5 text-blue-500" />
                  Expense Records
                </CardTitle>
                <CardDescription>All expense entries for this business.</CardDescription>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search expenses..."
                    className="h-10 w-full pl-9 rounded-xl bg-card dark:bg-slate-950 border-border dark:border-slate-800 transition-all focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
              {pageLoading ? (
                <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2Icon className="size-8 animate-spin text-blue-500" />
                    <p>Loading expenses...</p>
                  </div>
                </div>
              ) : paginatedList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="flex size-16 items-center justify-center rounded-full bg-muted dark:bg-slate-800 mb-4">
                    <ReceiptIcon className="size-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground dark:text-slate-100">No expenses found</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    {searchTerm ? "No expenses match your search query." : "You haven't recorded any expenses yet. Create your first expense using the form."}
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-auto">
                  <Table>
                    <TableHeader className="bg-muted/80 dark:bg-slate-900/80 sticky top-0 backdrop-blur-sm z-10">
                      <TableRow className="border-b border-border dark:border-slate-800">
                        <TableHead className="font-semibold h-11">Title</TableHead>
                        <TableHead className="font-semibold h-11">Amount</TableHead>
                        {!isConstruction && <TableHead className="font-semibold h-11 hidden sm:table-cell">Category</TableHead>}
                        <TableHead className="font-semibold h-11 hidden md:table-cell">Payment</TableHead>
                        <TableHead className="font-semibold h-11 hidden lg:table-cell">Vendor</TableHead>
                        <TableHead className="font-semibold h-11 hidden sm:table-cell">Date</TableHead>
                        <TableHead className="text-right font-semibold h-11">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedList.map((item) => (
                        <TableRow 
                          key={item.id} 
                          className="border-b border-border dark:border-slate-800/60 hover:bg-muted/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/dashboard/${businessId}/expenses/${item.id}/edit`)}
                        >
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-foreground dark:text-slate-100">{item.title || '-'}</span>
                              {item.notes && (
                                <span className="text-xs text-muted-foreground line-clamp-1 max-w-[200px] mt-0.5">{item.notes}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-foreground dark:bg-slate-800 dark:text-slate-200">
                              {item.currency} {item.amount.toLocaleString(item.currency === 'CAD' ? 'en-CA' : 'en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </TableCell>
                          {!isConstruction && <TableCell className="text-sm hidden sm:table-cell">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
                              {item.category || '-'}
                            </span>
                          </TableCell>}
                          <TableCell className="text-sm hidden md:table-cell text-muted-foreground">{item.paymentMethod || '-'}</TableCell>
                          <TableCell className="text-sm hidden lg:table-cell">
                            {item.vendorName ? (
                              <div className="flex items-center gap-1.5 text-foreground dark:text-slate-300">
                                <Building2Icon className="size-3.5 text-slate-400" />
                                {item.vendorName}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm hidden sm:table-cell text-muted-foreground">
                            {item.date ? new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="size-8 p-0 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontalIcon className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 rounded-xl" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownloadPdf(item.id) }} className="text-sm cursor-pointer rounded-lg focus:bg-emerald-50 focus:text-emerald-600 dark:focus:bg-emerald-900/30 dark:focus:text-emerald-400">
                                  <DownloadIcon className="mr-2 size-4" />
                                  Download PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/${businessId}/expenses/${item.id}/view`) }} className="text-sm cursor-pointer rounded-lg focus:bg-indigo-50 focus:text-indigo-600 dark:focus:bg-indigo-900/30 dark:focus:text-indigo-400">
                                  <EyeIcon className="mr-2 size-4" />
                                  View Expense
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/${businessId}/expenses/${item.id}/edit`) }} className="text-sm cursor-pointer rounded-lg focus:bg-blue-50 focus:text-blue-600 dark:focus:bg-blue-900/30 dark:focus:text-blue-400">
                                  <EditIcon className="mr-2 size-4" />
                                  Edit Entry
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeleteId(item.id)}
                                  className="text-sm cursor-pointer rounded-lg text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-500 dark:focus:bg-red-900/30 dark:focus:text-red-400"
                                >
                                  <TrashIcon className="mr-2 size-4" />
                                  Delete
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
            </CardContent>
            
            {/* Pagination Footer */}
            {!pageLoading && totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border dark:border-slate-800 bg-muted/50 dark:bg-slate-900/50 px-4 py-3 mt-auto">
                <span className="text-xs font-medium text-muted-foreground">
                  Showing <span className="text-foreground dark:text-white">{(safePage - 1) * PAGE_SIZE + 1}</span> to <span className="text-foreground dark:text-white">{Math.min(safePage * PAGE_SIZE, filteredList.length)}</span> of <span className="text-foreground dark:text-white">{filteredList.length}</span> entries
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePage <= 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    className="h-8 rounded-lg text-xs font-medium"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePage >= totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    className="h-8 rounded-lg text-xs font-medium"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>



      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-500 flex items-center gap-2">
              <TrashIcon className="size-5" />
              Delete Expense
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete this expense? This action cannot be undone and will permanently remove this record from your business.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setDeleteId(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" className="rounded-xl gap-2" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2Icon className="size-4 animate-spin" />}
              {deleting ? 'Deleting...' : 'Delete Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    <Dialog open={isDownloadingPdf} onOpenChange={setIsDownloadingPdf}>
        <DialogContent className="sm:max-w-[425px] flex flex-col items-center justify-center p-8">
          <Loader2Icon className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <DialogTitle className="text-xl font-semibold">Processing PDF</DialogTitle>
          <DialogDescription className="text-center mt-2">
            Please wait while your PDF is being generated and downloaded...
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  )
}
