import { toast } from 'sonner';
import React, { useEffect, useMemo, useState } from 'react'
import {
  Building2Icon,
  ShieldIcon,
  CreditCardIcon,
  Settings2Icon,
  SaveIcon,
  FileTextIcon,
  PackageSearchIcon,
  ClockIcon,
  MapPinIcon,
  LockIcon,
  PlusIcon,
  Trash2Icon,
  EyeIcon,
  EyeOffIcon,
  UserCircleIcon,
  KeyRoundIcon
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { CURRENCIES } from '@/lib/currencies'


const TEMPLATES = [
  { id: 'modern', name: 'Modern Standard', image: '/templates/modern-standard.png', description: 'Clean, professional design suitable for most global businesses.' },
  { id: 'classic', name: 'Classic Minimalist', image: 'https://images.unsplash.com/photo-1603796846097-bee99e4a601f?w=400&q=80', description: 'A timeless, simple layout that uses less ink for printing.' }
]

export function SettingsPageClient({ businessId }: { businessId: string }) {
  const { business, refresh } = useBusinessData()
  const { toast } = useToast()
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null)
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' })
  const [pwdErrors, setPwdErrors] = useState({ newPassword: '', confirmPassword: '' })
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [pwdStatus, setPwdStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [profileForm, setProfileForm] = useState({ name: '' })
  const [profileStatus, setProfileStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [activeSection, setActiveSection] = useState('general')

  const [formData, setFormData] = useState<any>({
    // General
    companyName: '',
    legalName: '',
    businessType: '',
    industry: '',
    description: '',
    // Location
    country: '',
    state: '',
    city: '',
    address: '',
    pinCode: '',
    timeZone: '',
    language: 'English',
    emirate: '',
    // Tax Registration (India)
    gstNumber: '',
    pan: '',
    tan: '',
    msmeNumber: '',
    gstRegistrationType: '',
    // Tax Registration (UAE)
    vatNumber: '', // mapped to trn
    vatRegistrationDate: '',
    vatRegistrationType: '',
    // Financial Settings
    currency: 'INR',
    financialYearStart: '',
    financialYearEnd: '',
    fiscalYear: '',
    invoicePrefix: 'INV-',
    invoiceFormat: 'INV-YYYY-MM-DD-COUNT',
    creditNotePrefix: 'CN-',
    quotationPrefix: 'QT-',
    salesOrderPrefix: 'SO-',
    purchaseOrderPrefix: 'PO-',
    paymentPrefix: 'PAY-',
    // Banking
    accountName: '',
    accountNumber: '',
    bankName: '',
    bankAddress: '',
    iban: '',
    swiftCode: '',
    ifsc: '',
    // Invoice Settings
    invoiceTemplate: 'modern',
    defaultTerms: '',
    defaultFooterNote: '',
    digitalSignature: '',
    defaultPaymentTerms: '',
    // Inventory
    valuationMethod: 'FIFO',
    defaultWarehouseId: '',
    negativeStock: false,
    barcodeTracking: false,
    batchTracking: false,
    serialTracking: false,
    // Compliance
    reverseCharge: false,
    placeOfSupply: '',
    // HR
    leaveTypes: [],
  })

  useEffect(() => {
    if (business) {
      const s = Array.isArray(business.settings) ? business.settings[0] : business.settings
      setFormData({
        companyName: business.name || '',
        legalName: business.legalName || '',
        businessType: business.businessType || '',
        industry: business.industry || '',
        description: business.description || '',
        country: business.country || '',
        state: business.state || '',
        city: business.city || '',
        address: s?.address || '',
        pinCode: business.pinCode || '',
        timeZone: business.timeZone || '',
        language: business.language || 'English',
        emirate: business.emirate || '',
        gstNumber: business.gstNumber || '',
        pan: business.pan || '',
        tan: business.tan || '',
        msmeNumber: business.msmeNumber || '',
        gstRegistrationType: business.gstRegistrationType || '',
        vatNumber: s?.trn || business.vatNumber || '',
        vatRegistrationDate: business.vatRegistrationDate ? new Date(business.vatRegistrationDate).toISOString().split('T')[0] : '',
        vatRegistrationType: business.vatRegistrationType || '',
        currency: business.country === 'INDIA' ? 'INR' : (business.country === 'UAE' ? 'AED' : (business.currency || s?.currency || 'USD')),
        financialYearStart: business.financialYearStart ? new Date(business.financialYearStart).toISOString().split('T')[0] : '',
        financialYearEnd: business.financialYearEnd ? new Date(business.financialYearEnd).toISOString().split('T')[0] : '',
        fiscalYear: s?.fiscalYear || '',
        invoicePrefix: s?.invoicePrefix || 'INV-',
        invoiceFormat: s?.invoiceFormat || 'INV-YYYY-MM-DD-COUNT',
        creditNotePrefix: s?.creditNotePrefix || 'CN-',
        quotationPrefix: s?.quotationPrefix || 'QT-',
        salesOrderPrefix: s?.salesOrderPrefix || 'SO-',
        purchaseOrderPrefix: s?.purchaseOrderPrefix || 'PO-',
        paymentPrefix: s?.paymentPrefix || 'PAY-',
        accountName: s?.accountName || '',
        accountNumber: s?.accountNumber || '',
        bankName: s?.bankName || '',
        bankAddress: s?.bankAddress || '',
        iban: s?.iban || '',
        swiftCode: s?.swiftCode || '',
        ifsc: s?.ifsc || '',
        invoiceTemplate: s?.invoiceTemplate || 'modern',
        defaultTerms: s?.defaultTerms || '',
        defaultFooterNote: s?.defaultFooterNote || '',
        digitalSignature: s?.digitalSignature || '',
        companyLogo: s?.companyLogo || '',
        signatureUrl: s?.signatureUrl || '',
        valuationMethod: s?.valuationMethod || 'FIFO',
        defaultWarehouseId: s?.defaultWarehouseId || '',
        negativeStock: s?.negativeStock || false,
        barcodeTracking: s?.barcodeTracking || false,
        batchTracking: s?.batchTracking || false,
        serialTracking: s?.serialTracking || false,
        reverseCharge: s?.reverseCharge || false,
        placeOfSupply: s?.placeOfSupply || '',
        leaveTypes: (typeof s?.leaveTypes === 'string' ? JSON.parse(s.leaveTypes) : s?.leaveTypes) || [
          { code: 'ANNUAL', name: 'Annual Leave', yearlyLimit: 30, system: false },
          { code: 'SICK', name: 'Sick Leave', yearlyLimit: 15, system: false },
          { code: 'LWP', name: 'Unpaid Leave', yearlyLimit: null, system: true }
        ],
      })
    }
  }, [business])

  // Load current logged-in user info
  useEffect(() => {
    const load = async () => {
      try {
        const token = getCookie('token') || getCookie('accessToken')
        const API_BASE = import.meta.env.VITE_API_BASE || ''
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          const user = data.data || data.user
          setCurrentUser(user)
          setProfileForm({ name: user?.name || '' })
        }
      } catch {}
    }
    load()
  }, [])

  const handleProfileUpdate = async () => {
    if (!profileForm.name.trim()) {
      toast({ title: 'Name cannot be empty', variant: 'destructive' })
      return
    }
    setProfileStatus('saving')
    try {
      const token = getCookie('token') || getCookie('accessToken')
      const API_BASE = import.meta.env.VITE_API_BASE || ''
      const res = await fetch(`${API_BASE}/api/auth/update`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileForm.name.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setCurrentUser((u: any) => ({ ...u, name: profileForm.name.trim() }))
      setProfileStatus('saved')
      toast({ title: 'Profile updated successfully' })
      setTimeout(() => setProfileStatus('idle'), 2500)
    } catch (e: any) {
      toast({ title: 'Failed to update profile', description: e.message, variant: 'destructive' })
      setProfileStatus('idle')
    }
  }

  const handlePasswordChange = async () => {
    setPwdErrors({ newPassword: '', confirmPassword: '' })
    let hasError = false;
    const errors = { newPassword: '', confirmPassword: '' };

    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
      hasError = true;
    } else if (!/^(?=.*[0-9!@#$%^&*])/.test(passwordForm.newPassword)) {
      errors.newPassword = 'Must contain at least one number or special character';
      hasError = true;
    }

    if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      errors.confirmPassword = 'Passwords do not match';
      hasError = true;
    }

    if (hasError) {
      setPwdErrors(errors);
      return;
    }

    setPwdStatus('saving')
    try {
      const token = getCookie('token') || getCookie('accessToken')
      const API_BASE = import.meta.env.VITE_API_BASE || ''
      const res = await fetch(`${API_BASE}/api/auth/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: passwordForm.newPassword })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setPwdStatus('saved')
      setPasswordForm({ newPassword: '', confirmPassword: '' })
      toast({ title: 'Password updated successfully' })
      setTimeout(() => setPwdStatus('idle'), 2500)
    } catch (e: any) {
      toast({ title: 'Failed to update password', description: e.message, variant: 'destructive' })
      setPwdStatus('error')
      setTimeout(() => setPwdStatus('idle'), 2500)
    }
  }

  const isIndia = formData.country === 'INDIA'
  const isUAE = formData.country === 'UAE'

  const requiredFields = useMemo(() => {
    const req = ['companyName', 'currency', 'financialYearStart']
    if (isIndia) {
      req.push('gstNumber', 'state')
    }
    if (isUAE) {
      req.push('vatNumber', 'emirate')
    }
    return req
  }, [isIndia, isUAE])

  const missingFields = requiredFields.filter(f => !formData[f])
  const progressPercent = Math.round(((requiredFields.length - missingFields.length) / requiredFields.length) * 100)

  const handleSave = async () => {
    setSaveStatus('saving')
    try {
      const token = getCookie('token') || getCookie('accessToken')
      const API_BASE = import.meta.env.VITE_API_BASE || ''
      
      const formPayload = new FormData()
      
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'companyLogoFile' || key === 'signatureFile') {
          if (value instanceof File) {
            formPayload.append(key === 'companyLogoFile' ? 'companyLogo' : 'signature', value)
          }
        } else if (value !== null && value !== undefined && value !== '') {
          formPayload.append(key, typeof value === 'object' ? JSON.stringify(value) : value.toString())
        }
      })

      if (isUAE) {
        formPayload.set('trn', formData.vatNumber || '') // TRN mapping
      }

      const res = await fetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-business-id': businessId
        },
        body: formPayload
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      setSaveStatus('saved')
      toast({ title: 'Settings saved successfully' })
      refresh()
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (e: any) {
      toast({ title: 'Error saving settings', description: e.message, variant: 'destructive' })
      setSaveStatus('idle')
    }
  }

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\]\\^])/g, '\\$1') + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : ''
  }

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const FieldLabel = ({ id, label, required = false }: { id: string, label: string, required?: boolean }) => {
    const isMissing = required && !formData[id]
    return (
      <div className="flex justify-between items-center mb-2">
        <Label htmlFor={id} className="font-semibold text-foreground">{label} {required && '*'}</Label>
        {isMissing && <Badge variant="destructive" className="h-5 text-[10px] uppercase">🔴 Required</Badge>}
      </div>
    )
  }

  const sections = [
    { id: 'general', label: 'General Info', icon: Building2Icon },
    { id: 'location', label: 'Location', icon: MapPinIcon },
    { id: 'tax', label: 'Tax Registration', icon: FileTextIcon },
    { id: 'finance', label: 'Financial', icon: CreditCardIcon },
    { id: 'banking', label: 'Banking', icon: Building2Icon },
    { id: 'invoice', label: 'Invoice Settings', icon: FileTextIcon },
    { id: 'inventory', label: 'Inventory', icon: PackageSearchIcon },
    { id: 'hr', label: 'HR Settings', icon: ClockIcon },
    { id: 'compliance', label: 'Compliance', icon: ShieldIcon },
    { id: 'security', label: 'Security', icon: Settings2Icon },
  ]

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      
      {/* Header & Progress */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm sticky top-4 z-40">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Business Settings</h1>
          <p className="text-muted-foreground text-sm">Manage configuration for {business?.name}</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-foreground">Setup Progress: {progressPercent}%</span>
            <div className="w-48 h-2 bg-muted rounded-full mt-1 overflow-hidden">
              <div 
                className={cn("h-full transition-all duration-500", progressPercent === 100 ? "bg-emerald-500" : "bg-orange-500")} 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saveStatus === 'saving'}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm px-6 h-11"
          >
            {saveStatus === 'saving' ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"/> : <SaveIcon className="w-4 h-4" />}
            {saveStatus === 'saved' ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar Navigation */}
        <div className="lg:col-span-3 space-y-2">
          {sections.map(s => {
            const Icon = s.icon
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors text-left",
                  activeSection === s.id 
                    ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {s.label}
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 space-y-8 pb-32">
          
          {activeSection === 'general' && (
            <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/50 border-b border-border pb-6">
                <CardTitle className="text-xl">General Information</CardTitle>
                <CardDescription>Basic business details and branding</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-6">
                
                {/* Branding Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 border-b border-border pb-8">
                  <div>
                    <FieldLabel id="companyLogo" label="Company Logo" />
                    <div className="flex items-center gap-4 mt-2">
                      <div className="size-16 rounded-xl border border-dashed border-border flex items-center justify-center bg-muted overflow-hidden relative shrink-0">
                        {formData.companyLogoFile ? (
                          <img src={URL.createObjectURL(formData.companyLogoFile)} alt="Logo" className="w-full h-full object-contain" />
                        ) : formData.companyLogo ? (
                          <img src={formData.companyLogo.startsWith('http') ? formData.companyLogo : `${import.meta.env.VITE_API_BASE || ''}/${formData.companyLogo}`} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <Building2Icon className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <Input 
                        type="file" 
                        accept="image/*" 
                        onChange={e => e.target.files?.[0] && updateField('companyLogoFile', e.target.files[0])} 
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <FieldLabel id="signatureUrl" label="Digital Signature (For Invoices)" />
                    <div className="flex items-center gap-4 mt-2">
                      <div className="size-16 rounded-xl border border-dashed border-border flex items-center justify-center bg-muted overflow-hidden relative shrink-0">
                        {formData.signatureFile ? (
                          <img src={URL.createObjectURL(formData.signatureFile)} alt="Signature" className="w-full h-full object-contain" />
                        ) : formData.signatureUrl ? (
                          <img src={formData.signatureUrl.startsWith('http') ? formData.signatureUrl : `${import.meta.env.VITE_API_BASE || ''}/${formData.signatureUrl}`} alt="Signature" className="w-full h-full object-contain" />
                        ) : (
                          <FileTextIcon className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <Input 
                        type="file" 
                        accept="image/*" 
                        onChange={e => e.target.files?.[0] && updateField('signatureFile', e.target.files[0])} 
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <FieldLabel id="companyName" label="Business Name" required />
                    <Input 
                      id="companyName" 
                      value={formData.companyName} 
                      onChange={e => updateField('companyName', e.target.value)}
                      className={cn("h-11 rounded-xl", !formData.companyName && "border-red-300 focus-visible:ring-red-200")} 
                    />
                  </div>
                  <div>
                    <FieldLabel id="legalName" label="Legal Business Name" />
                    <Input id="legalName" value={formData.legalName} onChange={e => updateField('legalName', e.target.value)} className="h-11 rounded-xl" />
                  </div>
                  <div>
                    <FieldLabel id="businessType" label="Business Type" />
                    <Select value={formData.businessType} onValueChange={v => updateField('businessType', v)}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                        <SelectItem value="Partnership">Partnership</SelectItem>
                        <SelectItem value="LLP">LLP</SelectItem>
                        <SelectItem value="Private Limited">Private Limited</SelectItem>
                        <SelectItem value="Public Limited">Public Limited</SelectItem>
                        <SelectItem value="Government">Government</SelectItem>
                        <SelectItem value="NGO">NGO</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel id="industry" label="Industry" />
                    <Input id="industry" value={formData.industry} onChange={e => updateField('industry', e.target.value)} className="h-11 rounded-xl" />
                  </div>
                  <div className="md:col-span-2">
                    <FieldLabel id="description" label="Business Description" />
                    <Textarea 
                      id="description" 
                      value={formData.description} 
                      onChange={e => updateField('description', e.target.value)} 
                      className="rounded-xl resize-none" 
                      rows={4} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'location' && (
            <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/50 border-b border-border pb-6">
                <CardTitle className="text-xl">Business Location</CardTitle>
                <CardDescription>Address and regional settings</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <FieldLabel id="country" label="Country" required />
                    <Input 
                      id="country" 
                      value={formData.country} 
                      readOnly 
                      className="h-11 rounded-xl bg-muted text-muted-foreground font-bold" 
                    />
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">Cannot be changed after creation</p>
                  </div>
                  
                  {isIndia && (
                    <div>
                      <FieldLabel id="state" label="State" required={isIndia} />
                      <Input id="state" value={formData.state} onChange={e => updateField('state', e.target.value)} className={cn("h-11 rounded-xl", isIndia && !formData.state && "border-red-300 focus-visible:ring-red-200")} />
                    </div>
                  )}

                  {isUAE && (
                    <div>
                      <FieldLabel id="emirate" label="Emirate" required={isUAE} />
                      <Select value={formData.emirate} onValueChange={v => updateField('emirate', v)}>
                        <SelectTrigger className={cn("h-11 rounded-xl", isUAE && !formData.emirate && "border-red-300 focus-visible:ring-red-200")}>
                          <SelectValue placeholder="Select Emirate" />
                        </SelectTrigger>
                        <SelectContent>
                          {['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'].map(e => (
                            <SelectItem key={e} value={e}>{e}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <FieldLabel id="city" label="City" />
                    <Input id="city" value={formData.city} onChange={e => updateField('city', e.target.value)} className="h-11 rounded-xl" />
                  </div>
                  <div>
                    <FieldLabel id="pinCode" label="PIN / ZIP Code" />
                    <Input id="pinCode" value={formData.pinCode} onChange={e => updateField('pinCode', e.target.value)} className="h-11 rounded-xl" />
                  </div>
                  <div className="md:col-span-2">
                    <FieldLabel id="address" label="Complete Address" />
                    <Textarea id="address" value={formData.address} onChange={e => updateField('address', e.target.value)} className="rounded-xl resize-none" rows={3} />
                  </div>
                  <div>
                    <FieldLabel id="timeZone" label="Time Zone" />
                    <Input id="timeZone" value={formData.timeZone} onChange={e => updateField('timeZone', e.target.value)} className="h-11 rounded-xl" />
                  </div>
                  <div>
                    <FieldLabel id="language" label="Language" />
                    <Input id="language" value={formData.language} onChange={e => updateField('language', e.target.value)} className="h-11 rounded-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'tax' && (
            <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/50 border-b border-border pb-6">
                <CardTitle className="text-xl">Tax Registration</CardTitle>
                <CardDescription>Government tax identifiers and registration</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {isIndia && (
                    <>
                      <div>
                        <FieldLabel id="gstNumber" label="GSTIN" required={isIndia} />
                        <Input id="gstNumber" value={formData.gstNumber} onChange={e => updateField('gstNumber', e.target.value)} className={cn("h-11 rounded-xl", isIndia && !formData.gstNumber && "border-red-300")} />
                      </div>
                      <div>
                        <FieldLabel id="pan" label="PAN Number" />
                        <Input id="pan" value={formData.pan} onChange={e => updateField('pan', e.target.value)} className="h-11 rounded-xl" />
                      </div>
                      <div>
                        <FieldLabel id="tan" label="TAN Number" />
                        <Input id="tan" value={formData.tan} onChange={e => updateField('tan', e.target.value)} className="h-11 rounded-xl" />
                      </div>
                      <div>
                        <FieldLabel id="msmeNumber" label="MSME Registration No" />
                        <Input id="msmeNumber" value={formData.msmeNumber} onChange={e => updateField('msmeNumber', e.target.value)} className="h-11 rounded-xl" />
                      </div>
                      <div>
                        <FieldLabel id="gstRegistrationType" label="GST Registration Type" />
                        <Select value={formData.gstRegistrationType} onValueChange={v => updateField('gstRegistrationType', v)}>
                          <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Regular">Regular</SelectItem>
                            <SelectItem value="Composition">Composition</SelectItem>
                            <SelectItem value="Unregistered">Unregistered</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  {isUAE && (
                    <>
                      <div>
                        <FieldLabel id="vatNumber" label="TRN (Tax Registration Number)" required={isUAE} />
                        <Input id="vatNumber" value={formData.vatNumber} onChange={e => updateField('vatNumber', e.target.value)} className={cn("h-11 rounded-xl", isUAE && !formData.vatNumber && "border-red-300")} />
                      </div>
                      <div>
                        <FieldLabel id="vatRegistrationDate" label="VAT Registration Date" />
                        <Input type="date" id="vatRegistrationDate" value={formData.vatRegistrationDate} onChange={e => updateField('vatRegistrationDate', e.target.value)} className="h-11 rounded-xl" />
                      </div>
                      <div>
                        <FieldLabel id="vatRegistrationType" label="VAT Registration Type" />
                        <Select value={formData.vatRegistrationType} onValueChange={v => updateField('vatRegistrationType', v)}>
                          <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Standard">Standard</SelectItem>
                            <SelectItem value="Exempt">Exempt</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'finance' && (
            <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/50 border-b border-border pb-6">
                <CardTitle className="text-xl">Financial Settings</CardTitle>
                <CardDescription>Currency, financial year, and document prefixes</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <FieldLabel id="currency" label="Base Currency" required />
                    <Select value={formData.currency} onValueChange={v => updateField('currency', v)} disabled={isIndia || isUAE}>
                      <SelectTrigger className="h-11 rounded-xl bg-card disabled:bg-muted disabled:opacity-70"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.code} - {c.name} ({c.symbol})</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {(isIndia || isUAE) && (
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <LockIcon className="size-3" /> Currency is locked to country compliance.
                      </p>
                    )}
                  </div>
                  <div>
                    <FieldLabel id="fiscalYear" label="Fiscal Year Format" />
                    <Input id="fiscalYear" value={formData.fiscalYear} onChange={e => updateField('fiscalYear', e.target.value)} placeholder="e.g. 2024-25" className="h-11 rounded-xl" />
                  </div>
                  <div>
                    <FieldLabel id="financialYearStart" label="Financial Year Start" required />
                    <Input type="date" id="financialYearStart" value={formData.financialYearStart} onChange={e => updateField('financialYearStart', e.target.value)} className={cn("h-11 rounded-xl", !formData.financialYearStart && "border-red-300")} />
                  </div>
                  <div>
                    <FieldLabel id="financialYearEnd" label="Financial Year End" />
                    <Input type="date" id="financialYearEnd" value={formData.financialYearEnd} onChange={e => updateField('financialYearEnd', e.target.value)} className="h-11 rounded-xl" />
                  </div>

                  <div className="md:col-span-2 pt-6 border-t border-border">
                    <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Document Prefixes</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Invoice</Label>
                        <Input value={formData.invoicePrefix} onChange={e => updateField('invoicePrefix', e.target.value)} className="h-9" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Credit Note</Label>
                        <Input value={formData.creditNotePrefix} onChange={e => updateField('creditNotePrefix', e.target.value)} className="h-9" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Quotation</Label>
                        <Input value={formData.quotationPrefix} onChange={e => updateField('quotationPrefix', e.target.value)} className="h-9" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Sales Order</Label>
                        <Input value={formData.salesOrderPrefix} onChange={e => updateField('salesOrderPrefix', e.target.value)} className="h-9" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Purchase Order</Label>
                        <Input value={formData.purchaseOrderPrefix} onChange={e => updateField('purchaseOrderPrefix', e.target.value)} className="h-9" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Payment</Label>
                        <Input value={formData.paymentPrefix} onChange={e => updateField('paymentPrefix', e.target.value)} className="h-9" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'banking' && (
            <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/50 border-b border-border pb-6">
                <CardTitle className="text-xl">Banking Details</CardTitle>
                <CardDescription>Default bank account used for receiving payments</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <FieldLabel id="accountName" label="Account Name" />
                    <Input id="accountName" value={formData.accountName} onChange={e => updateField('accountName', e.target.value)} className="h-11 rounded-xl" />
                  </div>
                  <div>
                    <FieldLabel id="accountNumber" label="Account Number" />
                    <Input id="accountNumber" value={formData.accountNumber} onChange={e => updateField('accountNumber', e.target.value)} className="h-11 rounded-xl" />
                  </div>
                  <div>
                    <FieldLabel id="bankName" label="Bank Name" />
                    <Input id="bankName" value={formData.bankName} onChange={e => updateField('bankName', e.target.value)} className="h-11 rounded-xl" />
                  </div>
                  <div>
                    <FieldLabel id="bankAddress" label="Branch / Bank Address" />
                    <Input id="bankAddress" value={formData.bankAddress} onChange={e => updateField('bankAddress', e.target.value)} className="h-11 rounded-xl" />
                  </div>
                  <div>
                    <FieldLabel id="iban" label="IBAN" />
                    <Input id="iban" value={formData.iban} onChange={e => updateField('iban', e.target.value)} className="h-11 rounded-xl" />
                  </div>
                  <div>
                    <FieldLabel id="swiftCode" label="SWIFT Code" />
                    <Input id="swiftCode" value={formData.swiftCode} onChange={e => updateField('swiftCode', e.target.value)} className="h-11 rounded-xl" />
                  </div>
                  {isIndia && (
                    <div>
                      <FieldLabel id="ifsc" label="IFSC Code" />
                      <Input id="ifsc" value={formData.ifsc} onChange={e => updateField('ifsc', e.target.value)} className="h-11 rounded-xl" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'invoice' && (
            <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/50 border-b border-border pb-6">
                <CardTitle className="text-xl">Invoice Settings</CardTitle>
                <CardDescription>Default terms, templates, and text shown on invoices</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <FieldLabel id="invoiceFormat" label="Invoice Number Format" required />
                    <Input id="invoiceFormat" value={formData.invoiceFormat} onChange={e => updateField('invoiceFormat', e.target.value)} className={cn("h-11 rounded-xl", !formData.invoiceFormat && "border-red-300")} />
                    <p className="text-xs text-muted-foreground mt-1">Variables: YYYY, MM, DD, COUNT</p>
                  </div>
                  <div className="md:col-span-2">
                    <FieldLabel id="invoiceTemplate" label="Invoice Template" />
                    <p className="text-xs text-muted-foreground mb-4">Select the default template applied to all newly created invoices.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                      {TEMPLATES.map((tpl) => (
                        <div
                          key={tpl.id}
                          className={cn(
                            "relative flex flex-col rounded-xl border-2 transition-all cursor-pointer overflow-hidden",
                            formData.invoiceTemplate === tpl.id
                              ? "border-blue-600 shadow-md ring-2 ring-blue-600/20"
                              : "border-border hover:border-blue-300 hover:shadow-sm"
                          )}
                          onClick={() => updateField('invoiceTemplate', tpl.id)}
                        >
                          <div className="aspect-[1/1.2] relative bg-muted border-b border-border">
                            <img
                              src={tpl.image}
                              alt={tpl.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                            {formData.invoiceTemplate === tpl.id && (
                              <div className="absolute top-2 right-2 bg-blue-600 text-white p-1 rounded-full shadow-sm z-10">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              </div>
                            )}
                          </div>
                          <div className="p-4 bg-card flex-1 flex flex-col">
                            <h3 className="font-bold text-foreground text-sm leading-tight mb-1">{tpl.name}</h3>
                            <p className="text-[10px] text-muted-foreground leading-snug">{tpl.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <FieldLabel id="defaultTerms" label="Default Terms & Conditions" />
                    <Textarea id="defaultTerms" value={formData.defaultTerms} onChange={e => updateField('defaultTerms', e.target.value)} className="rounded-xl resize-none" rows={3} />
                  </div>
                  <div className="md:col-span-2">
                    <FieldLabel id="defaultFooterNote" label="Default Footer Note" />
                    <Textarea id="defaultFooterNote" value={formData.defaultFooterNote} onChange={e => updateField('defaultFooterNote', e.target.value)} className="rounded-xl resize-none" rows={2} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'inventory' && (
            <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/50 border-b border-border pb-6">
                <CardTitle className="text-xl">Inventory Settings</CardTitle>
                <CardDescription>Stock valuation and tracking preferences</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <FieldLabel id="valuationMethod" label="Stock Valuation Method" />
                    <Select value={formData.valuationMethod} onValueChange={v => updateField('valuationMethod', v)}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FIFO">First In, First Out (FIFO)</SelectItem>
                        <SelectItem value="LIFO">Last In, First Out (LIFO)</SelectItem>
                        <SelectItem value="WAC">Weighted Average Cost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel id="defaultWarehouseId" label="Default Warehouse" />
                    <Input id="defaultWarehouseId" value={formData.defaultWarehouseId} onChange={e => updateField('defaultWarehouseId', e.target.value)} className="h-11 rounded-xl" placeholder="Warehouse UUID" />
                  </div>
                </div>
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Allow Negative Stock</Label>
                    <Switch checked={formData.negativeStock} onCheckedChange={v => updateField('negativeStock', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Enable Barcode Tracking</Label>
                    <Switch checked={formData.barcodeTracking} onCheckedChange={v => updateField('barcodeTracking', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Enable Batch Tracking</Label>
                    <Switch checked={formData.batchTracking} onCheckedChange={v => updateField('batchTracking', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Enable Serial Tracking</Label>
                    <Switch checked={formData.serialTracking} onCheckedChange={v => updateField('serialTracking', v)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'compliance' && (
            <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/50 border-b border-border pb-6">
                <CardTitle className="text-xl">Compliance Settings</CardTitle>
                <CardDescription>Configure country-specific rules, tax settings, and reports</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <FieldLabel id="countryCompliance" label="Country Compliance" />
                    <Input id="countryCompliance" value={isIndia ? 'INDIA (GST)' : (isUAE ? 'UAE (VAT)' : 'Global')} disabled className="h-11 rounded-xl bg-muted" />
                  </div>
                  <div>
                    <FieldLabel id="taxConfiguration" label="Tax Configuration" />
                    <Select value={formData.taxConfiguration || 'default'} onValueChange={v => updateField('taxConfiguration', v)}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select config" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default Engine</SelectItem>
                        <SelectItem value="custom">Custom Rules</SelectItem>
                        <SelectItem value="exempt">Tax Exempt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">Statutory Reports</h4>
                      <p className="text-xs text-muted-foreground">Enable automatic report generation</p>
                    </div>
                    <Switch checked={formData.statutoryReports !== false} onCheckedChange={v => updateField('statutoryReports', v)} />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">Validation Rules</h4>
                      <p className="text-xs text-muted-foreground">Strict mode for format validation</p>
                    </div>
                    <Switch checked={formData.validationRules !== false} onCheckedChange={v => updateField('validationRules', v)} />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">Reverse Charge</h4>
                      <p className="text-xs text-muted-foreground">Enable reverse charge mechanism</p>
                    </div>
                    <Switch checked={formData.reverseCharge} onCheckedChange={v => updateField('reverseCharge', v)} />
                  </div>
                  <div>
                    <FieldLabel id="placeOfSupply" label="Default Place of Supply" />
                    <Input id="placeOfSupply" value={formData.placeOfSupply || ''} onChange={e => updateField('placeOfSupply', e.target.value)} className="h-11 rounded-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'security' && (
            <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/50 border-b border-border pb-6">
                <CardTitle className="text-xl">Security Settings</CardTitle>
                <CardDescription>Manage your account credentials and access settings</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-8">

                {/* My Account */}
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="bg-muted border-b border-border p-4 flex items-center gap-3">
                    <UserCircleIcon className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-foreground">My Account</h3>
                  </div>
                  <div className="p-6 space-y-5">
                    {/* Avatar Row */}
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl">
                      <div className="flex size-14 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xl shadow-md flex-shrink-0">
                        {(profileForm.name || currentUser?.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground text-lg leading-tight truncate">
                          {profileForm.name || currentUser?.name || 'Your Name'}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                          <span className="truncate">{currentUser?.email || 'Loading...'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Editable Profile Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Display Name</Label>
                        <Input
                          value={profileForm.name}
                          onChange={e => setProfileForm({ name: e.target.value })}
                          placeholder="Enter your name"
                          className="h-11 rounded-xl"
                        />
                        <p className="text-xs text-slate-400 mt-1">This is shown across the ERP</p>
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Email Address</Label>
                        <div className="relative">
                          <Input
                            value={currentUser?.email || ''}
                            disabled
                            className="h-11 rounded-xl bg-muted text-muted-foreground pr-10"
                          />
                          <LockIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Contact support to change email</p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={handleProfileUpdate}
                        disabled={profileStatus === 'saving' || !profileForm.name.trim() || profileForm.name === currentUser?.name}
                        className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                      >
                        {profileStatus === 'saving' ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : profileStatus === 'saved' ? (
                          '✓ Profile Saved'
                        ) : (
                          <><UserCircleIcon className="w-4 h-4" /> Save Profile</>
                        )}
                      </Button>
                    </div>

                    {/* Change Password */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <KeyRoundIcon className="w-4 h-4 text-muted-foreground" />
                        <h4 className="font-semibold text-sm text-foreground">Change Password</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1.5 block">New Password</Label>
                          <div className="relative">
                            <Input
                              type={showNewPwd ? 'text' : 'password'}
                              value={passwordForm.newPassword}
                              onChange={e => {
                                setPasswordForm(p => ({ ...p, newPassword: e.target.value }))
                                setPwdErrors(err => ({ ...err, newPassword: '' }))
                              }}
                              placeholder="Min. 6 characters"
                              className={`h-11 rounded-xl pr-10 ${pwdErrors.newPassword ? 'border-red-300 focus-visible:ring-red-400' : ''}`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPwd(v => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-muted-foreground"
                            >
                              {showNewPwd ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                            </button>
                          </div>
                          {pwdErrors.newPassword && <p className="text-xs text-red-500 mt-1">{pwdErrors.newPassword}</p>}
                        </div>

                        <div>
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Confirm New Password</Label>
                          <div className="relative">
                            <Input
                              type={showConfirmPwd ? 'text' : 'password'}
                              value={passwordForm.confirmPassword}
                              onChange={e => {
                                setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))
                                setPwdErrors(err => ({ ...err, confirmPassword: '' }))
                              }}
                              placeholder="Re-enter new password"
                              className={`h-11 rounded-xl pr-10 ${
                                pwdErrors.confirmPassword || (passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword)
                                  ? 'border-red-300 focus-visible:ring-red-400'
                                  : ''
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPwd(v => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-muted-foreground"
                            >
                              {showConfirmPwd ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                            </button>
                          </div>
                          {(pwdErrors.confirmPassword || (passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword)) && (
                            <p className="text-xs text-red-500 mt-1">{pwdErrors.confirmPassword || 'Passwords do not match'}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          onClick={handlePasswordChange}
                          disabled={pwdStatus === 'saving' || !passwordForm.newPassword || !passwordForm.confirmPassword}
                          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                        >
                          {pwdStatus === 'saving' ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : pwdStatus === 'saved' ? (
                            '✓ Password Updated'
                          ) : (
                            <><KeyRoundIcon className="w-4 h-4" /> Update Password</>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Access Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <FieldLabel id="defaultRole" label="Default Role for New Users" />
                    <Select value={formData.defaultRole || 'user'} onValueChange={v => updateField('defaultRole', v)}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select role" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="user">Standard User</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">Audit Logs</h4>
                      <p className="text-xs text-muted-foreground">Track all user activities</p>
                    </div>
                    <Switch checked={formData.auditLogs !== false} onCheckedChange={v => updateField('auditLogs', v)} />
                  </div>
                </div>

              </CardContent>
            </Card>
          )}

          {activeSection === 'hr' && (
            <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/50 border-b border-border pb-6">
                <CardTitle className="text-xl">HR Settings</CardTitle>
                <CardDescription>Configure leaves, overtime, and working hours</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 border border-border rounded-xl overflow-hidden">
                    <div className="bg-muted border-b border-border p-4 flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">Leave Types Configuration</h4>
                        <p className="text-xs text-muted-foreground">Define leave types and their yearly limits. LWP (Unpaid) is infinite.</p>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const lt = [...(formData.leaveTypes || [])]
                          lt.push({ code: `LV_${Date.now()}`, name: 'New Leave Type', yearlyLimit: 10, system: false })
                          updateField('leaveTypes', lt)
                        }}
                      >
                        <PlusIcon className="w-4 h-4 mr-2" /> Add Leave Type
                      </Button>
                    </div>
                    <div className="p-4 space-y-3">
                      {(formData.leaveTypes || []).map((leave: any, index: number) => (
                        <div key={leave.code} className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-card border border-border rounded-lg shadow-sm">
                          <div className="flex-1 w-full">
                            <Label className="text-xs text-muted-foreground mb-1 block">Leave Name</Label>
                            <Input 
                              value={leave.name} 
                              disabled={leave.system}
                              onChange={(e) => {
                                const lt = [...formData.leaveTypes]
                                lt[index].name = e.target.value
                                updateField('leaveTypes', lt)
                              }} 
                            />
                          </div>
                          <div className="w-full sm:w-32">
                            <Label className="text-xs text-muted-foreground mb-1 block">Yearly Limit</Label>
                            <Input 
                              type="number" 
                              value={leave.yearlyLimit === null ? '' : leave.yearlyLimit} 
                              disabled={leave.system}
                              placeholder={leave.system ? "Infinite" : "Days"}
                              onChange={(e) => {
                                const lt = [...formData.leaveTypes]
                                lt[index].yearlyLimit = e.target.value ? parseInt(e.target.value, 10) : 0
                                updateField('leaveTypes', lt)
                              }} 
                            />
                          </div>
                          <div className="w-full sm:w-auto flex justify-end mt-4 sm:mt-0 pt-1">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              disabled={leave.system}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                              onClick={() => {
                                const lt = formData.leaveTypes.filter((_: any, i: number) => i !== index)
                                updateField('leaveTypes', lt)
                              }}
                            >
                              <Trash2Icon className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <FieldLabel id="payrollCycle" label="Payroll Cycle" />
                    <Select value={formData.payrollCycle || 'monthly'} onValueChange={v => updateField('payrollCycle', v)}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select cycle" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel id="weekend" label="Weekend Days" />
                    <Select value={formData.weekend || 'sat_sun'} onValueChange={v => updateField('weekend', v)}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select weekend" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sat_sun">Saturday & Sunday</SelectItem>
                        <SelectItem value="sun_mon">Sunday & Monday</SelectItem>
                        <SelectItem value="fri_sat">Friday & Saturday</SelectItem>
                        <SelectItem value="sun">Sunday Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel id="workingHours" label="Standard Working Hours/Day" />
                    <Input id="workingHours" type="number" value={formData.workingHours || 8} onChange={e => updateField('workingHours', e.target.value)} className="h-11 rounded-xl" />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">Overtime Calculation</h4>
                      <p className="text-xs text-muted-foreground">Enable automatic OT tracking</p>
                    </div>
                    <Switch checked={formData.overtimeTracking === true} onCheckedChange={v => updateField('overtimeTracking', v)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}
