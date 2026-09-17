import * as React from 'react'
import { contactsAPI, Customer } from '@/lib/api/contacts'
import { Deal, dealsAPI } from '@/lib/api/deals'
import {
  CreateQuotationData,
  QuotationItemInput,
  QUOTATION_STATUS,
  UpdateQuotationData,
} from '@/lib/api/quotations'
import { BusinessUser, usersAPI } from '@/lib/api/users'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Product, productsAPI } from '@/lib/api/inventory'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, FileText, User, Calendar, Tag, Percent, Receipt, List, Activity, Users, UserPlus, PackagePlus } from 'lucide-react'
import { EditableTaxSelect } from '@/components/dashboard/editable-tax-select'
import { CreateCustomerModal } from '@/components/dashboard/create-customer-modal'
import { CreateProductModal } from '@/components/dashboard/create-product-modal'
import { toast } from 'sonner'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { Warehouse, warehousesAPI } from '@/lib/api/warehouses'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ShoppingBagIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

import { CurrencySelect } from '@/components/dashboard/currency-select'
import { getCurrencySymbol } from '@/lib/currencies'

interface QuotationFormProps {
  businessId: string
  title: string
  description: string
  submitLabel: string
  initialData?: Partial<CreateQuotationData & UpdateQuotationData>
  mode?: 'create' | 'edit'
  onSubmit: (data: CreateQuotationData | UpdateQuotationData) => Promise<void>
}

const defaultItems: QuotationItemInput[] = [{
  productId: '',
  itemName: '',
  description: '',
  itemType: 'GOODS',
  hsnSacCode: '',
  quantity: 1,
  price: 0,
  taxPercent: 0
}]

export function QuotationForm({
  businessId,
  title,
  description,
  submitLabel,
  initialData,
  mode = 'create',
  onSubmit,
}: QuotationFormProps) {
  const [customers, setCustomers] = React.useState<Customer[]>([])
  const [deals, setDeals] = React.useState<Deal[]>([])
  const [users, setUsers] = React.useState<BusinessUser[]>([])
  const [submitting, setSubmitting] = React.useState(false)
  const [showCreateCustomer, setShowCreateCustomer] = React.useState(false)
  const [showCreateProduct, setShowCreateProduct] = React.useState<{ show: boolean, index: number | null }>({ show: false, index: null })

  const [formData, setFormData] = React.useState({
    title: initialData?.title || '',
    customerId: initialData?.customerId || '',
    dealId: initialData?.dealId || '',
    assignedToId: initialData?.assignedToId || '',
    tax: initialData?.tax !== undefined ? initialData.tax : '',
    discount: initialData?.discount !== undefined ? initialData.discount : '',
    issueDate: initialData?.issueDate || new Date().toISOString().slice(0, 10),
    expiryDate: initialData?.expiryDate || '',
    notes: initialData?.notes || '',
    status: (initialData?.status || 'DRAFT') as (typeof QUOTATION_STATUS)[number],
    items: initialData?.items || defaultItems,
    gstTreatment: initialData?.gstTreatment || 'SAME_STATE',
    currency: (initialData as any)?.currency || '',
  })

  const { business } = useBusinessData()
  const [products, setProducts] = React.useState<Product[]>([])
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([])
  
  const selectedCustomer = customers.find(c => c.id === formData.customerId)
  const customerCountryName = (selectedCustomer?.country || selectedCustomer?.region || '').trim().toUpperCase()
  const isCustomerSelected = !!selectedCustomer
  const isIndia = customerCountryName === 'INDIA'
  const isUAE = customerCountryName === 'UAE' || customerCountryName === 'UNITED ARAB EMIRATES'
  const hasNoRegion = isCustomerSelected && !customerCountryName

  const taxLabel = isIndia ? 'GST %' : isUAE ? 'VAT %' : 'Tax %'

  const taxType = isIndia ? 'GST' : isUAE ? 'VAT' : 'TAX'
  const isBasic = business?.businessType === 'Basic'

  const hasGoodsItem = formData.items.some(
    (item) => item.itemType === 'GOODS' || products.find((p) => p.id === item.productId)?.type === 'GOODS'
  )


  let gridColsClass = ''
  if (isBasic) {
    gridColsClass = 'lg:grid-cols-[2fr_2fr_1fr_1.5fr_1.5fr_auto] [&>*]:min-w-0'
  } else {
    if (isIndia && formData.gstTreatment === 'SAME_STATE') {
      gridColsClass = 'lg:grid-cols-[1.2fr_1.2fr_0.8fr_0.8fr_0.7fr_1.2fr_0.8fr_0.8fr_1.5fr_auto] [&>*]:min-w-0'
    } else {
      gridColsClass = 'lg:grid-cols-[1.2fr_1.5fr_0.8fr_0.8fr_0.7fr_1.2fr_1fr_1.5fr_auto] [&>*]:min-w-0'
    }
  }

  // Auto-detect GST Treatment when customer changes
  React.useEffect(() => {
    if (isIndia && selectedCustomer && business) {
      const custState = (selectedCustomer.state || '').trim().toLowerCase()
      const bizState = (business.state || '').trim().toLowerCase()
      if (custState && bizState && custState !== bizState) {
        setFormData(prev => ({ ...prev, gstTreatment: 'DIFFERENT_STATE' }))
      } else {
        setFormData(prev => ({ ...prev, gstTreatment: 'SAME_STATE' }))
      }
    }
  }, [formData.customerId, isIndia, selectedCustomer, business])

  // Auto-detect Currency when customer changes
  React.useEffect(() => {
    if (selectedCustomer) {
      const custCurrency = selectedCustomer.currency
      if (custCurrency && custCurrency !== 'SYSTEM') {
        setFormData(prev => ({ ...prev, currency: custCurrency }))
      } else if (business?.currency) {
        setFormData(prev => ({ ...prev, currency: business.currency }))
      }
    } else if (business?.currency && !formData.currency) {
      setFormData(prev => ({ ...prev, currency: business.currency }))
    }
  }, [formData.customerId, selectedCustomer, business])

  const displayCurrency = formData.currency || business?.currency || 'INR'
  const currencySymbol = getCurrencySymbol(displayCurrency)

  React.useEffect(() => {
    if (isBasic && mode === 'create' && formData.items.length === 1 && formData.items[0].price === 0 && !formData.items[0].productId && !formData.items[0].itemName) {
      setFormData(prev => ({
        ...prev,
        items: [{ ...prev.items[0], quantity: 1, price: 1 }]
      }))
    }
  }, [isBasic, mode])


  React.useEffect(() => {
    const load = async () => {
      const [customerRes, dealRes, userRes, productRes, warehouseRes] = await Promise.allSettled([
        contactsAPI.getCustomers(businessId),
        dealsAPI.getDeals(businessId),
        usersAPI.getBusinessUsers(businessId),
        productsAPI.getAll(businessId),
        warehousesAPI.getAll(businessId)
      ])

      if (customerRes.status === 'fulfilled') setCustomers(customerRes.value.customers || [])
      if (dealRes.status === 'fulfilled') setDeals(dealRes.value.deals || [])
      if (userRes.status === 'fulfilled') setUsers(Array.isArray(userRes.value.data) ? userRes.value.data : [])
      if (productRes.status === 'fulfilled') {
        const pData = (productRes.value as any).products || (productRes.value as any).data || []
        setProducts(pData)
      }
      if (warehouseRes.status === 'fulfilled') {
        setWarehouses(warehouseRes.value.warehouses || [])
      }
    }

    load().catch(() => {
      toast.error('Failed to load quotation lookups')
    })
  }, [businessId])

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { 
        productId: '', 
        itemName: '', 
        description: '', 
        quantity: 1, 
        price: isBasic ? 1 : 0, 
        taxPercent: 0, 
        itemType: 'GOODS', 
        hsnSacCode: '' 
      }],
    }))
  }

  const updateItem = (index: number, field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index
          ? {
            ...item,
            [field]: field === 'description' || field === 'itemName' || field === 'itemType' || field === 'hsnSacCode' || field === 'productId' ? String(value) : Number(value),
          }
          : item,
      ),
    }))
  }

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) {
      updateItem(index, 'productId', '')
      return
    }
    const stockLevels: any[] = (product as any).stockDetails || product.stockLevels || []
    const defaultWarehouseId = stockLevels.find(s => Number(s.quantity) > 0)?.warehouseId || stockLevels[0]?.warehouseId || ''
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? {
        ...item,
        productId,
        warehouseId: defaultWarehouseId,
        description: product.name,
        price: product.price ?? product.sellingPrice ?? 0,
        taxPercent: product.taxPercent ?? product.taxRate ?? 0,
        hsnSacCode: product.taxCode || '',
        itemType: product.type ?? (product.brandId ? 'GOODS' : 'SERVICE')
      } : item)
    }))
  }

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.length === 1 ? prev.items : prev.items.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const items = formData.items.filter((item) => (item.description.trim() || (item.itemName && item.itemName.trim())) && item.quantity > 0)
    if (!formData.customerId || items.length === 0) {
      toast.error('Customer and at least one valid item are required')
      return
    }

    const processedItems = items.map(item => {
      const taxP = item.taxPercent || 0
      let cgst = 0, sgst = 0, igst = 0
      if (isIndia) {
        if (formData.gstTreatment === 'DIFFERENT_STATE') {
          igst = taxP
        } else {
          cgst = taxP / 2
          sgst = taxP / 2
        }
      }
      return { 
        ...item, 
        productId: item.productId || undefined,
        cgstPercent: cgst, 
        sgstPercent: sgst, 
        igstPercent: igst 
      }
    })

    setSubmitting(true)
    try {
      if (mode === 'create') {
        await onSubmit({
          title: formData.title || undefined,
          customerId: formData.customerId,
          dealId: formData.dealId || undefined,
          assignedToId: formData.assignedToId || undefined,
          items: processedItems,
          tax: Number(formData.tax || 0),
          discount: Number(formData.discount || 0),
          taxType,
          gstTreatment: isIndia ? formData.gstTreatment : undefined,
          issueDate: formData.issueDate,
          expiryDate: formData.expiryDate || undefined,
          notes: formData.notes || undefined,
          currency: displayCurrency,
        } as any)
      } else {
        await onSubmit({
          title: formData.title || undefined,
          customerId: formData.customerId || undefined,
          dealId: formData.dealId || undefined,
          assignedToId: formData.assignedToId || undefined,
          items: processedItems,
          tax: Number(formData.tax || 0),
          discount: Number(formData.discount || 0),
          taxType,
          gstTreatment: isIndia ? formData.gstTreatment : undefined,
          issueDate: formData.issueDate || undefined,
          expiryDate: formData.expiryDate || undefined,
          notes: formData.notes || undefined,
          status: formData.status,
          currency: displayCurrency,
        } as any)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save quotation')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="max-w-5xl rounded-2xl border-border shadow-sm bg-card overflow-hidden">
      <CardHeader className="border-b border-border bg-muted/50 pb-6 pt-6 px-6 sm:px-8">
        <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1 font-medium">{description}</p>
      </CardHeader>
      <CardContent className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-10">

          {/* General Information Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <User className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">General Information</h3>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Quotation Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Website Revamp Quote"
                  className="h-11 rounded-xl border-border bg-muted/50 focus:bg-card transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer" className="text-muted-foreground font-semibold text-xs uppercase tracking-wider flex items-center gap-1">
                  Customer <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={formData.customerId}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, customerId: value }))}
                >
                  <SelectTrigger id="customer" className="h-11 rounded-xl border-border bg-muted/50 focus:bg-card transition-colors">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border shadow-lg">
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id} className="rounded-lg cursor-pointer">
                        {customer.company || customer.name || customer.email || customer.id}
                      </SelectItem>
                    ))}
                    <div className="border-t border-border mt-1 pt-1">
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); setShowCreateCustomer(true) }}
                        className="flex w-full items-center gap-2 px-2 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded cursor-pointer transition-colors"
                      >
                        <UserPlus className="h-4 w-4" />
                        + Create Customer
                      </button>
                    </div>
                  </SelectContent>
                </Select>
                {hasNoRegion && (
                  <Alert variant="destructive" className="mt-2 py-2 px-3 bg-rose-50 border-rose-200">
                    <AlertCircle className="h-4 w-4 text-rose-600" />
                    <AlertDescription className="text-xs text-rose-700 ml-2">
                      No region set for this customer — please update customer profile for accurate tax.
                    </AlertDescription>
                  </Alert>
                )}
                {isIndia && (
                  <div className="mt-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
                    <Label className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">GST Treatment</Label>
                    <Select
                      value={formData.gstTreatment}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, gstTreatment: value }))}
                    >
                      <SelectTrigger className="h-10 bg-card border-border text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAME_STATE">Same State (CGST + SGST)</SelectItem>
                        <SelectItem value="DIFFERENT_STATE">Different State (IGST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-muted-foreground font-semibold text-xs uppercase tracking-wider flex items-center gap-1">
                  Currency <span className="text-rose-500">*</span>
                </Label>
                <CurrencySelect
                  value={formData.currency}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, currency: val }))}
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {!isBasic && (
                <div className="space-y-2">
                  <Label htmlFor="deal" className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Linked Deal</Label>
                  <Select
                    value={formData.dealId || 'none'}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, dealId: value === 'none' ? '' : value }))
                    }
                  >
                    <SelectTrigger id="deal" className="h-11 rounded-xl border-border bg-muted/50 focus:bg-card transition-colors">
                      <SelectValue placeholder="Select deal" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border shadow-lg">
                      <SelectItem value="none" className="rounded-lg cursor-pointer">No deal</SelectItem>
                      {deals.map((deal) => (
                        <SelectItem key={deal.id} value={deal.id} className="rounded-lg cursor-pointer">
                          {deal.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="assigned" className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Assigned Representative</Label>
                <Select
                  value={formData.assignedToId || 'none'}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, assignedToId: value === 'none' ? '' : value }))
                  }
                >
                  <SelectTrigger id="assigned" className="h-11 rounded-xl border-border bg-muted/50 focus:bg-card transition-colors">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border shadow-lg">
                    <SelectItem value="none" className="rounded-lg cursor-pointer">Unassigned</SelectItem>
                    {users.map((member) => (
                      <SelectItem key={member.id} value={member.id} className="rounded-lg cursor-pointer">
                        {member.user?.name || member.user?.email || member.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="issueDate" className="text-muted-foreground font-semibold text-xs uppercase tracking-wider flex items-center gap-1">
                  Issue Date <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="issueDate"
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, issueDate: e.target.value }))}
                    required
                    className="h-11 rounded-xl border-border bg-muted/50 focus:bg-card transition-colors pl-10"
                  />
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate" className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Expiry Date</Label>
                <div className="relative">
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))}
                    className="h-11 rounded-xl border-border bg-muted/50 focus:bg-card transition-colors pl-10"
                  />
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                </div>
              </div>
            </div>

            {mode === 'edit' ? (
              <div className="space-y-2">
                <Label htmlFor="status" className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Quotation Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: (typeof QUOTATION_STATUS)[number]) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger id="status" className="h-11 rounded-xl border-border bg-muted/50 focus:bg-card transition-colors">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border shadow-lg">
                    {QUOTATION_STATUS.map((status) => (
                      <SelectItem key={status} value={status} className="rounded-lg cursor-pointer">
                        <div className="flex items-center gap-2 font-medium">
                          <Activity className="h-4 w-4 text-slate-400" />
                          {status}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>

{/* Line Items Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ShoppingBagIcon className="h-5 w-5 text-primary" />
                Line Items *
              </h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2 cursor-pointer border-primary text-primary hover:bg-primary/5">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>

            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <Table className="min-w-[1200px] table-fixed">
                  <TableHeader className="bg-muted/80 border-b border-border">
                    <TableRow className="hover:bg-background border-none text-muted-foreground">
                      <TableHead className="w-[180px] text-[11px] font-bold uppercase">{isBasic ? 'Item Name' : 'Product'}</TableHead>
                      <TableHead className="w-[200px] text-[11px] font-bold uppercase">Description</TableHead>
                      {!isBasic && hasGoodsItem && <TableHead className="w-[130px] text-[11px] font-bold uppercase">Warehouse</TableHead>}
                      {!isBasic && <TableHead className="w-[100px] text-[11px] font-bold uppercase">{formData.items.length > 0 && formData.items[0].itemType === 'SERVICE' ? 'SAC' : 'HSN'}</TableHead>}
                      {!isBasic && hasGoodsItem && <TableHead className="w-[80px] text-[11px] font-bold uppercase text-center">Stock</TableHead>}
                      <TableHead className="w-[80px] text-[11px] font-bold uppercase text-center">
                        {formData.items.length > 0 ? (
                          formData.items[0].itemType === 'SERVICE' ? 'HRS' :
                          ['kg', 'gram', 'meter', 'litre'].includes((formData.items[0].unit || '').toLowerCase()) ? formData.items[0].unit?.toUpperCase() : 'QTY'
                        ) : 'QTY'}
                      </TableHead>
                      {!isBasic && <TableHead className="w-[90px] text-[11px] font-bold uppercase">Unit</TableHead>}
                      <TableHead className="w-[110px] text-[11px] font-bold uppercase text-right">Rate</TableHead>
                      {(!isIndia && !isUAE) ? (
                        <TableHead className="w-[80px] text-[11px] font-bold uppercase text-right">{taxLabel}</TableHead>
                      ) : isIndia ? (
                        (formData.gstTreatment === 'SAME_STATE') ? (
                          <>
                            <TableHead className="w-[80px] text-[11px] font-bold uppercase text-right">CGST%</TableHead>
                            <TableHead className="w-[80px] text-[11px] font-bold uppercase text-right">SGST%</TableHead>
                          </>
                        ) : (
                          <TableHead className="w-[80px] text-[11px] font-bold uppercase text-right">IGST%</TableHead>
                        )
                      ) : (
                        <TableHead className="w-[80px] text-[11px] font-bold uppercase text-right">VAT%</TableHead>
                      )}
                      <TableHead className="w-[120px] text-[11px] font-bold uppercase text-right">Total</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.items.map((item, index) => {
                      const product = products.find(p => p.id === item.productId)
                      const isService = product?.type === 'SERVICE' || item.itemType === 'SERVICE'
                      const warehouseStock = ((product as any)?.stockDetails || product?.stockLevels)?.find((s: any) => s.warehouseId === item.warehouseId)

                      const qty = Number(warehouseStock?.quantity || 0)
                      const res = Number(warehouseStock?.reservedQty || 0)
                      const available = isService ? Infinity : Math.max(0, qty - res)

                      const isLowStock = !isService && available < Number(product?.reorderLevel || 0)
                      const isOutOfStock = !isService && available <= 0

                      const lineAmount = Number(item.quantity || 0) * Number(item.price || 0)
                      let lineTax = 0
                      if (isIndia) {
                        lineTax = (formData.gstTreatment === 'SAME_STATE')
                          ? (lineAmount * (Number(item.cgstPercent || 0) + Number(item.sgstPercent || 0)) / 100)
                          : (lineAmount * Number(item.igstPercent || 0) / 100)
                      } else {
                        const vatRate = Number(item.taxPercent || 0)
                        if (false) {
                          const lineSub = lineAmount / (1 + vatRate / 100)
                          lineTax = lineAmount - lineSub
                        } else {
                          lineTax = lineAmount * (vatRate / 100)
                        }
                      }

                      const totalLineAmount = false ? lineAmount : (lineAmount + lineTax)

                      return (
                        <TableRow key={index} className="group hover:bg-muted/50 border-b border-border last:border-none">
                          <TableCell className="py-3 px-2">
                            {isBasic ? (
                              <Input 
                                value={item.itemName || ''} 
                                placeholder="Item Name"
                                className="h-8 text-xs bg-background px-2"
                                onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                              />
                            ) : (
                              <Select value={item.productId || 'none'} onValueChange={v => handleProductSelect(index, v === 'none' ? '' : v)}>
                                <SelectTrigger className="h-8 w-full bg-background text-xs px-2"><SelectValue placeholder="Product" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">— Custom Item —</SelectItem>
                                  {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                  <div className="border-t border-border mt-1 pt-1">
                                    <button type="button" onMouseDown={(e) => { e.preventDefault(); setShowCreateProduct({ show: true, index }) }} className="flex w-full items-center gap-2 px-2 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer transition-colors">
                                      <PackagePlus className="h-4 w-4" />+ Create Product
                                    </button>
                                  </div>
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>

                          <TableCell className="py-3 px-2">
                            <Input
                              value={item.description}
                              placeholder="Item name"
                              className="h-8 text-xs bg-background px-2"
                              onChange={(e) => updateItem(index, 'description', e.target.value)}
                            />
                          </TableCell>

                          {!isBasic && hasGoodsItem && (
                            <TableCell className="py-3 px-2">
                              {!isService ? (
                                <Select
                                  value={item.warehouseId}
                                  onValueChange={(val) => updateItem(index, 'warehouseId', val)}
                                >
                                  <SelectTrigger className="h-8 w-full bg-background text-xs px-2">
                                    <SelectValue placeholder="WH" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <div className="h-8 flex items-center justify-center text-muted-foreground">—</div>
                              )}
                            </TableCell>
                          )}

                          {!isBasic && (
                            <TableCell className="py-3 px-2">
                              <div className="relative">
                                <Input
                                  value={item.hsnSacCode || ''}
                                  placeholder=""
                                  className="h-8 text-xs font-mono bg-background"
                                  onChange={(e) => updateItem(index, 'hsnSacCode', e.target.value)}
                                />
                              </div>
                            </TableCell>
                          )}

                          {!isBasic && hasGoodsItem && (
                            <TableCell className="py-3 px-2">
                              <div className="flex justify-center">
                                {item.productId && !isService ? (
                                  <Badge
                                    variant={isOutOfStock ? "destructive" : (isLowStock ? "secondary" : "default")}
                                    className={cn(
                                      "text-[9px] px-1 py-0 h-4 min-w-fit whitespace-nowrap",
                                      !isOutOfStock && !isLowStock && "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                                    )}
                                  >
                                    {available === Infinity ? '—' : available} {item.unit || 'pcs'}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-[10px]">—</span>
                                )}
                              </div>
                            </TableCell>
                          )}

                          <TableCell className="py-3 px-2">
                            <div className="relative">
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                className={cn(
                                  "h-8 text-xs bg-background pl-2 transition-colors",
                                  !isService && item.quantity > available && "border-red-500 focus-visible:ring-red-500 bg-red-50/30"
                                )}
                                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                              />
                              {item.productId && !isService && item.quantity > available && (
                                <p className="absolute -bottom-4 left-0 text-[9px] text-red-500 font-bold leading-none animate-pulse whitespace-nowrap">
                                  Insufficient Stock
                                </p>
                              )}
                            </div>
                          </TableCell>

                          {!isBasic && (
                            <TableCell className="py-3 px-2">
                              <Select value={item.unit || 'pcs'} onValueChange={v => updateItem(index, 'unit', v)}>
                                <SelectTrigger className="h-8 w-full bg-background text-xs px-2"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {['pcs', 'kg', 'ltr', 'm', 'box', 'set', 'hr', 'day'].map(u => (
                                    <SelectItem key={u} value={u}>{u}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          )}

                          <TableCell className="py-3 px-2 text-right">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.price}
                              className="h-8 text-xs text-right bg-background px-2"
                              onChange={(e) => updateItem(index, 'price', e.target.value)}
                            />
                          </TableCell>

                          {(!isIndia && !isUAE) ? (
                            <TableCell className="py-3 px-2 text-right">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.taxPercent ?? 0}
                                className="h-8 text-xs text-right bg-background px-2"
                                onChange={(e) => updateItem(index, 'taxPercent', e.target.value)}
                              />
                            </TableCell>
                          ) : isIndia ? (
                            (formData.gstTreatment === 'SAME_STATE') ? (
                              <>
                                <TableCell className="py-3 px-2 text-right">
                                  <EditableTaxSelect
                                    value={item.cgstPercent ?? 0}
                                    onChange={(val) => {
                                      updateItem(index, 'cgstPercent', val)
                                      updateItem(index, 'sgstPercent', val)
                                      updateItem(index, 'taxPercent', Number(val) * 2)
                                    }}
                                    options={[0, 2.5, 6, 7.5, 9, 14]}
                                    size="sm"
                                  />
                                </TableCell>
                                <TableCell className="py-3 px-2 text-right">
                                  <EditableTaxSelect
                                    value={item.sgstPercent ?? 0}
                                    onChange={(val) => {
                                      updateItem(index, 'sgstPercent', val)
                                      updateItem(index, 'cgstPercent', val)
                                      updateItem(index, 'taxPercent', Number(val) * 2)
                                    }}
                                    options={[0, 2.5, 6, 7.5, 9, 14]}
                                    size="sm"
                                  />
                                </TableCell>
                              </>
                            ) : (
                              <TableCell className="py-3 px-2 text-right">
                                <EditableTaxSelect
                                  value={item.igstPercent ?? 0}
                                  onChange={(val) => {
                                    updateItem(index, 'igstPercent', val)
                                    updateItem(index, 'taxPercent', val)
                                  }}
                                  options={[0, 5, 12, 18, 28]}
                                  size="sm"
                                />
                              </TableCell>
                            )
                          ) : (
                            <TableCell className="py-3 px-2 text-right">
                              <EditableTaxSelect
                                value={item.taxPercent ?? 0}
                                onChange={(val) => updateItem(index, 'taxPercent', val)}
                                options={[0, 5, 12, 15, 18, 28]}
                                size="sm"
                              />
                            </TableCell>
                          )}

                          <TableCell className="py-3 px-2 text-right">
                            <div className="h-8 flex items-center justify-end px-2 rounded-md bg-muted/30 text-xs font-bold">
                              {totalLineAmount.toFixed(2)}
                            </div>
                          </TableCell>

                          <TableCell className="py-3 px-2 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors"
                              onClick={() => removeItem(index)}
                              disabled={formData.items.length === 1}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Pricing Adjustments Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <Receipt className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Pricing Adjustments</h3>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tax" className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                  Overall {isIndia ? (formData.gstTreatment === 'SAME_STATE' ? 'CGST + SGST' : 'IGST') : taxLabel} (Additional)
                </Label>
                <EditableTaxSelect
                  value={formData.tax === 0 ? '' : (formData.tax ?? '')}
                  onChange={(val) => setFormData((prev) => ({ ...prev, tax: val === '' ? 0 : val }))}
                  options={[0, 5, 12, 15, 18, 28]}
                  size="default"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount" className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Discount (Amount)</Label>
                <div className="relative">
                  <Input
                    id="discount"
                    type="number"
                    step="0.01"
                    value={formData.discount === 0 ? '' : formData.discount}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, discount: e.target.value === '' ? 0 : Number(e.target.value) }))
                    }
                    className="h-11 rounded-xl border-border bg-muted/50 focus:bg-card transition-colors pl-10"
                  />
                  <Tag className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Notes Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <FileText className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Additional Notes</h3>
            </div>

            <div className="space-y-2">
              <Textarea
                id="notes"
                rows={5}
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Add terms & conditions, payment details, or any other notes for the customer..."
                className="rounded-xl border-border bg-muted/50 focus:bg-card transition-colors resize-y text-sm p-4"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <Button
              type="submit"
              onClick={() => {
                // Ensure empty strings are converted to 0 for submission
                if (formData.tax === '') setFormData(p => ({ ...p, tax: 0 }))
                if (formData.discount === '') setFormData(p => ({ ...p, discount: 0 }))
              }}
              disabled={submitting}
              className="h-12 px-8 rounded-xl cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-md font-semibold text-base transition-all"
            >
              {submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
      <CreateCustomerModal
        open={showCreateCustomer}
        onClose={() => setShowCreateCustomer(false)}
        businessId={businessId}
        onCreated={(newCust) => {
          setCustomers((prev) => [...prev, newCust])
          setFormData((prev) => ({
            ...prev,
            customerId: newCust.id,
          }))
        }}
      />
      <CreateProductModal
        open={showCreateProduct.show}
        onClose={() => setShowCreateProduct({ show: false, index: null })}
        businessId={businessId}
        onCreated={(newProd) => {
          setProducts(prev => [...prev, newProd])
          if (showCreateProduct.index !== null) {
            handleProductSelect(showCreateProduct.index, newProd.id)
          }
        }}
      />
    </Card>
  )
}
