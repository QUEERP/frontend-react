import { toast } from 'sonner';
import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom';
import {  useNavigate  } from 'react-router-dom';
import {
  Loader2Icon,
  MoreHorizontalIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  PlusIcon,
  CalendarIcon,
  Users,
  Banknote,
  TrendingUp,
  TrendingDown,
  Search,
  UserCheck
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UserMenu } from './user-menu'

type EmployeeItem = {
  id: string
  name: string
  email: string
  phone: string
  designation: string
  joinDate: string
  basicSalary: number
  allowance: Array<{ name: string; amount: number }>
  deduction: Array<{ name: string; amount: number }>
}

const PAGE_SIZE = 10

export function EmployeesPageClient({ businessId }: { businessId: string }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { loading: businessLoading, business, currencySymbol } = useBusinessData()

  const [employees, setEmployees] = useState<EmployeeItem[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [isBusinessInactiveDialogOpen, setIsBusinessInactiveDialogOpen] = useState(false)

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5002'

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\\^])/g, '\\$1') + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : ''
  }

  const normalizeLineItems = (items: unknown): Array<{ name: string; amount: number }> => {
    if (!Array.isArray(items)) return []
    return items
      .map((item: any) => ({
        name: String(item?.name || ''),
        amount: Number(item?.amount || 0),
      }))
      .filter((item) => item.name.trim().length > 0 && !Number.isNaN(item.amount))
  }

  const sumLineItems = (items: Array<{ name: string; amount: number }>) =>
    items.reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const fetchEmployees = React.useCallback(async () => {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) return

    setListLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/employees`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
      })

      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to load employees')
      }

      const rows = (Array.isArray(data?.data) ? data.data : []).map((item: any) => ({
        id: String(item?.id || ''),
        name: String(item?.name || ''),
        email: String(item?.email || ''),
        phone: String(item?.phone || ''),
        designation: String(item?.designation || ''),
        joinDate: item?.joinDate ? new Date(item.joinDate).toISOString().split('T')[0] : '',
        basicSalary: Number(item?.basicSalary || 0),
        allowance: normalizeLineItems(item?.allowance),
        deduction: normalizeLineItems(item?.deduction),
      }))

      setEmployees(rows)
    } catch (err: any) {
      toast({
        title: 'Failed to load employees',
        description: err?.message || 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setListLoading(false)
    }
  }, [API_BASE, businessId])

  useEffect(() => {
    if (!businessLoading) {
      void fetchEmployees()
    }
  }, [businessLoading, fetchEmployees])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const base = `${employee.name} ${employee.email} ${employee.phone} ${employee.designation} ${employee.id}`.toLowerCase()
      const matchesSearch = base.includes(searchTerm.toLowerCase())
      return matchesSearch
    })
  }, [employees, searchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedEmployees = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filteredEmployees.slice(start, start + PAGE_SIZE)
  }, [filteredEmployees, safePage])

  const stats = useMemo(() => {
    const totalEmployees = employees.length
    const totalAllowance = employees.reduce((sum, item) => sum + sumLineItems(item.allowance), 0)
    const totalDeduction = employees.reduce((sum, item) => sum + sumLineItems(item.deduction), 0)
    const monthlyPayroll = employees.reduce(
      (sum, item) => sum + Number(item.basicSalary || 0) + sumLineItems(item.allowance) - sumLineItems(item.deduction),
      0,
    )

    return {
      totalEmployees,
      totalAllowance,
      totalDeduction,
      monthlyPayroll,
    }
  }, [employees])

  const handleAddEmployeeClick = () => {
    if (business?.isActive === false) {
      setIsBusinessInactiveDialogOpen(true)
      return
    }
    navigate(`/dashboard/${businessId}/employees/add`)
  }

  const handleDelete = async () => {
    if (!deleteId) return

    setDeleting(true)
    try {
      const token = getCookie('token') || getCookie('accessToken')
      const res = await fetch(`${API_BASE}/api/employees/${encodeURIComponent(deleteId)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to delete employee')
      }

      toast({
        title: 'Employee deleted',
        description: 'The employee has been removed.',
        variant: 'destructive',
      })
      setEmployees((prev) => prev.filter((item) => item.id !== deleteId))
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

  const handleContactTeam = () => {
    window.location.href = 'https://www.queinfotech.com/contact'
  }

  if (businessLoading) {
    return <DashboardPageSkeleton />
  }

  return (
    <div className="flex min-h-svh flex-col gap-8 bg-muted/50 dark:bg-slate-950/50 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Employees
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your employee records and payroll information
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleAddEmployeeClick} className="gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 h-10 px-5">
            <PlusIcon className="h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl border border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-blue-400" />
          <CardHeader className="pb-2">
            <CardDescription className="font-medium text-muted-foreground flex items-center justify-between">
              Total Employees
              <Users className="h-4 w-4 text-blue-500" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{stats.totalEmployees}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Active personnel in system</CardContent>
        </Card>

        <Card className="rounded-2xl border border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-400" />
          <CardHeader className="pb-2">
            <CardDescription className="font-medium text-muted-foreground flex items-center justify-between">
              Total Allowances
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{currencySymbol} {stats.totalAllowance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Monthly cumulative allowances</CardContent>
        </Card>

        <Card className="rounded-2xl border border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber-500 to-amber-400" />
          <CardHeader className="pb-2">
            <CardDescription className="font-medium text-muted-foreground flex items-center justify-between">
              Total Deductions
              <TrendingDown className="h-4 w-4 text-amber-500" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{currencySymbol} {stats.totalDeduction.toLocaleString(undefined, { minimumFractionDigits: 2 })}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Monthly cumulative deductions</CardContent>
        </Card>

        <Card className="rounded-2xl border border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-400" />
          <CardHeader className="pb-2">
            <CardDescription className="font-medium text-muted-foreground flex items-center justify-between">
              Monthly Payroll
              <Banknote className="h-4 w-4 text-indigo-500" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{currencySymbol} {stats.monthlyPayroll.toLocaleString(undefined, { minimumFractionDigits: 2 })}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Estimated net salary payout</CardContent>
        </Card>
      </div>

      {/* Directory Table */}
      <Card className="rounded-2xl border border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm flex flex-col flex-1 overflow-hidden">
        <CardHeader className="border-b border-border/50 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/50 dark:bg-slate-900/50">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <UserCheck className="h-5 w-5 text-blue-500" />
              Employee Directory
            </CardTitle>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search directory..."
              className="pl-9 h-10 rounded-xl bg-card dark:bg-slate-950 border-border dark:border-slate-800 transition-all focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {listLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-sm text-muted-foreground">
              <Loader2Icon className="mb-4 h-8 w-8 animate-spin text-blue-600" /> 
              Loading employee records...
            </div>
          ) : paginatedEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted dark:bg-slate-800 mb-4">
                <Users className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground dark:text-slate-100">No employees found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {searchTerm ? "No employees match your search criteria." : "You haven't added any employees yet. Click 'Add Employee' to get started."}
              </p>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader className="bg-muted/80 dark:bg-slate-900/80 sticky top-0 backdrop-blur-sm">
                  <TableRow className="border-b border-border dark:border-slate-800">
                    <TableHead className="font-semibold h-11">Employee Profile</TableHead>
                    <TableHead className="font-semibold h-11 hidden lg:table-cell">Contact</TableHead>
                    <TableHead className="font-semibold h-11">Role & Joined</TableHead>
                    <TableHead className="font-semibold h-11 text-right">Basic Salary</TableHead>
                    <TableHead className="font-semibold h-11 text-right hidden xl:table-cell">Allowances</TableHead>
                    <TableHead className="font-semibold h-11 text-right hidden xl:table-cell">Deductions</TableHead>
                    <TableHead className="font-semibold h-11 text-right">Net Salary</TableHead>
                    <TableHead className="w-20 font-semibold h-11 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEmployees.map((employee) => (
                    <TableRow key={employee.id} className="border-b border-border dark:border-slate-800/60 hover:bg-muted/50 dark:hover:bg-slate-800/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-sm shadow-sm border border-blue-200/50 dark:border-blue-800/50">
                            {employee.name.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground dark:text-slate-100">{employee.name || 'Untitled Employee'}</span>
                            <span className="text-xs text-muted-foreground">ID: {employee.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm">{employee.email || '-'}</span>
                          <span className="text-xs text-muted-foreground">{employee.phone || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-foreground dark:bg-slate-800 dark:text-slate-300 border border-border dark:border-slate-700">
                            {employee.designation || 'Unassigned'}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CalendarIcon className="size-3" />
                            <span>{employee.joinDate || 'N/A'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {currencySymbol} {Number(employee.basicSalary || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right hidden xl:table-cell text-emerald-600 dark:text-emerald-400 text-sm">
                        +{currencySymbol} {sumLineItems(employee.allowance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right hidden xl:table-cell text-amber-600 dark:text-amber-400 text-sm">
                        -{currencySymbol} {sumLineItems(employee.deduction).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right font-bold text-indigo-600 dark:text-indigo-400">
                        {currencySymbol} {(Number(employee.basicSalary || 0) + sumLineItems(employee.allowance) - sumLineItems(employee.deduction)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800">
                              <MoreHorizontalIcon className="size-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 rounded-xl">
                            <DropdownMenuLabel className="text-xs font-semibold uppercase text-muted-foreground">Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild className="rounded-lg cursor-pointer focus:bg-blue-50 focus:text-blue-600 dark:focus:bg-blue-900/30 dark:focus:text-blue-400">
                              <Link to={`/dashboard/${businessId}/employees/${employee.id}`} className="flex items-center">
                                <EyeIcon className="mr-2 size-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="rounded-lg cursor-pointer focus:bg-muted dark:focus:bg-slate-800">
                              <Link to={`/dashboard/${businessId}/employees/${employee.id}/edit`} className="flex items-center">
                                <EditIcon className="mr-2 size-4" />
                                Edit Employee
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-muted dark:bg-slate-800" />
                            <DropdownMenuItem 
                              className="rounded-lg cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-500 dark:focus:bg-red-900/30 dark:focus:text-red-400" 
                              onClick={() => setDeleteId(employee.id)}
                            >
                              <TrashIcon className="mr-2 size-4" />
                              Delete Employee
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

          {paginatedEmployees.length > 0 && (
            <div className="border-t border-border dark:border-slate-800 p-4 flex items-center justify-between bg-muted/50 dark:bg-slate-900/50">
              <p className="text-xs text-muted-foreground font-medium">Page {safePage} of {totalPages}</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg h-8 px-3 border-border dark:border-slate-800 bg-card dark:bg-slate-950"
                  disabled={safePage <= 1 || listLoading}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg h-8 px-3 border-border dark:border-slate-800 bg-card dark:bg-slate-950"
                  disabled={safePage >= totalPages || listLoading}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-500 flex items-center gap-2">
              <TrashIcon className="h-5 w-5" />
              Delete Employee
            </DialogTitle>
            <DialogDescription className="pt-2">
              This action cannot be undone. Do you really want to permanently delete this employee record?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl border-border dark:border-slate-800 bg-card dark:bg-slate-950" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" className="rounded-xl gap-2 bg-red-600 hover:bg-red-700" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2Icon className="size-4 animate-spin" /> : <TrashIcon className="size-4" />}
              Delete Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBusinessInactiveDialogOpen} onOpenChange={setIsBusinessInactiveDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-600 dark:text-amber-500 flex items-center gap-2">
              Business Inactive
            </DialogTitle>
            <DialogDescription className="pt-2">
              Your business account is currently inactive. Please contact the Que Info Tech team to restore your access and add new employees.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl border-border dark:border-slate-800 bg-card dark:bg-slate-950" onClick={() => setIsBusinessInactiveDialogOpen(false)}>
              Close
            </Button>
            <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white" onClick={handleContactTeam}>
              Contact Support
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
