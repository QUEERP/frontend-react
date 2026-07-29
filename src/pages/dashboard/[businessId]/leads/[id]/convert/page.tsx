import React, { useState, useEffect } from 'react'
import {  useNavigate, useParams  } from 'react-router-dom';
import { leadsAPI, Lead } from '@/lib/api/leads'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2, Award, Sparkles, MapPinIcon, HashIcon } from 'lucide-react'
import { toast } from 'sonner'
import { ALL_REGIONS, getRegionDisplayLabel } from '@/components/dashboard/regions'

function getDefaultCurrencyForRegion(region: string) {
  switch (region) {
    case 'INDIA': return 'INR'
    case 'UNITED_ARAB_EMIRATES':
    case 'UAE': return 'AED'
    case 'UNITED_STATES': return 'USD'
    case 'UNITED_KINGDOM': return 'GBP'
    case 'AUSTRALIA': return 'AUD'
    case 'CANADA': return 'CAD'
    case 'SINGAPORE': return 'SGD'
    case 'SAUDI_ARABIA': return 'SAR'
    case 'QATAR': return 'QAR'
    case 'GERMANY':
    case 'FRANCE':
    case 'ITALY':
    case 'SPAIN':
    case 'NETHERLANDS':
    case 'BELGIUM':
    case 'AUSTRIA':
    case 'GREECE':
    case 'PORTUGAL':
    case 'IRELAND':
    case 'FINLAND': return 'EUR'
    default: return 'SYSTEM'
  }
}

export default function ConvertLeadToCustomerPage() {
  const navigate = useNavigate()
  const { id, businessId } = useParams()
  const leadId = id as string
  
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    company: '',
    region: '',
    vatNumber: '',
    phone: '',
    website: '',
    group: 'General',
    currency: 'SYSTEM',
    defaultLanguage: 'SYSTEM',
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
    
    // Deal integration
    createDeal: false,
    dealName: '',
    dealStage: '1', // New/Qualification
    dealAmount: '',
    expectedCloseDate: '',
  })

  // Pre-populate form with lead details
  useEffect(() => {
    const fetchLead = async () => {
      try {
        setLoading(true)
        const response = await leadsAPI.getLeadDetails(businessId, leadId)
        if (response.success) {
          const leadData = response.data
          setLead(leadData)
          
          setFormData(prev => ({
            ...prev,
            company: leadData.company || leadData.name || '',
            phone: leadData.phone || '',
            dealName: leadData.company ? `${leadData.company} - Initial Deal` : `${leadData.name} - Initial Deal`,
            expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // default 30 days
          }))
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to fetch lead')
        navigate(`/dashboard/${businessId}/leads`)
      } finally {
        setLoading(false)
      }
    }

    fetchLead()
  }, [businessId, leadId, navigate])

  const handleRegionChange = (val: string) => {
    handleInputChange('region', val)
    const cur = getDefaultCurrencyForRegion(val)
    if (cur !== 'SYSTEM') {
      handleInputChange('currency', cur)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.company.trim()) {
      toast.error('Company name is required')
      return
    }

    if (!formData.region) {
      toast.error('Region (Tax jurisdiction) is required')
      return
    }

    setFormLoading(true)
    
    // Format payload for backend conversion API
    const payload = {
      company: formData.company,
      region: formData.region,
      vatNumber: formData.vatNumber || undefined,
      phone: formData.phone || undefined,
      website: formData.website || undefined,
      group: formData.group || undefined,
      currency: formData.currency || undefined,
      defaultLanguage: formData.defaultLanguage || undefined,
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
      
      // Deal Creation Options
      createDeal: formData.createDeal,
      dealName: formData.createDeal ? formData.dealName : undefined,
      dealStage: formData.createDeal ? formData.dealStage : undefined,
      dealAmount: formData.createDeal ? parseFloat(formData.dealAmount) || 0 : undefined,
      expectedCloseDate: formData.createDeal ? formData.expectedCloseDate : undefined,
    }

    try {
      const response = await leadsAPI.convertToCustomer(businessId, leadId, payload)
      
      if (response.success) {
        toast.success('Lead converted to Customer successfully!')
        navigate(`/dashboard/${businessId}/customers`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to convert lead')
    } finally {
      setFormLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl px-4 sm:px-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate(`/dashboard/${businessId}/leads/${leadId}`)}
            className="mb-2 pl-0 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Lead details
          </Button>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            Convert Lead <Sparkles className="h-5 w-5 text-amber-500" />
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate a full ERP Account/Customer Profile and initiate sales opportunities for <strong>{lead?.name}</strong>.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECTION 1: Tax Residency & Basic Customer Profile */}
        <Card className="shadow-sm border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle>Customer ERP Account Setup</CardTitle>
            <CardDescription>Configure primary company context and tax residency mapping.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company" className="font-semibold">
                  Company / Organization Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder="e.g. Acme Corp"
                  disabled={formLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region" className="font-semibold flex items-center gap-1">
                  <MapPinIcon className="size-4" />
                  Region <span className="text-red-500">*</span>
                </Label>
                <select
                  id="region"
                  value={formData.region}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select region</option>
                  {ALL_REGIONS.map(r => (
                    <option key={r} value={r}>{getRegionDisplayLabel(r)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vatNumber" className="font-semibold flex items-center gap-1">
                  <HashIcon className="size-4" />
                  {formData.region === 'INDIA' ? 'GST Number' : formData.region === 'UNITED_ARAB_EMIRATES' || formData.region === 'UAE' ? 'VAT Number' : 'Tax Number'}
                </Label>
                <Input
                  id="vatNumber"
                  value={formData.vatNumber}
                  onChange={(e) => handleInputChange('vatNumber', e.target.value)}
                  placeholder={formData.region === 'INDIA' ? 'Enter GST Number' : formData.region === 'UNITED_ARAB_EMIRATES' || formData.region === 'UAE' ? 'Enter VAT Number' : 'Enter Tax Number'}
                  disabled={formLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Company Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+91..."
                  disabled={formLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://example.com"
                  disabled={formLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="group">Customer Group</Label>
                <Input
                  id="group"
                  value={formData.group}
                  onChange={(e) => handleInputChange('group', e.target.value)}
                  placeholder="e.g. Retail, Wholesale"
                  disabled={formLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Default Currency</Label>
                <Input
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  placeholder="INR / AED / USD"
                  disabled={formLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultLanguage">Language preference</Label>
                <Input
                  id="defaultLanguage"
                  value={formData.defaultLanguage}
                  onChange={(e) => handleInputChange('defaultLanguage', e.target.value)}
                  placeholder="e.g. English, Hindi"
                  disabled={formLoading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: Deal Integration (Phase 4 conversion feature) */}
        <Card className="shadow-sm border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500 animate-pulse" />
                Deal Integration
              </CardTitle>
              <CardDescription>Automatically register a sales opportunity and estimate conversion values.</CardDescription>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="createDeal" 
                checked={formData.createDeal}
                onCheckedChange={(checked) => handleInputChange('createDeal', !!checked)}
              />
              <Label htmlFor="createDeal" className="font-semibold cursor-pointer">Launch Deal Opportunity</Label>
            </div>
          </CardHeader>
          {formData.createDeal && (
            <CardContent className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dealName">Deal Title <span className="text-red-500">*</span></Label>
                  <Input
                    id="dealName"
                    value={formData.dealName}
                    onChange={(e) => handleInputChange('dealName', e.target.value)}
                    placeholder="Enter opportunity name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dealStage">Deal Stage <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.dealStage}
                    onValueChange={(val) => handleInputChange('dealStage', val)}
                  >
                    <SelectTrigger id="dealStage">
                      <SelectValue placeholder="Pipeline Stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">New / Qualified Opportunity</SelectItem>
                      <SelectItem value="2">Initial Proposal Drafted</SelectItem>
                      <SelectItem value="3">Active Negotiation / Contract Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dealAmount">Deal Value Amount (Estimated)</Label>
                  <Input
                    id="dealAmount"
                    type="number"
                    value={formData.dealAmount}
                    onChange={(e) => handleInputChange('dealAmount', e.target.value)}
                    placeholder="e.g. 50000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedCloseDate">Target Closing Date</Label>
                  <Input
                    id="expectedCloseDate"
                    type="date"
                    value={formData.expectedCloseDate}
                    onChange={(e) => handleInputChange('expectedCloseDate', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* SECTION 3: Standard Customer Address */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Business Headquarters Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Suite, Building, Street Info"
                disabled={formLoading}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="City"
                  disabled={formLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="State"
                  disabled={formLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  placeholder="Zip"
                  disabled={formLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="Country"
                  disabled={formLoading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ACTION PANEL */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/dashboard/${businessId}/leads/${leadId}`)}
            disabled={formLoading}
            className="sm:w-32"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={formLoading} 
            className="sm:w-64"
          >
            {formLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Executing Conversion Engine...
              </>
            ) : (
              'Confirm Lead Conversion'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
