const fs = require('fs');
const p = 'c:/Users/DELL/Downloads/new-queerp/frontend/src/components/dashboard/new-purchase-return-page-client.tsx';
let c = fs.readFileSync(p, 'utf8');

if (!c.includes('purchaseOrdersAPI')) {
  // Add imports
  c = c.replace(
    "import { purchaseReturnsAPI, vendorsAPI, Vendor } from '@/lib/api/purchase'",
    "import { purchaseReturnsAPI, vendorsAPI, Vendor } from '@/lib/api/purchase'\nimport { purchaseOrdersAPI, PurchaseOrder } from '@/lib/api/purchase-orders'"
  );

  // Add state
  c = c.replace(
    'const [vendors, setVendors] = useState<Vendor[]>([])',
    'const [vendors, setVendors] = useState<Vendor[]>([])\n  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])\n  const [purchaseOrderId, setPurchaseOrderId] = useState(\'\')'
  );

  // Add to fetch
  c = c.replace(
    "const [vRes, pRes] = await Promise.allSettled([vendorsAPI.getAll(businessId), productsAPI.getAll(businessId)])",
    "const [vRes, pRes, poRes] = await Promise.allSettled([vendorsAPI.getAll(businessId), productsAPI.getAll(businessId), purchaseOrdersAPI.getPurchaseOrders(businessId)])"
  );
  
  c = c.replace(
    "setProducts(productData)\n      }",
    "setProducts(productData)\n      }\n      if (poRes.status === 'fulfilled') {\n        setPurchaseOrders((poRes.value as any).orders || [])\n      }"
  );

  // Add handleSubmit payload
  c = c.replace(
    "await purchaseReturnsAPI.create(businessId, { vendorId, returnDate, notes, items: validItems })",
    "await purchaseReturnsAPI.create(businessId, { vendorId, purchaseOrderId: purchaseOrderId || undefined, returnDate, notes, items: validItems } as any)"
  );

  // Add onChange handler for PO
  const poHandler = `
  const handlePOSelect = (poId: string) => {
    setPurchaseOrderId(poId);
    if (poId === 'none') {
      return;
    }
    const po = purchaseOrders.find(p => p.id === poId);
    if (po) {
      if (po.vendorId) setVendorId(po.vendorId);
      if (po.items && po.items.length > 0) {
        setItems(po.items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          reason: 'DAMAGED'
        })));
      }
    }
  };
  `;
  c = c.replace('const addItem = () =>', poHandler + '\n  const addItem = () =>');

  // Add UI for PO dropdown
  const vendorBlockRegex = /<div className="space-y-2">\s*<Label[^>]*>Vendor \*/m;
  const match = c.match(vendorBlockRegex);
  
  if (match) {
    const poBlock = `<div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-slate-400">Purchase Order</Label>
                  <Select value={purchaseOrderId} onValueChange={handlePOSelect} disabled={isLoading}>
                    <SelectTrigger className="h-12 w-full border-border dark:border-[#23272c] bg-card dark:bg-[#121418] rounded-xl text-foreground dark:text-slate-200">
                      <SelectValue placeholder="Select PO (Optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Select —</SelectItem>
                      {purchaseOrders.map(po => <SelectItem key={po.id} value={po.id} className="font-medium">{po.poNumber}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                `;
    c = c.substring(0, match.index) + poBlock + c.substring(match.index);
    
    // Change grid to 3 cols instead of 2
    c = c.replace('<div className="grid grid-cols-1 md:grid-cols-2 gap-6">', '<div className="grid grid-cols-1 md:grid-cols-3 gap-6">');
  }

  fs.writeFileSync(p, c);
  console.log('Added PO selection to New Purchase Return page');
} else {
  console.log('Already patched');
}
