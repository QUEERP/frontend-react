import React, { useState, useEffect, useMemo } from 'react'
import {  useNavigate  } from 'react-router-dom';
import { Loader2Icon, ChevronLeftIcon, CheckIcon, ChevronsUpDownIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Card } from '@/components/ui/card'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { toast } from 'sonner'
import { CURRENCIES, Currency } from '@/lib/currencies'
import { cn } from '@/lib/utils'

type VendorFormData = {
  name: string
  vendorType: string
  country: string
  contactPerson: string
  email: string
  countryCode: string
  phone: string
  taxRegistrationNumber: string
  paymentTerms: string
  currency: string
  openingBalance: string
  creditLimit: string
  preferredVendor: boolean
  status: string
  notes: string
}

const COMMON_COUNTRIES = [
  "India",
  "United Arab Emirates",
  "United States",
  "United Kingdom",
  "Saudi Arabia",
  "Canada",
  "Australia",
  "Singapore",
  "Malaysia",
  "Other"
]

export function VendorForm({ 
  businessId, 
  initialData, 
  vendorId, 
  isEditing 
}: { 
  businessId: string, 
  initialData?: Partial<VendorFormData>, 
  vendorId?: string, 
  isEditing: boolean 
}) {
  const navigate = useNavigate()
  const { business, currencySymbol } = useBusinessData()

  const [formData, setFormData] = useState<VendorFormData>(() => {
    const isConst = business?.businessType === 'Construction'
    return {
      name: '',
      vendorType: '',
      country: isConst ? 'Canada' : (business?.region || 'United Arab Emirates'),
      contactPerson: '',
      email: '',
      countryCode: isConst ? '+1' : '+971',
      phone: '',
      taxRegistrationNumber: '',
      paymentTerms: 'Immediate',
      currency: isConst ? 'CAD' : (business?.currency || 'AED'),
      openingBalance: '0',
      creditLimit: '',
      preferredVendor: false,
      status: 'ACTIVE',
      notes: '',
    }
  })

  useEffect(() => {
    if (!isEditing && business) {
      const isConst = business.businessType === 'Construction'
      setFormData(prev => {
        if (prev.name === '') {
           return {
             ...prev,
             country: isConst ? 'Canada' : (business.region || 'United Arab Emirates'),
             currency: isConst ? 'CAD' : (business.currency || 'AED'),
             countryCode: isConst ? '+1' : '+971'
           }
        }
        return prev
      })
    }
  }, [business, isEditing])

  const [submitting, setSubmitting] = useState(false)
  const [currencyOpen, setCurrencyOpen] = useState(false)

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }))
    }
  }, [initialData])

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(
      new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\\^])/g, '\\$1') + '=([^;]*)'),
    )
    return match ? decodeURIComponent(match[1]) : ''
  }

  const taxLabel = useMemo(() => {
    if (formData.country === 'India') return 'GST Number'
    if (formData.country === 'United Arab Emirates') return 'VAT Number'
    return 'Tax Registration Number'
  }, [formData.country])

  const handleChange = (key: keyof VendorFormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleCountryChange = (val: string) => {
    let cc = formData.countryCode
    let curr = formData.currency

    switch (val) {
      case 'India': cc = '+91'; curr = 'INR'; break;
      case 'United Arab Emirates': cc = '+971'; curr = 'AED'; break;
      case 'United States': cc = '+1'; curr = 'USD'; break;
      case 'United Kingdom': cc = '+44'; curr = 'GBP'; break;
      case 'Saudi Arabia': cc = '+966'; curr = 'SAR'; break;
      case 'Canada': cc = '+1'; curr = 'CAD'; break;
      case 'Australia': cc = '+61'; curr = 'AUD'; break;
      case 'Singapore': cc = '+65'; curr = 'SGD'; break;
      case 'Malaysia': cc = '+60'; curr = 'MYR'; break;
    }

    setFormData(prev => ({
      ...prev,
      country: val,
      countryCode: cc,
      currency: curr
    }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Validation error', { description: 'Vendor Name is required.' })
      return false
    }
    if (!formData.vendorType) {
      toast.error('Validation error', { description: 'Vendor Type is required.' })
      return false
    }
    if (!formData.country) {
      toast.error('Validation error', { description: 'Region/Country is required.' })
      return false
    }
    if (!formData.currency) {
      toast.error('Validation error', { description: 'Currency is required.' })
      return false
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Validation error', { description: 'Invalid email format.' })
      return false
    }
    
    // Relaxed Tax validations
    if (formData.taxRegistrationNumber && formData.taxRegistrationNumber.trim().length > 0 && formData.taxRegistrationNumber.length < 3) {
      toast.error('Validation error', { description: 'Tax Registration Number is too short.' })
      return false
    }

    if (formData.openingBalance && isNaN(Number(formData.openingBalance))) {
      toast.error('Validation error', { description: 'Opening Balance must be a valid number.' })
      return false
    }
    if (formData.creditLimit && isNaN(Number(formData.creditLimit))) {
      toast.error('Validation error', { description: 'Credit Limit must be a valid number.' })
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const token = getCookie('token') || getCookie('accessToken')
      const payload = { ...formData }
      
      const method = isEditing ? 'PUT' : 'POST'
      const url = isEditing && vendorId
        ? `${API_BASE}/api/purchase/vendors/${encodeURIComponent(vendorId)}` 
        : `${API_BASE}/api/purchase/vendors`

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Failed to ${isEditing ? 'update' : 'create'} vendor`)
      }

      toast.success(isEditing ? 'Vendor updated successfully' : 'Vendor created successfully', {
        description: formData.name 
      })
      
      navigate(`/dashboard/${businessId}/vendors`)
      navigate(0)
    } catch (err: any) {
      toast.error('Error', {
        description: err?.message || 'Unknown network error',
      })
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-24 pt-4">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col gap-4">
        <div>
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/dashboard/${businessId}/vendors`)}
            className="h-9 px-3 rounded-xl hover:bg-slate-200 text-muted-foreground -ml-3"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Back to Vendors
          </Button>
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{isEditing ? 'Edit Vendor' : 'Create Vendor'}</h1>
          <p className="text-muted-foreground">Fill in the details below to register a vendor account in the directory. Fields marked with * are required.</p>
        </div>
      </div>

      <Card className="rounded-2xl border-border shadow-sm overflow-visible bg-card">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="flex flex-col p-6 md:p-8 space-y-12">
            
            {/* Section A: Basic Information */}
            <section>
              <h3 className="text-lg font-bold text-foreground mb-6 pb-3 border-b border-border flex items-center">
                <span className="bg-blue-100 text-blue-700 h-6 w-6 rounded-full flex items-center justify-center text-xs mr-3">A</span>
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-foreground font-semibold">Vendor Name *</Label>
                  <Input
                    placeholder="Enter company or individual name"
                    value={formData.name}
                    onChange={e => handleChange('name', e.target.value)}
                    disabled={submitting}
                    className="h-11 rounded-xl border-border focus-visible:ring-blue-500 shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground font-semibold">Vendor Type *</Label>
                  <Select disabled={submitting} value={formData.vendorType} onValueChange={v => handleChange('vendorType', v)}>
                    <SelectTrigger className="h-11 rounded-xl border-border focus-visible:ring-blue-500 shadow-sm">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border shadow-lg">
                      <SelectItem value="Supplier">Supplier</SelectItem>
                      <SelectItem value="Manufacturer">Manufacturer</SelectItem>
                      <SelectItem value="Service Provider">Service Provider</SelectItem>
                      <SelectItem value="Contractor">Contractor</SelectItem>
                      <SelectItem value="Freelancer">Freelancer</SelectItem>
                      <SelectItem value="Transporter">Transporter</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground font-semibold">Region/Country *</Label>
                  <Select disabled={submitting} value={formData.country} onValueChange={handleCountryChange}>
                    <SelectTrigger className="h-11 rounded-xl border-border focus-visible:ring-blue-500 shadow-sm">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border shadow-lg max-h-60">
                      {COMMON_COUNTRIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 flex flex-col justify-end">
                  <Label className="text-foreground font-semibold mb-2">Currency *</Label>
                  <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={currencyOpen}
                        disabled={submitting}
                        className="w-full justify-between h-11 rounded-xl border-border shadow-sm hover:bg-muted font-normal"
                      >
                        {formData.currency
                          ? (() => {
                              const curr = CURRENCIES.find((c) => c.code === formData.currency)
                              return curr ? `${curr.code} - ${curr.name} (${curr.symbol})` : formData.currency
                            })()
                          : "Select currency..."}
                        <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[380px] p-0 rounded-xl border-border shadow-lg z-50">
                      <Command>
                        <CommandInput placeholder="Search currency by code or name..." />
                        <CommandEmpty>No currency found.</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-auto custom-scrollbar">
                          {CURRENCIES.map((currency) => (
                            <CommandItem
                              key={currency.code}
                              value={`${currency.code} ${currency.name}`}
                              onSelect={() => {
                                handleChange('currency', currency.code)
                                setCurrencyOpen(false)
                              }}
                              className="cursor-pointer"
                            >
                              <CheckIcon
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.currency === currency.code ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {currency.code} - {currency.name} <span className="ml-auto text-muted-foreground">{currency.symbol}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </section>

            {/* Section B: Contact Information */}
            <section>
              <h3 className="text-lg font-bold text-foreground mb-6 pb-3 border-b border-border flex items-center">
                <span className="bg-emerald-100 text-emerald-700 h-6 w-6 rounded-full flex items-center justify-center text-xs mr-3">B</span>
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-foreground font-semibold">Contact Person</Label>
                  <Input
                    placeholder="Primary contact name"
                    value={formData.contactPerson}
                    onChange={e => handleChange('contactPerson', e.target.value)}
                    disabled={submitting}
                    className="h-11 rounded-xl border-border focus-visible:ring-blue-500 shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground font-semibold">Email Address</Label>
                  <Input
                    type="email"
                    placeholder="vendor@example.com"
                    value={formData.email}
                    onChange={e => handleChange('email', e.target.value)}
                    disabled={submitting}
                    className="h-11 rounded-xl border-border focus-visible:ring-blue-500 shadow-sm"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-foreground font-semibold">Phone Number</Label>
                  <div className="flex gap-2 max-w-md">
                    <Input
                      placeholder="+971"
                      value={formData.countryCode}
                      onChange={e => handleChange('countryCode', e.target.value)}
                      disabled={submitting}
                      className="w-[100px] h-11 rounded-xl border-border focus-visible:ring-blue-500 shadow-sm bg-muted text-center font-medium"
                    />
                    <Input
                      type="tel"
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChange={e => handleChange('phone', e.target.value)}
                      disabled={submitting}
                      className="flex-1 h-11 rounded-xl border-border focus-visible:ring-blue-500 shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Section C: Tax & Financial Information */}
            <section>
              <h3 className="text-lg font-bold text-foreground mb-6 pb-3 border-b border-border flex items-center">
                <span className="bg-amber-100 text-amber-700 h-6 w-6 rounded-full flex items-center justify-center text-xs mr-3">C</span>
                Tax & Financial Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-foreground font-semibold">{taxLabel}</Label>
                  <Input
                    placeholder={`Enter ${taxLabel}`}
                    value={formData.taxRegistrationNumber}
                    onChange={e => handleChange('taxRegistrationNumber', e.target.value)}
                    disabled={submitting}
                    className="h-11 rounded-xl border-border focus-visible:ring-blue-500 shadow-sm uppercase placeholder:normal-case"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground font-semibold">Payment Terms</Label>
                  <Select disabled={submitting} value={formData.paymentTerms} onValueChange={v => handleChange('paymentTerms', v)}>
                    <SelectTrigger className="h-11 rounded-xl border-border focus-visible:ring-blue-500 shadow-sm bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border shadow-lg">
                      <SelectItem value="Immediate">Immediate</SelectItem>
                      <SelectItem value="15 Days">15 Days</SelectItem>
                      <SelectItem value="30 Days">30 Days</SelectItem>
                      <SelectItem value="45 Days">45 Days</SelectItem>
                      <SelectItem value="60 Days">60 Days</SelectItem>
                      <SelectItem value="90 Days">90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground font-semibold">Opening Balance</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{formData.currency}</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.openingBalance}
                      onChange={e => handleChange('openingBalance', e.target.value)}
                      disabled={submitting}
                      className="pl-14 h-11 rounded-xl border-border focus-visible:ring-blue-500 shadow-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground font-semibold">Credit Limit (Optional)</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{formData.currency}</span>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Unlimited"
                      value={formData.creditLimit}
                      onChange={e => handleChange('creditLimit', e.target.value)}
                      disabled={submitting}
                      className="pl-14 h-11 rounded-xl border-border focus-visible:ring-blue-500 shadow-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2 flex items-center pt-2">
                  <div className="flex items-center space-x-3 bg-muted px-5 py-3 rounded-xl border border-border w-full">
                    <Checkbox 
                      id="preferred" 
                      checked={formData.preferredVendor} 
                      onCheckedChange={(c) => handleChange('preferredVendor', !!c)}
                      disabled={submitting}
                      className="h-5 w-5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <label htmlFor="preferred" className="text-[15px] font-semibold text-foreground cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Mark as Preferred Vendor
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground font-semibold">Status</Label>
                  <Select disabled={submitting} value={formData.status} onValueChange={v => handleChange('status', v)}>
                    <SelectTrigger className="h-11 rounded-xl border-border focus-visible:ring-blue-500 shadow-sm bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border shadow-lg">
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Section D: Additional Information */}
            <section>
              <h3 className="text-lg font-bold text-foreground mb-6 pb-3 border-b border-border flex items-center">
                <span className="bg-purple-100 text-purple-700 h-6 w-6 rounded-full flex items-center justify-center text-xs mr-3">D</span>
                Additional Information
              </h3>
              <div className="space-y-2">
                <Label className="text-foreground font-semibold">Internal Notes</Label>
                <Textarea
                  placeholder="Add any internal remarks or notes..."
                  value={formData.notes}
                  onChange={e => handleChange('notes', e.target.value)}
                  disabled={submitting}
                  className="min-h-[120px] rounded-xl border-border focus-visible:ring-blue-500 shadow-sm resize-none text-[15px]"
                />
              </div>
            </section>

          </div>
          
          <div className="p-6 border-t border-border flex justify-end gap-3 bg-muted/90 sticky bottom-0 z-20 backdrop-blur-md rounded-b-2xl shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.05)]">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(`/dashboard/${businessId}/vendors`)} 
              disabled={submitting} 
              className="h-11 px-8 rounded-xl border-border font-semibold hover:bg-card text-[15px]"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitting} 
              className="h-11 px-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 shadow-sm transition-all text-[15px]"
            >
              {submitting && <Loader2Icon className="size-4 animate-spin" />}
              {submitting ? (isEditing ? 'Saving...' : 'Creating Vendor...') : (isEditing ? 'Save Changes' : 'Create Vendor')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
