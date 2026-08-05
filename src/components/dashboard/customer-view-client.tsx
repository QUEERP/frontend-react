import { toast } from 'sonner';
import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom';
import {  useNavigate  } from 'react-router-dom';
import {
  ArrowDownToLineIcon,
  ArrowLeftIcon,
  Building2Icon,
  CalendarIcon,
  DollarSignIcon,
  DownloadIcon,
  EditIcon,
  GlobeIcon,
  HashIcon,
  Loader2Icon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  UsersIcon,
  FileTextIcon,
  FileCheckIcon,
  ReceiptIcon,
  CreditCardIcon,
  ChevronRightIcon,
  PlusIcon,
  EyeIcon,
  UserIcon,
  ExternalLinkIcon,
  BriefcaseIcon
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { DashboardPageSkeleton } from '@/components/dashboard/dashboard-page-skeleton'
import { CustomerContacts } from '@/components/contacts/customer-contacts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type StatementPeriod = 'day' | 'month' | 'year' | 'custom'

interface CreditNoteItem {
  id: string
  creditNumber: string
  invoiceNumber: string
  issueDate: string
  amount: number
  status: string
  reason?: string
  downloadUrl?: string
}

interface StatementItem {
  date: string
  description: string
  referenceNumber: string
  debitAmount: number
  creditAmount: number
  runningBalance: number
}

interface QuotationItem {
  id: string
  quoteNumber: string
  title?: string
  status: string
  totalAmount: number
  issueDate: string
  expiryDate?: string
}

interface SalesOrderItem {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  orderDate: string
  deliveryDate?: string
}

interface PaymentItem {
  id: string
  invoiceId: string
  invoiceNumber: string
  amount: number
  paymentDate: string
  paymentMode: string
  transactionId: string
  pdfUrl: string
}

export function CustomerViewClient({ businessId, customerId }: { businessId: string; customerId: string }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { business, loading: businessLoading, currencySymbol } = useBusinessData()

  const [creditNotes, setCreditNotes] = useState<CreditNoteItem[]>([])
  const [loadingCreditNotes, setLoadingCreditNotes] = useState(false)
  const [downloadingCreditNoteId, setDownloadingCreditNoteId] = useState<string | null>(null)

  const [loadingPaymentsSummary, setLoadingPaymentsSummary] = useState(false)
  const [totalPayments, setTotalPayments] = useState(0)

  const [statementPeriod, setStatementPeriod] = useState<StatementPeriod>('month')
  const [customFromDate, setCustomFromDate] = useState('')
  const [customToDate, setCustomToDate] = useState('')
  const [statements, setStatements] = useState<StatementItem[]>([])
  const [loadingStatements, setLoadingStatements] = useState(false)
  const [downloadingStatementPdf, setDownloadingStatementPdf] = useState(false)

  const [quotations, setQuotations] = useState<QuotationItem[]>([])
  const [loadingQuotations, setLoadingQuotations] = useState(false)
  const [downloadingPaymentId, setDownloadingPaymentId] = useState<string | null>(null)
  
  const isBasic = business?.businessType?.toLowerCase() === 'basic'

  const customerInvoices = useMemo(() => {
    const invoices = Array.isArray((business as any)?.invoices) ? (business as any).invoices : []
    return invoices.filter((inv: any) => String(inv.customerId) === String(customerId))
  }, [business, customerId])

  const pendingDocs = useMemo(() => {
    if (isBasic) {
      return quotations.filter((q: any) => q.status !== 'PAID' && q.status !== 'CANCELLED' && q.status !== 'DRAFT')
    }
    return customerInvoices.filter((i: any) => i.status !== 'PAID' && i.status !== 'CANCELLED' && i.status !== 'DRAFT')
  }, [quotations, customerInvoices, isBasic])

  const [salesOrders, setSalesOrders] = useState<SalesOrderItem[]>([])
  const [loadingSalesOrders, setLoadingSalesOrders] = useState(false)

  const [paymentsList, setPaymentsList] = useState<PaymentItem[]>([])
  const [loadingPaymentsList, setLoadingPaymentsList] = useState(false)

  const customer = useMemo(() => {
    return (business?.customers ?? []).find((c: any) => c.id === customerId) || null
  }, [business, customerId])

  const [directCustomer, setDirectCustomer] = useState<any>(null)
  const [customerLoading, setCustomerLoading] = useState(false)

  const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\^])/g, '\\$1') + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : ''
  }

  // Load customer direct if missing in provider
  useEffect(() => {
    if (!customer && businessId) {
      const fetchCustomerDirectly = async () => {
        try {
          setCustomerLoading(true)
          const token = getCookie('token') || getCookie('accessToken')
          if (!token) return

          const response = await fetch(`${API_BASE}/api/customers/${customerId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'x-business-id': businessId
            }
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              setDirectCustomer(data.customer)
            }
          }
        } catch (error) {
          console.error('Failed to fetch customer:', error)
        } finally {
          setCustomerLoading(false)
        }
      }

      fetchCustomerDirectly()
    }
  }, [businessId, customerId, customer])

  const displayCustomer = customer || directCustomer

  const customerCurrencySymbol = useMemo(() => {
    if (!displayCustomer) return currencySymbol || '₹'
    let ccy = displayCustomer.currency
    if (!ccy || ccy === 'SYSTEM') ccy = business?.currency || 'INR'
    if (ccy.toUpperCase() === 'CANADA') ccy = 'CAD'
    if (ccy.toUpperCase() === 'INDIA') ccy = 'INR'
    if (ccy.toUpperCase() === 'UAE' || ccy.toUpperCase() === 'DUBAI') ccy = 'AED'
    if (ccy.toUpperCase() === 'USA' || ccy.toUpperCase() === 'US') ccy = 'USD'
    
    // Quick map for symbols
    const symbols: Record<string, string> = {
      'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£', 'CAD': 'CA$', 'AUD': 'A$', 'AED': 'د.إ', 'SGD': 'S$'
    }
    return symbols[ccy] || ccy
  }, [displayCustomer, business, currencySymbol])

  const formatMoney = (amount: number) => {
    let ccy = displayCustomer?.currency
    if (!ccy || ccy === 'SYSTEM') ccy = business?.currency || 'INR'
    if (ccy.toUpperCase() === 'CANADA') ccy = 'CAD'
    if (ccy.toUpperCase() === 'INDIA') ccy = 'INR'
    if (ccy.toUpperCase() === 'UAE' || ccy.toUpperCase() === 'DUBAI') ccy = 'AED'
    if (ccy.toUpperCase() === 'USA' || ccy.toUpperCase() === 'US') ccy = 'USD'
    
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: ccy,
        maximumFractionDigits: 0
      }).format(amount)
    } catch {
      return `${customerCurrencySymbol} ${amount.toLocaleString('en-IN')}`
    }
  }


  const totalInvoiceAmount = useMemo(() => {
    return customerInvoices.reduce((sum: number, inv: any) => sum + Number(inv?.grandTotal || 0), 0)
  }, [customerInvoices])

  const outstandingBalance = useMemo(() => {
    return Math.max(totalInvoiceAmount - totalPayments, 0)
  }, [totalInvoiceAmount, totalPayments])

  const toDateOnly = (value: Date) => {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const resolveStatementRange = () => {
    const now = new Date()

    if (statementPeriod === 'custom') {
      const from = String(customFromDate || '').trim()
      const to = String(customToDate || '').trim()
      if (!from || !to) return null
      if (Number.isNaN(new Date(from).getTime()) || Number.isNaN(new Date(to).getTime())) return null
      return { fromDate: from, toDate: to }
    }

    const from = new Date(now)
    if (statementPeriod === 'day') {
      from.setDate(now.getDate() - 1)
    } else if (statementPeriod === 'month') {
      from.setMonth(now.getMonth() - 1)
    } else {
      from.setFullYear(now.getFullYear() - 1)
    }

    return {
      fromDate: toDateOnly(from),
      toDate: toDateOnly(now),
    }
  }

  const statementRange = useMemo(() => resolveStatementRange(), [statementPeriod, customFromDate, customToDate])

  // Fetch Credit Notes
  useEffect(() => {
    const fetchCreditNotes = async () => {
      if (!customerId) return
      const token = getCookie('token') || getCookie('accessToken')
      if (!token) return

      setLoadingCreditNotes(true)
      try {
        const res = await fetch(
          `${API_BASE}/api/credit-notes`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'x-business-id': businessId,
            },
          },
        )

        const payload = await res.json()
        if (!res.ok || !payload?.success) {
          throw new Error(payload?.message || 'Failed to load credit notes')
        }

        const rawList = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.data?.items)
            ? payload.data.items
            : []

        const list = rawList.filter((item: any) => String(item?.customer?.id || '') === String(customerId))
        setCreditNotes(
          list.map((item: any) => ({
            id: String(item.id),
            creditNumber: String(item.creditNumber || item.id || '-'),
            invoiceNumber: String(item.invoice?.invoiceNumber || '-'),
            issueDate: item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : '-',
            amount: Number(item.amount || 0),
            status: String(item.status || 'OPEN').toUpperCase(),
            reason: String(item.reason || '').trim(),
            downloadUrl: String(item.downloadUrl || ''),
          })),
        )
      } catch (err: any) {
        toast({
          title: 'Failed to load credit notes',
          description: err?.message || 'Unknown error',
          variant: 'destructive',
        })
      } finally {
        setLoadingCreditNotes(false)
      }
    }

    void fetchCreditNotes()
  }, [API_BASE, businessId, customerId])

  // Fetch Payment Totals
  useEffect(() => {
    const fetchPaymentTotals = async () => {
      if (customerInvoices.length === 0) {
        setTotalPayments(0)
        return
      }

      const token = getCookie('token') || getCookie('accessToken')
      if (!token) {
        setTotalPayments(0)
        return
      }

      setLoadingPaymentsSummary(true)
      try {
        const docs = [...customerInvoices, ...quotations]
        const settled = await Promise.allSettled(
          docs.map(async (doc: any) => {
            const isQuote = !!doc.quoteNumber || !!doc.projectCode
            const endpoint = isQuote ? `/api/payments/quotation/${encodeURIComponent(String(doc.id))}` : `/api/payments/invoice/${encodeURIComponent(String(doc.id))}`
            const res = await fetch(
              `${API_BASE}${endpoint}`,
              {
                method: 'GET',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'x-business-id': businessId,
                },
              },
            )

            if (!res.ok) return 0
            const payload = await res.json()
            const list = Array.isArray(payload?.data) ? payload.data : []
            return list.reduce((sum: number, payment: any) => sum + Number(payment?.amount || 0), 0)
          }),
        )

        const paidTotal = settled.reduce((sum, item) => {
          if (item.status === 'fulfilled') {
            return sum + Number(item.value || 0)
          }
          return sum
        }, 0)

        setTotalPayments(paidTotal)
      } catch {
        setTotalPayments(0)
      } finally {
        setLoadingPaymentsSummary(false)
      }
    }

    void fetchPaymentTotals()
  }, [businessId, customerInvoices, quotations, API_BASE])

  // Fetch Statements
  useEffect(() => {
    const fetchStatements = async () => {
      const token = getCookie('token') || getCookie('accessToken')
      if (!token || !customerId) {
        setStatements([])
        return
      }

      if (!statementRange) {
        setStatements([])
        return
      }

      setLoadingStatements(true)
      try {
        const res = await fetch(`${API_BASE}/api/ledger/${encodeURIComponent(customerId)}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'x-business-id': businessId,
          },
          body: JSON.stringify({
            fromDate: statementRange.fromDate,
            toDate: statementRange.toDate,
          }),
        })

        const payload = await res.json()
        if (!res.ok || !payload?.success) {
          throw new Error(payload?.message || 'Failed to load statement data')
        }

        const list = Array.isArray(payload?.data) ? payload.data : []
        const rows: StatementItem[] = list.map((item: any) => {
          const type = String(item?.type || '').toUpperCase()
          const description =
            type === 'INVOICE'
              ? 'Invoice Issued'
              : type === 'PAYMENT'
                ? 'Payment Received'
                : type === 'CREDIT_NOTE'
                  ? 'Credit Note Applied'
                  : type || 'Transaction'

          return {
            date: item?.date ? new Date(item.date).toISOString().split('T')[0] : '-',
            description,
            referenceNumber: String(item?.refNo || '-'),
            debitAmount: Number(item?.debit || 0),
            creditAmount: Number(item?.credit || 0),
            runningBalance: Number(item?.balance || 0),
          }
        })

        setStatements(rows)
      } catch (error: any) {
        setStatements([])
        toast({
          title: 'Failed to load statements',
          description: error?.message || 'Unknown error',
          variant: 'destructive',
        })
      } finally {
        setLoadingStatements(false)
      }
    }

    void fetchStatements()
  }, [API_BASE, businessId, customerId, statementRange])

  // Fetch Quotations
  useEffect(() => {
    const fetchQuotations = async () => {
      const token = getCookie('token') || getCookie('accessToken')
      if (!token || !customerId) return

      setLoadingQuotations(true)
      try {
        const res = await fetch(`${API_BASE}/api/quotation?customerId=${encodeURIComponent(customerId)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-business-id': businessId,
          }
        })
        const data = await res.json()
        if (res.ok && data.success) {
          const list = Array.isArray(data.data) ? data.data : Array.isArray(data.quotations) ? data.quotations : []
          setQuotations(list.filter((q: any) => String(q.customerId) === String(customerId)))
        }
      } catch (err) {
        console.error('Failed to fetch quotations:', err)
      } finally {
        setLoadingQuotations(false)
      }
    }

    fetchQuotations()
  }, [API_BASE, businessId, customerId])

  // Fetch Sales Orders
  useEffect(() => {
    const fetchSalesOrders = async () => {
      const token = getCookie('token') || getCookie('accessToken')
      if (!token || !customerId) return

      setLoadingSalesOrders(true)
      try {
        const res = await fetch(`${API_BASE}/api/salesorder?customerId=${encodeURIComponent(customerId)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-business-id': businessId,
          }
        })
        const data = await res.json()
        if (res.ok && data.success) {
          const list = Array.isArray(data.data) ? data.data : Array.isArray(data.orders) ? data.orders : []
          setSalesOrders(list.filter((so: any) => String(so.customerId) === String(customerId)))
        }
      } catch (err) {
        console.error('Failed to fetch sales orders:', err)
      } finally {
        setLoadingSalesOrders(false)
      }
    }

    fetchSalesOrders()
  }, [API_BASE, businessId, customerId])

  // Fetch Payments List
  useEffect(() => {
    const fetchPayments = async () => {
      const token = getCookie('token') || getCookie('accessToken')
      if (!token || !customerId) return

      setLoadingPaymentsList(true)
      try {
        const res = await fetch(`${API_BASE}/api/payments?limit=1000`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-business-id': businessId,
          }
        })
        const data = await res.json()
        if (res.ok && data.success) {
          const raw = Array.isArray(data.data?.items) ? data.data.items : Array.isArray(data.data) ? data.data : []
          const invoiceIds = new Set(customerInvoices.map((inv: any) => String(inv.id)))
          const quotationIds = new Set(quotations.map((q: any) => String(q.id)))
          
          setPaymentsList(
            raw.filter((p: any) => p.customerId === customerId || invoiceIds.has(String(p.invoiceId)) || quotationIds.has(String(p.quotationId))).map((p: any) => ({
              id: String(p.id),
              invoiceId: String(p.invoiceId || p.quotationId || ''),
              invoiceNumber: String(
                p.invoice?.invoiceNumber || 
                (p.quotation?.projects && p.quotation.projects.length > 0 ? (p.quotation.projects[0].projectName || p.quotation.projects[0].projectCode) : null) || 
                p.quotation?.quoteNumber || 
                (p.customerId && !p.invoiceId && !p.quotationId ? 'Unassigned Advance' : '-')
              ),
              amount: Number(p.amount || 0),
              paymentDate: p.paymentDate ? new Date(p.paymentDate).toISOString().split('T')[0] : '-',
              paymentMode: String(p.paymentMode || 'Cash'),
              transactionId: String(p.transactionId || '-'),
              pdfUrl: String(p.pdfUrl || p.paySlipUrl || ''),
            }))
          )
        }
      } catch (err) {
        console.error('Failed to fetch payments:', err)
      } finally {
        setLoadingPaymentsList(false)
      }
    }

    fetchPayments()
  }, [API_BASE, businessId, customerId, customerInvoices, quotations])

  const downloadStatementPdf = async () => {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in again to download statement PDF.',
        variant: 'destructive',
      })
      return
    }

    if (!statementRange) {
      toast({
        title: 'Date range required',
        description: 'Select a valid statement period to download PDF.',
        variant: 'destructive',
      })
      return
    }

    setDownloadingStatementPdf(true)
    try {
      const response = await fetch(`${API_BASE}/api/ledger/${encodeURIComponent(customerId)}/statement`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-business-id': businessId,
        },
        body: JSON.stringify({
          fromDate: statementRange.fromDate,
          toDate: statementRange.toDate,
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload?.success || !payload?.pdfUrl) {
        throw new Error(payload?.message || 'Failed to generate statement PDF')
      }

      const pdfResponse = await fetch(String(payload.pdfUrl))
      if (!pdfResponse.ok) {
        throw new Error('Unable to download statement PDF file')
      }

      const blob = await pdfResponse.blob()
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `Statement_${String(customer?.company || customerId).replace(/[^a-zA-Z0-9-_]/g, '_')}_${statementRange.fromDate}_to_${statementRange.toDate}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(objectUrl)
    } catch (error: any) {
      toast({
        title: 'Statement download failed',
        description: error?.message || 'Unable to download statement PDF.',
        variant: 'destructive',
      })
    } finally {
      setDownloadingStatementPdf(false)
    }
  }

  const downloadCreditNotePdf = async (note: CreditNoteItem) => {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in again to download the credit note PDF.',
        variant: 'destructive',
      })
      return
    }

    const fallbackDownloadUrl = `${API_BASE}/api/credit-notes/${encodeURIComponent(note.id)}/download`
    const resolvedUrl = String(note.downloadUrl || fallbackDownloadUrl).trim()
    const requestUrl = /^https?:\/\//i.test(resolvedUrl)
      ? resolvedUrl
      : `${API_BASE}${resolvedUrl.startsWith('/') ? resolvedUrl : `/${resolvedUrl}`}`

    setDownloadingCreditNoteId(note.id)
    try {
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
      })

      if (!response.ok) {
        throw new Error('Unable to download credit note PDF.')
      }

      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const safeNumber = String(note.creditNumber || note.id).replace(/[^a-zA-Z0-9-_]/g, '_')

      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `CreditNote_${safeNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(objectUrl)
    } catch (error: any) {
      toast({
        title: 'PDF download failed',
        description: error?.message || 'Unable to download credit note PDF.',
        variant: 'destructive',
      })
    } finally {
      setDownloadingCreditNoteId(null)
    }
  }

  const handleDownloadPaySlip = async (payment: PaymentItem) => {
    let url = payment.pdfUrl ? payment.pdfUrl.trim() : ''

    if (!url) {
      try {
        setDownloadingPaymentId(payment.id)
        const token = getCookie('token') || getCookie('accessToken')

        const res = await fetch(`${API_BASE}/api/payments/${payment.id}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'x-business-id': businessId,
          },
        })

        if (res.ok) {
          const data = await res.json()
          const paymentData = data?.data
          url = String(paymentData?.pdfUrl || paymentData?.paySlipUrl || '').trim()
        }

        if (!url) {
          const generateRes = await fetch(`${API_BASE}/api/payments/${payment.id}/generate-pdf`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'x-business-id': businessId,
            },
          })

          if (generateRes.ok) {
            const generateData = await generateRes.json()
            url = String(generateData?.data?.pdfUrl || generateData?.pdfUrl || '').trim()
          }
        }
      } catch (err) {
        console.error('Failed to fetch/generate payslip URL:', err)
      }
    }

    if (!url) {
      toast({
        title: 'Pay slip unavailable',
        description: 'No PDF URL is available for this payment.',
        variant: 'destructive',
      })
      setDownloadingPaymentId(null)
      return
    }

    setDownloadingPaymentId(payment.id)
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Unable to download pay slip file')

      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const safeInvoiceNumber = String(payment.invoiceNumber || payment.id).replace(/[^a-zA-Z0-9-_]/g, '_').trim()

      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `${safeInvoiceNumber}_pay-slip.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(objectUrl)
    } catch (error: any) {
      toast({
        title: 'Download failed',
        description: error?.message || 'Unable to download pay slip.',
        variant: 'destructive',
      })
    } finally {
      setDownloadingPaymentId(null)
    }
  }

  const backToList = () => {
    navigate(`/dashboard/${businessId}/customers`)
  }

  if (businessLoading || customerLoading) {
    return <DashboardPageSkeleton />
  }

  if (!displayCustomer) {
    return (
      <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-10 pt-0 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <Button variant="ghost" onClick={backToList} className="gap-2">
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="flex items-center justify-center gap-4 py-20">
          <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  const status = customer.isActive ? 'Active' : 'Inactive'
  const address = [customer.address, customer.city, customer.state, customer.zipCode, customer.country]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="grid min-h-svh grid-cols-1 content-start gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0">
      {/* ── Action Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={backToList} className="h-10 w-10 cursor-pointer bg-card shadow-sm border border-border rounded-xl hover:bg-muted">
            <ArrowLeftIcon className="size-4 text-muted-foreground" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{customer.company || 'Untitled Customer'}</h1>
              <Badge variant={customer.isActive ? 'secondary' : 'outline'} className={customer.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-muted text-muted-foreground border-border'}>
                {status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Customer Profile and CRM Dashboard
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <Link to={`/dashboard/${businessId}/quotations/add?customerId=${customerId}`}>
            <Button size="sm" variant="outline" className="h-10 cursor-pointer rounded-xl border-border text-muted-foreground hover:bg-muted font-medium px-4">
              <PlusIcon className="mr-2 size-4" />
              New Quote
            </Button>
          </Link>
          {!isBasic && (
            <Link to={`/dashboard/${businessId}/sales-orders/add?customerId=${customerId}`}>
              <Button size="sm" variant="outline" className="h-10 cursor-pointer rounded-xl border-border text-muted-foreground hover:bg-muted font-medium px-4">
                <PlusIcon className="mr-2 size-4" />
                New Order
              </Button>
            </Link>
          )}
          <Link to={`/dashboard/${businessId}/invoices/add?customerId=${customerId}`}>
            <Button size="sm" variant="outline" className="h-10 cursor-pointer rounded-xl border-border text-muted-foreground hover:bg-muted font-medium px-4">
              <PlusIcon className="mr-2 size-4" />
              New Invoice
            </Button>
          </Link>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-10 cursor-pointer rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-medium px-4"
            onClick={() => {
              navigate(`/dashboard/${businessId}/payments/add?customerId=${customerId}`)
            }}
          >
            <DollarSignIcon className="mr-2 size-4" />
            Add Payment
          </Button>
          <Link to={`/dashboard/${businessId}/customers/${customerId}/edit`}>
            <Button size="sm" className="h-10 cursor-pointer rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium px-4">
              <EditIcon className="mr-2 size-4" />
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* ── KPI Widgets ── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="shadow-sm rounded-2xl border-border bg-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Invoices</CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">{customerInvoices.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm rounded-2xl border-border bg-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Payments</CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              {loadingPaymentsSummary ? 'Loading...' : formatMoney(totalPayments)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm rounded-2xl border-border bg-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outstanding Balance</CardDescription>
            <CardTitle className={`text-2xl font-bold ${outstandingBalance > 0 ? 'text-rose-600' : 'text-foreground'}`}>
              {loadingPaymentsSummary ? 'Loading...' : formatMoney(outstandingBalance)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm rounded-2xl border-border bg-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer Region</CardDescription>
            <CardTitle className="text-lg font-bold text-foreground">{customer.region || '—'}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* ── Tabs System ── */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/80 p-1.5 rounded-2xl w-full justify-start overflow-x-auto h-auto flex-wrap border border-border/60 shadow-sm">
          <TabsTrigger value="overview" className="text-sm font-medium px-4 py-2.5 rounded-xl data-[state=active]:bg-card data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all text-muted-foreground hover:text-foreground hover:bg-slate-200/50 data-[state=active]:hover:bg-card">Overview</TabsTrigger>
          <TabsTrigger value="quotations" className="text-sm font-medium px-4 py-2.5 rounded-xl data-[state=active]:bg-card data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all text-muted-foreground hover:text-foreground hover:bg-slate-200/50 data-[state=active]:hover:bg-card">
            Quotations
            {quotations.length > 0 && <span className="ml-2 bg-slate-200 text-foreground px-2 py-0.5 rounded-full text-xs font-bold">{quotations.length}</span>}
          </TabsTrigger>
          {!isBasic && (
            <TabsTrigger value="orders" className="text-sm font-medium px-4 py-2.5 rounded-xl data-[state=active]:bg-card data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all text-muted-foreground hover:text-foreground hover:bg-slate-200/50 data-[state=active]:hover:bg-card">
              Sales Orders
              {salesOrders.length > 0 && <span className="ml-2 bg-slate-200 text-foreground px-2 py-0.5 rounded-full text-xs font-bold">{salesOrders.length}</span>}
            </TabsTrigger>
          )}
          <TabsTrigger value="invoices" className="text-sm font-medium px-4 py-2.5 rounded-xl data-[state=active]:bg-card data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all text-muted-foreground hover:text-foreground hover:bg-slate-200/50 data-[state=active]:hover:bg-card">
            Invoices
            {customerInvoices.length > 0 && <span className="ml-2 bg-slate-200 text-foreground px-2 py-0.5 rounded-full text-xs font-bold">{customerInvoices.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="payments" className="text-sm font-medium px-4 py-2.5 rounded-xl data-[state=active]:bg-card data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all text-muted-foreground hover:text-foreground hover:bg-slate-200/50 data-[state=active]:hover:bg-card">
            Payments
            {paymentsList.length > 0 && <span className="ml-2 bg-slate-200 text-foreground px-2 py-0.5 rounded-full text-xs font-bold">{paymentsList.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="ledger" className="text-sm font-medium px-4 py-2.5 rounded-xl data-[state=active]:bg-card data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all text-muted-foreground hover:text-foreground hover:bg-slate-200/50 data-[state=active]:hover:bg-card">Statement &amp; Ledger</TabsTrigger>
          <TabsTrigger value="credits" className="text-sm font-medium px-4 py-2.5 rounded-xl data-[state=active]:bg-card data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all text-muted-foreground hover:text-foreground hover:bg-slate-200/50 data-[state=active]:hover:bg-card">
            Credit Notes
            {creditNotes.length > 0 && <span className="ml-2 bg-slate-200 text-foreground px-2 py-0.5 rounded-full text-xs font-bold">{creditNotes.length}</span>}
          </TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <Card className="rounded-2xl shadow-sm border-border bg-card overflow-hidden">
                <CardHeader className="pb-4 border-b border-border bg-muted/50">
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <Building2Icon className="h-5 w-5 text-blue-600" />
                    Customer Profile Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {/* Primary Name */}
                    <div className="bg-muted/50 p-3 sm:p-4 rounded-xl border border-border/60">
                      <div className="flex items-center gap-2 mb-1.5">
                        <UserIcon className="size-4 text-slate-400" />
                        <span className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Primary Name</span>
                      </div>
                      <span className="font-bold text-foreground text-sm sm:text-base pl-6">{String((customer as any)?.name || customer.company || '—')}</span>
                    </div>

                    {/* VAT Number */}
                    <div className="bg-muted/50 p-3 sm:p-4 rounded-xl border border-border/60">
                      <div className="flex items-center gap-2 mb-1.5">
                        <FileTextIcon className="size-4 text-slate-400" />
                        <span className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                          {customer.region === 'INDIA' ? 'GST Number' : (customer.region === 'UAE' || customer.region === 'UNITED_ARAB_EMIRATES') ? 'VAT Number' : 'TAX Number'}
                        </span>
                      </div>
                      <span className="font-bold text-foreground text-sm sm:text-base pl-6 font-mono">{customer.vatNumber || '—'}</span>
                    </div>

                    {/* Email Address */}
                    <div className="bg-muted/50 p-3 sm:p-4 rounded-xl border border-border/60">
                      <div className="flex items-center gap-2 mb-1.5">
                        <MailIcon className="size-4 text-slate-400" />
                        <span className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Email Address</span>
                      </div>
                      <span className="font-bold text-foreground text-sm sm:text-base pl-6 truncate block">{String((customer as any).email || '—')}</span>
                    </div>

                    {/* Phone Number */}
                    <div className="bg-muted/50 p-3 sm:p-4 rounded-xl border border-border/60">
                      <div className="flex items-center gap-2 mb-1.5">
                        <PhoneIcon className="size-4 text-slate-400" />
                        <span className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Phone Number</span>
                      </div>
                      <span className="font-bold text-foreground text-sm sm:text-base pl-6">{customer.phone || '—'}</span>
                    </div>

                    {/* Company HQ Location */}
                    <div className="bg-muted/50 p-3 sm:p-4 rounded-xl border border-border/60 sm:col-span-2">
                      <div className="flex items-center gap-2 mb-1.5">
                        <MapPinIcon className="size-4 text-slate-400" />
                        <span className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Company HQ Location</span>
                      </div>
                      <span className="font-bold text-foreground text-sm sm:text-base pl-6">{address || '—'}</span>
                    </div>

                    {/* Website */}
                    <div className="bg-muted/50 p-3 sm:p-4 rounded-xl border border-border/60">
                      <div className="flex items-center gap-2 mb-1.5">
                        <GlobeIcon className="size-4 text-slate-400" />
                        <span className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Website</span>
                      </div>
                      <div className="pl-6">
                        {customer.website ? (
                          <a href={customer.website.startsWith('http') ? customer.website : `https://${customer.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 hover:underline font-bold text-sm sm:text-base flex items-center gap-1.5 w-max">
                            {customer.website} <ExternalLinkIcon className="size-3.5" />
                          </a>
                        ) : <span className="font-bold text-foreground text-sm sm:text-base">—</span>}
                      </div>
                    </div>

                    {/* Industry Segment */}
                    <div className="bg-muted/50 p-3 sm:p-4 rounded-xl border border-border/60">
                      <div className="flex items-center gap-2 mb-1.5">
                        <BriefcaseIcon className="size-4 text-slate-400" />
                        <span className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Industry Segment</span>
                      </div>
                      <span className="font-bold text-foreground text-sm sm:text-base pl-6">{customer.industry || '—'}</span>
                    </div>

                    {/* Parent Corporation */}
                    <div className="bg-muted/50 p-3 sm:p-4 rounded-xl border border-border/60 sm:col-span-2">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Building2Icon className="size-4 text-slate-400" />
                        <span className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Parent Corporation</span>
                      </div>
                      <div className="pl-6">
                        {customer.parentAccountId ? (
                          <Link to={`/dashboard/${businessId}/customers/${customer.parentAccountId}/view`} className="text-blue-600 hover:text-blue-700 hover:underline font-bold text-sm sm:text-base">
                            {(business?.customers ?? []).find((c: any) => c.id === customer.parentAccountId)?.company || 'View Parent Corporation'}
                          </Link>
                        ) : <span className="font-bold text-foreground text-sm sm:text-base">—</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CRM Profile widget */}
              <Card className="rounded-2xl shadow-sm border-border bg-card overflow-hidden">
                <CardHeader className="pb-4 border-b border-border bg-muted/50">
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <UsersIcon className="h-5 w-5 text-blue-600" />
                    CRM Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 p-4 sm:p-6 grid gap-4 sm:grid-cols-2">
                  <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-start gap-4">
                    <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600 shrink-0 mt-0.5">
                      <DollarSignIcon className="size-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Annual Target Value</span>
                      <span className="text-lg font-bold text-foreground">
                        {customer.annualRevenue ? `${currencySymbol} ${customer.annualRevenue.toLocaleString()}` : '—'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-start gap-4">
                    <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600 shrink-0 mt-0.5">
                      <UsersIcon className="size-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Employee Scale</span>
                      <span className="text-lg font-bold text-foreground">
                        {customer.employeeCount ? `${customer.employeeCount} Members` : '—'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contacts Column */}
            <div>
              <CustomerContacts businessId={businessId} customerId={customerId} />
            </div>
          </div>
        </TabsContent>

        {/* ── Quotations Tab ── */}
        <TabsContent value="quotations">
          <Card className="rounded-2xl shadow-sm border-border bg-card overflow-hidden">
            <CardHeader className="pb-4 border-b border-border flex flex-row items-center justify-between bg-muted/50">
              <div>
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <FileTextIcon className="h-5 w-5 text-blue-600" />
                  Quotations Register
                </CardTitle>
                <CardDescription className="text-sm mt-1">Estimated quotes issued to client</CardDescription>
              </div>
              <Link to={`/dashboard/${businessId}/quotations/add?customerId=${customerId}`}>
                <Button size="sm" className="h-9 cursor-pointer px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium">
                  <PlusIcon className="mr-2 size-4" />
                  Add Quotation
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-6 p-0 sm:p-6">
              {loadingQuotations ? (
                <div className="text-center py-12"><Loader2Icon className="h-8 w-8 animate-spin mx-auto text-blue-600" /></div>
              ) : quotations.length === 0 ? (
                <div className="text-center py-12 bg-muted/50 rounded-xl border border-dashed border-border text-muted-foreground font-medium">No quotations generated for this customer.</div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted">
                      <TableRow>
                        <TableHead className="font-semibold text-foreground">Quote Number</TableHead>
                        <TableHead className="font-semibold text-foreground">Title</TableHead>
                        <TableHead className="font-semibold text-foreground">Issue Date</TableHead>
                        <TableHead className="font-semibold text-foreground">Expiry Date</TableHead>
                        <TableHead className="text-right font-semibold text-foreground">Total Amount</TableHead>
                        <TableHead className="font-semibold text-foreground">Status</TableHead>
                        <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotations.map((q) => (
                        <TableRow key={q.id}>
                          <TableCell className="font-semibold text-foreground">{q.quoteNumber}</TableCell>
                          <TableCell className="text-muted-foreground">{q.title || '—'}</TableCell>
                          <TableCell className="text-muted-foreground">{new Date(q.issueDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-muted-foreground">{q.expiryDate ? new Date(q.expiryDate).toLocaleDateString() : '—'}</TableCell>
                          <TableCell className="text-right font-semibold font-mono text-foreground"><span className="font-semibold">{formatMoney(q.totalAmount)}</span></TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs font-semibold bg-muted text-foreground border-border">
                              {q.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link to={`/dashboard/${businessId}/quotations/${q.id}`}>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                <EyeIcon className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Sales Orders Tab ── */}
        {!isBasic && (
          <TabsContent value="orders">
          <Card className="rounded-2xl shadow-sm border-border bg-card overflow-hidden">
            <CardHeader className="pb-4 border-b border-border flex flex-row items-center justify-between bg-muted/50">
              <div>
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <FileCheckIcon className="h-5 w-5 text-blue-600" />
                  Sales Orders Log
                </CardTitle>
                <CardDescription className="text-sm mt-1">Approved order pipelines in production</CardDescription>
              </div>
              <Link to={`/dashboard/${businessId}/sales-orders/add?customerId=${customerId}`}>
                <Button size="sm" className="h-9 cursor-pointer px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium">
                  <PlusIcon className="mr-2 size-4" />
                  Create Sales Order
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-6 p-0 sm:p-6">
              {loadingSalesOrders ? (
                <div className="text-center py-12"><Loader2Icon className="h-8 w-8 animate-spin mx-auto text-blue-600" /></div>
              ) : salesOrders.length === 0 ? (
                <div className="text-center py-12 bg-muted/50 rounded-xl border border-dashed border-border text-muted-foreground font-medium">No sales orders active for this customer.</div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted">
                      <TableRow>
                        <TableHead className="font-semibold text-foreground">Order Number</TableHead>
                        <TableHead className="font-semibold text-foreground">Order Date</TableHead>
                        <TableHead className="font-semibold text-foreground">Delivery Date</TableHead>
                        <TableHead className="text-right font-semibold text-foreground">Total Amount</TableHead>
                        <TableHead className="font-semibold text-foreground">Status</TableHead>
                        <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesOrders.map((so) => (
                        <TableRow key={so.id}>
                          <TableCell className="font-semibold text-foreground">{so.orderNumber}</TableCell>
                          <TableCell className="text-muted-foreground">{new Date(so.orderDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-muted-foreground">{so.deliveryDate ? new Date(so.deliveryDate).toLocaleDateString() : '—'}</TableCell>
                          <TableCell className="text-right font-semibold font-mono text-foreground"><span className="font-semibold">{formatMoney(so.totalAmount)}</span></TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs font-semibold bg-muted text-foreground border-border">
                              {so.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link to={`/dashboard/${businessId}/sales-orders/${so.id}`}>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                <EyeIcon className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
          </TabsContent>
        )}

        {/* ── Invoices Tab ── */}
        <TabsContent value="invoices">
          <Card className="rounded-2xl shadow-sm border-border bg-card overflow-hidden">
            <CardHeader className="pb-4 border-b border-border flex flex-row items-center justify-between bg-muted/50">
              <div>
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <ReceiptIcon className="h-5 w-5 text-blue-600" />
                  Invoices Register
                </CardTitle>
                <CardDescription className="text-sm mt-1">Billed invoices status and outstanding payments</CardDescription>
              </div>
              <Link to={`/dashboard/${businessId}/invoices/add?customerId=${customerId}`}>
                <Button size="sm" className="h-9 cursor-pointer px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium">
                  <PlusIcon className="mr-2 size-4" />
                  Issue Invoice
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-6 p-0 sm:p-6">
              {customerInvoices.length === 0 ? (
                <div className="text-center py-12 bg-muted/50 rounded-xl border border-dashed border-border text-muted-foreground font-medium">No billing records found.</div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted">
                      <TableRow>
                        <TableHead className="font-semibold text-foreground">Invoice Number</TableHead>
                        <TableHead className="font-semibold text-foreground">Issue Date</TableHead>
                        <TableHead className="font-semibold text-foreground">Due Date</TableHead>
                        <TableHead className="text-right font-semibold text-foreground">Amount</TableHead>
                        <TableHead className="font-semibold text-foreground">Payment Status</TableHead>
                        <TableHead className="text-right font-semibold text-foreground">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerInvoices.map((inv: any) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-semibold text-foreground">{inv.invoiceNumber}</TableCell>
                          <TableCell className="text-muted-foreground">{new Date(inv.issueDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-muted-foreground">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</TableCell>
                          <TableCell className="text-right font-semibold font-mono text-foreground"><span className="font-semibold">{formatMoney(inv.grandTotal)}</span></TableCell>
                          <TableCell>
                            <Badge variant={inv.paymentStatus === 'PAID' ? 'secondary' : 'destructive'} className={`text-xs ${inv.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200' : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200'}`}>
                              {inv.paymentStatus || 'UNPAID'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link to={`/dashboard/${businessId}/invoices`}>
                              <Button size="sm" variant="ghost" className="h-8 gap-1 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium">
                                View Ledger
                                <ChevronRightIcon className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Payments Tab ── */}
        <TabsContent value="payments">
          <Card className="rounded-2xl shadow-sm border-border bg-card overflow-hidden">
            <CardHeader className="pb-4 border-b border-border bg-muted/50">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <CreditCardIcon className="h-5 w-5 text-blue-600" />
                Payments Received
              </CardTitle>
              <CardDescription className="text-sm mt-1">Receipt entries logged for customer invoices</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 p-0 sm:p-6">
              {loadingPaymentsList ? (
                <div className="text-center py-12"><Loader2Icon className="h-8 w-8 animate-spin mx-auto text-blue-600" /></div>
              ) : paymentsList.length === 0 ? (
                <div className="text-center py-12 bg-muted/50 rounded-xl border border-dashed border-border text-muted-foreground font-medium">No payment records logged.</div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted">
                      <TableRow>
                        <TableHead className="font-semibold text-foreground">Txn ID</TableHead>
                        <TableHead className="font-semibold text-foreground">Reference</TableHead>
                        <TableHead className="font-semibold text-foreground">Payment Date</TableHead>
                        <TableHead className="font-semibold text-foreground">Payment Mode</TableHead>
                        <TableHead className="text-right font-semibold text-foreground">Amount Received</TableHead>
                        <TableHead className="text-right font-semibold text-foreground">Payslip PDF</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentsList.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-semibold text-foreground">{p.transactionId}</TableCell>
                          <TableCell className="text-muted-foreground">{p.invoiceNumber}</TableCell>
                          <TableCell className="text-muted-foreground">{p.paymentDate}</TableCell>
                          <TableCell className="text-muted-foreground">{p.paymentMode}</TableCell>
                          <TableCell className="text-right font-semibold font-mono text-emerald-600"><span className="font-semibold">{formatMoney(p.amount)}</span></TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs cursor-pointer h-8 rounded-lg border-border text-muted-foreground hover:bg-muted font-medium"
                              onClick={() => void handleDownloadPaySlip(p)}
                              disabled={downloadingPaymentId === p.id}
                            >
                              {downloadingPaymentId === p.id ? (
                                <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />
                              ) : (
                                <DownloadIcon className="mr-1.5 size-3.5" />
                              )}
                              Receipt
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Statement Tab ── */}
        <TabsContent value="ledger">
          <Card className="rounded-2xl shadow-sm border-border bg-card overflow-hidden">
            <CardHeader className="pb-4 border-b border-border bg-muted/50">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <ArrowDownToLineIcon className="size-5 text-blue-600" />
                    Ledger Statement
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">Customer accounts balance log for audit audits</CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Select value={statementPeriod} onValueChange={(value) => setStatementPeriod(value as StatementPeriod)}>
                    <SelectTrigger className="h-9 w-44 cursor-pointer rounded-xl border-border text-sm bg-card font-medium">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border">
                      <SelectItem value="day" className="rounded-lg text-sm">Last Day</SelectItem>
                      <SelectItem value="month" className="rounded-lg text-sm">Last Month</SelectItem>
                      <SelectItem value="year" className="rounded-lg text-sm">Last Year</SelectItem>
                      <SelectItem value="custom" className="rounded-lg text-sm">Custom Date Range</SelectItem>
                    </SelectContent>
                  </Select>

                  {statementPeriod === 'custom' ? (
                    <>
                      <Input
                        type="date"
                        value={customFromDate}
                        onChange={(e) => setCustomFromDate(e.target.value)}
                        className="h-9 w-40 rounded-xl border-border text-sm bg-card font-medium"
                      />
                      <Input
                        type="date"
                        value={customToDate}
                        onChange={(e) => setCustomToDate(e.target.value)}
                        className="h-9 w-40 rounded-xl border-border text-sm bg-card font-medium"
                      />
                    </>
                  ) : null}

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-4 cursor-pointer rounded-xl border-border text-muted-foreground hover:bg-muted font-medium"
                    onClick={() => void downloadStatementPdf()}
                    disabled={downloadingStatementPdf || !statementRange}
                  >
                    {downloadingStatementPdf ? (
                      <Loader2Icon className="mr-2 size-4 animate-spin" />
                    ) : (
                      <DownloadIcon className="mr-2 size-4" />
                    )}
                    Download PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 p-0 sm:p-6">
              {!statementRange ? (
                <div className="py-14 text-center text-sm text-muted-foreground font-medium bg-muted/50 rounded-xl border border-dashed border-border">
                  Select both From and To dates for custom range.
                </div>
              ) : loadingStatements ? (
                <div className="flex items-center justify-center py-14 text-sm text-muted-foreground font-medium">
                  <Loader2Icon className="mr-2 size-6 animate-spin text-blue-600" /> Loading statements...
                </div>
              ) : statements.length === 0 ? (
                <div className="py-14 text-center text-sm text-muted-foreground font-medium bg-muted/50 rounded-xl border border-dashed border-border">No Records Found</div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted">
                      <TableRow>
                        <TableHead className="font-semibold text-foreground">Date</TableHead>
                        <TableHead className="font-semibold text-foreground">Description</TableHead>
                        <TableHead className="font-semibold text-foreground">Reference Number</TableHead>
                        <TableHead className="text-right font-semibold text-foreground">Debit Amount</TableHead>
                        <TableHead className="text-right font-semibold text-foreground">Credit Amount</TableHead>
                        <TableHead className="text-right font-semibold text-foreground">Running Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statements.map((row, index) => (
                        <TableRow key={`${row.referenceNumber}-${row.date}-${index}`}>
                          <TableCell className="text-sm font-medium text-foreground">{row.date}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{row.description}</TableCell>
                          <TableCell className="text-sm font-medium text-muted-foreground">{row.referenceNumber}</TableCell>
                          <TableCell className="text-right text-sm font-medium text-rose-600 font-mono">
                            {row.debitAmount > 0 ? formatMoney(row.debitAmount) : '-'}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium text-emerald-600 font-mono">
                            {row.creditAmount > 0 ? formatMoney(row.creditAmount) : '-'}
                          </TableCell>
                          <TableCell className="text-right text-sm font-bold text-foreground font-mono">
                            {formatMoney(row.runningBalance)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Credit Notes Tab ── */}
        <TabsContent value="credits">
          <Card className="rounded-2xl shadow-sm border-border bg-card overflow-hidden">
            <CardHeader className="pb-4 border-b border-border bg-muted/50">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <ArrowDownToLineIcon className="size-5 text-blue-600" />
                Credit Notes
              </CardTitle>
              <CardDescription className="text-sm mt-1">Related credit notes for this customer</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 p-0 sm:p-6">
              {loadingCreditNotes ? (
                <div className="flex items-center justify-center py-12 text-sm text-muted-foreground font-medium">
                  <Loader2Icon className="mr-2 size-8 animate-spin text-blue-600" />
                </div>
              ) : creditNotes.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground font-medium bg-muted/50 rounded-xl border border-dashed border-border">No Credit Notes Found</div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted">
                      <TableRow>
                        <TableHead className="font-semibold text-foreground">Credit Note Number</TableHead>
                        <TableHead className="font-semibold text-foreground">Related Invoice Number</TableHead>
                        <TableHead className="font-semibold text-foreground">Issue Date</TableHead>
                        <TableHead className="font-semibold text-foreground">Amount</TableHead>
                        <TableHead className="font-semibold text-foreground">Status</TableHead>
                        <TableHead className="text-right font-semibold text-foreground">PDF</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {creditNotes.map((note) => (
                        <TableRow key={note.id}>
                          <TableCell className="font-semibold text-sm text-foreground">{note.creditNumber}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{note.invoiceNumber}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarIcon className="size-4 text-slate-400" />
                              {note.issueDate}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            <span className="inline-flex items-center gap-1.5 font-semibold text-foreground font-mono">
                              <DollarSignIcon className="size-4 text-slate-400" />
                              {formatMoney(note.amount)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={note.status === 'CLOSED' ? 'secondary' : 'outline'} className={`text-xs ${note.status === 'CLOSED' ? 'bg-muted text-foreground border-border' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'}`}>{note.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs cursor-pointer h-8 rounded-lg border-border text-muted-foreground hover:bg-muted font-medium"
                              onClick={() => void downloadCreditNotePdf(note)}
                              disabled={downloadingCreditNoteId === note.id}
                            >
                              {downloadingCreditNoteId === note.id ? (
                                <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />
                              ) : (
                                <DownloadIcon className="mr-1.5 size-3.5" />
                              )}
                              Download PDF
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
    </div>
  )
}
