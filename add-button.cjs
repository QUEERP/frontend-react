const fs = require('fs');
const p = 'c:/Users/DELL/Downloads/new-queerp/frontend/src/components/dashboard/purchase-orders-page-client.tsx';
let c = fs.readFileSync(p, 'utf8');

if (!c.includes('handleMarkReceived')) {
  // Add the function
  c = c.replace(
    'const handleDelete = async (orderId: string) => {',
    `const handleMarkReceived = async (order: any) => {
    try {
      await purchaseOrdersAPI.markReceived(businessId as string, order.id);
      toast.success('Order marked as received. GRN and Bill generated.');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to mark as received');
    }
  };

  const handleDelete = async (orderId: string) => {`
  );

  // Add the DropdownMenuItem
  const dropItemHtml = `<DropdownMenuItem className="cursor-pointer font-medium text-foreground dark:text-slate-300 py-2.5" onClick={() => navigate(\`/dashboard/\${businessId}/purchase-orders/\${order.id}/edit\`)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit Order
                          </DropdownMenuItem>`;
                          
  const newDropItem = `${dropItemHtml}
                          {order.status !== 'Received' && (
                            <DropdownMenuItem className="cursor-pointer font-medium text-blue-600 dark:text-blue-400 py-2.5" onClick={() => handleMarkReceived(order)}>
                              <CheckCircle className="mr-2 h-4 w-4" /> Mark as Received
                            </DropdownMenuItem>
                          )}`;

  c = c.replace(dropItemHtml, newDropItem);

  // Import CheckCircle
  if (!c.includes('CheckCircle')) {
    c = c.replace('import { Plus, Search, FileText, Filter, Calendar, MapPin, Building, Phone, MoreVertical, Eye, Pencil, Trash2, Loader2 }', 'import { Plus, Search, FileText, Filter, Calendar, MapPin, Building, Phone, MoreVertical, Eye, Pencil, Trash2, Loader2, CheckCircle }');
  }

  fs.writeFileSync(p, c);
}
console.log('Updated frontend table');
