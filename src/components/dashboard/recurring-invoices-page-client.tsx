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
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0 max-w-full overflow-x-hidden">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Recurring Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">Automated billing profiles · Subscription management</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="h-10 rounded-xl border-border bg-card hover:bg-muted text-foreground font-medium gap-2 shadow-sm cursor-pointer px-4" variant="outline" disabled={triggerLoading}>
                {triggerLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                ) : (
                  <Zap className="h-4 w-4 text-amber-500" />
                )}
                Trigger Billing
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Run Billing Cycle Now?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will process all active recurring invoice profiles and generate invoices for
                  any billing cycles that are due. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl border-border cursor-pointer">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleTriggerBilling} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                  Yes, Run Billing
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button asChild className="h-10 cursor-pointer gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-xl border-none font-medium px-5">
            <Link to={`/dashboard/${businessId}/recurring-invoices/create`}>
              <Plus className="h-4 w-4" />
              New Profile
            </Link>
          </Button>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Active Profiles', value: stats.active, sub: 'Currently billing', icon: Play, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800' },
          { label: 'Paused Profiles', value: stats.paused, sub: 'Temporarily suspended', icon: PauseCircle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800' },
          { label: 'Monthly MRR', value: formatCurrency(stats.totalMRR), sub: 'From monthly profiles', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800' },
          { label: 'Total Profiles', value: stats.total, sub: 'All billing schedules', icon: RefreshCw, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100 dark:bg-violet-900/20 dark:border-violet-800' },
        ].map(stat => (
          <Card key={stat.label} className="border-border bg-card shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-black text-foreground mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-1">{stat.sub}</p>
                </div>
                <div className={`flex items-center justify-center h-12 w-12 rounded-xl border ${stat.bg} ${stat.color} shadow-sm shrink-0`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Profiles Table Card ── */}
      <Card className="w-full min-w-0 max-w-full rounded-2xl border-border bg-card shadow-sm overflow-hidden flex-1 flex flex-col">
        <CardHeader className="border-b border-border bg-muted/50 pb-5 pt-6 px-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Billing Profiles</CardTitle>
              <CardDescription className="text-sm font-medium text-muted-foreground mt-1">
                Showing <span className="text-foreground font-semibold">{filtered.length}</span> of {profiles.length} billing schedules
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search customer, frequency..."
                className="pl-9 h-10 rounded-xl border-border bg-card w-full focus-visible:ring-blue-500 text-sm shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <div className="p-0 border-t-0 flex-1 overflow-x-auto max-w-full w-full min-w-0 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center">
              <div className="p-4 bg-muted rounded-full mb-4">
                <RefreshCw className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-base font-semibold text-foreground">No recurring profiles found</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                Create a billing profile to automate invoice generation.
              </p>
              <Button asChild className="mt-6 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm font-medium px-5 cursor-pointer">
                <Link to={`/dashboard/${businessId}/recurring-invoices/create`}>
                  <Plus className="h-4 w-4" />
                  Create First Profile
                </Link>
              </Button>
            </div>
          ) : (
            <Table className="w-full min-w-[850px]">
              <TableHeader className="bg-muted dark:bg-[#181a20] sticky top-0 z-10 border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <TableRow className="hover:bg-muted dark:hover:bg-[#181a20] border-b border-border">
                  <TableHead className="pl-6 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Customer</TableHead>
                  <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Frequency</TableHead>
                  <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                  <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Start Date</TableHead>
                  <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">End Date</TableHead>
                  <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Next Billing</TableHead>
                  <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">Amount</TableHead>
                  <TableHead className="pr-6 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">Action</TableHead>
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
                        {(profile.nextBillingDate || (profile as any).nextInvoiceDate) ? (
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-md">
                            {formatDate(profile.nextBillingDate || (profile as any).nextInvoiceDate)}
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
          )}
        </div>
      </Card>
    </div>
  )
}
