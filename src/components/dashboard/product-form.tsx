import React, { useState, useEffect, useCallback } from 'react';
import {  useNavigate, useLocation  } from 'react-router-dom';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { EditableTaxSelect } from '@/components/dashboard/editable-tax-select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useBusinessData } from './business-data-provider'
import { Warehouse as WarehouseIcon, Package, Tag, Calculator, ShieldCheck, Image as ImageIcon, Barcode, Upload, Link as LinkIcon } from 'lucide-react'
import { productsAPI, warehousesAPI, categoriesAPI, brandsAPI, Warehouse, Product } from '@/lib/api/inventory'
import { warehousesAPI as locationsAPI, WarehouseLocation } from '@/lib/api/warehouses'
import { toast } from 'sonner'

interface ProductFormData {
  name: string
  sku: string
  barcode: string
  description: string
  type: 'GOODS' | 'SERVICE'
  categoryId: string
  brandId: string
  unit: string
  sellingPrice: number
  costPrice: number
  taxCode: string
  taxRate: number
  reorderLevel: number
  isActive: boolean
  openingStock: number
  openingWarehouseId: string
  openingLocationId: string
  image: string
  availableStock: number
}

interface ProductFormProps {
  productId?: string
}

export default function ProductForm({ productId }: ProductFormProps) {
  const navigate = useNavigate()
  const pathname = useLocation().pathname
  const { currency = 'AED' } = useBusinessData()
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || ''

  const submitLabel = productId ? 'Update Product' : 'Create Product'

  const [categories, setCategories] = React.useState<any[]>([])
  const [brands, setBrands] = React.useState<any[]>([])
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([])
  const [submitting, setSubmitting] = React.useState(false)
  const [loading, setLoading] = React.useState(!!productId)
  const [linkDialogOpen, setLinkDialogOpen] = React.useState(false)

  const [formData, setFormData] = React.useState<ProductFormData>({
    name: '',
    sku: '',
    barcode: '',
    description: '',
    type: 'GOODS',
    categoryId: '',
    brandId: '',
    unit: 'pcs',
    sellingPrice: 0,
    costPrice: 0,
    taxCode: '',
    taxRate: 0,
    reorderLevel: 0,
    isActive: true,
    openingStock: 0,
    openingWarehouseId: '',
    openingLocationId: '',
    image: '',
    availableStock: 0,
  })
  
  const [locations, setLocations] = React.useState<WarehouseLocation[]>([])

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [catRes, brandRes, whRes] = await Promise.allSettled([
          categoriesAPI.getAll(businessId),
          brandsAPI.getAll(businessId),
          warehousesAPI.getAll(businessId)
        ])
        
        if (catRes.status === 'fulfilled') setCategories(catRes.value.categories || [])
        if (brandRes.status === 'fulfilled') setBrands(brandRes.value.brands || [])
        if (whRes.status === 'fulfilled') {
          const whs = whRes.value.warehouses || []
          setWarehouses(whs)
          if (whs.length > 0 && !productId) setFormData(prev => ({ ...prev, openingWarehouseId: whs[0].id }))
        }

        if (productId) {
          const res = await productsAPI.getById(businessId, productId)
          if (res.success && res.product) {
            const p = res.product
            setFormData({
              name: p.name || '',
              sku: p.sku || '',
              barcode: p.barcode || '',
              description: p.description || '',
              type: (p as any).type || 'GOODS',
              categoryId: p.categoryId || '',
              brandId: p.brandId || '',
              unit: typeof p.unit === 'object' ? p.unit?.abbreviation || 'pcs' : (p as any).unit || 'pcs',
              sellingPrice: p.sellingPrice || 0,
              costPrice: p.costPrice || 0,
              taxCode: p.taxCode || '',
              taxRate: p.taxRate || 0,
              reorderLevel: p.reorderLevel || 0,
              isActive: p.isActive ?? true,
              openingStock: 0,
              openingWarehouseId: '',
              openingLocationId: '',
              image: p.imageUrl || '',
              availableStock: (p as any).stock ? (p as any).stock.reduce((acc: number, curr: any) => acc + ((curr.quantity || 0) - (curr.reservedQty || 0)), 0) : 0,
            })
          }
        }
      } catch (e) {
        toast.error('Failed to load form data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [businessId, productId])

  const GOODS_UNITS = [
    { value: 'pcs', label: 'Piece' },
    { value: 'box', label: 'Box' },
    { value: 'carton', label: 'Carton' },
    { value: 'pkt', label: 'Packet' },
    { value: 'kg', label: 'Kg' },
    { value: 'g', label: 'Gram' },
    { value: 'm', label: 'Meter' },
    { value: 'l', label: 'Litre' },
    { value: 'set', label: 'Set' },
  ];

  const SERVICE_UNITS = [
    { value: 'hr', label: 'Hour' },
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'visit', label: 'Visit' },
    { value: 'job', label: 'Job' },
    { value: 'project', label: 'Project' },
    { value: 'session', label: 'Session' },
    { value: 'license', label: 'License' },
  ];

  const handleTypeChange = (type: 'GOODS' | 'SERVICE') => {
    setFormData(prev => ({
      ...prev,
      type,
      unit: type === 'SERVICE' ? 'hr' : 'pcs',
      openingStock: type === 'SERVICE' ? 0 : prev.openingStock,
      reorderLevel: type === 'SERVICE' ? 0 : prev.reorderLevel,
      openingWarehouseId: type === 'SERVICE' ? '' : prev.openingWarehouseId,
      openingLocationId: type === 'SERVICE' ? '' : prev.openingLocationId,
    }));
  };

  const isIndia = currency === 'INR';
  const isUae = currency === 'AED';

  React.useEffect(() => {
    if (formData.openingWarehouseId && formData.type === 'GOODS') {
      const fetchLocs = async () => {
        try {
          const res = await locationsAPI.getLocations(businessId, formData.openingWarehouseId)
          if (res.success) {
            const locs = res.locations || res.data || []
            setLocations(locs)
            
            const validIds = locs.map((l: any) => l.id)
            if (locs.length > 0 && (!formData.openingLocationId || !validIds.includes(formData.openingLocationId))) {
              const defaultLoc = locs.find((l: any) => l.isDefault)
              if (defaultLoc) {
                setFormData(prev => ({ ...prev, openingLocationId: defaultLoc.id }))
              } else {
                setFormData(prev => ({ ...prev, openingLocationId: locs[0].id }))
              }
            } else if (locs.length === 0) {
              setFormData(prev => ({ ...prev, openingLocationId: '' }))
            }
          }
        } catch (error) {
          console.error("Failed to fetch locations", error)
        }
      }
      fetchLocs()
    } else {
      setLocations([])
      setFormData(prev => ({ ...prev, openingLocationId: '' }))
    }
  }, [formData.openingWarehouseId, businessId, formData.type])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!formData.name || !formData.sku) {
      toast.error('Name and SKU are required')
      return
    }

    if (formData.type === 'GOODS') {
      if (formData.openingStock === undefined || formData.openingStock === null || isNaN(formData.openingStock)) {
        toast.error('Opening Quantity is required for Goods')
        return
      }
      if (!productId && (!formData.openingWarehouseId || formData.openingWarehouseId === 'none')) {
        toast.error('Warehouse is required for Goods')
        return
      }
    }

    setSubmitting(true)
    try {
      const payload: Partial<Product> = {
        ...formData,
        price: formData.sellingPrice,
        taxPercent: formData.taxRate,
        hsnCode: formData.taxCode,
        initialQty: formData.type === 'GOODS' ? formData.openingStock : undefined,
        warehouseId: formData.type === 'GOODS' ? formData.openingWarehouseId : undefined,
        locationId: (formData.type === 'GOODS' && formData.openingLocationId) ? formData.openingLocationId : undefined,
        reorderLevel: formData.type === 'GOODS' ? formData.reorderLevel : undefined,
        imageUrl: formData.image,
      }

      if (productId) {
        await productsAPI.update(businessId, productId, payload)
        toast.success('Product updated successfully')
      } else {
        await productsAPI.create(businessId, payload)
        toast.success('Product created successfully')
      }
      navigate(`/dashboard/${businessId}/products`)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save product')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Card className="max-w-5xl border-none shadow-xl bg-background/50 backdrop-blur-md mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Package className="size-6 text-primary" />
              {productId ? (formData.type === 'SERVICE' ? 'Edit Service' : 'Edit Product') : (formData.type === 'SERVICE' ? 'Add New Service' : 'Add New Product')}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {productId 
                ? (formData.type === 'SERVICE' ? 'Update service information, pricing and tax configuration.' : 'Update product specifications and pricing.')
                : (formData.type === 'SERVICE' ? 'Create a new service with pricing and tax configuration' : 'Create a new inventory item with pricing and stock')}
            </p>
          </div>
          {productId && (
            <Badge variant={formData.isActive ? "default" : "secondary"} className="h-6">
              {formData.isActive ? 'Active' : 'Inactive'}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full justify-start h-12 bg-muted/50 p-1 mb-8 rounded-xl border border-border/50">
              <TabsTrigger value="general" className="rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Tag className="size-4" />
                General Info
              </TabsTrigger>
              <TabsTrigger value="inventory" className="rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <WarehouseIcon className="size-4" />
                Inventory
              </TabsTrigger>
              <TabsTrigger value="pricing" className="rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Calculator className="size-4" />
                Pricing & Tax
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-8 animate-in fade-in-50 duration-300">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-bold uppercase text-muted-foreground">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. MacBook Pro M3"
                      className="h-11 border-muted-foreground/20 focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sku" className="text-xs font-bold uppercase text-muted-foreground">SKU / Model *</Label>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
                        placeholder="MBP-M3-001"
                        className="h-11 font-mono text-sm border-muted-foreground/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="barcode" className="text-xs font-bold uppercase text-muted-foreground">Barcode / UPC</Label>
                      <div className="relative">
                        <Barcode className="absolute left-3 top-3.5 size-4 text-muted-foreground" />
                        <Input
                          id="barcode"
                          value={formData.barcode}
                          onChange={(e) => setFormData((prev) => ({ ...prev, barcode: e.target.value }))}
                          placeholder="0123456789"
                          className="h-11 pl-10 border-muted-foreground/20"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-xs font-bold uppercase text-muted-foreground">Description</Label>
                    <Textarea
                      id="description"
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Product technical specifications, features..."
                      className="resize-none border-muted-foreground/20"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div className="p-6 bg-muted/30 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-center space-y-3 min-h-[200px] group hover:bg-muted/50 transition-colors cursor-pointer overflow-hidden relative">
                          {formData.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={formData.image} alt="Product" className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                          ) : (
                            <>
                              <div className="size-12 rounded-full bg-background border border-border flex items-center justify-center group-hover:scale-110 transition-transform">
                                <ImageIcon className="size-6 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold">Product Image</p>
                                <p className="text-xs text-muted-foreground mt-1">Upload JPG, PNG (Max 2MB) or Link</p>
                              </div>
                            </>
                          )}
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center" className="w-56">
                        <DropdownMenuItem onClick={() => document.getElementById('image-upload-input')?.click()}>
                          <Upload className="mr-2 h-4 w-4" />
                          <span>Browse from Device</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setLinkDialogOpen(true)}>
                          <LinkIcon className="mr-2 h-4 w-4" />
                          <span>Image Link</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <input 
                      id="image-upload-input"
                      type="file" 
                      accept="image/png, image/jpeg, image/jpg" 
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 2 * 1024 * 1024) {
                          toast.error("Image must be less than 2MB");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData(prev => ({ ...prev, image: reader.result as string }));
                          toast.success("Image uploaded successfully");
                        };
                        reader.readAsDataURL(file);
                      }}
                    />

                    <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Image Link</DialogTitle>
                          <DialogDescription>
                            Enter the URL of the product image.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div className="space-y-2">
                            <Label htmlFor="imageLink">Image URL</Label>
                            <Input
                              id="imageLink"
                              placeholder="https://example.com/image.jpg"
                              value={formData.image && formData.image.startsWith('http') ? formData.image : ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" type="button" onClick={() => setLinkDialogOpen(false)}>Done</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Product Type *</Label>
                      <Select value={formData.type} onValueChange={handleTypeChange}>
                        <SelectTrigger className="h-11 border-muted-foreground/20">
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GOODS">Goods</SelectItem>
                          <SelectItem value="SERVICE">Service</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Category</Label>
                      <Select value={formData.categoryId} onValueChange={(val) => setFormData(prev => ({ ...prev, categoryId: val }))}>
                        <SelectTrigger className="h-11 border-muted-foreground/20">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Brand</Label>
                      <Select value={formData.brandId} onValueChange={(val) => setFormData(prev => ({ ...prev, brandId: val }))}>
                        <SelectTrigger className="h-11 border-muted-foreground/20">
                          <SelectValue placeholder="Select Brand" />
                        </SelectTrigger>
                        <SelectContent>
                          {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Unit</Label>
                      <Select value={formData.unit} onValueChange={(val) => setFormData(prev => ({ ...prev, unit: val }))}>
                        <SelectTrigger className="h-11 border-muted-foreground/20">
                          <SelectValue placeholder="Select Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {(formData.type === 'SERVICE' ? SERVICE_UNITS : GOODS_UNITS).map(u => (
                            <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

              <TabsContent value="inventory" className="space-y-8 animate-in fade-in-50 duration-300">
                {formData.type === 'SERVICE' ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4 text-slate-400 bg-muted/20 rounded-2xl border border-dashed border-border min-h-[300px]">
                    <WarehouseIcon className="h-12 w-12 opacity-30" />
                    <div className="text-center space-y-1">
                      <h3 className="font-bold text-lg text-foreground">Inventory Not Applicable</h3>
                      <p className="text-sm font-medium">This item is a Service.</p>
                      <p className="text-sm">Services do not maintain inventory, require warehouses, or participate in inventory valuation.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-8 md:grid-cols-2">
                    <div className="space-y-6">
                      <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 space-y-4">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="size-5 text-primary" />
                          <h3 className="font-bold text-sm uppercase tracking-wider">Inventory Tracking</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2 space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground">Reorder Level</Label>
                            <Input
                              type="number"
                              value={formData.reorderLevel}
                              onChange={(e) => setFormData(prev => ({ ...prev, reorderLevel: Number(e.target.value) }))}
                              className="h-10"
                            />
                          </div>
                      </div>
                    </div>

                    {productId && (
                      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
                        <p className="text-xs text-blue-700 dark:text-blue-400 font-semibold leading-relaxed">
                          💡 Stock quantity cannot be edited directly. To add stock to this item, please record a Purchase Transaction or an Opening Balance Adjustment in the Inventory module.
                        </p>
                      </div>
                    )}

                    {!productId && (
                      <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 space-y-4">
                        <div className="flex items-center gap-2 text-amber-800">
                          <WarehouseIcon className="size-5" />
                          <h3 className="font-bold text-sm uppercase tracking-wider">Opening Stock</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-amber-700">Initial Quantity</Label>
                            <Input
                              type="number"
                              value={formData.openingStock}
                              onChange={(e) => setFormData(prev => ({ ...prev, openingStock: Number(e.target.value) }))}
                              className="h-10 border-amber-200 focus:ring-amber-200"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-amber-700">Warehouse</Label>
                            <Select value={formData.openingWarehouseId} onValueChange={(val) => setFormData(prev => ({ ...prev, openingWarehouseId: val }))}>
                              <SelectTrigger className="h-10 border-amber-200">
                                <SelectValue placeholder="Select Warehouse" />
                              </SelectTrigger>
                              <SelectContent>
                                {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {locations.length > 0 && (
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-amber-700">Location (Bin)</Label>
                              <Select value={formData.openingLocationId} onValueChange={(val) => setFormData(prev => ({ ...prev, openingLocationId: val }))}>
                                <SelectTrigger className="h-10 border-amber-200">
                                  <SelectValue placeholder="Select Location" />
                                </SelectTrigger>
                                <SelectContent>
                                  {locations.map(loc => (
                                    <SelectItem key={loc.id} value={loc.id}>
                                      {loc.name} ({loc.code}) {loc.isDefault ? ' (Default)' : ''}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase text-muted-foreground">Stock Summary Preview</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="p-4 bg-muted/20 border-none shadow-none">
                        <p className="text-xs text-muted-foreground font-medium">Available Stock</p>
                        <p className="text-2xl font-black mt-1">{productId ? formData.availableStock : (formData.openingStock || 0)} {formData.unit}</p>
                      </Card>
                      <Card className="p-4 bg-muted/20 border-none shadow-none">
                        <p className="text-xs text-muted-foreground font-medium">Valuation</p>
                        <p className="text-2xl font-black mt-1">{currency} {((productId ? formData.availableStock : formData.openingStock) * formData.costPrice).toLocaleString()}</p>
                      </Card>
                    </div>
                  </div>
                </div>
                )}
              </TabsContent>

            <TabsContent value="pricing" className="space-y-8 animate-in fade-in-50 duration-300">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase text-muted-foreground">Pricing Strategy</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">Selling Price</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-xs text-muted-foreground">{currency}</span>
                          <Input
                            type="number"
                            value={formData.sellingPrice}
                            onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: Number(e.target.value) }))}
                            className="h-11 pl-10 border-muted-foreground/20 font-bold"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">Cost Price</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-xs text-muted-foreground">{currency}</span>
                          <Input
                            type="number"
                            value={formData.costPrice}
                            onChange={(e) => setFormData(prev => ({ ...prev, costPrice: Number(e.target.value) }))}
                            className="h-11 pl-10 border-muted-foreground/20 font-bold"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center justify-between">
                      <span className="text-xs text-emerald-800 font-medium uppercase">Expected Margin</span>
                      <span className="text-sm font-black text-emerald-900">
                        {formData.sellingPrice > 0 
                          ? (((formData.sellingPrice - formData.costPrice) / formData.sellingPrice) * 100).toFixed(1)
                          : '0.0'}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase text-muted-foreground">Tax Configuration</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {!isUae && (
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground">
                            {isIndia ? (formData.type === 'SERVICE' ? 'SAC Code' : 'HSN Code') : 'Tax Code'}
                          </Label>
                          <Input
                            value={formData.taxCode}
                            onChange={(e) => setFormData(prev => ({ ...prev, taxCode: e.target.value }))}
                            placeholder={isIndia ? (formData.type === 'SERVICE' ? "e.g. 9983" : "e.g. 8471") : "e.g. TAX-01"}
                            className="h-11 border-muted-foreground/20"
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">
                          {isIndia ? 'GST (%)' : isUae ? 'VAT (%)' : 'Tax (%)'}
                        </Label>
                        <EditableTaxSelect
                          value={formData.taxRate ?? 0}
                          onChange={(val) => setFormData(prev => ({ ...prev, taxRate: val }))}
                          options={[0, 5, 12, 15, 18, 28]}
                          size="lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Separator className="opacity-50" />

          <div className="flex justify-end gap-4">
            <Button variant="ghost" type="button" onClick={() => window.history.back()} className="h-11 px-6">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="h-11 px-10 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
              {submitting ? 'Saving...' : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
