const fs = require('fs');
const file = 'C:/Users/DELL/Downloads/new-queerp/frontend/src/components/dashboard/edit-stock-transfer-page-client.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/NewStockTransferPageClient/g, 'EditStockTransferPageClient');
content = content.replace('New Stock Transfer', 'Edit Stock Transfer');

// Add id parsing and fetch transfer
if (!content.includes('const transferId')) {
  content = content.replace(
    'const businessId = pathname.match(/\\/dashboard\\/([^/]+)/)?.[1] || \'\';',
    `const businessId = pathname.match(/\\/dashboard\\/([^/]+)/)?.[1] || '';
  const transferId = params.id;`
  );
  
  const fetchReplace = `
  const fetchData = useCallback(async () => {
    if (!businessId) return
    try {
      setIsLoading(true)
      const [whRes, prdRes, trRes] = await Promise.allSettled([
        warehousesAPI.getAll(businessId),
        productsAPI.getAll(businessId),
        transferId ? stockAPI.getTransferById(businessId, transferId) : Promise.resolve({ transfer: null })
      ])
      if (whRes.status === 'fulfilled') setWarehouses(whRes.value.warehouses || [])
      if (prdRes.status === 'fulfilled') setProducts(prdRes.value.products || (prdRes.value as any).data || [])
      if (trRes.status === 'fulfilled' && (trRes.value as any).transfer) {
        const tr = (trRes.value as any).transfer;
        setFromWarehouseId(tr.fromWarehouseId || '');
        setToWarehouseId(tr.toWarehouseId || '');
        setFromLocationId(tr.fromLocationId || '');
        setToLocationId(tr.toLocationId || '');
        setNotes(tr.notes || '');
        if (tr.transferDate) setTransferDate(new Date(tr.transferDate).toISOString().slice(0, 10));
        if (tr.items && tr.items.length > 0) {
          setItems(tr.items.map((i: any) => ({
            productId: i.productId,
            quantity: i.quantity,
            notes: i.notes || ''
          })));
        }
      }
    } catch {
      toast({ title: 'Failed to load data', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [businessId, transferId])`;

  content = content.replace(/const fetchData = useCallback\([\s\S]*?\}, \[businessId\]\)/, fetchReplace);
}

// Change createTransfer to updateTransfer
content = content.replace(
  'await stockAPI.createTransfer(businessId, payload)',
  'await stockAPI.updateTransfer(businessId, transferId as string, payload)'
);
content = content.replace('Stock transfer created successfully', 'Stock transfer updated successfully');
content = content.replace('Create Transfer', 'Update Transfer');

fs.writeFileSync(file, content);
console.log('Modified edit-stock-transfer-page-client.tsx');
