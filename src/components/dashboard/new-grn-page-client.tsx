import { toast } from 'sonner';
import React, { useEffect, useState } from 'react'
import {  useNavigate, useParams  } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { 
  PackageCheck, 
  ArrowLeft, 
  Loader2, 
  Truck, 
  Calendar as CalendarIcon, 
  Store, 
  FileText, 
  Info, 
  AlertCircle,
  Package,
  CheckCircle2
} from 'lucide-react'
import { purchaseOrdersAPI } from '@/lib/api/purchase-orders'
import { vendorsAPI, Vendor } from '@/lib/api/vendors'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { SidebarTrigger } from '@/components/ui/sidebar'

interface GRNItem {
  id: string
  productId: string
  productName: string
  sku: string
  warehouseId: string
  warehouseName: string
  orderedQty: number
  alreadyReceivedQty: number
  receivingQty: number
  unit: string
}

export default function NewGRNPageClient() {
  const pathname = useLocation().pathname;
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || '';
  const params = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  

  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [selectedPOId, setSelectedPOId] = useState<string>('none')
  const [items, setItems] = useState<GRNItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const [formData, setFormData] = useState({
    grnNumber: `GRN-${Date.now().toString().slice(-6)}`,
    receivedDate: new Date().toISOString().slice(0, 10),
    vendorInvoiceNumber: '',
    notes: ''
  })

  useEffect(() => {
    const load = async () => {
      if (!businessId) return
      try {
        setIsLoading(true)
        const res = await purchaseOrdersAPI.getPurchaseOrders(businessId)
        if (res.success) {
          setPurchaseOrders(res.orders || [])
        }
      } catch (e) {
        toast({ title: 'Failed to load purchase orders', variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [businessId, toast])

  const handlePOSelect = async (poId: string) => {
    setSelectedPOId(poId)
    if (poId === 'none') {
      setItems([])
      return
    }

    try {
      const res = await purchaseOrdersAPI.getPurchaseOrderById(businessId, poId)
      if (res.success) {
        const po = res.order
        setItems(po.items.map((it: any) => ({
          id: it.id,
          productId: it.productId,
          productName: it.product?.name || it.description,
          sku: it.product?.sku || 'N/A',
          warehouseId: it.warehouseId || '',
          warehouseName: it.warehouse?.name || 'Main Warehouse',
          orderedQty: it.quantity,
          alreadyReceivedQty: it.receivedQty || 0,
          receivingQty: Math.max(0, it.quantity - (it.receivedQty || 0)),
          unit: typeof it.product?.unit === 'object' ? it.product?.unit?.abbreviation : it.product?.unit || 'pcs'
        })))
      }
    } catch (e) {
      toast({ title: 'Failed to load PO items', variant: 'destructive' })
    }
  }

  const updateReceivingQty = (index: number, val: number) => {
    setItems(prev => prev.map((it, i) => {
      if (i === index) {
        const remaining = it.orderedQty - it.alreadyReceivedQty
        return { ...it, receivingQty: Math.max(0, Math.min(val, remaining)) }
      }
      return it
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedPOId === 'none') {
      toast({ title: 'Please select a Purchase Order', variant: 'destructive' })
      return
    }

    const validItems = items.filter(it => it.receivingQty > 0)
    if (validItems.length === 0) {
      toast({ title: 'Please enter receiving quantities for at least one item', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        ...formData,
        items: validItems.map(it => ({
          purchaseOrderItemId: it.id,
          quantity: it.receivingQty,
          warehouseId: it.warehouseId
        }))
      }
      
      await purchaseOrdersAPI.receiveGoods(businessId, selectedPOId, payload)
      
      toast({ title: 'Goods received successfully', description: `${formData.grnNumber} has been created.` })
      navigate(`/dashboard/${businessId}/grn`)
    } catch (error: any) {
      toast({ title: 'Failed to receive goods', description: error?.message || 'Internal server error', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading && purchaseOrders.length === 0) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background dark:bg-[#121418]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-500" />
          <p className="text-sm font-medium text-muted-foreground dark:text-slate-400">Loading purchase orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background dark:bg-[#121418] px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card dark:bg-[#181a20] p-6 rounded-2xl border border-border dark:border-[#23272c] shadow-sm">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="sm:hidden -ml-2 size-9 rounded-full relative cursor-pointer border border-border/60 bg-muted hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 shadow-sm transition-all dark:bg-[#181a20] dark:border-[#23272c] dark:hover:bg-[#1c2128] dark:hover:border-blue-900/50" />
          <Button variant="outline" size="icon" onClick={() => navigate(`/dashboard/${businessId}/grn`)} className="hidden sm:flex size-10 rounded-xl border-border dark:border-[#23272c] hover:bg-muted dark:hover:bg-[#1c2128]">
            <ArrowLeft className="h-5 w-5 text-muted-foreground dark:text-slate-400" />
          </Button>
          <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl hidden sm:flex items-center justify-center">
            <PackageCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground dark:text-slate-100 tracking-tight">Add Goods Receive Note</h1>
            <p className="text-sm font-medium text-muted-foreground dark:text-slate-400 mt-0.5">Record incoming inventory from vendors.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Form Area */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="rounded-2xl border-border dark:border-[#23272c] shadow-sm bg-card dark:bg-[#181a20] overflow-hidden">
              <CardHeader className="bg-muted/50 dark:bg-[#1c2128]/30 pb-8 border-b border-border dark:border-[#23272c]">
                <div className="space-y-4">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-slate-400 ml-1">Link Purchase Order *</Label>
                  <Select value={selectedPOId} onValueChange={handlePOSelect}>
                    <SelectTrigger className="h-12 w-full border-border dark:border-[#23272c] bg-card dark:bg-[#121418] rounded-xl text-foreground dark:text-slate-200">
                      <SelectValue placeholder="Select an approved Purchase Order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select Purchase Order</SelectItem>
                      {purchaseOrders.map(po => (
                        <SelectItem key={po.id} value={po.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{po.poNumber}</span>
                            <span className="text-muted-foreground text-xs">— {po.vendor?.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {purchaseOrders.length === 0 && !isLoading && (
                    <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1 mt-1">
                      <Info className="size-3" />
                      No approved purchase orders found to receive.
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                {selectedPOId === 'none' ? (
                  <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                    <Truck className="size-16 text-muted-foreground" />
                    <div>
                      <p className="font-black uppercase tracking-widest text-sm text-muted-foreground dark:text-slate-400">Waiting for Selection</p>
                      <p className="text-xs font-medium text-slate-400 dark:text-muted-foreground">Select a purchase order to start receiving items</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-4 sm:px-0">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-1 bg-blue-600 dark:bg-blue-500 rounded-full" />
                        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground dark:text-slate-300">Incoming Items</h3>
                      </div>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 font-bold uppercase tracking-widest text-[10px] px-2.5 py-0.5">
                        {items.length} Items found
                      </Badge>
                    </div>

                    <div className="rounded-xl border border-border dark:border-[#23272c] overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-muted/80 dark:bg-[#121418]/80 border-b border-border dark:border-[#23272c]">
                              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">Product Details</th>
                              <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">Ordered</th>
                              <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">Received</th>
                              <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 w-36">Receiving Now</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-[#23272c]">
                            {items.map((item, index) => {
                              const remaining = item.orderedQty - item.alreadyReceivedQty
                              const isFullyReceived = remaining <= 0

                              return (
                                <tr key={item.id} className={cn(
                                  "group transition-colors border-b border-border dark:border-[#23272c]",
                                  isFullyReceived ? "bg-muted/50 dark:bg-[#1c2128]/30 opacity-60" : "hover:bg-muted/50 dark:hover:bg-[#1c2128]/50"
                                )}>
                                  <td className="px-4 py-4">
                                    <div className="flex items-start gap-3">
                                      <div className="p-2 bg-card dark:bg-[#121418] rounded-lg border border-border dark:border-[#23272c] hidden sm:block">
                                        <Package className="size-4 text-slate-400 dark:text-muted-foreground" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold leading-tight text-foreground dark:text-slate-200">{item.productName}</p>
                                        <p className="text-[10px] font-mono text-muted-foreground dark:text-slate-400 mt-1">{item.sku}</p>
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground dark:text-slate-400 mt-1">
                                          <Store className="size-3" />
                                          {item.warehouseName}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    <span className="text-sm font-bold text-foreground dark:text-slate-300">{item.orderedQty}</span>
                                    <span className="text-[10px] text-muted-foreground dark:text-slate-400 ml-1">{item.unit}</span>
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    <div className="flex flex-col items-center">
                                      <span className="text-sm font-bold text-muted-foreground dark:text-slate-400">{item.alreadyReceivedQty}</span>
                                      {isFullyReceived && (
                                        <Badge variant="outline" className="mt-1 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 h-4 text-[8px] font-black px-1.5 py-0">COMPLETE</Badge>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-4">
                                    <div className="relative">
                                      <Input
                                        type="number"
                                        min="0"
                                        max={remaining}
                                        value={item.receivingQty}
                                        disabled={isFullyReceived}
                                        onChange={(e) => updateReceivingQty(index, parseFloat(e.target.value) || 0)}
                                        className={cn(
                                          "h-10 text-center font-bold border-border dark:border-[#23272c] bg-card dark:bg-[#121418] text-foreground dark:text-slate-200 w-full",
                                          item.receivingQty > 0 && "border-emerald-500 ring-emerald-500/20"
                                        )}
                                      />
                                      {!isFullyReceived && item.receivingQty === remaining && (
                                        <div className="absolute -top-2 -right-2">
                                          <CheckCircle2 className="size-4 text-emerald-500 fill-white dark:fill-[#121418]" />
                                        </div>
                                      )}
                                    </div>
                                    {remaining > 0 && item.receivingQty > remaining && (
                                      <p className="text-[9px] text-rose-500 font-bold mt-1 leading-tight">Exceeds ordered qty</p>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 px-4 sm:px-0">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-slate-400 ml-1">Remarks / Quality Notes</Label>
                      <Textarea
                        rows={3}
                        value={formData.notes}
                        onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                        placeholder="Note any damaged items, quantity discrepancies or quality issues..."
                        className="resize-none border-border dark:border-[#23272c] bg-card dark:bg-[#121418] rounded-xl p-4 text-sm text-foreground dark:text-slate-200 w-full"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            <Card className="rounded-2xl border-border dark:border-[#23272c] shadow-sm bg-card dark:bg-[#181a20] p-6 space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground dark:text-slate-400 flex items-center gap-2">
                <FileText className="size-4 text-blue-500" />
                GRN Reference
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground dark:text-slate-400">GRN Number</Label>
                  <Input 
                    value={formData.grnNumber} 
                    onChange={(e) => setFormData(p => ({ ...p, grnNumber: e.target.value }))}
                    className="h-10 border-border dark:border-[#23272c] bg-card dark:bg-[#121418] rounded-xl font-mono font-bold text-foreground dark:text-slate-200 w-full" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground dark:text-slate-400">Received Date</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-3 size-4 text-slate-400" />
                    <Input 
                      type="date" 
                      value={formData.receivedDate} 
                      onChange={(e) => setFormData(p => ({ ...p, receivedDate: e.target.value }))}
                      className="h-10 pl-10 border-border dark:border-[#23272c] bg-card dark:bg-[#121418] rounded-xl font-medium text-foreground dark:text-slate-200 w-full" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground dark:text-slate-400">Vendor Invoice #</Label>
                  <Input 
                    value={formData.vendorInvoiceNumber} 
                    onChange={(e) => setFormData(p => ({ ...p, vendorInvoiceNumber: e.target.value }))}
                    className="h-10 border-border dark:border-[#23272c] bg-card dark:bg-[#121418] rounded-xl text-foreground dark:text-slate-200 w-full" 
                    placeholder="INV-XXXXX"
                  />
                </div>
              </div>
            </Card>

            <Card className={cn(
              "border-border dark:border-[#23272c] shadow-md p-8 space-y-6 rounded-2xl transition-all duration-500",
              selectedPOId === 'none' 
                ? "bg-muted dark:bg-[#121418] text-slate-400 dark:text-muted-foreground" 
                : "bg-blue-50 dark:bg-blue-900/20 text-foreground dark:text-slate-200 border-blue-100 dark:border-blue-900/50"
            )}>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold uppercase tracking-widest opacity-60">Items to Receive</span>
                  <span className="font-bold text-sm text-blue-700 dark:text-blue-400">{items.filter(it => it.receivingQty > 0).length}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold uppercase tracking-widest opacity-60">Total Quantity</span>
                  <span className="font-bold text-sm text-blue-700 dark:text-blue-400">
                    {items.reduce((sum, it) => sum + it.receivingQty, 0)} Units
                  </span>
                </div>
              </div>
              
              <Separator className={cn(selectedPOId === 'none' ? "bg-slate-200 dark:bg-[#23272c]" : "bg-blue-200 dark:bg-blue-900/50")} />
              
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Action</p>
                <p className="text-xs font-medium leading-relaxed opacity-80">
                  {selectedPOId === 'none' 
                    ? "Please select a purchase order to finalize the receipt."
                    : "Finalizing this GRN will increase the physical stock levels in the selected warehouses."}
                </p>
              </div>

              <Button 
                onClick={handleSubmit}
                disabled={submitting || selectedPOId === 'none' || items.filter(it => it.receivingQty > 0).length === 0}
                className={cn(
                  "w-full h-12 rounded-xl font-bold tracking-wide shadow-sm transition-all mt-4",
                  selectedPOId === 'none' 
                    ? "bg-slate-200 dark:bg-[#23272c] text-slate-400 dark:text-muted-foreground border-none cursor-not-allowed" 
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:scale-[1.02] active:scale-[0.98]"
                )}
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  'Complete Receipt'
                )}
              </Button>
            </Card>

            {selectedPOId !== 'none' && (
              <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-200 dark:border-amber-500/20 flex gap-3">
                <AlertCircle className="size-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 dark:text-amber-400/90 leading-normal font-medium">
                  <strong>Important:</strong> Once completed, this receipt will trigger stock movements and update your inventory valuation. Ensure quantities match the physical delivery.
                </p>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
