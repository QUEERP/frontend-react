import React, { useState, useEffect } from 'react'
import {  useNavigate, useParams  } from 'react-router-dom';
import { leadsAPI, CreateLeadData } from '@/lib/api/leads'
import { usersAPI, BusinessUser } from '@/lib/api/users'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { CURRENCIES, getCurrencyByCountry, getCurrencySymbol } from '@/lib/currencies'
import { COUNTRIES } from '@/lib/countries'

export default function AddLeadPage() {
  const routerParams = useParams() as any;
  const { businessId } = routerParams;

  const navigate = useNavigate()
  const params = useParams()
  const { business } = useBusinessData()
  
  const [formData, setFormData] = useState<CreateLeadData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    website: '',
    position: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    status: 'NEW',
    source: 'WEBSITE',
    assignedTo: '',
    tags: [],
    leadValue: 0,
    description: '',
    isPublic: true,
    contactedToday: false,
    defaultLanguage: 'English',
  })
  const [tagsInput, setTagsInput] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [businessUsers, setBusinessUsers] = useState<BusinessUser[]>([])

  useEffect(() => {
    if (!businessId) return
    usersAPI.getBusinessUsers(businessId)
      .then(res => setBusinessUsers(res.users || res.data || []))
      .catch(() => { })
  }, [businessId])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email) {
      toast.error('Name and email are required')
      return
    }

    // Convert tags input to array
    const submissionData = {
      ...formData,
      tags: tagsInput ? tagsInput.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [],
    }

    setFormLoading(true)
    try {
      const response = await leadsAPI.createLead(businessId, submissionData)
      if (response.success) {
        toast.success('Lead created successfully')
        navigate(`/dashboard/${businessId}/leads`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create lead')
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full flex-col gap-6 bg-[#f8fafc] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(`/dashboard/${businessId}/leads`)}
          className="h-10 w-10 cursor-pointer bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm transition-all rounded-xl"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Add New Lead</h1>
          <p className="text-sm text-slate-500 mt-0.5">Create a new lead to track in your pipeline</p>
        </div>
      </div>

      {/* Form Container */}
      <div className="w-full max-w-5xl mx-auto">
        <Card className="border-slate-200 bg-white shadow-sm overflow-hidden rounded-xl">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-5 pt-6 px-8">
            <CardTitle className="text-xl font-bold text-slate-800">Lead Details</CardTitle>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-10">

              {/* Section 1: Contact Information */}
              <div>
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-5 pb-2 border-b border-slate-100">Contact Information</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-700 font-medium">Full Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. John Doe"
                      className="border-slate-200 focus-visible:ring-blue-500 shadow-sm h-10 rounded-lg"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700 font-medium">Email Address <span className="text-red-500">*</span></Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g. john@company.com"
                      className="border-slate-200 focus-visible:ring-blue-500 shadow-sm h-10 rounded-lg"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-700 font-medium">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="e.g. +1 234 567 8900"
                      className="border-slate-200 focus-visible:ring-blue-500 shadow-sm h-10 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Company Details */}
              <div>
                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-5 pb-2 border-b border-slate-100">Company & Role</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-slate-700 font-medium">Company Name</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="e.g. Acme Corp"
                      className="border-slate-200 focus-visible:ring-blue-500 shadow-sm h-10 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position" className="text-slate-700 font-medium">Job Title</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      placeholder="e.g. CEO, Marketing Manager"
                      className="border-slate-200 focus-visible:ring-blue-500 shadow-sm h-10 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-slate-700 font-medium">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="e.g. https://acmecorp.com"
                      className="border-slate-200 focus-visible:ring-blue-500 shadow-sm h-10 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Location */}
              <div>
                <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-5 pb-2 border-b border-slate-100">Location</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-slate-700 font-medium">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="City"
                      className="border-slate-200 focus-visible:ring-blue-500 shadow-sm h-10 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-slate-700 font-medium">State / Province</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="State"
                      className="border-slate-200 focus-visible:ring-blue-500 shadow-sm h-10 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-slate-700 font-medium">Country</Label>
                    <Select 
                      value={formData.country} 
                      onValueChange={(value) => {
                        setFormData(prev => {
                          const updates: any = { country: value };
                          const newCurrency = getCurrencyByCountry(value);
                          if (newCurrency) updates.currency = newCurrency;
                          return { ...prev, ...updates };
                        });
                      }}
                    >
                      <SelectTrigger id="country" className="border-slate-200 focus:ring-blue-500 h-10 rounded-lg shadow-sm w-full">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-lg max-h-[300px]">
                        {COUNTRIES.map(country => (
                          <SelectItem key={country} value={country} className="py-2 focus:bg-blue-50">
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode" className="text-slate-700 font-medium">Zip Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                      placeholder="Zip Code"
                      className="border-slate-200 focus-visible:ring-blue-500 shadow-sm h-10 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Pipeline Details */}
              <div>
                <h3 className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-5 pb-2 border-b border-slate-100">Pipeline Details</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-slate-700 font-medium">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger className="w-full border-slate-200 focus:ring-blue-500 h-10 rounded-lg shadow-sm">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                        <SelectItem value="NEW" className="py-2 focus:bg-blue-50">New</SelectItem>
                        <SelectItem value="CONTACTED" className="py-2 focus:bg-blue-50">Contacted</SelectItem>
                        <SelectItem value="QUALIFIED" className="py-2 focus:bg-blue-50">Qualified</SelectItem>
                        <SelectItem value="PROPOSAL" className="py-2 focus:bg-blue-50">Proposal</SelectItem>
                        <SelectItem value="NEGOTIATION" className="py-2 focus:bg-blue-50">Negotiation</SelectItem>
                        <SelectItem value="CONVERTED" className="py-2 focus:bg-emerald-50 text-emerald-700 font-medium">Converted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="source" className="text-slate-700 font-medium">Lead Source</Label>
                    <Select
                      value={formData.source}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, source: value }))}
                    >
                      <SelectTrigger className="w-full border-slate-200 focus:ring-blue-500 h-10 rounded-lg shadow-sm">
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                        <SelectItem value="WEBSITE" className="py-2 focus:bg-blue-50">Website</SelectItem>
                        <SelectItem value="REFERRAL" className="py-2 focus:bg-blue-50">Referral</SelectItem>
                        <SelectItem value="SOCIAL_MEDIA" className="py-2 focus:bg-blue-50">Social Media</SelectItem>
                        <SelectItem value="EMAIL" className="py-2 focus:bg-blue-50">Email</SelectItem>
                        <SelectItem value="PHONE" className="py-2 focus:bg-blue-50">Phone</SelectItem>
                        <SelectItem value="EVENT" className="py-2 focus:bg-blue-50">Event</SelectItem>
                        <SelectItem value="OTHER" className="py-2 focus:bg-blue-50">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="leadValue" className="text-slate-700 font-medium">Estimated Value ({getCurrencySymbol(formData.currency)})</Label>
                    <Input
                      id="leadValue"
                      type="number"
                      value={formData.leadValue}
                      onChange={(e) => setFormData(prev => ({ ...prev, leadValue: Number(e.target.value) }))}
                      placeholder="e.g. 50000"
                      className="border-slate-200 focus-visible:ring-blue-500 shadow-sm h-10 rounded-lg font-semibold text-emerald-700"
                    />
                  </div>

                  {business?.businessType === 'Trading' && (
                    <div className="space-y-2">
                      <Label htmlFor="currency" className="text-slate-700 font-medium">Currency</Label>
                      <Select
                        value={formData.currency || ''}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                      >
                        <SelectTrigger id="currency" className="w-full border-slate-200 focus:ring-blue-500 h-10 rounded-lg shadow-sm">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200 shadow-lg max-h-[300px]">
                          {CURRENCIES.map(curr => (
                            <SelectItem key={curr.code} value={curr.code} className="py-2 focus:bg-blue-50">
                              {curr.flag} {curr.code} - {curr.name} ({curr.symbol})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 5: Internal Settings */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-5 pb-2 border-b border-slate-100">Additional Settings</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="assignedTo" className="text-slate-700 font-medium">Assigned To</Label>
                    <Select
                      value={formData.assignedTo || ''}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, assignedTo: value }))}
                    >
                      <SelectTrigger id="assignedTo" className="w-full border-slate-200 focus:ring-blue-500 h-10 rounded-lg shadow-sm">
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                      <SelectContent className=" rounded-xl border-slate-200 shadow-lg">
                        <SelectItem value="unassigned" className="py-2 text-slate-500 italic">— Unassigned —</SelectItem>
                        {businessUsers.map(bu => (
                          <SelectItem key={bu.id} value={bu.id} className="py-2 focus:bg-blue-50">
                            {bu.user?.name || bu.user?.email || bu.id}
                            {bu.role?.name ? ` (${bu.role.name})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="defaultLanguage" className="text-slate-700 font-medium">Preferred Language</Label>
                    <Select
                      value={formData.defaultLanguage}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, defaultLanguage: value }))}
                    >
                      <SelectTrigger className="w-full border-slate-200 focus:ring-blue-500 h-10 rounded-lg shadow-sm">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                        <SelectItem value="English" className="py-2 focus:bg-blue-50">English</SelectItem>
                        <SelectItem value="Spanish" className="py-2 focus:bg-blue-50">Spanish</SelectItem>
                        <SelectItem value="French" className="py-2 focus:bg-blue-50">French</SelectItem>
                        <SelectItem value="German" className="py-2 focus:bg-blue-50">German</SelectItem>
                        <SelectItem value="Hindi" className="py-2 focus:bg-blue-50">Hindi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <Label htmlFor="tags" className="text-slate-700 font-medium">Tags</Label>
                  <Input
                    id="tags"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="e.g. VIP, Important, Newsletter"
                    className="border-slate-200 focus-visible:ring-blue-500 shadow-sm h-10 rounded-lg"
                  />
                  <p className="text-xs text-slate-500">Separate multiple tags with commas.</p>
                </div>

                <div className="mt-6 space-y-2">
                  <Label htmlFor="description" className="text-slate-700 font-medium">Description / Notes</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Add any additional notes about this lead here..."
                    rows={4}
                    className="border-slate-200 focus-visible:ring-blue-500 shadow-sm rounded-lg resize-y"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-col sm:flex-row gap-8 pt-2 pb-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 bg-white checked:border-blue-600 checked:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all"
                    />
                    <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.2071 4.79289C12.5976 5.18342 12.5976 5.81658 12.2071 6.20711L7.20711 11.2071C6.81658 11.5976 6.18342 11.5976 5.79289 11.2071L3.79289 9.20711C3.40237 8.81658 3.40237 8.18342 3.79289 7.79289C4.18342 7.40237 4.81658 7.40237 5.20711 7.79289L6.5 9.08579L10.7929 4.79289C11.1834 4.40237 11.8166 4.40237 12.2071 4.79289Z" fill="currentColor" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-800 group-hover:text-slate-900 transition-colors">Public Lead</span>
                    <span className="text-xs text-slate-500">Visible to all team members</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      id="contactedToday"
                      checked={formData.contactedToday}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactedToday: e.target.checked }))}
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 bg-white checked:border-blue-600 checked:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all"
                    />
                    <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.2071 4.79289C12.5976 5.18342 12.5976 5.81658 12.2071 6.20711L7.20711 11.2071C6.81658 11.5976 6.18342 11.5976 5.79289 11.2071L3.79289 9.20711C3.40237 8.81658 3.40237 8.18342 3.79289 7.79289C4.18342 7.40237 4.81658 7.40237 5.20711 7.79289L6.5 9.08579L10.7929 4.79289C11.1834 4.40237 11.8166 4.40237 12.2071 4.79289Z" fill="currentColor" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-800 group-hover:text-slate-900 transition-colors">Contacted Today</span>
                    <span className="text-xs text-slate-500">Mark as interacted with recently</span>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/dashboard/${businessId}/leads`)}
                  disabled={formLoading}
                  className="w-full cursor-pointer sm:w-auto order-2 sm:order-1 h-11 px-8 border-slate-200 text-slate-600 hover:bg-slate-50 font-medium rounded-lg shadow-sm"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={formLoading}
                  className="w-full cursor-pointer sm:w-auto order-1 sm:order-2 h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors border-none ml-auto"
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Lead...
                    </>
                  ) : (
                    'Create Lead'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
