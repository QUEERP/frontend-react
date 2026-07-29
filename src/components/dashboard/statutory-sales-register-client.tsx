import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { useToast } from '@/components/ui/use-toast'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { SearchIcon, PrinterIcon, FileTextIcon, FileSpreadsheetIcon } from 'lucide-react'
import { exportToExcel, exportSalesRegisterPdf, printPage } from '@/lib/export-utils'

const statusStyles: Record<string, string> = {
  PAID:           'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0',
  UNPAID:         'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-0',
  PARTIALLY_PAID: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0',
  UNKNOWN:        'bg-muted text-foreground dark:bg-slate-800 dark:text-slate-400 border-0'
}

function normalizeStatus(raw: string | null | undefined) {
  const s = String(raw || '').trim().toUpperCase()
  if (s === 'PARTIALLY_PAID') return 'PARTIALLY_PAID'
  if (s === 'PAID') return 'PAID'
  if (s === 'UNPAID' || s === 'OVERDUE') return 'UNPAID'
  return 'UNKNOWN'
}

export default function StatutorySalesRegisterClient() {
  const { toast } = useToast()
  const { business } = useBusinessData()
  const isIndia = (business as any)?.country === 'INDIA'

  const taxLabel  = isIndia ? 'GST' : 'VAT'
  const taxIdLabel = isIndia ? 'GSTIN' : 'TRN'
  const curr   = business?.currency || (isIndia ? 'INR' : 'AED')

  const DATA = React.useMemo(() => {
    const invoices = Array.isArray(business?.invoices) ? business.invoices : []
    return invoices.map((inv: any) => ({
      id: inv.invoiceNumber || inv.id,
      date: inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : (inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '-'),
      party: inv.customer?.company || 'Unknown',
      taxId: inv.customer?.taxId || '-',
      country: inv.customer?.country || business?.country || 'N/A',
      currency: curr,
      subtotal: Number(inv.subTotal || 0),
      taxPct: 5,
      taxAmt: Number(inv.taxAmount || 0),
      total: Number(inv.grandTotal || 0),
      status: normalizeStatus(inv.status)
    }))
  }, [business, curr])

  const fmt = (n: number) => new Intl.NumberFormat(isIndia ? 'en-IN' : 'en-AE', { minimumFractionDigits: 2 }).format(n)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 8

  const filtered = DATA.filter((r: any) =>
    r.party.toLowerCase().includes(search.toLowerCase()) ||
    r.id.toLowerCase().includes(search.toLowerCase()) ||
    r.taxId.includes(search)
  )

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const totals = filtered.reduce((acc: { subtotal: number; taxAmt: number; total: number }, r: any) => ({
    subtotal: acc.subtotal + r.subtotal,
    taxAmt: acc.taxAmt + r.taxAmt,
    total: acc.total + r.total,
  }), { subtotal: 0, taxAmt: 0, total: 0 })

  const headers = ['Invoice #', 'Date', 'Customer', taxIdLabel, 'Country', 'Currency', 'Subtotal', `${taxLabel} %`, `${taxLabel} Amt`, 'Grand Total', 'Status']

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 bg-muted/50 dark:bg-slate-900/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Sales Register</h1>
          <p className="text-muted-foreground mt-1">
            {isIndia ? 'Q2 FY2025-26' : 'Q2 2025'} &mdash; {filtered.length} invoices &mdash; Total: {curr} {fmt(totals.total)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={printPage}><PrinterIcon className="size-4 mr-1" />Print</Button>
          <Button variant="outline" size="sm" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
            onClick={() => exportToExcel(filtered, 'Sales_Register')}>
            <FileSpreadsheetIcon className="size-4 mr-1" />Excel
          </Button>
          <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white"
            onClick={() => exportSalesRegisterPdf(filtered, isIndia ? 'Q2 FY2025-26' : 'Q2 2025')}>
            <FileTextIcon className="size-4 mr-1" />PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm bg-card dark:bg-slate-900">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Subtotal</p>
            <p className="text-2xl font-bold mt-1">{curr} {fmt(totals.subtotal)}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card dark:bg-slate-900">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Output {taxLabel}</p>
            <p className="text-2xl font-bold mt-1 text-amber-600">{curr} {fmt(totals.taxAmt)}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card dark:bg-slate-900">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Incl. {taxLabel}</p>
            <p className="text-2xl font-bold mt-1 text-indigo-600">{curr} {fmt(totals.total)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="border-none shadow-sm bg-card dark:bg-slate-900">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Invoice Register</CardTitle>
              <CardDescription>All sales invoices for the selected period</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={`Search invoice, customer, ${taxIdLabel}...`}
                className="pl-9 text-sm"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border dark:border-slate-800">
                    {headers.map((h: string) => (
                      <th key={h} className="text-left py-3 px-3 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r: any) => (
                    <tr key={r.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-muted dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-semibold text-blue-600">{r.id}</td>
                      <td className="py-3 px-3 whitespace-nowrap text-muted-foreground">{r.date}</td>
                      <td className="py-3 px-3 font-medium whitespace-nowrap">{r.party}</td>
                      <td className="py-3 px-3 font-mono text-xs text-muted-foreground">{r.taxId}</td>
                      <td className="py-3 px-3">{r.country}</td>
                      <td className="py-3 px-3">{r.currency}</td>
                      <td className="py-3 px-3 text-right font-mono">{fmt(r.subtotal)}</td>
                      <td className="py-3 px-3 text-center"><Badge variant="outline">{r.taxPct}%</Badge></td>
                      <td className="py-3 px-3 text-right font-mono text-amber-600">{fmt(r.taxAmt)}</td>
                      <td className="py-3 px-3 text-right font-mono font-semibold">{fmt(r.total)}</td>
                      <td className="py-3 px-3"><Badge className={statusStyles[r.status]}>{r.status.replace('_', ' ')}</Badge></td>
                    </tr>
                  ))}
                  <tr className="bg-muted dark:bg-slate-800/40 font-bold">
                    <td colSpan={6} className="py-3 px-3">Total ({filtered.length} records)</td>
                    <td className="py-3 px-3 text-right font-mono">{fmt(totals.subtotal)}</td>
                    <td className="py-3 px-3"></td>
                    <td className="py-3 px-3 text-right font-mono text-amber-600">{fmt(totals.taxAmt)}</td>
                    <td className="py-3 px-3 text-right font-mono text-indigo-600">{fmt(totals.total)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border dark:border-slate-800">
              <p className="text-sm text-muted-foreground">Page {page} of {totalPages || 1}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}