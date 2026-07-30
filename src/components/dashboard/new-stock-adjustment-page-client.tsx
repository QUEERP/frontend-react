import { toast } from 'sonner';
import React, { useCallback, useEffect, useState } from 'react'
import {  useNavigate, useParams  } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { SlidersHorizontal, ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react'
import { stockAPI, warehousesAPI, productsAPI, Warehouse, Product } from '@/lib/api/inventory'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const ADJUSTMENT_REASONS = ['DAMAGED', 'EXPIRED', 'THEFT', 'FOUND', 'CORRECTION', 'RETURN', 'OTHER']

export default function NewStockAdjustmentPageClient() {
  const pathname = useLocation().pathname;
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || '';
  const params = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  

  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [warehouseId, setWarehouseId] = useState('')
  const [productId, setProductId] = useState('')
  const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'REMOVE'>('ADD')
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState('CORRECTION')
  const [notes, setNotes] = useState('')

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
    } finally { setIsLoading(false) }
  }, [businessId, toast])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!warehouseId || !productId) {
      toast({ title: 'Please select warehouse and product', variant: 'destructive' }); return
    }
    try {
      setIsSubmitting(true)
      await stockAPI.createAdjustment(businessId, { warehouseId, productId, adjustmentType, quantity, reason, notes } as any)
      toast({ title: 'Stock adjustment created successfully' })
      navigate(`/dashboard/${businessId}/stock-adjustments`)
    } catch (err: any) {
      toast({ title: err?.message || 'Failed to create adjustment', variant: 'destructive' })
    } finally { setIsSubmitting(false) }
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate(`/dashboard/${businessId}/stock-adjustments`)}>
          <ArrowLeft className="h-4 w-4" />Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Stock Adjustment</h1>
          <p className="text-sm text-muted-foreground">Manually adjust inventory quantities</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" />Adjustment Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Warehouse *</Label>
                <Select value={warehouseId} onValueChange={setWarehouseId} disabled={isLoading}>
                  <SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                  <SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Product *</Label>
                <Select value={productId} onValueChange={setProductId} disabled={isLoading}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Adjustment Type *</Label>
                <Select value={adjustmentType} onValueChange={v => setAdjustmentType(v as 'ADD' | 'REMOVE')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADD">➕ Add Stock</SelectItem>
                    <SelectItem value="REMOVE">➖ Remove Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input type="number" min="1" value={quantity} onChange={e => setQuantity(Number(e.target.value) || 1)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ADJUSTMENT_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes about this adjustment…" rows={3} />
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(`/dashboard/${businessId}/stock-adjustments`)}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}Create Adjustment
          </Button>
        </div>
      </form>
    </div>
  )
}
