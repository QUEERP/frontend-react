import { toast } from 'sonner';
import React, { useEffect, useMemo, useState } from 'react'
import {  useNavigate  } from 'react-router-dom';
import { ArrowLeftIcon, Loader2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
import { getCurrencySymbol } from '@/lib/currencies'
import { creditNotesAPI, CreditNote } from '@/lib/api/credit-notes'

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

  const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/$/, '')

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\^])/g, '\\$1') + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : ''
  }

  const getClientBusinessId = () => {
    if (typeof window === 'undefined') return ''
    const fromStorage = window.localStorage.getItem('activeBusinessId') || ''
    const fromCookie = getCookie('activeBusinessId')
    return fromStorage || fromCookie
  }

  const [selectedTargetInvoiceId, setSelectedTargetInvoiceId] = useState<string>(invoiceId || '')
  const targetInvoiceId = invoiceId || selectedTargetInvoiceId || ''

  const invoice = useMemo(() => {
    if (!targetInvoiceId) return null
    return (business?.invoices ?? []).find((inv: any) => inv.id === targetInvoiceId) ?? null
  }, [business, targetInvoiceId])
  
  const [pendingInvoices, setPendingInvoices] = useState<any[]>([])
  const [isLoadingPending, setIsLoadingPending] = useState(false)
  const [availableCreditNotes, setAvailableCreditNotes] = useState<CreditNote[]>([])
  
  const isBasic = business?.businessType?.toLowerCase() === 'basic'

  useEffect(() => {
    if (invoiceId) {
      setSelectedTargetInvoiceId(invoiceId)
    }
  }, [invoiceId])

  useEffect(() => {
    if (!invoiceId && customerId) {
      const fetchPending = async () => {
        setIsLoadingPending(true)
        try {
          const token = getCookie('token') || getCookie('accessToken')
          const endpoint = `${API_BASE}/api/invoices?customerId=${customerId}&status=SENT,PARTIALLY_PAID`
          const res = await fetch(endpoint, {
            headers: { Authorization: `Bearer ${token}`, 'x-business-id': businessId }
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
  }, [invoiceId, customerId, API_BASE, businessId])

  const targetBusinessId = businessId || business?.id || getClientBusinessId() || ''

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
  })

  useEffect(() => {
    if (!invoice) return
    setPaymentForm((prev) => ({
      ...prev,
      amountReceived: String(invoiceAmount || 0),
      paymentDate: new Date().toISOString().split('T')[0],
    }))
  }, [invoice, invoiceAmount])

  useEffect(() => {
    const loadPaymentSummary = async () => {
      if (!targetInvoiceId) return

      setIsLoadingPaymentSummary(true)
      try {
        const token = getCookie('token') || getCookie('accessToken')
        if (!token) {
          throw new Error('Authentication token missing. Please sign in again.')
        }

        const response = await fetch(`${API_BASE}/api/payments/invoice/${encodeURIComponent(targetInvoiceId)}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            'x-business-id': targetBusinessId,
          },
        })

        const customerId = invoice?.customerId || invoice?.customer?.id;
        if (customerId && isBasic) {
          try {
            const cnRes = await creditNotesAPI.getCreditNotes(targetBusinessId);
            if (cnRes.success && cnRes.data) {
              const customerNotes = cnRes.data.filter(cn => cn.customer?.id === customerId && cn.status === 'OPEN');
              setAvailableCreditNotes(customerNotes);
            }
          } catch (e) {
            console.error('Failed to load credit notes', e)
          }
        }

        const payload = await response.json()
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.message || 'Failed to load invoice payments')
        }

        const list = Array.isArray(payload?.data) ? payload.data : []
        const paidAmount = list.reduce((sum: number, payment: any) => sum + Number(payment?.amount || 0), 0)
        const calculatedRemaining = Math.max(invoiceAmount - paidAmount, 0)
        const backendStatus = normalizeInvoiceStatus(invoice?.status)
        const computedStatus = calculatedRemaining === 0 ? 'PAID' : paidAmount > 0 ? 'PARTIALLY_PAID' : backendStatus

        setRemainingAmount(calculatedRemaining)
        setInvoicePaymentStatus(computedStatus)
        setPaymentForm((prev) => ({
          ...prev,
          amountReceived: String(calculatedRemaining || 0),
          paymentDate: prev.paymentDate || new Date().toISOString().split('T')[0],
        }))

        // Redirect if invoice is PAID or OVERPAID - only PARTIALLY_PAID can access payment page
        if ((computedStatus as any) === 'PAID' || (computedStatus as any) === 'OVERPAID') {
          toast({
            title: 'Payment not allowed',
            description: `This invoice is already ${computedStatus.toLowerCase().replace('_', ' ')}. No additional payment can be recorded.`,
            variant: 'destructive',
          })
          navigate(`/dashboard/${businessId}/invoices`)
          return
        }
      } catch (err: any) {
        toast({
          title: 'Failed to load payment status',
          description: err?.message || 'Unknown error',
          variant: 'destructive',
        })
      } finally {
        setIsLoadingPaymentSummary(false)
      }
    }

    void loadPaymentSummary()
  }, [API_BASE, targetInvoiceId, targetBusinessId, invoiceAmount, invoice, invoiceDate])

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

                <div className="grid gap-2">
                  <Label htmlFor="amountReceived" className="text-sm font-semibold text-foreground">
                    Amount Received
                    {invoiceCurrency && (
                      <span className="ml-2 text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-lg uppercase tracking-wider">
                        {invoiceCurrency} {invoiceCurrencySymbol}
                      </span>
                    )}
                  </Label>
                  <div className="relative">
                    {invoiceCurrencySymbol && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground pointer-events-none">
                        {invoiceCurrencySymbol}
                      </span>
                    )}
                    <Input
                      id="amountReceived"
                      type="number"
                      step="0.01"
                      min="0"
                      value={paymentForm.amountReceived}
                      onChange={(e) => setPaymentForm((prev) => ({ ...prev, amountReceived: e.target.value }))}
                      disabled={isLoadingPaymentSummary || invoicePaymentStatus === 'PAID'}
                      className={`h-10 rounded-xl border-border focus-visible:ring-blue-500 ${invoiceCurrencySymbol ? 'pl-8' : ''}`}
                    />
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
                    placeholder="Enter transaction reference"
                    disabled={
                      isLoadingPaymentSummary || 
                      invoicePaymentStatus === 'PAID' || 
                      paymentForm.paymentMode === 'CASH' || 
                      paymentForm.paymentMode === 'CHEQUE'
                    }
                    className="h-10 rounded-xl border-border focus-visible:ring-blue-500 disabled:opacity-50"
                  />
                </div>

                {isBasic && targetInvoiceId && (
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
