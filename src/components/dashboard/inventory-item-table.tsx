import * as React from 'react'
import { Plus, Trash2, Package, Warehouse as WarehouseIcon, AlertCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Product, Warehouse } from '@/lib/api/inventory'
import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {  useParams  } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { productsAPI } from '@/lib/api/inventory'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { EditableTaxSelect } from '@/components/dashboard/editable-tax-select'
import { CreateProductModal } from './create-product-modal'

export interface ItemRow {
  igstPercent?: number;
  sgstPercent?: number;
  cgstPercent?: number;
  id: string
  productId: string
  warehouseId: string
  description: string
  itemType: 'GOODS' | 'SERVICE'
  hsnSacCode: string
  quantity: number
  price: number
  taxPercent: number
  amount: number
  unit: string
  // Visual/UX fields
  availableStock?: number
  lowStock?: boolean
}

interface InventoryItemTableProps {
  items: ItemRow[]
  onItemsChange: (items: ItemRow[]) => void
  products: Product[]
  warehouses: Warehouse[]
  currency: string
  mode: 'sales' | 'purchase' | 'invoice'
  onProductAdded?: (product: Product) => void
  taxLabel?: string
}

import { useLocation } from 'react-router-dom';
export function InventoryItemTable({
  items,
  onItemsChange,
  products,
  warehouses,
  currency,
  mode,
  onProductAdded,
  taxLabel = 'TAX'
}: InventoryItemTableProps) {
  const { businessId } = useParams<{ businessId: string }>();
  const params = useParams()
  
  
  const [showProductDialog, setShowProductDialog] = React.useState(false)
  const [activeProductIndex, setActiveProductIndex] = React.useState<number | null>(null)

  const handleProductCreated = (createdProduct: Product) => {
    if (onProductAdded) onProductAdded(createdProduct)
    if (activeProductIndex !== null) {
      updateItem(activeProductIndex, { productId: createdProduct.id })
    }
  }
  
  const addItem = () => {
    const newItem: ItemRow = {
      id: Math.random().toString(36).substr(2, 9),
      productId: '',
      warehouseId: warehouses[0]?.id || '',
      description: '',
      itemType: 'GOODS',
      hsnSacCode: '',
      quantity: 1,
      price: 0,
      taxPercent: 0,
      amount: 0,
      unit: 'pcs',
    }
    onItemsChange([...items, newItem])
  }

  const removeItem = (index: number) => {
    if (items.length === 1) return
    const newItems = items.filter((_, i) => i !== index)
    onItemsChange(newItems)
  }

  const updateItem = (index: number, updates: Partial<ItemRow>) => {
    const newItems = items.map((item, i) => {
      if (i === index) {
        const updated = { ...item, ...updates }
        
        // Recalculate amount
        const subtotal = Number(updated.quantity || 0) * Number(updated.price || 0)
        const taxAmount = (subtotal * Number(updated.taxPercent || 0)) / 100
        updated.amount = subtotal + taxAmount
        
        // Handle product change
        if (updates.productId) {
          const product = products.find(p => p.id === updates.productId)
          if (product) {
            updated.description = product.description || product.name
            updated.hsnSacCode = product.taxCode || ''
            updated.price = mode === 'purchase' ? (product.costPrice || 0) : (product.sellingPrice || 0)
            updated.taxPercent = product.taxRate || 0
            updated.itemType = (product.type as any) || 'GOODS'
            updated.unit = typeof product.unit === 'object' ? product.unit?.abbreviation : (product.unit || 'pcs')
            
            // Stock logic
            const stockLevel = product.stockLevels?.find(s => s.warehouseId === updated.warehouseId)
            updated.availableStock = stockLevel ? (stockLevel.quantity - stockLevel.reservedQty) : 0
            updated.lowStock = updated.availableStock < (product.reorderLevel || 0)
          }
        }

        // Handle warehouse change (update available stock)
        if (updates.warehouseId) {
          const product = products.find(p => p.id === updated.productId)
          if (product) {
            const stockLevel = product.stockLevels?.find(s => s.warehouseId === updates.warehouseId)
            updated.availableStock = stockLevel ? (stockLevel.quantity - stockLevel.reservedQty) : 0
            updated.lowStock = updated.availableStock < (product.reorderLevel || 0)
          }
        }

        return updated
      }
      return item
    })
    onItemsChange(newItems)
  }

  const primaryType = items[0]?.itemType || 'GOODS'
  const isService = primaryType === 'SERVICE'

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[200px]">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[200px]">Description</th>
                {!isService && <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[150px]">Warehouse</th>}
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[120px]">{isService ? 'SAC' : 'HSN'}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[100px]">
                  {items.length > 0 ? (
                    items[0].itemType === 'SERVICE' ? 'HRS' :
                    ['kg', 'gram', 'meter', 'litre'].includes((items[0].unit || '').toLowerCase()) ? items[0].unit?.toUpperCase() : 'QTY'
                  ) : (isService ? 'HRS' : 'QTY')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[120px]">Unit</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[120px]">Rate</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[100px]">{taxLabel} %</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[140px]">Total</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[60px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item, index) => (
                <tr key={item.id} className="group hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-4 align-top">
                    <div className="space-y-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between h-10 border-muted-foreground/20 font-normal",
                              !item.productId && "text-muted-foreground"
                            )}
                          >
                            {item.productId
                              ? products.find((p) => p.id === item.productId)?.name
                              : "Search product..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search product by name or SKU..." />
                            <CommandList>
                              <CommandEmpty>No product found.</CommandEmpty>
                              <CommandGroup>
                                {products.map((p) => (
                                  <CommandItem
                                    key={p.id}
                                    value={p.name + " " + p.sku}
                                    onSelect={() => {
                                      updateItem(index, { productId: p.id })
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        item.productId === p.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-medium">{p.name}</span>
                                      <span className="text-[10px] text-muted-foreground">
                                        SKU: {p.sku} | {currency} {mode === 'purchase' ? p.costPrice : p.sellingPrice}
                                      </span>
                                    </div>
                                  </CommandItem>
                                ))}
                                <CommandItem
                                  value="add_new_product"
                                  onSelect={() => {
                                    setActiveProductIndex(index)
                                    setShowProductDialog(true)
                                  }}
                                  className="text-primary font-medium cursor-pointer mt-1 border-t pt-2"
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add New Product
                                </CommandItem>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {item.productId && !isService && (
                        <div className="flex items-center gap-2 px-1 pt-1">
                          <Badge variant="outline" className={cn(
                            "text-[10px] py-0 h-5 gap-1 font-normal",
                            item.lowStock ? "text-amber-600 border-amber-200 bg-amber-50" : "text-emerald-600 border-emerald-200 bg-emerald-50"
                          )}>
                            <Package className="size-3" />
                            {item.availableStock} available
                          </Badge>
                          {item.lowStock && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertCircle className="size-3.5 text-amber-500 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>Low stock alert</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-4 align-top">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(index, { description: e.target.value })}
                      className="text-xs h-10 bg-background border-dashed border-muted-foreground/20"
                    />
                  </td>

                  {!isService && (
                    <td className="px-4 py-4 align-top">
                      <Select
                        value={item.warehouseId}
                        onValueChange={(val) => updateItem(index, { warehouseId: val })}
                      >
                        <SelectTrigger className="h-10 border-muted-foreground/20 text-xs">
                          <SelectValue placeholder="Select Warehouse" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map(w => (
                            <SelectItem key={w.id} value={w.id}>
                              <div className="flex items-center gap-2 text-xs">
                                <WarehouseIcon className="size-3.5 text-muted-foreground" />
                                <span>{w.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  )}

                  <td className="px-4 py-4 align-top">
                    <Input
                      placeholder={isService ? 'SAC Code' : 'HSN Code'}
                      value={item.hsnSacCode}
                      onChange={(e) => updateItem(index, { hsnSacCode: e.target.value })}
                      className="text-xs h-10 bg-background border-dashed border-muted-foreground/20"
                    />
                  </td>

                  <td className="px-4 py-4 align-top">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, { quantity: parseFloat(e.target.value) || 0 })}
                      className={cn(
                        "h-10 text-center border-muted-foreground/20",
                        mode === 'sales' && !isService && item.quantity > (item.availableStock || 0) && "border-red-500 focus-visible:ring-red-500"
                      )}
                    />
                    {mode === 'sales' && !isService && item.quantity > (item.availableStock || 0) && (
                      <p className="text-[10px] text-red-500 mt-1 font-medium leading-tight">
                        Insufficient stock
                      </p>
                    )}
                  </td>
                  
                  <td className="px-4 py-4 align-top">
                    <Select
                      value={item.unit || 'pcs'}
                      onValueChange={(val) => updateItem(index, { unit: val })}
                    >
                      <SelectTrigger className="h-10 border-muted-foreground/20 text-xs text-muted-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pcs">pcs</SelectItem>
                        <SelectItem value="hr">hr</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="box">box</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>

                  <td className="px-4 py-4 align-top">
                    <div className="relative">
                      <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">{currency}</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateItem(index, { price: parseFloat(e.target.value) || 0 })}
                        className="h-10 pl-8 border-muted-foreground/20"
                      />
                    </div>
                  </td>

                  <td className="px-4 py-4 align-top">
                    <EditableTaxSelect
                      value={item.taxPercent ?? 0}
                      onChange={(val) => updateItem(index, { taxPercent: val })}
                      options={[0, 5, 12, 15, 18, 28]}
                      size="sm"
                    />
                  </td>

                  <td className="px-4 py-4 align-top text-right">
                    <div className="h-10 flex items-center justify-end font-semibold text-sm">
                      {currency} {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </td>

                  <td className="px-4 py-4 align-top text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                      disabled={items.length === 1}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex items-center justify-between px-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          className="gap-2 border-primary/20 text-primary hover:bg-primary/5 hover:text-primary transition-all shadow-sm"
        >
          <Plus className="size-4" />
          Add New Line
        </Button>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Info className="size-3.5" />
            <span>Prices are {mode === 'purchase' ? 'cost' : 'selling'} prices</span>
          </div>
        </div>
      </div>

      {/* Standardized Quick Create Product Modal */}
      <CreateProductModal
        open={showProductDialog}
        onClose={() => setShowProductDialog(false)}
        businessId={businessId || ''}
        onCreated={handleProductCreated}
      />
    </div>
  )
}
