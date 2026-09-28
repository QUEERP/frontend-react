import * as React from 'react'
import { recurringInvoicesAPI, RecurringInvoiceProfile } from '@/lib/api/recurring-invoices'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, Edit, FileText, CheckCircle2, PauseCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  businessId: string
  id: string
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

export function ViewRecurringInvoiceClient({ businessId, id }: Props) {
  const [loading, setLoading] = React.useState(true)
  const [profile, setProfile] = React.useState<RecurringInvoiceProfile | null>(null)

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const profileRes = await recurringInvoicesAPI.getProfile(businessId, id)
        setProfile(profileRes.data)
      } catch (err) {
        toast.error('Failed to load profile details')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [businessId, id])

  if (loading || !profile) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const statusConf = STATUS_BADGE[profile.status] || {
    style: 'bg-muted text-foreground',
    icon: <AlertCircle className="h-3 w-3" />,
  }
  const freqStyle = FREQUENCY_BADGE[profile.frequency] || 'bg-muted text-foreground'

  const item = profile.items && profile.items.length > 0 ? profile.items[0] : null
  const rate = item?.rate || (item as any)?.price || 0
  const qty = item?.quantity || 1
  let taxPercent = 0
  if (item && (item as any).taxDetails && (item as any).taxDetails.length > 0) {
    taxPercent = Number((item as any).taxDetails[0].rate || 0)
  }
  const taxAmount = qty * rate * (taxPercent / 100)

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background dark:bg-slate-950 px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0 transition-colors">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl h-10 w-10 border-border dark:border-slate-800 bg-card dark:bg-slate-900"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-col leading-tight">
            <span className="text-2xl font-bold text-foreground dark:text-slate-100 tracking-tight">Recurring Profile Details</span>
            <span className="text-sm font-medium text-muted-foreground dark:text-slate-400 mt-0.5">Overview of the billing schedule</span>
          </div>
        </div>

        <Button asChild className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm cursor-pointer">
          <Link to={`/dashboard/${businessId}/recurring-invoices/${id}/edit`}>
            <Edit className="h-4 w-4" />
            Edit Profile
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2 rounded-2xl border-border dark:border-slate-800 bg-card dark:bg-slate-900 shadow-sm">
          <CardHeader className="border-b border-border dark:border-slate-800 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground dark:text-slate-100">
              <FileText className="h-5 w-5 text-muted-foreground" />
              General Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Customer</p>
              <p className="font-medium text-foreground dark:text-slate-200">{profile.customer?.company || profile.customerId}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Profile Name</p>
              <p className="font-medium text-foreground dark:text-slate-200">{(profile as any).profileName || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Frequency</p>
              <Badge variant="outline" className={`mt-1 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-md ${freqStyle}`}>
                {profile.frequency}
              </Badge>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Status</p>
              <Badge variant="outline" className={`mt-1 flex w-fit items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-md ${statusConf.style}`}>
                {statusConf.icon}
                {profile.status}
              </Badge>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Start Date</p>
              <p className="font-medium text-foreground dark:text-slate-200">{formatDate(profile.startDate)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">End Date</p>
              <p className="font-medium text-foreground dark:text-slate-200">{formatDate(profile.endDate)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border dark:border-slate-800 bg-card dark:bg-slate-900 shadow-sm flex flex-col">
          <CardHeader className="border-b border-border dark:border-slate-800 pb-4">
            <CardTitle className="text-lg font-bold text-foreground dark:text-slate-100">Billing Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex-1 flex flex-col gap-4">
            <div className="flex justify-between items-center py-2 border-b border-border dark:border-slate-800">
              <span className="text-sm font-medium text-muted-foreground">Next Billing Date</span>
              <span className="font-bold text-foreground dark:text-slate-200">{formatDate(profile.nextBillingDate)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border dark:border-slate-800">
              <span className="text-sm font-medium text-muted-foreground">Quantity</span>
              <span className="font-medium text-foreground dark:text-slate-200">{qty}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border dark:border-slate-800">
              <span className="text-sm font-medium text-muted-foreground">Rate</span>
              <span className="font-medium text-foreground dark:text-slate-200">{formatCurrency(rate)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border dark:border-slate-800">
              <span className="text-sm font-medium text-muted-foreground">Tax ({taxPercent}%)</span>
              <span className="font-medium text-foreground dark:text-slate-200">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="mt-auto pt-4 flex justify-between items-center">
              <span className="text-base font-bold text-foreground dark:text-slate-200">Total Amount</span>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(profile.grandTotal || 0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="rounded-2xl border-border dark:border-slate-800 bg-card dark:bg-slate-900 shadow-sm mt-2">
        <CardHeader className="border-b border-border dark:border-slate-800 pb-4">
          <CardTitle className="text-lg font-bold text-foreground dark:text-slate-100">Service Description</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-sm text-foreground dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {item?.description || <span className="text-muted-foreground italic">No description provided</span>}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
