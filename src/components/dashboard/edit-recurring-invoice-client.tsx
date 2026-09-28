import * as React from 'react'
import { recurringInvoicesAPI, RecurringInvoiceProfile } from '@/lib/api/recurring-invoices'
import { contactsAPI, Customer } from '@/lib/api/contacts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { EditableTaxSelect } from '@/components/dashboard/editable-tax-select'
import { useNavigate } from 'react-router-dom'

interface Props {
  businessId: string
  id: string
}

export function EditRecurringInvoiceClient({ businessId, id }: Props) {
  const [loading, setLoading] = React.useState(true)
  const [saveLoading, setSaveLoading] = React.useState(false)
  const [customers, setCustomers] = React.useState<Customer[]>([])
  const navigate = useNavigate()
  
  const [form, setForm] = React.useState({
    profileName: '',
    frequency: 'MONTHLY',
    startDate: '',
    endDate: '',
    status: 'ACTIVE',
    description: '',
    quantity: '1',
    rate: '',
    taxPercent: '0',
  })
  
  const [originalProfile, setOriginalProfile] = React.useState<RecurringInvoiceProfile | null>(null)

  const selectedCustomer = originalProfile?.customer
  const customerCountryName = (selectedCustomer as any)?.country || (selectedCustomer as any)?.region || ''
  const isCustomerSelected = !!selectedCustomer
  const customerCountryNameUpper = customerCountryName.trim().toUpperCase()
  const isOtherCountry = isCustomerSelected && customerCountryNameUpper !== '' && customerCountryNameUpper !== 'INDIA' && customerCountryNameUpper !== 'UAE' && customerCountryNameUpper !== 'UNITED ARAB EMIRATES'

  const getTaxLabel = (c: string) => {
    const cUp = c.toUpperCase()
    if (['AUSTRALIA', 'CANADA', 'NEW ZEALAND', 'SINGAPORE', 'MALAYSIA'].includes(cUp)) return 'GST %'
    if (['UNITED STATES', 'USA', 'US'].includes(cUp)) return 'Sales Tax %'
    if (['UNITED KINGDOM', 'UK', 'SOUTH AFRICA'].includes(cUp)) return 'VAT %'
    return 'Tax %'
  }
  const taxLabel = isOtherCountry ? getTaxLabel(customerCountryNameUpper) : 'Tax %'

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const profileRes = await recurringInvoicesAPI.getProfile(businessId, id)
        const profile = profileRes.data
        setOriginalProfile(profile)
        
        const item = profile.items && profile.items.length > 0 ? profile.items[0] : null
        let taxPercent = '0'
        if (item && (item as any).taxDetails && (item as any).taxDetails.length > 0) {
          taxPercent = String((item as any).taxDetails[0].rate || 0)
        }

        setForm({
          profileName: (profile as any).profileName || '',
          frequency: profile.frequency,
          startDate: profile.startDate ? profile.startDate.split('T')[0] : '',
          endDate: profile.endDate ? profile.endDate.split('T')[0] : '',
          status: profile.status,
          description: item?.description || '',
          quantity: String(item?.quantity || 1),
          rate: String(item?.rate || (item as any)?.price || 0),
          taxPercent,
        })
      } catch (err) {
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [businessId, id])

  const handleSave = async () => {
    if (!form.profileName) return toast.error('Profile Name is required')
    if (!form.startDate) return toast.error('Start date is required')
    if (!form.rate) return toast.error('Rate is required')

    const qty = parseFloat(form.quantity) || 1
    const rate = parseFloat(form.rate) || 0
    const tax = parseFloat(form.taxPercent) || 0

    try {
      setSaveLoading(true)
      await recurringInvoicesAPI.updateProfile(businessId, id, {
        profileName: form.profileName,
        frequency: form.frequency,
        startDate: form.startDate,
        endDate: form.endDate || null,
        status: form.status,
        items: [
          {
            description: form.description || 'Recurring Service',
            quantity: qty,
            price: rate,
            taxDetails: tax > 0 ? [{ name: 'Tax', rate: tax, amount: qty * rate * (tax / 100) }] : [],
          },
        ],
      })
      toast.success('Recurring invoice profile updated')
      navigate(`/dashboard/${businessId}/recurring-invoices`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSaveLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background dark:bg-slate-950 px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0 transition-colors">
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
          <span className="text-2xl font-bold text-foreground dark:text-slate-100 tracking-tight">Edit Recurring Profile</span>
          <span className="text-sm font-medium text-muted-foreground dark:text-slate-400 mt-0.5">Manage existing automated billing schedule.</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border dark:border-slate-800 bg-card dark:bg-slate-900 shadow-sm p-6 sm:p-8 flex flex-col gap-8 max-w-4xl">
        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Customer</Label>
              <div className="h-11 rounded-xl border border-border dark:border-slate-700 bg-muted/50 dark:bg-slate-950 px-3 py-2 flex items-center text-sm font-medium text-muted-foreground">
                {originalProfile?.customer?.company || originalProfile?.customerId}
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="ri-profilename" className="text-muted-foreground dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Profile Name <span className="text-rose-500">*</span></Label>
              <Input
                id="ri-profilename"
                placeholder="e.g. Server Maintenance"
                value={form.profileName}
                onChange={(e) => setForm((f) => ({ ...f, profileName: e.target.value }))}
                className="rounded-xl border-border dark:border-slate-700 h-11 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="ri-status" className="text-muted-foreground dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger id="ri-status" className="rounded-xl border-border dark:border-slate-700 h-11 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900 dark:border-slate-800 rounded-xl">
                  <SelectItem value="ACTIVE" className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">Active</SelectItem>
                  <SelectItem value="PAUSED" className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">Paused</SelectItem>
                  <SelectItem value="COMPLETED" className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="ri-freq" className="text-muted-foreground dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Billing Frequency</Label>
              <Select
                value={form.frequency}
                onValueChange={(v) => setForm((f) => ({ ...f, frequency: v }))}
              >
                <SelectTrigger id="ri-freq" className="rounded-xl border-border dark:border-slate-700 h-11 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100">
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
                  className="rounded-xl border-border dark:border-slate-700 h-11 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100"
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
              className="rounded-xl border-border dark:border-slate-700 h-11 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="ri-qty" className="text-muted-foreground dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Quantity</Label>
              <Input
                id="ri-qty"
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                className="rounded-xl border-border dark:border-slate-700 h-11 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100"
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
                className="rounded-xl border-border dark:border-slate-700 h-11 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100 font-mono"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="ri-start" className="text-muted-foreground dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Start Date <span className="text-rose-500">*</span></Label>
              <Input
                id="ri-start"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className="rounded-xl border-border dark:border-slate-700 h-11 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100 [&::-webkit-calendar-picker-indicator]:dark:invert"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ri-end" className="text-muted-foreground dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">End Date <span className="text-slate-400 font-normal normal-case tracking-normal">(optional)</span></Label>
              <Input
                id="ri-end"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className="rounded-xl border-border dark:border-slate-700 h-11 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100 [&::-webkit-calendar-picker-indicator]:dark:invert"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-border dark:border-slate-800">
          <Button
            variant="outline"
            className="rounded-xl h-11 border-border dark:border-slate-700 text-muted-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800 font-semibold cursor-pointer px-6"
            onClick={() => window.history.back()}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saveLoading} className="rounded-xl h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 shadow-sm cursor-pointer px-8">
            {saveLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
