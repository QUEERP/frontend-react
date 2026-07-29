import { toast } from 'sonner';
import * as React from 'react'
import { 
  BarChart3, 
  CalendarRange, 
  RefreshCw, 
  TrendingUp, 
  Target, 
  Users, 
  PhoneCall, 
  Layers, 
  Building,
  CheckCircle,
  Clock,
  Briefcase
} from 'lucide-react'
import {  useLocation  } from 'react-router-dom';

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  getProfitLossReport, 
  getCrmAnalyticsReport, 
  getSalesDashboardReport,
  type ProfitLossReport, 
  type CrmAnalyticsReport,
  type SalesDashboardData
} from '@/lib/api/reports'

function getCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([\\^$|?*+()[\]{}.])/g, '\\$1') + '=([^;]*)')
  )
  return match ? decodeURIComponent(match[1]) : ''
}

const initialReport: ProfitLossReport = {
  income: 0,
  expense: 0,
  profit: 0,
  status: 'PROFIT',
}

export default function ReportsPageClient() {
  const pathname = useLocation().pathname
  const { toast } = useToast()

  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || ''
  const token = React.useMemo(() => getCookie('token') || getCookie('accessToken'), [])

  const [report, setReport] = React.useState<ProfitLossReport>(initialReport)
  const [crmReport, setCrmReport] = React.useState<CrmAnalyticsReport | null>(null)
  const [salesReport, setSalesReport] = React.useState<SalesDashboardData | null>(null)
  
  const [fromDate, setFromDate] = React.useState('')
  const [toDate, setToDate] = React.useState('')
  const [appliedFromDate, setAppliedFromDate] = React.useState('')
  const [appliedToDate, setAppliedToDate] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(true)

  const loadData = React.useCallback(async () => {
    if (!token) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to load reports.',
        variant: 'destructive',
      })
      setIsLoading(false)
      return
    }

    if (!businessId) {
      toast({
        title: 'Business required',
        description: 'Business context was not found.',
        variant: 'destructive',
      })
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      
      // Load Financial, CRM Analytics and Sales parallelly
      const [nextReport, nextCrmReport, nextSalesReport] = await Promise.all([
        getProfitLossReport(token, businessId, {
          fromDate: appliedFromDate || undefined,
          toDate: appliedToDate || undefined,
        }),
        getCrmAnalyticsReport(token, businessId).catch((err) => {
          console.error("CRM Analytics fetch error:", err)
          return null
        }),
        getSalesDashboardReport(token, businessId).catch((err) => {
          console.error("Sales Analytics fetch error:", err)
          return null
        })
      ])
      
      setReport(nextReport)
      if (nextCrmReport) {
        setCrmReport(nextCrmReport)
      }
      if (nextSalesReport) {
        setSalesReport(nextSalesReport)
      }
    } catch (error) {
      toast({
        title: 'Failed to load reports',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [businessId, appliedFromDate, appliedToDate, toast, token])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const chartMax = Math.max(report.income, report.expense, Math.abs(report.profit), 1)

  const currencyValue = React.useCallback((value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0))
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background dark:bg-slate-950 px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card dark:bg-slate-900 p-6 rounded-2xl border border-border dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex min-w-0 items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-xl hidden sm:block">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-2xl font-bold text-foreground dark:text-slate-100 tracking-tight">Reports &amp; Analytics</span>
            <span className="text-sm font-medium text-muted-foreground dark:text-slate-400 mt-0.5">Unified Accounting Ledger and CRM Performance Analytics.</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="financial" className="w-full">
        <div className="bg-card dark:bg-slate-900 p-1 rounded-xl border border-border dark:border-slate-800 shadow-sm w-fit max-w-full overflow-x-auto">
          <TabsList className="bg-background border-0 h-10 w-max min-w-full p-0 flex gap-1">
            <TabsTrigger value="financial" className="rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-500/10 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-none px-4 py-2 font-semibold transition-all">Financial Statements</TabsTrigger>
            <TabsTrigger value="crm" className="rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-500/10 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-none px-4 py-2 font-semibold transition-all">CRM Analytics &amp; KPIs</TabsTrigger>
            <TabsTrigger value="sales" className="rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-500/10 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-none px-4 py-2 font-semibold transition-all">Sales &amp; Revenue Analytics</TabsTrigger>
          </TabsList>
        </div>

        {/* ---------------------------------------------------- */}
        {/* FINANCIAL REPORT TAB */}
        {/* ---------------------------------------------------- */}
        <TabsContent value="financial" className="space-y-6 pt-4 outline-none focus:ring-0">
          <div className="flex justify-between items-center bg-card dark:bg-slate-900 px-5 py-4 rounded-2xl border border-border dark:border-slate-800 shadow-sm">
            <h2 className="text-lg font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-500" />
              Profit &amp; Loss Statement
            </h2>
            <Badge className={`px-3 py-1 font-bold tracking-wider uppercase text-[10px] rounded-md ${report.status === 'PROFIT' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'}`}>
              {report.status}
            </Badge>
          </div>

          <div className="bg-card dark:bg-slate-900 rounded-2xl border border-border dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border dark:border-slate-800 bg-muted/50 dark:bg-slate-800/50">
              <h3 className="font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
                <CalendarRange className="h-5 w-5 text-blue-500" />
                Date Filter
              </h3>
              <p className="text-sm font-medium text-muted-foreground dark:text-slate-400 mt-1">Filter the financial ledger using a dynamic date range.</p>
            </div>
            <div className="p-5 flex flex-col gap-4 md:flex-row md:items-end">
              <div className="space-y-1.5 flex-1 max-w-[240px]">
                <label className="text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase tracking-wider">From</label>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-xl border-border dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100 [&::-webkit-calendar-picker-indicator]:dark:invert" />
              </div>
              <div className="space-y-1.5 flex-1 max-w-[240px]">
                <label className="text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase tracking-wider">To</label>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-xl border-border dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100 [&::-webkit-calendar-picker-indicator]:dark:invert" />
              </div>
              <div className="flex gap-3">
                <Button onClick={() => { setAppliedFromDate(fromDate); setAppliedToDate(toDate); }} className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 shadow-sm transition-colors">
                  <RefreshCw className="h-4 w-4" /> Apply
                </Button>
                <Button variant="outline" onClick={() => { setFromDate(''); setToDate(''); setAppliedFromDate(''); setAppliedToDate(''); }} className="h-10 rounded-xl border-border dark:border-slate-700 text-muted-foreground dark:text-slate-300 font-semibold hover:bg-muted dark:hover:bg-slate-800">
                  Clear
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-card dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700 shadow-sm p-6 relative overflow-hidden group hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp className="h-16 w-16 text-emerald-500" />
              </div>
              <h4 className="text-sm font-bold text-muted-foreground dark:text-slate-400 uppercase tracking-wider mb-2">Income</h4>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 relative z-10">${currencyValue(report.income)}</p>
            </div>
            
            <div className="bg-card dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700 shadow-sm p-6 relative overflow-hidden group hover:border-rose-300 dark:hover:border-rose-500/50 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp className="h-16 w-16 text-rose-500 rotate-180 scale-x-[-1]" />
              </div>
              <h4 className="text-sm font-bold text-muted-foreground dark:text-slate-400 uppercase tracking-wider mb-2">Expense</h4>
              <p className="text-3xl font-black text-rose-600 dark:text-rose-400 relative z-10">${currencyValue(report.expense)}</p>
            </div>

            <div className="bg-card dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700 shadow-sm p-6 relative overflow-hidden group hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Target className="h-16 w-16 text-blue-500" />
              </div>
              <h4 className="text-sm font-bold text-muted-foreground dark:text-slate-400 uppercase tracking-wider mb-2">Net Profit</h4>
              <p className={`text-3xl font-black relative z-10 ${report.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {report.profit >= 0 ? '+' : '-'}${currencyValue(Math.abs(report.profit))}
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.3fr,0.7fr]">
            <div className="bg-card dark:bg-slate-900 rounded-2xl border border-border dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-border dark:border-slate-800 bg-muted/50 dark:bg-slate-800/50">
                <h3 className="font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-500" />
                  Comparison Chart
                </h3>
                <p className="text-sm font-medium text-muted-foreground dark:text-slate-400 mt-1">Visual comparison of income, expense, and net result.</p>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {[
                    { label: 'Income', value: report.income, color: 'bg-emerald-500 dark:bg-emerald-400' },
                    { label: 'Expense', value: report.expense, color: 'bg-rose-500 dark:bg-rose-400' },
                    { label: 'Net Profit', value: Math.abs(report.profit), color: report.profit >= 0 ? 'bg-sky-500 dark:bg-sky-400' : 'bg-amber-500 dark:bg-amber-400' },
                  ].map((item) => (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <span className="text-foreground dark:text-slate-300">{item.label}</span>
                        <span className="text-foreground dark:text-slate-100">${currencyValue(item.value)}</span>
                      </div>
                      <div className="h-4 overflow-hidden rounded-full bg-muted dark:bg-slate-800 shadow-inner">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${item.color}`}
                          style={{ width: `${Math.max((item.value / chartMax) * 100, item.value > 0 ? 3 : 0)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-indigo-100/50 dark:border-indigo-500/20">
                <h3 className="font-bold text-foreground dark:text-slate-100">Financial Accounting Scope</h3>
                <p className="text-sm font-medium text-muted-foreground dark:text-slate-400 mt-1">Reflecting real ledger balances.</p>
              </div>
              <div className="p-6 space-y-4 text-sm font-medium text-muted-foreground dark:text-slate-300 flex-1">
                <div className="flex gap-3 items-start">
                  <CheckCircle className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                  <p>Income is aggregated dynamically from all credited accounts with type set as INCOME.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <CheckCircle className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                  <p>Expenses are parsed dynamically from all debited accounts with type set as EXPENSE.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <CheckCircle className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                  <p>Accounting rules enforce absolute double-entry bookkeeping validation.</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ---------------------------------------------------- */}
        {/* CRM ANALYTICS & KPIS TAB */}
        {/* ---------------------------------------------------- */}
        <TabsContent value="crm" className="space-y-6 pt-4 outline-none focus:ring-0">
          {!crmReport ? (
            <div className="flex justify-center items-center h-48 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 border-dashed rounded-2xl">
              <p className="text-muted-foreground dark:text-slate-400 font-medium">No CRM transactional data found under this business.</p>
            </div>
          ) : (
            <>
              {/* Row 1: KPI Cards */}
              <div className="grid gap-6 md:grid-cols-4">
                <div className="bg-card dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700 shadow-sm p-5 hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-xs font-bold text-muted-foreground dark:text-slate-400 uppercase tracking-wider">Lead Conversion</h4>
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg"><Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /></div>
                  </div>
                  <div className="text-3xl font-black text-foreground dark:text-slate-100">{crmReport.kpis.leadConversionRate}%</div>
                  <p className="text-xs font-medium text-muted-foreground dark:text-slate-400 mt-2">{crmReport.kpis.convertedLeads} of {crmReport.kpis.totalLeads} leads converted</p>
                </div>

                <div className="bg-card dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700 shadow-sm p-5 hover:border-sky-300 dark:hover:border-sky-500/50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-xs font-bold text-muted-foreground dark:text-slate-400 uppercase tracking-wider">Deal Win Rate</h4>
                    <div className="p-2 bg-sky-50 dark:bg-sky-500/10 rounded-lg"><TrendingUp className="h-4 w-4 text-sky-600 dark:text-sky-400" /></div>
                  </div>
                  <div className="text-3xl font-black text-foreground dark:text-slate-100">{crmReport.kpis.dealWinRate}%</div>
                  <p className="text-xs font-medium text-muted-foreground dark:text-slate-400 mt-2">Win percentage across closed deals</p>
                </div>

                <div className="bg-card dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700 shadow-sm p-5 hover:border-purple-300 dark:hover:border-purple-500/50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-xs font-bold text-muted-foreground dark:text-slate-400 uppercase tracking-wider">Weighted Forecast</h4>
                    <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg"><Briefcase className="h-4 w-4 text-purple-600 dark:text-purple-400" /></div>
                  </div>
                  <div className="text-3xl font-black text-foreground dark:text-slate-100">${currencyValue(crmReport.kpis.expectedWeightedRevenue)}</div>
                  <p className="text-xs font-medium text-muted-foreground dark:text-slate-400 mt-2">Probability-weighted open pipeline</p>
                </div>

                <div className="bg-card dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700 shadow-sm p-5 hover:border-amber-300 dark:hover:border-amber-500/50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-xs font-bold text-muted-foreground dark:text-slate-400 uppercase tracking-wider">Won Deals Value</h4>
                    <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg"><CheckCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" /></div>
                  </div>
                  <div className="text-3xl font-black text-foreground dark:text-slate-100">${currencyValue(crmReport.kpis.revenueWon)}</div>
                  <p className="text-xs font-medium text-muted-foreground dark:text-slate-400 mt-2">Total revenue securely earned</p>
                </div>
              </div>

              {/* Row 2: Sales Funnel & Lead Sources */}
              <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
                {/* Deal Pipeline by Stage */}
                <div className="bg-card dark:bg-slate-900 rounded-2xl border border-border dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-border dark:border-slate-800 bg-muted/50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
                      <Layers className="h-5 w-5 text-indigo-500" /> Deal Pipeline Funnel
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground dark:text-slate-400 mt-1">Pipelines distribution and amounts currently active.</p>
                  </div>
                  <div className="p-6 space-y-5 flex-1">
                    {Object.keys(crmReport.dealsBreakdown.stages).length === 0 ? (
                      <p className="text-muted-foreground dark:text-slate-400 text-sm text-center py-6 font-medium">No deal stages registered.</p>
                    ) : (
                      Object.entries(crmReport.dealsBreakdown.stages).map(([stage, details]) => {
                        const maxVal = Math.max(...Object.values(crmReport.dealsBreakdown.stages).map(s => s.totalAmount), 1);
                        return (
                          <div key={stage} className="space-y-2">
                            <div className="flex items-center justify-between text-sm font-semibold">
                              <span className="capitalize text-foreground dark:text-slate-300">{stage.toLowerCase()}</span>
                              <span className="text-xs text-muted-foreground dark:text-slate-400">
                                {details.count} deal(s) • ${currencyValue(details.totalAmount)}
                              </span>
                            </div>
                            <div className="h-3 bg-muted dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                              <div 
                                className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all duration-1000 ease-out" 
                                style={{ width: `${(details.totalAmount / maxVal) * 100}%` }}
                              />
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* Lead Sources Share */}
                <div className="bg-card dark:bg-slate-900 rounded-2xl border border-border dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-border dark:border-slate-800 bg-muted/50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
                      <Users className="h-5 w-5 text-emerald-500" /> Lead Capture Sources
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground dark:text-slate-400 mt-1">Top channels bringing in new CRM leads.</p>
                  </div>
                  <div className="p-6 space-y-4 flex-1">
                    {Object.keys(crmReport.leadsBreakdown.sources).length === 0 ? (
                      <p className="text-muted-foreground dark:text-slate-400 text-sm text-center py-6 font-medium">No lead sources mapped.</p>
                    ) : (
                      Object.entries(crmReport.leadsBreakdown.sources).map(([source, count]) => {
                        const total = crmReport.kpis.totalLeads || 1;
                        const pct = Math.round((count / total) * 100);
                        return (
                          <div key={source} className="flex justify-between items-center border-b border-border dark:border-slate-800 pb-3 last:border-0 last:pb-0">
                            <div>
                              <p className="font-bold text-sm capitalize text-foreground dark:text-slate-300">{source.toLowerCase()}</p>
                              <p className="text-xs font-medium text-muted-foreground dark:text-slate-400 mt-0.5">{count} Leads</p>
                            </div>
                            <div className="text-right">
                              <span className="text-base font-black text-foreground dark:text-slate-100">{pct}%</span>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Row 3: Top Accounts & Activity Summary */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Top Accounts */}
                <div className="bg-card dark:bg-slate-900 rounded-2xl border border-border dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-border dark:border-slate-800 bg-muted/50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
                      <Building className="h-5 w-5 text-purple-500" /> Top Revenue Accounts
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground dark:text-slate-400 mt-1">High-value customer companies and organizations.</p>
                  </div>
                  <div className="p-4 space-y-2">
                    {crmReport.accountsBreakdown.topAccounts.length === 0 ? (
                      <p className="text-muted-foreground dark:text-slate-400 text-sm text-center py-6 font-medium">No accounts recorded.</p>
                    ) : (
                      crmReport.accountsBreakdown.topAccounts.map((account) => (
                        <div key={account.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted dark:hover:bg-slate-800/50 transition-colors">
                          <div>
                            <p className="text-sm font-bold text-foreground dark:text-slate-300">{account.company}</p>
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold mt-1 dark:border-slate-700 dark:text-slate-400">{account.industry || 'General'}</Badge>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                              {account.annualRevenue ? `$${currencyValue(account.annualRevenue)}` : 'N/A'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Engagement Timeline volume */}
                <div className="bg-card dark:bg-slate-900 rounded-2xl border border-border dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-border dark:border-slate-800 bg-muted/50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
                      <PhoneCall className="h-5 w-5 text-sky-500" /> Customer Engagement Activities
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground dark:text-slate-400 mt-1">Universal logs of CRM meetings, calls, notes, and tasks.</p>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border dark:border-slate-800">
                      <div>
                        <p className="text-xs font-bold text-muted-foreground dark:text-slate-400 uppercase tracking-wider">Total Timeline Activities</p>
                        <p className="text-3xl font-black text-foreground dark:text-slate-100 mt-1">{crmReport.kpis.totalActivities}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground dark:text-slate-400 uppercase tracking-wider">Avg Time to Convert</p>
                        <p className="text-3xl font-black text-foreground dark:text-slate-100 mt-1 flex items-center gap-2">
                          <Clock className="h-5 w-5 text-sky-500" />
                          {crmReport.kpis.averageHoursToConvert}h
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {Object.keys(crmReport.activitiesBreakdown.types).length === 0 ? (
                        <p className="text-muted-foreground dark:text-slate-400 text-sm text-center py-6 font-medium">No logged activities.</p>
                      ) : (
                        Object.entries(crmReport.activitiesBreakdown.types).map(([type, count]) => (
                          <div key={type} className="flex items-center justify-between text-sm">
                            <span className="capitalize font-bold text-foreground dark:text-slate-300">{type.toLowerCase()}s</span>
                            <div className="flex items-center gap-3 w-2/3 justify-end">
                              <span className="font-black text-xs text-foreground dark:text-slate-100">{count}</span>
                              <div className="h-2.5 w-24 bg-muted dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                <div 
                                  className="h-full bg-sky-500 dark:bg-sky-400 rounded-full transition-all duration-1000 ease-out" 
                                  style={{ width: `${Math.min((count / (crmReport.kpis.totalActivities || 1)) * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* ---------------------------------------------------- */}
        {/* SALES & REVENUE REPORT TAB */}
        {/* ---------------------------------------------------- */}
        <TabsContent value="sales" className="space-y-6 pt-4 outline-none focus:ring-0">
          {!salesReport ? (
            <div className="flex justify-center items-center h-48 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 border-dashed rounded-2xl">
              <p className="text-muted-foreground dark:text-slate-400 font-medium">No Sales transactional data found under this business.</p>
            </div>
          ) : (
            <>
              {/* Row 1: KPI Cards */}
              <div className="grid gap-6 md:grid-cols-4">
                <div className="bg-emerald-50/50 dark:bg-emerald-500/5 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 shadow-sm p-5 hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Total Invoiced</h4>
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 rounded-lg"><BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /></div>
                  </div>
                  <div className="text-3xl font-black text-emerald-900 dark:text-emerald-100">
                    ${currencyValue(salesReport.billingSummary.reduce((acc, s) => acc + (s._sum.grandTotal || 0), 0))}
                  </div>
                  <p className="text-xs font-medium text-emerald-600/80 dark:text-emerald-400/80 mt-2">
                    Across {salesReport.billingSummary.reduce((acc, s) => acc + s._count.id, 0)} billing invoices
                  </p>
                </div>

                <div className="bg-blue-50/50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-500/20 shadow-sm p-5 hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider">Sales Orders Pipeline</h4>
                    <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-lg"><Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" /></div>
                  </div>
                  <div className="text-3xl font-black text-blue-900 dark:text-blue-100">
                    ${currencyValue(salesReport.salesOrderTracking.reduce((acc, s) => acc + (s._sum.totalAmount || 0), 0))}
                  </div>
                  <p className="text-xs font-medium text-blue-600/80 dark:text-blue-400/80 mt-2">
                    {salesReport.salesOrderTracking.reduce((acc, s) => acc + s._count.id, 0)} total orders confirmed/draft
                  </p>
                </div>

                <div className="bg-violet-50/50 dark:bg-violet-500/5 rounded-2xl border border-violet-100 dark:border-violet-500/20 shadow-sm p-5 hover:border-violet-300 dark:hover:border-violet-500/50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-xs font-bold text-violet-800 dark:text-violet-400 uppercase tracking-wider">Outstanding Balance</h4>
                    <div className="p-2 bg-violet-100 dark:bg-violet-500/10 rounded-lg"><TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" /></div>
                  </div>
                  <div className="text-3xl font-black text-violet-900 dark:text-violet-100">
                    ${currencyValue(salesReport.overdueInvoices.reduce((acc, inv) => acc + (inv.balanceDue || 0), 0))}
                  </div>
                  <p className="text-xs font-medium text-violet-600/80 dark:text-violet-400/80 mt-2">
                    Pending balance on {salesReport.overdueInvoices.length} active invoices
                  </p>
                </div>

                <div className="bg-amber-50/50 dark:bg-amber-500/5 rounded-2xl border border-amber-100 dark:border-amber-500/20 shadow-sm p-5 hover:border-amber-300 dark:hover:border-amber-500/50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Active Quotations</h4>
                    <div className="p-2 bg-amber-100 dark:bg-amber-500/10 rounded-lg"><Target className="h-4 w-4 text-amber-600 dark:text-amber-400" /></div>
                  </div>
                  <div className="text-3xl font-black text-amber-900 dark:text-amber-100">
                    ${currencyValue(salesReport.quoteFunnel.reduce((acc, q) => acc + (q._sum.totalAmount || 0), 0))}
                  </div>
                  <p className="text-xs font-medium text-amber-600/80 dark:text-amber-400/80 mt-2">
                    {salesReport.quoteFunnel.reduce((acc, q) => acc + q._count.id, 0)} quotations in funnel
                  </p>
                </div>
              </div>

              {/* Row 2: Invoices Breakdown & Sales Funnels */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* 1. Billing Invoices Status */}
                <div className="bg-card dark:bg-slate-900 rounded-2xl border border-border dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-border dark:border-slate-800 bg-muted/50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-foreground dark:text-slate-100">Invoices by Status</h3>
                    <p className="text-sm font-medium text-muted-foreground dark:text-slate-400 mt-1">Aggregate billing values and count of customer invoices.</p>
                  </div>
                  <div className="p-6 space-y-5 flex-1">
                    {salesReport.billingSummary.length === 0 ? (
                      <p className="text-muted-foreground dark:text-slate-400 text-sm text-center py-6 font-medium">No invoices created.</p>
                    ) : (
                      salesReport.billingSummary.map((sum) => {
                        const totalBilling = salesReport.billingSummary.reduce((acc, s) => acc + (s._sum.grandTotal || 0), 1);
                        const percent = Math.round(((sum._sum.grandTotal || 0) / totalBilling) * 100);
                        return (
                          <div key={sum.status} className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-bold text-xs uppercase tracking-wider text-foreground dark:text-slate-300">{sum.status.replace('_', ' ')}</span>
                              <span className="text-muted-foreground dark:text-slate-400 text-xs font-bold">
                                {sum._count.id} bills • ${currencyValue(sum._sum.grandTotal || 0)}
                              </span>
                            </div>
                            <div className="h-3 bg-muted dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                              <div
                                className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* 2. Quotation Funnel Breakdown */}
                <div className="bg-card dark:bg-slate-900 rounded-2xl border border-border dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-border dark:border-slate-800 bg-muted/50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-foreground dark:text-slate-100">Quotation Funnel</h3>
                    <p className="text-sm font-medium text-muted-foreground dark:text-slate-400 mt-1">Lifecycle conversion pipeline of active quotations.</p>
                  </div>
                  <div className="p-6 space-y-5 flex-1">
                    {salesReport.quoteFunnel.length === 0 ? (
                      <p className="text-muted-foreground dark:text-slate-400 text-sm text-center py-6 font-medium">No quotations created.</p>
                    ) : (
                      salesReport.quoteFunnel.map((q) => {
                        const totalQuotes = salesReport.quoteFunnel.reduce((acc, s) => acc + (s._sum.totalAmount || 0), 1);
                        const percent = Math.round(((q._sum.totalAmount || 0) / totalQuotes) * 100);
                        return (
                          <div key={q.status} className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-bold text-xs uppercase tracking-wider text-foreground dark:text-slate-300">{q.status}</span>
                              <span className="text-muted-foreground dark:text-slate-400 text-xs font-bold">
                                {q._count.id} quotes • ${currencyValue(q._sum.totalAmount || 0)}
                              </span>
                            </div>
                            <div className="h-3 bg-muted dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                              <div
                                className="h-full bg-amber-500 dark:bg-amber-400 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* 3. Sales Order Tracking */}
                <div className="bg-card dark:bg-slate-900 rounded-2xl border border-border dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-border dark:border-slate-800 bg-muted/50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-foreground dark:text-slate-100">Sales Orders Status</h3>
                    <p className="text-sm font-medium text-muted-foreground dark:text-slate-400 mt-1">Execution pipeline of warehouse sales orders.</p>
                  </div>
                  <div className="p-6 space-y-5 flex-1">
                    {salesReport.salesOrderTracking.length === 0 ? (
                      <p className="text-muted-foreground dark:text-slate-400 text-sm text-center py-6 font-medium">No sales orders confirmed.</p>
                    ) : (
                      salesReport.salesOrderTracking.map((so) => {
                        const totalOrders = salesReport.salesOrderTracking.reduce((acc, s) => acc + (s._sum.totalAmount || 0), 1);
                        const percent = Math.round(((so._sum.totalAmount || 0) / totalOrders) * 100);
                        return (
                          <div key={so.status} className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-bold text-xs uppercase tracking-wider text-foreground dark:text-slate-300">{so.status.replace('_', ' ')}</span>
                              <span className="text-muted-foreground dark:text-slate-400 text-xs font-bold">
                                {so._count.id} orders • ${currencyValue(so._sum.totalAmount || 0)}
                              </span>
                            </div>
                            <div className="h-3 bg-muted dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                              <div
                                className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Row 3: Top Performing Customers & Products */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Top Customers */}
                <div className="bg-card dark:bg-slate-900 rounded-2xl border border-border dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-border dark:border-slate-800 bg-muted/50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
                      <Users className="h-5 w-5 text-indigo-500" /> Top 5 Customers by Revenue
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground dark:text-slate-400 mt-1">Customers driving the highest gross billing volumes.</p>
                  </div>
                  <div className="p-4 space-y-2">
                    {salesReport.topCustomers.length === 0 ? (
                      <p className="text-muted-foreground dark:text-slate-400 text-sm text-center py-6 font-medium">No active customer billing.</p>
                    ) : (
                      salesReport.topCustomers.map((cust) => (
                        <div key={cust.customerId} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted dark:hover:bg-slate-800/50 transition-colors">
                          <div>
                            <p className="text-sm font-bold text-foreground dark:text-slate-300">{cust.name || cust.company || 'Unknown Customer'}</p>
                            <span className="text-xs font-medium text-muted-foreground dark:text-slate-400">ID: {cust.customerId.slice(-6)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                              ${currencyValue(cust.totalSales)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Top Selling Products */}
                <div className="bg-card dark:bg-slate-900 rounded-2xl border border-border dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-border dark:border-slate-800 bg-muted/50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-amber-500" /> Top 5 Selling Products &amp; Goods
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground dark:text-slate-400 mt-1">Top products ordered sorted by quantity &amp; revenue.</p>
                  </div>
                  <div className="p-4 space-y-2">
                    {salesReport.topProducts.length === 0 ? (
                      <p className="text-muted-foreground dark:text-slate-400 text-sm text-center py-6 font-medium">No products sold yet.</p>
                    ) : (
                      salesReport.topProducts.map((prod, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted dark:hover:bg-slate-800/50 transition-colors">
                          <div>
                            <p className="text-sm font-bold text-foreground dark:text-slate-300">{prod.description}</p>
                            <span className="text-xs font-medium text-muted-foreground dark:text-slate-400">
                              {prod._sum.quantity} units sold • {prod._count.id} distinct invoices
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-sky-600 dark:text-sky-400">
                              ${currencyValue(prod._sum.total || 0)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Row 4: Outstanding Overdue Invoices */}
              <div className="bg-card dark:bg-slate-900 rounded-2xl border border-border dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border dark:border-slate-800 bg-rose-50/30 dark:bg-rose-500/5">
                  <h3 className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                    <Clock className="h-5 w-5" /> Outstanding Overdue Invoices (Top 10)
                  </h3>
                  <p className="text-sm font-medium text-muted-foreground dark:text-slate-400 mt-1">Unpaid invoices past their due dates, requiring attention.</p>
                </div>
                <div className="p-6">
                  {salesReport.overdueInvoices.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/10 mb-4">
                        <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <p className="text-foreground dark:text-slate-300 font-bold">Great! No overdue invoices found.</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border dark:border-slate-700 overflow-hidden">
                      <table className="w-full text-sm border-collapse text-left">
                        <thead>
                          <tr className="bg-muted dark:bg-slate-800/50 border-b border-border dark:border-slate-700 text-xs font-bold text-muted-foreground dark:text-slate-400 uppercase tracking-wider">
                            <th className="p-4">Invoice Number</th>
                            <th className="p-4">Customer</th>
                            <th className="p-4">Due Date</th>
                            <th className="p-4">Invoice Total</th>
                            <th className="p-4 text-right">Balance Due</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                          {salesReport.overdueInvoices.map((inv) => (
                            <tr key={inv.id} className="bg-card dark:bg-slate-900 hover:bg-muted dark:hover:bg-slate-800 transition-colors">
                              <td className="p-4 font-mono font-semibold text-foreground dark:text-slate-300">{inv.invoiceNumber}</td>
                              <td className="p-4 font-medium text-foreground dark:text-slate-300">{inv.customer?.company || 'Deleted Customer'}</td>
                              <td className="p-4 text-rose-600 dark:text-rose-400 font-bold">
                                {new Date(inv.dueDate).toLocaleDateString()}
                              </td>
                              <td className="p-4 font-mono font-medium text-muted-foreground dark:text-slate-400">${currencyValue(inv.grandTotal)}</td>
                              <td className="p-4 text-right font-mono font-black text-rose-600 dark:text-rose-400">
                                ${currencyValue(inv.balanceDue)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}