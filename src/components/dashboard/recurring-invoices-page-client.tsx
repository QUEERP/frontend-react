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
import { Link, useNavigate } from 'react-router-dom'
import { MoreHorizontal, FileText, Download, Edit, Trash } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
  const [customers, setCustomers] = React.useState<Customer[]>([])




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

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this profile?')) return
    try {
      await recurringInvoicesAPI.deleteProfile(businessId, id)
      toast.success('Profile deleted successfully')
      fetchProfiles()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete profile')
    }
  }

  const handleDownload = async (id: string) => {
    try {
      toast.info('Downloading PDF...')
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || 
                    document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1]
                    
      // Import API_ROOT from config directly if not available, but for now we'll construct it relative to origin or use window.location
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api'
      
      const response = await fetch(`${API_URL}/recurring-invoices/${id}/download-pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
      })
      
      if (!response.ok) throw new Error('Failed to download PDF')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Recurring-Profile-${id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('PDF downloaded successfully')
    } catch (error) {
      console.error(error)
      toast.error('Failed to download PDF')
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

            <Button asChild className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm cursor-pointer">
              <Link to={`/dashboard/${businessId}/recurring-invoices/create`}>
                <Plus className="h-4 w-4" />
                New Profile
              </Link>
            </Button>
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
            <Button asChild className="mt-6 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm cursor-pointer">
              <Link to={`/dashboard/${businessId}/recurring-invoices/create`}>
                <Plus className="h-4 w-4" />
                Create First Profile
              </Link>
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
                  <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 px-4 text-center">Action</TableHead>
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
                      <TableCell className="px-4 py-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 dark:bg-slate-900 dark:border-slate-800">
                            <DropdownMenuItem asChild className="cursor-pointer">
                              <Link to={`/dashboard/${businessId}/recurring-invoices/${profile.id}`}>
                                <FileText className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="cursor-pointer">
                              <Link to={`/dashboard/${businessId}/recurring-invoices/${profile.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Profile
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(profile.id)} className="cursor-pointer">
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(profile.id)} className="cursor-pointer text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-500/10 focus:text-red-600 dark:focus:text-red-400">
                              <Trash className="h-4 w-4 mr-2" />
                              Delete Profile
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
