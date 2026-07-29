const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'dashboard', 'customer-view-client.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const correctBlock = `  const isConstruction = business?.businessType?.toLowerCase() === 'construction'

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

  const [salesOrders, setSalesOrders] = useState<SalesOrderItem[]>([])
  const [loadingSalesOrders, setLoadingSalesOrders] = useState(false)

  const [paymentsList, setPaymentsList] = useState<PaymentItem[]>([])
  const [loadingPaymentsList, setLoadingPaymentsList] = useState(false)`;

// Let's find exactly where to inject this.
const searchStart = "  const isConstruction = business?.businessType?.toLowerCase() === 'construction'";
const searchEnd = "  const [loadingPaymentsList, setLoadingPaymentsList] = useState(false)";

const startIdx = content.indexOf(searchStart);
const endIdx = content.indexOf(searchEnd);

if (startIdx !== -1 && endIdx !== -1) {
  content = content.slice(0, startIdx) + correctBlock + content.slice(endIdx + searchEnd.length);
}

// Now remove the second customerInvoices if it's there
const duplicateStr = `  const customerInvoices = useMemo(() => {
    const invoices = Array.isArray((business as any)?.invoices) ? (business as any).invoices : []
    return invoices.filter((inv: any) => String(inv.customerId) === String(customerId))
  }, [business, customerId])\n`;

// Since the first block now exactly matches duplicateStr (except maybe without newline at the start), 
// we only want to replace the SECOND occurrence if there is one.
const firstOccur = content.indexOf('const customerInvoices = useMemo');
const secondOccur = content.indexOf('const customerInvoices = useMemo', firstOccur + 1);

if (secondOccur !== -1) {
  const lines = content.split('\n');
  const secondOccurLine = lines.findIndex((l, i) => i > 200 && l.includes('const customerInvoices = useMemo'));
  if (secondOccurLine !== -1) {
     lines.splice(secondOccurLine, 4); // remove the 4 lines of the block
     content = lines.join('\n');
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed correctly');
