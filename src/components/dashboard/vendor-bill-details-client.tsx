import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, IndianRupee, Printer } from 'lucide-react'
import { vendorBillsAPI, Bill } from '@/lib/api/purchase'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'
import { exportVendorBillToPDF } from '@/lib/utils/vendor-bill-pdf'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function VendorBillDetailsClient({ businessId, billId }: { businessId: string; billId: string }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { business } = useBusinessData()
  const [bill, setBill] = useState<Bill | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const response = await vendorBillsAPI.getById(businessId, billId)
        if (response.success && response.bill) {
          setBill(response.bill)
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
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/${businessId}/vendor-bills`)} className="rounded-full">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{bill.billNumber}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Date: {new Date(bill.billDate).toLocaleDateString()}
          </p>
        </div>
        <Badge className="ml-2 uppercase">{bill.status}</Badge>
        <div className="ml-auto">
          <Button variant="outline" className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => exportVendorBillToPDF(bill, business)}>
            <FileDown className="h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vendor</p>
                <p className="text-base font-bold">{bill.vendor?.name || '—'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                <p className="text-base font-medium">{bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : '—'}</p>
              </div>
            </div>
            {bill.notes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Notes</p>
                <p className="text-sm mt-1 p-3 bg-muted rounded-xl">{bill.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Amount Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">₹{Number(bill.subtotal || 0).toFixed(2)}</span>
              </div>
              {(bill.tax || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">₹{Number(bill.tax || 0).toFixed(2)}</span>
                </div>
              )}
              {(bill.discount || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium text-emerald-600">-₹{Number(bill.discount || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total Amount</span>
                <span>₹{Number(bill.totalAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-rose-600 pt-2">
                <span>Outstanding Balance</span>
                <span>₹{Number(bill.outstandingAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

