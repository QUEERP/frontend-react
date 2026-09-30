const fs = require('fs');
const file = 'C:/Users/DELL/Downloads/new-queerp/frontend/src/components/dashboard/stock-transfers-page-client.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add handleStatusChange
if (!content.includes('handleStatusChange')) {
  content = content.replace(
    'const handleDelete = async (id: string) => {',
    `const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await stockAPI.updateTransferStatus(businessId, id, newStatus);
      toast({ title: 'Transfer status updated to ' + newStatus });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Failed to update status', description: error?.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {`
  );
}

// Import Edit2, CheckCircle2, Truck
if (!content.includes('Edit2')) {
  content = content.replace(
    'MoreVertical, Eye, Trash2, Loader2',
    'MoreVertical, Eye, Trash2, Loader2, Edit2, CheckCircle2, Truck'
  );
}

// Add dropdown items
if (!content.includes('handleStatusChange(t.id,')) {
  const dropdownActions = `
                            {t.status === 'PENDING' && (
                              <>
                                <DropdownMenuItem onClick={() => handleStatusChange(t.id, 'SHIPPED')} className="flex items-center gap-2 text-indigo-600">
                                  <Truck className="h-4 w-4" />
                                  Mark as Shipped
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(t.id, 'COMPLETED')} className="flex items-center gap-2 text-emerald-600">
                                  <CheckCircle2 className="h-4 w-4" />
                                  Approve & Receive
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link to={\`/dashboard/\${businessId}/stock-transfers/\${t.id}/edit\`} className="flex items-center gap-2">
                                    <Edit2 className="h-4 w-4" />
                                    Edit Transfer
                                  </Link>
                                </DropdownMenuItem>
                              </>
                            )}
                            {t.status === 'SHIPPED' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(t.id, 'COMPLETED')} className="flex items-center gap-2 text-emerald-600">
                                <CheckCircle2 className="h-4 w-4" />
                                Mark as Received
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem asChild>`;
  content = content.replace('<DropdownMenuItem asChild>', dropdownActions);
}

fs.writeFileSync(file, content);
console.log('Modified stock-transfers-page-client.tsx');
