import * as React from 'react'
import { productsAPI, warehousesAPI, Warehouse, Product } from '@/lib/api/inventory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Loader2, Package, DollarSign, Tag, Warehouse as WarehouseIcon, PackagePlus } from 'lucide-react'
import { EditableTaxSelect } from '@/components/dashboard/editable-tax-select'
import { useBusinessData } from '@/components/dashboard/business-data-provider'

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

interface CreateProductModalProps {
  open: boolean
  onClose: () => void
  businessId: string
  onCreated: (product: Product) => void
}

interface FormState {
  name: string
  sku: string
  description: string
  price: string
  costPrice: string
  type: 'GOODS' | 'SERVICE'
  unit: string
  taxCode: string
  taxPercent: string
  initialQty: string
  warehouseId: string
}

const DEFAULT_FORM: FormState = {
  name: '',
  sku: '',
  description: '',
  price: '0',
  costPrice: '',
  type: 'GOODS',
  unit: 'pcs',
  taxCode: '',
  taxPercent: '0',
  initialQty: '0',
  warehouseId: '',
}

export function CreateProductModal({ open, onClose, businessId, onCreated }: CreateProductModalProps) {
  const [form, setForm] = React.useState<FormState>(DEFAULT_FORM)
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([])
  const [submitting, setSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({})
  const [activeTab, setActiveTab] = React.useState('basic')
  const { currency = 'AED' } = useBusinessData()
  const isIndia = currency === 'INR';
  const isUae = currency === 'AED';

  React.useEffect(() => {
    if (!open) return
    setForm(DEFAULT_FORM)
    setErrors({})
    setActiveTab('basic')
    warehousesAPI.getAll(businessId)
      .then(r => setWarehouses(r.warehouses || []))
      .catch(() => {/* silent */})
  }, [open, businessId])

  const set = (field: keyof FormState) => (value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleTypeChange = (value: 'GOODS' | 'SERVICE') => {
    setForm(prev => ({
      ...prev,
      type: value,
      unit: value === 'SERVICE' ? 'hr' : 'pcs',
      initialQty: value === 'SERVICE' ? '0' : prev.initialQty,
      warehouseId: value === 'SERVICE' ? '' : prev.warehouseId,
    }))
  }

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {}
    
    // Required Fields
    if (!form.name.trim()) e.name = 'Product Name is required'
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) e.price = 'Valid Selling Price is required'
    if (!form.type) e.type = 'Product Type is required'
    if (form.type === 'GOODS') {
      if (form.initialQty === '' || isNaN(Number(form.initialQty)) || Number(form.initialQty) < 0) {
        e.initialQty = 'Opening quantity is required'
      }
      if (!form.warehouseId || form.warehouseId === 'none') {
        e.warehouseId = 'Warehouse is required'
      }
    }

    setErrors(e)

    if (Object.keys(e).length > 0) {
      if (e.name || e.sku) setActiveTab('basic')
      else if (e.price) setActiveTab('pricing')
      else if (e.type) setActiveTab('tax')
      else if (e.initialQty) setActiveTab('inventory')
    }

    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) {
      toast.error('Unable to save. Please fill in all required fields marked with * and submit again.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim() || `PRD-${Date.now().toString().slice(-6)}`,
        description: form.description.trim() || undefined,
        price: Number(form.price),
        sellingPrice: Number(form.price),
        costPrice: form.costPrice ? Number(form.costPrice) : undefined,
        type: form.type,
        unit: form.unit || 'pcs',
        taxCode: form.taxCode.trim() || undefined,
        taxPercent: Number(form.taxPercent || 0),
        taxRate: Number(form.taxPercent || 0),
        initialQty: form.type === 'GOODS' ? Number(form.initialQty || 0) : undefined,
        warehouseId: form.type === 'GOODS' ? (form.warehouseId || undefined) : undefined,
      }

      const res = await productsAPI.create(businessId, payload)
      if (res.success && res.product) {
        toast.success(`Product "${res.product.name}" created successfully`)
        onCreated(res.product)
        onClose()
      } else {
        throw new Error('Unexpected response from server')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create product')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[680px] w-[95vw] p-0 overflow-hidden rounded-2xl bg-card dark:bg-slate-900 border border-border dark:border-slate-800 shadow-2xl">
        <DialogHeader className="px-6 py-5 border-b border-border dark:border-slate-800 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/5 dark:to-teal-500/5">
          <DialogTitle className="text-xl font-bold text-foreground dark:text-slate-100 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <PackagePlus className="h-5 w-5" />
            </div>
            {form.type === 'SERVICE' ? 'Quick Create Service' : 'Quick Create Product'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground dark:text-slate-400 font-medium mt-1">
            {form.type === 'SERVICE' ? 'Create a new service without leaving this screen. It will be auto-selected after creation.' : 'Create a new product without leaving this screen. It will be auto-selected after creation.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="max-h-[68vh] overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-6 pt-4 border-b border-border dark:border-slate-800 bg-muted/50 dark:bg-slate-900/50">
                <TabsList className="h-9 bg-muted dark:bg-slate-800 rounded-lg p-0.5 gap-0.5">
                  <TabsTrigger value="basic" className="rounded-md text-xs font-semibold data-[state=active]:bg-card dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm px-3 h-8">
                    <Package className="h-3.5 w-3.5 mr-1.5" />Basic
                  </TabsTrigger>
                  <TabsTrigger value="pricing" className="rounded-md text-xs font-semibold data-[state=active]:bg-card dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm px-3 h-8">
                    <DollarSign className="h-3.5 w-3.5 mr-1.5" />Pricing
                  </TabsTrigger>
                  <TabsTrigger value="tax" className="rounded-md text-xs font-semibold data-[state=active]:bg-card dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm px-3 h-8">
                    <Tag className="h-3.5 w-3.5 mr-1.5" />Tax & Type
                  </TabsTrigger>
                  <TabsTrigger value="inventory" className="rounded-md text-xs font-semibold data-[state=active]:bg-card dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm px-3 h-8">
                    <WarehouseIcon className="h-3.5 w-3.5 mr-1.5" />Inventory
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* ── Basic Info ── */}
              <TabsContent value="basic" className="px-6 py-5 space-y-5 m-0">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground dark:text-slate-300 uppercase tracking-wider">
                    Product Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="prod-name"
                    value={form.name}
                    onChange={e => set('name')(e.target.value)}
                    placeholder="e.g. Steel Pipe 2-inch"
                    className={`h-11 rounded-xl border-border dark:border-slate-700 bg-muted/50 dark:bg-slate-800 focus:bg-card dark:focus:bg-slate-700 transition-colors ${errors.name ? 'border-rose-400 dark:border-rose-500' : ''}`}
                    autoFocus
                  />
                  {errors.name && <p className="text-xs text-rose-500 font-medium">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground dark:text-slate-300 uppercase tracking-wider">
                      SKU (Optional)
                    </Label>
                    <Input
                      id="prod-sku"
                      value={form.sku}
                      onChange={e => set('sku')(e.target.value.toUpperCase())}
                      placeholder="Leave blank to auto-generate"
                      className={`h-11 rounded-xl border-border dark:border-slate-700 bg-muted/50 dark:bg-slate-800 font-mono uppercase transition-colors ${errors.sku ? 'border-rose-400 dark:border-rose-500' : ''}`}
                    />
                    {errors.sku && <p className="text-xs text-rose-500 font-medium">{errors.sku}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground dark:text-slate-300 uppercase tracking-wider">Unit</Label>
                    <Select value={form.unit} onValueChange={set('unit')}>
                      <SelectTrigger className="h-11 rounded-xl border-border dark:border-slate-700 bg-muted/50 dark:bg-slate-800 transition-colors">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border dark:border-slate-800 shadow-lg">
                        {(form.type === 'SERVICE' ? SERVICE_UNITS : GOODS_UNITS).map(u => (
                          <SelectItem key={u.value} value={u.value} className="rounded-lg cursor-pointer">{u.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground dark:text-slate-300 uppercase tracking-wider">Description</Label>
                  <Textarea
                    id="prod-desc"
                    value={form.description}
                    onChange={e => set('description')(e.target.value)}
                    placeholder="Optional product description..."
                    rows={3}
                    className="rounded-xl border-border dark:border-slate-700 bg-muted/50 dark:bg-slate-800 resize-none text-sm transition-colors"
                  />
                </div>
              </TabsContent>

              {/* ── Pricing ── */}
              <TabsContent value="pricing" className="px-6 py-5 space-y-5 m-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground dark:text-slate-300 uppercase tracking-wider">
                      Selling Price <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                      <Input
                        id="prod-price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.price}
                        onChange={e => set('price')(e.target.value)}
                        placeholder="0.00"
                        className={`h-11 pl-9 rounded-xl border-border dark:border-slate-700 bg-muted/50 dark:bg-slate-800 transition-colors ${errors.price ? 'border-rose-400 dark:border-rose-500' : ''}`}
                      />
                    </div>
                    {errors.price && <p className="text-xs text-rose-500 font-medium">{errors.price}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground dark:text-slate-300 uppercase tracking-wider">Cost Price</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                      <Input
                        id="prod-cost"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.costPrice}
                        onChange={e => set('costPrice')(e.target.value)}
                        placeholder="0.00"
                        className="h-11 pl-9 rounded-xl border-border dark:border-slate-700 bg-muted/50 dark:bg-slate-800 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                    💡 Selling price is the price charged to customers. Cost price is used for margin calculation.
                  </p>
                </div>
              </TabsContent>

              {/* ── Tax & Type ── */}
              <TabsContent value="tax" className="px-6 py-5 space-y-5 m-0">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground dark:text-slate-300 uppercase tracking-wider">
                    Product Type <span className="text-rose-500">*</span>
                  </Label>
                  <Select value={form.type} onValueChange={handleTypeChange}>
                    <SelectTrigger className={`h-11 rounded-xl border-border dark:border-slate-700 bg-muted/50 dark:bg-slate-800 ${errors.type ? 'border-rose-400' : ''}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border dark:border-slate-800 shadow-lg">
                      <SelectItem value="GOODS" className="rounded-lg cursor-pointer">📦 Goods (Physical Product)</SelectItem>
                      <SelectItem value="SERVICE" className="rounded-lg cursor-pointer">🛠️ Service</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && <p className="text-xs text-rose-500 font-medium">{errors.type}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {!isUae && (
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground dark:text-slate-300 uppercase tracking-wider">
                        {isIndia ? (form.type === 'SERVICE' ? 'SAC Code' : 'HSN Code') : 'Tax Code'}
                      </Label>
                      <Input
                        id="prod-taxcode"
                        value={form.taxCode}
                        onChange={e => set('taxCode')(e.target.value)}
                        placeholder={isIndia ? (form.type === 'SERVICE' ? "e.g. 9983" : "e.g. 8471") : "e.g. TAX-01"}
                        className="h-11 rounded-xl border-border dark:border-slate-700 bg-muted/50 dark:bg-slate-800 font-mono uppercase transition-colors"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground dark:text-slate-300 uppercase tracking-wider">
                      {isIndia ? 'GST Percentage (%)' : isUae ? 'VAT Percentage (%)' : 'Tax Percentage (%)'}
                    </Label>
                    <EditableTaxSelect
                      value={Number(form.taxPercent || 0)}
                      onChange={(val) => set('taxPercent')(String(val))}
                      options={[0, 5, 12, 15, 18, 28]}
                      size="default"
                    />
                    {errors.taxPercent && <p className="text-xs text-rose-500 font-medium">{errors.taxPercent}</p>}
                  </div>
                </div>
              </TabsContent>

              {/* ── Inventory ── */}
              <TabsContent value="inventory" className="px-6 py-5 space-y-5 m-0">
                {form.type === 'SERVICE' ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-4 text-slate-400 bg-muted/10 rounded-2xl border border-dashed border-border dark:border-slate-800 min-h-[250px]">
                    <WarehouseIcon className="h-10 w-10 opacity-30" />
                    <div className="text-center space-y-1">
                      <h3 className="font-bold text-base text-foreground dark:text-slate-200">Inventory Not Applicable</h3>
                      <p className="text-sm font-medium">This item is a Service.</p>
                      <p className="text-xs max-w-xs">Services do not maintain inventory, require warehouses, or participate in inventory valuation.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground dark:text-slate-300 uppercase tracking-wider">
                          Opening / Initial Quantity <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                          id="prod-qty"
                          type="number"
                          min="0"
                          step="1"
                          value={form.initialQty}
                          onChange={e => set('initialQty')(e.target.value)}
                          placeholder="0"
                          className={`h-11 rounded-xl border-border dark:border-slate-700 bg-muted/50 dark:bg-slate-800 transition-colors ${errors.initialQty ? 'border-rose-400 dark:border-rose-500' : ''}`}
                        />
                        {errors.initialQty && <p className="text-xs text-rose-500 font-medium">{errors.initialQty}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground dark:text-slate-300 uppercase tracking-wider">Warehouse</Label>
                        <Select value={form.warehouseId || 'none'} onValueChange={v => set('warehouseId')(v === 'none' ? '' : v)}>
                          <SelectTrigger className={`h-11 rounded-xl border-border dark:border-slate-700 bg-muted/50 dark:bg-slate-800 ${errors.warehouseId ? 'border-rose-400 dark:border-rose-500' : ''}`}>
                            <SelectValue placeholder="Select warehouse" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border dark:border-slate-800 shadow-lg">
                            <SelectItem value="none" className="rounded-lg cursor-pointer text-slate-400">No warehouse</SelectItem>
                            {warehouses.map(w => (
                              <SelectItem key={w.id} value={w.id} className="rounded-lg cursor-pointer">{w.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.warehouseId && <p className="text-xs text-rose-500 font-medium">{errors.warehouseId}</p>}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
                      <p className="text-xs text-blue-700 dark:text-blue-400 font-semibold">
                        💡 Initial quantity sets the opening stock. Enter 0 if no stock exists yet.
                      </p>
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center px-6 py-4 border-t border-border dark:border-slate-800 bg-muted/50 dark:bg-slate-900/50 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="h-10 rounded-xl border-border dark:border-slate-700 text-muted-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800 cursor-pointer font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold gap-2 cursor-pointer transition-colors"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
              ) : (
                <><PackagePlus className="h-4 w-4" /> Create Product</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
