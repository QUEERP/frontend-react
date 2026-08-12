import { toast } from 'sonner';
import React, { useCallback, useEffect, useState } from 'react'
import {  useNavigate, useParams  } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { ArrowRightLeft, ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react'
import { stockAPI, warehousesAPI, productsAPI, Warehouse, Product } from '@/lib/api/inventory'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface TransferItem {
  productId: string
  quantity: number
  notes: string
}

export default function NewStockTransferPageClient() {
  const pathname = useLocation().pathname;
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || '';
  const params = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  

  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [fromWarehouseId, setFromWarehouseId] = useState('')
  const [toWarehouseId, setToWarehouseId] = useState('')
  const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<TransferItem[]>([{ productId: '', quantity: 1, notes: '' }])

  const fetchData = useCallback(async () => {
    if (!businessId) return
    try {
      setIsLoading(true)
      const [whRes, prdRes] = await Promise.allSettled([
        warehousesAPI.getAll(businessId),
        productsAPI.getAll(businessId),
      ])
      if (whRes.status === 'fulfilled') setWarehouses(whRes.value.warehouses || [])
      if (prdRes.status === 'fulfilled') setProducts(prdRes.value.products || (prdRes.value as any).data || [])
    } catch {
      toast({ title: 'Failed to load data', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [businessId])

  useEffect(() => { fetchData() }, [fetchData])

  const addItem = () => setItems(prev => [...prev, { productId: '', quantity: 1, notes: '' }])
  const removeItem = (i: number) => setItems(prev => prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: keyof TransferItem, value: string | number) =>
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fromWarehouseId || !toWarehouseId) {
      toast({ title: 'Please select both warehouses', variant: 'destructive' }); return
    }
    if (fromWarehouseId === toWarehouseId) {
      toast({ title: 'Source and destination warehouses must be different', variant: 'destructive' }); return
    }
    const validItems = items.filter(i => i.productId && i.quantity > 0)
    if (validItems.length === 0) {
      toast({ title: 'Add at least one product to transfer', variant: 'destructive' }); return
    }
    try {
      setIsSubmitting(true)
      await stockAPI.createTransfer(businessId, { fromWarehouseId, toWarehouseId, transferDate, notes, items: validItems } as any)
      toast({ title: 'Stock transfer created successfully' })
      navigate(`/dashboard/${businessId}/stock-transfers`)
    } catch (err: any) {
      toast({ title: err?.message || 'Failed to create transfer', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate(`/dashboard/${businessId}/stock-transfers`)}>
          <ArrowLeft className="h-4 w-4" />Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Stock Transfer</h1>
          <p className="text-sm text-muted-foreground">Move inventory between warehouses</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><ArrowRightLeft className="h-4 w-4" />Transfer Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Warehouse *</Label>
                <Select value={fromWarehouseId} onValueChange={setFromWarehouseId} disabled={isLoading}>
                  <SelectTrigger><SelectValue placeholder="Select source warehouse" /></SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>To Warehouse *</Label>
                <Select value={toWarehouseId} onValueChange={setToWarehouseId} disabled={isLoading}>
                  <SelectTrigger><SelectValue placeholder="Select destination warehouse" /></SelectTrigger>
                  <SelectContent>
                    {warehouses.filter(w => w.id !== fromWarehouseId).map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Transfer Date</Label>
              <Input type="date" value={transferDate} onChange={e => setTransferDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional transfer notes…" rows={2} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Items *</CardTitle>
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={addItem}>
                <Plus className="h-4 w-4" />Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="hidden md:grid grid-cols-[2fr_1fr_2fr_auto] gap-3 px-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <div>Product</div><div>Quantity</div><div>Notes</div><div className="w-8" />
            </div>
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_2fr_auto] gap-3 items-start rounded-lg border p-3">
                <div className="space-y-1">
                  <Label className="md:hidden text-xs">Product</Label>
                  <Select value={item.productId} onValueChange={v => updateItem(i, 'productId', v)} disabled={isLoading}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>
                      {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="md:hidden text-xs">Quantity</Label>
                  <Input type="number" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value) || 1)} className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="md:hidden text-xs">Notes</Label>
                  <Input value={item.notes} onChange={e => updateItem(i, 'notes', e.target.value)} placeholder="Optional" className="h-9" />
                </div>
                <div className="flex items-end pb-0.5">
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-red-500" onClick={() => removeItem(i)} disabled={items.length === 1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(`/dashboard/${businessId}/stock-transfers`)}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Transfer
          </Button>
        </div>
      </form>
    </div>
  )
}
