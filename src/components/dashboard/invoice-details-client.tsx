import * as React from 'react'
import {  useNavigate  } from 'react-router-dom';
import { invoicesAPI, Invoice } from '@/lib/api/invoices'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileCheck,
  FileSignature,
  FileText,
  Loader2,
  Sparkles,
  XCircle,
  Building2,
  Calendar,
  AlertCircle,
  Info,
  Banknote,
  Receipt,
  Download
} from 'lucide-react'
import { toast } from 'sonner'
import { getCookie } from '@/lib/utils'
import { useBusinessData } from '@/components/dashboard/business-data-provider'

interface InvoiceDetailsClientProps {
  businessId: string
  invoiceId: string
}

const STATUS_CONFIG: Record<string, { style: string; icon: React.ReactNode }> = {
  UNPAID: {
    style: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  Unpaid: {
    style: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  PARTIALLY_PAID: {
    style: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <Sparkles className="h-3.5 w-3.5" />,
  },
  Partially_Paid: {
    style: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <Sparkles className="h-3.5 w-3.5" />,
  },
  PAID: {
    style: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  Paid: {
    style: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
}

export function InvoiceDetailsClient({ businessId, invoiceId }: InvoiceDetailsClientProps) {
  const navigate = useNavigate()
  const [invoice, setInvoice] = React.useState<Invoice | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [actionLoading, setActionLoading] = React.useState(false)
  const [pdfLoading, setPdfLoading] = React.useState(false)
  const { business, role } = useBusinessData()

  const isOwner = React.useMemo(() => {
    if (role?.name?.toLowerCase() === 'owner') return true;
    
    // Check if the user is the actual business creator/owner by decoding token
    const token = getCookie('token') || getCookie('accessToken');
    if (token) {
      try {
        const parts = token.split('.')
        if (parts.length >= 2) {
          const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
          const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
          const decoded = JSON.parse(atob(padded))
          const userId = decoded.userId || decoded.id;
          if (userId && business?.ownerId && userId === business.ownerId) {
            return true;
          }
        }
      } catch (e) {
        // ignore decoding errors
      }
    }
    return false;
  }, [role, business])

  const isBasic = business?.businessType?.toLowerCase() === 'basic'
  const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/$/, '')

  const [payments, setPayments] = React.useState<any[]>([])
  const [expenses, setExpenses] = React.useState<any[]>([])
  const [finLoading, setFinLoading] = React.useState(false)

  const loadFinancials = React.useCallback(async () => {
    if (!isBasic || !invoiceId) return;
    try {
      setFinLoading(true)
      const token = getCookie('token') || getCookie('accessToken')
      const headers = { Authorization: `Bearer ${token}`, 'x-business-id': businessId }
      
      const [payRes, expRes] = await Promise.all([
        fetch(`${API_BASE}/api/payments/invoice/${encodeURIComponent(invoiceId)}`, { headers }).then(r => r.json()),
        fetch(`${API_BASE}/api/expenses?referenceId=${encodeURIComponent(invoiceId)}`, { headers }).then(r => r.json())
      ])

      if (payRes?.success && Array.isArray(payRes.data)) {
        setPayments(payRes.data)
      }
      if (expRes?.success && Array.isArray(expRes.data)) {
        setExpenses(expRes.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setFinLoading(false)
    }
  }, [businessId, invoiceId, isBasic, API_BASE])

  React.useEffect(() => {
    loadFinancials()
  }, [loadFinancials])

  const loadInvoice = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await invoicesAPI.getInvoiceById(businessId, invoiceId)
      if (response.success) {
        setInvoice(response.invoice || response.data)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch invoice')
    } finally {
      setLoading(false)
    }
  }, [businessId, invoiceId])

  React.useEffect(() => {
    loadInvoice()
  }, [loadInvoice])

  const handleApprove = async () => {
    try {
      setActionLoading(true)
      await invoicesAPI.changeStatus(businessId, invoiceId, 'APPROVED')
      toast.success('Invoice approved successfully')
      loadInvoice()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve invoice')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDownloadPdf = async () => {
    try {
      setPdfLoading(true)
      const downloadUrl = `${API_BASE}/api/invoices/${encodeURIComponent(invoiceId)}/download-pdf?token=${getCookie('token') || getCookie('accessToken')}&x-business-id=${businessId}`
      const a = document.createElement('a')
      a.href = downloadUrl
      a.target = '_self'
      a.download = `Invoice_${invoice!.invoiceNumber || invoiceId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success('Invoice PDF downloading')
    } catch (error) {
      toast.error('Failed to download PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-background p-6 text-muted-foreground">
        <AlertCircle className="h-10 w-10 mb-4 text-slate-400" />
        <p className="text-lg font-semibold text-foreground">Invoice Not Found</p>
        <p className="text-sm">The invoice you are looking for does not exist or was removed.</p>
        <Button variant="outline" className="mt-6 rounded-xl cursor-pointer" onClick={() => navigate(`/dashboard/${businessId}/invoices`)}>
          Return to Directory
        </Button>
      </div>
    )
  }

  const statusKey = invoice.status
  const statusConf = STATUS_CONFIG[statusKey] || {
    style: 'bg-muted text-foreground border-border',
    icon: <Clock className="h-3.5 w-3.5" />,
  }

  const formatCurrency = (v: number, curr?: string) => {
    const c = curr || invoice.currency || 'INR';
    return new Intl.NumberFormat(c === 'CAD' ? 'en-CA' : 'en-IN', { style: 'currency', currency: c }).format(Number(v || 0));
  }

  const isUnpaid = statusKey === 'UNPAID'
  const isPaid = statusKey === 'PAID' || statusKey === 'Paid'
  const isPartiallyPaid = statusKey === 'PARTIALLY_PAID' || statusKey === 'Partial' || statusKey === 'partially_paid'

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm w-full">
        <div className="flex items-start md:items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/dashboard/${businessId}/invoices`)}
            className="h-10 cursor-pointer w-10 rounded-xl hover:bg-muted text-muted-foreground shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{invoice.invoiceNumber}</h1>
              <Badge variant="outline" className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusConf.style}`}>
                {statusConf.icon}
                <span className="uppercase tracking-wide">{invoice.status}</span>
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1 font-medium flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              {invoice.customer?.company || invoice.customer?.name || 'Unknown Customer'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
          {actionLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400 mr-2" />}
          
          {isOwner && isUnpaid && (
            <Button
              onClick={() => navigate(`/dashboard/${businessId}/invoices/payment?invoiceId=${invoiceId}`)}
              disabled={actionLoading}
              className="h-10 rounded-xl cursor-pointer gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm w-full md:w-auto"
            >
              <Banknote className="h-4 w-4" />
              Record Payment
            </Button>
          )}

          {isBasic && (
            <Button
              variant="outline"
              onClick={() => navigate(`/dashboard/${businessId}/expenses/add?invoiceId=${invoiceId}`)}
              className="h-10 rounded-xl cursor-pointer gap-2 border-orange-200 text-orange-700 hover:bg-orange-50 font-semibold bg-card w-full md:w-auto"
            >
              <Receipt className="h-4 w-4" />
              Add Expense
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            className="h-10 rounded-xl cursor-pointer gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold bg-card w-full md:w-auto"
          >
            {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 relative">
        {isPaid && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-[0.05] overflow-hidden">
            <div className="transform -rotate-12 border-[12px] border-emerald-700 text-emerald-700 text-[140px] font-black uppercase tracking-widest px-16 py-8 rounded-[3rem] whitespace-nowrap">
              PAID
            </div>
          </div>
        )}
        {/* ── Left Column: Metadata & Details ── */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-border shadow-sm bg-card overflow-hidden">
            <CardHeader className="pb-4 border-b border-border bg-muted/50">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Line Items & Financial Summary
              </CardTitle>
              <CardDescription className="text-muted-foreground font-medium">Detailed breakdown of products, services, and pricing.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/80 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                      {isBasic ? (
                        <>
                          <th className="p-4 w-[25%]">Item Name</th>
                          <th className="p-4 w-[35%]">Description</th>
                        </>
                      ) : (
                        <th className="p-4 w-[35%]">Item &amp; Description</th>
                      )}
                      {!isBasic && (
                        <th className="p-4 text-center">{invoice.items && invoice.items[0]?.itemType === 'SERVICE' ? 'SAC' : 'HSN'}</th>
                      )}
                      <th className="p-4 text-center">
                        {isBasic ? 'QTY' : (
                          invoice.items && invoice.items.length > 0 ? (
                            invoice.items[0].itemType === 'SERVICE' ? 'HRS' :
                            ['kg', 'gram', 'meter', 'litre'].includes((invoice.items[0].unit || '').toLowerCase()) ? invoice.items[0].unit?.toUpperCase() : 'QTY'
                          ) : 'QTY'
                        )}
                      </th>
                      <th className="p-4 text-right">Rate</th>
                      {!isBasic && (
                        <th className="p-4 text-right">Tax %</th>
                      )}
                      <th className="p-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items?.map((item) => (
                      <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                        {isBasic ? (
                          <>
                            <td className="p-4 align-top">
                              <p className="font-bold text-foreground">{item.itemName || (item.description ? item.description.substring(0, 50) : '—')}</p>
                            </td>
                            <td className="p-4 align-top">
                              <p className="text-muted-foreground whitespace-pre-wrap">{item.description || '—'}</p>
                            </td>
                          </>
                        ) : (
                          <td className="p-4 align-top">
                            <p className="font-bold text-foreground">{item.description}</p>
                            {item.itemType && (
                              <span className="inline-block mt-1 text-[10px] font-bold tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded uppercase">
                                {item.itemType}
                              </span>
                            )}
                          </td>
                        )}
                        {!isBasic && (
                          <td className="p-4 text-center font-mono text-muted-foreground">{item.hsnSacCode || '—'}</td>
                        )}
                        <td className="p-4 text-center font-medium text-foreground">{item.quantity}</td>
                        <td className="p-4 text-right font-mono text-muted-foreground">{formatCurrency(item.rate || 0, invoice.currency)}</td>
                        {!isBasic && (
                          <td className="p-4 text-right font-mono text-muted-foreground">{item.taxPercent ? `${item.taxPercent}%` : '0%'}</td>
                        )}
                        <td className="p-4 text-right font-mono font-bold text-foreground">{formatCurrency(item.total, invoice.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Breakdown */}
              <div className="p-6 bg-muted/30 border-t border-border flex justify-end">
                <div className="w-full max-w-sm space-y-3 text-sm">
                  <div className="flex justify-between text-muted-foreground font-medium">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                  </div>
                  {invoice.totalTax !== undefined && invoice.totalTax !== null && invoice.totalTax > 0 && (
                    <div className="flex justify-between text-muted-foreground font-medium">
                      <span>Overall Tax</span>
                      <span className="font-mono">{formatCurrency(invoice.totalTax, invoice.currency)}</span>
                    </div>
                  )}
                  {invoice.discount !== undefined && invoice.discount !== null && invoice.discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Discount</span>
                      <span className="font-mono">-{formatCurrency(invoice.discount, invoice.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center border-t border-border pt-4 mt-2">
                    <span className="text-base font-bold text-foreground">Total Amount</span>
                    <span className="text-xl font-mono font-black text-blue-700">{formatCurrency(invoice.grandTotal, invoice.currency)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Financial Summary */}
          {isBasic && (
            <Card className="rounded-2xl border-border shadow-sm bg-card overflow-hidden mt-6">
              <CardHeader className="pb-4 border-b border-border bg-muted/50">
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-emerald-600" />
                  Invoice Financial Summary
                </CardTitle>
                <CardDescription className="text-muted-foreground font-medium">Summary of payments received and expenses incurred for this invoice.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {finLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-2 p-4 rounded-xl bg-blue-50 border border-blue-100">
                      <span className="text-sm font-bold uppercase tracking-wider text-blue-600">Total Received</span>
                      <span className="text-2xl font-black text-blue-700">
                        {formatCurrency(payments.reduce((sum, p) => sum + Number(p.amount || 0), 0), invoice.currency)}
                      </span>
                      <span className="text-xs font-medium text-blue-600/70">{payments.length} payment(s)</span>
                    </div>
                    <div className="flex flex-col gap-2 p-4 rounded-xl bg-rose-50 border border-rose-100">
                      <span className="text-sm font-bold uppercase tracking-wider text-rose-600">Total Expenses</span>
                      <span className="text-2xl font-black text-rose-700">
                        {formatCurrency(expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0), invoice.currency)}
                      </span>
                      <span className="text-xs font-medium text-rose-600/70">{expenses.length} expense(s)</span>
                    </div>
                    <div className="flex flex-col gap-2 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                      <span className="text-sm font-bold uppercase tracking-wider text-emerald-600">Net Profit</span>
                      <span className="text-2xl font-black text-emerald-700">
                        {formatCurrency(
                          payments.reduce((sum, p) => sum + Number(p.amount || 0), 0) - 
                          expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0), 
                          invoice.currency
                        )}
                      </span>
                    </div>
                  </div>
                  
                  {/* Detailed Lists */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 mt-6 border-t border-border">
                    <div className="flex flex-col gap-4">
                      <h4 className="text-sm font-bold text-foreground">Payments Received</h4>
                      {payments.length === 0 ? (
                        <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-xl text-center border border-dashed">No payments recorded yet.</div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {payments.map((p, i) => (
                            <div key={p.id || i} className="flex justify-between items-center p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-colors">
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-foreground">{p.paymentMode || 'Payment'}</span>
                                <span className="text-xs text-muted-foreground">{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : 'No date'}</span>
                              </div>
                              <span className="text-sm font-bold text-blue-600">
                                {formatCurrency(p.amount, invoice.currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      <h4 className="text-sm font-bold text-foreground">Expenses Incurred</h4>
                      {expenses.length === 0 ? (
                        <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-xl text-center border border-dashed">No expenses recorded yet.</div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {expenses.map((e, i) => (
                            <div key={e.id || i} className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-colors">
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-foreground line-clamp-1">{e.title || e.category || 'Expense'}</span>
                                <span className="text-xs text-muted-foreground">{e.date ? new Date(e.date).toLocaleDateString() : 'No date'}</span>
                              </div>
                              <span className="text-sm font-bold text-rose-600 shrink-0">
                                {formatCurrency(e.amount, invoice.currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              </CardContent>
            </Card>
          )}
          {/* Notes */}
          {invoice.notes && (
            <Card className="rounded-2xl border-border shadow-sm bg-card overflow-hidden">
              <CardHeader className="pb-3 border-b border-border bg-muted/50">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Info className="h-4 w-4 text-slate-400" />
                  Terms &amp; Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right Column: Sidebar Meta ── */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <Card className="rounded-2xl border-border shadow-sm bg-card overflow-hidden">
            <CardHeader className="pb-4 border-b border-border bg-muted/50">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer</span>
                <span className="font-bold text-foreground text-base">{invoice.customer?.company || invoice.customer?.name || '—'}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="flex flex-col gap-1">
                   <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Issue Date</span>
                   <span className="font-semibold text-foreground">{new Date((invoice.issueDate || invoice.invoiceDate) as string).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                 </div>
                 {(invoice.expiryDate || invoice.dueDate) && (
                   <div className="flex flex-col gap-1">
                     <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Expiry Date</span>
                     <span className="font-semibold text-rose-600">{new Date((invoice.expiryDate || invoice.dueDate)!).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                   </div>
                )}
              </div>
              {invoice.deal && (
                <div className="flex flex-col gap-1 pt-2 border-t border-border">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Linked Deal</span>
                  <span className="font-bold text-blue-600">{invoice.deal.name}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Workflow Progress */}
          <Card className="rounded-2xl border-border shadow-sm bg-card overflow-hidden">
            <CardHeader className="pb-4 border-b border-border bg-muted/50">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-emerald-500" />
                Workflow Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative pl-6 border-l-2 border-border space-y-6 text-sm">
                {/* Draft Step */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-0 bg-blue-100 text-blue-600 rounded-full h-4 w-4 border-2 border-white flex items-center justify-center shadow-sm" />
                  <div>
                    <p className="font-bold text-foreground">Invoice Drafted</p>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">{new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
                {/* Paid Step */}
                <div className="relative">
                  <span className={`absolute -left-[31px] top-0 rounded-full h-4 w-4 border-2 border-white flex items-center justify-center shadow-sm ${(isPaid || isPartiallyPaid) ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  <div>
                    <p className={`font-bold ${(isPaid || isPartiallyPaid) ? 'text-foreground' : 'text-slate-400'}`}>{isPaid ? 'Fully Paid' : (isPartiallyPaid ? 'Partially Paid' : 'Payment Pending')}</p>
                    {(isPaid || isPartiallyPaid) && <p className="text-xs text-emerald-600 font-medium mt-0.5">Payment(s) received</p>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

