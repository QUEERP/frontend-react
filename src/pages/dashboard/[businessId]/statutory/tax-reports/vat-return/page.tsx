import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileTextIcon, DownloadIcon, PrinterIcon, TrendingUpIcon, TrendingDownIcon, CheckCircle2Icon, ReceiptIcon, FileSpreadsheetIcon } from 'lucide-react'
import * as xlsx from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import { useBusinessData } from '@/components/dashboard/business-data-provider'

export default function VATReturnPage() {
  const [period, setPeriod] = useState('Q1 2024 (Jan–Mar)')
  const { business } = useBusinessData()

  const liveVatTransactions = React.useMemo(() => {
    const invoices = Array.isArray(business?.invoices) ? business.invoices : []
    return invoices.map((inv: any) => ({
      invoice: inv.invoiceNumber || inv.id,
      date: inv.invoiceDate || inv.createdAt,
      customer: inv.customer?.company || 'Unknown',
      trn: inv.customer?.taxId || '-',
      emirate: inv.customer?.city || 'N/A',
      subtotal: Number(inv.subTotal || 0),
      vatRate: 5,
      vatAmt: Number(inv.taxAmount || 0),
      total: Number(inv.grandTotal || 0),
      type: Number(inv.taxAmount || 0) === 0 ? 'Zero Rated' : 'Standard Rated'
    }))
  }, [business])

  const totals = React.useMemo(() => {
    return liveVatTransactions.reduce((acc: { subtotal: number; vatAmt: number; total: number; standardRated: number; zeroRated: number }, row: any) => {
      acc.subtotal += row.subtotal
      acc.vatAmt += row.vatAmt
      acc.total += row.total
      if (row.type === 'Standard Rated') acc.standardRated += row.subtotal
      if (row.type === 'Zero Rated') acc.zeroRated += row.subtotal
      return acc
    }, { subtotal: 0, vatAmt: 0, total: 0, standardRated: 0, zeroRated: 0 })
  }, [liveVatTransactions])

  const boxSummary = [
    { box: '1', label: 'Standard Rated Supplies', value: `AED ${totals.standardRated.toLocaleString()}`, vat: `AED ${totals.vatAmt.toLocaleString()}`, color: 'blue' },
    { box: '2', label: 'Supplies subject to zero rate', value: `AED ${totals.zeroRated.toLocaleString()}`, vat: 'AED 0', color: 'emerald' },
    { box: '3', label: 'Exempt Supplies', value: 'AED 0', vat: 'AED 0', color: 'slate' },
    { box: '9', label: 'Input Tax (Recoverable)', value: '', vat: 'AED 0', color: 'violet' },
  ]

  const exportToExcel = () => {
    const ws = xlsx.utils.json_to_sheet(liveVatTransactions)
    const wb = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(wb, ws, 'VAT Transactions')
    xlsx.writeFile(wb, `VAT_Return_${period.split(' ')[0]}.xlsx`)
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    doc.text(`VAT Return - ${period}`, 14, 15)
    
    autoTable(doc, {
      head: [['Invoice', 'Date', 'Customer', 'TRN', 'Emirate', 'Type', 'Subtotal', 'VAT %', 'VAT Amt', 'Total']],
      body: liveVatTransactions.map((r: any) => [r.invoice, r.date ? new Date(r.date).toLocaleDateString() : '-', r.customer, r.trn, r.emirate, r.type, r.subtotal, r.vatRate, r.vatAmt, r.total]),
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 7 },
      headStyles: { fillColor: [59, 130, 246] }
    })

    doc.save(`VAT_Return_${period.split(' ')[0]}.pdf`)
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">VAT Return</h2>
          <p className="text-slate-500 text-sm mt-1">UAE Federal Tax Authority — Quarterly VAT Return Filing</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={period} onChange={e => setPeriod(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white text-sm px-3">
            {['Q1 2024 (Jan–Mar)', 'Q2 2024 (Apr–Jun)', 'Q3 2024 (Jul–Sep)'].map(p => <option key={p}>{p}</option>)}
          </select>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}><PrinterIcon className="size-4" />Print</Button>
          <Button size="sm" variant="outline" className="gap-2 text-green-700 border-green-200 hover:bg-green-50" onClick={exportToExcel}>
            <FileSpreadsheetIcon className="size-4" /> Excel
          </Button>
          <Button size="sm" className="gap-2 bg-red-600 hover:bg-red-700 text-white" onClick={exportToPDF}>
            <FileTextIcon className="size-4" /> PDF
          </Button>
        </div>
      </div>

      {/* FTA Banner */}
      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <FileTextIcon className="w-5 h-5 text-blue-600" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Filing Period: {period} | Due: 28th of following month</p>
          <p className="text-xs text-blue-600">TRN: {business?.taxId || 'N/A'} | Net VAT Payable: AED {totals.vatAmt.toLocaleString()}</p>
        </div>
        <Badge className="ml-auto bg-amber-100 text-amber-700 border-amber-200">Pending</Badge>
      </div>

      {/* VAT Box Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {boxSummary.map(({ box, label, value, vat, color }) => (
          <Card key={box} className="rounded-2xl border-slate-100 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold bg-${color}-100 text-${color}-700 px-2 py-0.5 rounded-full`}>Box {box}</span>
              </div>
              <p className="text-xs text-slate-500 font-medium mb-2">{label}</p>
              {value && <p className="text-sm font-semibold text-slate-700">{value}</p>}
              <p className={`text-lg font-bold text-${color}-700`}>{vat}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Net Payable Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUpIcon className="size-5 text-red-500" />
              <p className="text-sm font-semibold text-slate-600">Output VAT (Sales)</p>
            </div>
            <p className="text-2xl font-bold text-red-600">AED {totals.vatAmt.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">5% on standard rated supplies</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <TrendingDownIcon className="size-5 text-emerald-500" />
              <p className="text-sm font-semibold text-slate-600">Input VAT (Purchases)</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600">AED 12,400</p>
            <p className="text-xs text-slate-400 mt-1">Recoverable input tax</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-blue-100 bg-blue-50/40 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle2Icon className="size-5 text-blue-600" />
              <p className="text-sm font-semibold text-blue-800">Net VAT Payable</p>
            </div>
            <p className="text-2xl font-bold text-blue-700">AED {totals.vatAmt.toLocaleString()}</p>
            <p className="text-xs text-blue-400 mt-1">Due to FTA by 28th</p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Table */}
      <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/60 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">VAT Transaction Register</CardTitle>
              <CardDescription>Detailed outward supplies for {period}</CardDescription>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{liveVatTransactions.length} Records</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Invoice', 'Date', 'Customer', 'TRN', 'Emirate', 'Type', 'Subtotal (AED)', 'VAT %', 'VAT (AED)', 'Total (AED)'].map(h => (
                    <th key={h} className="text-left p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {liveVatTransactions.map((row: any) => (
                  <tr key={row.invoice} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 font-medium text-blue-600 whitespace-nowrap">{row.invoice}</td>
                    <td className="p-3 text-slate-500 whitespace-nowrap">{row.date ? new Date(row.date).toLocaleDateString() : '-'}</td>
                    <td className="p-3 font-medium text-slate-800">{row.customer}</td>
                    <td className="p-3 text-slate-400 font-mono text-xs">{row.trn}</td>
                    <td className="p-3 text-slate-600">{row.emirate}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`text-xs whitespace-nowrap ${
                        row.type === 'Standard Rated' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        row.type === 'Zero Rated' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        'bg-slate-50 text-slate-600'
                      }`}>
                        {row.type}
                      </Badge>
                    </td>
                    <td className="p-3 text-right font-medium">{row.subtotal.toLocaleString()}</td>
                    <td className="p-3 text-right text-slate-600">{row.vatRate}%</td>
                    <td className="p-3 text-right text-orange-700 font-medium">{row.vatAmt > 0 ? row.vatAmt.toLocaleString() : '—'}</td>
                    <td className="p-3 text-right font-bold text-slate-800">{row.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={6} className="p-3 font-bold text-slate-700">TOTAL</td>
                  <td className="p-3 text-right font-bold">{totals.subtotal.toLocaleString()}</td>
                  <td className="p-3 text-right">—</td>
                  <td className="p-3 text-right font-bold text-orange-700">{totals.vatAmt.toLocaleString()}</td>
                  <td className="p-3 text-right font-bold text-blue-700">{totals.total.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
