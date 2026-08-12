import { toast } from 'sonner';
import React, { useCallback, useEffect, useState } from 'react'
import {  useNavigate, useParams, useSearchParams  } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { ClipboardList, ArrowLeft, Plus, Trash2, Loader2, Save } from 'lucide-react'
import { purchaseRequestsAPI } from '@/lib/api/purchase'
import { vendorsAPI, Vendor } from '@/lib/api/purchase'
import { productsAPI, Product } from '@/lib/api/inventory'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { CreateProductModal } from './create-product-modal'

interface PRItem { productId: string; description: string; quantity: number; estimatedPrice: number; notes: string; itemType: string; hsnSacCode: string; unit?: string }

export default function NewPurchaseRequestPageClient() {
  const pathname = useLocation().pathname;
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || '';
  const params = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const prefilledProductId = searchParams.get('productId') || ''

  const [vendors, setVendors] = useState<Vendor[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [vendorId, setVendorId] = useState('')
  const [requiredDate, setRequiredDate] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<PRItem[]>([{ productId: prefilledProductId, description: '', quantity: 1, estimatedPrice: 0, notes: '', itemType: 'GOODS', hsnSacCode: '' }])

  const fetchData = useCallback(async () => {
    if (!businessId) return
    try {
      setIsLoading(true)
      const [vRes, pRes] = await Promise.allSettled([
        vendorsAPI.getAll(businessId),
        productsAPI.getAll(businessId),
      ])
      if (vRes.status === 'fulfilled') {
        const vData = (vRes.value as any).vendors || (vRes.value as any).data || []
        setVendors(vData)
      }
      if (pRes.status === 'fulfilled') {
        const productData = (pRes.value as any).products || (pRes.value as any).data || []
        setProducts(productData)
      }
    } catch { toast({ title: 'Failed to load data', variant: 'destructive' }) }
    finally { setIsLoading(false) }
  }, [businessId])

  useEffect(() => { fetchData() }, [fetchData])

  const [showVendorDialog, setShowVendorDialog] = useState(false)
  const [newVendorName, setNewVendorName] = useState('')
  const [isAddingVendor, setIsAddingVendor] = useState(false)

  const handleAddVendor = async () => {
    if (!newVendorName.trim()) { toast({ title: 'Vendor name is required', variant: 'destructive' }); return }
    setIsAddingVendor(true)
    try {
      const res = await vendorsAPI.create(businessId, { name: newVendorName })
      if (res.success) {
        const createdVendor = (res as any).vendor || (res as any).data
        setVendors(prev => [createdVendor, ...prev])
        setVendorId(createdVendor.id)
        setShowVendorDialog(false)
        setNewVendorName('')
        toast({ title: 'Vendor added successfully' })
      }
    } catch (e: any) {
      toast({ title: e.message || 'Failed to add vendor', variant: 'destructive' })
    } finally { setIsAddingVendor(false) }
  }

  const [showProductDialog, setShowProductDialog] = useState(false)
  const [activeProductIndex, setActiveProductIndex] = useState<number | null>(null)

  const handleProductCreated = (createdProduct: Product) => {
    setProducts(prev => [createdProduct, ...prev])
    if (activeProductIndex !== null) {
      handleProductSelect(activeProductIndex, createdProduct.id)
    }
  }

  const addItem = () => setItems(p => [...p, { productId: '', description: '', quantity: 1, estimatedPrice: 0, notes: '', itemType: 'GOODS', hsnSacCode: '' }])
  const removeItem = (i: number) => setItems(p => p.length === 1 ? p : p.filter((_, idx) => idx !== i))
  const updateItem = (i: number, f: keyof PRItem, v: string | number) => setItems(p => p.map((item, idx) => idx === i ? { ...item, [f]: v } : item))

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) {
      updateItem(index, 'productId', '')
      return
    }
    setItems(p => p.map((item, i) => i === index ? { ...item, productId, description: product.name, estimatedPrice: product.costPrice || 0, itemType: product.type || 'GOODS', hsnSacCode: product.taxCode || product.hsnCode || '', unit: typeof product.unit === 'object' ? product.unit?.abbreviation : (product.unit || 'pcs') } : item))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { toast({ title: 'Title is required', variant: 'destructive' }); return }
    const validItems = items.filter(i => (i.productId || i.description.trim()) && i.quantity > 0)
    if (validItems.length === 0) { toast({ title: 'Add at least one product with quantity', variant: 'destructive' }); return }
    
    const mappedItems = validItems.map(i => {
      const product = products.find(p => p.id === i.productId)
      return {
        productId: i.productId || undefined,
        description: i.description.trim() || product?.name || 'Custom Item',
        quantity: i.quantity,
        estimatedPrice: i.estimatedPrice,
        itemType: i.itemType || 'GOODS',
        hsnSacCode: i.hsnSacCode || null
      }
    })

    try {
      setIsSubmitting(true)
      await purchaseRequestsAPI.create(businessId, { title, vendorId: vendorId || undefined, requiredDate: requiredDate || undefined, priority, notes, items: mappedItems })
      toast({ title: 'Purchase request created' })
      navigate(`/dashboard/${businessId}/purchase-requests`)
    } catch (err: any) {
      toast({ title: err?.message || 'Failed to create PR', variant: 'destructive' })
    } finally { setIsSubmitting(false) }
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background dark:bg-slate-950 px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0 transition-colors">
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center gap-4 bg-card dark:bg-slate-900 p-6 rounded-2xl border border-border dark:border-slate-800 shadow-sm transition-colors">
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-border dark:border-slate-700 hover:bg-muted dark:hover:bg-slate-800" onClick={() => navigate(`/dashboard/${businessId}/purchase-requests`)}>
            <ArrowLeft className="h-5 w-5 text-muted-foreground dark:text-slate-300" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground dark:text-slate-100 tracking-tight">New Purchase Request</h1>
            <p className="text-sm font-medium text-muted-foreground dark:text-slate-400 mt-0.5">Request products for procurement</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Request Details Card */}
          <div className="rounded-2xl border border-border dark:border-slate-800 bg-card dark:bg-slate-900 shadow-sm overflow-hidden transition-colors">
            <div className="p-6 border-b border-border dark:border-slate-800">
              <h2 className="text-lg font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-blue-500" />
                Request Details
              </h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="dark:text-slate-200 font-semibold text-sm">Title *</Label>
                <Input 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="e.g. Office Supplies Q3" 
                  className="rounded-xl border-border dark:border-slate-700 bg-muted dark:bg-slate-950 dark:text-slate-100 focus-visible:ring-blue-500 transition-colors shadow-sm h-11"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="dark:text-slate-200 font-semibold text-sm">Preferred Vendor</Label>
                  <Select value={vendorId || 'none'} onValueChange={v => {
                    if (v === 'new_vendor') {
                      setShowVendorDialog(true)
                    } else {
                      setVendorId(v === 'none' ? '' : v)
                    }
                  }} disabled={isLoading}>
                    <SelectTrigger className="rounded-xl border-border dark:border-slate-700 bg-muted dark:bg-slate-950 dark:text-slate-100 focus:ring-blue-500 transition-colors shadow-sm h-11">
                      <SelectValue placeholder="Select vendor (optional)" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border dark:border-slate-800 dark:bg-slate-900">
                      <SelectItem value="none">— No preference —</SelectItem>
                      {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                      <SelectItem value="new_vendor" className="text-blue-600 dark:text-blue-400 font-medium focus:bg-blue-50 dark:focus:bg-blue-500/10 mt-1 border-t border-border dark:border-slate-800 pt-2 cursor-pointer">
                        <div className="flex items-center">
                          <Plus className="mr-2 h-4 w-4" />
                          Add New Vendor
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="dark:text-slate-200 font-semibold text-sm">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="rounded-xl border-border dark:border-slate-700 bg-muted dark:bg-slate-950 dark:text-slate-100 focus:ring-blue-500 transition-colors shadow-sm h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border dark:border-slate-800 dark:bg-slate-900">
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="dark:text-slate-200 font-semibold text-sm">Required By Date</Label>
                <Input 
                  type="date" 
                  value={requiredDate} 
                  onChange={e => setRequiredDate(e.target.value)} 
                  className="rounded-xl border-border dark:border-slate-700 bg-muted dark:bg-slate-950 dark:text-slate-100 focus-visible:ring-blue-500 transition-colors shadow-sm h-11 w-full md:w-1/2"
                />
              </div>

              <div className="space-y-2">
                <Label className="dark:text-slate-200 font-semibold text-sm">Notes</Label>
                <Textarea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  placeholder="Optional notes…" 
                  rows={3} 
                  className="rounded-xl border-border dark:border-slate-700 bg-muted dark:bg-slate-950 dark:text-slate-100 focus-visible:ring-blue-500 transition-colors shadow-sm resize-none"
                />
              </div>
            </div>
          </div>

          {/* Items Card */}
          <div className="rounded-2xl border border-border dark:border-slate-800 bg-card dark:bg-slate-900 shadow-sm overflow-hidden transition-colors">
            <div className="p-6 border-b border-border dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
                Items *
              </h2>
              <Button type="button" variant="outline" size="sm" className="gap-2 rounded-xl border-border dark:border-slate-700 bg-muted dark:bg-slate-800 text-foreground dark:text-slate-200 hover:bg-muted dark:hover:bg-slate-700" onClick={addItem}>
                <Plus className="h-4 w-4" /> Add Item
              </Button>
            </div>
            
            <div className="p-6 space-y-4">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-1 lg:grid-cols-[1.5fr_2fr_1fr_0.8fr_0.8fr_auto] gap-4 items-start bg-muted dark:bg-slate-950/50 rounded-xl border border-border dark:border-slate-800 p-4 transition-colors">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground dark:text-slate-400">Product (Optional)</Label>
                    <Select value={item.productId || 'none'} onValueChange={v => {
                      if (v === 'new_product') {
                        setActiveProductIndex(i)
                        setShowProductDialog(true)
                      } else {
                        handleProductSelect(i, v === 'none' ? '' : v)
                      }
                    }} disabled={isLoading}>
                      <SelectTrigger className="h-10 rounded-lg border-border dark:border-slate-700 bg-card dark:bg-slate-900 dark:text-slate-100 shadow-sm">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border dark:border-slate-800 dark:bg-slate-900">
                        <SelectItem value="none">— Custom Item —</SelectItem>
                        {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        <SelectItem value="new_product" className="text-blue-600 dark:text-blue-400 font-medium focus:bg-blue-50 dark:focus:bg-blue-500/10 mt-1 border-t border-border dark:border-slate-800 pt-2 cursor-pointer">
                          <div className="flex items-center">
                            <Plus className="mr-2 h-4 w-4" />
                            Add New Product
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground dark:text-slate-400">Description *</Label>
                    <Input 
                      value={item.description} 
                      onChange={e => updateItem(i, 'description', e.target.value)} 
                      placeholder="Item description..." 
                      className="h-10 rounded-lg border-border dark:border-slate-700 bg-card dark:bg-slate-900 dark:text-slate-100 shadow-sm" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground dark:text-slate-400">Type & Code</Label>
                    <div className="flex gap-2">
                      <Select value={item.itemType || 'GOODS'} onValueChange={v => updateItem(i, 'itemType', v)}>
                        <SelectTrigger className="h-10 w-full sm:w-[100px] rounded-lg border-border dark:border-slate-700 bg-card dark:bg-slate-900 dark:text-slate-100 shadow-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border dark:border-slate-800 dark:bg-slate-900">
                          <SelectItem value="GOODS">Goods</SelectItem>
                          <SelectItem value="SERVICE">Service</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder={item.itemType === 'SERVICE' ? 'SAC' : 'HSN'}
                        value={item.hsnSacCode || ''}
                        onChange={e => updateItem(i, 'hsnSacCode', e.target.value)}
                        className="h-10 w-full sm:w-[90px] rounded-lg border-border dark:border-slate-700 bg-card dark:bg-slate-900 dark:text-slate-100 shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground dark:text-slate-400">Qty / Hrs</Label>
                    <div className="relative">
                      <Input 
                        type="number" min="1" 
                        value={item.quantity} 
                        onChange={e => updateItem(i, 'quantity', Number(e.target.value) || 1)} 
                        className="h-10 pr-10 rounded-lg border-border dark:border-slate-700 bg-card dark:bg-slate-900 dark:text-slate-100 shadow-sm" 
                      />
                      <span className="absolute right-3 top-3 text-[10px] uppercase font-bold text-muted-foreground">
                        {item.itemType === 'SERVICE' ? 'hrs' : (item.unit || 'pcs')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground dark:text-slate-400">Est. Price</Label>
                    <Input 
                      type="number" min="0" step="0.01" 
                      value={item.estimatedPrice} 
                      onChange={e => updateItem(i, 'estimatedPrice', Number(e.target.value) || 0)} 
                      className="h-10 rounded-lg border-border dark:border-slate-700 bg-card dark:bg-slate-900 dark:text-slate-100 shadow-sm" 
                    />
                  </div>

                  <div className="pt-6">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg" 
                      onClick={() => removeItem(i)} 
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6 pb-12">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(`/dashboard/${businessId}/purchase-requests`)} 
              className="rounded-xl border-border dark:border-slate-700 bg-card dark:bg-slate-800 hover:bg-muted dark:hover:bg-slate-700 text-foreground dark:text-slate-200 font-semibold h-11 px-6"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 h-11 px-8 shadow-sm"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Submit Request
            </Button>
          </div>
        </form>
      </div>

      {/* Inline Add Vendor Dialog */}
      <Dialog open={showVendorDialog} onOpenChange={setShowVendorDialog}>
        <DialogContent className="rounded-2xl dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="dark:text-slate-100">Add New Vendor</DialogTitle>
            <DialogDescription className="dark:text-slate-400">Quickly add a new vendor. You can fill out more details later in the Vendors page.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="dark:text-slate-200">Vendor Name *</Label>
              <Input 
                placeholder="e.g. Acme Corp" 
                value={newVendorName} 
                onChange={e => setNewVendorName(e.target.value)} 
                className="rounded-xl border-border dark:border-slate-700 bg-muted dark:bg-slate-950 dark:text-slate-100 focus-visible:ring-blue-500 shadow-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVendorDialog(false)} className="rounded-xl border-border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">Cancel</Button>
            <Button onClick={handleAddVendor} disabled={isAddingVendor || !newVendorName.trim()} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
              {isAddingVendor ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Add Vendor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Standardized Quick Create Product Modal */}
      <CreateProductModal
        open={showProductDialog}
        onClose={() => setShowProductDialog(false)}
        businessId={businessId}
        onCreated={handleProductCreated}
      />
    </div>
  )
}
