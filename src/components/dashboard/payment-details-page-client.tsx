import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2Icon, SaveIcon, ArrowLeftIcon, FileTextIcon, ArrowUpRight } from 'lucide-react'
import { toast } from 'sonner'
import { getCookie } from '@/lib/utils'

interface PaymentDetailsPageClientProps {
  businessId: string
  paymentId: string
  isEditMode: boolean
}

export function PaymentDetailsPageClient({ businessId, paymentId, isEditMode }: PaymentDetailsPageClientProps) {
  const navigate = useNavigate()
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5002'

  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [payment, setPayment] = useState<any>(null)

  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [paymentMode, setPaymentMode] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    fetchPaymentDetails()
  }, [businessId, paymentId])

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true)
      const token = getCookie('token') || getCookie('accessToken')
      const res = await fetch(`${API_BASE}/api/payments/details/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId
        }
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch payment details')
      
      const p = data.data
      setPayment(p)
      setAmount(String(p.amount || ''))
      setPaymentDate(p.paymentDate ? new Date(p.paymentDate).toISOString().split('T')[0] : '')
      setPaymentMode(p.paymentMode || 'CASH')
      setTransactionId(p.transactionId || '')
      setNote(p.note || '')
    } catch (err: any) {
      toast.error(err.message || 'Error fetching payment')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!payment) return

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (numAmount < payment.amountAllocated) {
      toast.error(`Amount cannot be less than the currently allocated amount (${payment.amountAllocated})`)
      return
    }

    try {
      setIsSaving(true)
      const token = getCookie('token') || getCookie('accessToken')
      
      const payload = {
        amount: numAmount,
        paymentDate: paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString(),
        paymentMode,
        transactionId: transactionId || null,
        note: note || null,
      }

      const res = await fetch(`${API_BASE}/api/payments/${payment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update payment')
      }

      toast.success('Payment updated successfully')
      navigate(`/dashboard/${businessId}/payments`)
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <Loader2Icon className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-muted-foreground">Loading payment details...</p>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Payment not found.</p>
        <Button className="mt-4" onClick={() => navigate(`/dashboard/${businessId}/payments`)}>Go Back</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/${businessId}/payments`)}>
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isEditMode ? 'Edit Payment' : 'Payment Details'}</h1>
          <p className="text-muted-foreground">
            Reference: {payment.invoice?.invoiceNumber || payment.project?.projectCode || payment.quotation?.quoteNumber || '-'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
          <CardDescription>
            {isEditMode ? 'Modify the details of this payment.' : 'View the details of this payment.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="amount" className="font-semibold">
                Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!isEditMode}
              />
              {payment.amountAllocated > 0 && (
                <div className="flex flex-col gap-1.5 text-xs mt-2 p-3 rounded-xl bg-muted/60 border border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Payment:</span>
                    <span className="font-semibold text-foreground">{payment.currency || ''} {Number(payment.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-blue-600">
                    <span className="font-medium">Allocated to Invoices:</span>
                    <span className="font-semibold">{payment.currency || ''} {Number(payment.amountAllocated || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-600 font-bold border-t border-border/60 pt-1.5">
                    <span>Remaining Unallocated:</span>
                    <span>{payment.currency || ''} {(Number(payment.amount || 0) - Number(payment.amountAllocated || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {isEditMode && (
                    <p className="text-[11px] text-muted-foreground mt-1 border-t border-border/40 pt-1">
                      Minimum amount allowed is {payment.amountAllocated} (must cover allocated portion).
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="font-semibold">
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                disabled={!isEditMode}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mode" className="font-semibold">
                Mode <span className="text-red-500">*</span>
              </Label>
              <Select value={paymentMode} onValueChange={setPaymentMode} disabled={!isEditMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="ONLINE">Online</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                  <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transactionId" className="font-semibold">
                Transaction ID
              </Label>
              <Input
                id="transactionId"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                disabled={!isEditMode}
                placeholder="e.g., TXN123456789"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note" className="font-semibold">
              Note
            </Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={!isEditMode}
              className="min-h-[100px]"
              placeholder="Optional notes..."
            />
          </div>

          {isEditMode && (
            <div className="flex justify-end pt-4 border-t border-border mt-4 gap-4">
              <Button variant="outline" onClick={() => navigate(`/dashboard/${businessId}/payments`)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2Icon className="size-4 animate-spin mr-2" /> : <SaveIcon className="size-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Allocations Section */}
      {payment.paymentAllocations && payment.paymentAllocations.length > 0 && (
        <Card className="rounded-2xl border-border shadow-sm bg-card overflow-hidden">
          <CardHeader className="bg-muted/50 border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <FileTextIcon className="size-4 text-blue-600" />
                  Allocations History
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Invoices that received allocations from this payment
                </CardDescription>
              </div>
              {Number(payment.unappliedBalance || 0) > 0 && payment.customerId && (
                <Button
                  size="sm"
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8 gap-1.5 shadow-sm"
                  onClick={() => navigate(`/dashboard/${businessId}/payments/${payment.id}/allocate`)}
                >
                  Allocate Remaining
                  <ArrowUpRight className="size-3.5" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-b border-border">
                  <TableHead className="text-xs font-semibold">Invoice #</TableHead>
                  <TableHead className="text-xs font-semibold">Allocation Date</TableHead>
                  <TableHead className="text-xs font-semibold">Type</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Allocated Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payment.paymentAllocations.map((alloc: any) => (
                  <TableRow key={alloc.id} className="border-b border-border hover:bg-muted/40">
                    <TableCell className="font-semibold text-sm text-foreground">
                      {alloc.invoice?.invoiceNumber || alloc.invoiceId || 'Invoice'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {alloc.createdAt ? new Date(alloc.createdAt).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-medium uppercase tracking-wider bg-muted text-muted-foreground">
                        {alloc.allocationType || 'Allocated'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-sm text-emerald-600 font-mono">
                      {payment.currency || '$'} {Number(alloc.allocatedAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
