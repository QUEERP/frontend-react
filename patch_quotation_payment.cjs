const fs = require('fs');
const path = require('path');

const quotationClientPath = path.join(__dirname, 'src', 'components', 'dashboard', 'quotation-payment-page-client.tsx');
let content = fs.readFileSync(quotationClientPath, 'utf8');

// 1. Add customerId to props
content = content.replace(
  `export function QuotationPaymentPageClient({
  businessId,
  quotationId,
  projectId,
}: {
  businessId: string
  quotationId?: string
  projectId?: string
})`,
  `export function QuotationPaymentPageClient({
  businessId,
  quotationId,
  projectId,
  customerId,
}: {
  businessId: string
  quotationId?: string
  projectId?: string
  customerId?: string
})`
);

// 2. Add state and effect for customer quotations
const stateEffectToAdd = `
  const [selectedTargetQuotationId, setSelectedTargetQuotationId] = useState<string>(quotationId || '')
  const targetQuotationId = quotation?.id || selectedTargetQuotationId || ''
  
  const [pendingDocs, setPendingDocs] = useState<any[]>([])
  const [isLoadingPending, setIsLoadingPending] = useState(false)

  useEffect(() => {
    if (quotationId) {
      setSelectedTargetQuotationId(quotationId)
    }
  }, [quotationId])

  useEffect(() => {
    if (!quotationId && customerId) {
      const fetchPending = async () => {
        setIsLoadingPending(true)
        try {
          const token = getCookie('token') || getCookie('accessToken')
          const endpoint = \`\${API_BASE}/api/quotations?customerId=\${customerId}&status=ACCEPTED\`
          const res = await fetch(endpoint, {
            headers: { Authorization: \`Bearer \${token}\`, 'x-business-id': businessId }
          })
          const data = await res.json()
          if (data.success) {
            setPendingDocs(data.quotations)
          }
        } catch (err) {
          console.error(err)
        } finally {
          setIsLoadingPending(false)
        }
      }
      fetchPending()
    }
  }, [quotationId, customerId, API_BASE, businessId])
`;

// Replace the old targetQuotationId definition
content = content.replace(
  `const targetQuotationId = quotation?.id || quotationId || ''`,
  stateEffectToAdd
);

// 3. Make amount default to 0
content = content.replace(
  `amountReceived: String(calculatedRemaining),`,
  `amountReceived: '0',`
);
content = content.replace(
  `amountReceived: String(quotationAmount),`,
  `amountReceived: '0',`
);

// 4. Inject the Select dropdown if !quotationId && customerId
const selectHtml = `
              {!quotationId && customerId && (
                <div className="grid gap-2 mb-4">
                  <Label className="text-sm font-semibold text-foreground">Select Project / Quotation</Label>
                  <Select value={selectedTargetQuotationId} onValueChange={setSelectedTargetQuotationId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={isLoadingPending ? 'Loading...' : 'Select Project'} />
                    </SelectTrigger>
                    <SelectContent>
                      {pendingDocs.map((doc: any) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          {doc.projectCode || doc.quoteNumber} - {business?.currency || 'INR'} {doc.grandTotal || doc.totalAmount}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
`;

content = content.replace(
  `            {!targetQuotationId ? (
              <div className="text-sm text-muted-foreground font-medium">
                No project/quotation selected. Please open this page from the project list Actions menu.
              </div>
            ) : (`,
  `            {!targetQuotationId && !customerId ? (
              <div className="text-sm text-muted-foreground font-medium">
                No project/quotation selected. Please open this page from the project list Actions menu.
              </div>
            ) : (
              <>
              ${selectHtml}`
);

// Second replace fragment start
content = content.replace(
  `            ) : (
              <>
                {quotationPaymentStatus === 'PAID' ? (`,
  `            ) : (
              <>
                ${selectHtml}
                {quotationPaymentStatus === 'PAID' ? (`
);

fs.writeFileSync(quotationClientPath, content, 'utf8');
console.log('Patched quotation payment page');
