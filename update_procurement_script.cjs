const fs = require('fs');
const path = 'C:/Users/DELL/Downloads/new-queerp/frontend/src/components/dashboard/trading-procurement-report-client.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Imports
content = content.replace(
  "import { DateRangePicker } from './shared/date-range-picker'",
  "import { DateRangePicker } from './shared/date-range-picker'\nimport { ServerPagination } from '@/components/ui/server-pagination'"
);

// 2. State and useEffect
content = content.replace(
  /const \[activeTab, setActiveTab\] = useState\('vendors'\)/,
  "const [activeTab, setActiveTab] = useState('vendors')\n  const [page, setPage] = useState(1)\n  const pageSize = 25"
);

content = content.replace(
  /useEffect\(\(\) => \{[\s\S]*?\}, \[businessId, token, dateRange\]\)/,
  `useEffect(() => {
    if (!businessId || !token) return
    let isMounted = true
    if (!data) setLoading(true)
    setError(null)
    
    purchaseReportsAPI.getTradingProcurementReport(businessId, dateRange, activeTab, page, pageSize)
      .then((res) => {
        if (isMounted) {
          setData(prev => prev ? { ...prev, ...res.data } : res.data)
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
  /<Tabs value=\{activeTab\} onValueChange=\{setActiveTab\} className="space-y-4">/,
  '<Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">'
);

// 4. Add ServerPagination to tables
const tables = [
  { tab: 'vendors', count: 'vendorsTotalCount' },
  { tab: 'requests', count: 'requestsTotalCount' },
  { tab: 'orders', count: 'ordersTotalCount' },
  { tab: 'receipts', count: 'receiptsTotalCount' },
  { tab: 'bills', count: 'billsTotalCount' },
  { tab: 'payments', count: 'paymentsTotalCount' },
  { tab: 'returns', count: 'returnsTotalCount' }
];

for (const t of tables) {
  const regex = new RegExp(`(<TabsContent value="${t.tab}"[\\s\\S]*?<\\/Table>[\\s]*<\\/div>)`);
  content = content.replace(
    regex,
    `$1\n              <ServerPagination page={page} pageSize={pageSize} totalCount={data.${t.count} || 0} onPageChange={setPage} />`
  );
}

fs.writeFileSync(path, content);
console.log('Successfully updated trading-procurement-report-client.tsx');
