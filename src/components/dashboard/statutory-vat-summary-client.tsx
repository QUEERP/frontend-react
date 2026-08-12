import { toast } from 'sonner';
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { useToast } from '@/components/ui/use-toast'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import {
  TrendingUpIcon, TrendingDownIcon, PieChartIcon,
  PrinterIcon, FileTextIcon, FileSpreadsheetIcon
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// ── UAE VAT dummy data ──────────────────────────────────────────────────────
const UAE_SUMMARY = {
  period: 'Q2 2025 (Apr – Jun)',
  currency: 'AED',
  authority: 'UAE Federal Tax Authority (FTA)',
  taxLabel: 'VAT',
  outputTax: { standardRated: { amount: 950000, tax: 47500 }, zeroRated: { amount: 200000, tax: 0 }, exempt: { amount: 100000, tax: 0 }, total: 1250000, totalTax: 47500 },
  inputTax:  { standardRated: { amount: 650000, tax: 32500 }, zeroRated: { amount: 150000, tax: 0 }, exempt: { amount: 50000,  tax: 0 }, total: 850000,  totalTax: 32500 },
  netTaxPayable: 15000,
}

// ── India GST dummy data ─────────────────────────────────────────────────────
const INDIA_SUMMARY = {
  period: 'Q2 FY2025-26 (Apr – Jun)',
  currency: 'INR',
  authority: 'GSTN / Indian Tax Authority',
  taxLabel: 'GST',
  outputTax: {
    standardRated: { amount: 5000000, tax: 900000 },   // 18% GST
    zeroRated:     { amount: 1200000, tax: 0 },          // Exports / SEZ
    exempt:        { amount: 500000,  tax: 0 },          // Nil-rated
    total: 6700000, totalTax: 900000
  },
  inputTax: {
    standardRated: { amount: 3500000, tax: 630000 },
    zeroRated:     { amount: 800000,  tax: 0 },
    exempt:        { amount: 200000,  tax: 0 },
    total: 4500000, totalTax: 630000
  },
  netTaxPayable: 270000,
}

export default function StatutoryVatSummaryClient() {
  const { toast } = useToast()
  const { business } = useBusinessData()
  const isIndia = (business as any)?.country === 'INDIA'

  const S = isIndia ? INDIA_SUMMARY : UAE_SUMMARY
  const taxLabel = S.taxLabel
  const curr = S.currency

  const fmtAmt = (n: number) => `${curr} ${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

  const summaryCards = [
    { label: 'Total Sales', value: fmtAmt(S.outputTax.total), sub: isIndia ? 'Incl. Taxable + Exempt + Exports' : `5% VAT on ${curr} ${(S.outputTax.standardRated.amount).toLocaleString()}`, icon: TrendingUpIcon, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: `Output ${taxLabel}`, value: fmtAmt(S.outputTax.totalTax), sub: 'Collected from customers', icon: PieChartIcon, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Total Purchases', value: fmtAmt(S.inputTax.total), sub: isIndia ? 'Incl. Taxable + Exempt + Exports' : `5% VAT on ${curr} ${(S.inputTax.standardRated.amount).toLocaleString()}`, icon: TrendingDownIcon, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
    { label: `Input ${taxLabel}`, value: fmtAmt(S.inputTax.totalTax), sub: isIndia ? 'ITC Claimable' : 'Reclaimable from FTA', icon: PieChartIcon, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  ]

  const salesRows = isIndia ? [
    { category: 'Standard Rated Sales (18% GST)', taxable: S.outputTax.standardRated.amount.toLocaleString(), taxRate: '18%', taxAmount: S.outputTax.standardRated.tax.toLocaleString(), total: (S.outputTax.standardRated.amount + S.outputTax.standardRated.tax).toLocaleString() },
    { category: 'Zero Rated / Export Sales (0%)', taxable: S.outputTax.zeroRated.amount.toLocaleString(), taxRate: '0%', taxAmount: '0', total: S.outputTax.zeroRated.amount.toLocaleString() },
    { category: 'Nil Rated / Exempt Sales', taxable: S.outputTax.exempt.amount.toLocaleString(), taxRate: 'Exempt', taxAmount: '0', total: S.outputTax.exempt.amount.toLocaleString() },
  ] : [
    { category: 'Standard Rated Sales (5%)', taxable: S.outputTax.standardRated.amount.toLocaleString(), taxRate: '5%', taxAmount: S.outputTax.standardRated.tax.toLocaleString(), total: (S.outputTax.standardRated.amount + S.outputTax.standardRated.tax).toLocaleString() },
    { category: 'Zero Rated Sales (0%)', taxable: S.outputTax.zeroRated.amount.toLocaleString(), taxRate: '0%', taxAmount: '0', total: S.outputTax.zeroRated.amount.toLocaleString() },
    { category: 'Exempt Sales', taxable: S.outputTax.exempt.amount.toLocaleString(), taxRate: 'Exempt', taxAmount: '0', total: S.outputTax.exempt.amount.toLocaleString() },
  ]

  const purchaseRows = isIndia ? [
    { category: 'Standard Rated Purchases (18% GST)', taxable: S.inputTax.standardRated.amount.toLocaleString(), taxRate: '18%', taxAmount: S.inputTax.standardRated.tax.toLocaleString(), total: (S.inputTax.standardRated.amount + S.inputTax.standardRated.tax).toLocaleString() },
    { category: 'Zero Rated / Import Purchases (0%)', taxable: S.inputTax.zeroRated.amount.toLocaleString(), taxRate: '0%', taxAmount: '0', total: S.inputTax.zeroRated.amount.toLocaleString() },
    { category: 'Nil Rated / Exempt Purchases', taxable: S.inputTax.exempt.amount.toLocaleString(), taxRate: 'Exempt', taxAmount: '0', total: S.inputTax.exempt.amount.toLocaleString() },
  ] : [
    { category: 'Standard Rated Purchases (5%)', taxable: S.inputTax.standardRated.amount.toLocaleString(), taxRate: '5%', taxAmount: S.inputTax.standardRated.tax.toLocaleString(), total: (S.inputTax.standardRated.amount + S.inputTax.standardRated.tax).toLocaleString() },
    { category: 'Zero Rated Purchases (0%)', taxable: S.inputTax.zeroRated.amount.toLocaleString(), taxRate: '0%', taxAmount: '0', total: S.inputTax.zeroRated.amount.toLocaleString() },
    { category: 'Exempt Purchases', taxable: S.inputTax.exempt.amount.toLocaleString(), taxRate: 'Exempt', taxAmount: '0', total: S.inputTax.exempt.amount.toLocaleString() },
  ]

  const amtHeader = `Taxable Amt (${curr})`
  const taxHeader = `${taxLabel} Amt (${curr})`
  const totalHeader = `Total (${curr})`

  const handleExcel = () => {
    const wb = XLSX.utils.book_new()
    const salesData = salesRows.map(r => ({
      Category: r.category,
      [amtHeader]: parseFloat(r.taxable.replace(/,/g, '')),
      [`${taxLabel} Rate`]: r.taxRate,
      [taxHeader]: parseFloat(r.taxAmount.replace(/,/g, '')),
      [totalHeader]: parseFloat(r.total.replace(/,/g, ''))
    }))
    salesData.push({ Category: 'Total', [amtHeader]: S.outputTax.total, [`${taxLabel} Rate`]: '-', [taxHeader]: S.outputTax.totalTax, [totalHeader]: S.outputTax.total + S.outputTax.totalTax })

    const purchaseData = purchaseRows.map(r => ({
      Category: r.category,
      [amtHeader]: parseFloat(r.taxable.replace(/,/g, '')),
      [`${taxLabel} Rate`]: r.taxRate,
      [taxHeader]: parseFloat(r.taxAmount.replace(/,/g, '')),
      [totalHeader]: parseFloat(r.total.replace(/,/g, ''))
    }))
    purchaseData.push({ Category: 'Total', [amtHeader]: S.inputTax.total, [`${taxLabel} Rate`]: '-', [taxHeader]: S.inputTax.totalTax, [totalHeader]: S.inputTax.total + S.inputTax.totalTax })

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(salesData), `Output ${taxLabel} (Sales)`)
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(purchaseData), `Input ${taxLabel} (Purchases)`)
    XLSX.writeFile(wb, `${taxLabel}_Summary_${S.period.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`)
    toast({ title: 'Excel exported successfully!' })
  }

  const handlePDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text(`${taxLabel} Summary`, 14, 22)
    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(`Period: ${S.period} — ${S.authority}`, 14, 30)
    doc.setFontSize(14)
    doc.setTextColor(0)
    doc.text(`Output Tax (Sales)`, 14, 45)
    autoTable(doc, {
      startY: 50,
      head: [['Category', amtHeader, `${taxLabel} Rate`, taxHeader, totalHeader]],
      body: salesRows.map(r => [r.category, r.taxable, r.taxRate, r.taxAmount, r.total]),
      foot: [['Total', S.outputTax.total.toLocaleString(), '-', S.outputTax.totalTax.toLocaleString(), (S.outputTax.total + S.outputTax.totalTax).toLocaleString()]]
    })
    doc.text('Input Tax (Purchases)', 14, (doc as any).lastAutoTable.finalY + 15)
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Category', amtHeader, `${taxLabel} Rate`, taxHeader, totalHeader]],
      body: purchaseRows.map(r => [r.category, r.taxable, r.taxRate, r.taxAmount, r.total]),
      foot: [['Total', S.inputTax.total.toLocaleString(), '-', S.inputTax.totalTax.toLocaleString(), (S.inputTax.total + S.inputTax.totalTax).toLocaleString()]]
    })
    const finalY = (doc as any).lastAutoTable.finalY
    doc.setFontSize(14)
    doc.text(`Net ${taxLabel} Payable: ${fmtAmt(S.netTaxPayable)}`, 14, finalY + 20)
    doc.save(`${taxLabel}_Summary_${S.period.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`)
    toast({ title: 'PDF exported successfully!' })
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 bg-muted/50 dark:bg-slate-900/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {taxLabel} Summary
          </h1>
          <p className="text-muted-foreground mt-1">
            Period: {S.period} &mdash; {S.authority}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}><PrinterIcon className="size-4 mr-1" />Print</Button>
          <Button variant="outline" size="sm" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700" onClick={handleExcel}><FileSpreadsheetIcon className="size-4 mr-1" />Excel</Button>
          <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white" onClick={handlePDF}><FileTextIcon className="size-4 mr-1" />PDF</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((c, i) => (
          <Card key={i} className="border-none shadow-sm bg-card dark:bg-slate-900">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <p className="text-2xl font-bold mt-1">{c.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
                </div>
                <div className={`p-2 rounded-lg ${c.bg}`}><c.icon className={`size-5 ${c.color}`} /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Net Tax Banner */}
      <Card className="border-none shadow-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-sm text-white/70 uppercase tracking-wider">
              Net {taxLabel} Payable{isIndia ? ' to GSTN' : ' to FTA'}
            </p>
            <p className="text-5xl font-bold mt-1">{fmtAmt(S.netTaxPayable)}</p>
            <p className="text-sm text-white/60 mt-1">
              Output {taxLabel} ({fmtAmt(S.outputTax.totalTax)}) − Input {taxLabel} ({fmtAmt(S.inputTax.totalTax)})
            </p>
          </div>
          <div className="flex gap-3">
            <Badge className="bg-card/20 text-white border-0 px-4 py-2 text-base">
              {isIndia ? 'Due: 20th of next month' : 'Due: 28 Jul 2025'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Output Tax (Sales) Table */}
      <Card className="border-none shadow-sm bg-card dark:bg-slate-900">
        <CardHeader>
          <CardTitle>Output Tax (Sales)</CardTitle>
          <CardDescription>Breakdown of sales by {taxLabel} category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border dark:border-slate-800">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Category</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">{amtHeader}</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">{taxLabel} Rate</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">{taxHeader}</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">{totalHeader}</th>
              </tr></thead>
              <tbody>
                {salesRows.map((r, i) => (
                  <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-muted dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-medium">{r.category}</td>
                    <td className="py-3 px-4 text-right">{r.taxable}</td>
                    <td className="py-3 px-4 text-right"><Badge variant="outline">{r.taxRate}</Badge></td>
                    <td className="py-3 px-4 text-right font-semibold text-amber-600">{r.taxAmount}</td>
                    <td className="py-3 px-4 text-right font-semibold">{r.total}</td>
                  </tr>
                ))}
                <tr className="bg-muted dark:bg-slate-800/40 font-bold">
                  <td className="py-3 px-4">Total</td>
                  <td className="py-3 px-4 text-right">{S.outputTax.total.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">—</td>
                  <td className="py-3 px-4 text-right text-amber-600">{S.outputTax.totalTax.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">{(S.outputTax.total + S.outputTax.totalTax).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Input Tax (Purchases) Table */}
      <Card className="border-none shadow-sm bg-card dark:bg-slate-900">
        <CardHeader>
          <CardTitle>Input Tax (Purchases)</CardTitle>
          <CardDescription>Breakdown of purchases by {taxLabel} category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border dark:border-slate-800">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Category</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">{amtHeader}</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">{taxLabel} Rate</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">{taxHeader}</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">{totalHeader}</th>
              </tr></thead>
              <tbody>
                {purchaseRows.map((r, i) => (
                  <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-muted dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-medium">{r.category}</td>
                    <td className="py-3 px-4 text-right">{r.taxable}</td>
                    <td className="py-3 px-4 text-right"><Badge variant="outline">{r.taxRate}</Badge></td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-600">{r.taxAmount}</td>
                    <td className="py-3 px-4 text-right font-semibold">{r.total}</td>
                  </tr>
                ))}
                <tr className="bg-muted dark:bg-slate-800/40 font-bold">
                  <td className="py-3 px-4">Total</td>
                  <td className="py-3 px-4 text-right">{S.inputTax.total.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">—</td>
                  <td className="py-3 px-4 text-right text-emerald-600">{S.inputTax.totalTax.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">{(S.inputTax.total + S.inputTax.totalTax).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
