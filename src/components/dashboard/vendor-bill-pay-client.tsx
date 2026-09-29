import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, Loader2Icon, Save } from 'lucide-react'
import { vendorBillsAPI, vendorPaymentsAPI, Bill } from '@/lib/api/purchase'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export function VendorBillPayClient({ businessId, billId }: { businessId: string; billId: string }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [bill, setBill] = useState<Bill | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const response = await vendorBillsAPI.getById(businessId, billId)
        if (response.success && response.bill) {
          setBill(response.bill)
          setAmount(response.bill.outstandingAmount.toString())
        } else {
          toast({ title: 'Bill not found', variant: 'destructive' })
        }
      } catch (error: any) {
        toast({ title: 'Failed to load bill', description: error.message, variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
    }
    fetchBill()
  }, [businessId, billId, toast])

  const outstandingAmount = bill?.outstandingAmount || 0

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      toast({ title: 'Please enter a valid amount', variant: 'destructive' })
      return
    }
    
    try {
      setIsSubmitting(true)
      await vendorPaymentsAPI.create(businessId, billId, {
        amount: Number(amount),
        paymentDate,
        paymentMethod,
        referenceNumber,
        notes
      })
      toast({ title: 'Payment recorded successfully' })
      navigate(`/dashboard/${businessId}/vendor-bills`)
    } catch (error: any) {
      toast({ title: 'Failed to record payment', description: error.message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2Icon className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!bill) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold text-foreground">Bill not found</h2>
        <Button onClick={() => navigate(`/dashboard/${businessId}/vendor-bills`)}>Back to Bills</Button>
      </div>
    )
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
              onClick={() => navigate(`/dashboard/${businessId}/vendor-bills`)}
            >
              <ArrowLeftIcon className="size-5" />
            </Button>
            <div className="flex flex-col leading-tight">
              <span className="text-2xl font-bold text-foreground tracking-tight">Record Payment</span>
              <span className="text-sm font-medium text-muted-foreground mt-0.5">Enter payment details for the selected bill</span>
            </div>
          </div>
        </header>
      </div>

      <div className="max-w-2xl w-full">
        <Card className="rounded-2xl shadow-sm border-border bg-card overflow-hidden">
          <CardHeader className="bg-muted/50 border-b border-border pb-6">
            <CardTitle className="text-lg text-foreground">Payment Form</CardTitle>
            <CardDescription className="text-sm font-medium text-muted-foreground mt-1">
              Bill: {bill.billNumber}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 pt-6">
            <div className="grid gap-2">
              <Label htmlFor="amountPaid" className="text-sm font-semibold text-foreground">
                Amount Paid
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground pointer-events-none">
                    ₹
                  </span>
                  <Input
                    id="amountPaid"
                    type="number"
                    step="0.01"
                    min="0"
                    max={outstandingAmount}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isSubmitting}
                    className="h-10 rounded-xl border-border focus-visible:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none pl-8"
                  />
                </div>
              </div>
              {outstandingAmount > 0 ? (
                <p className="text-xs font-medium text-muted-foreground mt-1">
                  Remaining balance: <span className="font-bold text-foreground">₹ {Number(outstandingAmount).toFixed(2)}</span>
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="paymentDate" className="text-sm font-semibold text-foreground">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                disabled={isSubmitting}
                className="h-10 rounded-xl border-border focus-visible:ring-blue-500"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="paymentMethod" className="text-sm font-semibold text-foreground">Payment Mode</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) => {
                  setPaymentMethod(value);
                  if (value === 'CASH' || value === 'CHEQUE') {
                    setReferenceNumber('');
                  }
                }}
                disabled={isSubmitting}
              >
                <SelectTrigger id="paymentMethod" className="h-10 rounded-xl border-border focus-visible:ring-blue-500">
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="referenceNumber" className="text-sm font-semibold text-foreground">Transaction ID / Reference</Label>
              <Input
                id="referenceNumber"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. TRN12345"
                disabled={isSubmitting || paymentMethod === 'CASH'}
                className="h-10 rounded-xl border-border focus-visible:ring-blue-500 disabled:opacity-50"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="paymentNote" className="text-sm font-semibold text-foreground">Leave a Note</Label>
              <Textarea
                id="paymentNote"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add an internal note"
                rows={3}
                disabled={isSubmitting}
                className="resize-none rounded-xl border-border focus-visible:ring-blue-500"
              />
            </div>

            <div className="flex justify-end items-center gap-3 pt-6 border-t border-border mt-2">
              <Button
                variant="outline"
                className="rounded-xl px-6 cursor-pointer border-border"
                onClick={() => navigate(`/dashboard/${businessId}/vendor-bills`)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                className="gap-2 px-8 rounded-xl cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2Icon className="h-4 w-4 animate-spin" /> : null}
                <span className="font-semibold">Save Payment</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
