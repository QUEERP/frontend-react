import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileTextIcon, DownloadIcon, PrinterIcon, FilterIcon, TrendingUpIcon, ReceiptIcon, BuildingIcon, FileSpreadsheetIcon } from 'lucide-react'
import * as xlsx from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import { useBusinessData } from '@/components/dashboard/business-data-provider'

export default function GSTR1Page() {
  const [period, setPeriod] = useState('Apr 2024')
  const { business, loading } = useBusinessData()

  const liveGSTR1 = React.useMemo(() => {
    const invoices = Array.isArray(business?.invoices) ? business.invoices : []
    return invoices.map((inv: any) => ({
      invoice: inv.invoiceNumber || inv.id,
      date: inv.invoiceDate || inv.createdAt,
      customer: inv.customer?.company || 'Unknown',
      gstin: inv.customer?.taxId || '-',
      taxable: Number(inv.subTotal || 0),
      cgst: Number(inv.taxAmount || 0) / 2, // Approximating CGST/SGST split if needed, or based on real tax details
      sgst: Number(inv.taxAmount || 0) / 2,
      igst: 0,
      total: Number(inv.grandTotal || 0),
      type: inv.customer?.taxId ? 'B2B' : 'B2C'
    }))
  }, [business])

  const totals = React.useMemo(() => {
    return liveGSTR1.reduce((acc: { taxable: number; cgst: number; sgst: number; igst: number; total: number }, row: any) => {
      acc.taxable += row.taxable
      acc.cgst += row.cgst
      acc.sgst += row.sgst
      acc.igst += row.igst
      acc.total += row.total
      return acc
    }, { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 })
  }, [liveGSTR1])

  const summaryCards = [
    { label: 'Total Taxable Value', value: `₹${totals.taxable.toLocaleString('en-IN')}`, icon: TrendingUpIcon, color: 'blue' },
    { label: 'Total CGST', value: `₹${totals.cgst.toLocaleString('en-IN')}`, icon: ReceiptIcon, color: 'emerald' },
    { label: 'Total SGST', value: `₹${totals.sgst.toLocaleString('en-IN')}`, icon: ReceiptIcon, color: 'violet' },
    { label: 'Total IGST', value: `₹${totals.igst.toLocaleString('en-IN')}`, icon: BuildingIcon, color: 'orange' },
  ]

  const exportToExcel = () => {
    const ws = xlsx.utils.json_to_sheet(liveGSTR1)
    const wb = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(wb, ws, 'GSTR-1')
    xlsx.writeFile(wb, `GSTR-1_${period}.xlsx`)
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    doc.text(`GSTR-1 Report - ${period}`, 14, 15)
    
    const tableColumn = ['Invoice No.', 'Date', 'Customer', 'GSTIN', 'Type', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total']
    const tableRows = liveGSTR1.map((row: any) => [
      row.invoice,
      row.date ? new Date(row.date).toLocaleDateString() : '-',
      row.customer,
      row.gstin,
      row.type,
      row.taxable,
      row.cgst,
      row.sgst,
      row.igst,
      row.total
    ])

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    })

    doc.save(`GSTR-1_${period}.pdf`)
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">GSTR-1</h2>
          <p className="text-slate-500 text-sm mt-1">Outward Supply Return — Details of outward supplies of goods or services</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={period} 
            onChange={e => setPeriod(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white text-sm px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {['Apr 2024', 'May 2024', 'Jun 2024', 'Jul 2024'].map(p => <option key={p}>{p}</option>)}
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

      {/* Period banner */}
      <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
        <FileTextIcon className="w-5 h-5 text-emerald-600" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">Filing Period: {period}</p>
          <p className="text-xs text-emerald-600">Due Date: 11th of the following month | Status: <span className="font-bold">Pending</span></p>
        </div>
        <Badge className="ml-auto bg-amber-100 text-amber-700 border-amber-200">Not Filed</Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="rounded-2xl border-slate-100 shadow-sm">
            <CardContent className="p-5">
              <div className={`flex size-9 items-center justify-center rounded-lg bg-${color}-50 text-${color}-600 mb-3`}>
                <Icon className="size-4" />
              </div>
              <p className="text-xs text-slate-500 font-medium">{label}</p>
              <p className="text-xl font-bold text-slate-800 mt-1">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* B2B Table */}
      <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/60 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">B2B / B2C Invoices</CardTitle>
              <CardDescription>Outward taxable supplies</CardDescription>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{liveGSTR1.length} Records</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Invoice No.', 'Date', 'Customer', 'GSTIN', 'Type', 'Taxable (₹)', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total (₹)'].map((h: string) => (
                    <th key={h} className="text-left p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {liveGSTR1.map((row: any) => (
                  <tr key={row.invoice} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 font-medium text-blue-600">{row.invoice}</td>
                    <td className="p-3 text-slate-600 whitespace-nowrap">{row.date ? new Date(row.date).toLocaleDateString() : '-'}</td>
                    <td className="p-3 text-slate-800 font-medium">{row.customer}</td>
                    <td className="p-3 text-slate-500 font-mono text-xs">{row.gstin}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`text-xs ${row.type.includes('IGST') ? 'bg-violet-50 text-violet-700 border-violet-200' : row.type === 'B2C' ? 'bg-slate-50 text-slate-600' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                        {row.type}
                      </Badge>
                    </td>
                    <td className="p-3 text-right font-medium">{row.taxable.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right text-emerald-700">{row.cgst > 0 ? row.cgst.toLocaleString('en-IN') : '—'}</td>
                    <td className="p-3 text-right text-violet-700">{row.sgst > 0 ? row.sgst.toLocaleString('en-IN') : '—'}</td>
                    <td className="p-3 text-right text-orange-700">{row.igst > 0 ? row.igst.toLocaleString('en-IN') : '—'}</td>
                    <td className="p-3 text-right font-bold text-slate-800">{row.total.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={5} className="p-3 font-bold text-slate-700">TOTAL</td>
                  <td className="p-3 text-right font-bold">₹{totals.taxable.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-right font-bold text-emerald-700">₹{totals.cgst.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-right font-bold text-violet-700">₹{totals.sgst.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-right font-bold text-orange-700">₹{totals.igst.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-right font-bold text-blue-700">₹{totals.total.toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
