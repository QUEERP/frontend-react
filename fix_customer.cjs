const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'dashboard', 'customer-view-client.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// I'll clean up the duplicated imports block
const startIdx = content.indexOf(`  const [quotations, setQuotations] = useState<QuotationItem[]>([])\n  const [loadingQuotations, setLoadingQuotations] = useState(false)\nimport React,`);
const endIdx = content.indexOf(`\n  const [salesOrders, setSalesOrders] = useState<SalesOrderItem[]>([])`);

if (startIdx !== -1 && endIdx !== -1) {
  content = content.slice(0, startIdx) + `  const [quotations, setQuotations] = useState<QuotationItem[]>([])
  const [loadingQuotations, setLoadingQuotations] = useState(false)

  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedDocIdForPayment, setSelectedDocIdForPayment] = useState<string>('')
  
  const isConstruction = business?.businessType?.toLowerCase() === 'construction'

  const customerInvoices = useMemo(() => {
    const invoices = Array.isArray((business as any)?.invoices) ? (business as any).invoices : []
    return invoices.filter((inv: any) => String(inv.customerId) === String(customerId))
  }, [business, customerId])

  const pendingDocs = useMemo(() => {
    if (isConstruction) {
      return quotations.filter((q: any) => q.status !== 'PAID' && q.status !== 'CANCELLED' && q.status !== 'DRAFT')
    }
    return customerInvoices.filter((i: any) => i.status !== 'PAID' && i.status !== 'CANCELLED' && i.status !== 'DRAFT')
  }, [quotations, customerInvoices, isConstruction])
` + content.slice(endIdx);
}

// Now remove the old customerInvoices block
const oldCustomerInvoicesStr = `  const customerInvoices = useMemo(() => {
    const invoices = Array.isArray((business as any)?.invoices) ? (business as any).invoices : []
    return invoices.filter((inv: any) => String(inv.customerId) === String(customerId))
  }, [business, customerId])\n`;

content = content.replace(oldCustomerInvoicesStr, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed customer-view-client.tsx');
