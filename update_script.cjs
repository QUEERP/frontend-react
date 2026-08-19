const fs = require('fs');
const path = 'C:/Users/DELL/Downloads/new-queerp/frontend/src/components/dashboard/trading-sales-report-client.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Imports
content = content.replace(
  "import { DateRangePicker } from './shared/date-range-picker'",
  "import { DateRangePicker } from './shared/date-range-picker'\nimport { ServerPagination } from '@/components/ui/server-pagination'"
);

// 2. State and useEffect
content = content.replace(
  /const \[activeTab, setActiveTab\] = useState\('payments'\)/,
  "const [activeTab, setActiveTab] = useState('payments')\n  const [page, setPage] = useState(1)\n  const pageSize = 25"
);

content = content.replace(
  /useEffect\(\(\) => \{[\s\S]*?\}, \[businessId, token, dateRange\]\)/,
  `useEffect(() => {
    if (!businessId || !token) return
    let isMounted = true
    if (!data) setLoading(true)
    setError(null)
    
    getTradingSalesReport(token, businessId, dateRange, activeTab, page, pageSize)
      .then((res) => {
        if (isMounted) {
          setData(prev => prev ? { ...prev, ...res } : res)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message)
          setLoading(false)
        }
      })
    return () => { isMounted = false }
  }, [businessId, token, dateRange, activeTab, page, pageSize])
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
  };`.trim()
);

// 3. Update handle tab change
content = content.replace(
  /<Tabs value=\{activeTab\} onValueChange=\{setActiveTab\}/,
  "<Tabs value={activeTab} onValueChange={handleTabChange}"
);

// 4. Add ServerPagination to tables
const tables = [
  { tab: 'payments', count: 'paymentsTotalCount' },
  { tab: 'customers', count: 'customersTotalCount' },
  { tab: 'credit-notes', count: 'creditNotesTotalCount' },
  { tab: 'quotations', count: 'quotationsTotalCount' },
  { tab: 'sales-orders', count: 'salesOrdersTotalCount' },
  { tab: 'invoices', count: 'invoicesTotalCount' },
  { tab: 'returns', count: 'returnsTotalCount' },
  { tab: 'recurring', count: 'recurringTotalCount' }
];

for (const t of tables) {
  const regex = new RegExp(`(<TabsContent value="${t.tab}"[\\s\\S]*?<\\/Table>[\\s]*<\\/div>)`);
  content = content.replace(
    regex,
    `$1\n              <ServerPagination page={page} pageSize={pageSize} totalCount={data.${t.count} || 0} onPageChange={setPage} />`
  );
}

fs.writeFileSync(path, content);
console.log('Successfully updated trading-sales-report-client.tsx');
