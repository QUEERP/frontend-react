import { toast } from 'sonner';
import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom';
import {  useNavigate  } from 'react-router-dom';
import {
  ArrowLeftIcon,
  Building2Icon,
  UserIcon,
  SaveIcon,
  XIcon,
  CopyIcon,
  GlobeIcon,
  HashIcon,
  PhoneIcon,
  MapPinIcon,
  CreditCardIcon,
  LanguagesIcon,
  BellIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DashboardModeToggle } from '@/components/dashboard/mode-toggle'
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
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { UserMenu } from './user-menu'
import { CurrencySelect } from '@/components/dashboard/currency-select'
import { ALL_REGIONS, getRegionDisplayLabel } from './regions'

export function AddCustomerClient({ businessId }: { businessId: string }) {
  const [businessName, setBusinessName] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const navigate = useNavigate()
  const { toast } = useToast()
  const { business, refresh } = useBusinessData()

  const API_BASE = import.meta.env.VITE_API_BASE || ''
  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\]\\^])/g, '\\$1') + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : ''
  }

  // Form state with all required fields
  const [formData, setFormData] = useState({
    // Customer Basic Details
    company: '',
    region: '',
    vatNumber: '',
    phone: '',
    website: '',
    group: '',
    currency: '',
    defaultLanguage: 'SYSTEM',

    // Upgraded CRM Account fields
    industry: '',
    annualRevenue: '',
    employeeCount: '',
    linkedinUrl: '',
    tags: '',
    parentAccountId: '',

    // Main Address
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',

    // Billing Address
    billingStreet: '',
    billingCity: '',
    billingState: '',
    billingZipCode: '',
    billingCountry: '',
    sameAsMainAddress: false,

    // Shipping Address
    shippingStreet: '',
    shippingCity: '',
    shippingState: '',
    shippingZipCode: '',
    shippingCountry: '',
    sameAsBillingAddress: false,
  })

  useEffect(() => {
    const storedName = window.localStorage.getItem('businessName')
    if (storedName) {
      setBusinessName(storedName)
    }
  }, [])

  useEffect(() => {
    if (business?.businessType?.toLowerCase() === 'construction') {
      setFormData(prev => ({
        ...prev,
        region: prev.region || 'CANADA',
        currency: prev.currency || 'CAD',
      }))
    }
  }, [business?.businessType])

  const displayName = useMemo(() => {
    if (businessName && businessName.trim().length > 0) {
      return businessName
    }
    if (!businessId) {
      return 'Your Business'
    }
    return `Business ${businessId.slice(0, 6).toUpperCase()}`
  }, [businessName, businessId])

  // Handle checkbox changes for address auto-fill
  const handleSameAsMainAddressChange = (checked: boolean) => {
    setFormData(prev => {
      if (checked) {
        return {
          ...prev,
          sameAsMainAddress: true,
          billingStreet: prev.address,
          billingCity: prev.city,
          billingState: prev.state,
          billingZipCode: prev.zipCode,
          billingCountry: prev.country,
        }
      } else {
        return {
          ...prev,
          sameAsMainAddress: false,
          billingStreet: '',
          billingCity: '',
          billingState: '',
          billingZipCode: '',
          billingCountry: '',
        }
      }
    })
  }

  const handleSameAsBillingAddressChange = (checked: boolean) => {
    setFormData(prev => {
      if (checked) {
        return {
          ...prev,
          sameAsBillingAddress: true,
          shippingStreet: prev.billingStreet,
          shippingCity: prev.billingCity,
          shippingState: prev.billingState,
          shippingZipCode: prev.billingZipCode,
          shippingCountry: prev.billingCountry,
        }
      } else {
        return {
          ...prev,
          sameAsBillingAddress: false,
          shippingStreet: '',
          shippingCity: '',
          shippingState: '',
          shippingZipCode: '',
          shippingCountry: '',
        }
      }
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.company) {
      toast({
        title: "Validation Error",
        description: "Company name is required.",
        variant: "destructive",
      })
      return
    }

    if (!formData.region) {
      toast({
        title: "Validation Error",
        description: "Region is required.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setSaveStatus('saving')

    // Simulate API call
    try {
      const token = getCookie('token')
      const requestBody = {
        company: formData.company,
        region: formData.region,
        vatNumber: formData.vatNumber || undefined,
        phone: formData.phone || undefined,
        website: formData.website || undefined,
        group: formData.group || undefined,
        currency: formData.currency,
        defaultLanguage: formData.defaultLanguage,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zipCode: formData.zipCode || undefined,
        country: formData.country || undefined,
        billingStreet: formData.billingStreet || undefined,
        billingCity: formData.billingCity || undefined,
        billingState: formData.billingState || undefined,
        billingZipCode: formData.billingZipCode || undefined,
        billingCountry: formData.billingCountry || undefined,
        shippingStreet: formData.shippingStreet || undefined,
        shippingCity: formData.shippingCity || undefined,
        shippingState: formData.shippingState || undefined,
        shippingZipCode: formData.shippingZipCode || undefined,
        shippingCountry: formData.shippingCountry || undefined,

        // Upgraded CRM Account fields
        industry: formData.industry || undefined,
        annualRevenue: formData.annualRevenue ? parseFloat(formData.annualRevenue) : undefined,
        employeeCount: formData.employeeCount ? parseInt(formData.employeeCount) : undefined,
        linkedinUrl: formData.linkedinUrl || undefined,
        tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : undefined,
        parentAccountId: formData.parentAccountId || undefined,
      }

      const res = await fetch(`${API_BASE}/api/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-business-id': businessId,
        },
        body: JSON.stringify(requestBody),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to create customer')
      }
    } catch (err: any) {
      setSaveStatus('idle')
      setIsSubmitting(false)
      toast({
        title: "Failed to create customer",
        description: err?.message || 'Unknown error',
        variant: "destructive",
      })
      return
    }

    setSaveStatus('saved')

    toast({
      title: "Customer created successfully",
      description: `${formData.company} has been added to ${displayName}.`,
    })

    // Refresh context and redirect back to customers page after successful save
    try {
      await refresh()
    } catch { }
    setTimeout(() => {
      navigate(`/dashboard/${businessId}/customers`)
    }, 2000)
  }

  const handleCancel = () => {
    navigate(`/dashboard/${businessId}/customers`)
  }

  return (
    <div className="grid min-h-svh grid-cols-1 content-start gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div className="flex items-center gap-4">
          <Link to={`/dashboard/${businessId}/customers`}>
            <Button variant="ghost" size="icon" className="h-10 w-10 cursor-pointer bg-card shadow-sm border border-border rounded-xl hover:bg-muted">
              <ArrowLeftIcon className="h-4 w-4 text-muted-foreground" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Add New Customer</h1>
            <p className="text-sm text-muted-foreground mt-1">Create a new customer profile and CRM account</p>
          </div>
        </div>
      </div>

      {/* Form content */}
      <Card className="border-border shadow-sm rounded-2xl bg-card overflow-hidden max-w-5xl mx-auto w-full">
        <CardHeader className="bg-muted/50 border-b border-border pb-6 pt-8 px-6 sm:px-8">
          <CardTitle className="text-xl font-bold text-foreground">Customer Details</CardTitle>
          <CardDescription className="text-sm font-medium text-muted-foreground mt-1">
            Fill in the essential, CRM, and billing information for your new customer.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-10">

            {/* 1. Customer Basic Details Section */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">Core Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-sm font-semibold text-foreground flex items-center gap-1">
                    Company <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="company"
                    placeholder="Enter company name"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    required
                    className="rounded-xl border-border bg-muted/50 h-11 shadow-sm focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region" className="text-sm font-semibold text-foreground flex items-center gap-1">
                    <MapPinIcon className="size-4" />
                    Region <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="region"
                    value={formData.region}
                    onChange={(e) => {
                      console.log('Region select changed to:', e.target.value);
                      handleInputChange('region', e.target.value);
                    }}
                    required
                    className="flex h-11 w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select region</option>
                    {ALL_REGIONS.map(r => (
                      <option key={r} value={r}>{getRegionDisplayLabel(r)}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vatNumber" className="text-sm font-semibold text-foreground flex items-center gap-1">
                    <HashIcon className="size-4" />
                    {formData.region === 'INDIA' ? 'GST Number' : (formData.region === 'UAE' || formData.region === 'UNITED_ARAB_EMIRATES') ? 'VAT Number' : 'TAX Number'}
                  </Label>
                  <Input
                    id="vatNumber"
                    placeholder={formData.region === 'INDIA' ? 'Enter GST number' : (formData.region === 'UAE' || formData.region === 'UNITED_ARAB_EMIRATES') ? 'Enter VAT number' : 'Enter TAX number'}
                    value={formData.vatNumber}
                    onChange={(e) => handleInputChange('vatNumber', e.target.value)}
                    className="rounded-xl border-border bg-muted/50 h-11 shadow-sm focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold text-foreground flex items-center gap-1">
                    <PhoneIcon className="size-4" />
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    placeholder="+971 4 123 4567"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="rounded-xl border-border bg-muted/50 h-11 shadow-sm focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="text-sm font-semibold text-foreground flex items-center gap-1">
                    <GlobeIcon className="size-4" />
                    Website
                  </Label>
                  <Input
                    id="website"
                    placeholder="https://example.com"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="rounded-xl border-border bg-muted/50 h-11 shadow-sm focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group" className="text-sm font-semibold text-foreground">
                    Group
                  </Label>
                  <Input
                    id="group"
                    placeholder="Enter customer group"
                    value={formData.group}
                    onChange={(e) => handleInputChange('group', e.target.value)}
                    className="rounded-xl border-border bg-muted/50 h-11 shadow-sm focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-sm font-semibold text-foreground flex items-center gap-1">
                    <CreditCardIcon className="size-4" />
                    Currency
                  </Label>
                  <CurrencySelect
                    value={formData.currency && formData.currency !== 'SYSTEM' ? formData.currency : ''}
                    onValueChange={(value) => handleInputChange('currency', value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultLanguage" className="text-sm font-semibold text-foreground flex items-center gap-1">
                    <LanguagesIcon className="size-4" />
                    Default Language
                  </Label>
                  <Select value={formData.defaultLanguage} onValueChange={(value) => handleInputChange('defaultLanguage', value)}>
                    <SelectTrigger className="w-full rounded-xl border-border bg-muted/50 h-11 shadow-sm focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border shadow-lg">
                      <SelectItem value="SYSTEM" className="cursor-pointer focus:bg-muted font-medium">SYSTEM (Default)</SelectItem>
                      <SelectItem value="en" className="cursor-pointer focus:bg-muted">English</SelectItem>
                      <SelectItem value="ar" className="cursor-pointer focus:bg-muted">العربية (Arabic)</SelectItem>
                      <SelectItem value="fr" className="cursor-pointer focus:bg-muted">Français (French)</SelectItem>
                      <SelectItem value="hi" className="cursor-pointer focus:bg-muted">हिंदी (Hindi)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* CRM Account Details Section */}
            <div className="space-y-6 pt-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">CRM Account Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="industry" className="text-sm font-semibold text-foreground">Industry</Label>
                  <select id="industry" value={formData.industry} onChange={(e) => handleInputChange('industry', e.target.value)} className="flex h-11 w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
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
                  <Label htmlFor="annualRevenue" className="text-sm font-semibold text-foreground">Annual Revenue</Label>
                  <Input id="annualRevenue" type="number" step="any" placeholder="e.g. 500000" value={formData.annualRevenue} onChange={(e) => handleInputChange('annualRevenue', e.target.value)} className="rounded-xl border-border bg-muted/50 h-11 shadow-sm focus:ring-blue-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employeeCount" className="text-sm font-semibold text-foreground">Employee Count</Label>
                  <Input id="employeeCount" type="number" placeholder="e.g. 50" value={formData.employeeCount} onChange={(e) => handleInputChange('employeeCount', e.target.value)} className="rounded-xl border-border bg-muted/50 h-11 shadow-sm focus:ring-blue-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedinUrl" className="text-sm font-semibold text-foreground">LinkedIn Profile URL</Label>
                  <Input id="linkedinUrl" placeholder="https://linkedin.com/company/..." value={formData.linkedinUrl} onChange={(e) => handleInputChange('linkedinUrl', e.target.value)} className="rounded-xl border-border bg-muted/50 h-11 shadow-sm focus:ring-blue-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentAccountId" className="text-sm font-semibold text-foreground">Parent Account</Label>
                  <select id="parentAccountId" value={formData.parentAccountId} onChange={(e) => handleInputChange('parentAccountId', e.target.value)} className="flex h-11 w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">No Parent Account (Top-level)</option>
                    {(business?.customers ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags" className="text-sm font-semibold text-foreground">Tags (comma separated)</Label>
                  <Input id="tags" placeholder="Enterprise, VIP, Partner" value={formData.tags} onChange={(e) => handleInputChange('tags', e.target.value)} className="rounded-xl border-border bg-muted/50 h-11 shadow-sm focus:ring-blue-500" />
                </div>
              </div>
            </div>

            {/* 2. Main Address Section */}
            <div className="space-y-6 pt-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">Main Address</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-semibold text-foreground">Address</Label>
                  <Input id="address" placeholder="Enter street address" value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} className="rounded-xl border-border bg-muted/50 h-11 shadow-sm focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-semibold text-foreground">City</Label>
                    <Input id="city" placeholder="Enter city" value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)} className="rounded-xl border-border bg-muted/50 h-11 shadow-sm focus:ring-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-sm font-semibold text-foreground">State</Label>
                    <Input id="state" placeholder="Enter state" value={formData.state} onChange={(e) => handleInputChange('state', e.target.value)} className="rounded-xl border-border bg-muted/50 h-11 shadow-sm focus:ring-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode" className="text-sm font-semibold text-foreground">Zip Code</Label>
                    <Input id="zipCode" placeholder="Enter zip code" value={formData.zipCode} onChange={(e) => handleInputChange('zipCode', e.target.value)} className="rounded-xl border-border bg-muted/50 h-11 shadow-sm focus:ring-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-sm font-semibold text-foreground">Country</Label>
                    <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                      <SelectTrigger className="w-full rounded-xl border-border bg-muted/50 h-11 shadow-sm focus:ring-blue-500">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border shadow-lg">
                        <SelectItem value="UAE" className="cursor-pointer focus:bg-muted">United Arab Emirates</SelectItem>
                        <SelectItem value="Saudi Arabia" className="cursor-pointer focus:bg-muted">Saudi Arabia</SelectItem>
                        <SelectItem value="Qatar" className="cursor-pointer focus:bg-muted">Qatar</SelectItem>
                        <SelectItem value="Kuwait" className="cursor-pointer focus:bg-muted">Kuwait</SelectItem>
                        <SelectItem value="Oman" className="cursor-pointer focus:bg-muted">Oman</SelectItem>
                        <SelectItem value="Bahrain" className="cursor-pointer focus:bg-muted">Bahrain</SelectItem>
                        <SelectItem value="India" className="cursor-pointer focus:bg-muted">India</SelectItem>
                        <SelectItem value="United States" className="cursor-pointer focus:bg-muted">United States</SelectItem>
                        <SelectItem value="United Kingdom" className="cursor-pointer focus:bg-muted">United Kingdom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Billing Address Section */}
            {/* 3. Billing Address Section */}
            <div className="space-y-6 pt-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">Billing Address</h3>
              <div className="flex items-center space-x-2">
                <Checkbox id="sameAsMainAddress" checked={formData.sameAsMainAddress} onCheckedChange={handleSameAsMainAddressChange} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <Label htmlFor="sameAsMainAddress" className="text-sm font-medium cursor-pointer flex items-center gap-2 text-foreground">
                  <CopyIcon className="size-4" />
                  Same as Main Address
                </Label>
              </div>

              {!formData.sameAsMainAddress && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="billingStreet" className="text-sm font-semibold text-foreground">Billing Street</Label>
                    <Input id="billingStreet" placeholder="Enter billing street address" value={formData.billingStreet} onChange={(e) => handleInputChange('billingStreet', e.target.value)} className="rounded-xl border-border bg-muted/50 h-11 shadow-sm focus:ring-blue-500" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="billingCity" className="text-sm font-semibold text-foreground">Billing City</Label>
                      <Input id="billingCity" placeholder="Enter billing city" value={formData.billingCity} onChange={(e) => handleInputChange('billingCity', e.target.value)} className="rounded-xl border-border bg-muted/50 h-11 shadow-sm focus:ring-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billingState" className="text-sm font-semibold text-foreground">Billing State</Label>
                      <Input id="billingState" placeholder="Enter billing state" value={formData.billingState} onChange={(e) => handleInputChange('billingState', e.target.value)} className="rounded-xl border-border bg-muted/50 h-11 shadow-sm focus:ring-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billingZipCode" className="text-sm font-semibold text-foreground">Billing Zip Code</Label>
                      <Input id="billingZipCode" placeholder="Enter billing zip code" value={formData.billingZipCode} onChange={(e) => handleInputChange('billingZipCode', e.target.value)} className="rounded-xl border-border bg-muted/50 h-11 shadow-sm focus:ring-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billingCountry" className="text-sm font-semibold text-foreground">Billing Country</Label>
                      <Select value={formData.billingCountry} onValueChange={(value) => handleInputChange('billingCountry', value)}>
                        <SelectTrigger className="w-full rounded-xl border-border bg-muted/50 h-11 shadow-sm focus:ring-blue-500">
                          <SelectValue placeholder="Select billing country" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border shadow-lg">
                          <SelectItem value="UAE" className="cursor-pointer focus:bg-muted">United Arab Emirates</SelectItem>
                          <SelectItem value="Saudi Arabia" className="cursor-pointer focus:bg-muted">Saudi Arabia</SelectItem>
                          <SelectItem value="Qatar" className="cursor-pointer focus:bg-muted">Qatar</SelectItem>
                          <SelectItem value="Kuwait" className="cursor-pointer focus:bg-muted">Kuwait</SelectItem>
                          <SelectItem value="Oman" className="cursor-pointer focus:bg-muted">Oman</SelectItem>
                          <SelectItem value="Bahrain" className="cursor-pointer focus:bg-muted">Bahrain</SelectItem>
                          <SelectItem value="India" className="cursor-pointer focus:bg-muted">India</SelectItem>
                          <SelectItem value="United States" className="cursor-pointer focus:bg-muted">United States</SelectItem>
                          <SelectItem value="United Kingdom" className="cursor-pointer focus:bg-muted">United Kingdom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Shipping Address Section */}
            <div className="space-y-6 pt-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">Shipping Address</h3>
              <div className="flex items-center space-x-2">
                <Checkbox id="sameAsBillingAddress" checked={formData.sameAsBillingAddress} onCheckedChange={handleSameAsBillingAddressChange} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <Label htmlFor="sameAsBillingAddress" className="text-sm font-medium cursor-pointer flex items-center gap-2 text-foreground">
                  <CopyIcon className="size-4" />
                  Same as Billing Address
                </Label>
              </div>

              {!formData.sameAsBillingAddress && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="shippingStreet" className="text-sm font-semibold text-foreground">Shipping Street</Label>
                    <Input id="shippingStreet" placeholder="Enter shipping street address" value={formData.shippingStreet} onChange={(e) => handleInputChange('shippingStreet', e.target.value)} className="rounded-xl border-border bg-muted/50 h-11 shadow-sm focus:ring-blue-500" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="shippingCity" className="text-sm font-semibold text-foreground">Shipping City</Label>
                      <Input id="shippingCity" placeholder="Enter shipping city" value={formData.shippingCity} onChange={(e) => handleInputChange('shippingCity', e.target.value)} className="rounded-xl border-border bg-muted/50 h-11 shadow-sm focus:ring-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shippingState" className="text-sm font-semibold text-foreground">Shipping State</Label>
                      <Input id="shippingState" placeholder="Enter shipping state" value={formData.shippingState} onChange={(e) => handleInputChange('shippingState', e.target.value)} className="rounded-xl border-border bg-muted/50 h-11 shadow-sm focus:ring-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shippingZipCode" className="text-sm font-semibold text-foreground">Shipping Zip Code</Label>
                      <Input id="shippingZipCode" placeholder="Enter shipping zip code" value={formData.shippingZipCode} onChange={(e) => handleInputChange('shippingZipCode', e.target.value)} className="rounded-xl border-border bg-muted/50 h-11 shadow-sm focus:ring-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shippingCountry" className="text-sm font-semibold text-foreground">Shipping Country</Label>
                      <Select value={formData.shippingCountry} onValueChange={(value) => handleInputChange('shippingCountry', value)}>
                        <SelectTrigger className="w-full rounded-xl border-border bg-muted/50 h-11 shadow-sm focus:ring-blue-500">
                          <SelectValue placeholder="Select shipping country" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border shadow-lg">
                          <SelectItem value="UAE" className="cursor-pointer focus:bg-muted">United Arab Emirates</SelectItem>
                          <SelectItem value="Saudi Arabia" className="cursor-pointer focus:bg-muted">Saudi Arabia</SelectItem>
                          <SelectItem value="Qatar" className="cursor-pointer focus:bg-muted">Qatar</SelectItem>
                          <SelectItem value="Kuwait" className="cursor-pointer focus:bg-muted">Kuwait</SelectItem>
                          <SelectItem value="Oman" className="cursor-pointer focus:bg-muted">Oman</SelectItem>
                          <SelectItem value="Bahrain" className="cursor-pointer focus:bg-muted">Bahrain</SelectItem>
                          <SelectItem value="India" className="cursor-pointer focus:bg-muted">India</SelectItem>
                          <SelectItem value="United States" className="cursor-pointer focus:bg-muted">United States</SelectItem>
                          <SelectItem value="United Kingdom" className="cursor-pointer focus:bg-muted">United Kingdom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-8 mt-8 border-t border-border">
              <div className="text-sm text-muted-foreground font-medium">
                {saveStatus === 'saved' && (
                  <span className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                    <SaveIcon className="h-4 w-4" />
                    Customer created successfully
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={handleCancel} className="h-11 cursor-pointer px-6 rounded-xl border-border text-muted-foreground hover:bg-muted hover:text-foreground font-medium">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !formData.company} className="h-11 cursor-pointer px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium gap-2">
                  <SaveIcon className="h-4 w-4" />
                  {isSubmitting ? 'Creating...' : saveStatus === 'saved' ? 'Created!' : 'Create Customer'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
