import { toast } from 'sonner';
import React from 'react'
import {
  BellIcon,
  Building2Icon,
  SearchIcon,
  TrendingUpIcon,
  WalletIcon,
  FileTextIcon,
  AlertCircleIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  ReceiptIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { DashboardModeToggle } from '@/components/dashboard/mode-toggle'
import { UserMenu } from '@/components/dashboard/user-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { DashboardPageSkeleton } from '@/components/dashboard/dashboard-page-skeleton'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { BusinessSetupProgress } from '@/components/dashboard/business-setup-progress'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts'

type PaymentItem = {
  id: string
  invoiceId: string
  invoiceNumber: string
  amount: number
  paymentDate: string
  createdAt: string
  customerName: string
}

type ActivityItem = {
  id: string
  type: 'Invoice' | 'Payment'
  ref: string
  customer: string
  amount: number
  status: string
  date: string
}

const chartConfig = {
  billed: {
    label: 'Billed',
    theme: {
      light: 'var(--chart-1)',
      dark: '#8ea2ff',
    },
  },
  collected: {
    label: 'Collected',
    theme: {
      light: 'var(--chart-2)',
      dark: '#4fe0c1',
    },
  },
  count: {
    label: 'Count',
    theme: {
      light: 'var(--chart-3)',
      dark: '#ffc66b',
    },
  },
} satisfies ChartConfig

function getCookie(name: string) {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\\^])/g, '\\$1') + '=([^;]*)'),
  )
  return match ? decodeURIComponent(match[1]) : ''
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short' })
}

function buildLastSixMonths() {
  const now = new Date()
  const months: { key: string; label: string }[] = []

  for (let index = 5; index >= 0; index -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - index, 1)
    months.push({ key: monthKey(d), label: monthLabel(d) })
  }

  return months
}

function normalizeStatus(raw: string | null | undefined) {
  const status = String(raw || '').trim().toUpperCase()
  if (!status) return 'UNKNOWN'
  if (status === 'PARTIALLY_PAID') return 'PARTIALLY PAID'
  return status
}

export function DashboardPageClient({ businessId }: { businessId: string }) {
  const { business, loading: businessLoading, error: businessError, currency: businessCurrency } = useBusinessData()
  const { toast } = useToast()

  const [payments, setPayments] = React.useState<PaymentItem[]>([])
  const [paymentsLoading, setPaymentsLoading] = React.useState(false)

  const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')

  React.useEffect(() => {
    const loadPayments = async () => {
      const invoices = Array.isArray(business?.invoices) ? business.invoices : []
      if (invoices.length === 0) {
        setPayments([])
        return
      }

      const token = getCookie('token') || getCookie('accessToken')
      if (!token) {
        setPayments([])
        return
      }

      setPaymentsLoading(true)

      try {
        const result = await Promise.allSettled(
          invoices.map(async (invoice: any) => {
            const response = await fetch(`${API_BASE}/api/payments/invoice/${encodeURIComponent(invoice.id)}`, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                'x-business-id': businessId,
              },
            })

            if (!response.ok) {
              return [] as PaymentItem[]
            }

            const data = await response.json()
            const list = Array.isArray(data?.data) ? data.data : []

            return list.map((payment: any) => ({
              id: payment.id,
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoiceNumber || invoice.id,
              amount: Number(payment.amount || 0),
              paymentDate: payment.paymentDate || '',
              createdAt: payment.createdAt || '',
              customerName: invoice.customer?.company || 'Unknown customer',
            }))
          }),
        )

        const merged = result
          .flatMap((entry) => (entry.status === 'fulfilled' ? entry.value : []))
          .sort((a, b) => {
            const aDate = new Date(a.paymentDate || a.createdAt || 0).getTime()
            const bDate = new Date(b.paymentDate || b.createdAt || 0).getTime()
            return bDate - aDate
          })

        setPayments(merged)
      } catch (err: any) {
        toast({
          title: 'Failed to load payments',
          description: err?.message || 'Unknown error',
          variant: 'destructive',
        })
      } finally {
        setPaymentsLoading(false)
      }
    }

    if (!businessLoading) {
      loadPayments()
    }
  }, [API_BASE, business, businessId, businessLoading, toast])

  const displayName = React.useMemo(() => {
    if (business?.name && String(business.name).trim().length > 0) {
      return business.name
    }
    return businessId ? `Business ${businessId.slice(0, 6).toUpperCase()}` : 'Your Business'
  }, [business, businessId])

  const invoices = React.useMemo(() => {
    return Array.isArray(business?.invoices) ? business.invoices : []
  }, [business])

  const customers = React.useMemo(() => {
    return Array.isArray(business?.customers) ? business.customers : []
  }, [business])

  const currency = React.useMemo(() => {
    return businessCurrency || 'USD'
  }, [businessCurrency])

  const formatCurrency = React.useCallback(
    (value: number) => {
      try {
        const locale = currency === 'INR' ? 'en-IN' : currency === 'AED' ? 'en-AE' : 'en-US'
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
          maximumFractionDigits: 2,
        }).format(Number(value || 0))
      } catch {
        return `${currency} ${Number(value || 0).toLocaleString()}`
      }
    },
    [currency],
  )

  const totals = React.useMemo(() => {
    const paidByInvoice = new Map<string, number>()

    for (const payment of payments) {
      const prev = paidByInvoice.get(payment.invoiceId) || 0
      paidByInvoice.set(payment.invoiceId, prev + Number(payment.amount || 0))
    }

    let totalBilled = 0
    let outstanding = 0

    for (const invoice of invoices) {
      const invoiceTotal = Number(invoice?.grandTotal || 0)
      totalBilled += invoiceTotal
      const paid = paidByInvoice.get(invoice.id) || 0
      const due = Math.max(invoiceTotal - paid, 0)
      outstanding += due
    }

    const totalCollected = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    const paidInvoices = invoices.filter((item: any) => normalizeStatus(item?.status) === 'PAID').length

    return {
      totalBilled,
      totalCollected,
      outstanding,
      paidInvoices,
      totalInvoices: invoices.length,
      totalCustomers: customers.length,
    }
  }, [customers.length, invoices, payments])

  const monthlyChartData = React.useMemo(() => {
    const months = buildLastSixMonths()
    const map = new Map<string, { month: string; billed: number; collected: number }>()

    for (const item of months) {
      map.set(item.key, { month: item.label, billed: 0, collected: 0 })
    }

    for (const invoice of invoices) {
      if (!invoice?.invoiceDate) continue
      const d = new Date(invoice.invoiceDate)
      if (Number.isNaN(d.getTime())) continue
      const key = monthKey(d)
      const row = map.get(key)
      if (!row) continue
      row.billed += Number(invoice.grandTotal || 0)
    }

    for (const payment of payments) {
      if (!payment.paymentDate && !payment.createdAt) continue
      const d = new Date(payment.paymentDate || payment.createdAt)
      if (Number.isNaN(d.getTime())) continue
      const key = monthKey(d)
      const row = map.get(key)
      if (!row) continue
      row.collected += Number(payment.amount || 0)
    }

    return months.map((item) => map.get(item.key) || { month: item.label, billed: 0, collected: 0 })
  }, [invoices, payments])

  const statusChartData = React.useMemo(() => {
    const groups = new Map<string, number>()

    for (const invoice of invoices) {
      const key = normalizeStatus(invoice?.status)
      groups.set(key, (groups.get(key) || 0) + 1)
    }

    return Array.from(groups.entries()).map(([status, count]) => ({
      status,
      count,
    }))
  }, [invoices])

  const recentActivity = React.useMemo<ActivityItem[]>(() => {
    const invoiceEvents: ActivityItem[] = invoices.map((invoice: any) => ({
      id: `invoice-${invoice.id}`,
      type: 'Invoice',
      ref: invoice.invoiceNumber || invoice.id,
      customer: invoice.customer?.company || 'Unknown customer',
      amount: Number(invoice.grandTotal || 0),
      status: normalizeStatus(invoice.status),
      date: invoice.createdAt || invoice.invoiceDate || '',
    }))

    const paymentEvents: ActivityItem[] = payments.map((payment) => ({
      id: `payment-${payment.id}`,
      type: 'Payment',
      ref: payment.invoiceNumber,
      customer: payment.customerName,
      amount: Number(payment.amount || 0),
      status: 'RECEIVED',
      date: payment.paymentDate || payment.createdAt || '',
    }))

    return [...invoiceEvents, ...paymentEvents]
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      .slice(0, 10)
  }, [invoices, payments])

  if (businessLoading) {
    return <DashboardPageSkeleton />
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-10 pt-0 sm:px-6 lg:px-8 w-full min-w-0">

      {businessError ? (
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-destructive">Failed to load business data</CardTitle>
            <CardDescription>{businessError}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <BusinessSetupProgress businessId={businessId} />

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Total Billed */}
        <Card className="rounded-2xl border-border bg-card shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 dark:border-[#23272c] dark:bg-[#181a20]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6">
            <CardDescription className="text-[13px] font-medium text-muted-foreground dark:text-slate-400">Total Billed</CardDescription>
            <div className="flex size-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <FileTextIcon className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground dark:text-slate-100">{formatCurrency(totals.totalBilled)}</CardTitle>
            <p className="mt-1 text-xs font-medium text-slate-400 dark:text-muted-foreground">
              Across <span className="text-muted-foreground dark:text-slate-300 font-semibold">{totals.totalInvoices}</span> invoices
            </p>
          </CardContent>
        </Card>

        {/* Total Collected */}
        <Card className="rounded-2xl border-border bg-card shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 dark:border-[#23272c] dark:bg-[#181a20]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6">
            <CardDescription className="text-[13px] font-medium text-muted-foreground dark:text-slate-400">Total Collected</CardDescription>
            <div className="flex size-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <WalletIcon className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground dark:text-slate-100">{formatCurrency(totals.totalCollected)}</CardTitle>
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-400 dark:text-muted-foreground">
              <ArrowUpRightIcon className="size-3 text-emerald-500" />
              From recorded payments
            </p>
          </CardContent>
        </Card>

        {/* Outstanding Amount */}
        <Card className="rounded-2xl border-border bg-card shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 dark:border-[#23272c] dark:bg-[#181a20]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6">
            <CardDescription className="text-[13px] font-medium text-muted-foreground dark:text-slate-400">Outstanding Amount</CardDescription>
            <div className="flex size-9 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <AlertCircleIcon className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground dark:text-slate-100">{formatCurrency(totals.outstanding)}</CardTitle>
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-400 dark:text-muted-foreground">
              <ArrowDownRightIcon className="size-3 text-amber-500" />
              Remaining due balance
            </p>
          </CardContent>
        </Card>

        {/* Collection Rate */}
        <Card className="rounded-2xl border-border bg-card shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 dark:border-[#23272c] dark:bg-[#181a20]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6">
            <CardDescription className="text-[13px] font-medium text-muted-foreground dark:text-slate-400">Collection Rate</CardDescription>
            <div className="flex size-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <TrendingUpIcon className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            <CardTitle className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground dark:text-slate-100">
              {totals.totalBilled > 0
                ? `${Math.round((totals.totalCollected / totals.totalBilled) * 100)}%`
                : '0%'}
            </CardTitle>
            <p className="mt-1 text-xs font-medium text-slate-400 dark:text-muted-foreground">
              Fully paid: <span className="text-muted-foreground dark:text-slate-300 font-semibold">{totals.paidInvoices}</span> invoices
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 min-w-0 rounded-2xl border-border bg-card shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:border-[#23272c] dark:bg-[#181a20]">
          <CardHeader className="pb-4 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground dark:text-slate-100">Revenue Analytics</CardTitle>
                <CardDescription className="text-[13px] mt-1 text-muted-foreground dark:text-slate-400">Billed vs Collected (Last 6 months)</CardDescription>
              </div>
              <div className="flex size-8 items-center justify-center rounded-full bg-muted dark:bg-[#1c2128]">
                <TrendingUpIcon className="size-4 text-muted-foreground dark:text-slate-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            {paymentsLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <ChartContainer config={chartConfig} className="h-72 w-full">
                <AreaChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => {
                      const num = Number(value)
                      return num === 0 ? '0' : `${Math.round(num / 1000)}k`
                    }}
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="billed"
                    stroke="var(--color-billed)"
                    fill="var(--color-billed)"
                    strokeWidth={2}
                    fillOpacity={0.28}
                  />
                  <Area
                    type="monotone"
                    dataKey="collected"
                    stroke="var(--color-collected)"
                    fill="var(--color-collected)"
                    strokeWidth={2}
                    fillOpacity={0.24}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 rounded-2xl border-border bg-card shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:border-[#23272c] dark:bg-[#181a20]">
          <CardHeader className="pb-4 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground dark:text-slate-100">Invoice Status</CardTitle>
                <CardDescription className="text-[13px] mt-1 text-muted-foreground dark:text-slate-400">Current status distribution</CardDescription>
              </div>
              <div className="flex size-8 items-center justify-center rounded-full bg-muted dark:bg-[#1c2128]">
                <ReceiptIcon className="size-4 text-muted-foreground dark:text-slate-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            {statusChartData.length === 0 ? (
              <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
                No invoice data available.
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-72 w-full">
                <BarChart data={statusChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="status" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0 overflow-hidden rounded-2xl border-border bg-card shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:border-[#23272c] dark:bg-[#181a20] mb-8">
        <CardHeader className="pb-4 pt-6 border-b border-border/60 dark:border-[#23272c] mb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-foreground dark:text-slate-100">Recent Activity</CardTitle>
              <CardDescription className="text-[13px] mt-1 text-muted-foreground dark:text-slate-400">Latest invoice and payment records from your business</CardDescription>
            </div>
            <div className="flex size-8 items-center justify-center rounded-full bg-muted dark:bg-[#1c2128]">
              <FileTextIcon className="size-4 text-muted-foreground dark:text-slate-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {paymentsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No activity found yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivity.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge variant={item.type === 'Payment' ? 'secondary' : 'outline'}>{item.type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.ref}</TableCell>
                    <TableCell>{item.customer}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.amount)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === 'PAID' || item.status === 'RECEIVED'
                            ? 'secondary'
                            : item.status === 'UNPAID' || item.status === 'OVERDUE'
                              ? 'outline'
                              : 'default'
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.date ? new Date(item.date).toLocaleDateString('en-US') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="mt-4 flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <WalletIcon className="size-3.5" />
            Showing live totals based on invoices and payments APIs.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
