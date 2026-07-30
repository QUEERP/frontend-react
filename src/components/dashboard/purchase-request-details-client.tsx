import * as React from 'react'
import {  useNavigate  } from 'react-router-dom';
import { purchaseRequestsAPI, PurchaseRequest } from '@/lib/api/purchase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, ArrowRightCircle } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface PurchaseRequestDetailsClientProps {
  businessId: string
  requestId: string
}

export function PurchaseRequestDetailsClient({ businessId, requestId }: PurchaseRequestDetailsClientProps) {
  const navigate = useNavigate()
  const [request, setRequest] = React.useState<PurchaseRequest | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [converting, setConverting] = React.useState(false)

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const response = await purchaseRequestsAPI.getById(businessId, requestId)
        if (response.success) setRequest(response.request)
      } catch (error: any) {
        toast({ title: error.message || 'Failed to fetch purchase request', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [businessId, requestId])

  const handleConvertToPO = async () => {
    try {
      setConverting(true)
      // Hardcoded vendor ID for demo, usually this would open a dialog to select vendor
      toast({ title: 'Converting to Purchase Order...' })
      navigate(`/dashboard/${businessId}/purchase-orders/new?prId=${requestId}`)
    } catch (error: any) {
      toast({ title: error.message || 'Failed to convert to PO', variant: 'destructive' })
    } finally {
      setConverting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!request) {
    return <div className="p-6 text-muted-foreground">Purchase request not found.</div>
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-10 pt-0 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/${businessId}/purchase-requests`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{request.requestNumber}</h1>
            <p className="text-muted-foreground">Purchase request details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           {request.status === 'APPROVED' && (
             <Button onClick={handleConvertToPO} disabled={converting} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <ArrowRightCircle className="h-4 w-4" />
                {converting ? 'Redirecting...' : 'Convert to PO'}
             </Button>
           )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Request Summary</span>
            <Badge>{request.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Requester</p>
              <p className="font-medium">{request.requester?.user?.name || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Priority</p>
              <p className="font-medium">{request.priority || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expected Date</p>
              <p className="font-medium">{request.expectedDate ? new Date(request.expectedDate).toLocaleDateString() : '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="font-medium">{request.notes || '—'}</p>
            </div>
          </div>
          
          <div className="mt-8 rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="p-3 font-medium text-muted-foreground">Item Description</th>
                  <th className="p-3 font-medium text-muted-foreground">Quantity</th>
                  <th className="p-3 font-medium text-muted-foreground">Est. Price</th>
                </tr>
              </thead>
              <tbody>
                {request.items.map((item: any) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="p-3">{item.description || item.product?.name || '—'}</td>
                    <td className="p-3">{item.quantity}</td>
                    <td className="p-3">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.estimatedPrice || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
