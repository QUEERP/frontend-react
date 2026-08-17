import { toast } from 'sonner';
import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, CalendarDaysIcon, Loader2Icon, UserIcon } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DashboardModeToggle } from '@/components/dashboard/mode-toggle'
import { UserMenu } from './user-menu'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { useToast } from '@/components/ui/use-toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type LeaveTypeConfig = {
  code: string
  yearlyLimit: number
}

type EmployeeLeave = {
  id: string
  leaveCode: string
  duration: 'FULL' | 'HALF'
  date: string
}

type EmployeeDetail = {
  id: string
  name: string
  email: string
  phone: string
  designation: string
  joinDate: string
  basicSalary: number
  allowance: Array<{ name: string; amount: number }>
  deduction: Array<{ name: string; amount: number }>
  leaveBalance: Record<string, number>
  leaves: EmployeeLeave[]
}

const normalizeLeaveTypes = (value: unknown): LeaveTypeConfig[] => {
  let parsed: unknown = value

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    try {
      parsed = JSON.parse(trimmed)
    } catch {
      return []
    }
  }

  if (!Array.isArray(parsed)) return []

  return parsed
    .map((item: any) => {
      const code = String(item?.code || item?.title || item?.name || '').trim()
      const yearlyLimit = Number(item?.yearlyLimit ?? item?.count ?? item?.limit ?? 0)
      return {
        code,
        yearlyLimit: Number.isNaN(yearlyLimit) ? 0 : yearlyLimit,
      }
    })
    .filter((item) => item.code.length > 0)
}

export function EmployeeDetailPageClient({
  businessId,
  employeeId,
}: {
  businessId: string
  employeeId: string
}) {
  const { toast } = useToast()
  const { business, currencySymbol } = useBusinessData()

  const [employee, setEmployee] = useState<EmployeeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [historyFromDate, setHistoryFromDate] = useState('')
  const [historyToDate, setHistoryToDate] = useState('')

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5002'

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\\^])/g, '\\$1') + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : ''
  }

  useEffect(() => {
    const fetchEmployee = async () => {
      const token = getCookie('token') || getCookie('accessToken')
      if (!token) return

      setLoading(true)
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
          throw new Error(data?.message || 'Failed to load employee data')
        }

        const rows = Array.isArray(data?.data) ? data.data : []
        const found = rows.find((item: any) => String(item?.id) === String(employeeId))

        if (!found) {
          setEmployee(null)
          return
        }

        const normalizedLeaves: EmployeeLeave[] = (Array.isArray(found?.leaves) ? found.leaves : []).map((item: any) => ({
          id: String(item?.id || ''),
          leaveCode: String(item?.leaveCode || ''),
          duration: String(item?.duration || 'FULL').toUpperCase() === 'HALF' ? 'HALF' : 'FULL',
          date: item?.date ? new Date(item.date).toISOString().split('T')[0] : '',
        }))

        setEmployee({
          id: String(found?.id || ''),
          name: String(found?.name || ''),
          email: String(found?.email || ''),
          phone: String(found?.phone || ''),
          designation: String(found?.designation || ''),
          joinDate: found?.joinDate ? new Date(found.joinDate).toISOString().split('T')[0] : '',
          basicSalary: Number(found?.basicSalary || 0),
          allowance: Array.isArray(found?.allowance)
            ? found.allowance.map((row: any) => ({ name: String(row?.name || ''), amount: Number(row?.amount || 0) }))
            : [],
          deduction: Array.isArray(found?.deduction)
            ? found.deduction.map((row: any) => ({ name: String(row?.name || ''), amount: Number(row?.amount || 0) }))
            : [],
          leaveBalance:
            found?.leaveBalance && typeof found.leaveBalance === 'object'
              ? Object.entries(found.leaveBalance as Record<string, unknown>).reduce<Record<string, number>>((acc, [key, value]) => {
                  const normalizedKey = String(key || '').trim()
                  if (!normalizedKey) return acc

                  const parsed = Number(value)
                  acc[normalizedKey] = Number.isFinite(parsed) ? Math.max(0, parsed) : 0
                  return acc
                }, {})
              : {},
          leaves: normalizedLeaves,
        })
      } catch (err: any) {
        toast({
          title: 'Failed to load employee',
          description: err?.message || 'Unknown error',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    void fetchEmployee()
  }, [API_BASE, businessId, employeeId])

  const leaveTypes = useMemo(() => {
    const settingsData = (business as any)?.settings
    const settings = Array.isArray(settingsData) ? settingsData[0] || null : settingsData || null
    return normalizeLeaveTypes(settings?.leaveTypes)
  }, [business])

  const pendingLeaves = useMemo(() => {
    if (!employee) return []

    const configuredLeaveTypes = leaveTypes.filter(
      (item) => String(item.code || '').trim().toUpperCase() !== 'LWP',
    )

    if (configuredLeaveTypes.length === 0) return []

    const hasLeaveBalance = Object.keys(employee.leaveBalance || {}).length > 0
    if (hasLeaveBalance) {
      return configuredLeaveTypes.map((item) => {
        const yearlyLimit = Number(item.yearlyLimit || 0)
        const pending = Number(employee.leaveBalance[item.code] || 0)
        const used = Math.max(0, yearlyLimit - pending)

        return {
          code: item.code,
          yearlyLimit,
          used,
          pending,
        }
      })
    }

    const currentYear = new Date().getFullYear()
    const usageByCode = employee.leaves.reduce<Record<string, number>>((acc, item) => {
      if (!item.date) return acc
      const leaveDate = new Date(item.date)
      if (Number.isNaN(leaveDate.getTime()) || leaveDate.getFullYear() !== currentYear) {
        return acc
      }

      const consumed = item.duration === 'HALF' ? 0.5 : 1
      const code = String(item.leaveCode || '').trim()
      if (!code) return acc

      acc[code] = Number((acc[code] || 0) + consumed)
      return acc
    }, {})

    return configuredLeaveTypes.map((item) => {
      const used = Number(usageByCode[item.code] || 0)
      const pending = Math.max(0, Number(item.yearlyLimit) - used)
      return {
        code: item.code,
        yearlyLimit: item.yearlyLimit,
        used,
        pending,
      }
    })
  }, [employee, leaveTypes])

  const totalAllowance = useMemo(
    () => (employee?.allowance || []).reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [employee],
  )
  const totalDeduction = useMemo(
    () => (employee?.deduction || []).reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [employee],
  )

  const filteredLeaveHistory = useMemo(() => {
    const rows = (employee?.leaves || []).slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const from = historyFromDate ? new Date(historyFromDate) : null
    const to = historyToDate ? new Date(historyToDate) : null

    if (from) from.setHours(0, 0, 0, 0)
    if (to) to.setHours(23, 59, 59, 999)

    return rows.filter((item) => {
      if (!item.date) return false
      const current = new Date(item.date)
      if (Number.isNaN(current.getTime())) return false

      if (from && current < from) return false
      if (to && current > to) return false
      return true
    })
  }, [employee?.leaves, historyFromDate, historyToDate])

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Loading employee details...
        </div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-background px-4">
        <p className="text-sm text-muted-foreground">Employee not found.</p>
        <Link to={`/dashboard/${businessId}/employees`}>
          <Button variant="outline">Back to Employees</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-10 pt-0 sm:px-6 lg:px-8">
      <div className="-mx-4 border-b border-border bg-background px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mb-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Link to={`/dashboard/${businessId}/employees`}>
              <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-foreground">
                <ArrowLeftIcon className="size-4" />
              </Button>
            </Link>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-foreground">Employee Detail</span>
              <span className="text-xs text-muted-foreground">Profile and leave balance</span>
            </div>
          </div>

          
        </header>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserIcon className="size-5" />
              {employee.name || 'Employee'}
            </CardTitle>
            <CardDescription>{employee.designation || 'No designation'}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2">
            <div><span className="text-muted-foreground">Email:</span> {employee.email || '-'}</div>
            <div><span className="text-muted-foreground">Phone:</span> {employee.phone || '-'}</div>
            <div><span className="text-muted-foreground">Join Date:</span> {employee.joinDate || '-'}</div>
            <div><span className="text-muted-foreground">Basic Salary:</span> {currencySymbol} {employee.basicSalary.toLocaleString()}</div>
            <div><span className="text-muted-foreground">Allowance:</span> {currencySymbol} {totalAllowance.toLocaleString()}</div>
            <div><span className="text-muted-foreground">Deduction:</span> {currencySymbol} {totalDeduction.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDaysIcon className="size-5" />
              Pending Leaves
            </CardTitle>
            <CardDescription>Current year balance based on settings</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingLeaves.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No leave types configured in settings yet.
              </p>
            ) : (
              <div className="space-y-2">
                {pendingLeaves.map((item) => (
                  <div key={item.code} className="rounded-md border border-border px-3 py-2 text-sm">
                    <div className="font-medium">{item.code}</div>
                    <div className="text-muted-foreground text-xs">
                      Used: {item.used} / {item.yearlyLimit} | Pending: {item.pending}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Leave History</CardTitle>
          <CardDescription>All recorded leaves for this employee.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="history-filter-from">From Date</Label>
              <Input
                id="history-filter-from"
                type="date"
                value={historyFromDate}
                onChange={(e) => setHistoryFromDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="history-filter-to">To Date</Label>
              <Input
                id="history-filter-to"
                type="date"
                value={historyToDate}
                onChange={(e) => setHistoryToDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setHistoryFromDate('')
                  setHistoryToDate('')
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {(employee.leaves || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No leave records available.</p>
          ) : filteredLeaveHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leave records found for the selected date range.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeaveHistory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm">{item.date || '-'}</TableCell>
                      <TableCell className="text-sm">{item.leaveCode || '-'}</TableCell>
                      <TableCell className="text-sm">{item.duration === 'HALF' ? 'Half Day' : 'Full Day'}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
