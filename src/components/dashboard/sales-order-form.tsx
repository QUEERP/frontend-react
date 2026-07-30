import * as React from 'react'
import { contactsAPI, Customer } from '@/lib/api/contacts'
import { Deal, dealsAPI } from '@/lib/api/deals'
import {
  QUOTATION_STATUS,
  Quotation,
  quotationsAPI,
} from '@/lib/api/quotations'
import {
  CreateSalesOrderData,
  SALES_ORDER_STATUS,
  SalesOrderItemInput,
  UpdateSalesOrderData,
  salesOrdersAPI,
} from '@/lib/api/sales-orders'
import { BusinessUser, usersAPI } from '@/lib/api/users'
import { Product, productsAPI } from '@/lib/api/inventory'
import { Warehouse, warehousesAPI } from '@/lib/api/warehouses'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, ShoppingBag as ShoppingBagIcon, Save as SaveIcon, MapPin, UserPlus, PackagePlus, Loader2 } from 'lucide-react'
import { CreateCustomerModal } from '@/components/dashboard/create-customer-modal'
import { CreateProductModal } from '@/components/dashboard/create-product-modal'
import { toast } from 'sonner'
import { EditableTaxSelect } from '@/components/dashboard/editable-tax-select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useBusinessData } from './business-data-provider'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { CurrencySelect } from '@/components/dashboard/currency-select'
import { getCurrencySymbol } from '@/lib/currencies'

interface SalesOrderFormProps {
  businessId: string
  title: string
  description: string
  submitLabel: string
  initialData?: Partial<CreateSalesOrderData & UpdateSalesOrderData>
  mode?: 'create' | 'edit'
  onSubmit: (data: CreateSalesOrderData | UpdateSalesOrderData) => Promise<void>
}

export function SalesOrderForm({
  businessId,
  title,
  description,
  submitLabel,
  initialData,
  mode = 'create',
  onSubmit,
}: SalesOrderFormProps) {
  const { currency = 'AED' } = useBusinessData()
  const [customers, setCustomers] = React.useState<Customer[]>([])
  const [deals, setDeals] = React.useState<Deal[]>([])
  const [selectedSOId, setSelectedSOId] = React.useState<string>('')
  const [salesOrders, setSalesOrders] = React.useState<any[]>([])

  const [quotations, setQuotations] = React.useState<Quotation[]>([])
  const [users, setUsers] = React.useState<BusinessUser[]>([])
  const [products, setProducts] = React.useState<Product[]>([])
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([])
  const [submitting, setSubmitting] = React.useState(false)
  const [showCreateCustomer, setShowCreateCustomer] = React.useState(false)
  const [showCreateProduct, setShowCreateProduct] = React.useState(false)
  const [fetchingQuotation, setFetchingQuotation] = React.useState(false)
  const [confirmReplaceOpen, setConfirmReplaceOpen] = React.useState(false)
  const [pendingQuotationId, setPendingQuotationId] = React.useState<string>('')

  const [items, setItems] = React.useState<any[]>(() => {
    const initialItems = Array.isArray(initialData?.items) ? initialData.items : []
    if (initialItems.length > 0) {
      return initialItems.map(it => ({
        id: Math.random().toString(36).substr(2, 9),
        productId: it.productId || '',
        warehouseId: it.warehouseId || '',
        description: it.description || '',
        itemType: it.itemType || 'GOODS',
        hsnSacCode: it.hsnSacCode || '',
        quantity: it.quantity || 1,
        price: it.price || 0,
        taxPercent: it.taxPercent || 0,
        cgstPercent: it.cgstPercent || ((it.taxPercent || 0) / 2) || 0,
        sgstPercent: it.sgstPercent || ((it.taxPercent || 0) / 2) || 0,
        igstPercent: it.igstPercent || it.taxPercent || 0,
        unit: it.unit || 'pcs',
      }))
    }
    return [{
      id: '1',
      productId: '',
      warehouseId: '',
      description: '',
      itemType: 'GOODS',
      hsnSacCode: '',
      quantity: 1,
      price: 0,
      taxPercent: 0,
      cgstPercent: 0,
      sgstPercent: 0,
      igstPercent: 0,
      unit: 'pcs',
    }]
  })

  const [formData, setFormData] = React.useState({
    customerId: initialData?.customerId || '',
    quotationId: initialData?.quotationId || '',
    dealId: initialData?.dealId || '',
    assignedToId: initialData?.assignedToId || '',
    tax: initialData?.tax || 0,
    discount: initialData?.discount || 0,
    shippingCharges: (initialData as any)?.shippingCharges || 0,
    orderDate: typeof initialData?.orderDate === 'string' ? initialData.orderDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    deliveryDate: typeof initialData?.deliveryDate === 'string' ? initialData.deliveryDate.slice(0, 10) : '',
    notes: initialData?.notes || '',
    termsConditions: (initialData as any)?.termsConditions || '',
    status: (initialData?.status || 'Draft') as (typeof SALES_ORDER_STATUS)[number],
    currency: (initialData as any)?.currency || '',
    customerReference: (initialData as any)?.customerReference || '',
    shippingMethod: (initialData as any)?.shippingMethod || '',
    paymentTerms: (initialData as any)?.paymentTerms || '',
    deliveryInstructions: (initialData as any)?.deliveryInstructions || '',
    placeOfSupply: (initialData as any)?.placeOfSupply || '',
    // Tax fields
    cgst: (initialData as any)?.cgst || 0,
    sgst: (initialData as any)?.sgst || 0,
    igst: (initialData as any)?.igst || 0,
    tds: (initialData as any)?.tds || 0,
    ewayBillNo: (initialData as any)?.ewayBillNo || '',
    reverseCharge: (initialData as any)?.reverseCharge || false,
    transportDetails: (initialData as any)?.transportDetails || '',
    vatPercentage: (initialData as any)?.vatPercentage || 0,
    vatAmount: (initialData as any)?.vatAmount || 0,
    vatType: ((initialData as any)?.vatType || 'exclusive') as 'exclusive' | 'inclusive',
    taxType: (initialData as any)?.taxType || '' as 'GST' | 'IGST' | 'VAT' | '',
    emirate: (initialData as any)?.emirate || '',
    country: (initialData as any)?.country || '',
    state: (initialData as any)?.state || '',
  })

  const { business } = useBusinessData()
  const isConstruction = (business as any)?.businessType === 'Construction'

  // Auto-calculate summary
  const summary = React.useMemo(() => {
    const customer = customers.find(c => c.id === formData.customerId)
    
    // NEW ARCHITECTURE: Business Country is the source of truth
    const businessCountry = (business as any)?.country || 'UAE'
    const customerCountryName = (customer?.country || customer?.region || '').trim().toUpperCase()
    
    // Check if a customer is selected AND their country is known to be NOT India and NOT UAE
    const isCustomerSelected = !!customer
    const isOtherCountry = isCustomerSelected && customerCountryName !== '' && customerCountryName !== 'INDIA' && customerCountryName !== 'UAE' && customerCountryName !== 'UNITED ARAB EMIRATES'

    const isIndia = isOtherCountry ? false : (businessCountry === 'INDIA')
    const isUAE = isOtherCountry ? false : (businessCountry === 'UAE')
    
    const getTaxLabel = (c: string) => {
      const cUp = c.toUpperCase()
      if (['AUSTRALIA', 'CANADA', 'NEW ZEALAND', 'SINGAPORE', 'MALAYSIA'].includes(cUp)) return 'GST %'
      if (['UNITED STATES', 'USA', 'US'].includes(cUp)) return 'Sales Tax %'
      if (['UNITED KINGDOM', 'UK', 'SOUTH AFRICA'].includes(cUp)) return 'VAT %'
      return 'Tax %'
    }
    
    const customerCountry = customerCountryName

    const companyState = (business as any)?.state?.trim().toUpperCase() || ''
    const customerState = (customer?.billingState || customer?.state || '').trim().toUpperCase() || ''

    // Use manual taxType if set, otherwise infer
    let currentTaxType = formData.taxType
    if (!currentTaxType) {
      if (isIndia) {
        if (customerCountry !== 'INDIA' && customerCountry !== '') {
          currentTaxType = 'IGST' // Export
        } else {
          currentTaxType = (companyState === customerState && companyState !== '') ? 'GST' : 'IGST'
        }
      } else if (isUAE) {
        currentTaxType = 'VAT'
      }
    }

    const isIntrastate = currentTaxType === 'GST'
    const isIGST = currentTaxType === 'IGST'
    const isVAT = currentTaxType === 'VAT'

    let subtotal = 0
    let taxTotal = 0
    let cgst = 0
    let sgst = 0
    let igst = 0
    let vat = 0

    items.forEach(item => {
      const lineAmount = Number(item.quantity || 0) * Number(item.price || 0)
      let lineTax = 0

      if (isIndia) {
        if (customerCountry !== 'INDIA' && customerCountry !== '') {
           // Export
           const lineIgst = (lineAmount * Number(item.igstPercent || 0)) / 100
           igst += lineIgst
           lineTax = lineIgst
        } else {
           if (isIntrastate) {
             const lineCgst = (lineAmount * Number(item.cgstPercent || 0)) / 100
             const lineSgst = (lineAmount * Number(item.sgstPercent || 0)) / 100
             cgst += lineCgst
             sgst += lineSgst
             lineTax = lineCgst + lineSgst
           } else if (isIGST) {
             const lineIgst = (lineAmount * Number(item.igstPercent || 0)) / 100
             igst += lineIgst
             lineTax = lineIgst
           }
        }
      } else if (isUAE || isVAT) {
        if (customerCountry !== 'UAE' && customerCountry !== 'UNITED ARAB EMIRATES' && customerCountry !== '') {
           lineTax = 0 // Export from UAE
        } else {
           const vatRate = Number(item.taxPercent || 5)
           if (formData.vatType === 'inclusive') {
             const lineSub = lineAmount / (1 + vatRate / 100)
             const lineVat = lineAmount - lineSub
             vat += lineVat
             subtotal += lineSub
             lineTax = lineVat
             return
           } else {
             const lineVat = (lineAmount * vatRate) / 100
             vat += lineVat
             lineTax = lineVat
           }
        }
      } else {
        const lineVat = (lineAmount * Number(item.taxPercent || 0)) / 100
        vat += lineVat
        lineTax = lineVat
      }

      subtotal += lineAmount
      taxTotal += lineTax
    })

    const grandTotal = subtotal + taxTotal + Number(formData.shippingCharges || 0) - Number(formData.discount || 0) - Number(formData.tds || 0)

    return {
      subtotal,
      taxTotal,
      total: grandTotal,
      isIndia,
      isUAE,
      isOtherCountry,
      customerCountryName,
      taxLabel: getTaxLabel(customerCountryName),
      taxType: currentTaxType,
      isIntrastate,
      isIGST,
      isVAT,
      cgst,
      sgst,
      igst,
      vat,
      tds: Number(formData.tds || 0)
    }
  }, [items, formData.discount, formData.shippingCharges, formData.customerId, formData.tds, formData.vatType, formData.taxType, customers, business])

  const hasGoodsItem = React.useMemo(() => {
    if (items.length === 0) return true;
    return items.some(item => {
      if (!item.productId) return true;
      const p = products.find(p => p.id === item.productId);
      return p ? p.type !== 'SERVICE' : true;
    });
  }, [items, products]);

  React.useEffect(() => {
    const load = async () => {
      const [customerRes, dealRes, quotationRes, userRes, productRes, warehouseRes] = await Promise.allSettled([
        contactsAPI.getCustomers(businessId),
        dealsAPI.getDeals(businessId),
        quotationsAPI.getQuotations(businessId),
        usersAPI.getBusinessUsers(businessId),
        productsAPI.getAll(businessId),
        warehousesAPI.getWarehouses(businessId),
      ])

      if (customerRes.status === 'fulfilled') setCustomers(customerRes.value.customers || [])
      if (dealRes.status === 'fulfilled') setDeals(dealRes.value.deals || [])
      if (quotationRes.status === 'fulfilled') setQuotations(quotationRes.value.quotations || [])
      if (userRes.status === 'fulfilled') setUsers(Array.isArray(userRes.value.data) ? userRes.value.data : [])
      if (productRes.status === 'fulfilled') {
        const productData = (productRes.value as any).products || (productRes.value as any).data || []
        setProducts(productData)
      }
      if (warehouseRes.status === 'fulfilled') {
        const whs = warehouseRes.value.warehouses || []
        setWarehouses(whs)
        // Set default warehouse for items if not set
        if (whs.length > 0) {
          setItems(prev => prev.map(it => it.warehouseId ? it : { ...it, warehouseId: whs[0].id }))
        }
      }
    }

    load().catch(() => toast.error('Failed to load sales order lookups'))
  }, [businessId])

  const doFetchQuotation = React.useCallback(async (qId: string) => {
    if (!qId || qId === 'none') {
      setFormData(p => ({ ...p, quotationId: '' }))
      return
    }
    setFetchingQuotation(true)
    try {
      const res = await quotationsAPI.getQuotationById(businessId, qId)
      if (res.success && res.quotation) {
        const q = res.quotation
        setFormData(p => ({
          ...p,
          quotationId: qId,
          currency: (q as any).currency || p.currency,
          discount: (q as any).discount ?? p.discount,
          notes: q.notes || p.notes,
          termsConditions: (q as any).termsConditions || p.termsConditions,
          taxType: (q as any).taxType || p.taxType,
        }))
        if (q.items && q.items.length > 0) {
          setItems(q.items.map((it: any) => {
            const product = products.find(pr => pr.id === it.productId)
            return {
              id: Math.random().toString(36).substr(2, 9),
              productId: it.productId || '',
              warehouseId: warehouses[0]?.id || '',
              description: it.description || it.name || '',
              itemType: it.itemType || product?.type || 'GOODS',
              hsnSacCode: it.hsnSacCode || product?.taxCode || '',
              quantity: it.quantity || 1,
              price: it.price || it.rate || 0,
              taxPercent: it.taxPercent ?? product?.taxRate ?? 0,
              cgstPercent: it.cgstPercent ?? (it.taxPercent ?? product?.taxRate ?? 0) / 2,
              sgstPercent: it.sgstPercent ?? (it.taxPercent ?? product?.taxRate ?? 0) / 2,
              igstPercent: it.igstPercent ?? it.taxPercent ?? product?.taxRate ?? 0,
              unit: it.unit || product?.unit || 'pcs',
            }
          }))
          toast.success('Items & data imported from quotation')
        }
      }
    } catch (e) {
      toast.error('Failed to load quotation details')
    } finally {
      setFetchingQuotation(false)
    }
  }, [businessId, products, warehouses])

  const handleQuotationSelect = (qId: string) => {
    if (qId === 'none') {
      setFormData(p => ({ ...p, quotationId: '' }))
      return
    }
    // If items already exist from a previous selection, confirm before overwriting
    const hasItems = items.some(it => it.productId)
    if (hasItems && formData.quotationId && formData.quotationId !== qId) {
      setPendingQuotationId(qId)
      setConfirmReplaceOpen(true)
    } else {
      doFetchQuotation(qId)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const validItems = items.filter((item) => (item.productId || (item.itemName && item.itemName.trim()) || item.description.trim()) && item.quantity > 0)
    if (!formData.customerId || (mode === 'create' && validItems.length === 0)) {
      toast.error('Customer and at least one valid item are required')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        ...formData,
        items: validItems.map(it => ({
          productId: it.productId || undefined,
          itemName: it.itemName,
          warehouseId: it.warehouseId,
          description: it.description,
          itemType: it.itemType,
          hsnSacCode: it.hsnSacCode,
          quantity: Number(it.quantity),
          price: Number(it.price),
          taxPercent: summary.isIndia
            ? (summary.isIntrastate ? (Number(it.cgstPercent || 0) + Number(it.sgstPercent || 0)) : Number(it.igstPercent || 0))
            : it.taxPercent,
          cgstPercent: it.cgstPercent,
          sgstPercent: it.sgstPercent,
          igstPercent: it.igstPercent,
          unit: it.unit
        })),
        subtotal: summary.subtotal,
        tax: summary.taxTotal,
        discount: Number(formData.discount || 0),
        totalAmount: summary.total,
        cgst: summary.cgst,
        sgst: summary.sgst,
        igst: summary.igst,
        vatAmount: summary.vat,
      }

      if (mode === 'create') {
        await onSubmit(payload as CreateSalesOrderData)
      } else {
        await onSubmit(payload as UpdateSalesOrderData)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save sales order')
    } finally {
      setSubmitting(false)
    }
  }

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        productId: '',
        warehouseId: warehouses[0]?.id || '',
        description: '',
        itemType: 'GOODS',
        hsnSacCode: '',
        quantity: 1,
        price: 0,
        taxPercent: 0,
        cgstPercent: 0,
        sgstPercent: 0,
        igstPercent: 0,
        unit: 'pcs',
      },
    ])
  }

  const removeItem = (index: number) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  const updateItem = (index: number, field: string, value: any) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item

        let val = ['quantity', 'price', 'taxPercent', 'cgstPercent', 'sgstPercent', 'igstPercent'].includes(field) ? Number(value || 0) : value
        if (['quantity', 'price', 'taxPercent', 'cgstPercent', 'sgstPercent', 'igstPercent'].includes(field)) {
          if (isNaN(val as number)) {
            val = 0
          } else {
            val = Math.max(0, val as number)
          }
        }

        const updated = {
          ...item,
          [field]: val,
        }

        if (field === 'cgstPercent') {
          updated.sgstPercent = val
        } else if (field === 'sgstPercent') {
          updated.cgstPercent = val
        }

        return updated
      }),
    )
  }

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (!product) {
      updateItem(index, 'productId', '')
      return
    }

    // Safety check for product.unit which can be null, string, or object
    let unitName = 'pcs'
    if (product.unit) {
      unitName = typeof product.unit === 'object' ? (product.unit as any).name || (product.unit as any).abbreviation || 'pcs' : product.unit
    }

    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
            ...item,
            productId,
            description: product.name,
            price: product.price ?? product.sellingPrice ?? 0,
            taxPercent: product.taxPercent ?? product.taxRate ?? 0,
            cgstPercent: ((product.taxPercent ?? product.taxRate ?? 0) / 2),
            sgstPercent: ((product.taxPercent ?? product.taxRate ?? 0) / 2),
            igstPercent: product.taxPercent ?? product.taxRate ?? 0,
            hsnSacCode: product.taxCode || '',
            itemType: (product.type as any) || 'GOODS',
            unit: unitName,
          }
          : item,
      ),
    )
  }

  return (
    <TooltipProvider>
      <div className="max-w-5xl mx-auto w-full space-y-6">
        <Card className="rounded-2xl border border-border shadow-sm bg-card overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/50 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-foreground">{title}</CardTitle>
                <p className="text-sm text-muted-foreground font-medium mt-1">{description}</p>
              </div>
              <Badge variant="outline" className="h-7 px-3 bg-blue-50 text-blue-700 border-blue-200 font-semibold uppercase tracking-wide">
                {formData.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Top Section */}
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer *</Label>
                  <Select
                    value={formData.customerId}
                    onValueChange={(value) => {
                      const cust = customers.find(c => c.id === value)
                      setFormData((prev) => ({
                        ...prev,
                        customerId: value,
                        quotationId: '', // clear quotation when customer changes
                        country: cust?.country || '',
                        state: cust?.billingState || cust?.state || '',
                        emirate: (cust as any)?.emirate || '',
                        currency: (cust?.currency && cust.currency !== 'SYSTEM') ? cust.currency : prev.currency
                      }))
                    }}
                  >
                    <SelectTrigger id="customer" className="h-10">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.company || customer.name || customer.email}
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orderDate">Order Date *</Label>
                  <Input
                    id="orderDate"
                    type="date"
                    className="h-10"
                    value={formData.orderDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, orderDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryDate">Delivery Date</Label>
                  <Input
                    id="deliveryDate"
                    type="date"
                    className="h-10"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, deliveryDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerReference">Customer Reference</Label>
                  <Input
                    id="customerReference"
                    className="h-10"
                    value={formData.customerReference}
                    onChange={(e) => setFormData((prev) => ({ ...prev, customerReference: e.target.value }))}
                    placeholder="Ref #123"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quotation" className="flex items-center gap-2">
                    Linked Quotation
                    {fetchingQuotation && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                  </Label>
                  <Select
                    value={formData.quotationId || 'none'}
                    onValueChange={handleQuotationSelect}
                    disabled={!formData.customerId || fetchingQuotation}
                  >
                    <SelectTrigger id="quotation" className="h-10">
                      <SelectValue placeholder={formData.customerId ? 'Select quotation...' : 'Select a customer first'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {(() => {
                        const filtered = quotations.filter(q => (q as any).customerId === formData.customerId)
                        if (filtered.length === 0 && formData.customerId) {
                          return <div className="py-3 px-3 text-sm text-slate-400 text-center">No quotations found for this customer</div>
                        }
                        return filtered.map(q => (
                          <SelectItem key={q.id} value={q.id}>
                            {q.quoteNumber}
                            {(q as any).status ? ` · ${(q as any).status}` : ''}
                          </SelectItem>
                        ))
                      })()}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Assigned To</Label>
                  <Select
                    value={formData.assignedToId || 'none'}
                    onValueChange={(v) => setFormData(p => ({ ...p, assignedToId: v === 'none' ? '' : v }))}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select Salesperson" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {users.map(u => <SelectItem key={u.id} value={u.id}>{u.user?.name || u.id}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Currency</Label>
                  <CurrencySelect
                    value={formData.currency || currency}
                    onValueChange={(v) => setFormData(p => ({ ...p, currency: v }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v: any) => setFormData(p => ({ ...p, status: v }))}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SALES_ORDER_STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tax Selection Override */}
              {(summary.isIndia || summary.isUAE) && (
                <div className="flex flex-wrap items-center gap-6 p-5 bg-muted rounded-xl border border-border shadow-sm">
                  {summary.isIndia && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">GST Treatment</Label>
                        <Badge variant="outline" className="text-[10px] font-normal py-0">
                          {formData.taxType ? 'Manual Override' : 'Auto-detected'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant={summary.isIntrastate ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFormData(p => ({ ...p, taxType: 'GST' }))}
                          className={cn(
                            "h-9 px-4 rounded-lg transition-all cursor-pointer",
                            summary.isIntrastate && "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                          )}
                        >
                          Same State (CGST + SGST)
                        </Button>
                        <Button
                          type="button"
                          variant={summary.isIGST ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFormData(p => ({ ...p, taxType: 'IGST' }))}
                          className={cn(
                            "h-9 px-4 gap-2 rounded-lg transition-all cursor-pointer",
                            summary.isIGST && "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                          )}
                        >
                          <MapPin className="h-4 w-4" />
                          Different State (IGST)
                        </Button>
                        {formData.taxType && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setFormData(p => ({ ...p, taxType: '' }))}
                            className="h-9 text-xs text-muted-foreground hover:text-foreground"
                          >
                            Reset to Auto
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {summary.isUAE && (
                    <div className="flex flex-wrap gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">VAT Calculation</Label>
                        <Select
                          value={formData.vatType}
                          onValueChange={(v: any) => setFormData(p => ({ ...p, vatType: v }))}
                        >
                          <SelectTrigger className="h-9 w-[180px] bg-background"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="exclusive">VAT Exclusive (Add on top)</SelectItem>
                            <SelectItem value="inclusive">VAT Inclusive (Extracted)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tax Override</Label>
                        <Select
                          value={formData.taxType || "none"}
                          onValueChange={(v: any) => setFormData(p => ({ ...p, taxType: v === 'none' ? '' : v }))}
                        >
                          <SelectTrigger className="h-9 w-[180px] bg-background">
                            <SelectValue placeholder="Select Override" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="VAT">UAE VAT</SelectItem>
                            <SelectItem value="none">Auto-detect</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Region Specific Extra Fields */}
              {summary.isIndia && (
                <div className="grid gap-6 md:grid-cols-4 p-4 bg-orange-50/30 rounded-lg border border-orange-100">
                  <div className="space-y-2">
                    <Label>Place of Supply</Label>
                    <Input
                      value={formData.placeOfSupply}
                      onChange={e => setFormData(p => ({ ...p, placeOfSupply: e.target.value }))}
                      placeholder="State"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>E-Way Bill No</Label>
                    <Input
                      value={formData.ewayBillNo}
                      onChange={e => setFormData(p => ({ ...p, ewayBillNo: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Transport Details</Label>
                    <Input
                      value={formData.transportDetails}
                      onChange={e => setFormData(p => ({ ...p, transportDetails: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-8">
                    <input
                      type="checkbox"
                      id="reverseCharge"
                      checked={formData.reverseCharge}
                      onChange={e => setFormData(p => ({ ...p, reverseCharge: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="reverseCharge">Reverse Charge</Label>
                  </div>
                </div>
              )}

              {summary.isUAE && (
                <div className="grid gap-6 md:grid-cols-3 p-4 bg-sky-50/30 rounded-lg border border-sky-100">
                  <div className="space-y-2">
                    <Label>Emirate</Label>
                    <Select
                      value={formData.emirate}
                      onValueChange={(v) => setFormData(p => ({ ...p, emirate: v }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Select Emirate" /></SelectTrigger>
                      <SelectContent>
                        {['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'].map(e => (
                          <SelectItem key={e} value={e}>{e}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

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
                          <TableHead className="w-[180px] text-[11px] font-bold uppercase">{isConstruction ? 'Item Name' : 'Product'}</TableHead>
                          <TableHead className="w-[200px] text-[11px] font-bold uppercase">Description</TableHead>
                          {!isConstruction && hasGoodsItem && <TableHead className="w-[130px] text-[11px] font-bold uppercase">Warehouse</TableHead>}
                          {!isConstruction && <TableHead className="w-[100px] text-[11px] font-bold uppercase">{items.length > 0 && items[0].itemType === 'SERVICE' ? 'SAC' : 'HSN'}</TableHead>}
                          {!isConstruction && hasGoodsItem && <TableHead className="w-[80px] text-[11px] font-bold uppercase text-center">Stock</TableHead>}
                          <TableHead className="w-[80px] text-[11px] font-bold uppercase text-center">{items.length > 0 && items[0].itemType === 'SERVICE' ? 'HRS' : 'QTY'}</TableHead>
                          {!isConstruction && <TableHead className="w-[90px] text-[11px] font-bold uppercase">Unit</TableHead>}
                          <TableHead className="w-[110px] text-[11px] font-bold uppercase text-right">Rate</TableHead>
                          {summary.isOtherCountry ? (
                            <TableHead className="w-[80px] text-[11px] font-bold uppercase text-right">{summary.taxLabel}</TableHead>
                          ) : summary.isIndia ? (
                            summary.isIntrastate ? (
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
                        {items.map((item, index) => {
                          const product = products.find(p => p.id === item.productId)
                          const isService = product?.type === 'SERVICE' || item.itemType === 'SERVICE'
                          const warehouseStock = product?.stockLevels?.find(s => s.warehouseId === item.warehouseId)

                          const qty = Number(warehouseStock?.quantity || 0)
                          const res = Number(warehouseStock?.reservedQty || 0)
                          const available = isService ? Infinity : Math.max(0, qty - res)

                          const isLowStock = !isService && available < Number(product?.reorderLevel || 0)
                          const isOutOfStock = !isService && available <= 0

                          const lineAmount = Number(item.quantity || 0) * Number(item.price || 0)
                          let lineTax = 0
                          if (summary.isIndia) {
                            lineTax = summary.isIntrastate
                              ? (lineAmount * (Number(item.cgstPercent || 0) + Number(item.sgstPercent || 0)) / 100)
                              : (lineAmount * Number(item.igstPercent || 0) / 100)
                          } else {
                            const vatRate = Number(item.taxPercent || 0)
                            if (formData.vatType === 'inclusive') {
                              const lineSub = lineAmount / (1 + vatRate / 100)
                              lineTax = lineAmount - lineSub
                            } else {
                              lineTax = lineAmount * (vatRate / 100)
                            }
                          }

                          const totalLineAmount = formData.vatType === 'inclusive' ? lineAmount : (lineAmount + lineTax)

                          return (
                            <TableRow key={item.id} className="group hover:bg-muted/50 border-b border-border last:border-none">
                              <TableCell className="py-3 px-2">
                                {isConstruction ? (
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
                                        <button type="button" onMouseDown={(e) => { e.preventDefault(); setShowCreateProduct(true) }} className="flex w-full items-center gap-2 px-2 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer transition-colors">
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

                              {!isConstruction && hasGoodsItem && (
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

                              {!isConstruction && (
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

                              {!isConstruction && hasGoodsItem && (
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

                              {!isConstruction && (
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

                              {summary.isOtherCountry ? (
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
                              ) : summary.isIndia ? (
                                summary.isIntrastate ? (
                                  <>
                                    <TableCell className="py-3 px-2 text-right">
                                      <EditableTaxSelect
                                        value={item.cgstPercent ?? 0}
                                        onChange={(val) => {
                                          updateItem(index, 'cgstPercent', val)
                                          updateItem(index, 'sgstPercent', val)
                                          updateItem(index, 'taxPercent', val * 2)
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
                                          updateItem(index, 'taxPercent', val * 2)
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
                                  disabled={items.length === 1}
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

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-semibold">Internal Notes</Label>
                    <Textarea
                      id="notes"
                      rows={4}
                      value={formData.notes}
                      onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                      placeholder="Internal records..."
                      className="resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="terms" className="text-sm font-semibold">Terms & Conditions</Label>
                    <Textarea
                      id="terms"
                      rows={4}
                      value={formData.termsConditions}
                      onChange={(e) => setFormData(p => ({ ...p, termsConditions: e.target.value }))}
                      placeholder="Payment terms, delivery policy, etc."
                      className="resize-none"
                    />
                  </div>
                </div>

                <div className="bg-muted/50 rounded-2xl p-6 space-y-4 border border-border shadow-sm">
                  <h4 className="font-bold text-foreground border-b border-border pb-3 mb-4">Summary</h4>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">Subtotal</span>
                    <span className="font-bold">{formData.currency || currency} {summary.subtotal.toFixed(2)}</span>
                  </div>

                  {summary.isIndia ? (
                    <>
                      {summary.isIntrastate ? (
                        <>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground font-medium">CGST Total</span>
                            <span className="font-bold text-sky-600">+{formData.currency || currency} {summary.cgst.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground font-medium">SGST Total</span>
                            <span className="font-bold text-sky-600">+{formData.currency || currency} {summary.sgst.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm border-t border-border pt-1 text-foreground">
                            <span className="text-muted-foreground font-semibold">Total GST (CGST + SGST)</span>
                            <span className="font-bold text-foreground">+{formData.currency || currency} {(summary.cgst + summary.sgst).toFixed(2)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground font-medium">IGST Total</span>
                          <span className="font-bold text-sky-600">+{formData.currency || currency} {summary.igst.toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-medium">VAT Total</span>
                      <span className="font-bold text-sky-600">+{formData.currency || currency} {summary.vat.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm border-t pt-2">
                    <span className="text-muted-foreground font-medium">Tax Total</span>
                    <span className="font-bold text-sky-600">+{formData.currency || currency} {summary.taxTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center gap-4">
                    <span className="text-sm text-muted-foreground font-medium">Shipping</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{formData.currency || currency}</span>
                      <Input
                        type="number"
                        value={formData.shippingCharges}
                        onChange={(e) => setFormData(p => ({ ...p, shippingCharges: Number(e.target.value || 0) }))}
                        className="h-8 w-24 text-right bg-background border-dashed"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center gap-4">
                    <span className="text-sm text-muted-foreground font-medium">Discount</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{formData.currency || currency}</span>
                      <Input
                        type="number"
                        value={formData.discount}
                        onChange={(e) => setFormData(p => ({ ...p, discount: Number(e.target.value || 0) }))}
                        className="h-8 w-24 text-right bg-background border-dashed"
                      />
                    </div>
                  </div>

                  {summary.isIndia && summary.tds > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-medium">TDS Deduction</span>
                      <span className="font-bold text-red-600">-{formData.currency || currency} {summary.tds.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-muted-foreground/20">
                    <span className="text-base font-bold text-foreground">Grand Total</span>
                    <span className="text-2xl font-black text-primary">
                      {formData.currency || currency} {summary.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-8 mt-8 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl h-11 px-6 cursor-pointer border-border"
                  onClick={() => window.history.back()}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="gap-2 px-8 h-11 rounded-xl cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold"
                  disabled={submitting}
                >
                  {submitting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <SaveIcon className="h-4 w-4" />
                  )}
                  {submitLabel}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <CreateCustomerModal
        open={showCreateCustomer}
        onClose={() => setShowCreateCustomer(false)}
        businessId={businessId}
        onCreated={(newCust) => {
          setCustomers((prev) => [...prev, newCust])
          setFormData((prev) => ({
            ...prev,
            customerId: newCust.id,
            country: newCust.country || '',
            state: newCust.billingState || newCust.state || '',
            emirate: newCust.emirate || '',
          }))
        }}
      />
      <CreateProductModal
        open={showCreateProduct}
        onClose={() => setShowCreateProduct(false)}
        businessId={businessId}
        onCreated={(newProd) => setProducts((prev) => [...prev, newProd])}
      />

      {/* Confirmation: Replace line items when quotation changes */}
      <Dialog open={confirmReplaceOpen} onOpenChange={setConfirmReplaceOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Replace Line Items?</DialogTitle>
            <DialogDescription>
              Changing the linked quotation will replace the current line items, currency, discount and notes with data from the new quotation. This cannot be undone. Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setConfirmReplaceOpen(false); setPendingQuotationId('') }}>
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                setConfirmReplaceOpen(false)
                doFetchQuotation(pendingQuotationId)
                setPendingQuotationId('')
              }}
            >
              Yes, Replace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
