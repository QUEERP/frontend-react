import * as React from 'react'
import { recurringInvoicesAPI, RecurringInvoiceProfile } from '@/lib/api/recurring-invoices'
import { contactsAPI, Customer } from '@/lib/api/contacts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Activity,
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Loader2,
  PauseCircle,
  Play,
  Plus,
  RefreshCw,
  Search,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { EditableTaxSelect } from '@/components/dashboard/editable-tax-select'

interface Props {
  businessId: string
}

const FREQUENCY_BADGE: Record<string, string> = {
  DAILY: 'bg-red-100 text-red-800 border-red-200',
  WEEKLY: 'bg-amber-100 text-amber-800 border-amber-200',
  MONTHLY: 'bg-blue-100 text-blue-800 border-blue-200',
  YEARLY: 'bg-violet-100 text-violet-800 border-violet-200',
}

const STATUS_BADGE: Record<string, { style: string; icon: React.ReactNode }> = {
  ACTIVE: {
    style: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  PAUSED: {
    style: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: <PauseCircle className="h-3 w-3" />,
  },
  COMPLETED: {
    style: 'bg-muted text-foreground border-border',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(v || 0))

const formatDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export function RecurringInvoicesPageClient({ businessId }: Props) {
  const [profiles, setProfiles] = React.useState<RecurringInvoiceProfile[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [triggerLoading, setTriggerLoading] = React.useState(false)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [createLoading, setCreateLoading] = React.useState(false)
  const [customers, setCustomers] = React.useState<Customer[]>([])

  // Create form state
  const [form, setForm] = React.useState({
    customerId: '',
    frequency: 'MONTHLY',
    startDate: '',
    endDate: '',
    description: '',
    quantity: '1',
    rate: '',
    taxPercent: '0',
  })

  const selectedCustomer = customers.find(c => c.id === form.customerId)
  const customerCountryName = (selectedCustomer?.country || selectedCustomer?.region || '').trim().toUpperCase()
  const isCustomerSelected = !!selectedCustomer
  const isOtherCountry = isCustomerSelected && customerCountryName !== '' && customerCountryName !== 'INDIA' && customerCountryName !== 'UAE' && customerCountryName !== 'UNITED ARAB EMIRATES'

  const getTaxLabel = (c: string) => {
    const cUp = c.toUpperCase()
    if (['AUSTRALIA', 'CANADA', 'NEW ZEALAND', 'SINGAPORE', 'MALAYSIA'].includes(cUp)) return 'GST %'
    if (['UNITED STATES', 'USA', 'US'].includes(cUp)) return 'Sales Tax %'
    if (['UNITED KINGDOM', 'UK', 'SOUTH AFRICA'].includes(cUp)) return 'VAT %'
    return 'Tax %'
  }
  const taxLabel = isOtherCountry ? getTaxLabel(customerCountryName) : 'Tax %'

  const fetchProfiles = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await recurringInvoicesAPI.getProfiles(businessId)
      setProfiles(res.data || [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load recurring invoices')
    } finally {
      setLoading(false)
    }
  }, [businessId])

  const fetchLookups = React.useCallback(async () => {
    try {
      const res = await contactsAPI.getCustomers(businessId)
      setCustomers(res.customers || [])
    } catch (err) {
      console.error('Failed to load customers', err)
    }
  }, [businessId])

  React.useEffect(() => {
    fetchProfiles()
    fetchLookups()
  }, [fetchProfiles, fetchLookups])

  const handleTriggerBilling = async () => {
    try {
      setTriggerLoading(true)
      const res = await recurringInvoicesAPI.triggerBilling(businessId)
      toast.success(res.message || 'Billing processing completed successfully')
      fetchProfiles()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Billing trigger failed')
    } finally {
      setTriggerLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!form.customerId) return toast.error('Customer ID is required')
    if (!form.startDate) return toast.error('Start date is required')
    if (!form.rate) return toast.error('Rate is required')

    const qty = parseFloat(form.quantity) || 1
    const rate = parseFloat(form.rate) || 0
    const tax = parseFloat(form.taxPercent) || 0

    try {
      setCreateLoading(true)
      await recurringInvoicesAPI.createProfile(businessId, {
        customerId: form.customerId,
        frequency: form.frequency,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        items: [
          {
            description: form.description || 'Recurring Service',
            quantity: qty,
            rate,
            taxPercent: tax,
            total: qty * rate * (1 + tax / 100),
          },
        ],
      })
      toast.success('Recurring invoice profile created')
      setCreateOpen(false)
      setForm({ customerId: '', frequency: 'MONTHLY', startDate: '', endDate: '', description: '', quantity: '1', rate: '', taxPercent: '0' })
      fetchProfiles()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create profile')
    } finally {
      setCreateLoading(false)
    }
  }

  const filtered = React.useMemo(() => {
    const kw = search.trim().toLowerCase()
    if (!kw) return profiles
    return profiles.filter(
      (p) =>
        p.customer?.company?.toLowerCase().includes(kw) ||
        p.frequency?.toLowerCase().includes(kw) ||
        p.status?.toLowerCase().includes(kw),
    )
  }, [profiles, search])

  // KPI stats
  const stats = React.useMemo(() => {
    const active = profiles.filter((p) => p.status === 'ACTIVE').length
    const paused = profiles.filter((p) => p.status === 'PAUSED').length
    const totalMRR = profiles
      .filter((p) => p.status === 'ACTIVE' && p.frequency === 'MONTHLY')
      .reduce((acc, p) => acc + Number(p.grandTotal || 0), 0)
    return { active, paused, totalMRR, total: profiles.length }
  }, [profiles])

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading recurring invoice profiles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background dark:bg-slate-950 px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0 transition-colors">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card dark:bg-slate-900 p-6 rounded-2xl border border-border dark:border-slate-800 shadow-sm transition-colors">
        <header className="flex items-center justify-between gap-4 w-full">
          <div className="flex min-w-0 items-center gap-4">
            <div className="p-3 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-xl hidden sm:block">
              <RefreshCw className="h-6 w-6" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-2xl font-bold text-foreground dark:text-slate-100 tracking-tight">Recurring Invoices</span>
              <span className="text-sm font-medium text-muted-foreground dark:text-slate-400 mt-0.5">Automated billing profiles &middot; Subscription management</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="h-10 rounded-xl border-border dark:border-slate-700 bg-card dark:bg-slate-800 hover:bg-muted dark:hover:bg-slate-800/80 text-foreground dark:text-slate-200 font-semibold gap-2 shadow-sm cursor-pointer" variant="outline" disabled={triggerLoading}>
                  {triggerLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 text-amber-500" />
                  )}
                  Trigger Billing
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl dark:bg-slate-900 dark:border-slate-800">
                <AlertDialogHeader>
                  <AlertDialogTitle className="dark:text-slate-100">Run Billing Cycle Now?</AlertDialogTitle>
                  <AlertDialogDescription className="dark:text-slate-400">
                    This will process all active recurring invoice profiles and generate invoices for
                    any billing cycles that are due. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 border-border dark:border-slate-700 cursor-pointer">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleTriggerBilling} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                    Yes, Run Billing
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm cursor-pointer">
                  <Plus className="h-4 w-4" />
                  New Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl p-0 flex flex-col gap-0 max-h-[90vh] overflow-hidden rounded-2xl dark:bg-slate-900 dark:border-slate-800">
                <div className="px-6 py-5 border-b border-border dark:border-slate-800 bg-muted/50 dark:bg-slate-900/50 shrink-0">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground dark:text-slate-100">
                      <div className="h-8 w-8 rounded-full bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center">
                        <RefreshCw className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      </div>
                      Create Recurring Profile
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground dark:text-slate-400 font-medium ml-10 mt-1">
                      Set up an automated billing schedule for a customer.
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <div className="overflow-y-auto p-6 custom-scrollbar" style={{ maxHeight: 'calc(90vh - 160px)' }}>
                  <div className="grid gap-6">
                    <div className="space-y-1.5">
                      <Label htmlFor="ri-customer" className="text-muted-foreground dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Customer ID <span className="text-rose-500">*</span></Label>
                      <Select value={form.customerId} onValueChange={(v) => setForm(f => ({ ...f, customerId: v }))}>
                        <SelectTrigger id="ri-customer" className="rounded-xl border-border dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100">
                          <SelectValue placeholder="Select Customer" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-900 dark:border-slate-800 rounded-xl">
                          {customers.map(c => (
                            <SelectItem key={c.id} value={c.id} className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">
                              {c.company || c.name || c.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="ri-freq" className="text-muted-foreground dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Billing Frequency</Label>
                        <Select
                          value={form.frequency}
                          onValueChange={(v) => setForm((f) => ({ ...f, frequency: v }))}
                        >
                          <SelectTrigger id="ri-freq" className="rounded-xl border-border dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-slate-900 dark:border-slate-800 rounded-xl">
                            <SelectItem value="DAILY" className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">Daily</SelectItem>
                            <SelectItem value="WEEKLY" className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">Weekly</SelectItem>
                            <SelectItem value="MONTHLY" className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">Monthly</SelectItem>
                            <SelectItem value="YEARLY" className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="ri-tax" className="text-muted-foreground dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">{taxLabel}</Label>
                        {isOtherCountry ? (
                          <Input
                            id="ri-tax"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.taxPercent}
                            onChange={(e) => setForm((f) => ({ ...f, taxPercent: e.target.value }))}
                            className="rounded-xl border-border dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100"
                          />
                        ) : (
                          <EditableTaxSelect
                            value={Number(form.taxPercent || 0)}
                            onChange={(val) => setForm((f) => ({ ...f, taxPercent: String(val) }))}
                            options={[0, 5, 12, 15, 18, 28]}
                            size="default"
                          />
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ri-desc" className="text-muted-foreground dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Service Description</Label>
                      <Input
                        id="ri-desc"
                        placeholder="e.g. Monthly SaaS Subscription"
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        className="rounded-xl border-border dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="ri-qty" className="text-muted-foreground dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Quantity</Label>
                        <Input
                          id="ri-qty"
                          type="number"
                          min="1"
                          value={form.quantity}
                          onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                          className="rounded-xl border-border dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="ri-rate" className="text-muted-foreground dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Rate (₹) <span className="text-rose-500">*</span></Label>
                        <Input
                          id="ri-rate"
                          type="number"
                          min="0"
                          placeholder="0.00"
                          value={form.rate}
                          onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
                          className="rounded-xl border-border dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100 font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="ri-start" className="text-muted-foreground dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Start Date <span className="text-rose-500">*</span></Label>
                        <Input
                          id="ri-start"
                          type="date"
                          value={form.startDate}
                          onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                          className="rounded-xl border-border dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100 [&::-webkit-calendar-picker-indicator]:dark:invert"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="ri-end" className="text-muted-foreground dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">End Date <span className="text-slate-400 font-normal normal-case tracking-normal">(optional)</span></Label>
                        <Input
                          id="ri-end"
                          type="date"
                          value={form.endDate}
                          onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                          className="rounded-xl border-border dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100 [&::-webkit-calendar-picker-indicator]:dark:invert"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-border dark:border-slate-800 bg-muted/30 dark:bg-slate-900 shrink-0 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    className="rounded-xl h-10 border-border dark:border-slate-700 text-muted-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800 font-semibold cursor-pointer"
                    onClick={() => setCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={createLoading} className="rounded-xl h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 shadow-sm cursor-pointer">
                    {createLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Create Profile
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl border-border dark:border-slate-800 shadow-sm bg-card dark:bg-slate-900 hover:shadow-md dark:hover:border-slate-700 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground dark:text-slate-400">Active Profiles</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <Play className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground dark:text-slate-100">{stats.active}</div>
            <p className="text-xs text-muted-foreground dark:text-slate-400 font-medium mt-1">Currently billing</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border dark:border-slate-800 shadow-sm bg-card dark:bg-slate-900 hover:shadow-md dark:hover:border-slate-700 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground dark:text-slate-400">Paused Profiles</CardTitle>
            <div className="h-8 w-8 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <PauseCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground dark:text-slate-100">{stats.paused}</div>
            <p className="text-xs text-muted-foreground dark:text-slate-400 font-medium mt-1">Temporarily suspended</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border dark:border-slate-800 shadow-sm bg-card dark:bg-slate-900 hover:shadow-md dark:hover:border-slate-700 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground dark:text-slate-400">Monthly MRR</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground dark:text-slate-100">{formatCurrency(stats.totalMRR)}</div>
            <p className="text-xs text-muted-foreground dark:text-slate-400 font-medium mt-1">From monthly profiles</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border dark:border-slate-800 shadow-sm bg-card dark:bg-slate-900 hover:shadow-md dark:hover:border-slate-700 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground dark:text-slate-400">Total Profiles</CardTitle>
            <div className="h-8 w-8 rounded-full bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
              <RefreshCw className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground dark:text-slate-100">{stats.total}</div>
            <p className="text-xs text-muted-foreground dark:text-slate-400 font-medium mt-1">All billing schedules</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Profiles Table ── */}
      <div className="rounded-2xl border border-border dark:border-slate-800 bg-card dark:bg-slate-900 shadow-sm overflow-hidden transition-colors">
        <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between border-b border-border dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-lg">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
                Billing Profiles
                <Badge variant="secondary" className="bg-muted dark:bg-slate-800 text-muted-foreground dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-transparent rounded-lg px-2">
                  {filtered.length}
                </Badge>
              </h2>
              <p className="text-sm text-muted-foreground dark:text-slate-400 font-medium mt-0.5">Automated invoice generation schedules</p>
            </div>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-muted-foreground" />
            <Input
              placeholder="Search customer, frequency..."
              className="pl-9 h-10 rounded-xl border-border dark:border-slate-700 bg-muted dark:bg-slate-950 focus-visible:ring-blue-500 dark:text-slate-100 transition-colors shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        {filtered.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center">
            <div className="p-4 bg-muted dark:bg-slate-800/50 rounded-full mb-4">
              <RefreshCw className="h-8 w-8 text-slate-400 dark:text-muted-foreground" />
            </div>
            <h3 className="text-base font-bold text-foreground dark:text-slate-200">No recurring profiles found</h3>
            <p className="mt-1 text-sm text-muted-foreground dark:text-slate-400 max-w-sm">
              Create a billing profile to automate invoice generation.
            </p>
            <Button className="mt-6 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm cursor-pointer" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Create First Profile
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/80 dark:bg-slate-900/50">
                <TableRow className="hover:bg-background border-border dark:border-slate-800">
                  <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 px-6">Customer</TableHead>
                  <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 px-4">Frequency</TableHead>
                  <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 px-4">Status</TableHead>
                  <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 px-4">Start Date</TableHead>
                  <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 px-4">End Date</TableHead>
                  <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 px-4">Next Billing</TableHead>
                  <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 px-6 text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((profile) => {
                  const statusConf = STATUS_BADGE[profile.status] || {
                    style: 'bg-muted text-foreground dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
                    icon: <AlertCircle className="h-3 w-3" />,
                  }
                  
                  let statusStyle = statusConf.style
                  if (statusStyle.includes('emerald')) statusStyle += ' dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                  if (statusStyle.includes('amber')) statusStyle += ' dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                  
                  let freqStyle = FREQUENCY_BADGE[profile.frequency] || 'bg-muted text-foreground border-border dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                  if (freqStyle.includes('red')) freqStyle += ' dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                  if (freqStyle.includes('amber')) freqStyle += ' dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                  if (freqStyle.includes('blue')) freqStyle += ' dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                  if (freqStyle.includes('violet')) freqStyle += ' dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20'
                  
                  return (
                    <TableRow key={profile.id} className="hover:bg-muted/50 dark:hover:bg-slate-800/30 border-border dark:border-slate-800 transition-colors">
                      <TableCell className="px-6 py-4">
                        <span className="font-bold text-sm text-foreground dark:text-slate-200">{profile.customer?.company || profile.customerId}</span>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <Badge
                          variant="outline"
                          className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md ${freqStyle}`}
                        >
                          {profile.frequency}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <Badge
                          variant="outline"
                          className={`flex w-fit items-center gap-1.5 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md ${statusStyle}`}
                        >
                          {statusConf.icon}
                          {profile.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm font-medium text-muted-foreground dark:text-slate-400">
                        {formatDate(profile.startDate)}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm font-medium text-slate-400 dark:text-muted-foreground">
                        {formatDate(profile.endDate)}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        {profile.nextBillingDate ? (
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-md">
                            {formatDate(profile.nextBillingDate)}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-muted-foreground text-sm font-medium">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <span className="font-bold text-sm text-foreground dark:text-slate-200">
                          {formatCurrency(profile.grandTotal || 0)}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
