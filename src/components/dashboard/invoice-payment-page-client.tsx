import { toast } from 'sonner';
import React, { useEffect, useMemo, useState } from 'react'
import {  useNavigate  } from 'react-router-dom';
import { ArrowLeftIcon, Loader2Icon, Wallet, FileText, CheckCircle2, ArrowUpRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { normalizeInvoiceStatus, type InvoiceStatus } from '@/lib/invoice-status'
import { getCurrencySymbol, CURRENCIES } from '@/lib/currencies'
import { creditNotesAPI, CreditNote } from '@/lib/api/credit-notes'
import { CurrencySelect } from '@/components/ui/currency-select'

export function InvoicePaymentPageClient({
  businessId,
  invoiceId,
  customerId,
}: {
  businessId: string
  invoiceId?: string
  customerId?: string
}) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { business, refresh } = useBusinessData()
  const [isSavingPayment, setIsSavingPayment] = useState(false)
  const [isLoadingPaymentSummary, setIsLoadingPaymentSummary] = useState(false)
  const [remainingAmount, setRemainingAmount] = useState(0)
  const [invoicePaymentStatus, setInvoicePaymentStatus] = useState<InvoiceStatus>('UNPAID')

  const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '')

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\^])/g, '\\$1') + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : ''
  }

  const getClientBusinessId = () => {
    if (typeof window === 'undefined') return ''
    const fromStorage = window.localStorage.getItem('activeBusinessId') || ''
    const fromCookie = getCookie('activeBusinessId')
    const fromPath = window.location.pathname.match(/\/dashboard\/([^/]+)/)?.[1] || ''
    return fromStorage || fromCookie || fromPath
  }

  const [selectedTargetInvoiceId, setSelectedTargetInvoiceId] = useState<string>(invoiceId || '')
  const targetInvoiceId = invoiceId || selectedTargetInvoiceId || ''
  const [fetchedInvoice, setFetchedInvoice] = useState<any>(null)
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false)

  const invoice = useMemo(() => {
    if (fetchedInvoice) return fetchedInvoice
    if (!targetInvoiceId) return null
    return (business?.invoices ?? []).find((inv: any) => inv.id === targetInvoiceId) ?? null
  }, [fetchedInvoice, business, targetInvoiceId])
  
  const [pendingInvoices, setPendingInvoices] = useState<any[]>([])
  const [isLoadingPending, setIsLoadingPending] = useState(false)
  const [availableCreditNotes, setAvailableCreditNotes] = useState<CreditNote[]>([])
  const [availableAdvancePayments, setAvailableAdvancePayments] = useState<any[]>([])
  const [isAllocatingAdvance, setIsAllocatingAdvance] = useState<string | null>(null)
  
  const isBasic = business?.businessType?.toLowerCase() === 'basic'

  useEffect(() => {
    if (invoiceId) {
      setSelectedTargetInvoiceId(invoiceId)
    }
  }, [invoiceId])

  const targetBusinessId = businessId || business?.id || getClientBusinessId() || ''

  // Fetch invoice directly from API when targetInvoiceId is available
  const fetchInvoiceData = React.useCallback(async () => {
    if (!targetInvoiceId) return
    setIsLoadingInvoice(true)
    try {
      const token = getCookie('token') || getCookie('accessToken')
      const res = await fetch(`${API_BASE}/api/invoices/${encodeURIComponent(targetInvoiceId)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-business-id': targetBusinessId,
        },
      })
      const data = await res.json()
      if (data?.success && (data?.data || data?.invoice)) {
        setFetchedInvoice(data.data || data.invoice)
      }
    } catch (err) {
      console.error('Failed to fetch invoice for payment:', err)
    } finally {
      setIsLoadingInvoice(false)
    }
  }, [targetInvoiceId, targetBusinessId, API_BASE])

  useEffect(() => {
    void fetchInvoiceData()
  }, [fetchInvoiceData])

  useEffect(() => {
    if (!invoiceId && customerId) {
      const fetchPending = async () => {
        setIsLoadingPending(true)
        try {
          const token = getCookie('token') || getCookie('accessToken')
          const endpoint = `${API_BASE}/api/invoices?customerId=${customerId}&status=SENT,PARTIALLY_PAID`
          const res = await fetch(endpoint, {
            headers: { Authorization: `Bearer ${token}`, 'x-business-id': targetBusinessId }
          })
          const data = await res.json()
          if (data.success) {
            setPendingInvoices(data.invoices)
          }
        } catch (err) {
          console.error(err)
        } finally {
          setIsLoadingPending(false)
        }
      }
      fetchPending()
    }
  }, [invoiceId, customerId, API_BASE, targetBusinessId])

  const invoiceAmount = useMemo(() => Number(invoice?.grandTotal || 0), [invoice])
  // Inherit currency from invoice — read-only, not user selectable
  const invoiceCurrency = (invoice as any)?.currency || ''
  const invoiceCurrencySymbol = getCurrencySymbol(invoiceCurrency) || (invoice as any)?.currencySymbol || ''
  const invoiceDate = useMemo(() => {
    const baseDate = invoice?.dueDate || invoice?.invoiceDate
    if (!baseDate) return new Date().toISOString().split('T')[0]
    return new Date(baseDate).toISOString().split('T')[0]
  }, [invoice])

  const [paymentForm, setPaymentForm] = useState({
    amountReceived: '',
    paymentDate: '',
    paymentMode: '',
    transactionId: '',
    note: '',
    creditNoteId: 'none',
    currency: '',
  })

  useEffect(() => {
    if (!invoice) return
    const currentPaid = Number(invoice.amountPaid || 0)
    const currentGrandTotal = Number(invoice.grandTotal || 0)
    const remaining = Math.max(currentGrandTotal - currentPaid, 0)
    setPaymentForm((prev) => ({
      ...prev,
      amountReceived: String(remaining > 0 ? remaining : 0),
      paymentDate: prev.paymentDate || new Date().toISOString().split('T')[0],
      currency: prev.currency || invoice.currency || business?.baseCurrency?.code || 'AED',
    }))
  }, [invoice, business])

  const loadPaymentSummary = React.useCallback(async () => {
    if (!targetInvoiceId || !invoice) return

    setIsLoadingPaymentSummary(true)
    try {
      const token = getCookie('token') || getCookie('accessToken')
      if (!token) {
        throw new Error('Authentication token missing. Please sign in again.')
      }

      const custId = invoice?.customerId || invoice?.customer?.id;
      const headers = {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'x-business-id': targetBusinessId,
      };

      const [response, cnRes, payRes] = await Promise.all([
        fetch(`${API_BASE}/api/payments/invoice/${encodeURIComponent(targetInvoiceId)}`, {
          method: 'GET',
          headers,
        }),
        custId ? creditNotesAPI.getCreditNotes(targetBusinessId).catch(() => null) : null,
        custId ? fetch(`${API_BASE}/api/payments?customerId=${encodeURIComponent(custId)}&limit=500`, { headers }).then(r => r.json()).catch(() => null) : null
      ]);

      if (cnRes?.success && Array.isArray(cnRes.data)) {
        const customerNotes = cnRes.data.filter((cn: any) => 
          (cn.customer?.id === custId || cn.customerId === custId) && 
          cn.status === 'OPEN' && 
          Number(cn.remainingAmount || 0) > 0
        );
        setAvailableCreditNotes(customerNotes);
      }

      if (payRes?.success) {
        const rawList = Array.isArray(payRes.data?.items) ? payRes.data.items : Array.isArray(payRes.data) ? payRes.data : [];
        const advances = rawList.filter((p: any) => {
          const unapplied = Number(p.amount || 0) - Number(p.amountAllocated || 0);
          return !p.invoiceId && unapplied > 0;
        });
        setAvailableAdvancePayments(advances);
      }

      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        console.warn('Payments load warning:', payload?.message)
      }

      const totalAmount = Number(invoice.grandTotal || 0)
      const paidAmount = Number(invoice.amountPaid || 0)
      const calculatedRemaining = Math.max(totalAmount - paidAmount, 0)
      const backendStatus = normalizeInvoiceStatus(invoice.status)
      const computedStatus = (totalAmount > 0 && calculatedRemaining === 0) ? 'PAID' : paidAmount > 0 ? 'PARTIALLY_PAID' : backendStatus

      setRemainingAmount(calculatedRemaining)
      setInvoicePaymentStatus(computedStatus)
      setPaymentForm((prev) => ({
        ...prev,
        amountReceived: prev.amountReceived || String(calculatedRemaining || 0),
        paymentDate: prev.paymentDate || new Date().toISOString().split('T')[0],
      }))
    } catch (err: any) {
      console.error('Failed to load payment summary:', err)
    } finally {
      setIsLoadingPaymentSummary(false)
    }
  }, [API_BASE, targetInvoiceId, targetBusinessId, invoice])

  useEffect(() => {
    void loadPaymentSummary()
  }, [loadPaymentSummary])

  const handleApplyAdvancePayment = async (paymentId: string, availableAmount: number) => {
    if (!targetInvoiceId) return
    const allocAmount = Math.min(availableAmount, remainingAmount)
    if (allocAmount <= 0) {
      toast.error('This invoice has no remaining dues.')
      return
    }

    setIsAllocatingAdvance(paymentId)
    try {
      const token = getCookie('token') || getCookie('accessToken')
      const res = await fetch(`${API_BASE}/api/payments/${paymentId}/allocate-existing-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-business-id': targetBusinessId,
        },
        body: JSON.stringify({
          invoiceId: targetInvoiceId,
          amount: allocAmount,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to allocate advance payment')
      }

      toast.success(`Successfully allocated ${invoiceCurrencySymbol || ''} ${allocAmount.toFixed(2)} from advance payment to this invoice.`)
      await fetchInvoiceData()
      await loadPaymentSummary()
      void refresh?.()
    } catch (err: any) {
      toast.error(err.message || 'Failed to allocate advance payment')
    } finally {
      setIsAllocatingAdvance(null)
    }
  }

  const handleSavePayment = async () => {
    if (!targetInvoiceId) {
      toast({
        title: 'Invoice not selected',
        description: 'Missing invoice id for payment creation.',
        variant: 'destructive',
      })
      return
    }

    const normalizedAmount = Number(String(paymentForm.amountReceived).replace(/,/g, '').trim())
    if (!paymentForm.amountReceived || !Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Enter a valid numeric Amount Received greater than zero.',
        variant: 'destructive',
      })
      return
    }

    if (invoicePaymentStatus === 'PAID' || remainingAmount <= 0) {
      toast({
        title: 'Payment not allowed',
        description: 'This invoice is already fully paid. Additional payment cannot be created.',
        variant: 'destructive',
      })
      return
    }

    if (!paymentForm.paymentDate) {
      toast({
        title: 'Payment date required',
        description: 'Please select Payment Date.',
        variant: 'destructive',
      })
      return
    }

    if (Number.isNaN(new Date(paymentForm.paymentDate).getTime())) {
      toast({
        title: 'Invalid payment date',
        description: 'Please provide a valid Payment Date.',
        variant: 'destructive',
      })
      return
    }

    if (!targetBusinessId) {
      toast({
        title: 'Business not selected',
        description: 'Missing business context for payment creation.',
        variant: 'destructive',
      })
      return
    }

    if (!paymentForm.paymentMode) {
      toast({
        title: 'Payment mode required',
        description: 'Please select Payment Mode.',
        variant: 'destructive',
      })
      return
    }

    setIsSavingPayment(true)
    try {
      const token = getCookie('token') || getCookie('accessToken')
      if (!token) {
        throw new Error('Authentication token missing. Please sign in again.')
      }
      const res = await fetch(`${API_BASE}/api/payments/${encodeURIComponent(targetInvoiceId)}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-business-id': targetBusinessId,
        },
        body: JSON.stringify({
          amount: normalizedAmount,
          currency: paymentForm.currency || invoiceCurrency || business?.baseCurrency?.code || 'AED',
          paymentDate: paymentForm.paymentDate,
          paymentMode: paymentForm.paymentMode,
          transactionId: paymentForm.transactionId || null,
          note: paymentForm.note || null,
          creditNoteId: paymentForm.creditNoteId && paymentForm.creditNoteId !== 'none' ? paymentForm.creditNoteId : undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to record payment')
      }

      toast({
        title: 'Payment recorded',
        description: data?.message || 'Payment has been saved successfully.',
      })

      await refresh()
      navigate(`/dashboard/${businessId}/invoices`)
    } catch (err: any) {
      toast({
        title: 'Payment failed',
        description: err?.message || 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setIsSavingPayment(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <header className="flex items-center justify-between gap-4 w-full">
          <div className="flex min-w-0 items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-muted-foreground hover:text-foreground bg-muted hover:bg-muted rounded-xl cursor-pointer"
              onClick={() => navigate(`/dashboard/${businessId}/invoices`)}
            >
              <ArrowLeftIcon className="size-5" />
            </Button>
            <div className="flex flex-col leading-tight">
              <span className="text-2xl font-bold text-foreground tracking-tight">Record Payment</span>
              <span className="text-sm font-medium text-muted-foreground mt-0.5">Enter payment details for the selected invoice</span>
            </div>
          </div>
        </header>
      </div>

      <div className="max-w-2xl w-full">
        <Card className="rounded-2xl shadow-sm border-border bg-card overflow-hidden">
          <CardHeader className="bg-muted/50 border-b border-border pb-6">
            <CardTitle className="text-lg text-foreground">Payment Form</CardTitle>
            <CardDescription className="text-sm font-medium text-muted-foreground mt-1">
              {invoice?.invoiceNumber || invoice?.id
                ? `Invoice: ${invoice.invoiceNumber || invoice.id}`
                : targetInvoiceId
                  ? `Invoice ID: ${targetInvoiceId}`
                  : 'Invoice not found'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 pt-6">
            {!targetInvoiceId && !customerId ? (
              <div className="text-sm text-muted-foreground font-medium">
                No invoice selected. Please open this page from the invoice list Actions menu.
              </div>
            ) : (
              <>
                {invoicePaymentStatus === 'PAID' ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                    This invoice is already fully paid. Additional payment cannot be created.
                  </div>
                ) : null}

                {/* Available Customer Advance Payments Banner */}
                {availableAdvancePayments.length > 0 && remainingAmount > 0 && (
                  <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
                          <Wallet className="size-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">Customer Advance Balance Available</h4>
                          <p className="text-xs text-muted-foreground">Unallocated advance funds found for this customer. You can allocate them directly to this invoice.</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-mono text-xs">
                        {availableAdvancePayments.length} Available
                      </Badge>
                    </div>

                    <div className="space-y-2 pt-1">
                      {availableAdvancePayments.map((adv: any) => {
                        const unapplied = Number(adv.amount || 0) - Number(adv.amountAllocated || 0);
                        const canCover = Math.min(unapplied, remainingAmount);
                        const advCurrSymbol = getCurrencySymbol(adv.currency || invoiceCurrency || 'USD');
                        const isCurrentAllocating = isAllocatingAdvance === adv.id;

                        return (
                          <div key={adv.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-card border border-emerald-200/60 shadow-xs">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-foreground">{adv.paymentNumber || 'Advance Payment'}</span>
                                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold">
                                  {advCurrSymbol}{unapplied.toLocaleString('en-US', { minimumFractionDigits: 2 })} unallocated
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Date: {adv.paymentDate ? new Date(adv.paymentDate).toLocaleDateString() : '-'} {adv.paymentMode ? `• Mode: ${adv.paymentMode}` : ''} {adv.note ? `• ${adv.note}` : ''}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                              <Button
                                type="button"
                                size="sm"
                                disabled={isCurrentAllocating || remainingAmount <= 0}
                                onClick={() => handleApplyAdvancePayment(adv.id, unapplied)}
                                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-4 gap-1.5 shadow-xs cursor-pointer"
                              >
                                {isCurrentAllocating ? (
                                  <>
                                    <Loader2Icon className="size-3.5 animate-spin" />
                                    Applying...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="size-3.5" />
                                    Apply {advCurrSymbol}{canCover.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                  </>
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/dashboard/${businessId}/payments/${adv.id}/allocate`)}
                                className="rounded-xl text-xs h-9 px-2 text-muted-foreground hover:text-foreground cursor-pointer"
                                title="Open Allocation Workspace"
                              >
                                <ArrowUpRight className="size-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Available Credit Notes Banner */}
                {availableCreditNotes.length > 0 && remainingAmount > 0 && (
                  <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent p-4 shadow-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
                        <FileText className="size-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">Available Credit Notes</h4>
                        <p className="text-xs text-muted-foreground">
                          {availableCreditNotes.length} open credit note(s) found. Select from &quot;Apply Credit Note&quot; below to offset this invoice.
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-blue-300 text-blue-700 font-semibold text-xs shrink-0">
                      {availableCreditNotes.map(c => `${c.creditNumber}: ${invoiceCurrencySymbol}${c.remainingAmount}`).join(', ')}
                    </Badge>
                  </div>
                )}

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="amountReceived" className="text-sm font-semibold text-foreground">
                      Amount Received
                    </Label>
                    {remainingAmount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        Remaining balance: <strong className="text-foreground">{invoiceCurrencySymbol || paymentForm.currency} {remainingAmount.toFixed(2)}</strong>
                      </span>
                    )}
                  </div>
                  <div className="flex h-11 w-full rounded-xl border border-border bg-background shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                    <div className="w-[140px] sm:w-[160px] shrink-0 border-r border-border bg-muted/30">
                      <CurrencySelect
                        value={paymentForm.currency || invoiceCurrency || 'USD'}
                        onChange={(value) => setPaymentForm(prev => ({ ...prev, currency: value }))}
                        disabled={isLoadingPaymentSummary || invoicePaymentStatus === 'PAID'}
                        className="h-full rounded-none border-0 shadow-none bg-transparent hover:bg-muted/50 focus:ring-0 px-3"
                        compact
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Input
                        id="amountReceived"
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0.00"
                        value={paymentForm.amountReceived}
                        onChange={(e) => setPaymentForm((prev) => ({ ...prev, amountReceived: e.target.value }))}
                        disabled={isLoadingPaymentSummary || invoicePaymentStatus === 'PAID'}
                        className="h-full rounded-none border-0 shadow-none focus-visible:ring-0 text-base font-semibold px-4 w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                  {invoicePaymentStatus === 'PARTIALLY_PAID' ? (
                    <p className="text-xs font-medium text-muted-foreground mt-1">
                      Remaining balance: <span className="font-bold text-foreground">{invoiceCurrencySymbol} {remainingAmount.toFixed(2)}</span>
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="paymentDate" className="text-sm font-semibold text-foreground">Payment Date</Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentDate: e.target.value }))}
                    disabled={isLoadingPaymentSummary || invoicePaymentStatus === 'PAID'}
                    className="h-10 rounded-xl border-border focus-visible:ring-blue-500"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="paymentMode" className="text-sm font-semibold text-foreground">Payment Mode</Label>
                  <Select
                    value={paymentForm.paymentMode}
                    onValueChange={(value) => {
                      setPaymentForm((prev) => ({ 
                        ...prev, 
                        paymentMode: value,
                        // Reset transaction ID if switching to Cash or Cheque
                        transactionId: (value === 'CASH' || value === 'CHEQUE') ? '' : prev.transactionId 
                      }))
                    }}
                    disabled={isLoadingPaymentSummary || invoicePaymentStatus === 'PAID'}
                  >
                    <SelectTrigger id="paymentMode" className="h-10 rounded-xl border-border focus-visible:ring-blue-500">
                      <SelectValue placeholder="Select payment mode" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="CREDIT_CARD">Card</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="transactionId" className="text-sm font-semibold text-foreground">Transaction ID</Label>
                    <Input
                      id="transactionId"
                      value={paymentForm.transactionId}
                      onChange={(e) => setPaymentForm((prev) => ({ ...prev, transactionId: e.target.value }))}
                      placeholder="e.g. TRN12345"
                      disabled={
                        isLoadingPaymentSummary || 
                        invoicePaymentStatus === 'PAID' || 
                        paymentForm.paymentMode === 'CASH'
                      }
                      className="h-10 rounded-xl border-border focus-visible:ring-blue-500 disabled:opacity-50"
                    />
                </div>

                {targetInvoiceId && availableCreditNotes.length > 0 && (
                  <div className="grid gap-2">
                    <Label htmlFor="creditNoteId" className="text-sm font-semibold text-foreground">Apply Credit Note</Label>
                    <Select
                      value={paymentForm.creditNoteId}
                      onValueChange={(value) => {
                        setPaymentForm((prev) => {
                          const newForm = { ...prev, creditNoteId: value };
                          if (value !== 'none') {
                            const note = availableCreditNotes.find(cn => cn.id === value);
                            if (note && note.remainingAmount > 0) {
                              const amountToApply = Math.min(note.remainingAmount, remainingAmount);
                              newForm.amountReceived = amountToApply.toString();
                            }
                          }
                          return newForm;
                        })
                      }}
                      disabled={isLoadingPaymentSummary || invoicePaymentStatus === 'PAID' || availableCreditNotes.length === 0}
                    >
                      <SelectTrigger id="creditNoteId" className="h-10 rounded-xl border-border focus-visible:ring-blue-500">
                        <SelectValue placeholder="Select Credit Note (optional)" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="none">None</SelectItem>
                        {availableCreditNotes.map((cn) => (
                          <SelectItem key={cn.id} value={cn.id}>
                            {cn.creditNumber} - {invoiceCurrencySymbol} {cn.remainingAmount}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="paymentNote" className="text-sm font-semibold text-foreground">Leave a Note</Label>
                  <Textarea
                    id="paymentNote"
                    value={paymentForm.note}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, note: e.target.value }))}
                    placeholder="Add an internal note"
                    rows={3}
                    disabled={isLoadingPaymentSummary || invoicePaymentStatus === 'PAID'}
                    className="resize-none rounded-xl border-border focus-visible:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end items-center gap-3 pt-6 border-t border-border mt-2">
                  <Button
                    variant="outline"
                    className="rounded-xl px-6 cursor-pointer border-border"
                    onClick={() => navigate(`/dashboard/${businessId}/invoices`)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="gap-2 px-8 rounded-xl cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    onClick={handleSavePayment}
                    disabled={isSavingPayment || isLoadingPaymentSummary || invoicePaymentStatus === 'PAID'}
                  >
                    {isSavingPayment ? <Loader2Icon className="h-4 w-4 animate-spin" /> : null}
                    <span className="font-semibold">Save Payment</span>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
