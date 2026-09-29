import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { vendorBillsAPI, vendorPaymentsAPI, Bill } from '@/lib/api/purchase'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!bill) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold">Bill not found</h2>
        <Button onClick={() => navigate(`/dashboard/${businessId}/vendor-bills`)}>Back to Bills</Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/${businessId}/vendor-bills`)} className="rounded-full">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Record Payment</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Bill {bill.billNumber} • Outstanding: ₹{Number(bill.outstandingAmount).toFixed(2)}
          </p>
        </div>
      </div>

      <Card className="rounded-2xl border-border shadow-sm">
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label>Payment Amount (₹)</Label>
              <Input
                type="number"
                step="0.01"
                required
                max={bill.outstandingAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Date</Label>
              <Input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                  <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reference Number (Optional)</Label>
              <Input
                type="text"
                placeholder="e.g. Transaction ID, Cheque No"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Input
                type="text"
                placeholder="Additional details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="bg-muted/50 py-4 rounded-b-2xl border-t">
            <Button type="submit" className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Record Payment
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
