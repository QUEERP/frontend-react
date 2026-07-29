import { toast } from 'sonner';
import React, { useEffect, useMemo, useState } from 'react'
import {  useNavigate, useSearchParams  } from 'react-router-dom';
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
import { getCurrencySymbol } from '@/lib/currencies'
import { quotationsAPI } from '@/lib/api/quotations'
import { useBusinessData } from '@/components/dashboard/business-data-provider'

const formatProjectCode = (code: any) => {
  if (!code) return '';
  const strCode = String(code);
  const match = strCode.match(/^PRJ-0*(\d+)$/);
  if (match) {
    return 'PRJ-' + match[1].padStart(3, '0');
  }
  return strCode;
};

export function QuotationPaymentPageClient({
  businessId,
  quotationId,
  projectId,
}: {
  businessId: string
  quotationId?: string
  projectId?: string
}) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const customerId = searchParams.get('customerId')
  const { toast } = useToast()
  const { business, refresh } = useBusinessData()
  const [isSavingPayment, setIsSavingPayment] = useState(false)
  const [isLoadingPaymentSummary, setIsLoadingPaymentSummary] = useState(false)
  const [remainingAmount, setRemainingAmount] = useState(0)
  const [quotationPaymentStatus, setQuotationPaymentStatus] = useState<string>('UNPAID')

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

  const [quotation, setQuotation] = useState<any>(null)
  const [project, setProject] = useState<any>(null)
  const [resolvedQuotationId, setResolvedQuotationId] = useState(quotationId || '')
  
  const [pendingDocs, setPendingDocs] = useState<any[]>([])
  const [isLoadingPending, setIsLoadingPending] = useState(false)
  const [customerData, setCustomerData] = useState<any>(null)

  const targetBusinessId = businessId || business?.id || getClientBusinessId() || ''

  const quotationAmount = useMemo(() => {
    const isConstruction = business?.businessType?.toLowerCase() === 'construction' || project?.executionType === 'CONSTRUCTION' || project?.department === 'Construction'
    return isConstruction && project?.budget ? Number(project.budget) : Number(quotation?.totalAmount || 0)
  }, [quotation, project, business])
  
  const quotationCurrency = (quotation as any)?.currency || ''
  const quotationCurrencySymbol = getCurrencySymbol(quotationCurrency) || (quotation as any)?.currencySymbol || ''
  const quotationDate = useMemo(() => {
    const baseDate = quotation?.dueDate || quotation?.quotationDate
    if (!baseDate) return new Date().toISOString().split('T')[0]
    return new Date(baseDate).toISOString().split('T')[0]
  }, [quotation])

  const [paymentForm, setPaymentForm] = useState({
    amountReceived: '',
    paymentDate: '',
    paymentMode: '',
    transactionId: '',
    note: '',
  })

  useEffect(() => {
    if (quotationId) {
      setResolvedQuotationId(quotationId)
    }
  }, [quotationId])

  useEffect(() => {
    if (!quotationId && customerId) {
      const fetchPending = async () => {
        setIsLoadingPending(true)
        try {
          const token = getCookie('token') || getCookie('accessToken')
          
          const resCustomer = await fetch(`${API_BASE}/api/customers/${customerId}`, {
            headers: { Authorization: `Bearer ${token}`, 'x-business-id': businessId }
          })
          
          const dataCustomer = await resCustomer.json();
          if (dataCustomer.success && (dataCustomer.customer || dataCustomer.data)) {
            setCustomerData(dataCustomer.customer || dataCustomer.data);
          }
        } catch (err) {
          console.error(err)
        } finally {
          setIsLoadingPending(false)
        }
      }
      fetchPending()
    }
  }, [quotationId, customerId, API_BASE, businessId])

  useEffect(() => {
    if (!quotation) return
    setPaymentForm((prev) => ({
      ...prev,
      amountReceived: '0',
      paymentDate: quotationDate,
    }))
  }, [quotation, quotationAmount, quotationDate])

  useEffect(() => {
    const loadPaymentSummary = async () => {
      let currentQuotationId = resolvedQuotationId
      const token = getCookie('token') || getCookie('accessToken')
      if (!token) return;

      setIsLoadingPaymentSummary(true)
      
      try {
        if (!currentQuotationId && projectId) {
          const pResponse = await fetch(`${API_BASE}/api/projects/${encodeURIComponent(projectId)}`, {
            headers: { Authorization: `Bearer ${token}`, 'x-business-id': targetBusinessId }
          })
          const pData = await pResponse.json()
          if (pData?.success) {
            const proj = pData.project || pData.data;
            setProject(proj)
            if (proj?.quotationId) {
              currentQuotationId = proj.quotationId;
              setResolvedQuotationId(currentQuotationId);
            }
          }
        } else if (projectId) {
          const pResponse = await fetch(`${API_BASE}/api/projects/${encodeURIComponent(projectId)}`, {
            headers: { Authorization: `Bearer ${token}`, 'x-business-id': targetBusinessId }
          })
          const pData = await pResponse.json()
          if (pData?.success) {
            setProject(pData.project || pData.data)
          }
        }
      } catch (e) {
        console.error('Failed to load project details', e)
      }

      if (!currentQuotationId) {
        setIsLoadingPaymentSummary(false)
        return
      }

      try {
        const qResponse = await quotationsAPI.getQuotationById(targetBusinessId, currentQuotationId)
        if (qResponse.success) {
          setQuotation(qResponse.quotation)
        }
        const currentQuotation = qResponse.quotation || null
        const isConstruction = business?.businessType?.toLowerCase() === 'construction' || project?.executionType === 'CONSTRUCTION' || project?.department === 'Construction'
        const currentQuotationAmount = isConstruction && project?.budget ? Number(project.budget) : Number(currentQuotation?.totalAmount || 0)

        const response = await fetch(`${API_BASE}/api/payments/quotation/${encodeURIComponent(currentQuotationId)}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            'x-business-id': targetBusinessId,
          },
        })

        const payload = await response.json()
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.message || 'Failed to load quotation payments')
        }

        const list = Array.isArray(payload?.data) ? payload.data : []
        const paidAmount = list.reduce((sum: number, payment: any) => sum + Number(payment?.amount || 0), 0)
        const calculatedRemaining = Math.max(currentQuotationAmount - paidAmount, 0)
        const backendStatus = currentQuotation?.status || 'DRAFT'
        const computedStatus: string =
          calculatedRemaining === 0 && paidAmount > 0 ? 'PAID' : paidAmount > 0 ? 'PARTIALLY_PAID' : backendStatus

        setRemainingAmount(calculatedRemaining)
        setQuotationPaymentStatus(computedStatus)
        setPaymentForm((prev) => ({
          ...prev,
          amountReceived: '0',
          paymentDate: prev.paymentDate || (currentQuotation?.issueDate ? new Date(currentQuotation.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
        }))

        if (computedStatus === 'PAID' || (computedStatus as any) === 'OVERPAID') {
          toast({
            title: 'Payment not allowed',
            description: `This quotation is already ${computedStatus.toLowerCase().replace('_', ' ')}. No additional payment can be recorded.`,
            variant: 'destructive',
          })
          navigate(`/dashboard/${businessId}/quotations`)
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
  }, [API_BASE, targetBusinessId, projectId, resolvedQuotationId])

  const handleSavePayment = async () => {
    if (!resolvedQuotationId && !customerId) {
      toast({
        title: 'Project or Customer not selected',
        description: 'Missing project or customer context for payment creation.',
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

    if (resolvedQuotationId && (quotationPaymentStatus === 'PAID' || remainingAmount <= 0)) {
      toast({
        title: 'Payment not allowed',
        description: 'This project is already fully paid. Additional payment cannot be created.',
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
      const endpoint = resolvedQuotationId 
        ? `${API_BASE}/api/payments/quotation/${encodeURIComponent(resolvedQuotationId)}`
        : `${API_BASE}/api/payments/customer/${encodeURIComponent(customerId || '')}`;

      const res = await fetch(endpoint, {
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
      navigate(-1)
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
              className="h-10 cursor-pointer w-10 rounded-xl hover:bg-muted text-muted-foreground shrink-0"
              onClick={() => navigate(-1)}
            >
              <ArrowLeftIcon className="size-5" />
            </Button>
            <div className="flex flex-col leading-tight">
              <span className="text-2xl font-bold text-foreground tracking-tight">Record Payment</span>
              <span className="text-sm font-medium text-muted-foreground mt-0.5">
                {(!resolvedQuotationId && customerId) 
                  ? 'Enter payment details for an unassigned customer advance'
                  : `Enter payment details for the selected ${projectId || project ? 'project' : 'document'}`}
              </span>
            </div>
          </div>
        </header>
      </div>

      <div className="max-w-2xl w-full">
        <Card className="rounded-2xl shadow-sm border-border bg-card overflow-hidden">
          <CardHeader className="bg-muted/50 border-b border-border pb-6">
            <CardTitle className="text-lg text-foreground">Payment Form</CardTitle>
            <CardDescription className="text-sm font-medium text-muted-foreground mt-1">
              {project 
                ? `Project: ${formatProjectCode(project.projectCode) || project.id} ${project.projectName ? `- ${project.projectName}` : ''}`
                : projectId 
                  ? `Project ID: ${projectId}`
                  : quotation?.quoteNumber || quotation?.id
                    ? `Quotation: ${quotation.quoteNumber || quotation.id}`
                    : resolvedQuotationId
                      ? `Quotation: ${resolvedQuotationId}`
                      : customerData?.company || customerData?.name || customerData?.companyName
                        ? `Customer: ${customerData.company || customerData.name || customerData.companyName}`
                        : customerId
                          ? `Customer ID: ${customerId}`
                          : 'Quotation not found'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 pt-6">
            {!resolvedQuotationId && !projectId && !customerId ? (
              <div className="text-sm text-muted-foreground font-medium">
                No project or quotation selected. Please open this page from the Actions menu.
              </div>
            ) : !resolvedQuotationId && isLoadingPaymentSummary ? (
              <div className="flex flex-col items-center justify-center p-6 text-sm text-muted-foreground font-medium">
                <Loader2Icon className="h-6 w-6 animate-spin mb-2" />
                Loading project details...
              </div>
            ) : !resolvedQuotationId && !customerId ? (
              <div className="text-sm text-rose-500 font-medium bg-rose-50 p-4 rounded-xl border border-rose-100">
                This project does not have an associated quotation. A payment can only be recorded if a quotation exists.
              </div>
            ) : (
              <>
                {quotationPaymentStatus === 'PAID' ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                    This quotation is already fully paid. Additional payment cannot be created.
                  </div>
                ) : null}

                <div className="grid gap-2">
                  <Label htmlFor="amountReceived" className="text-sm font-semibold text-foreground">
                    Amount Received
                    {quotationCurrency && (
                      <span className="ml-2 text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-lg uppercase tracking-wider">
                        {quotationCurrency} {quotationCurrencySymbol}
                      </span>
                    )}
                  </Label>
                  <div className="relative">
                    {quotationCurrencySymbol && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground pointer-events-none">
                        {quotationCurrencySymbol}
                      </span>
                    )}
                    <Input
                      id="amountReceived"
                      type="number"
                      step="0.01"
                      min="0"
                      value={paymentForm.amountReceived}
                      onChange={(e) => setPaymentForm((prev) => ({ ...prev, amountReceived: e.target.value }))}
                      disabled={isLoadingPaymentSummary || quotationPaymentStatus === 'PAID'}
                      className={`h-10 rounded-xl border-border focus-visible:ring-blue-500 ${quotationCurrencySymbol ? 'pl-8' : ''}`}
                    />
                  </div>
                  {quotationPaymentStatus === 'PARTIALLY_PAID' ? (
                    <p className="text-xs font-medium text-muted-foreground mt-1">
                      Remaining balance: <span className="font-bold text-foreground">{quotationCurrencySymbol} {remainingAmount.toFixed(2)}</span>
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
                    disabled={isLoadingPaymentSummary || quotationPaymentStatus === 'PAID'}
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
                        transactionId: (value === 'CASH' || value === 'CHEQUE') ? '' : prev.transactionId 
                      }))
                    }}
                    disabled={isLoadingPaymentSummary || quotationPaymentStatus === 'PAID'}
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
                      quotationPaymentStatus === 'PAID' || 
                      paymentForm.paymentMode === 'CASH' || 
                      paymentForm.paymentMode === 'CHEQUE'
                    }
                    className="h-10 rounded-xl border-border focus-visible:ring-blue-500 disabled:opacity-50"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="paymentNote" className="text-sm font-semibold text-foreground">Leave a Note</Label>
                  <Textarea
                    id="paymentNote"
                    value={paymentForm.note}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, note: e.target.value }))}
                    placeholder="Add an internal note"
                    rows={3}
                    disabled={isLoadingPaymentSummary || quotationPaymentStatus === 'PAID'}
                    className="resize-none rounded-xl border-border focus-visible:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end items-center gap-3 pt-6 border-t border-border mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (projectId) {
                        navigate(`/dashboard/${businessId}/project-operations/projects/${projectId}`)
                      } else {
                        navigate(`/dashboard/${businessId}/quotations`)
                      }
                    }}
                    disabled={isSavingPayment}
                    className="h-11 px-8 rounded-xl border-border font-semibold hover:bg-card"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="gap-2 px-8 rounded-xl cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    onClick={handleSavePayment}
                    disabled={isSavingPayment || isLoadingPaymentSummary || quotationPaymentStatus === 'PAID'}
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
