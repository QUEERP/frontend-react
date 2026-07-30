import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ReceiptIcon, DownloadIcon, PrinterIcon, TrendingUpIcon, TrendingDownIcon, CheckCircle2Icon, AlertCircleIcon, FileTextIcon, FileSpreadsheetIcon } from 'lucide-react'
import * as xlsx from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import { useBusinessData } from '@/components/dashboard/business-data-provider'

export default function GSTR3BPage() {
  const [period, setPeriod] = useState('Apr 2024')
  const { business } = useBusinessData()

  const liveLiabilities = React.useMemo(() => {
    const invoices = Array.isArray(business?.invoices) ? business.invoices : []
    let standard = { taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 }
    let zeroRated = { taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 }
    
    invoices.forEach((inv: any) => {
      const taxAmount = Number(inv.taxAmount || 0)
      const sub = Number(inv.subTotal || 0)
      if (taxAmount > 0) {
        standard.taxable += sub
        // Simple mock split for CGST/SGST vs IGST based on presence of taxId, modify as needed
        if (inv.customer?.taxId) {
          standard.igst += taxAmount
        } else {
          standard.cgst += taxAmount / 2
          standard.sgst += taxAmount / 2
        }
      } else {
        zeroRated.taxable += sub
      }
    })

    return [
      { desc: 'Outward taxable supplies (other than zero rated, nil rated and exempted)', ...standard },
      { desc: 'Outward taxable supplies (zero rated)', ...zeroRated },
      { desc: 'Other outward supplies (nil rated, exempted)', taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 },
    ]
  }, [business])

  const liveITC = React.useMemo(() => {
    const expenses = Array.isArray(business?.expenses) ? business.expenses : []
    let otherITC = { igst: 0, cgst: 0, sgst: 0, cess: 0 }
    
    expenses.forEach((exp: any) => {
      const taxAmount = Number(exp.taxAmount || 0)
      if (taxAmount > 0) {
        otherITC.cgst += taxAmount / 2
        otherITC.sgst += taxAmount / 2
      }
    })

    return [
      { desc: 'Import of goods', igst: 0, cgst: 0, sgst: 0, cess: 0 },
      { desc: 'Inward supplies liable to reverse charge', igst: 0, cgst: 0, sgst: 0, cess: 0 },
      { desc: 'All other ITC', ...otherITC },
    ]
  }, [business])

  const totalLiability = React.useMemo(() => {
    return liveLiabilities.reduce((acc: { igst: number; cgst: number; sgst: number }, r: any) => {
      acc.igst += r.igst
      acc.cgst += r.cgst
      acc.sgst += r.sgst
      return acc
    }, { igst: 0, cgst: 0, sgst: 0 })
  }, [liveLiabilities])

  const totalITC = React.useMemo(() => {
    return liveITC.reduce((acc: { igst: number; cgst: number; sgst: number }, r: any) => {
      acc.igst += r.igst
      acc.cgst += r.cgst
      acc.sgst += r.sgst
      return acc
    }, { igst: 0, cgst: 0, sgst: 0 })
  }, [liveITC])

  const netPayable = React.useMemo(() => ({
    igst: Math.max(0, totalLiability.igst - totalITC.igst),
    cgst: Math.max(0, totalLiability.cgst - totalITC.cgst),
    sgst: Math.max(0, totalLiability.sgst - totalITC.sgst),
  }), [totalLiability, totalITC])

  const exportToExcel = () => {
    const wb = xlsx.utils.book_new()
    const wsLiability = xlsx.utils.json_to_sheet(liveLiabilities)
    const wsITC = xlsx.utils.json_to_sheet(liveITC)
    xlsx.utils.book_append_sheet(wb, wsLiability, '3.1 Tax Liability')
    xlsx.utils.book_append_sheet(wb, wsITC, '4 Eligible ITC')
    xlsx.writeFile(wb, `GSTR-3B_${period}.xlsx`)
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    doc.text(`GSTR-3B Report - ${period}`, 14, 15)
    
    doc.setFontSize(10)
    doc.text('3.1 Tax on Outward and Reverse Charge Inward Supplies', 14, 25)
    autoTable(doc, {
      head: [['Details', 'Taxable Value', 'IGST', 'CGST', 'SGST', 'Cess']],
      body: liveLiabilities.map((r: any) => [r.desc, r.taxable, r.igst, r.cgst, r.sgst, r.cess]),
      startY: 28,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    })

    const finalY = (doc as any).lastAutoTable.finalY || 28
    
    doc.text('4 Eligible ITC', 14, finalY + 10)
    autoTable(doc, {
      head: [['Details', 'IGST', 'CGST', 'SGST', 'Cess']],
      body: liveITC.map((r: any) => [r.desc, r.igst, r.cgst, r.sgst, r.cess]),
      startY: finalY + 13,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    })

    doc.save(`GSTR-3B_${period}.pdf`)
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">GSTR-3B</h2>
          <p className="text-slate-500 text-sm mt-1">Monthly Summary Return — Summary of outward & inward supplies and tax payment</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={period} onChange={e => setPeriod(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white text-sm px-3 text-slate-700">
            {['Apr 2024', 'May 2024', 'Jun 2024'].map(p => <option key={p}>{p}</option>)}
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

      {/* Status Banner */}
      <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <AlertCircleIcon className="w-5 h-5 text-amber-600" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Period: {period} | Due: 20th May 2024</p>
          <p className="text-xs text-amber-600">Net Tax Payable: ₹{(netPayable.igst + netPayable.cgst + netPayable.sgst).toLocaleString('en-IN')} — Please verify before filing</p>
        </div>
        <Badge className="ml-auto bg-amber-100 text-amber-700 border-amber-200">Draft</Badge>
      </div>

      {/* Net Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUpIcon className="size-5 text-red-500" />
              <p className="text-sm font-semibold text-slate-600">Total Tax Liability</p>
            </div>
            <p className="text-2xl font-bold text-red-600">₹{(totalLiability.igst + totalLiability.cgst + totalLiability.sgst).toLocaleString('en-IN')}</p>
            <p className="text-xs text-slate-400 mt-1">IGST + CGST + SGST</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <TrendingDownIcon className="size-5 text-emerald-500" />
              <p className="text-sm font-semibold text-slate-600">Total ITC Available</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600">₹{(totalITC.igst + totalITC.cgst + totalITC.sgst).toLocaleString('en-IN')}</p>
            <p className="text-xs text-slate-400 mt-1">Input Tax Credit</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle2Icon className="size-5 text-blue-500" />
              <p className="text-sm font-semibold text-slate-600">Net Tax Payable</p>
            </div>
            <p className="text-2xl font-bold text-blue-700">₹{(netPayable.igst + netPayable.cgst + netPayable.sgst).toLocaleString('en-IN')}</p>
            <p className="text-xs text-slate-400 mt-1">After ITC offset</p>
          </CardContent>
        </Card>
      </div>

      {/* Tax Liability Table */}
      <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/60 pb-4">
          <CardTitle className="text-base">3.1 — Tax on Outward and Reverse Charge Inward Supplies</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Details', 'Taxable Value (₹)', 'IGST (₹)', 'CGST (₹)', 'SGST (₹)', 'Cess (₹)'].map(h => (
                    <th key={h} className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {liveLiabilities.map((r: any) => (
                  <tr key={r.desc} className="hover:bg-slate-50/50">
                    <td className="p-3 text-slate-700 max-w-xs">{r.desc}</td>
                    <td className="p-3 text-right font-medium">{r.taxable.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right text-orange-700">{r.igst > 0 ? r.igst.toLocaleString('en-IN') : '0'}</td>
                    <td className="p-3 text-right text-emerald-700">{r.cgst > 0 ? r.cgst.toLocaleString('en-IN') : '0'}</td>
                    <td className="p-3 text-right text-violet-700">{r.sgst > 0 ? r.sgst.toLocaleString('en-IN') : '0'}</td>
                    <td className="p-3 text-right text-slate-400">0</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ITC Table */}
      <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/60 pb-4">
          <CardTitle className="text-base">4 — Eligible ITC (Input Tax Credit)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Details', 'IGST (₹)', 'CGST (₹)', 'SGST (₹)', 'Cess (₹)'].map(h => (
                    <th key={h} className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {liveITC.map((r: any) => (
                  <tr key={r.desc} className="hover:bg-slate-50/50">
                    <td className="p-3 text-slate-700">{r.desc}</td>
                    <td className="p-3 text-right text-emerald-700">{r.igst > 0 ? r.igst.toLocaleString('en-IN') : '0'}</td>
                    <td className="p-3 text-right text-emerald-700">{r.cgst > 0 ? r.cgst.toLocaleString('en-IN') : '0'}</td>
                    <td className="p-3 text-right text-emerald-700">{r.sgst > 0 ? r.sgst.toLocaleString('en-IN') : '0'}</td>
                    <td className="p-3 text-right text-slate-400">0</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Net Payable */}
      <Card className="rounded-2xl border-blue-100 bg-blue-50/30 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-blue-100 pb-4">
          <CardTitle className="text-base text-blue-800">5.1 — Payment of Tax</CardTitle>
          <CardDescription>Tax liability after ITC utilisation</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-blue-50">
              <tr>
                {['Description', 'IGST (₹)', 'CGST (₹)', 'SGST (₹)', 'Total (₹)'].map(h => (
                  <th key={h} className="text-left p-3 text-xs font-semibold text-blue-600 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-blue-100">
                <td className="p-3 text-slate-700">Tax Liability</td>
                <td className="p-3 text-right">{totalLiability.igst.toLocaleString('en-IN')}</td>
                <td className="p-3 text-right">{totalLiability.cgst.toLocaleString('en-IN')}</td>
                <td className="p-3 text-right">{totalLiability.sgst.toLocaleString('en-IN')}</td>
                <td className="p-3 text-right font-semibold">{(totalLiability.igst + totalLiability.cgst + totalLiability.sgst).toLocaleString('en-IN')}</td>
              </tr>
              <tr className="border-b border-blue-100">
                <td className="p-3 text-slate-700">ITC Utilised</td>
                <td className="p-3 text-right text-emerald-700">({totalITC.igst.toLocaleString('en-IN')})</td>
                <td className="p-3 text-right text-emerald-700">({totalITC.cgst.toLocaleString('en-IN')})</td>
                <td className="p-3 text-right text-emerald-700">({totalITC.sgst.toLocaleString('en-IN')})</td>
                <td className="p-3 text-right font-semibold text-emerald-700">({(totalITC.igst + totalITC.cgst + totalITC.sgst).toLocaleString('en-IN')})</td>
              </tr>
              <tr className="bg-blue-100/50">
                <td className="p-3 font-bold text-blue-800">Net Tax Payable</td>
                <td className="p-3 text-right font-bold text-blue-800">{netPayable.igst.toLocaleString('en-IN')}</td>
                <td className="p-3 text-right font-bold text-blue-800">{netPayable.cgst.toLocaleString('en-IN')}</td>
                <td className="p-3 text-right font-bold text-blue-800">{netPayable.sgst.toLocaleString('en-IN')}</td>
                <td className="p-3 text-right font-bold text-blue-800">{(netPayable.igst + netPayable.cgst + netPayable.sgst).toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
