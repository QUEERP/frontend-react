import React, { useState, useEffect } from 'react'
import {  useParams, useNavigate  } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  TrendingUp,
  TrendingDown,
  UserCheck,
  UserX,
  Clock,
  DollarSign,
  BarChart3,
  Calendar,
  Award,
  AlertCircle,
  ArrowRight,
  AreaChartIcon,
  BriefcaseIcon,
  BuildingIcon,
  FileCheck2Icon,
  FileBadgeIcon
} from 'lucide-react'
import {  useNavigate as useNav  } from 'react-router-dom';

export default function HRAnalyticsPage() {
  const routerParams = useParams() as any;
  const { businessId } = routerParams;

  const params  = useParams()
  const navigate = useNavigate()
  

  const [employees, setEmployees] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const getCookie = (name: string) => {
          if (typeof document === 'undefined') return ''
          const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\]\\^])/g, '\\$1') + '=([^;]*)'))
          return match ? decodeURIComponent(match[1]) : ''
        }
        const token = getCookie('token') || getCookie('accessToken')
        const API_BASE = import.meta.env.VITE_API_BASE || ''
        const res = await fetch(`${API_BASE}/api/employee`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-business-id': businessId as string
          }
        })
        if (res.ok) {
          const data = await res.json()
          setEmployees(data.data || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchEmployees()
  }, [businessId])

  const deptMap = employees.reduce((acc, emp) => {
    const dept = emp.designation || 'Unassigned'
    if (!acc[dept]) acc[dept] = { dept, headcount: 0, avgSalary: 0, totalSalary: 0, openRoles: 0, attrition: '0%' }
    acc[dept].headcount += 1
    acc[dept].totalSalary += Number(emp.basicSalary || 0)
    return acc
  }, {} as Record<string, any>)

  const DEPT_DATA = Object.values(deptMap).map(d => ({
    ...d as any,
    avgSalary: `₹${Math.round((d as any).totalSalary / (d as any).headcount).toLocaleString()}`
  }))

  const totalHeadcount = employees.length
  const totalOpenRoles = 0
  const avgAttrition = '0.0'

  let avgTenure = '0.0 yrs'
  if (employees.length > 0) {
    const now = new Date()
    let totalMonths = 0
    let tenureCount = 0
    employees.forEach(emp => {
      if (emp.joinDate) {
        const jd = new Date(emp.joinDate)
        const months = (now.getFullYear() - jd.getFullYear()) * 12 + (now.getMonth() - jd.getMonth())
        totalMonths += Math.max(0, months)
        tenureCount++
      }
    })
    if (tenureCount > 0) {
      avgTenure = (totalMonths / tenureCount / 12).toFixed(1) + ' yrs'
    }
  }

  const LEAVE_TREND: any[] = []
  const TOP_PERFORMERS: any[] = []
  const maxLeave = 1

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col gap-8 bg-slate-50/50 dark:bg-slate-950/50 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm">
            <AreaChartIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              HR Analytics Hub
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Workforce insights, attrition trends, and department performance.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/${businessId}/employees`)} className="rounded-xl h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 gap-2 shadow-sm">
            <Users className="h-4 w-4 text-blue-500" /> View Employees
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/${businessId}/payrolls`)} className="rounded-xl h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 gap-2 shadow-sm">
            <DollarSign className="h-4 w-4 text-emerald-500" /> Payroll
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Headcount',  value: totalHeadcount,    icon: Users,        colorGroup: 'blue',    trend: 'Total active employees' },
          { label: 'Open Roles',       value: totalOpenRoles,    icon: BriefcaseIcon,colorGroup: 'amber',   trend: 'Currently hiring'   },
          { label: 'Avg. Attrition',   value: `${avgAttrition}%`,icon: TrendingDown, colorGroup: 'rose',    trend: 'Past 12 months'},
          { label: 'Avg. Tenure',      value: avgTenure,         icon: Clock,        colorGroup: 'emerald', trend: 'Average time at company' },
        ].map(stat => {
          const colorStyles: Record<string, string> = {
            blue: 'hover:border-b-blue-500 text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10',
            amber: 'hover:border-b-amber-500 text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10',
            rose: 'hover:border-b-rose-500 text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10',
            emerald: 'hover:border-b-emerald-500 text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10',
          }
          return (
            <Card key={stat.label} className={`rounded-2xl border-x border-t border-b-[3px] border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all group overflow-hidden ${colorStyles[stat.colorGroup].split(' ')[0]}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-2 bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">{stat.value}</p>
                    <p className="text-xs font-medium text-slate-500 mt-2">{stat.trend}</p>
                  </div>
                  <div className={`rounded-2xl p-4 transition-transform duration-300 group-hover:scale-110 shadow-sm ${colorStyles[stat.colorGroup].split(' ').slice(1).join(' ')}`}>
                    <stat.icon className="h-6 w-6 dark:opacity-80" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Department breakdown + Leave trend row */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Department Table — spans 2 cols */}
        <Card className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="border-b border-border/50 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
            <CardTitle className="text-lg flex items-center gap-2 font-semibold">
              <BuildingIcon className="h-5 w-5 text-blue-500" /> Department Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                    {['Department', 'Headcount', 'Avg. Salary', 'Attrition', 'Open Roles'].map(h => (
                      <th key={h} className="text-left px-6 py-4 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {DEPT_DATA.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400 font-medium">No employee data found. Add employees to see insights.</td>
                    </tr>
                  ) : (
                    DEPT_DATA.map(row => (
                      <tr key={row.dept} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">{row.dept}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="font-medium w-4">{row.headcount}</span>
                            {/* Mini bar */}
                            <div className="flex-1 max-w-[80px] h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                                style={{ width: `${(row.headcount / totalHeadcount) * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400">{row.avgSalary}</td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={`font-semibold border px-2.5 py-0.5 ${
                            parseFloat(row.attrition) === 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                            parseFloat(row.attrition) > 10 ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' :
                            'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                          }`}>
                            {row.attrition}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          {row.openRoles > 0
                            ? <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 px-2.5 py-0.5">{row.openRoles} open</Badge>
                            : <span className="text-slate-400 dark:text-slate-500 font-medium text-xs">Filled</span>
                          }
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Leave trend chart — simple bar chart */}
        <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="border-b border-border/50 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
            <CardTitle className="text-lg flex items-center gap-2 font-semibold">
              <Calendar className="h-5 w-5 text-indigo-500" /> Leave Trend (6M)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-between">
            <div className="flex items-end gap-3 h-40">
              {LEAVE_TREND.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-sm text-slate-400 font-medium h-full border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  No leave data available
                </div>
              ) : (
                LEAVE_TREND.map(item => (
                  <div key={item.month} className="flex flex-col items-center gap-2 flex-1 group">
                    <span className="text-xs font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">{item.leaves}</span>
                    <div
                      className="w-full rounded-t-lg bg-indigo-200 dark:bg-indigo-900/40 group-hover:bg-gradient-to-t group-hover:from-indigo-500 group-hover:to-indigo-400 transition-all duration-300 relative overflow-hidden"
                      style={{ height: `${(item.leaves / maxLeave) * 100}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-xs font-medium text-slate-500">{item.month}</span>
                  </div>
                ))
              )}
            </div>
            <p className="text-xs font-medium text-slate-400 mt-6 text-center uppercase tracking-wider">Total leave days per month</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers + Quick Links row */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Top Performers */}
        <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="border-b border-border/50 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
            <CardTitle className="text-lg flex items-center gap-2 font-semibold">
              <Award className="h-5 w-5 text-amber-500" /> Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {TOP_PERFORMERS.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Award className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm font-medium">No performance data available</p>
              </div>
            ) : (
              TOP_PERFORMERS.map((p, i) => (
                <div key={p.name} className="flex items-center gap-4 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-2xl">
                    {p.badge}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-base">{p.name}</p>
                    <p className="text-xs font-medium text-slate-500">{p.dept}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden hidden sm:block">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ width: `${p.score}%` }} />
                    </div>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 w-8 text-right">{p.score}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* HR Quick Links */}
        <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="border-b border-border/50 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
            <CardTitle className="text-lg flex items-center gap-2 font-semibold">
              <BarChart3 className="h-5 w-5 text-slate-700 dark:text-slate-300" /> HR Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid gap-3 sm:grid-cols-2">
            {[
              { label: 'Manage Employees',      route: 'employees',         icon: Users,       colorGroup: 'blue'    },
              { label: 'View Attendance',       route: 'attendance',        icon: UserCheck,   colorGroup: 'emerald' },
              { label: 'Leave Approvals',       route: 'leaves',            icon: Calendar,    colorGroup: 'amber'   },
              { label: 'Run Payroll',           route: 'payrolls',          icon: DollarSign,  colorGroup: 'violet'  },
              { label: 'Employee Documents',    route: 'employee-documents',icon: FileBadgeIcon, colorGroup: 'rose'    },
              { label: 'Overtime Reports',      route: 'overtime',          icon: Clock,       colorGroup: 'orange'  },
            ].map(link => {
              const colorStyles: Record<string, string> = {
                blue: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20',
                emerald: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20',
                amber: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10 group-hover:bg-amber-100 dark:group-hover:bg-amber-500/20',
                violet: 'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-500/10 group-hover:bg-violet-100 dark:group-hover:bg-violet-500/20',
                rose: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10 group-hover:bg-rose-100 dark:group-hover:bg-rose-500/20',
                orange: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-500/10 group-hover:bg-orange-100 dark:group-hover:bg-orange-500/20',
              }
              return (
                <button
                  key={link.label}
                  onClick={() => navigate(`/dashboard/${businessId}/${link.route}`)}
                  className="w-full flex items-center gap-3 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900 p-3 text-left hover:shadow-md transition-all group"
                >
                  <div className={`rounded-xl p-2.5 transition-colors ${colorStyles[link.colorGroup]}`}>
                    <link.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold flex-1 text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{link.label}</span>
                  <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors group-hover:translate-x-0.5" />
                </button>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs font-medium text-slate-400 flex items-center justify-center gap-1.5 mt-2">
        <AlertCircle className="h-3.5 w-3.5" />
        Analytics are generated from real-time employee data. Leave trends and performance metrics will populate as modules are integrated.
      </p>
    </div>
  )
}
