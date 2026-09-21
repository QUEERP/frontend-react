import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { stockAPI, StockAdjustment } from '@/lib/api/inventory';
import { ArrowLeft, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ViewStockAdjustmentClient() {
  const { businessId, id } = useParams();
  const [adjustment, setAdjustment] = useState<StockAdjustment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (businessId && id) {
      stockAPI.getAdjustmentById(businessId, id).then(res => {
        if (res.success) setAdjustment(res.adjustment);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [businessId, id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!adjustment) return <div className="p-6">Adjustment not found</div>;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link to={`/dashboard/${businessId}/stock-adjustments`}>
          <Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="h-4 w-4" />Back</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Adjustment Details</h1>
          <p className="text-sm text-muted-foreground">{adjustment.adjustmentNumber || 'N/A'}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base">General Info</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Reason:</span> <span className="font-medium">{adjustment.reason}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Status:</span> <span className="font-medium">{adjustment.status}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Date:</span> <span className="font-medium">{new Date(adjustment.createdAt).toLocaleDateString()}</span></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base">Location Info</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Warehouse:</span> <span className="font-medium">{adjustment.warehouse?.name || '—'}</span></div>
            {adjustment.location && (
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Location:</span> <span className="font-medium">{adjustment.location.code} - {adjustment.location.name}</span></div>
            )}
            {adjustment.notes && (
              <div className="flex flex-col gap-1 mt-2 pt-2 border-t text-sm"><span className="text-muted-foreground">Notes:</span> <span>{adjustment.notes}</span></div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Box className="h-4 w-4" />Adjusted Items</CardTitle></CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-4">Product ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right pr-4">Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adjustment.items.map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-4 font-medium">{item.productId}</TableCell>
                  <TableCell>{item.adjustmentType}</TableCell>
                  <TableCell className="text-right pr-4 font-medium text-blue-600">{item.quantity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
