import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
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
  PlusIcon,
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
import { contactsAPI, Contact } from '@/lib/api/contacts'
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

export function CustomerEmailPageClient({
  businessId,
  customerId,
}: {
  businessId: string
  customerId: string
}) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { business, currencySymbol } = useBusinessData()

  // State
  const [customer, setCustomer] = useState<any>(null)
  const [loadingCustomer, setLoadingCustomer] = useState(true)
  const [contactsList, setContactsList] = useState<Contact[]>([])
  const [isSavingContact, setIsSavingContact] = useState(false)

  const [invoices, setInvoices] = useState<any[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [quotations, setQuotations] = useState<any[]>([])
  const [loadingQuotations, setLoadingQuotations] = useState(false)
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
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([])
  const [selectedQuotationIds, setSelectedQuotationIds] = useState<string[]>([])

  // Custom uploaded files
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; size: number; content: string; type: string }>>([])

  // Dispatching state
  const [isSending, setIsSending] = useState(false)

  // 0. Immediate pre-population from business data provider if customer is present in memory
  useEffect(() => {
    if (business?.customers && customerId) {
      const match = (business.customers as any[]).find((c) => c.id === customerId)
      if (match) {
        setCustomer((prev: any) => prev || match)
        const autoEmail = match.email
          || match.customerContacts?.find((c: any) => c.isPrimary && c.email)?.email
          || match.customerContacts?.find((c: any) => c.email)?.email
          || ''
        if (autoEmail) {
          setToEmail((prev) => prev || autoEmail)
        }
        if (match.customerContacts && Array.isArray(match.customerContacts)) {
          setContactsList((prev) => (prev.length > 0 ? prev : match.customerContacts.filter((c: any) => !c.isDeleted)))
        }
        const companyName = match.company || match.name || 'Valued Customer'
        setSubject((prev) => prev || `Statement & Documents - ${companyName}`)
        setBody(
          (prev) =>
            prev ||
            `Hello ${companyName},\n\nPlease find attached the latest documents and details regarding your account with ${business?.name || 'our company'}.\n\nIf you have any questions or require additional clarification, please feel free to reach out.\n\nBest regards,\n${business?.name || 'The QueErp Team'}`
        )
      }
    }
  }, [business?.customers, customerId, business?.name])

  // 1. Fetch Customer Info & Contacts
  useEffect(() => {
    const fetchCustomer = async () => {
      if (!businessId || !customerId) return
      setLoadingCustomer(true)
      try {
        const token = getAuthToken()
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'x-business-id': businessId,
        }
        if (token) headers['Authorization'] = `Bearer ${token}`

        // Fetch customer details from backend
        const res = await fetch(`${API_ROOT}/customers/${encodeURIComponent(customerId)}`, { headers })
        const data = await res.json()
        if (data.success && data.customer) {
          setCustomer(data.customer)
          const primaryEmail = data.customer.email
            || data.customer.customerContacts?.find((c: any) => c.isPrimary && c.email)?.email
            || data.customer.customerContacts?.find((c: any) => c.email)?.email
            || ''
          if (primaryEmail) {
            setToEmail((prev) => prev || primaryEmail)
          }
          if (Array.isArray(data.customer.customerContacts)) {
            setContactsList(data.customer.customerContacts.filter((c: any) => !c.isDeleted))
          }

          // Default subject and greeting
          const companyName = data.customer.company || data.customer.name || 'Valued Customer'
          setSubject((prev) => prev || `Statement & Documents - ${companyName}`)
          setBody(
            (prev) =>
              prev ||
              `Hello ${companyName},\n\nPlease find attached the latest documents and details regarding your account with ${business?.name || 'our company'}.\n\nIf you have any questions or require additional clarification, please feel free to reach out.\n\nBest regards,\n${business?.name || 'The QueErp Team'}`
          )
        }

        // Fetch customer contacts from contacts API
        const contactsRes = await contactsAPI.getContacts(businessId, customerId).catch(() => null)
        if (contactsRes && contactsRes.success && Array.isArray(contactsRes.contacts) && contactsRes.contacts.length > 0) {
          setContactsList(contactsRes.contacts)
          const contactEmail = contactsRes.contacts.find((c) => c.isPrimary && c.email)?.email
            || contactsRes.contacts.find((c) => c.email)?.email
          if (contactEmail) {
            setToEmail((prev) => prev || contactEmail)
          }
        }
      } catch (err) {
        console.error('Failed to load customer details:', err)
      } finally {
        setLoadingCustomer(false)
      }
    }
    fetchCustomer()
  }, [businessId, customerId, business?.name])

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

  // 3. Fetch Customer Invoices from Portal
  useEffect(() => {
    const fetchInvoices = async () => {
      if (!businessId || !customerId) return
      setLoadingInvoices(true)
      try {
        const token = getAuthToken()
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'x-business-id': businessId,
        }
        if (token) headers['Authorization'] = `Bearer ${token}`

        const res = await fetch(`${API_ROOT}/invoices?customerId=${encodeURIComponent(customerId)}`, { headers })
        const data = await res.json()
        if (data.success) {
          const list = Array.isArray(data.invoices) ? data.invoices : (Array.isArray(data.data) ? data.data : [])
          setInvoices(list)

          // Auto-select latest invoice if exists
          if (list.length > 0) {
            setSelectedInvoiceIds([list[0].id])
          }
        }
      } catch (err) {
        console.error('Failed to load customer invoices:', err)
      } finally {
        setLoadingInvoices(false)
      }
    }
    fetchInvoices()
  }, [businessId, customerId])

  // 4. Fetch Customer Quotations from Portal
  useEffect(() => {
    const fetchQuotations = async () => {
      if (!businessId || !customerId) return
      setLoadingQuotations(true)
      try {
        const token = getAuthToken()
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'x-business-id': businessId,
        }
        if (token) headers['Authorization'] = `Bearer ${token}`

        const res = await fetch(`${API_ROOT}/quotations?customerId=${encodeURIComponent(customerId)}`, { headers })
        const data = await res.json()
        if (data.success) {
          const list = Array.isArray(data.data) ? data.data : (Array.isArray(data.quotations) ? data.quotations : [])
          setQuotations(list)
        }
      } catch (err) {
        console.error('Failed to load customer quotations:', err)
      } finally {
        setLoadingQuotations(false)
      }
    }
    fetchQuotations()
  }, [businessId, customerId])

  // Quick Save Contact Email to Customer
  const handleSaveContactEmail = async () => {
    if (!toEmail.trim() || !businessId || !customerId) return
    setIsSavingContact(true)
    try {
      const res = await contactsAPI.createContact(businessId, {
        customerId,
        fullName: customer?.company || 'Primary Contact',
        email: toEmail.trim(),
        isPrimary: contactsList.length === 0,
        isActive: true,
      })
      if (res.success && res.contact) {
        setContactsList((prev) => [...prev, res.contact])
        toast({
          title: 'Email Saved to Customer',
          description: `${toEmail} is now saved as a contact for ${customer?.company || 'this customer'}.`,
        })
      }
    } catch (err: any) {
      toast({
        title: 'Could not save contact',
        description: err.message || 'Error saving contact email.',
        variant: 'destructive',
      })
    } finally {
      setIsSavingContact(false)
    }
  }

  // Toggle invoice selection
  const handleToggleInvoice = (invId: string) => {
    setSelectedInvoiceIds((prev) =>
      prev.includes(invId) ? prev.filter((id) => id !== invId) : [...prev, invId]
    )
  }

  // Toggle quotation selection
  const handleToggleQuotation = (qId: string) => {
    setSelectedQuotationIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
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
    setUploadedFiles((prev) => prev.filter((_, idx) => idx !== index))
  }

  // Quick Template Injectors
  const applyTemplate = (type: 'statement' | 'reminder' | 'quotation' | 'general') => {
    const company = customer?.company || customer?.name || 'Customer'
    const bName = business?.name || 'our company'

    switch (type) {
      case 'statement':
        setSubject(`Account Statement & Invoice - ${company}`)
        setBody(`Dear ${company},\n\nPlease find attached your updated account statement and latest invoices.\n\nKindly review and let us know if you need any adjustments or receipts.\n\nWarm regards,\n${bName} Accounts Team`)
        break
      case 'reminder':
        setSubject(`Payment Reminder - Pending Invoice Dues`)
        setBody(`Dear ${company},\n\nThis is a gentle reminder regarding outstanding payment for your recent invoices with ${bName}.\n\nAttached are the corresponding invoice copies for your review. We appreciate your prompt payment.\n\nBest regards,\n${bName} Finance`)
        break
      case 'quotation':
        setSubject(`Quotation & Proposal Follow-Up - ${company}`)
        setBody(`Hello ${company},\n\nThank you for considering ${bName}. Attached please find our quotation and project details for your review.\n\nWe look forward to collaborating with you.\n\nSincerely,\n${bName} Sales`)
        break
      case 'general':
        setSubject(`Notice from ${bName} regarding your account`)
        setBody(`Dear ${company},\n\nWe are writing to update you on your business relationship with ${bName}.\n\nPlease let us know if there is anything we can assist you with.\n\nRegards,\n${bName}`)
        break
    }
  }

  // Insert Variable
  const insertVariable = (variable: string) => {
    setBody((prev) => prev + ` ${variable} `)
  }

  // Calculate Total Outstanding Dues
  const outstandingDues = useMemo(() => {
    return invoices.reduce((sum, inv) => {
      const total = Number(inv.grandTotal || 0)
      const paid = Number(inv.amountPaid || 0)
      return sum + Math.max(0, total - paid)
    }, 0)
  }, [invoices])

  // Sender Email Representation
  const senderDisplay = useMemo(() => {
    if (emailConfig && emailConfig.isEnabled && emailConfig.email) {
      const sName = emailConfig.senderName || business?.name || 'Business Administrator'
      return {
        fromText: `${sName} <${emailConfig.email}>`,
        email: emailConfig.email,
        isCustom: true,
      }
    }
    return {
      fromText: `${business?.name || 'QueErp Business'} <${business?.email || 'noreply@queinfotech.com'}>`,
      email: business?.email || 'noreply@queinfotech.com',
      isCustom: false,
    }
  }, [emailConfig, business])

  // Check if current entered toEmail is already saved as a contact
  const isEmailSaved = useMemo(() => {
    if (!toEmail.trim()) return false
    return contactsList.some((c) => c.email && c.email.trim().toLowerCase() === toEmail.trim().toLowerCase())
  }, [toEmail, contactsList])

  // Send Email Handler
  const handleSendEmail = async () => {
    if (!toEmail.trim()) {
      toast({
        title: 'Recipient Required',
        description: 'Please specify the customer recipient email address.',
        variant: 'destructive',
      })
      return
    }

    if (!subject.trim()) {
      toast({
        title: 'Subject Required',
        description: 'Please enter an email subject line.',
        variant: 'destructive',
      })
      return
    }

    if (!body.trim()) {
      toast({
        title: 'Body Required',
        description: 'Please write a message in the email body.',
        variant: 'destructive',
      })
      return
    }

    setIsSending(true)
    try {
      // Map custom uploaded files into attachments format
      const customAttachments = uploadedFiles.map((f) => ({
        filename: f.name,
        content: f.content,
        encoding: 'base64',
        contentType: f.type,
      }))

      const payload = {
        to: toEmail.trim(),
        subject: subject.trim(),
        text: body.trim(),
        html: `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333333; white-space: pre-wrap;">${body.trim()}</div>`,
        cc: ccEmail.trim() || undefined,
        bcc: bccEmail.trim() || undefined,
        customerId: customerId,
        invoiceIds: selectedInvoiceIds,
        quotationIds: selectedQuotationIds,
        attachments: customAttachments,
      }

      const res = await businessEmailAPI.sendEmail(businessId, payload)
      if (res.success) {
        toast({
          title: 'Email Dispatched Successfully',
          description: `Message sent to ${toEmail} with ${selectedInvoiceIds.length} attached invoice(s).`,
        })
        navigate(`/dashboard/${businessId}/customers/${customerId}/view`)
      }
    } catch (err: any) {
      toast({
        title: 'Failed to Send Email',
        description: err.message || 'An error occurred while sending the email.',
        variant: 'destructive',
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-16 pt-6 sm:px-6 lg:px-8 w-full min-w-0 max-w-full overflow-x-hidden">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-6 rounded-2xl border border-border shadow-xs">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/dashboard/${businessId}/customers/${customerId}/view`)}
            className="h-10 w-10 cursor-pointer bg-muted hover:bg-muted/80 rounded-xl text-muted-foreground hover:text-foreground shrink-0"
          >
            <ArrowLeftIcon className="size-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Send Email to {customer?.company || customer?.name || 'Customer'}
              </h1>
              {senderDisplay.isCustom ? (
                emailConfig?.isVerified ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold text-xs gap-1 py-0.5">
                    <ShieldCheckIcon className="size-3.5" /> Custom SMTP Active
                  </Badge>
                ) : (
                  <Badge className="bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 font-semibold text-xs gap-1 py-0.5">
                    <AlertCircleIcon className="size-3.5" />
                    {emailConfig?.lastTestStatus === 'FAILED' ? 'Custom SMTP Auth Failed' : 'Custom SMTP Unverified'}
                  </Badge>
                )
              ) : (
                <Badge variant="outline" className="text-slate-600 border-slate-300 dark:text-slate-400 font-medium text-xs gap-1 py-0.5">
                  <InfoIcon className="size-3.5" /> Platform Mailer Active
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Customer email is automatically fetched from contacts. Invoices and documents can be attached directly from your portal.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            className="rounded-xl h-10 px-4 text-xs font-semibold cursor-pointer border-border"
            onClick={() => navigate(`/dashboard/${businessId}/customers`)}
          >
            Cancel
          </Button>
          <Button
            className="rounded-xl h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-2 shadow-sm cursor-pointer"
            onClick={handleSendEmail}
            disabled={isSending}
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

      {/* ── Main Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Composer Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="rounded-2xl border-border shadow-xs bg-card overflow-hidden">
            <CardHeader className="bg-muted/40 border-b border-border py-4 px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl">
                    <MailIcon className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base text-foreground">Message Details</CardTitle>
                    <CardDescription className="text-xs">Outbound customer communication</CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
                    <TabsList className="h-8 bg-muted rounded-lg p-0.5">
                      <TabsTrigger value="write" className="text-xs px-3 py-1 rounded-md">Write</TabsTrigger>
                      <TabsTrigger value="preview" className="text-xs px-3 py-1 rounded-md">Preview</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              {/* SENDER ADDRESS */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Sender Address (From)
                  </Label>
                  <Link
                    to={`/dashboard/${businessId}/settings`}
                    className="text-xs text-blue-600 hover:underline font-medium"
                    target="_blank"
                  >
                    Configure SMTP in Administration
                  </Link>
                </div>
                <div className="flex items-center h-10 px-3.5 rounded-xl border border-border bg-muted/30 text-foreground text-xs font-medium select-none">
                  <Building2Icon className="size-4 mr-2 text-muted-foreground shrink-0" />
                  <span className="truncate">{senderDisplay.fromText}</span>
                </div>
                {senderDisplay.isCustom && emailConfig && (!emailConfig.isVerified || emailConfig.lastTestStatus === 'FAILED') && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-3.5 py-2.5 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <AlertCircleIcon className="size-3.5 shrink-0" />
                      {emailConfig.lastTestStatus === 'FAILED'
                        ? 'Business SMTP authentication/connection failed on last check.'
                        : 'Business SMTP configuration has not been verified yet.'}
                    </p>
                    <p className="text-[11px] opacity-90">
                      SMTP Login: <span className="font-mono">{emailConfig.smtpUser}</span> via{' '}
                      <span className="font-mono">{emailConfig.smtpHost}:{emailConfig.smtpPort}</span>
                      {emailConfig.lastTestError ? ` — ${emailConfig.lastTestError}` : ''}
                    </p>
                    <Link
                      to={`/dashboard/${businessId}/settings`}
                      className="inline-block text-[11px] font-semibold text-blue-700 dark:text-blue-400 hover:underline"
                    >
                      Verify credentials & send a test email in Settings &rarr;
                    </Link>
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Your customer will receive this message from your official business identity.
                </p>
              </div>

              {/* RECIPIENT ADDRESS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="toEmail" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Recipient Address (To) <span className="text-rose-500">*</span>
                  </Label>
                  <div className="flex items-center gap-3">
                    {toEmail.trim() && !isEmailSaved && (
                      <button
                        type="button"
                        onClick={handleSaveContactEmail}
                        disabled={isSavingContact}
                        className="text-xs text-blue-600 hover:underline font-medium cursor-pointer flex items-center gap-1"
                      >
                        {isSavingContact ? (
                          <Loader2Icon className="size-3 animate-spin" />
                        ) : (
                          <BookmarkPlusIcon className="size-3" />
                        )}
                        Save Email to Customer
                      </button>
                    )}
                    {!showCcBcc && (
                      <button
                        type="button"
                        onClick={() => setShowCcBcc(true)}
                        className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
                      >
                        + Add CC / BCC
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <UserIcon className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="toEmail"
                    type="email"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    placeholder="customer@company.com"
                    className="pl-10 h-10 rounded-xl border-border bg-background focus-visible:ring-blue-500 text-sm font-medium"
                  />
                </div>

                {/* Contacts Quick Selection Chips */}
                {contactsList && contactsList.length > 0 ? (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[11px] text-muted-foreground font-medium">Customer Contacts:</span>
                    {contactsList.map((c) => {
                      const isSelected = toEmail.trim().toLowerCase() === (c.email || '').trim().toLowerCase()
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => c.email && setToEmail(c.email)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all border ${isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-muted/70 hover:bg-muted text-foreground border-border/70 hover:border-border'
                            }`}
                        >
                          <UserIcon className="size-3 shrink-0" />
                          <span>{c.fullName || 'Contact'}</span>
                          {c.email && (
                            <span className={isSelected ? 'text-blue-100' : 'text-muted-foreground'}>
                              ({c.email})
                            </span>
                          )}
                          {c.isPrimary && (
                            <span
                              className={`text-[10px] px-1 py-0.2 rounded font-semibold uppercase ${isSelected ? 'bg-blue-700 text-blue-100' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                }`}
                            >
                              Primary
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-0.5">
                    <InfoIcon className="size-3.5 text-amber-500 shrink-0" />
                    <span>
                      {toEmail.trim()
                        ? 'This email will be auto-saved to this customer upon sending so it auto-fetches next time.'
                        : 'No saved contact email found for this customer. Enter an email above to auto-save and use it.'}
                    </span>
                  </div>
                )}
              </div>

              {/* CC & BCC FIELDS (TOGGLEABLE) */}
              {showCcBcc && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-border/60">
                  <div className="space-y-1.5">
                    <Label htmlFor="ccEmail" className="text-xs font-medium text-muted-foreground">
                      CC Address
                    </Label>
                    <Input
                      id="ccEmail"
                      type="email"
                      value={ccEmail}
                      onChange={(e) => setCcEmail(e.target.value)}
                      placeholder="accountant@company.com"
                      className="h-9 rounded-xl border-border bg-background text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bccEmail" className="text-xs font-medium text-muted-foreground">
                      BCC Address
                    </Label>
                    <Input
                      id="bccEmail"
                      type="email"
                      value={bccEmail}
                      onChange={(e) => setBccEmail(e.target.value)}
                      placeholder="archive@mybusiness.com"
                      className="h-9 rounded-xl border-border bg-background text-xs"
                    />
                  </div>
                </div>
              )}

              {/* QUICK EMAIL TEMPLATES */}
              <div className="space-y-1.5 pt-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Quick Email Templates
                </Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg text-xs font-medium border-border hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 dark:hover:bg-blue-950/40 cursor-pointer"
                    onClick={() => applyTemplate('statement')}
                  >
                    <FileTextIcon className="size-3.5 mr-1 text-blue-600" /> Invoice & Statement
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg text-xs font-medium border-border hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 dark:hover:bg-amber-950/40 cursor-pointer"
                    onClick={() => applyTemplate('reminder')}
                  >
                    <CalendarIcon className="size-3.5 mr-1 text-amber-600" /> Payment Reminder
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg text-xs font-medium border-border hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 dark:hover:bg-emerald-950/40 cursor-pointer"
                    onClick={() => applyTemplate('quotation')}
                  >
                    <DollarSignIcon className="size-3.5 mr-1 text-emerald-600" /> Quotation Follow-up
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
                  placeholder="e.g. Invoice INV-001 & Account Statement"
                  className="h-10 rounded-xl border-border bg-background focus-visible:ring-blue-500 text-sm font-medium"
                />
              </div>

              {/* EMAIL BODY / PREVIEW */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="body" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Email Message Body <span className="text-rose-500">*</span>
                  </Label>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>Insert:</span>
                    <button
                      type="button"
                      onClick={() => insertVariable(customer?.company || customer?.name || 'Customer')}
                      className="px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 text-[11px] font-mono font-medium text-foreground border border-border cursor-pointer"
                    >
                      companyName
                    </button>
                    <button
                      type="button"
                      onClick={() => insertVariable(business?.name || 'our company')}
                      className="px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 text-[11px] font-mono font-medium text-foreground border border-border cursor-pointer"
                    >
                      businessName
                    </button>
                  </div>
                </div>

                {activeTab === 'write' ? (
                  <Textarea
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write your email message here..."
                    className="min-h-[220px] rounded-xl border-border bg-background focus-visible:ring-blue-500 text-sm leading-relaxed p-4"
                  />
                ) : (
                  <div className="min-h-[220px] rounded-xl border border-border bg-muted/20 p-5 space-y-4">
                    <div className="border-b border-border pb-3">
                      <div className="text-xs text-muted-foreground">
                        <strong className="text-foreground">From:</strong> {senderDisplay.fromText}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        <strong className="text-foreground">To:</strong> {toEmail || '(recipient not set)'}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        <strong className="text-foreground">Subject:</strong> {subject || '(no subject)'}
                      </div>
                    </div>
                    <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">
                      {body || <span className="text-muted-foreground italic">No message content drafted yet.</span>}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Portal Attachments & Actions (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: Customer Invoices to Attach */}
          <Card className="rounded-2xl border-border shadow-xs bg-card overflow-hidden">
            <CardHeader className="bg-muted/40 border-b border-border py-4 px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileTextIcon className="size-4 text-blue-600" />
                  <CardTitle className="text-sm font-bold text-foreground">Customer Invoices</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs font-semibold">
                  {selectedInvoiceIds.length} Attached
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Check any invoices to automatically attach their generated PDF files to this email.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 space-y-2 max-h-[340px] overflow-y-auto">
              {loadingInvoices ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground text-xs gap-2">
                  <Loader2Icon className="size-4 animate-spin" /> Loading customer invoices...
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  No invoices recorded for this customer in portal.
                </div>
              ) : (
                invoices.map((inv) => {
                  const isChecked = selectedInvoiceIds.includes(inv.id)
                  const isPaid = inv.status === 'PAID'
                  const total = Number(inv.grandTotal || 0)
                  const paid = Number(inv.amountPaid || 0)
                  const remaining = Math.max(0, total - paid)

                  return (
                    <div
                      key={inv.id}
                      onClick={() => handleToggleInvoice(inv.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${isChecked
                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30'
                        : 'border-border/70 hover:border-border hover:bg-muted/30'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => handleToggleInvoice(inv.id)}
                          className="rounded-md"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-foreground font-mono">
                              {inv.invoiceNumber}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-semibold uppercase px-1.5 py-0 ${isPaid
                                ? 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40'
                                : inv.status === 'PARTIAL'
                                  ? 'border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/40'
                                  : 'border-rose-300 text-rose-700 bg-rose-50 dark:bg-rose-950/40'
                                }`}
                            >
                              {inv.status}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '—'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-foreground">
                          {currencySymbol} {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        {!isPaid && (
                          <p className="text-[10px] text-rose-600 font-medium">
                            Due: {currencySymbol} {remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Card: Customer Quotations to Attach */}
          {quotations.length > 0 && (
            <Card className="rounded-2xl border-border shadow-xs bg-card overflow-hidden">
              <CardHeader className="bg-muted/40 border-b border-border py-4 px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileTextIcon className="size-4 text-emerald-600" />
                    <CardTitle className="text-sm font-bold text-foreground">Customer Quotations</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs font-semibold">
                    {selectedQuotationIds.length} Attached
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-2 max-h-[220px] overflow-y-auto">
                {quotations.map((q) => {
                  const isChecked = selectedQuotationIds.includes(q.id)
                  return (
                    <div
                      key={q.id}
                      onClick={() => handleToggleQuotation(q.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${isChecked
                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30'
                        : 'border-border/70 hover:border-border hover:bg-muted/30'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => handleToggleQuotation(q.id)}
                          className="rounded-md"
                        />
                        <div>
                          <span className="font-bold text-xs text-foreground font-mono">
                            {q.quoteNumber}
                          </span>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {q.issueDate ? new Date(q.issueDate).toLocaleDateString() : '—'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-foreground">
                          {currencySymbol} {Number(q.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {/* Card: Custom File Uploads */}
          <Card className="rounded-2xl border-border shadow-xs bg-card overflow-hidden">
            <CardHeader className="bg-muted/40 border-b border-border py-4 px-6">
              <div className="flex items-center gap-2">
                <PaperclipIcon className="size-4 text-slate-500" />
                <CardTitle className="text-sm font-bold text-foreground">Custom File Attachments</CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-3">
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/40 transition-colors">
                <div className="flex flex-col items-center justify-center pt-2 pb-2 text-center">
                  <UploadIcon className="size-5 mb-1 text-muted-foreground" />
                  <p className="text-xs font-semibold text-foreground">Click to upload documents</p>
                  <p className="text-[10px] text-muted-foreground">PDF, JPG, PNG, DOCX (Max 10 MB each)</p>
                </div>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xlsx"
                />
              </label>

              {uploadedFiles.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {uploadedFiles.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted text-xs border border-border">
                      <div className="flex items-center gap-2 truncate">
                        <PaperclipIcon className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate font-medium">{f.name}</span>
                        <span className="text-[10px] text-muted-foreground">({(f.size / 1024).toFixed(0)} KB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveUploadedFile(i)}
                        className="text-muted-foreground hover:text-rose-600 p-1"
                      >
                        <XIcon className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card: Dispatch Overview & Quick Action */}
          <Card className="rounded-2xl border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50/70 to-card dark:from-blue-950/20 shadow-xs">
            <CardContent className="p-5 space-y-3.5">
              <div className="flex items-center justify-between text-xs border-b border-border/60 pb-2.5">
                <span className="text-muted-foreground font-medium">Recipient Customer</span>
                <span className="font-bold text-foreground truncate max-w-[200px]">{toEmail || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-border/60 pb-2.5">
                <span className="text-muted-foreground font-medium">Total Attachments</span>
                <span className="font-bold text-blue-700 dark:text-blue-400">
                  {selectedInvoiceIds.length + selectedQuotationIds.length + uploadedFiles.length} file(s)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pb-1">
                <span className="text-muted-foreground font-medium">Current Outstanding</span>
                <span className="font-bold text-foreground">
                  {currencySymbol} {outstandingDues.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <Button
                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm gap-2 shadow-sm cursor-pointer mt-2"
                onClick={handleSendEmail}
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Sending Email...
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
