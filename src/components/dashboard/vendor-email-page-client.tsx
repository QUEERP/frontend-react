import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import {
  ArrowLeftIcon,
  MailIcon,
  SendIcon,
  FileTextIcon,
  CheckCircle2Icon,
  PaperclipIcon,
  UploadIcon,
  XIcon,
  Loader2Icon,
  ShieldCheckIcon,
  InfoIcon,
  EyeIcon,
  Building2Icon,
  UserIcon,
  DollarSignIcon,
  CalendarIcon,
  AlertCircleIcon,
  StoreIcon,
  ReceiptIcon,
  BookmarkPlusIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { businessEmailAPI, BusinessEmailConfig } from '@/lib/api/businessEmail'
import { buildCustomerEmailHtml } from '@/lib/customer-email-template'
import { API_ROOT } from '@/config/api'

function getAuthToken(): string {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
    if (token) return token
  }
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(new RegExp('(?:^|; )(?:token|accessToken)=([^;]*)'))
    if (match) return decodeURIComponent(match[1])
  }
  return ''
}

export function VendorEmailPageClient({
  businessId,
  vendorId,
}: {
  businessId: string
  vendorId: string
}) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialBillId = searchParams.get('billId')
  const { toast } = useToast()
  const { business, currencySymbol } = useBusinessData()

  // State
  const [vendor, setVendor] = useState<any>(null)
  const [loadingVendor, setLoadingVendor] = useState(true)
  const [isSavingEmail, setIsSavingEmail] = useState(false)

  const [bills, setBills] = useState<any[]>([])
  const [loadingBills, setLoadingBills] = useState(false)
  const [emailConfig, setEmailConfig] = useState<BusinessEmailConfig | null>(null)
  const [loadingConfig, setLoadingConfig] = useState(true)

  // Form Fields
  const [toEmail, setToEmail] = useState('')
  const [ccEmail, setCcEmail] = useState('')
  const [bccEmail, setBccEmail] = useState('')
  const [showCcBcc, setShowCcBcc] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write')

  // Selected Portal Attachments
  const [selectedBillIds, setSelectedBillIds] = useState<string[]>([])

  // Custom uploaded files
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; size: number; content: string; type: string }>>([])

  // Dispatching state
  const [isSending, setIsSending] = useState(false)

  // 1. Fetch Vendor Info
  useEffect(() => {
    const fetchVendor = async () => {
      if (!businessId || !vendorId) return
      setLoadingVendor(true)
      try {
        const token = getAuthToken()
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'x-business-id': businessId,
        }
        if (token) headers['Authorization'] = `Bearer ${token}`

        const res = await fetch(`${API_ROOT}/purchase/vendors/${encodeURIComponent(vendorId)}`, { headers })
        const data = await res.json()
        if (res.ok && data.success && (data.vendor || data.data)) {
          const v = data.vendor || data.data
          setVendor(v)
          if (v.email) {
            setToEmail((prev) => prev || v.email)
          }

          const vendorName = v.companyName || v.name || 'Vendor'
          const bName = business?.name || 'our company'
          setSubject((prev) => prev || `Vendor Statement & Documents - ${vendorName}`)
          setBody(
            (prev) =>
              prev ||
              `Hello ${vendorName},\n\nPlease find attached the latest bills and document records regarding our account with ${bName}.\n\nIf you have any questions or require any clarification, please feel free to reach out.\n\nBest regards,\n${bName} Accounts Team`
          )
        }
      } catch (err) {
        console.error('Failed to load vendor details:', err)
      } finally {
        setLoadingVendor(false)
      }
    }
    fetchVendor()
  }, [businessId, vendorId, business?.name])

  // 2. Fetch Business Email Config
  useEffect(() => {
    const fetchConfig = async () => {
      if (!businessId) return
      setLoadingConfig(true)
      try {
        const res = await businessEmailAPI.getConfig(businessId)
        if (res.success && res.data.config) {
          setEmailConfig(res.data.config)
        }
      } catch (err) {
        setEmailConfig(null)
      } finally {
        setLoadingConfig(false)
      }
    }
    fetchConfig()
  }, [businessId])

  // 3. Fetch Vendor Bills from Portal
  useEffect(() => {
    const fetchBills = async () => {
      if (!businessId || !vendorId) return
      setLoadingBills(true)
      try {
        const token = getAuthToken()
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'x-business-id': businessId,
        }
        if (token) headers['Authorization'] = `Bearer ${token}`

        const res = await fetch(`${API_ROOT}/purchase/bills?vendorId=${encodeURIComponent(vendorId)}&limit=100`, { headers })
        const data = await res.json()
        if (data.success) {
          const list = Array.isArray(data.bills) ? data.bills : (Array.isArray(data.data) ? data.data : [])
          setBills(list)

          // If a billId query param was requested, pre-select that bill and craft bill-specific email
          if (initialBillId && list.some((b: any) => b.id === initialBillId)) {
            setSelectedBillIds([initialBillId])
            const targetBill = list.find((b: any) => b.id === initialBillId)
            if (targetBill) {
              const vendorName = vendor?.companyName || vendor?.name || 'Vendor'
              const bName = business?.name || 'our company'
              setSubject(`Vendor Bill ${targetBill.billNumber} - ${vendorName}`)
              setBody(
                `Dear ${vendorName},\n\nPlease find attached Vendor Bill ${targetBill.billNumber} with ${bName}.\n\nBill Date: ${targetBill.billDate ? new Date(targetBill.billDate).toLocaleDateString() : '—'}\nDue Date: ${targetBill.dueDate ? new Date(targetBill.dueDate).toLocaleDateString() : 'Upon receipt'}\nTotal Amount: ${targetBill.currency || currencySymbol} ${Number(targetBill.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}\n\nPlease review the attached bill copy and let us know if any further details are required.\n\nBest regards,\n${bName} Accounts Team`
              )
            }
          } else if (list.length > 0) {
            setSelectedBillIds([list[0].id])
          }
        }
      } catch (err) {
        console.error('Failed to load vendor bills:', err)
      } finally {
        setLoadingBills(false)
      }
    }
    fetchBills()
  }, [businessId, vendorId, initialBillId, vendor?.name, business?.name, currencySymbol])

  // Save entered email to Vendor record
  const handleSaveEmailToVendor = async () => {
    if (!toEmail.trim() || !businessId || !vendorId) return
    setIsSavingEmail(true)
    try {
      const token = getAuthToken()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-business-id': businessId,
      }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${API_ROOT}/purchase/vendors/${encodeURIComponent(vendorId)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ email: toEmail.trim() }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setVendor((prev: any) => ({ ...prev, email: toEmail.trim() }))
        toast({
          title: 'Email Saved to Vendor',
          description: `${toEmail} is now saved as the official email for ${vendor?.name || 'this vendor'}.`,
        })
      } else {
        throw new Error(data.message || 'Failed to update vendor email')
      }
    } catch (err: any) {
      toast({
        title: 'Could not save vendor email',
        description: err.message || 'Error updating vendor.',
        variant: 'destructive',
      })
    } finally {
      setIsSavingEmail(false)
    }
  }

  // Toggle bill selection
  const handleToggleBill = (billId: string) => {
    setSelectedBillIds((prev) =>
      prev.includes(billId) ? prev.filter((id) => id !== billId) : [...prev, billId]
    )
  }

  // Custom File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds the 10 MB attachment limit.`,
          variant: 'destructive',
        })
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        const base64Data = (reader.result as string).split(',')[1] || ''
        setUploadedFiles((prev) => [
          ...prev,
          {
            name: file.name,
            size: file.size,
            content: base64Data,
            type: file.type || 'application/octet-stream',
          },
        ])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const handleRemoveUploadedFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Derived summaries
  const attachedBills = useMemo(() => {
    return bills.filter((b) => selectedBillIds.includes(b.id))
  }, [bills, selectedBillIds])

  const totalAttachmentsCount = attachedBills.length + uploadedFiles.length

  // Quick Templates
  const applyTemplate = (type: 'remittance' | 'statement' | 'followup' | 'general') => {
    const vendorName = vendor?.companyName || vendor?.name || 'Vendor'
    const bName = business?.name || 'our company'
    const billNumbers = attachedBills.map((b) => b.billNumber).filter(Boolean)
    const billRef = billNumbers.length > 0 ? ` (${billNumbers.join(', ')})` : ''

    switch (type) {
      case 'remittance':
        setSubject(`Payment Advice & Remittance${billRef} - ${vendorName}`)
        setBody(
          `Dear ${vendorName},\n\nPlease find attached the payment advice and remittance reference for your bill(s)${billRef} processed by ${bName}.\n\nKindly acknowledge receipt of this remittance advice. If you have any questions or require updated records, please feel free to reach out to our finance department.\n\nWarm regards,\n${bName} Accounts Team`
        )
        break
      case 'statement':
        setSubject(`Vendor Statement & Bill Review${billRef} - ${vendorName}`)
        setBody(
          `Dear ${vendorName},\n\nPlease find attached your updated bill statement and documentation records${billRef} from ${bName}.\n\nKindly review the summary and attached bill copies for reconciliation. If you notice any discrepancy, please reply to this email so we can verify promptly.\n\nWarm regards,\n${bName} Accounts Team`
        )
        break
      case 'followup':
        setSubject(`Procurement Follow-up & Order Confirmation${billRef} - ${vendorName}`)
        setBody(
          `Dear ${vendorName},\n\nWe are following up regarding our recent purchase order and billing status${billRef} with ${bName}.\n\nPlease find attached the relevant billing records. Kindly provide an update on delivery schedule, receipt acknowledgement, or any pending requirements.\n\nBest regards,\n${bName} Purchasing Team`
        )
        break
      case 'general':
        setSubject(`Notice from ${bName} - ${vendorName}`)
        setBody(
          `Dear ${vendorName},\n\nWe are writing to you regarding vendor operations with ${bName}.\n\nPlease review any attached documents and let us know if you require any additional information.\n\nBest regards,\n${bName} Team`
        )
        break
    }
    toast({
      title: 'Template Applied',
      description: 'Subject and body updated.',
    })
  }

  // HTML Preview
  const previewHtml = useMemo(() => {
    const senderEmail = emailConfig?.email || business?.email || 'noreply@company.com'
    const vendorName = vendor?.companyName || vendor?.name || 'Valued Vendor'

    return buildCustomerEmailHtml({
      subject: subject || 'Vendor Communication',
      body,
      businessName: business?.name || 'Our Company',
      senderEmail,
      businessPhone: business?.phone,
      businessLocation: [business?.city, business?.country].filter(Boolean).join(', '),
      customerName: vendorName,
      toEmail: toEmail || 'vendor@example.com',
      currencySymbol,
      attachedBills: attachedBills.map((b) => ({
        id: b.id,
        billNumber: b.billNumber,
        billDate: b.billDate,
        dueDate: b.dueDate,
        status: b.status,
        totalAmount: b.totalAmount,
      })),
      uploadedFiles: uploadedFiles.map((f) => ({ name: f.name, size: f.size })),
    })
  }, [
    subject,
    body,
    business?.name,
    business?.phone,
    business?.city,
    business?.country,
    business?.email,
    emailConfig?.email,
    vendor?.companyName,
    vendor?.name,
    toEmail,
    currencySymbol,
    attachedBills,
    uploadedFiles,
  ])

  // Dispatch Email
  const handleSendEmail = async () => {
    const trimmedTo = toEmail.trim()
    if (!trimmedTo) {
      toast({
        title: 'Recipient Required',
        description: 'Please specify the recipient vendor email address.',
        variant: 'destructive',
      })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedTo)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid recipient email address.',
        variant: 'destructive',
      })
      return
    }

    if (!subject.trim()) {
      toast({
        title: 'Subject Required',
        description: 'Please enter a subject line for your email.',
        variant: 'destructive',
      })
      return
    }

    setIsSending(true)
    try {
      const payloadAttachments: any[] = uploadedFiles.map((f) => ({
        filename: f.name,
        content: f.content,
        encoding: 'base64',
        contentType: f.type,
      }))

      const res = await businessEmailAPI.sendEmail(businessId, {
        to: trimmedTo,
        toEmail: trimmedTo,
        cc: ccEmail.trim() || undefined,
        bcc: bccEmail.trim() || undefined,
        subject: subject.trim(),
        text: body,
        html: previewHtml,
        vendorId,
        billIds: selectedBillIds.length > 0 ? selectedBillIds : undefined,
        attachments: payloadAttachments,
      })

      if (res.success) {
        toast({
          title: 'Email Dispatched Successfully',
          description: `Message sent to ${trimmedTo} via official business SMTP.`,
        })
        navigate(`/dashboard/${businessId}/vendors/${vendorId}`)
      } else {
        throw new Error(res.message || 'Failed to dispatch email')
      }
    } catch (err: any) {
      console.error('Dispatch error:', err)
      toast({
        title: 'Failed to Send Email',
        description: err.message || 'An error occurred while dispatching email.',
        variant: 'destructive',
      })
    } finally {
      setIsSending(false)
    }
  }

  const senderDisplay = emailConfig?.email
    ? `${emailConfig.senderName || business?.name || 'Company'} <${emailConfig.email}>`
    : business?.email
      ? `${business?.name || 'Company'} <${business.email}>`
      : 'No business sender configured'

  const hasConfiguredSmtp = Boolean(emailConfig && emailConfig.isEnabled)

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-24 pt-4 px-4 sm:px-6 lg:px-8">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/dashboard/${businessId}/vendors/${vendorId}`)}
            className="rounded-xl hover:bg-muted cursor-pointer shrink-0"
          >
            <ArrowLeftIcon className="size-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Send Email to {vendor?.name || 'Vendor'}
              </h1>
              {hasConfiguredSmtp ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold gap-1 py-0.5">
                  <ShieldCheckIcon className="size-3.5" />
                  Custom SMTP Active
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-600 border-amber-300 dark:text-amber-400 text-xs font-medium gap-1 py-0.5">
                  <AlertCircleIcon className="size-3.5" />
                  Platform Mailer (Configure SMTP)
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Vendor email is automatically fetched from records. Bills and documents can be attached directly from your portal.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            onClick={() => navigate(`/dashboard/${businessId}/vendors/${vendorId}`)}
            className="rounded-xl font-medium cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendEmail}
            disabled={isSending}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 shadow-sm cursor-pointer"
          >
            {isSending ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Dispatching...
              </>
            ) : (
              <>
                <SendIcon className="size-4" />
                Dispatch Email
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Composer Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Composer Form & Live Preview Tabs (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <MailIcon className="size-4 text-blue-600" />
                  Message Details
                </CardTitle>
                <CardDescription className="text-xs">Outbound vendor communication</CardDescription>
              </div>

              <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
                <Button
                  type="button"
                  size="sm"
                  variant={activeTab === 'write' ? 'secondary' : 'ghost'}
                  className={`h-8 rounded-lg text-xs font-semibold cursor-pointer ${activeTab === 'write' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
                    }`}
                  onClick={() => setActiveTab('write')}
                >
                  Write
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={activeTab === 'preview' ? 'secondary' : 'ghost'}
                  className={`h-8 rounded-lg text-xs font-semibold cursor-pointer ${activeTab === 'preview' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
                    }`}
                  onClick={() => setActiveTab('preview')}
                >
                  <EyeIcon className="size-3.5 mr-1" />
                  Preview
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-5 space-y-4">
              {/* SENDER ADDRESS (FROM) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Sender Address (FROM)
                  </Label>
                  <Link
                    to={`/dashboard/${businessId}/business-email`}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    Configure SMTP in Administration
                  </Link>
                </div>
                <div className="flex items-center gap-2.5 h-10 px-3.5 rounded-xl border border-border bg-muted/40 text-sm font-medium text-foreground">
                  <Building2Icon className="size-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{senderDisplay}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Your vendor will receive this message from your official business identity.
                </p>
              </div>

              {/* RECIPIENT ADDRESS (TO) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="toEmail" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Recipient Address (TO) <span className="text-rose-500">*</span>
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowCcBcc(!showCcBcc)}
                    className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
                  >
                    {showCcBcc ? 'Hide CC / BCC' : '+ Add CC / BCC'}
                  </button>
                </div>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="toEmail"
                    type="email"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    placeholder="vendor@company.com"
                    className="pl-10 h-10 rounded-xl border-border bg-background focus-visible:ring-blue-500 text-sm font-medium"
                  />
                </div>

                {/* Vendor Email status / Auto-save banner */}
                {vendor?.email ? (
                  <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                    <span>Vendor Email:</span>
                    <Badge variant="secondary" className="h-5 text-[11px] font-medium bg-blue-50 text-blue-700 border-blue-200">
                      {vendor.email}
                    </Badge>
                  </div>
                ) : (
                  toEmail && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 mt-2">
                      <div className="flex items-center gap-1.5">
                        <InfoIcon className="size-4 text-amber-600 shrink-0" />
                        <span>Vendor has no email saved in records.</span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleSaveEmailToVendor}
                        disabled={isSavingEmail}
                        className="h-7 text-xs font-semibold rounded-lg border-amber-300 hover:bg-amber-100 gap-1"
                      >
                        {isSavingEmail ? <Loader2Icon className="size-3 animate-spin" /> : <BookmarkPlusIcon className="size-3" />}
                        Save to Vendor
                      </Button>
                    </div>
                  )
                )}
              </div>

              {/* OPTIONAL CC & BCC */}
              {showCcBcc && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label htmlFor="ccEmail" className="text-xs font-medium text-muted-foreground">
                      CC Address
                    </Label>
                    <Input
                      id="ccEmail"
                      value={ccEmail}
                      onChange={(e) => setCcEmail(e.target.value)}
                      placeholder="accountant@company.com"
                      className="h-9 rounded-xl border-border text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="bccEmail" className="text-xs font-medium text-muted-foreground">
                      BCC Address
                    </Label>
                    <Input
                      id="bccEmail"
                      value={bccEmail}
                      onChange={(e) => setBccEmail(e.target.value)}
                      placeholder="audit@company.com"
                      className="h-9 rounded-xl border-border text-sm"
                    />
                  </div>
                </div>
              )}

              {/* QUICK EMAIL TEMPLATES */}
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Quick Email Templates
                </Label>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg text-xs font-medium border-border hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 dark:hover:bg-blue-950/40 cursor-pointer"
                    onClick={() => applyTemplate('remittance')}
                  >
                    <ReceiptIcon className="size-3.5 mr-1 text-blue-600" /> Payment Advice & Remittance
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg text-xs font-medium border-border hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 dark:hover:bg-amber-950/40 cursor-pointer"
                    onClick={() => applyTemplate('statement')}
                  >
                    <FileTextIcon className="size-3.5 mr-1 text-amber-600" /> Bill Statement Review
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg text-xs font-medium border-border hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 dark:hover:bg-emerald-950/40 cursor-pointer"
                    onClick={() => applyTemplate('followup')}
                  >
                    <StoreIcon className="size-3.5 mr-1 text-emerald-600" /> Order Follow-up
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg text-xs font-medium border-border hover:bg-slate-100 hover:text-slate-800 hover:border-slate-300 dark:hover:bg-slate-900 cursor-pointer"
                    onClick={() => applyTemplate('general')}
                  >
                    <MailIcon className="size-3.5 mr-1 text-slate-500" /> General Notice
                  </Button>
                </div>
              </div>

              {/* SUBJECT LINE */}
              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Subject Line <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Vendor Bill BILL-001 & Payment Remittance"
                  className="h-10 rounded-xl border-border bg-background focus-visible:ring-blue-500 text-sm font-medium"
                />
              </div>

              {/* WRITE VS PREVIEW TAB CONTENT */}
              {activeTab === 'write' ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="body" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Email Message Body <span className="text-rose-500">*</span>
                    </Label>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Insert: <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">vendorName</code> <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">businessName</code>
                    </span>
                  </div>
                  <Textarea
                    id="body"
                    rows={9}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write your email message here..."
                    className="rounded-xl border-border bg-background focus-visible:ring-blue-500 text-sm leading-relaxed p-3.5"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Live HTML Email Preview
                    </Label>
                    <span className="text-xs text-muted-foreground font-medium">Formatted for Gmail & Outlook</span>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/20 overflow-hidden shadow-inner max-h-[500px] overflow-y-auto">
                    <iframe
                      title="Vendor Email Preview"
                      srcDoc={previewHtml}
                      className="w-full min-h-[460px] border-0 bg-white"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Vendor Bills & Custom Attachments (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* VENDOR BILLS ATTACHMENTS CARD */}
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ReceiptIcon className="size-4 text-blue-600" />
                  Vendor Bills
                </CardTitle>
                <CardDescription className="text-xs">
                  Check any bills to automatically attach their generated PDF files
                </CardDescription>
              </div>
              <Badge variant="secondary" className="font-semibold text-xs">
                {selectedBillIds.length} Attached
              </Badge>
            </CardHeader>

            <CardContent className="pt-4">
              {loadingBills ? (
                <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground text-sm">
                  <Loader2Icon className="size-4 animate-spin text-blue-600" />
                  Loading vendor bills...
                </div>
              ) : bills.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No bills recorded for this vendor in portal.
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {bills.map((b) => {
                    const isSelected = selectedBillIds.includes(b.id)
                    const billDateStr = b.billDate ? new Date(b.billDate).toLocaleDateString() : '—'
                    const amountFormatted = `${b.currency || currencySymbol} ${Number(b.totalAmount || 0).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}`

                    return (
                      <div
                        key={b.id}
                        onClick={() => handleToggleBill(b.id)}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${isSelected
                            ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 shadow-xs'
                            : 'bg-background hover:bg-muted/50 border-border'
                          }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleBill(b.id)}
                          className="mt-0.5"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm text-foreground truncate">
                              {b.billNumber || 'BILL'}
                            </span>
                            <span className="font-bold text-sm text-foreground shrink-0">
                              {amountFormatted}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground mt-0.5">
                            <span>Date: {billDateStr}</span>
                            <span className="uppercase text-[10px] font-semibold tracking-wider">
                              {b.status || 'UNPAID'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* CUSTOM FILE ATTACHMENTS CARD */}
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <PaperclipIcon className="size-4 text-blue-600" />
                Custom File Attachments
              </CardTitle>
              <CardDescription className="text-xs">
                Upload receipts, contracts, proof of payment or work orders
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {/* Dropzone label */}
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:bg-muted/40 transition-colors">
                <UploadIcon className="size-6 text-muted-foreground mb-2" />
                <span className="text-xs font-semibold text-foreground">Click to upload documents</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">PDF, JPG, PNG, DOCX (Max 10 MB each)</span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                />
              </label>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Attached Files ({uploadedFiles.length})
                  </Label>
                  <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                    {uploadedFiles.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-border bg-muted/30 text-xs font-medium"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileTextIcon className="size-4 text-blue-600 shrink-0" />
                          <span className="truncate">{f.name}</span>
                          <span className="text-muted-foreground text-[10px]">
                            ({Math.max(1, Math.round(f.size / 1024))} KB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveUploadedFile(i)}
                          className="size-6 rounded-md hover:bg-rose-100 text-muted-foreground hover:text-rose-600 cursor-pointer"
                        >
                          <XIcon className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SUMMARY & DISPATCH CARD */}
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Recipient Vendor:</span>
                <span className="font-bold text-foreground truncate max-w-[200px]">
                  {toEmail || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Total Attachments:</span>
                <span className="font-bold text-foreground">{totalAttachmentsCount} file(s)</span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-border pt-2.5">
                <span className="text-muted-foreground font-medium">Vendor Current Balance:</span>
                <span className="font-bold text-foreground">
                  {currencySymbol} {Number(vendor?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <Button
                onClick={handleSendEmail}
                disabled={isSending}
                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm gap-2 shadow-sm cursor-pointer mt-2"
              >
                {isSending ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Dispatching Email...
                  </>
                ) : (
                  <>
                    <SendIcon className="size-4" />
                    Dispatch Email Now
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

