import { toast } from 'sonner';
import React, { useState } from 'react'
import { contactsAPI, CreateCustomerData } from '@/lib/api/contacts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Building2, MapPin, CreditCard, Briefcase } from 'lucide-react'
import { ALL_REGIONS, getRegionDisplayLabel } from './regions'

interface CreateCustomerModalProps {
  open: boolean
  onClose: () => void
  businessId: string
  onCreated: (customer: any) => void
}

const EMPTY_FORM: CreateCustomerData = {
  company: '',
  region: 'INDIA',
  vatNumber: '',
  phone: '',
  website: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  billingStreet: '',
  billingCity: '',
  billingState: '',
  billingZipCode: '',
  billingCountry: '',
  shippingStreet: '',
  shippingCity: '',
  shippingState: '',
  shippingZipCode: '',
  shippingCountry: '',
  industry: '',
  annualRevenue: undefined,
  employeeCount: undefined,
  accountType: '',
  description: '',
  tags: [],
  crmStatus: 'ACTIVE',
}

type TabKey = 'basic' | 'address' | 'billing' | 'shipping' | 'crm'

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'basic', label: 'Basic', icon: <Building2 className="h-4 w-4" /> },
  { key: 'address', label: 'Address', icon: <MapPin className="h-4 w-4" /> },
  { key: 'billing', label: 'Billing', icon: <CreditCard className="h-4 w-4" /> },
  { key: 'shipping', label: 'Shipping', icon: <MapPin className="h-4 w-4" /> },
  { key: 'crm', label: 'CRM', icon: <Briefcase className="h-4 w-4" /> },
]

export function CreateCustomerModal({ open, onClose, businessId, onCreated }: CreateCustomerModalProps) {
  const { toast } = useToast()
  const [form, setForm] = useState<CreateCustomerData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('basic')
  const [tagInput, setTagInput] = useState('')

  const set = (field: keyof CreateCustomerData, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleClose = () => {
    setForm(EMPTY_FORM)
    setError(null)
    setActiveTab('basic')
    setTagInput('')
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate only required fields (Company Name, Region)
    if (!form.company.trim()) { 
      setError('Company name is required.')
      setActiveTab('basic')
      return 
    }
    if (!form.region) { 
      setError('Region is required.')
      setActiveTab('basic')
      return 
    }
    
    setSaving(true)
    setError(null)
    try {
      const tags = tagInput
        ? [...(form.tags || []), ...tagInput.split(',').map(t => t.trim()).filter(Boolean)]
        : form.tags || []
        
      const res = await contactsAPI.createCustomer(businessId, { ...form, tags })
      if (res.success && res.customer) {
        toast({ title: 'Customer Created', description: `"${res.customer.company}" was added successfully.` })
        onCreated(res.customer)
        handleClose()
      } else {
        setError('Failed to create customer.')
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const fieldCls = 'h-9 text-sm'

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose() }}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Create New Customer
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">Fill in the details to add a new customer.</p>
        </DialogHeader>

        {/* Tab Bar */}
        <div className="flex gap-1 px-6 pt-4 pb-0 border-b border-border bg-muted/60">
          {TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-700 bg-card'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-card/70'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

            {/* ── BASIC ── */}
            {activeTab === 'basic' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Company Name <span className="text-red-500">*</span></Label>
                  <Input className={fieldCls} value={form.company} onChange={e => set('company', e.target.value)} placeholder="Acme Corp" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Region <span className="text-red-500">*</span></Label>
                  <Select value={form.region} onValueChange={v => set('region', v)}>
                    <SelectTrigger className={fieldCls}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ALL_REGIONS.map(region => (
                        <SelectItem key={region} value={region}>
                          {getRegionDisplayLabel(region)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    {form.region === 'INDIA' ? 'GST / PAN Number' : form.region === 'UAE' ? 'VAT / TRN Number' : 'TAX Number'}
                  </Label>
                  <Input className={fieldCls} value={form.vatNumber || ''} onChange={e => set('vatNumber', e.target.value)} placeholder={form.region === 'INDIA' ? '22AAAAA0000A1Z5' : form.region === 'UAE' ? '100123456700003' : 'Tax ID'} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Phone</Label>
                  <Input className={fieldCls} value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Website</Label>
                  <Input className={fieldCls} value={form.website || ''} onChange={e => set('website', e.target.value)} placeholder="https://acme.com" />
                </div>
              </div>
            )}

            {/* ── ADDRESS ── */}
            {activeTab === 'address' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Street / Address</Label>
                  <Input className={fieldCls} value={form.address || ''} onChange={e => set('address', e.target.value)} placeholder="123 Main Street" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">City</Label>
                  <Input className={fieldCls} value={form.city || ''} onChange={e => set('city', e.target.value)} placeholder="Mumbai" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">State</Label>
                  <Input className={fieldCls} value={form.state || ''} onChange={e => set('state', e.target.value)} placeholder="Maharashtra" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Zip / Postal Code</Label>
                  <Input className={fieldCls} value={form.zipCode || ''} onChange={e => set('zipCode', e.target.value)} placeholder="400001" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Country</Label>
                  <Input className={fieldCls} value={form.country || ''} onChange={e => set('country', e.target.value)} placeholder="India" />
                </div>
              </div>
            )}

            {/* ── BILLING ── */}
            {activeTab === 'billing' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Billing Street</Label>
                  <Input className={fieldCls} value={form.billingStreet || ''} onChange={e => set('billingStreet', e.target.value)} placeholder="456 Billing Ave" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Billing City</Label>
                  <Input className={fieldCls} value={form.billingCity || ''} onChange={e => set('billingCity', e.target.value)} placeholder="Delhi" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Billing State</Label>
                  <Input className={fieldCls} value={form.billingState || ''} onChange={e => set('billingState', e.target.value)} placeholder="Delhi" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Billing Zip Code</Label>
                  <Input className={fieldCls} value={form.billingZipCode || ''} onChange={e => set('billingZipCode', e.target.value)} placeholder="110001" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Billing Country</Label>
                  <Input className={fieldCls} value={form.billingCountry || ''} onChange={e => set('billingCountry', e.target.value)} placeholder="India" />
                </div>
              </div>
            )}

            {/* ── SHIPPING ── */}
            {activeTab === 'shipping' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Shipping Street</Label>
                  <Input className={fieldCls} value={form.shippingStreet || ''} onChange={e => set('shippingStreet', e.target.value)} placeholder="789 Shipping Rd" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Shipping City</Label>
                  <Input className={fieldCls} value={form.shippingCity || ''} onChange={e => set('shippingCity', e.target.value)} placeholder="Bangalore" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Shipping State</Label>
                  <Input className={fieldCls} value={form.shippingState || ''} onChange={e => set('shippingState', e.target.value)} placeholder="Karnataka" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Shipping Zip Code</Label>
                  <Input className={fieldCls} value={form.shippingZipCode || ''} onChange={e => set('shippingZipCode', e.target.value)} placeholder="560001" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Shipping Country</Label>
                  <Input className={fieldCls} value={form.shippingCountry || ''} onChange={e => set('shippingCountry', e.target.value)} placeholder="India" />
                </div>
              </div>
            )}

            {/* ── CRM ── */}
            {activeTab === 'crm' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Industry</Label>
                  <Input className={fieldCls} value={form.industry || ''} onChange={e => set('industry', e.target.value)} placeholder="Technology" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Account Type</Label>
                  <Select value={form.accountType || ''} onValueChange={v => set('accountType', v)}>
                    <SelectTrigger className={fieldCls}><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CUSTOMER">Customer</SelectItem>
                      <SelectItem value="PARTNER">Partner</SelectItem>
                      <SelectItem value="RESELLER">Reseller</SelectItem>
                      <SelectItem value="VENDOR">Vendor</SelectItem>
                      <SelectItem value="PROSPECT">Prospect</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Annual Revenue</Label>
                  <Input className={fieldCls} type="number" value={form.annualRevenue ?? ''} onChange={e => set('annualRevenue', e.target.value ? Number(e.target.value) : undefined)} placeholder="0.00" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Employee Count</Label>
                  <Input className={fieldCls} type="number" value={form.employeeCount ?? ''} onChange={e => set('employeeCount', e.target.value ? Number(e.target.value) : undefined)} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">CRM Status</Label>
                  <Select value={form.crmStatus || 'ACTIVE'} onValueChange={v => set('crmStatus', v)}>
                    <SelectTrigger className={fieldCls}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="PROSPECT">Prospect</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Tags (comma separated)</Label>
                  <Input className={fieldCls} value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="vip, retail, wholesale" />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Description</Label>
                  <Textarea className="text-sm resize-none" rows={3} value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="Brief notes about this customer..." />
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700 font-medium">
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t border-border bg-muted/60 flex justify-between items-center">
            <div className="flex gap-1">
              {TABS.map((tab, i) => (
                <div key={tab.key} className={`h-1.5 w-6 rounded-full transition-all ${activeTab === tab.key ? 'bg-blue-600' : 'bg-slate-200'}`} />
              ))}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[110px]">
                {saving ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Saving...</>
                ) : (
                  'Create Customer'
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
