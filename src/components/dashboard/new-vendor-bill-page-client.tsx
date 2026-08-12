import { toast } from 'sonner';
import React, { useCallback, useEffect, useState } from 'react'
import {  useNavigate, useParams  } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { FileText, ArrowLeft, Plus, Trash2, Loader2, Receipt, ReceiptText } from 'lucide-react'
import { vendorBillsAPI, vendorsAPI, Vendor } from '@/lib/api/purchase'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { EditableTaxSelect } from '@/components/dashboard/editable-tax-select'
import { CurrencySelect } from '@/components/ui/currency-select'
import { getCurrencySymbol } from '@/lib/currencies'

interface BillItem { description: string; quantity: number; unitPrice: number; taxPercent: number }

export default function NewVendorBillPageClient() {
  const pathname = useLocation().pathname;
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || '';
  const params = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  

  const [vendors, setVendors] = useState<Vendor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [vendorId, setVendorId] = useState('')
  const [billNumber, setBillNumber] = useState(`BILL-${Date.now().toString().slice(-6)}`)
  const [billDate, setBillDate] = useState(new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState('')
  const [currency, setCurrency] = useState('INR')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<BillItem[]>([{ description: '', quantity: 1, unitPrice: 0, taxPercent: 0 }])

  const fetchVendors = useCallback(async () => {
    if (!businessId) return
    try {
      setIsLoading(true)
      const res = await vendorsAPI.getAll(businessId)
      setVendors(res.vendors || [])
    } catch { toast({ title: 'Failed to load vendors', variant: 'destructive' }) }
    finally { setIsLoading(false) }
  }, [businessId])
  
  useEffect(() => { fetchVendors() }, [fetchVendors])

  const addItem = () => setItems(p => [...p, { description: '', quantity: 1, unitPrice: 0, taxPercent: 0 }])
  const removeItem = (i: number) => setItems(p => p.length === 1 ? p : p.filter((_, idx) => idx !== i))
  const updateItem = (i: number, f: keyof BillItem, v: string | number) => setItems(p => p.map((item, idx) => idx === i ? { ...item, [f]: v } : item))

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const tax = items.reduce((s, i) => s + (i.quantity * i.unitPrice * i.taxPercent) / 100, 0)
  const total = subtotal + tax

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vendorId) { toast({ title: 'Please select a vendor', variant: 'destructive' }); return }
    const validItems = items.filter(i => i.description.trim() && i.quantity > 0)
    if (validItems.length === 0) { toast({ title: 'Add at least one item', variant: 'destructive' }); return }
    try {
      setIsSubmitting(true)
      await vendorBillsAPI.create(businessId, { vendorId, billNumber: billNumber || undefined, billDate, dueDate: dueDate || undefined, currency, notes, items: validItems, subtotal, taxAmount: tax, totalAmount: total } as any)
      toast({ title: 'Vendor bill created' })
      navigate(`/dashboard/${businessId}/vendor-bills`)
    } catch (err: any) {
      toast({ title: err?.message || 'Failed to create bill', variant: 'destructive' })
    } finally { setIsSubmitting(false) }
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background dark:bg-[#121418] px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0">
      <div className="max-w-5xl mx-auto w-full space-y-6 animate-in fade-in duration-500">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card dark:bg-[#181a20] p-6 rounded-2xl border border-border dark:border-[#23272c] shadow-sm">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="sm:hidden -ml-2 size-9 rounded-full relative cursor-pointer border border-border/60 bg-muted hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 shadow-sm transition-all dark:bg-[#181a20] dark:border-[#23272c] dark:hover:bg-[#1c2128] dark:hover:border-blue-900/50" />
            <Button variant="outline" size="icon" onClick={() => navigate(`/dashboard/${businessId}/vendor-bills`)} className="hidden sm:flex size-10 rounded-xl border-border dark:border-[#23272c] hover:bg-muted dark:hover:bg-[#1c2128]">
              <ArrowLeft className="h-5 w-5 text-muted-foreground dark:text-slate-400" />
            </Button>
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl hidden sm:flex items-center justify-center">
              <ReceiptText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground dark:text-slate-100 tracking-tight">New Vendor Bill</h1>
              <p className="text-sm font-medium text-muted-foreground dark:text-slate-400 mt-0.5">Record a new bill received from a vendor</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="rounded-2xl border-border dark:border-[#23272c] shadow-sm bg-card dark:bg-[#181a20] overflow-hidden">
            <CardHeader className="bg-muted/50 dark:bg-[#1c2128]/30 pb-6 border-b border-border dark:border-[#23272c]">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground dark:text-slate-400 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                Bill Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-slate-400">Vendor *</Label>
                  <Select value={vendorId} onValueChange={setVendorId} disabled={isLoading}>
                    <SelectTrigger className="h-12 w-full border-border dark:border-[#23272c] bg-card dark:bg-[#121418] rounded-xl text-foreground dark:text-slate-200">
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map(v => <SelectItem key={v.id} value={v.id} className="font-medium">{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-slate-400">Bill Number</Label>
                  <Input value={billNumber} onChange={e => setBillNumber(e.target.value)} placeholder="BILL-001" className="h-12 border-border dark:border-[#23272c] bg-card dark:bg-[#121418] rounded-xl text-foreground dark:text-slate-200 font-mono font-medium" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-slate-400">Bill Date</Label>
                  <Input type="date" value={billDate} onChange={e => setBillDate(e.target.value)} className="h-12 border-border dark:border-[#23272c] bg-card dark:bg-[#121418] rounded-xl text-foreground dark:text-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-slate-400">Due Date</Label>
                  <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="h-12 border-border dark:border-[#23272c] bg-card dark:bg-[#121418] rounded-xl text-foreground dark:text-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-slate-400">Currency</Label>
                  <CurrencySelect
                    value={currency}
                    onChange={setCurrency}
                    className="h-12 border-border dark:border-[#23272c] bg-card dark:bg-[#121418] text-foreground dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-slate-400">Notes / Remarks</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes for internal reference..." rows={3} className="resize-none border-border dark:border-[#23272c] bg-card dark:bg-[#121418] rounded-xl p-4 text-foreground dark:text-slate-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border dark:border-[#23272c] shadow-sm bg-card dark:bg-[#181a20] overflow-hidden">
            <CardHeader className="bg-muted/50 dark:bg-[#1c2128]/30 pb-4 border-b border-border dark:border-[#23272c]">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground dark:text-slate-400">Line Items *</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-9 rounded-lg border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/30 gap-2">
                  <Plus className="h-4 w-4" /> Add Line Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 space-y-6">
              <div className="hidden md:grid grid-cols-[3fr_1fr_1fr_1fr_auto] gap-4 px-4 sm:px-0 text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-slate-400 pt-4 sm:pt-0">
                <div>Description</div>
                <div className="text-center">Qty</div>
                <div className="text-right">Unit Price</div>
                <div className="text-right">Tax %</div>
                <div className="w-10" />
              </div>
              
              <div className="space-y-3 px-4 pb-4 sm:p-0">
                {items.map((item, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-[3fr_1fr_1fr_1fr_auto] gap-4 items-center bg-muted/50 dark:bg-[#121418] p-4 rounded-xl border border-border dark:border-[#23272c] transition-colors hover:border-slate-300 dark:hover:border-slate-700">
                    <div className="space-y-1">
                      <Label className="md:hidden text-[10px] font-bold uppercase text-muted-foreground">Description</Label>
                      <Input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Item description" className="h-10 border-border dark:border-[#23272c] bg-card dark:bg-[#181a20]" />
                    </div>
                    <div className="space-y-1">
                      <Label className="md:hidden text-[10px] font-bold uppercase text-muted-foreground">Qty</Label>
                      <Input type="number" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value) || 1)} className="h-10 text-center border-border dark:border-[#23272c] bg-card dark:bg-[#181a20]" />
                    </div>
                    <div className="space-y-1">
                      <Label className="md:hidden text-[10px] font-bold uppercase text-muted-foreground">Unit Price</Label>
                      <Input type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', Number(e.target.value))} className="h-10 text-right border-border dark:border-[#23272c] bg-card dark:bg-[#181a20]" />
                    </div>
                    <div className="space-y-1">
                      <Label className="md:hidden text-[10px] font-bold uppercase text-muted-foreground">Tax %</Label>
                      <EditableTaxSelect
                        value={item.taxPercent ?? 0}
                        onChange={(val) => updateItem(i, 'taxPercent', val)}
                        options={[0, 5, 12, 15, 18, 28]}
                        size="sm"
                      />
                    </div>
                    <div className="flex justify-end md:justify-center">
                      <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg" onClick={() => removeItem(i)} disabled={items.length === 1}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-muted dark:bg-[#121418]/50 rounded-2xl p-6 sm:p-8 border border-border dark:border-[#23272c] ml-auto max-w-sm w-full mx-4 sm:mx-0 mb-4 sm:mb-0">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground dark:text-slate-400 font-medium">Subtotal</span>
                    <span className="font-bold text-foreground dark:text-slate-200">{getCurrencySymbol(currency)}{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground dark:text-slate-400 font-medium">Tax</span>
                    <span className="font-bold text-foreground dark:text-slate-200">{getCurrencySymbol(currency)}{tax.toFixed(2)}</span>
                  </div>
                  <Separator className="bg-slate-200 dark:border-[#23272c]" />
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold uppercase tracking-wider text-foreground dark:text-slate-200">Total</span>
                    <span className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight">{getCurrencySymbol(currency)}{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="ghost" onClick={() => navigate(`/dashboard/${businessId}/vendor-bills`)} className="h-12 px-8 rounded-xl font-bold hover:bg-muted dark:hover:bg-[#1c2128]">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="h-12 px-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all gap-2">
              {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : <ReceiptText className="size-5" />}
              Create Bill
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
