const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'dashboard', 'invoices-page-client.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');

const startIndex = lines.findIndex(l => l.includes('const displayName = useMemo(() => {'));
const endIndex = lines.findIndex(l => l.includes('const filteredInvoices = useMemo(() => {'));

if (startIndex !== -1 && endIndex !== -1) {
  const newContent = `  const displayName = useMemo(() => {
    if (businessName && businessName.trim().length > 0) {
      return businessName
    }
    if (!businessId) {
      return 'Your Business'
    }
    return \`Business \${businessId.slice(0, 6).toUpperCase()}\`
  }, [businessName, businessId])

  useEffect(() => {
    const fetchInvoices = async () => {
      if (loading) return

      const token = getCookie('token') || getCookie('accessToken')
      if (!token) return

      setListLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', String(currentPage))
        params.set('limit', '10')
        if (searchTerm.trim()) params.set('search', searchTerm.trim())
        if (fromDate) params.set('fromDate', fromDate)
        if (toDate) params.set('toDate', toDate)
        if (statusFilter !== 'all') params.set('status', statusFilter)

        const res = await fetch(\`\${API_BASE}/api/invoices?\${params.toString()}\`, {
          method: 'GET',
          headers: {
            Authorization: \`Bearer \${token}\`,
            'x-business-id': businessId,
          },
        })

        const data = await res.json()
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || 'Failed to load invoices')
        }

        const rows = (Array.isArray(data?.data) ? data.data : []).map((inv: any) => ({
          id: inv.id,
          number: inv.invoiceNumber,
          customerName: inv.customer?.company ?? '',
          customerId: inv.customerId,
          amount: inv.grandTotal,
          status: normalizeInvoiceStatus(inv.status),
          dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
          issueDate: inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().split('T')[0] : '',
          items: Array.isArray(inv.items) ? inv.items.length : 0,
          tax: inv.totalTax,
          total: inv.grandTotal,
          currency: inv.currency || 'AED',
          pdfUrl: sanitizeUrl(inv.pdfUrl),
        }))

        setInvoices(rows)
        setTotalPages(Number(data?.pagination?.totalPages || 1))
        setTotalInvoicesCount(Number(data?.pagination?.total || rows.length || 0))
      } catch (err: any) {
        toast({
          title: 'Failed to load invoices',
          description: err?.message || 'Unknown error',
          variant: 'destructive',
        })
      } finally {
        setListLoading(false)
      }
    }

    void fetchInvoices()
  }, [API_BASE, businessId, currentPage, fromDate, loading, sanitizeUrl, searchTerm, statusFilter, toDate, toast])

  const handleBulkSync = async () => {
    try {
      setSyncLoading(true)
      const token = getCookie('token') || getCookie('accessToken')
      const res = await fetch(\`\${API_BASE}/api/invoices/bulk-update\`, {
        method: 'POST',
        headers: {
          Authorization: \`Bearer \${token}\`,
          'X-Business-Id': businessId,
        },
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Sync failed')
      
      toast({
        title: 'Sync Complete',
        description: data.message,
      })
      // Refresh the page to show updated PDFs/currencies
      window.location.reload()
    } catch (err: any) {
      toast({
        title: 'Sync Failed',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setSyncLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      setExportLoading(true)
      const token = getCookie('token') || getCookie('accessToken')
      if (!token) return

      // Fetch all invoices without pagination limit
      const params = new URLSearchParams()
      params.set('page', '1')
      params.set('limit', '1000') // Fetch a large enough number for a report
      if (searchTerm.trim()) params.set('search', searchTerm.trim())
      if (fromDate) params.set('fromDate', fromDate)
      if (toDate) params.set('toDate', toDate)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const res = await fetch(\`\${API_BASE}/api/invoices?\${params.toString()}\`, {
        method: 'GET',
        headers: {
          Authorization: \`Bearer \${token}\`,
          'x-business-id': businessId,
        },
      })

      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Export failed')

      const exportData = (Array.isArray(data?.data) ? data.data : []).map((inv: any) => ({
        'Invoice Number': inv.invoiceNumber || inv.id,
        'Date': inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '',
        'Customer': inv.customer?.company || inv.customer?.name || '',
        'Total Amount': inv.grandTotal,
        'Tax': inv.totalTax,
        'Status': inv.status,
        'Due Date': inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '',
        'Currency': inv.currency || 'AED'
      }))

      exportToExcel(exportData, \`Invoices_Report_\${new Date().toISOString().split('T')[0]}\`, 'Invoices')
      toast({ title: 'Report Generated', description: 'Your invoice report has been downloaded.' })
    } catch (err: any) {
      toast({ title: 'Export Failed', description: err.message, variant: 'destructive' })
    } finally {
      setExportLoading(false)
    }
  }

`;
  
  lines.splice(startIndex, endIndex - startIndex, newContent);
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log("Restored successfully!");
} else {
  console.log("Indexes not found!");
}
