import * as React from 'react'
import { recurringInvoicesAPI } from '@/lib/api/recurring-invoices'
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
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { EditableTaxSelect } from '@/components/dashboard/editable-tax-select'
import { useNavigate } from 'react-router-dom'

interface Props {
  businessId: string
}

export function CreateRecurringInvoiceClient({ businessId }: Props) {
  const [createLoading, setCreateLoading] = React.useState(false)
  const [customers, setCustomers] = React.useState<Customer[]>([])
  const navigate = useNavigate()

  const [form, setForm] = React.useState({
    customerId: '',
    profileName: '',
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

  React.useEffect(() => {
    const fetchLookups = async () => {
      try {
        const res = await contactsAPI.getCustomers(businessId)
        setCustomers(res.customers || [])
      } catch (err) {
        console.error('Failed to load customers', err)
      }
    }
    fetchLookups()
  }, [businessId])

  const handleCreate = async () => {
    if (!form.customerId) return toast.error('Customer ID is required')
    if (!form.profileName) return toast.error('Profile Name is required')
    if (!form.startDate) return toast.error('Start date is required')
    if (!form.rate) return toast.error('Rate is required')

    const qty = parseFloat(form.quantity) || 1
    const rate = parseFloat(form.rate) || 0
    const tax = parseFloat(form.taxPercent) || 0

    try {
      setCreateLoading(true)
      await recurringInvoicesAPI.createProfile(businessId, {
        customerId: form.customerId,
        profileName: form.profileName,
        frequency: form.frequency,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        items: [
          {
            description: form.description || 'Recurring Service',
            quantity: qty,
            price: rate, // Map rate to price for backend validation
            taxDetails: tax > 0 ? [{ name: 'Tax', rate: tax, amount: qty * rate * (tax / 100) }] : [],
          },
        ],
      })
      toast.success('Recurring invoice profile created')
      navigate(`/dashboard/${businessId}/recurring-invoices`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create profile')
    } finally {
      setCreateLoading(false)
    }
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
          <span className="text-2xl font-bold text-foreground dark:text-slate-100 tracking-tight">Create Recurring Profile</span>
          <span className="text-sm font-medium text-muted-foreground dark:text-slate-400 mt-0.5">Set up an automated billing schedule for a customer.</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border dark:border-slate-800 bg-card dark:bg-slate-900 shadow-sm p-6 sm:p-8 flex flex-col gap-8 max-w-4xl">
        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="ri-customer" className="text-muted-foreground dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Customer <span className="text-rose-500">*</span></Label>
              <Select value={form.customerId} onValueChange={(v) => setForm(f => ({ ...f, customerId: v }))}>
                <SelectTrigger id="ri-customer" className="rounded-xl border-border dark:border-slate-700 h-11 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100">
                  <SelectValue placeholder="Select Customer" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900 dark:border-slate-800 rounded-xl">
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id} className="dark:focus:bg-slate-800 cursor-pointer rounded-lg py-2">
                      {c.company || c.name || c.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <Button onClick={handleCreate} disabled={createLoading} className="rounded-xl h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 shadow-sm cursor-pointer px-8">
            {createLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
            Create Profile
          </Button>
        </div>
      </div>
    </div>
  )
}
