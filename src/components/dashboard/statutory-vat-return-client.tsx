import { toast } from 'sonner';
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { useToast } from '@/components/ui/use-toast'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { DownloadIcon, PrinterIcon, CheckCircleIcon, AlertCircleIcon, Loader2Icon, FileTextIcon, FileSpreadsheetIcon } from 'lucide-react'
import { exportToExcel, exportToPdf, printPage } from '@/lib/export-utils'

// ── UAE VAT Return Boxes ────────────────────────────────────────────────────
const UAE_VAT_BOXES = [
  { box: '1a', label: 'Standard rated supplies in UAE', amount: '950,000.00', vat: '47,500.00', type: 'output' },
  { box: '1b', label: 'Tax refunds provided to tourists', amount: '—', vat: '0.00', type: 'output' },
  { box: '2',  label: 'Supplies subject to domestic reverse charge', amount: '0.00', vat: '0.00', type: 'output' },
  { box: '3',  label: 'Zero-rated supplies', amount: '200,000.00', vat: '0.00', type: 'output' },
  { box: '4',  label: 'Exempt supplies', amount: '100,000.00', vat: '0.00', type: 'output' },
  { box: '5',  label: 'Total value of sales', amount: '1,250,000.00', vat: '47,500.00', type: 'total' },
  { box: '6a', label: 'Standard rated expenses (recoverable VAT)', amount: '650,000.00', vat: '32,500.00', type: 'input' },
  { box: '6b', label: 'Supplies subject to reverse charge (as recipient)', amount: '0.00', vat: '0.00', type: 'input' },
  { box: '7',  label: 'Total value of expenses', amount: '850,000.00', vat: '32,500.00', type: 'total' },
  { box: '8',  label: 'Total VAT due for current period', amount: '', vat: '47,500.00', type: 'payable' },
  { box: '9',  label: 'Total recoverable VAT for current period', amount: '', vat: '32,500.00', type: 'payable' },
  { box: '10', label: 'Profit Margin Scheme', amount: '0.00', vat: '0.00', type: 'output' },
  { box: '11', label: 'Tax refunds from previous periods', amount: '', vat: '0.00', type: 'input' },
  { box: '12', label: 'Net VAT due (payable to FTA)', amount: '', vat: '15,000.00', type: 'net' },
  { box: '13', label: 'Excess recoverable VAT refunded', amount: '', vat: '0.00', type: 'net' },
  { box: '14', label: 'Net VAT refundable from FTA', amount: '', vat: '0.00', type: 'net' },
]

// ── India GSTR-3B Rows ──────────────────────────────────────────────────────
const INDIA_GST_ROWS = [
  { box: '3.1(a)', label: 'Outward taxable supplies (other than zero rated, nil and exempt)', amount: '50,00,000.00', vat: '9,00,000.00', type: 'output' },
  { box: '3.1(b)', label: 'Outward taxable supplies (zero rated)', amount: '12,00,000.00', vat: '0.00', type: 'output' },
  { box: '3.1(c)', label: 'Other outward supplies (Nil rated, exempt)', amount: '5,00,000.00', vat: '0.00', type: 'output' },
  { box: '3.1(d)', label: 'Inward supplies (liable to reverse charge)', amount: '2,00,000.00', vat: '36,000.00', type: 'output' },
  { box: '3.1(e)', label: 'Non-GST outward supplies', amount: '0.00', vat: '0.00', type: 'output' },
  { box: '3.2',   label: 'Total outward taxable supplies', amount: '69,00,000.00', vat: '9,36,000.00', type: 'total' },
  { box: '4A',    label: 'ITC from suppliers (IGST)', amount: '10,00,000.00', vat: '3,60,000.00', type: 'input' },
  { box: '4B',    label: 'ITC from suppliers (CGST)', amount: '10,00,000.00', vat: '1,80,000.00', type: 'input' },
  { box: '4C',    label: 'ITC from suppliers (SGST)', amount: '10,00,000.00', vat: '1,80,000.00', type: 'input' },
  { box: '4D',    label: 'Ineligible ITC (Rule 42 / 43)', amount: '', vat: '0.00', type: 'input' },
  { box: '5.1',   label: 'Total ITC Available', amount: '30,00,000.00', vat: '6,30,000.00', type: 'total' },
  { box: '6.1',   label: 'Total GST payable (IGST)', amount: '', vat: '1,80,000.00', type: 'payable' },
  { box: '6.2',   label: 'Total GST payable (CGST)', amount: '', vat: '90,000.00', type: 'payable' },
  { box: '6.3',   label: 'Total GST payable (SGST)', amount: '', vat: '90,000.00', type: 'payable' },
  { box: '6.4',   label: 'Net GST payable (after ITC)', amount: '', vat: '2,70,000.00', type: 'net' },
  { box: '6.5',   label: 'Late fee / Interest (if any)', amount: '', vat: '0.00', type: 'net' },
]

const typeStyles: Record<string, string> = {
  output: 'bg-amber-50 dark:bg-amber-900/10',
  input:  'bg-emerald-50 dark:bg-emerald-900/10',
  total:  'bg-blue-50 dark:bg-blue-900/10 font-semibold',
  payable:'bg-muted dark:bg-slate-800/40 font-semibold',
  net:    'bg-indigo-50 dark:bg-indigo-900/20 font-bold',
}

const typeLabel: Record<string, { label: string; className: string }> = {
  output:  { label: 'Output',     className: 'bg-amber-100 text-amber-700 border-0' },
  input:   { label: 'Input',      className: 'bg-emerald-100 text-emerald-700 border-0' },
  total:   { label: 'Subtotal',   className: 'bg-blue-100 text-blue-700 border-0' },
  payable: { label: 'Calculated', className: 'bg-slate-200 text-foreground border-0' },
  net:     { label: 'Net',        className: 'bg-indigo-100 text-indigo-700 border-0' },
}

export default function StatutoryVatReturnClient() {
  const { toast } = useToast()
  const { business } = useBusinessData()
  const isIndia = (business as any)?.country === 'INDIA'
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const BOXES = isIndia ? INDIA_GST_ROWS : UAE_VAT_BOXES
  const taxLabel = isIndia ? 'GST' : 'VAT'
  const authority = isIndia ? 'GSTN' : 'UAE FTA'
  const period = isIndia ? 'GSTR-3B — Q2 FY2025-26 (Apr – Jun)' : 'UAE FTA VAT Return — Q2 2025 (Apr – Jun)'
  const curr = isIndia ? 'INR' : 'AED'
  const netPayable = isIndia ? '₹2,70,000.00' : 'AED 15,000.00'
  const submitLabel = isIndia ? 'File on GSTN Portal' : 'Submit to FTA'
  const taxRegNum = isIndia ? '27AABCS1234A1ZX' : '100-123-456-700-003'
  const taxRegLabel = isIndia ? 'GSTIN' : 'TRN Number'
  const dueDate = isIndia ? '20 Jul 2025' : '28 July 2025'

  const handleSubmit = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)
      toast({ title: 'Successfully filed', description: `${taxLabel} Return has been submitted to ${authority}.`, variant: 'default' })
    }, 2000)
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 bg-muted/50 dark:bg-slate-900/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {taxLabel} Return
          </h1>
          <p className="text-muted-foreground mt-1">{period}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={printPage}><PrinterIcon className="size-4 mr-1" />Print</Button>
          <Button variant="outline" size="sm" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
            onClick={() => exportToExcel(BOXES, `${taxLabel}_Return_Q2`)}>
            <FileSpreadsheetIcon className="size-4 mr-1" />Excel
          </Button>
          <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white" onClick={() => {
            const cols = ['Box / Section', 'Description', 'Type', `Amount (${curr})`, `${taxLabel} (${curr})`]
            const data = BOXES.map(r => [r.box, r.label, r.type, r.amount, r.vat])
            exportToPdf(`${taxLabel} Return — ${period}`, cols, data, `${taxLabel}_Return_Q2`)
          }}>
            <FileTextIcon className="size-4 mr-1" />PDF
          </Button>
        </div>
      </div>

      {/* Filing Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm bg-card dark:bg-slate-900">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircleIcon className="size-8 text-emerald-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{taxRegLabel}</p>
              <p className="font-bold text-base">{taxRegNum}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card dark:bg-slate-900">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircleIcon className="size-8 text-amber-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Tax Period</p>
              <p className="font-bold text-base">01 Apr 2025 – 30 Jun 2025</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card dark:bg-slate-900">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircleIcon className="size-8 text-rose-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Filing Due Date</p>
              <p className="font-bold text-base">{dueDate}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Return Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="border-none shadow-sm bg-card dark:bg-slate-900">
          <CardHeader>
            <CardTitle>{taxLabel} Return {isIndia ? 'Sections (GSTR-3B)' : 'Boxes'}</CardTitle>
            <CardDescription>As required by {authority}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border dark:border-slate-700">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium w-20">{isIndia ? 'Section' : 'Box'}</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Description</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium w-24">Type</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Amount ({curr})</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">{taxLabel} ({curr})</th>
                  </tr>
                </thead>
                <tbody>
                  {BOXES.map((row) => (
                    <tr key={row.box} className={`border-b border-slate-50 dark:border-slate-800/50 ${typeStyles[row.type]}`}>
                      <td className="py-3 px-4 font-bold text-muted-foreground">{row.box}</td>
                      <td className="py-3 px-4">{row.label}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={typeLabel[row.type].className}>{typeLabel[row.type].label}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-mono">{row.amount}</td>
                      <td className={`py-3 px-4 text-right font-mono ${row.type === 'net' ? 'text-indigo-600 text-base font-bold' : ''}`}>{row.vat}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Submit Banner */}
      <Card className="border-none shadow-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm uppercase tracking-wider">
              Net {taxLabel} Payable to {authority}
            </p>
            <p className="text-5xl font-bold mt-1">{netPayable}</p>
          </div>
          <Button variant="secondary" size="lg" disabled={isSubmitting || isSubmitted} onClick={handleSubmit}>
            {isSubmitting ? (
              <><Loader2Icon className="size-5 mr-2 animate-spin" /> Submitting...</>
            ) : isSubmitted ? (
              <><CheckCircleIcon className="size-5 mr-2" /> Submitted</>
            ) : (
              submitLabel
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}