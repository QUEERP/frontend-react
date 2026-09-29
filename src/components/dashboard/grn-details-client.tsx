import { exportGRNToPDF } from '@/lib/utils/grn-pdf';
import { FileDown } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Package, Printer } from 'lucide-react'
import { grnAPI, GRN } from '@/lib/api/purchase'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export function GRNDetailsClient({ businessId, grnId }: { businessId: string; grnId: string }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [grn, setGrn] = useState<GRN | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchGRN = async () => {
      try {
        const response = await grnAPI.getById(businessId, grnId)
        if (response.success && response.grn) {
          setGrn(response.grn)
        } else {
          toast({ title: 'GRN not found', variant: 'destructive' })
        }
      } catch (error: any) {
        toast({ title: 'Failed to load GRN', description: error.message, variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
    }
    fetchGRN()
  }, [businessId, grnId, toast])

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!grn) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold">GRN not found</h2>
        <Button onClick={() => navigate(`/dashboard/${businessId}/grn`)}>Back to GRNs</Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/${businessId}/grn`)} className="rounded-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{grn.grnNumber}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Received on {new Date(grn.receivedDate).toLocaleDateString()}
            </p>
          </div>
          <Badge className="ml-2 uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
            {grn.status}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button variant="outline" className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => exportGRNToPDF(grn)}>
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
                <p className="text-sm font-medium text-muted-foreground">PO Number</p>
                <p className="text-base font-medium">{grn.purchaseOrder?.poNumber || '—'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Warehouse</p>
                <p className="text-base font-medium">{grn.warehouse?.name || '—'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Received Date</p>
                <p className="text-base font-medium">{new Date(grn.receivedDate).toLocaleDateString()}</p>
              </div>
            </div>
            {grn.notes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Notes</p>
                <p className="text-sm mt-1 p-3 bg-muted rounded-xl">{grn.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Vendor Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-base font-bold text-blue-700">{grn.vendor?.name || '—'}</p>
              {grn.vendor?.email && <p className="text-sm text-muted-foreground mt-1">{grn.vendor.email}</p>}
              {grn.vendor?.phone && <p className="text-sm text-muted-foreground">{grn.vendor.phone}</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" /> Received Items
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="pl-6">Product</TableHead>
                <TableHead>Ordered</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Damaged</TableHead>
                <TableHead className="text-right pr-6">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grn.items?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    No items found.
                  </TableCell>
                </TableRow>
              ) : (
                grn.items?.map((item: any, i) => (
                  <TableRow key={item.id || i}>
                    <TableCell className="pl-6 font-medium">
                      {item.product?.name || `Product ID: ${item.productId}`}
                    </TableCell>
                    <TableCell>{item.quantityOrdered || '—'}</TableCell>
                    <TableCell className="font-bold text-emerald-600">{item.quantityReceived || 0}</TableCell>
                    <TableCell className="text-rose-500">{item.quantityDamaged || 0}</TableCell>
                    <TableCell className="text-right pr-6">{item.price?.toFixed(2) || '0.00'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

