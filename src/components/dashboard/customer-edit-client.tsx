import { toast } from 'sonner';
import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom';
import {  useNavigate  } from 'react-router-dom';
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { SaveIcon, ArrowLeftIcon, TrashIcon, CreditCardIcon } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CurrencySelect } from '@/components/dashboard/currency-select'
import { ALL_REGIONS, getRegionDisplayLabel } from './regions'

export function CustomerEditClient({ businessId, customerId }: { businessId: string; customerId: string }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { business, refresh } = useBusinessData()
  const API_BASE = import.meta.env.VITE_API_BASE || ''
  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\\^])/g, '\\$1') + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : ''
  }

  const customer = useMemo(() => {
    return (business?.customers ?? []).find((c: any) => c.id === customerId) || null
  }, [business, customerId])

  const [form, setForm] = useState({
    company: '',
    region: '',
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
    currency: '',
    
    // Upgraded CRM Account fields
    industry: '',
    annualRevenue: '',
    employeeCount: '',
    linkedinUrl: '',
    tags: '',
    parentAccountId: '',
  })
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (customer) {
      setForm({
        company: customer.company || '',
        region: customer.region || '',
        vatNumber: customer.vatNumber || '',
        phone: customer.phone || '',
        website: customer.website || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        zipCode: customer.zipCode || '',
        country: customer.country || '',
        billingStreet: customer.billingStreet || '',
        billingCity: customer.billingCity || '',
        billingState: customer.billingState || '',
        billingZipCode: customer.billingZipCode || '',
        billingCountry: customer.billingCountry || '',
        shippingStreet: customer.shippingStreet || '',
        shippingCity: customer.shippingCity || '',
        shippingState: customer.shippingState || '',
        shippingZipCode: customer.shippingZipCode || '',
        shippingCountry: customer.shippingCountry || '',
        currency: (customer.currency && customer.currency !== 'SYSTEM') ? customer.currency : '',
        
        industry: customer.industry || '',
        annualRevenue: customer.annualRevenue !== undefined && customer.annualRevenue !== null ? String(customer.annualRevenue) : '',
        employeeCount: customer.employeeCount !== undefined && customer.employeeCount !== null ? String(customer.employeeCount) : '',
        linkedinUrl: customer.linkedinUrl || '',
        tags: Array.isArray(customer.tags) ? customer.tags.join(', ') : '',
        parentAccountId: customer.parentAccountId || '',
      })
    }
  }, [customer])

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.company) {
      toast({ title: 'Validation error', description: 'Company name is required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const token = getCookie('token')
      const res = await fetch(`${API_BASE}/api/customers/${encodeURIComponent(customerId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
        body: JSON.stringify({
          ...form,
          annualRevenue: form.annualRevenue ? parseFloat(form.annualRevenue) : null,
          employeeCount: form.employeeCount ? parseInt(form.employeeCount) : null,
          tags: form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
          parentAccountId: form.parentAccountId || null,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to update customer')
      }
      toast({ title: 'Customer updated', description: `${form.company} saved successfully.` })
      try {
        await refresh()
      } catch {}
      navigate(`/dashboard/${businessId}/customers/${customerId}/view`)
    } catch (err: any) {
      toast({ title: 'Failed to update', description: err?.message || 'Unknown error', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const token = getCookie('token')
      const res = await fetch(`${API_BASE}/api/customers/${encodeURIComponent(customerId)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to delete customer')
      }
      toast({ title: 'Customer deleted', description: 'The customer has been removed.', variant: 'destructive' })
      try {
        await refresh()
      } catch {}
      navigate(`/dashboard/${businessId}/customers`)
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err?.message || 'Unknown error', variant: 'destructive' })
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  if (!customer) {
    return (
      <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-10 pt-0 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <Button variant="ghost" onClick={() => navigate(`/dashboard/${businessId}/customers`)} className="gap-2">
            <ArrowLeftIcon className="size-4" />
            Back
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Customer not found</CardTitle>
            <CardDescription>Make sure the link is correct.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-10 pt-0 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between py-4">
        <Button variant="ghost" onClick={() => navigate(`/dashboard/${businessId}/customers`)} className="gap-2">
          <ArrowLeftIcon className="size-4" />
          Back
        </Button>
        <Button variant="destructive" onClick={() => setDeleteOpen(true)} className="gap-2">
          <TrashIcon className="size-4" />
          Delete
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Customer</CardTitle>
          <CardDescription>Update details and save to apply changes.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Company <span className="text-red-500">*</span></Label>
              <Input value={form.company} onChange={e => handleChange('company', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Region <span className="text-red-500">*</span></Label>
              <select 
                value={form.region} 
                onChange={e => handleChange('region', e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-background file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select region</option>
                {ALL_REGIONS.map(r => (
                  <option key={r} value={r}>{getRegionDisplayLabel(r)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>{form.region === 'INDIA' ? 'GST Number' : (form.region === 'UAE' || form.region === 'UNITED_ARAB_EMIRATES') ? 'VAT Number' : 'TAX Number'}</Label>
              <Input value={form.vatNumber} onChange={e => handleChange('vatNumber', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={e => handleChange('phone', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={form.website} onChange={e => handleChange('website', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><CreditCardIcon className="size-4" /> Currency</Label>
              <CurrencySelect
                value={form.currency && form.currency !== 'SYSTEM' ? form.currency : ''}
                onValueChange={val => handleChange('currency', val)}
              />
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <select 
                value={form.industry} 
                onChange={e => handleChange('industry', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-background file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select Industry</option>
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="Education">Education</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Services">Services</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Annual Revenue</Label>
              <Input type="number" step="any" value={form.annualRevenue} onChange={e => handleChange('annualRevenue', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Employee Count</Label>
              <Input type="number" value={form.employeeCount} onChange={e => handleChange('employeeCount', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>LinkedIn Profile URL</Label>
              <Input value={form.linkedinUrl} onChange={e => handleChange('linkedinUrl', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Parent Account</Label>
              <select 
                value={form.parentAccountId} 
                onChange={e => handleChange('parentAccountId', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-background file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">No Parent Account (Top-level)</option>
                {(business?.customers ?? [])
                  .filter((c: any) => c.id !== customerId)
                  .map((c: any) => (
                    <option key={c.id} value={c.id}>{c.company || c.name}</option>
                  ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Tags (comma separated)</Label>
              <Input value={form.tags} onChange={e => handleChange('tags', e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Address</Label>
              <Textarea value={form.address} onChange={e => handleChange('address', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={form.city} onChange={e => handleChange('city', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input value={form.state} onChange={e => handleChange('state', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>ZIP</Label>
              <Input value={form.zipCode} onChange={e => handleChange('zipCode', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={form.country} onValueChange={value => handleChange('country', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UAE">United Arab Emirates</SelectItem>
                  <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                  <SelectItem value="Qatar">Qatar</SelectItem>
                  <SelectItem value="Kuwait">Kuwait</SelectItem>
                  <SelectItem value="Oman">Oman</SelectItem>
                  <SelectItem value="Bahrain">Bahrain</SelectItem>
                  <SelectItem value="India">India</SelectItem>
                  <SelectItem value="United States">United States</SelectItem>
                  <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Billing Street</Label>
                  <Input value={form.billingStreet} onChange={e => handleChange('billingStreet', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Shipping Street</Label>
                  <Input value={form.shippingStreet} onChange={e => handleChange('shippingStreet', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Billing City</Label>
                  <Input value={form.billingCity} onChange={e => handleChange('billingCity', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Shipping City</Label>
                  <Input value={form.shippingCity} onChange={e => handleChange('shippingCity', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Billing State</Label>
                  <Input value={form.billingState} onChange={e => handleChange('billingState', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Shipping State</Label>
                  <Input value={form.shippingState} onChange={e => handleChange('shippingState', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Billing ZIP</Label>
                  <Input value={form.billingZipCode} onChange={e => handleChange('billingZipCode', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Shipping ZIP</Label>
                  <Input value={form.shippingZipCode} onChange={e => handleChange('shippingZipCode', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Billing Country</Label>
                  <Select value={form.billingCountry} onValueChange={value => handleChange('billingCountry', value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select billing country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UAE">United Arab Emirates</SelectItem>
                      <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                      <SelectItem value="Qatar">Qatar</SelectItem>
                      <SelectItem value="Kuwait">Kuwait</SelectItem>
                      <SelectItem value="Oman">Oman</SelectItem>
                      <SelectItem value="Bahrain">Bahrain</SelectItem>
                      <SelectItem value="India">India</SelectItem>
                      <SelectItem value="United States">United States</SelectItem>
                      <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Shipping Country</Label>
                  <Select value={form.shippingCountry} onValueChange={value => handleChange('shippingCountry', value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select shipping country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UAE">United Arab Emirates</SelectItem>
                      <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                      <SelectItem value="Qatar">Qatar</SelectItem>
                      <SelectItem value="Kuwait">Kuwait</SelectItem>
                      <SelectItem value="Oman">Oman</SelectItem>
                      <SelectItem value="Bahrain">Bahrain</SelectItem>
                      <SelectItem value="India">India</SelectItem>
                      <SelectItem value="United States">United States</SelectItem>
                      <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={saving} className="gap-2">
                <SaveIcon className="size-4" />
                Save
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Do you really want to delete this customer?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
