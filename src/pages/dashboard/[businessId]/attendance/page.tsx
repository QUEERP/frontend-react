import React, { useState, useEffect } from 'react'
import {  useParams, useNavigate  } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ClipboardCheck,
  Clock,
  CalendarDays,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getCookie } from '@/lib/utils'
import { attendanceAPI } from '@/lib/api/attendance'
import { toast } from 'sonner'

export default function AttendancePage() {
  const params = useParams()
  const navigate = useNavigate()
  

  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<any[]>([])
  const [records, setRecords] = useState<any[]>([])
  const [stats, setStats] = useState<any>({ present: 0, absent: 0, onLeave: 0, total: 0 })

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    employeeId: '',
    status: 'Present',
    checkIn: '',
    checkOut: ''
  })

  useEffect(() => {
    fetchData()
  }, [businessId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = getCookie('token') || getCookie('accessToken')
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/$/, '')
      
      // Fetch employees
      const empRes = await fetch(`${API_BASE}/api/employees`, {
        headers: { Authorization: `Bearer ${token}`, 'x-business-id': businessId }
      })
      const empData = await empRes.json()
      const empList = empData.employees || empData.data || []
      setEmployees(empList)

      // Fetch today's logs
      const logsData = await attendanceAPI.getLogs(businessId)
      const logsList = logsData.logs || []
      
      const formattedRecords = logsList.map((log: any) => {
        const checkInTime = log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—'
        const checkOutTime = log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—'
        let hours = '—'
        if (log.checkIn && log.checkOut) {
          const diff = new Date(log.checkOut).getTime() - new Date(log.checkIn).getTime()
          const h = Math.floor(diff / (1000 * 60 * 60))
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          hours = `${h}h ${m}m`
        }
        return {
          id: log.id,
          name: log.employee?.name || 'Unknown',
          status: log.status,
          checkIn: checkInTime,
          checkOut: checkOutTime,
          hours: log.hours || hours
        }
      })
      setRecords(formattedRecords)

      // Compute Stats
      const present = formattedRecords.filter((r: any) => r.status === 'Present').length
      const absent = formattedRecords.filter((r: any) => r.status === 'Absent').length
      const onLeave = formattedRecords.filter((r: any) => r.status === 'On Leave').length
      setStats({ present, absent, onLeave, total: empList.length })

    } catch (err: any) {
      toast.error(err.message || 'Failed to load attendance data')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.employeeId) return toast.error('Please select an employee')
    
    setSubmitting(true)
    try {
      const today = new Date()
      let checkInDate, checkOutDate
      
      if (formData.checkIn) {
        const [h, m] = formData.checkIn.split(':')
        checkInDate = new Date()
        checkInDate.setHours(parseInt(h), parseInt(m), 0, 0)
      }
      if (formData.checkOut) {
        const [h, m] = formData.checkOut.split(':')
        checkOutDate = new Date()
        checkOutDate.setHours(parseInt(h), parseInt(m), 0, 0)
      }

      await attendanceAPI.markAttendance(businessId, {
        employeeId: formData.employeeId,
        status: formData.status,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        date: today
      })
      
      toast.success('Attendance marked successfully')
      setIsDialogOpen(false)
      setFormData({ employeeId: '', status: 'Present', checkIn: '', checkOut: '' })
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Error marking attendance')
    } finally {
      setSubmitting(false)
    }
  }

  const statusStyle: Record<string, string> = {
    Present:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20',
    Absent:   'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200/50 dark:border-rose-500/20',
    'On Leave': 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/20',
    'Half Day': 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/20',
  }

  const statCards = [
    { label: 'Present Today',  value: stats.present, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'group-hover:border-b-emerald-500' },
    { label: 'Absent Today',   value: stats.absent,  icon: XCircle,      color: 'text-rose-600',    bg: 'bg-rose-50', border: 'group-hover:border-b-rose-500'    },
    { label: 'On Leave',       value: stats.onLeave,  icon: CalendarDays, color: 'text-amber-600',   bg: 'bg-amber-50', border: 'group-hover:border-b-amber-500'   },
    { label: 'Total Employees',value: stats.total, icon: Users,        color: 'text-blue-600',    bg: 'bg-blue-50', border: 'group-hover:border-b-blue-500'    },
  ]

  const getInitials = (name: string) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-slate-50/50 dark:bg-slate-950/50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col gap-8 bg-slate-50/50 dark:bg-slate-950/50 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Attendance Log
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track daily employee attendance, working hours, and availability.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1.5 text-xs font-medium rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-sm">
            <CalendarDays className="mr-2 h-3.5 w-3.5 text-blue-500" />
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Badge>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl h-10 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-sm transition-all hover:shadow-md gap-2">
                Mark Attendance
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Mark Attendance</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleMarkAttendance} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Employee</Label>
                  <Select value={formData.employeeId} onValueChange={(val) => setFormData({...formData, employeeId: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.length > 0 ? employees.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                      )) : (
                        <SelectItem value="none" disabled>No employees found</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Present">Present</SelectItem>
                      <SelectItem value="Absent">Absent</SelectItem>
                      <SelectItem value="Half Day">Half Day</SelectItem>
                      <SelectItem value="On Leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Check In</Label>
                    <Input type="time" value={formData.checkIn} onChange={(e) => setFormData({...formData, checkIn: e.target.value})} disabled={formData.status === 'Absent' || formData.status === 'On Leave'} />
                  </div>
                  <div className="space-y-2">
                    <Label>Check Out</Label>
                    <Input type="time" value={formData.checkOut} onChange={(e) => setFormData({...formData, checkOut: e.target.value})} disabled={formData.status === 'Absent' || formData.status === 'On Leave'} />
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save Record'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <Card key={stat.label} className={`rounded-2xl border-x border-t border-b-[3px] border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all group overflow-hidden ${stat.border}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2 bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">{stat.value}</p>
                </div>
                <div className={`rounded-2xl ${stat.bg} dark:bg-opacity-10 p-4 transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
                  <stat.icon className={`h-6 w-6 ${stat.color} dark:opacity-80`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Attendance Table */}
      <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm overflow-hidden flex-1">
        <CardHeader className="border-b border-border/50 pb-4 bg-slate-50/50 dark:bg-slate-900/50 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Clock className="h-5 w-5 text-blue-500" />
            Today's Log
          </CardTitle>
          <Button variant="outline" size="sm" className="rounded-xl h-8 text-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            Export Report
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left px-6 py-4 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">Employee</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">Check In</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">Check Out</th>
                  <th className="text-right px-6 py-4 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {records.length > 0 ? records.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 text-blue-700 dark:text-blue-300 font-semibold text-xs shadow-sm">
                          {getInitials(r.name)}
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`font-medium px-2.5 py-0.5 rounded-lg border ${statusStyle[r.status] || 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'}`}>
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
                      {r.checkIn !== '—' ? (
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="h-3 w-3 text-emerald-500" />
                          {r.checkIn}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
                      {r.checkOut !== '—' ? (
                        <div className="flex items-center gap-1.5">
                          <XCircle className="h-3 w-3 text-rose-500/0" />
                          {r.checkOut}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100 text-right">
                      {r.hours}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No attendance records found for today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-t border-slate-200 dark:border-slate-800">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Connect your attendance hardware or biometric system to auto-populate this log data.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
