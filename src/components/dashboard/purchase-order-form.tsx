import * as React from 'react'
import {
  CreatePurchaseOrderData,
  PurchaseOrderItemInput,
  PURCHASE_ORDER_STATUS,
  UpdatePurchaseOrderData,
} from '@/lib/api/purchase-orders'
import { BusinessUser, usersAPI } from '@/lib/api/users'
import { Product, productsAPI, Warehouse, warehousesAPI } from '@/lib/api/inventory'
import { vendorsAPI } from '@/lib/api/purchase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, ShoppingCart, Truck, Calendar, User, FileText, Store, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { InventoryItemTable, ItemRow } from './inventory-item-table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useBusinessData } from './business-data-provider'
import { CurrencySelect } from '@/components/ui/currency-select'
import { getCurrencySymbol } from '@/lib/currencies'

interface Vendor {
  id: string
  name: string
  email?: string
  phone?: string
  country?: string
  currency?: string
}

interface PurchaseOrderFormProps {
  businessId: string
  title: string
  description: string
  submitLabel: string
  initialData?: Partial<CreatePurchaseOrderData & UpdatePurchaseOrderData>
  mode?: 'create' | 'edit'
  onSubmit: (data: CreatePurchaseOrderData | UpdatePurchaseOrderData) => Promise<void>
}

export function PurchaseOrderForm({
  businessId,
  title,
  description,
  submitLabel,
  initialData,
  mode = 'create',
  onSubmit,
}: PurchaseOrderFormProps) {
  const { currency: businessCurrency = 'AED' } = useBusinessData()
  const [vendors, setVendors] = React.useState<Vendor[]>([])
  const [users, setUsers] = React.useState<BusinessUser[]>([])
  const [products, setProducts] = React.useState<Product[]>([])
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([])
  const [submitting, setSubmitting] = React.useState(false)

  const [items, setItems] = React.useState<ItemRow[]>(
    (initialData?.items as any[])?.map(it => ({
      id: Math.random().toString(36).substr(2, 9),
      productId: it.productId || '',
      warehouseId: it.warehouseId || '',
      description: it.description || '',
      itemType: it.itemType || 'GOODS',
      hsnSacCode: it.hsnSacCode || '',
      quantity: it.quantity || 1,
      price: it.price || 0,
      taxPercent: it.taxPercent || 0,
      unit: (it as any).unit || 'pcs',
      amount: (it.quantity || 0) * (it.price || 0) * (1 + (it.taxPercent || 0) / 100)
    })) || [{
      id: '1',
      productId: '',
      warehouseId: '',
      description: '',
      itemType: 'GOODS',
      hsnSacCode: '',
      quantity: 1,
      price: 0,
      taxPercent: 0,
      amount: 0,
      unit: 'pcs',
    }]
  )

  const [formData, setFormData] = React.useState({
    vendorId: initialData?.vendorId || '',
    assignedToId: initialData?.assignedToId || '',
    tax: initialData?.tax || 0,
    discount: initialData?.discount || 0,
    orderDate: initialData?.orderDate || new Date().toISOString().slice(0, 10),
    expectedDeliveryDate: initialData?.expectedDeliveryDate || '',
    notes: initialData?.notes || '',
    status: (initialData?.status || 'Draft') as (typeof PURCHASE_ORDER_STATUS)[number],
    currencyCode: (initialData as any)?.currencyCode || businessCurrency || 'AED',
  })

  const displayCurrency = getCurrencySymbol(formData.currencyCode)

  const summary = React.useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.price || 0)), 0)
    const taxTotal = items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.price || 0) * (Number(item.taxPercent || 0) / 100)), 0)
    const total = subtotal + taxTotal - Number(formData.discount || 0)
    return { subtotal, taxTotal, total }
  }, [items, formData.discount])

  React.useEffect(() => {
    const load = async () => {
      try {
        const [vendorRes, userRes, productRes, warehouseRes] = await Promise.allSettled([
          vendorsAPI.getAll(businessId),
          usersAPI.getBusinessUsers(businessId),
          productsAPI.getAll(businessId),
          warehousesAPI.getAll(businessId),
        ])

        if (vendorRes.status === 'fulfilled') setVendors(vendorRes.value.vendors || (vendorRes.value as any).data || [])
        if (userRes.status === 'fulfilled') setUsers(Array.isArray(userRes.value.data) ? userRes.value.data : userRes.value.users || [])
        if (productRes.status === 'fulfilled') setProducts(productRes.value.products || [])
        if (warehouseRes.status === 'fulfilled') {
          const whs = warehouseRes.value.warehouses || []
          setWarehouses(whs)
          if (whs.length > 0) {
            setItems(prev => prev.map(it => it.warehouseId ? it : { ...it, warehouseId: whs[0].id }))
          }
        }
      } catch (e) {
        toast.error('Failed to load purchase order lookups')
      }
    }
    load()
  }, [businessId])

  const [showVendorDialog, setShowVendorDialog] = React.useState(false)
  const [newVendorName, setNewVendorName] = React.useState('')
  const [isAddingVendor, setIsAddingVendor] = React.useState(false)

  const handleAddVendor = async () => {
    if (!newVendorName.trim()) { toast.error('Vendor name is required'); return }
    setIsAddingVendor(true)
    try {
      const res = await vendorsAPI.create(businessId, { name: newVendorName })
      if ((res as any).success) {
        const createdVendor = (res as any).vendor || (res as any).data
        setVendors(prev => [createdVendor, ...prev])
        setFormData(prev => ({ ...prev, vendorId: createdVendor.id }))
        setShowVendorDialog(false)
        setNewVendorName('')
        toast.success('Vendor added successfully')
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to add vendor')
    } finally { setIsAddingVendor(false) }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const validItems = items.filter(it => it.productId && it.quantity > 0)
    if (!formData.vendorId || validItems.length === 0) {
      toast.error('Vendor and items are required')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        ...formData,
        items: validItems.map(it => ({
          productId: it.productId,
          warehouseId: it.warehouseId,
          description: it.description,
          itemType: it.itemType,
          hsnSacCode: it.hsnSacCode,
          quantity: Number(it.quantity),
          price: Number(it.price),
          taxPercent: Number(it.taxPercent),
        })),
        tax: summary.taxTotal,
        discount: Number(formData.discount || 0),
        currencyCode: formData.currencyCode,
        currencySymbol: getCurrencySymbol(formData.currencyCode),
      }

      await onSubmit(payload as any)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save purchase order')
    } finally {
      setSubmitting(false)
    }
  }

  const getTaxLabel = () => {
    const selectedVendor = vendors.find(v => v.id === formData.vendorId)
    // Assume business country is India if not loaded properly, just for fallback
    // Since we don't have business context imported fully here, we'll try to guess based on currency
    // or just rely on vendor country
    const vCountry = selectedVendor?.country?.toLowerCase() || ''
    
    if (vCountry === 'india') {
      // If vendor state matches business state (we'll just use a basic heuristic here since business state is not easily accessible)
      // Usually, ERPs check if vendor state == business state
      // For now, we will default to IGST if we can't be sure, or check if they share the same state
      return 'IGST'
    } else if (vCountry === 'united arab emirates' || vCountry === 'uae') {
      return 'VAT'
    }
    return 'TAX'
  }

  const taxLabel = getTaxLabel()

  return (
    <Card className="max-w-6xl rounded-2xl border-border dark:border-[#23272c] shadow-sm bg-card dark:bg-[#181a20]">
      <CardHeader className="pb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl">
              <ShoppingCart className="size-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight text-foreground dark:text-slate-100">{title}</CardTitle>
              <p className="text-sm text-muted-foreground dark:text-slate-400 mt-0.5">{description}</p>
            </div>
          </div>
          <Badge variant="outline" className="h-8 px-4 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 font-bold uppercase tracking-widest text-[10px]">
            {mode === 'create' ? 'Draft' : formData.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Section 1: Vendor & Core Info */}
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="vendor" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Vendor Details *</Label>
                <Select value={formData.vendorId} onValueChange={(val) => {
                  if (val === 'new_vendor') {
                    setShowVendorDialog(true)
                  } else {
                    const selectedVendor = vendors.find(v => v.id === val)
                    let newCurrency = formData.currencyCode
                    if (selectedVendor) {
                      if (selectedVendor.currency) {
                        newCurrency = selectedVendor.currency
                      } else if (selectedVendor.country) {
                        switch (selectedVendor.country) {
                          case 'India': newCurrency = 'INR'; break;
                          case 'United Arab Emirates': newCurrency = 'AED'; break;
                          case 'United States': newCurrency = 'USD'; break;
                          case 'United Kingdom': newCurrency = 'GBP'; break;
                          case 'Germany': newCurrency = 'EUR'; break;
                          default: newCurrency = businessCurrency; break;
                        }
                      }
                    }
                    setFormData(prev => ({ ...prev, vendorId: val, currencyCode: newCurrency }))
                  }
                }}>
                  <SelectTrigger id="vendor" className="h-12 w-full border-border dark:border-[#23272c] bg-card dark:bg-[#121418] rounded-xl text-foreground dark:text-slate-200">
                    <SelectValue placeholder="Select Vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        <div className="flex items-center gap-2">
                          <Store className="size-4 text-muted-foreground" />
                          <span className="font-semibold">{v.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem value="new_vendor" className="text-primary font-medium focus:bg-primary/10 focus:text-primary mt-1 border-t pt-2">
                      <div className="flex items-center gap-2">
                        <Plus className="size-4" />
                        <span>Add New Vendor</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Order Currency</Label>
                <CurrencySelect
                  value={formData.currencyCode}
                  onChange={(code) => setFormData(prev => ({ ...prev, currencyCode: code }))}
                  className="h-12 border-border dark:border-[#23272c] bg-card dark:bg-[#121418] text-foreground dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orderDate" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Order Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3.5 size-4 text-muted-foreground z-10" />
                    <Input
                      id="orderDate"
                      type="date"
                      value={formData.orderDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, orderDate: e.target.value }))}
                      className="h-12 pl-10 border-border dark:border-[#23272c] bg-card dark:bg-[#121418] rounded-xl text-foreground dark:text-slate-200"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryDate" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Expected Delivery</Label>
                  <div className="relative">
                    <Truck className="absolute left-3.5 top-3.5 size-4 text-muted-foreground z-10" />
                    <Input
                      id="deliveryDate"
                      type="date"
                      value={formData.expectedDeliveryDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                      className="h-12 pl-10 border-border dark:border-[#23272c] bg-card dark:bg-[#121418] rounded-xl text-foreground dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="assigned" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Purchaser / Owner</Label>
                <Select value={formData.assignedToId} onValueChange={(val) => setFormData(prev => ({ ...prev, assignedToId: val }))}>
                  <SelectTrigger id="assigned" className="h-12 w-full border-border dark:border-[#23272c] bg-card dark:bg-[#121418] rounded-xl text-foreground dark:text-slate-200">
                    <SelectValue placeholder="Assign User" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        <div className="flex items-center gap-2">
                          <User className="size-4 text-muted-foreground" />
                          <span>{u.user?.name || u.user?.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-6 bg-blue-50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-500/10 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600/70 dark:text-blue-400/70">Estimated Total</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{displayCurrency} {summary.total.toLocaleString()}</p>
                </div>
                <FileText className="size-8 text-blue-200 dark:text-blue-500/20" />
              </div>
            </div>
          </div>

          {/* Section 2: Items Table */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 px-1">
              <div className="h-4 w-1 bg-blue-600 dark:bg-blue-500 rounded-full" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-foreground dark:text-slate-300">Purchase Items</h3>
            </div>
            <InventoryItemTable
              items={items}
              onItemsChange={setItems}
              products={products}
              warehouses={warehouses}
              currency={displayCurrency}
              mode="purchase"
              taxLabel={taxLabel}
              onProductAdded={(product) => setProducts(prev => [product, ...prev])}
            />
          </div>

          {/* Section 3: Notes & Summary */}
          <div className="grid gap-8 md:grid-cols-2 pt-4">
            <div className="space-y-4">
              <Label htmlFor="notes" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Notes & Instructions</Label>
              <Textarea
                id="notes"
                rows={6}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Internal notes or special instructions for vendor..."
                className="resize-none border-border dark:border-[#23272c] bg-card dark:bg-[#121418] rounded-xl p-4 text-foreground dark:text-slate-200"
              />
            </div>

            <div className="bg-muted dark:bg-[#121418]/50 rounded-2xl p-8 space-y-6 border border-border dark:border-[#23272c]">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">Subtotal</span>
                  <span className="font-bold">{displayCurrency} {summary.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">Tax Total</span>
                  <span className="font-bold text-emerald-600">+{displayCurrency} {summary.taxTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-sm text-muted-foreground font-medium">Discount</span>
                  <div className="flex items-center gap-2 max-w-[140px]">
                    <span className="text-xs text-muted-foreground font-bold">{displayCurrency}</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.discount}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount: Number(e.target.value || 0) }))}
                      className="h-9 text-right bg-card dark:bg-[#181a20] border-border dark:border-[#23272c] rounded-lg font-bold text-foreground dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>
              <Separator className="bg-border/50" />
              <div className="flex justify-between items-center">
                <span className="text-base font-black uppercase tracking-wider">Grand Total</span>
                <span className="text-3xl font-bold text-foreground dark:text-slate-100 tracking-tight">{displayCurrency} {summary.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6">
            <Button variant="ghost" type="button" onClick={() => window.history.back()} className="h-12 px-8 rounded-xl font-bold">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="h-12 px-12 rounded-xl font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all bg-blue-600 hover:bg-blue-700 text-white">
              {submitting ? 'Processing...' : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>

      {/* Inline Add Vendor Dialog */}
      <Dialog open={showVendorDialog} onOpenChange={setShowVendorDialog}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl border-border dark:border-[#23272c] bg-card dark:bg-[#181a20]">
          <DialogHeader>
            <DialogTitle>Add New Vendor</DialogTitle>
            <DialogDescription>Quickly add a new vendor. You can fill out more details later in the Vendors page.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Vendor Name *</Label>
              <Input placeholder="e.g. Acme Corp" value={newVendorName} onChange={e => setNewVendorName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setShowVendorDialog(false)}>Cancel</Button>
            <Button type="button" onClick={handleAddVendor} disabled={isAddingVendor || !newVendorName.trim()}>
              {isAddingVendor ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Add Vendor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
