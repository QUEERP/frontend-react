import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { stockAPI, StockTransfer } from '@/lib/api/inventory';
import { ArrowLeft, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ViewStockTransferClient() {
  const { businessId, id } = useParams();
  const [transfer, setTransfer] = useState<StockTransfer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (businessId && id) {
      stockAPI.getTransferById(businessId, id).then(res => {
        if (res.success) setTransfer(res.transfer);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [businessId, id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!transfer) return <div className="p-6">Transfer not found</div>;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link to={`/dashboard/${businessId}/stock-transfers`}>
          <Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="h-4 w-4" />Back</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transfer Details</h1>
          <p className="text-sm text-muted-foreground">{transfer.transferNumber || 'N/A'}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base">Source Info</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">From Warehouse:</span> <span className="font-medium">{transfer.fromWarehouse?.name || '—'}</span></div>
            {transfer.fromLocation && (
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Location:</span> <span className="font-medium">{transfer.fromLocation.code} - {transfer.fromLocation.name}</span></div>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base">Destination Info</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">To Warehouse:</span> <span className="font-medium">{transfer.toWarehouse?.name || '—'}</span></div>
            {transfer.toLocation && (
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Location:</span> <span className="font-medium">{transfer.toLocation.code} - {transfer.toLocation.name}</span></div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-base">General Info</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Status:</span> <span className="font-medium">{transfer.status}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Date:</span> <span className="font-medium">{new Date(transfer.createdAt).toLocaleDateString()}</span></div>
          {transfer.notes && (
            <div className="flex flex-col gap-1 mt-2 pt-2 border-t text-sm"><span className="text-muted-foreground">Notes:</span> <span>{transfer.notes}</span></div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><ArrowRightLeft className="h-4 w-4" />Transferred Items</CardTitle></CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-4">Product ID</TableHead>
                <TableHead className="text-right pr-4">Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfer.items.map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-4 font-medium">{item.productId}</TableCell>
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
