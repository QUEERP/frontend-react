import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2Icon, SaveIcon, ArrowLeftIcon } from 'lucide-react'
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
              {isEditMode && payment.amountAllocated > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Min amount allowed: {payment.amountAllocated} (Currently allocated)
                </p>
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
    </div>
  )
}
