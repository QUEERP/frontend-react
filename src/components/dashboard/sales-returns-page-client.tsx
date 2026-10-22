import * as React from 'react'
import { Link } from 'react-router-dom';
import { salesReturnsAPI, SalesReturn } from '@/lib/api/sales-returns'
import { contactsAPI, Customer } from '@/lib/api/contacts'
import { invoicesAPI, Invoice } from '@/lib/api/invoices'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EditableTaxSelect } from '@/components/dashboard/editable-tax-select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertCircle,
  ArrowUpLeft,
  CheckCircle2,
  Eye,
  Loader2,
  Package,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  Undo2,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useBusinessData } from '@/components/dashboard/business-data-provider'

interface Props {
  businessId: string
}

const STATUS_CONFIG: Record<string, { style: string; icon: React.ReactNode }> = {
  DRAFT: {
    style: 'bg-muted text-foreground border-border',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  RECEIVED: {
    style: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: <Package className="h-3 w-3" />,
  },
  APPROVED: {
    style: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  CANCELLED: {
    style: 'bg-rose-100 text-rose-700 border-rose-200',
    icon: <XCircle className="h-3 w-3" />,
  },
}

const REFUND_CONFIG: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  CREDIT_NOTE_ISSUED: 'bg-violet-100 text-violet-700 border-violet-200',
  REFUNDED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

const formatCurrency = (v: number, currencyCode: string = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: currencyCode, maximumFractionDigits: 2 }).format(Number(v || 0))

const formatDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

// Blank line item for the create form
const newItem = () => ({
  productId: '',
  description: '',
  quantity: 1,
  price: 0,
  taxPercent: 0,
  total: 0,
})

export function SalesReturnsPageClient({ businessId }: Props) {
  const { business } = useBusinessData()
  const [returns, setReturns] = React.useState<SalesReturn[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [createOpen, setCreateOpen] = React.useState(false)
  const [createLoading, setCreateLoading] = React.useState(false)
  const [customers, setCustomers] = React.useState<Customer[]>([])
  const [invoices, setInvoices] = React.useState<Invoice[]>([])

  // Create form
  const [form, setForm] = React.useState({
    customerId: '',
    invoiceId: '',
    salesOrderId: '',
    reason: '',
  })
  const [items, setItems] = React.useState([newItem()])

  const isBasic = business?.businessType?.toLowerCase() === 'basic'
  const selectedInvoice = invoices.find((inv) => inv.id === form.invoiceId)
  const formCurrency = selectedInvoice?.currency || business?.currency || 'INR'
  const baseCurrency = business?.currency || 'INR'

  const fetchReturns = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await salesReturnsAPI.getSalesReturns(businessId)
      setReturns(res.data || [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load sales returns')
    } finally {
      setLoading(false)
    }
  }, [businessId])

  const fetchLookups = React.useCallback(async () => {
    try {
      const [cRes, iRes] = await Promise.all([
        contactsAPI.getCustomers(businessId),
        invoicesAPI.getInvoices(businessId)
      ])
      setCustomers(cRes.customers || [])
      setInvoices(iRes.data || iRes.invoices || [])
    } catch (err) {
      console.error('Failed to load lookups', err)
    }
  }, [businessId])

  React.useEffect(() => {
    fetchReturns()
    fetchLookups()
  }, [fetchReturns, fetchLookups])

  // Item helpers
  const updateItem = (idx: number, field: string, value: string | number) => {
    setItems((prev) => {
      const next = [...prev]
      const updated = { ...next[idx], [field]: value }
      const qty = field === 'quantity' ? Number(value) : Number(updated.quantity)
      const price = field === 'price' ? Number(value) : Number(updated.price)
      const tax = field === 'taxPercent' ? Number(value) : Number(updated.taxPercent)
      updated.total = qty * price * (1 + tax / 100)
      next[idx] = updated
      return next
    })
  }

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  const lineTotal = items.reduce((acc, i) => acc + Number(i.total || 0), 0)

  const handleCreate = async () => {
    if (!form.customerId) return toast.error('Customer ID is required')
    if (items.some((i) => !i.description)) return toast.error('All line items need a description')

    try {
      setCreateLoading(true)
      await salesReturnsAPI.createSalesReturn(businessId, {
        customerId: form.customerId,
        invoiceId: form.invoiceId || undefined,
        salesOrderId: form.salesOrderId || undefined,
        reason: form.reason || undefined,
        items: items.map((i) => ({
          productId: (i as any).productId ? (i as any).productId : undefined,
          description: i.description,
          quantity: Number(i.quantity),
          price: Number(i.price),
          taxPercent: Number(i.taxPercent),
          isStockReturned: false,
        })),
      })
      toast.success('Sales return logged and credit note issued')
      setCreateOpen(false)
      setForm({ customerId: '', invoiceId: '', salesOrderId: '', reason: '' })
      setItems([newItem()])
      fetchReturns()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create sales return')
    } finally {
      setCreateLoading(false)
    }
  }

  const filtered = React.useMemo(() => {
    const kw = search.trim().toLowerCase()
    if (!kw) return returns
    return returns.filter(
      (r) =>
        r.returnNumber?.toLowerCase().includes(kw) ||
        r.customer?.company?.toLowerCase().includes(kw) ||
        r.invoice?.invoiceNumber?.toLowerCase().includes(kw) ||
        r.status?.toLowerCase().includes(kw) ||
        r.refundStatus?.toLowerCase().includes(kw),
    )
  }, [returns, search])

  // KPI stats
  const stats = React.useMemo(() => {
    const received = returns.filter((r) => r.status === 'RECEIVED').length
    const approved = returns.filter((r) => r.status === 'APPROVED').length
    const creditIssued = returns.filter((r) => r.refundStatus === 'CREDIT_NOTE_ISSUED').length
    const totalReturned = returns.reduce((acc, r) => acc + Number(r.totalAmount || 0), 0)
    return { received, approved, creditIssued, totalReturned }
  }, [returns])

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading sales returns...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0 max-w-full overflow-x-hidden">
      {/* Clean Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sales Returns</h1>
          <p className="text-sm text-muted-foreground mt-1">Customer return requests · RMA management</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm cursor-pointer font-medium px-5">
                <Plus className="h-4 w-4" />
                Log Sales Return
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl p-0 flex flex-col gap-0 max-h-[90vh] overflow-hidden rounded-2xl">
              <div className="px-6 py-5 border-b border-border bg-muted/50 shrink-0">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <Undo2 className="h-4 w-4 text-orange-600" />
                    </div>
                    Log a Sales Return
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground font-medium ml-10 mt-1">
                    Record a customer return. A credit note will be automatically issued on submission.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="overflow-y-auto p-6 custom-scrollbar" style={{ maxHeight: 'calc(90vh - 160px)' }}>
                <div className="grid gap-6">
                {/* References */}
                <div className={`grid grid-cols-1 gap-4 ${isBasic ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
                  <div className="space-y-1.5">
                    <Label htmlFor="sr-cust" className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Customer ID <span className="text-rose-500">*</span></Label>
                    <Select value={form.customerId} onValueChange={(val) => setForm(f => ({ ...f, customerId: val, invoiceId: '' }))}>
                      <SelectTrigger id="sr-cust" className="rounded-xl border-border h-10 focus-visible:ring-blue-500">
                        <SelectValue placeholder="Select Customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.company || c.name || c.id}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sr-inv" className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Invoice ID <span className="text-slate-400 font-normal normal-case tracking-normal">(optional)</span></Label>
                    <Select value={form.invoiceId || 'none'} onValueChange={(val) => setForm(f => ({ ...f, invoiceId: val === 'none' ? '' : val }))}>
                      <SelectTrigger id="sr-inv" className="rounded-xl border-border h-10 focus-visible:ring-blue-500">
                        <SelectValue placeholder="Select Invoice" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {invoices.filter(inv => !form.customerId || inv.customerId === form.customerId).map(inv => (
                          <SelectItem key={inv.id} value={inv.id}>{inv.invoiceNumber}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!isBasic && (
                  <div className="space-y-1.5">
                    <Label htmlFor="sr-so" className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Sales Order ID <span className="text-slate-400 font-normal normal-case tracking-normal">(optional)</span></Label>
                    <Input
                      id="sr-so"
                      placeholder="so_def456"
                      value={form.salesOrderId}
                      onChange={(e) => setForm((f) => ({ ...f, salesOrderId: e.target.value }))}
                      className="rounded-xl border-border h-10 focus-visible:ring-blue-500"
                    />
                  </div>
                  )}
                </div>

                {/* Reason */}
                <div className="space-y-1.5">
                  <Label htmlFor="sr-reason" className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Return Reason</Label>
                  <Textarea
                    id="sr-reason"
                    placeholder="e.g. Defective product, incorrect item shipped..."
                    rows={2}
                    value={form.reason}
                    onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                    className="rounded-xl border-border focus-visible:ring-blue-500 resize-none"
                  />
                </div>

                {/* Line Items */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground font-bold text-sm">Returned Items</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 gap-1.5 font-semibold shadow-sm cursor-pointer"
                      onClick={() => setItems((prev) => [...prev, newItem()])}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Item
                    </Button>
                  </div>
                  <div className="rounded-xl border border-border overflow-hidden shadow-sm">
                    <Table>
                      <TableHeader className="bg-muted/80">
                        <TableRow className="hover:bg-background">
                          <TableHead className="h-10 text-[11px] font-bold uppercase tracking-wider text-muted-foreground w-[35%]">Description</TableHead>
                          <TableHead className="h-10 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Qty</TableHead>
                          <TableHead className="h-10 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Price</TableHead>
                          <TableHead className="h-10 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Tax %</TableHead>
                          <TableHead className="h-10 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">Total</TableHead>
                          <TableHead className="h-10 w-8" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item, idx) => (
                          <TableRow key={idx} className="hover:bg-muted/50">
                            <TableCell className="p-2 space-y-2">
                              {form.invoiceId && (
                                <Select onValueChange={(itemId) => {
                                  const inv = invoices.find(i => i.id === form.invoiceId)
                                  const item = inv?.items?.find(it => it.id === itemId)
                                  if (item) {
                                    updateItem(idx, 'productId', (item as any).productId || '')
                                    updateItem(idx, 'description', item.description || '')
                                    updateItem(idx, 'price', (item as any).rate || (item as any).price || 0)
                                    updateItem(idx, 'taxPercent', item.taxPercent || 0)
                                    updateItem(idx, 'quantity', item.quantity || 1)
                                  }
                                }}>
                                  <SelectTrigger className="h-9 text-xs rounded-lg bg-blue-50/50 border-blue-100 text-blue-700">
                                    <SelectValue placeholder="Select from Invoice..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {invoices.find(i => i.id === form.invoiceId)?.items?.map(it => (
                                      <SelectItem key={it.id} value={it.id}>{it.description} (Qty: {it.quantity})</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                              <Input
                                placeholder="Item description"
                                value={item.description}
                                onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                className="h-9 rounded-lg border-border text-sm focus-visible:ring-blue-500"
                              />
                            </TableCell>
                            <TableCell className="p-2">
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                className="h-9 w-16 rounded-lg border-border text-sm focus-visible:ring-blue-500"
                              />
                            </TableCell>
                            <TableCell className="p-2">
                              <Input
                                type="number"
                                min="0"
                                value={item.price}
                                onChange={(e) => updateItem(idx, 'price', e.target.value)}
                                className="h-9 w-24 rounded-lg border-border text-sm focus-visible:ring-blue-500"
                              />
                            </TableCell>
                            <TableCell className="p-2">
                              <EditableTaxSelect
                                value={item.taxPercent ?? 0}
                                onChange={(val) => updateItem(idx, 'taxPercent', Number(val))}
                                options={[0, 5, 12, 15, 18, 28]}
                                size="sm"
                              />
                            </TableCell>
                            <TableCell className="p-2 text-right font-mono text-sm font-bold text-foreground">
                              {formatCurrency(item.total, formCurrency)}
                            </TableCell>
                            <TableCell className="p-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                onClick={() => removeItem(idx)}
                                disabled={items.length === 1}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex justify-end pt-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Total Return Value:&nbsp;
                      <span className="text-xl font-bold text-orange-600">{formatCurrency(lineTotal, formCurrency)}</span>
                    </span>
                  </div>
                </div>

                {/* Auto-credit note info */}
                <div className="flex items-start gap-3 rounded-xl bg-violet-50 border border-violet-100 p-4 text-sm text-violet-800 shadow-sm mt-2">
                  <ShieldCheck className="h-5 w-5 mt-0.5 shrink-0 text-violet-600" />
                  <div className="flex flex-col">
                    <span className="font-semibold">Automatic Credit Note</span>
                    <span className="text-violet-600/80 mt-0.5">
                      A Credit Note will be automatically issued to the customer upon submission of this return.
                    </span>
                  </div>
                </div>
              </div>
              </div>

              <div className="px-6 py-4 border-t border-border bg-muted/30 shrink-0 flex justify-end gap-3">
                <Button
                  variant="outline"
                  className="rounded-xl h-10 border-border text-muted-foreground hover:bg-muted hover:text-foreground font-semibold cursor-pointer"
                  onClick={() => {
                    setCreateOpen(false)
                    setForm({ customerId: '', invoiceId: '', salesOrderId: '', reason: '' })
                    setItems([newItem()])
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createLoading} className="rounded-xl h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 shadow-sm cursor-pointer">
                  {createLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit Return
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Items Received', value: stats.received, sub: 'Pending review', icon: ArrowUpLeft, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800' },
          { label: 'Approved Returns', value: stats.approved, sub: 'Verified & processed', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800' },
          { label: 'Credits Issued', value: stats.creditIssued, sub: 'Credit notes sent', icon: RotateCcw, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100 dark:bg-violet-900/20 dark:border-violet-800' },
          { label: 'Total Returned Value', value: formatCurrency(stats.totalReturned, baseCurrency), sub: 'All time returns', icon: Undo2, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100 dark:bg-orange-900/20 dark:border-orange-800' },
        ].map(stat => (
          <Card key={stat.label} className="border-border bg-card shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-black text-foreground mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-1">{stat.sub}</p>
                </div>
                <div className={`flex items-center justify-center h-12 w-12 rounded-xl border ${stat.bg} ${stat.color} shadow-sm shrink-0`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Returns Table ── */}
      <Card className="w-full min-w-0 max-w-full rounded-2xl border-border bg-card shadow-sm overflow-hidden flex-1 flex flex-col">
        <CardHeader className="border-b border-border bg-muted/50 pb-5 pt-6 px-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Sales Returns Directory</CardTitle>
              <CardDescription className="text-sm font-medium text-muted-foreground mt-1">
                Showing <span className="text-foreground font-semibold">{filtered.length}</span> of {returns.length} returns
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search return #, customer, invoice..."
                className="pl-9 h-10 rounded-xl border-border bg-card w-full focus-visible:ring-blue-500 text-sm shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <div className="p-0 border-t-0 flex-1 overflow-x-auto max-w-full w-full min-w-0 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Undo2 className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">No sales returns found</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                Log a return when a customer sends back goods or requests a credit.
              </p>
              <Button className="mt-4 h-10 cursor-pointer rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm font-medium px-5" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Log First Return
              </Button>
            </div>
          ) : (
            <Table className="w-full min-w-[850px]">
              <TableHeader className="bg-muted dark:bg-[#181a20] sticky top-0 z-10 border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <TableRow className="hover:bg-muted dark:hover:bg-[#181a20] border-b border-border">
                  <TableHead className="pl-6 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Return #</TableHead>
                  <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Customer</TableHead>
                  <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Invoice Ref</TableHead>
                  <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                  <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Refund Status</TableHead>
                  <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Date</TableHead>
                  <TableHead className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">Return Value</TableHead>
                  <TableHead className="pr-6 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((ret) => {
                  const statusConf = STATUS_CONFIG[ret.status] || {
                    style: 'bg-muted text-foreground border-border',
                    icon: <AlertCircle className="h-3 w-3" />,
                  }
                  return (
                    <TableRow key={ret.id} className="group hover:bg-muted/50 border-b border-border transition-colors">
                      <TableCell className="py-4">
                        <span className="font-bold text-sm text-blue-700 cursor-pointer hover:underline">
                          <Link to={`/dashboard/${businessId}/sales-returns/${ret.id}`}>{ret.returnNumber}</Link>
                        </span>
                      </TableCell>
                      <TableCell className="py-4 font-semibold text-foreground text-sm">
                        {ret.customer?.company || ret.customerId}
                      </TableCell>
                      <TableCell className="py-4 text-sm font-medium text-muted-foreground">
                        {ret.invoice?.invoiceNumber || ret.salesOrder?.orderNumber || '—'}
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge
                          variant="outline"
                          className={`flex w-fit items-center gap-1.5 px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider ${statusConf.style}`}
                        >
                          {statusConf.icon}
                          {ret.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge
                          variant="outline"
                          className={`px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider ${REFUND_CONFIG[ret.refundStatus] || 'bg-muted text-foreground border-border'}`}
                        >
                          {ret.refundStatus?.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-sm font-medium text-muted-foreground">{formatDate(ret.createdAt)}</TableCell>
                      <TableCell className="py-4 text-right">
                        <span className="font-bold text-sm text-orange-600">{formatCurrency(ret.totalAmount, (ret.invoice as any)?.currency || baseCurrency)}</span>
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <Button asChild variant="outline" size="sm" className="h-8 rounded-lg cursor-pointer border-border bg-card hover:bg-blue-50 hover:text-blue-600 text-muted-foreground font-medium shadow-sm">
                          <Link to={`/dashboard/${businessId}/sales-returns/${ret.id}`}>
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  )
}
