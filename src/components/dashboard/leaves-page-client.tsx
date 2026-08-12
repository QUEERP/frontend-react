import { toast } from 'sonner';
import React, { useEffect, useMemo, useState } from 'react'
import { CalendarDaysIcon, Loader2Icon, PlusIcon } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { DashboardModeToggle } from '@/components/dashboard/mode-toggle'
import { UserMenu } from './user-menu'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { useToast } from '@/components/ui/use-toast'

type EmployeeOption = {
  id: string
  name: string
  designation?: string
}

type LeaveItem = {
  id: string
  employeeId: string
  leaveCode: string
  duration: 'FULL' | 'HALF'
  date: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  employeeName: string
  designation: string
}

type LeaveTypeOption = {
  code: string
  yearlyLimit: number
}

const LWP_CODE = 'LWP'

const normalizeLeaveTypes = (value: unknown): LeaveTypeOption[] => {
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

export function LeavesPageClient({ businessId }: { businessId: string }) {
  const { toast } = useToast()
  const { business, loading: businessLoading } = useBusinessData()

  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [leaves, setLeaves] = useState<LeaveItem[]>([])
  const [pageLoading, setPageLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sessionRole, setSessionRole] = useState('')
  const [sessionEmployeeId, setSessionEmployeeId] = useState('')

  const [formData, setFormData] = useState({
    employeeId: '',
    leaveCode: LWP_CODE,
    date: new Date().toISOString().split('T')[0],
    duration: 'FULL' as 'FULL' | 'HALF',
  })

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\\^])/g, '\\$1') + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : ''
  }

  const decodeJwtPayload = React.useCallback((token: string) => {
    try {
      const parts = token.split('.')
      if (parts.length < 2) return null

      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
      const decoded = atob(padded)
      return JSON.parse(decoded)
    } catch {
      return null
    }
  }, [])

  const isEmployeeSession = useMemo(() => {
    const normalizedRole = String(sessionRole || '').trim().toUpperCase()
    return normalizedRole === 'EMPLOYEE' || Boolean(sessionEmployeeId)
  }, [sessionEmployeeId, sessionRole])

  useEffect(() => {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) {
      setSessionRole('')
      setSessionEmployeeId('')
      return
    }

    const payload = decodeJwtPayload(token)
    const role = String(payload?.role || '').trim()
    const employeeId = String(payload?.employeeId || '').trim()

    setSessionRole(role)
    setSessionEmployeeId(employeeId)
    if (employeeId) {
      setFormData((prev) => ({ ...prev, employeeId }))
    }
  }, [decodeJwtPayload])

  const leaveTypeOptions = useMemo(() => {
    const settingsData = (business as any)?.settings
    const settings = Array.isArray(settingsData) ? settingsData[0] || null : settingsData || null
    const fromSettings = normalizeLeaveTypes(settings?.leaveTypes)

    if (fromSettings.length > 0) {
      const hasLwp = fromSettings.some((item) => String(item.code).trim().toUpperCase() === LWP_CODE)
      return hasLwp
        ? fromSettings
        : [{ code: LWP_CODE, yearlyLimit: Number.POSITIVE_INFINITY }, ...fromSettings]
    }

    const fromHistory = Array.from(
      new Set(leaves.map((item) => String(item.leaveCode || '').trim()).filter(Boolean)),
    ).map((code) => ({ code, yearlyLimit: 0 }))

    const hasLwpInHistory = fromHistory.some((item) => String(item.code).trim().toUpperCase() === LWP_CODE)
    return hasLwpInHistory
      ? fromHistory
      : [{ code: LWP_CODE, yearlyLimit: Number.POSITIVE_INFINITY }, ...fromHistory]
  }, [business, leaves])

  const hasConfiguredLeaveTypes = useMemo(() => {
    const settingsData = (business as any)?.settings
    const settings = Array.isArray(settingsData) ? settingsData[0] || null : settingsData || null
    return normalizeLeaveTypes(settings?.leaveTypes).length > 0
  }, [business])

  const availableLeaveTypeOptions = useMemo(() => {
    if (!formData.employeeId) return leaveTypeOptions
    if (!hasConfiguredLeaveTypes) return leaveTypeOptions

    const targetYear = formData.date ? new Date(formData.date).getFullYear() : new Date().getFullYear()

    const usedByCode = leaves.reduce<Record<string, number>>((acc, item) => {
      if (String(item.employeeId) !== String(formData.employeeId)) return acc
      if (!item.date) return acc

      const leaveDate = new Date(item.date)
      if (Number.isNaN(leaveDate.getTime()) || leaveDate.getFullYear() !== targetYear) {
        return acc
      }

      const consumed = item.duration === 'HALF' ? 0.5 : 1
      const code = String(item.leaveCode || '').trim()
      if (!code) return acc

      acc[code] = Number((acc[code] || 0) + consumed)
      return acc
    }, {})

    return leaveTypeOptions.filter((type) => {
      if (String(type.code || '').trim().toUpperCase() === LWP_CODE) {
        return true
      }
      const used = Number(usedByCode[type.code] || 0)
      const remaining = Number(type.yearlyLimit || 0) - used
      return remaining > 0
    })
  }, [formData.employeeId, formData.date, hasConfiguredLeaveTypes, leaveTypeOptions, leaves])

  useEffect(() => {
    const hasCurrentSelection = availableLeaveTypeOptions.some((item) => item.code === formData.leaveCode)

    if (!hasCurrentSelection) {
      const lwpOption = availableLeaveTypeOptions.find(
        (item) => String(item.code || '').trim().toUpperCase() === LWP_CODE,
      )
      setFormData((prev) => ({
        ...prev,
        leaveCode: lwpOption?.code || (availableLeaveTypeOptions.length > 0 ? availableLeaveTypeOptions[0].code : ''),
      }))
    }
  }, [availableLeaveTypeOptions, formData.leaveCode])

  const fetchData = React.useCallback(async () => {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) return

    const payload = decodeJwtPayload(token)
    const requestRole = String(payload?.role || '').trim().toUpperCase()
    const requestEmployeeId = String(payload?.employeeId || '').trim()
    const requestIsEmployeeSession = requestRole === 'EMPLOYEE' || Boolean(requestEmployeeId)

    setPageLoading(true)
    try {
      const leaveEndpoint = requestIsEmployeeSession ? '/api/leaves/me' : '/api/leaves'
      const leaveRes = await fetch(`${API_BASE}${leaveEndpoint}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
      })

      const leaveData = await leaveRes.json()

      if (!leaveRes.ok || !leaveData?.success) {
        throw new Error(leaveData?.message || 'Failed to load leaves')
      }

      let employeeRows: EmployeeOption[] = []
      let currentEmployeeProfile: EmployeeOption | null = null
      let leaveMetadataById: Record<string, { employeeName: string; designation: string }> = {}
      if (!requestIsEmployeeSession) {
        const employeeRes = await fetch(`${API_BASE}/api/employees`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'x-business-id': businessId,
          },
        })
        const employeeData = await employeeRes.json()
        if (!employeeRes.ok || !employeeData?.success) {
          throw new Error(employeeData?.message || 'Failed to load employees')
        }

        employeeRows = (Array.isArray(employeeData?.data) ? employeeData.data : []).map((item: any) => ({
          id: String(item?.id || ''),
          name: String(item?.name || ''),
          designation: String(item?.designation || ''),
        }))
      } else if (requestEmployeeId) {
        // /api/leaves/me does not include joined employee details; enrich from employee profile when available.
        try {
          const employeeRes = await fetch(`${API_BASE}/api/employees`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'x-business-id': businessId,
            },
          })

          const employeeData = await employeeRes.json()
          if (employeeRes.ok && employeeData?.success) {
            const rows = Array.isArray(employeeData?.data) ? employeeData.data : []
            const found = rows.find((item: any) => String(item?.id || '') === requestEmployeeId)
            if (found) {
              currentEmployeeProfile = {
                id: String(found?.id || ''),
                name: String(found?.name || ''),
                designation: String(found?.designation || ''),
              }
            }
          }
        } catch {
          // Keep leaves list functional even if profile enrichment fails.
        }

        // Fallback enrichment source: full leave list usually includes joined employee details.
        try {
          const allLeavesRes = await fetch(`${API_BASE}/api/leaves`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'x-business-id': businessId,
            },
          })
          const allLeavesData = await allLeavesRes.json()

          if (allLeavesRes.ok && allLeavesData?.success) {
            const allLeavesRows = Array.isArray(allLeavesData?.data) ? allLeavesData.data : []
            leaveMetadataById = allLeavesRows.reduce((acc: Record<string, { employeeName: string; designation: string }>, row: any) => {
              const id = String(row?.id || '')
              if (!id) return acc

              acc[id] = {
                employeeName: String(row?.employee?.name || ''),
                designation: String(row?.employee?.designation || ''),
              }
              return acc
            }, {} as Record<string, { employeeName: string; designation: string }>)
          }
        } catch {
          // Keep leaves list functional even if metadata fallback fails.
        }
      }

      const leaveRows = (Array.isArray(leaveData?.data) ? leaveData.data : []).map((item: any) => {
        const rowId = String(item?.id || '')
        const metadata = leaveMetadataById[rowId]
        const normalizedStatus = String(item?.status || 'PENDING').trim().toUpperCase()

        return {
        id: String(item?.id || ''),
        employeeId: String(item?.employeeId || ''),
        leaveCode: String(item?.leaveCode || ''),
        duration: String(item?.duration || 'FULL').toUpperCase() === 'HALF' ? 'HALF' : 'FULL',
        date: item?.date ? new Date(item.date).toISOString().split('T')[0] : '',
        status: normalizedStatus === 'APPROVED' || normalizedStatus === 'REJECTED' ? normalizedStatus : 'PENDING',
        employeeName: requestIsEmployeeSession
          ? String(currentEmployeeProfile?.name || metadata?.employeeName || item?.employee?.name || 'You')
          : String(item?.employee?.name || ''),
        designation: requestIsEmployeeSession
          ? String(currentEmployeeProfile?.designation || metadata?.designation || item?.employee?.designation || '')
          : String(item?.employee?.designation || ''),
      }
      })

      setEmployees(employeeRows)
      setLeaves(leaveRows)

      if (requestIsEmployeeSession && requestEmployeeId) {
        setFormData((prev) => ({ ...prev, employeeId: requestEmployeeId }))
      } else if (!formData.employeeId && employeeRows.length > 0) {
        setFormData((prev) => ({ ...prev, employeeId: employeeRows[0].id }))
      }
    } catch (err: any) {
      toast({
        title: 'Failed to load leaves data',
        description: err?.message || 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setPageLoading(false)
    }
  }, [API_BASE, businessId, decodeJwtPayload, formData.employeeId])

  useEffect(() => {
    if (!businessLoading) {
      void fetchData()
    }
  }, [businessLoading, fetchData])

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.employeeId || !formData.leaveCode || !formData.date) {
      toast({
        title: 'Validation error',
        description: 'Employee, leave type, and date are required.',
        variant: 'destructive',
      })
      return
    }

    const isAllowedLeaveType = availableLeaveTypeOptions.some((item) => item.code === formData.leaveCode)
    if (!isAllowedLeaveType) {
      toast({
        title: 'Validation error',
        description: 'Selected leave type has no remaining balance for this employee.',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const token = getCookie('token') || getCookie('accessToken')
      const res = await fetch(`${API_BASE}/api/leaves`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
        body: JSON.stringify({
          employeeId: formData.employeeId,
          leaveCode: formData.leaveCode,
          date: formData.date,
          duration: formData.duration,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to create leave')
      }

      toast({
        title: 'Leave created',
        description: 'Leave entry has been recorded successfully.',
      })

      await fetchData()
    } catch (err: any) {
      toast({
        title: 'Failed to create leave',
        description: err?.message || 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const leaveCodeLabels = useMemo(() => {
    return leaveTypeOptions.reduce<Record<string, string>>((acc, item) => {
      if (String(item.code || '').trim().toUpperCase() === LWP_CODE) {
        acc[item.code] = `${item.code} (∞/year)`
      } else {
        acc[item.code] = `${item.code}${item.yearlyLimit > 0 ? ` (${item.yearlyLimit}/year)` : ''}`
      }
      return acc
    }, {})
  }, [leaveTypeOptions])

  const filteredLeaves = useMemo(() => {
    const from = fromDate ? new Date(fromDate) : null
    const to = toDate ? new Date(toDate) : null

    if (from) from.setHours(0, 0, 0, 0)
    if (to) to.setHours(23, 59, 59, 999)

    return leaves.filter((item) => {
      if (!item.date) return false
      const current = new Date(item.date)
      if (Number.isNaN(current.getTime())) return false

      if (from && current < from) return false
      if (to && current > to) return false
      return true
    })
  }, [leaves, fromDate, toDate])

  const getStatusBadgeClasses = (status: LeaveItem['status']) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20'
      case 'REJECTED':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200/50 dark:border-rose-500/20'
      default:
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/20'
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  return (
    <div className="flex min-h-svh flex-col gap-8 bg-muted/50 dark:bg-slate-950/50 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm">
            <CalendarDaysIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Leaves Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Create and track employee leave records and balances.</p>
          </div>
        </div>
      </div>

      <Card className="rounded-2xl border border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/50 pb-4 bg-muted/50 dark:bg-slate-900/50">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <PlusIcon className="h-5 w-5 text-blue-500" />
            Request Leave
          </CardTitle>
          <CardDescription>
            Choose an employee, leave type, date, and duration to create a leave entry.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleCreateLeave} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {!isEmployeeSession ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Employee</Label>
                <Select
                  value={formData.employeeId}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, employeeId: value }))}
                >
                  <SelectTrigger className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name || employee.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Leave Type</Label>
              <Select
                value={formData.leaveCode}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, leaveCode: value }))}
              >
                <SelectTrigger className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {availableLeaveTypeOptions.map((leaveType) => (
                    <SelectItem key={leaveType.code} value={leaveType.code}>
                      {leaveType.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.employeeId && availableLeaveTypeOptions.length === 0 ? (
                <p className="text-xs text-muted-foreground mt-1">No leave types with remaining balance.</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Duration</Label>
              <Select
                value={formData.duration}
                onValueChange={(value: 'FULL' | 'HALF') => setFormData((prev) => ({ ...prev, duration: value }))}
              >
                <SelectTrigger className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="FULL">Full Day</SelectItem>
                  <SelectItem value="HALF">Half Day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 lg:col-span-4 flex justify-end mt-2">
              <Button type="submit" disabled={submitting || pageLoading} className="gap-2 rounded-xl h-11 px-8 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-sm transition-all hover:shadow-md">
                {submitting ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <PlusIcon className="h-4 w-4" />}
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm overflow-hidden flex-1">
        <CardHeader className="border-b border-border/50 pb-4 bg-muted/50 dark:bg-slate-900/50">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <CalendarDaysIcon className="h-5 w-5 text-blue-500" />
            Leave Records
          </CardTitle>
          <CardDescription>Filter and view all leave entries.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 grid gap-4 md:grid-cols-[1fr_1fr_auto] bg-muted/50 dark:bg-slate-900/50 border-b border-border dark:border-slate-800">
            <div className="space-y-1.5">
              <Label htmlFor="leave-filter-from" className="text-xs font-semibold uppercase text-muted-foreground">From Date</Label>
              <Input
                id="leave-filter-from"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="leave-filter-to" className="text-xs font-semibold uppercase text-muted-foreground">To Date</Label>
              <Input
                id="leave-filter-to"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800 h-10"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl h-10 border-border dark:border-slate-800 bg-card dark:bg-slate-950"
                onClick={() => {
                  setFromDate('')
                  setToDate('')
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {pageLoading ? (
              <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                <Loader2Icon className="mr-2 h-5 w-5 animate-spin text-blue-500" /> Loading leave records...
              </div>
            ) : filteredLeaves.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                <CalendarDaysIcon className="h-8 w-8 text-slate-300 dark:text-foreground" />
                No leave records found for the selected period.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 dark:bg-slate-900/50 border-b border-border dark:border-slate-800">
                    <th className="text-left px-6 py-4 font-semibold text-muted-foreground dark:text-slate-400 uppercase text-xs tracking-wider">Employee</th>
                    <th className="text-left px-6 py-4 font-semibold text-muted-foreground dark:text-slate-400 uppercase text-xs tracking-wider">Designation</th>
                    <th className="text-left px-6 py-4 font-semibold text-muted-foreground dark:text-slate-400 uppercase text-xs tracking-wider">Leave Type</th>
                    <th className="text-left px-6 py-4 font-semibold text-muted-foreground dark:text-slate-400 uppercase text-xs tracking-wider">Date</th>
                    <th className="text-left px-6 py-4 font-semibold text-muted-foreground dark:text-slate-400 uppercase text-xs tracking-wider">Duration</th>
                    <th className="text-left px-6 py-4 font-semibold text-muted-foreground dark:text-slate-400 uppercase text-xs tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredLeaves.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 text-blue-700 dark:text-blue-300 font-semibold text-xs shadow-sm shrink-0">
                            {getInitials(item.employeeName || item.employeeId)}
                          </div>
                          <span className="font-semibold text-foreground dark:text-slate-100 line-clamp-1">{item.employeeName || item.employeeId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground dark:text-slate-400 font-medium">{item.designation || '-'}</td>
                      <td className="px-6 py-4 text-muted-foreground dark:text-slate-400 font-medium">
                        {leaveCodeLabels[item.leaveCode] || item.leaveCode}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground dark:text-slate-400 font-medium">
                        {item.date || '-'}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground dark:text-slate-400 font-medium">
                        {item.duration === 'HALF' ? 'Half Day' : 'Full Day'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={`font-medium px-2.5 py-0.5 rounded-lg border ${getStatusBadgeClasses(item.status)}`}>
                          {item.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
