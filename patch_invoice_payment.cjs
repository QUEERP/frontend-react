const fs = require('fs');
const path = require('path');

const invoiceClientPath = path.join(__dirname, 'src', 'components', 'dashboard', 'invoice-payment-page-client.tsx');
let content = fs.readFileSync(invoiceClientPath, 'utf8');

// 1. Add customerId to props
content = content.replace(
  `export function InvoicePaymentPageClient({
  businessId,
  invoiceId,
}: {
  businessId: string
  invoiceId?: string
})`,
  `export function InvoicePaymentPageClient({
  businessId,
  invoiceId,
  customerId,
}: {
  businessId: string
  invoiceId?: string
  customerId?: string
})`
);

// 2. Add state and effect for customer invoices
const stateEffectToAdd = `
  const [selectedTargetInvoiceId, setSelectedTargetInvoiceId] = useState<string>(invoiceId || '')
  const targetInvoiceId = invoice?.id || selectedTargetInvoiceId || ''
  
  const [pendingInvoices, setPendingInvoices] = useState<any[]>([])
  const [isLoadingPending, setIsLoadingPending] = useState(false)

  useEffect(() => {
    if (invoiceId) {
      setSelectedTargetInvoiceId(invoiceId)
    }
  }, [invoiceId])

  useEffect(() => {
    if (!invoiceId && customerId) {
      const fetchPending = async () => {
        setIsLoadingPending(true)
        try {
          const token = getCookie('token') || getCookie('accessToken')
          const endpoint = \`\${API_BASE}/api/invoices?customerId=\${customerId}&status=SENT,PARTIALLY_PAID\`
          const res = await fetch(endpoint, {
            headers: { Authorization: \`Bearer \${token}\`, 'x-business-id': businessId }
          })
          const data = await res.json()
          if (data.success) {
            setPendingInvoices(data.invoices)
          }
        } catch (err) {
          console.error(err)
        } finally {
          setIsLoadingPending(false)
        }
      }
      fetchPending()
    }
  }, [invoiceId, customerId, API_BASE, businessId])
`;

// Replace the old targetInvoiceId definition
content = content.replace(
  `const targetInvoiceId = invoice?.id || invoiceId || ''`,
  stateEffectToAdd
);

// 3. Make amount default to 0
content = content.replace(
  `amountReceived: String(calculatedRemaining),`,
  `amountReceived: '0',`
);
content = content.replace(
  `amountReceived: String(invoiceAmount),`,
  `amountReceived: '0',`
);

// 4. Inject the Select dropdown if !invoiceId && customerId
const selectHtml = `
              {!invoiceId && customerId && (
                <div className="grid gap-2 mb-4">
                  <Label className="text-sm font-semibold text-foreground">Select Invoice</Label>
                  <Select value={selectedTargetInvoiceId} onValueChange={setSelectedTargetInvoiceId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={isLoadingPending ? 'Loading...' : 'Select Invoice'} />
                    </SelectTrigger>
                    <SelectContent>
                      {pendingInvoices.map((doc: any) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          {doc.invoiceNumber} - {business?.currency || 'INR'} {doc.grandTotal || doc.totalAmount}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
`;

content = content.replace(
  `            {!targetInvoiceId ? (
              <div className="text-sm text-muted-foreground font-medium">
                No invoice selected. Please open this page from the invoice list Actions menu.
              </div>
            ) : (`,
  `            {!targetInvoiceId && !customerId ? (
              <div className="text-sm text-muted-foreground font-medium">
                No invoice selected. Please open this page from the invoice list Actions menu.
              </div>
            ) : (
              <>
              ${selectHtml}`
);

// Also need to close the extra fragment we added?
// Wait, the original code had:
// : (
//   <>
//      {invoicePaymentStatus === 'PAID'
// I'll just put the dropdown before the PAID check, but after the <>

content = content.replace(
  `            ) : (
              <>
                {invoicePaymentStatus === 'PAID' ? (`,
  `            ) : (
              <>
                ${selectHtml}
                {invoicePaymentStatus === 'PAID' ? (`
);

// Let's refine step 4 replacement to ensure it's exact:
content = content.replace(
  `{!targetInvoiceId ? (`,
  `{!targetInvoiceId && !customerId ? (`
);

fs.writeFileSync(invoiceClientPath, content, 'utf8');
console.log('Patched invoice payment page');
