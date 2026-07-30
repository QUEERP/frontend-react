import { toast } from 'sonner';
import React, { useCallback, useEffect, useState } from 'react'
import {  useNavigate, useParams  } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Undo2, ArrowLeft, Plus, Trash2, Loader2, PackageX } from 'lucide-react'
import { purchaseReturnsAPI, vendorsAPI, Vendor } from '@/lib/api/purchase'
import { productsAPI, Product } from '@/lib/api/inventory'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

interface ReturnItem { productId: string; quantity: number; reason: string }
const RETURN_REASONS = ['DAMAGED', 'WRONG_ITEM', 'EXCESS_QUANTITY', 'QUALITY_ISSUE', 'OTHER']

export default function NewPurchaseReturnPageClient() {
  const pathname = useLocation().pathname;
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || '';
  const params = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  

  const [vendors, setVendors] = useState<Vendor[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [vendorId, setVendorId] = useState('')
  const [returnDate, setReturnDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<ReturnItem[]>([{ productId: '', quantity: 1, reason: 'DAMAGED' }])

  const fetchData = useCallback(async () => {
    if (!businessId) return
    try {
      setIsLoading(true)
      const [vRes, pRes] = await Promise.allSettled([vendorsAPI.getAll(businessId), productsAPI.getAll(businessId)])
      if (vRes.status === 'fulfilled') {
        const vData = (vRes.value as any).vendors || []
        setVendors(vData)
      }
      if (pRes.status === 'fulfilled') {
        const productData = (pRes.value as any).products || (pRes.value as any).data || []
        setProducts(productData)
      }
    } catch { toast({ title: 'Failed to load data', variant: 'destructive' }) }
    finally { setIsLoading(false) }
  }, [businessId, toast])
  
  useEffect(() => { fetchData() }, [fetchData])

  const addItem = () => setItems(p => [...p, { productId: '', quantity: 1, reason: 'DAMAGED' }])
  const removeItem = (i: number) => setItems(p => p.length === 1 ? p : p.filter((_, idx) => idx !== i))
  const updateItem = (i: number, f: keyof ReturnItem, v: string | number) => setItems(p => p.map((item, idx) => idx === i ? { ...item, [f]: v } : item))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vendorId) { toast({ title: 'Please select a vendor', variant: 'destructive' }); return }
    const validItems = items.filter(i => i.productId && i.quantity > 0)
    if (validItems.length === 0) { toast({ title: 'Add at least one item to return', variant: 'destructive' }); return }
    try {
      setIsSubmitting(true)
      await purchaseReturnsAPI.create(businessId, { vendorId, returnDate, notes, items: validItems })
      toast({ title: 'Purchase return created successfully' })
      navigate(`/dashboard/${businessId}/purchase-returns`)
    } catch (err: any) {
      toast({ title: err?.message || 'Failed to create return', variant: 'destructive' })
    } finally { setIsSubmitting(false) }
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background dark:bg-[#121418] px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0">
      <div className="max-w-4xl mx-auto w-full space-y-6 animate-in fade-in duration-500">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card dark:bg-[#181a20] p-6 rounded-2xl border border-border dark:border-[#23272c] shadow-sm">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="sm:hidden -ml-2 size-9 rounded-full relative cursor-pointer border border-border/60 bg-muted hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 shadow-sm transition-all dark:bg-[#181a20] dark:border-[#23272c] dark:hover:bg-[#1c2128] dark:hover:border-blue-900/50" />
            <Button variant="outline" size="icon" onClick={() => navigate(`/dashboard/${businessId}/purchase-returns`)} className="hidden sm:flex size-10 rounded-xl border-border dark:border-[#23272c] hover:bg-muted dark:hover:bg-[#1c2128]">
              <ArrowLeft className="h-5 w-5 text-muted-foreground dark:text-slate-400" />
            </Button>
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl hidden sm:flex items-center justify-center">
              <Undo2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground dark:text-slate-100 tracking-tight">New Purchase Return</h1>
              <p className="text-sm font-medium text-muted-foreground dark:text-slate-400 mt-0.5">Record goods being returned to a vendor</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="rounded-2xl border-border dark:border-[#23272c] shadow-sm bg-card dark:bg-[#181a20] overflow-hidden">
            <CardHeader className="bg-muted/50 dark:bg-[#1c2128]/30 pb-6 border-b border-border dark:border-[#23272c]">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground dark:text-slate-400 flex items-center gap-2">
                <PackageX className="h-4 w-4 text-blue-500" />
                Return Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-slate-400">Vendor *</Label>
                  <Select value={vendorId} onValueChange={setVendorId} disabled={isLoading}>
                    <SelectTrigger className="h-12 w-full border-border dark:border-[#23272c] bg-card dark:bg-[#121418] rounded-xl text-foreground dark:text-slate-200">
                      <SelectValue placeholder="Select vendor to return to" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map(v => <SelectItem key={v.id} value={v.id} className="font-medium">{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-slate-400">Return Date</Label>
                  <Input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className="h-12 border-border dark:border-[#23272c] bg-card dark:bg-[#121418] rounded-xl text-foreground dark:text-slate-200" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-slate-400">Notes / Shipping Details</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason for return, RMA numbers, shipping carrier tracking info..." rows={3} className="resize-none border-border dark:border-[#23272c] bg-card dark:bg-[#121418] rounded-xl p-4 text-foreground dark:text-slate-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border dark:border-[#23272c] shadow-sm bg-card dark:bg-[#181a20] overflow-hidden">
            <CardHeader className="bg-muted/50 dark:bg-[#1c2128]/30 pb-4 border-b border-border dark:border-[#23272c]">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground dark:text-slate-400">Items to Return *</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-9 rounded-lg border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/30 gap-2">
                  <Plus className="h-4 w-4" /> Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 space-y-4">
              <div className="hidden md:grid grid-cols-[2fr_1fr_1.5fr_auto] gap-4 px-4 sm:px-0 text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-slate-400 pt-4 sm:pt-0">
                <div>Product</div>
                <div className="text-center">Quantity</div>
                <div>Reason</div>
                <div className="w-10" />
              </div>
              
              <div className="space-y-3 px-4 pb-4 sm:p-0">
                {items.map((item, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1.5fr_auto] gap-4 items-center bg-muted/50 dark:bg-[#121418] p-4 rounded-xl border border-border dark:border-[#23272c] transition-colors hover:border-slate-300 dark:hover:border-slate-700">
                    <div className="space-y-1">
                      <Label className="md:hidden text-[10px] font-bold uppercase text-muted-foreground">Product</Label>
                      <Select value={item.productId || 'none'} onValueChange={v => updateItem(i, 'productId', v === 'none' ? '' : v)} disabled={isLoading}>
                        <SelectTrigger className="h-10 border-border dark:border-[#23272c] bg-card dark:bg-[#181a20]">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— Select —</SelectItem>
                          {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="md:hidden text-[10px] font-bold uppercase text-muted-foreground">Quantity</Label>
                      <Input type="number" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value) || 1)} className="h-10 text-center border-border dark:border-[#23272c] bg-card dark:bg-[#181a20]" />
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="md:hidden text-[10px] font-bold uppercase text-muted-foreground">Reason</Label>
                      <Select value={item.reason} onValueChange={v => updateItem(i, 'reason', v)}>
                        <SelectTrigger className="h-10 border-border dark:border-[#23272c] bg-card dark:bg-[#181a20]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RETURN_REASONS.map(r => (
                            <SelectItem key={r} value={r}>{r.replace(/_/g, ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex justify-end md:justify-center">
                      <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg" onClick={() => removeItem(i)} disabled={items.length === 1}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="ghost" onClick={() => navigate(`/dashboard/${businessId}/purchase-returns`)} className="h-12 px-8 rounded-xl font-bold hover:bg-muted dark:hover:bg-[#1c2128]">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="h-12 px-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all gap-2">
              {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : <Undo2 className="size-5" />}
              Create Return
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
