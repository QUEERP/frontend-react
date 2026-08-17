import { toast } from 'sonner';
import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom';
import {  useNavigate, useLocation  } from 'react-router-dom';
import {
  ArrowLeft as ArrowLeftIcon,
  Save as SaveIcon,
  Download as DownloadIcon,
  Receipt,
  FileText as FileTextIcon,
  Calendar as CalendarIcon,
  Percent as PercentIcon,
  ShoppingBag as ShoppingBagIcon,
  Truck,
  Calculator,
  UserPlus,
  PackagePlus,
  Loader2
} from 'lucide-react'
import { CreateCustomerModal } from '@/components/dashboard/create-customer-modal'
import { CreateProductModal } from '@/components/dashboard/create-product-modal'
import { salesOrdersAPI } from '@/lib/api/sales-orders'
import { invoicesAPI } from '@/lib/api/invoices'
import { contactsAPI } from '@/lib/api/contacts'
import { warehousesAPI, Warehouse } from '@/lib/api/warehouses'
import { productsAPI, Product } from '@/lib/api/inventory'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DashboardModeToggle } from '@/components/dashboard/mode-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { UserMenu } from './user-menu'
import { Plus, Trash2 } from 'lucide-react'
import { cn, getCookie } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Check } from 'lucide-react'
import { EditableTaxSelect } from '@/components/dashboard/editable-tax-select'
import { CurrencySelect } from '@/components/dashboard/currency-select'
import { getCurrencySymbol } from '@/lib/currencies'

export function AddInvoiceClient({
  businessId,
  invoiceId,
  salesOrderId,
  projectId,
  paymentIdForAllocation,
  unallocatedAmount,
  prefillCustomerId,
}: {
  businessId: string;
  invoiceId?: string;
  salesOrderId?: string;
  projectId?: string;
  paymentIdForAllocation?: string;
  unallocatedAmount?: number;
  prefillCustomerId?: string;
}) {
  const navigate = useNavigate()
  const { business, currency = 'AED' } = useBusinessData()
  const { toast } = useToast()

  const [customers, setCustomers] = useState<any[]>([])
  const [salesOrders, setSalesOrders] = useState<any[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCreateCustomer, setShowCreateCustomer] = useState(false)
  const [showCreateProduct, setShowCreateProduct] = useState(false)
  const [step, setStep] = useState<'form' | 'template'>('form')
  const [selectedTemplate, setSelectedTemplate] = useState('modern')
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [isLoadingPreviews, setIsLoadingPreviews] = useState(false)
  const [previewDialogTpl, setPreviewDialogTpl] = useState<string | null>(null)

  const [selectedSOId, setSelectedSOId] = useState<string>('none')
  const [fetchingSO, setFetchingSO] = useState(false)
  const [confirmSOOpen, setConfirmSOOpen] = useState(false)
  const [pendingSOId, setPendingSOId] = useState<string>('')
  const [manualTaxType, setManualTaxType] = useState<'intra' | 'inter' | null>(null)
  const [items, setItems] = useState<any[]>([{
    id: '1',
    productId: '',
    warehouseId: '',
    itemName: '',
    description: '',
    itemType: 'GOODS',
    hsnSacCode: '',
    quantity: 1,
    price: 1,
    taxPercent: 0,
    cgstPercent: 0,
    sgstPercent: 0,
    igstPercent: 0,
    unit: 'pcs',
  }])

  const [formData, setFormData] = useState({
    customerId: prefillCustomerId || '',
    invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    poNumber: '',
    projectId: projectId || '',
    notes: '',
    terms: '',
    discount: 0,
    shippingCharges: 0,
    tax: 0,
    // New Tax fields
    cgst: 0,
    sgst: 0,
    igst: 0,
    tds: 0,
    ewayBillNo: '',
    reverseCharge: false,
    transportDetails: '',
    vatPercentage: 0,
    vatAmount: 0,
    vatType: 'exclusive' as 'exclusive' | 'inclusive',
    emirate: '',
    country: '',
    state: '',
    currency: '',
  })

  const summary = React.useMemo(() => {
    const customer = customers.find(c => c.id === formData.customerId)

    // NEW ARCHITECTURE: Business Country is the source of truth
    const businessCountry = business?.country || 'UAE'
    const isBasic = business?.businessType === 'Basic'
    const customerCountryName = (customer?.country || customer?.region || '').trim().toUpperCase()

    // Check if a customer is selected AND their country is known to be NOT India and NOT UAE
    const isCustomerSelected = !!customer
    const isOtherCountry = isCustomerSelected && customerCountryName !== '' && customerCountryName !== 'INDIA' && customerCountryName !== 'UAE' && customerCountryName !== 'UNITED ARAB EMIRATES'

    const isIndia = isOtherCountry ? false : (businessCountry === 'INDIA')
    const isUAE = isOtherCountry ? false : (businessCountry === 'UAE')

    const getTaxLabel = (c: string) => {
      if (['AUSTRALIA', 'CANADA', 'NEW ZEALAND', 'SINGAPORE', 'MALAYSIA'].includes(c)) return 'GST %'
      if (['UNITED STATES', 'USA', 'US'].includes(c)) return 'Sales Tax %'
      if (['UNITED KINGDOM', 'UK', 'SOUTH AFRICA'].includes(c)) return 'VAT %'
      return 'Tax %'
    }

    const customerCountry = customerCountryName

    const companyState = business?.state?.trim().toUpperCase() || ''
    const customerState = (customer?.billingState || customer?.state || '').trim().toUpperCase() || ''
    const autoIntrastate = isIndia && companyState === customerState && companyState !== ''
    const isIntrastate = manualTaxType === 'intra' || (manualTaxType === null && autoIntrastate)

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
          // EXPORT
          const lineIgst = lineAmount * (Number(item.igstPercent || 0) / 100)
          igst += lineIgst
          lineTax = lineIgst
        } else {
          // DOMESTIC
          if (isIntrastate) {
            const lineCgst = lineAmount * (Number(item.cgstPercent || 0) / 100)
            const lineSgst = lineAmount * (Number(item.sgstPercent || 0) / 100)
            cgst += lineCgst
            sgst += lineSgst
            lineTax = lineCgst + lineSgst
          } else {
            const lineIgst = lineAmount * (Number(item.igstPercent || 0) / 100)
            igst += lineIgst
            lineTax = lineIgst
          }
        }
      } else if (isUAE) {
        if (customerCountry !== 'UAE' && customerCountry !== 'UNITED ARAB EMIRATES' && customerCountry !== '') {
          // EXPORT - Zero rated or export vat (0%)
          lineTax = 0
        } else {
          const vatRate = Number(item.taxPercent || 5)
          if (formData.vatType === 'inclusive') {
            // VAT Inclusive: Extract from total
            const lineSub = Number((lineAmount / (1 + vatRate / 100)).toFixed(2))
            const lineVat = Number((lineAmount - lineSub).toFixed(2))
            vat += lineVat
            subtotal += lineSub
            lineTax = lineVat
            return // Skip regular subtotal addition
          } else {
            // VAT Exclusive: Add on top
            const lineVat = lineAmount * (vatRate / 100)
            vat += lineVat
            lineTax = lineVat
          }
        }
      } else {
        const lineVat = lineAmount * (Number(item.taxPercent || 0) / 100)
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
      isBasic,
      isIndia,
      isUAE,
      isOtherCountry,
      customerCountryName,
      taxLabel: getTaxLabel(customerCountryName),
      isIntrastate,
      cgst,
      sgst,
      igst,
      vat,
      tds: Number(formData.tds || 0)
    }
  }, [items, formData.discount, formData.shippingCharges, formData.customerId, formData.tds, formData.vatType, customers, business, manualTaxType])

  const hasGoodsItem = React.useMemo(() => {
    if (items.length === 0) return true;
    return items.some(item => {
      if (!item.productId) return true;
      const p = products.find(p => p.id === item.productId);
      return p ? p.type !== 'SERVICE' : true;
    });
  }, [items, products]);

  useEffect(() => {
    if (step === 'template') {
      const fetchPreviews = async () => {
        setIsLoadingPreviews(true)
        const templates = ['modern', 'classic', 'minimal']
        const newPreviews: Record<string, string> = {}

        for (const t of templates) {
          try {
            const validItems = items.filter(it => it.productId && it.quantity > 0)
            const res = await invoicesAPI.getPreview(businessId, {
              ...formData,
              designTemplate: t,
              items: validItems.map(it => ({
                ...it,
                rate: it.price
              })),
              subtotal: summary.subtotal,
              totalTax: summary.taxTotal,
              grandTotal: summary.total,
            })
            if (res.success) newPreviews[t] = res.html
          } catch (err) {
            console.error(`Failed to fetch preview for ${t}`, err)
          }
        }
        setPreviews(newPreviews)
        setIsLoadingPreviews(false)
      }
      fetchPreviews()
    }
  }, [step, formData, items, summary, businessId])

  const doFetchSO = React.useCallback(async (soId: string) => {
    setSelectedSOId(soId)
    if (soId === 'none') return

    setFetchingSO(true)
    try {
      const res = await salesOrdersAPI.getSalesOrderById(businessId, soId)
      if (res.success) {
        const so = res.order
        setFormData(prev => ({
          ...prev,
          customerId: so.customerId || prev.customerId,
          poNumber: (so as any).customerReference || (so as any).poNumber || prev.poNumber,
          notes: so.notes || prev.notes,
          currency: (so as any).currency || prev.currency,
          discount: (so as any).discount ?? prev.discount,
          shippingCharges: (so as any).shippingCharges ?? prev.shippingCharges,
          country: (so as any).country || prev.country,
          state: (so as any).state || prev.state,
          emirate: (so as any).emirate || prev.emirate,
        }))
        setItems((so.items || []).map((it: any) => ({
          id: it.id || Math.random().toString(36).substr(2, 9),
          productId: it.productId || '',
          warehouseId: it.warehouseId || '',
          itemName: it.itemName || '',
          description: it.description || it.name || '',
          itemType: it.itemType || 'GOODS',
          hsnSacCode: it.hsnSacCode || '',
          quantity: it.quantity,
          price: it.price || it.rate || 0,
          taxPercent: it.taxPercent || 0,
          cgstPercent: it.cgstPercent || (it.taxPercent / 2) || 0,
          sgstPercent: it.sgstPercent || (it.taxPercent / 2) || 0,
          igstPercent: it.igstPercent || it.taxPercent || 0,
          unit: it.unit || 'pcs',
        })))
        toast({ title: 'Sales Order data imported', description: `${so.items?.length || 0} line items loaded` })
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load Sales Order details', variant: 'destructive' })
    } finally {
      setFetchingSO(false)
    }
  }, [businessId])

  const handleSOSelect = React.useCallback((soId: string) => {
    if (soId === 'none') {
      setSelectedSOId('none')
      return
    }
    // If items already exist (from previous SO or manual entry), confirm
    const hasItems = items.some((it: any) => it.productId)
    if (hasItems && selectedSOId !== 'none' && selectedSOId !== soId) {
      setPendingSOId(soId)
      setConfirmSOOpen(true)
    } else {
      doFetchSO(soId)
    }
  }, [doFetchSO, items, selectedSOId])

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        productId: '',
        warehouseId: warehouses[0]?.id || '',
        itemName: '',
        description: '',
        itemType: 'GOODS',
        hsnSacCode: '',
        quantity: 1,
        price: 1,
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

  const hasLoaded = React.useRef(false)
  useEffect(() => {
    if (hasLoaded.current) return
    hasLoaded.current = true
    const load = async () => {
      try {
        const [custRes, soRes, prodRes, whRes] = await Promise.allSettled([
          contactsAPI.getCustomers(businessId),
          salesOrdersAPI.getSalesOrders(businessId),
          productsAPI.getAll(businessId),
          warehousesAPI.getWarehouses(businessId)
        ])
        if (custRes.status === 'fulfilled') {
          const loadedCustomers = custRes.value.customers || []
          setCustomers(loadedCustomers)
          if (prefillCustomerId && !invoiceId) {
            const cust = loadedCustomers.find((c: any) => c.id === prefillCustomerId)
            if (cust) {
              setFormData(prev => ({
                ...prev,
                country: cust.country || '',
                state: cust.billingState || cust.state || '',
                emirate: cust.emirate || '',
                currency: (cust.currency && cust.currency !== 'SYSTEM') ? cust.currency : prev.currency
              }))
            }
          }
        }
        if (soRes.status === 'fulfilled') setSalesOrders(soRes.value.orders || [])
        if (prodRes.status === 'fulfilled') setProducts(prodRes.value.products || [])
        if (whRes.status === 'fulfilled') setWarehouses(whRes.value.warehouses || [])

        if (invoiceId) {
          const invRes = await invoicesAPI.getInvoiceById(businessId, invoiceId)
          if (invRes.success) {
            const inv = invRes.data || invRes.invoice
            const cust = (custRes.status === 'fulfilled' ? custRes.value.customers : []).find((c: any) => c.id === inv.customerId)

            setFormData({
              customerId: inv.customerId,
              projectId: (inv as any).projectId || '',
              invoiceDate: new Date(inv.invoiceDate).toISOString().slice(0, 10),
              dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().slice(0, 10) : '',
              poNumber: inv.poNumber || '',
              notes: inv.notes || '',
              terms: inv.terms || '',
              discount: inv.discount || 0,
              shippingCharges: inv.shippingCharges || 0,
              tax: inv.totalTax || 0,
              // Load new fields
              cgst: inv.cgst || 0,
              sgst: inv.sgst || 0,
              igst: inv.igst || 0,
              tds: inv.tds || 0,
              ewayBillNo: inv.ewayBillNo || '',
              reverseCharge: inv.reverseCharge || false,
              transportDetails: inv.transportDetails || '',
              vatPercentage: inv.vatPercentage || 0,
              vatAmount: inv.vatAmount || 0,
              vatType: (inv.vatType as any) || 'exclusive',
              emirate: inv.emirate || cust?.emirate || '',
              country: cust?.country || '',
              state: cust?.billingState || cust?.state || '',
              currency: inv.currency || '',
            })
            setItems(inv.items.map((it: any) => ({
              id: it.id,
              productId: it.productId,
              warehouseId: it.warehouseId || '',
              itemName: it.itemName || '',
              description: it.description || '',
              itemType: it.itemType || 'GOODS',
              hsnSacCode: it.hsnSacCode || '',
              quantity: it.quantity,
              price: it.rate || it.price,
              taxPercent: it.taxPercent,
              cgstPercent: it.cgstPercent || (it.taxPercent / 2) || 0,
              sgstPercent: it.sgstPercent || (it.taxPercent / 2) || 0,
              igstPercent: it.igstPercent || it.taxPercent || 0,
              unit: it.unit || 'pcs',
            })))
          if (inv.salesOrderId) setSelectedSOId(inv.salesOrderId)
          }
        } else if (salesOrderId) {
          handleSOSelect(salesOrderId)
        } else if (projectId) {
          try {
             const token = getCookie('token') || getCookie('accessToken');
             const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '')
             const projRes = await fetch(`${API_BASE}/api/projects/${projectId}`, { 
               headers: { Authorization: `Bearer ${token}`, 'x-business-id': businessId } 
             })
             const projData = await projRes.json()
             const proj = projData.project || projData.data
             if (projData.success && proj) {
               setFormData(prev => ({
                 ...prev,
                 customerId: proj.customerId || prev.customerId,
                 projectId: proj.id || prev.projectId,
                 currency: proj.currency || prev.currency
               }))

               // If project has quotation, fetch it to pre-fill items
               let fetchedItems: any[] = []
               if (proj.quotationId) {
                 const quotRes = await fetch(`${API_BASE}/api/quotation/${proj.quotationId}`, {
                   headers: { Authorization: `Bearer ${token}`, 'x-business-id': businessId }
                 })
                 const quotData = await quotRes.json()
                 const quote = quotData.quotation || quotData.data
                 if (quote?.items) fetchedItems = quote.items
                 if (quote?.currency) {
                   setFormData(prev => ({ ...prev, currency: quote.currency }))
                 }
               }
               let projectItems = proj.items || proj.projectItems;
               if ((!fetchedItems || fetchedItems.length === 0) && projectItems?.length > 0) {
                 fetchedItems = projectItems;
               }

               if (fetchedItems.length > 0) {
                  setItems(fetchedItems.map((it: any) => ({
                    id: Math.random().toString(36).substr(2, 9),
                    productId: it.productId || '',
                    warehouseId: it.warehouseId || '',
                    itemName: it.itemName || it.description?.substring(0,20) || '',
                    description: it.description || '',
                    itemType: it.itemType || 'GOODS',
                    hsnSacCode: it.hsnSacCode || '',
                    quantity: Number(it.quantity) || 1,
                    price: Number(it.price || it.rate) || 0,
                    taxPercent: Number(it.taxPercent) || 0,
                    cgstPercent: Number(it.cgstPercent) || (Number(it.taxPercent)/2) || 0,
                    sgstPercent: Number(it.sgstPercent) || (Number(it.taxPercent)/2) || 0,
                    igstPercent: Number(it.igstPercent) || Number(it.taxPercent) || 0,
                    unit: it.unit || 'pcs',
                  })))
               }
             }
          } catch (e) {
             console.error('Failed to load project details for invoice', e)
          }
        }
      } catch (e) {
        toast({ title: 'Error', description: 'Failed to load invoice data', variant: 'destructive' })
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, invoiceId, salesOrderId, projectId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validItems = items.filter(it => (it.productId || (it.itemName && it.itemName.trim()) || it.description.trim()) && it.quantity > 0)
    if (!formData.customerId || validItems.length === 0) {
      toast({ title: 'Error', description: 'Customer and items are required', variant: 'destructive' })
      return
    }
    handleFinalSubmit(undefined, true)
  }

  const handleFinalSubmit = async (template?: string, download: boolean = false) => {
    setIsSubmitting(true)
    const validItems = items.filter(it => (it.productId || (it.itemName && it.itemName.trim()) || it.description.trim()) && it.quantity > 0)
    try {
      const payload = {
        ...formData,
        currency: formData.currency || currency,
        designTemplate: template,
        salesOrderId: selectedSOId === 'none' ? undefined : selectedSOId,
        projectId: formData.projectId || undefined,
        items: validItems.map(it => ({
          productId: it.productId || undefined,
          itemName: it.itemName,
          warehouseId: it.warehouseId,
          description: it.description,
          itemType: summary.isBasic ? 'SERVICE' : (it.itemType || 'GOODS'),
          unit: it.unit,
          quantity: it.quantity,
          rate: it.price,
          taxPercent: summary.isIndia
            ? (summary.isIntrastate ? (Number(it.cgstPercent || 0) + Number(it.sgstPercent || 0)) : Number(it.igstPercent || 0))
            : it.taxPercent,
          cgstPercent: it.cgstPercent,
          sgstPercent: it.sgstPercent,
          igstPercent: it.igstPercent,
          hsnSacCode: it.hsnSacCode,
          taxDetails: summary.isIndia ? (
            summary.isIntrastate ? [
              { name: 'CGST', rate: Number(it.cgstPercent || 0), amount: (Number(it.quantity || 0) * Number(it.price || 0) * Number(it.cgstPercent || 0)) / 100 },
              { name: 'SGST', rate: Number(it.sgstPercent || 0), amount: (Number(it.quantity || 0) * Number(it.price || 0) * Number(it.sgstPercent || 0)) / 100 }
            ].filter(t => t.rate > 0) : [
              { name: 'IGST', rate: Number(it.igstPercent || 0), amount: (Number(it.quantity || 0) * Number(it.price || 0) * Number(it.igstPercent || 0)) / 100 }
            ].filter(t => t.rate > 0)
          ) : [
            { name: summary.taxLabel, rate: Number(it.taxPercent || 0), amount: (Number(it.quantity || 0) * Number(it.price || 0) * Number(it.taxPercent || 0)) / 100 }
          ].filter(t => t.rate > 0)
        })),
        subtotal: summary.subtotal,
        totalTax: summary.taxTotal,
        grandTotal: summary.total,
        cgst: summary.cgst,
        sgst: summary.sgst,
        igst: summary.igst,
        vatAmount: summary.vat,
      }

      let result;
      if (invoiceId) {
        result = await (invoicesAPI as any).updateInvoice(businessId, invoiceId, payload)
        toast({ title: 'Success', description: 'Invoice updated successfully' })
      } else {
        result = await (invoicesAPI as any).createInvoice(businessId, payload)
        toast({ title: 'Success', description: 'Invoice created successfully' })
      }

      const createdInvoiceId = result?.invoice?.id || result?.data?.id

      if (download && createdInvoiceId) {
        const token = getCookie('token') || getCookie('accessToken')
        const downloadUrl = `${import.meta.env.VITE_API_BASE || 'http://localhost:5002'}/api/invoices/${createdInvoiceId}/download-pdf?x-business-id=${businessId}&token=${token}`
        const a = document.createElement('a')
        a.href = downloadUrl
        a.target = '_self'
        a.download = `Invoice_${createdInvoiceId}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }

      // Auto Allocation handling
      if (paymentIdForAllocation && createdInvoiceId) {
        const allocAmount = Math.min(summary.total, unallocatedAmount || 0);
        if (allocAmount > 0) {
          const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5002'
          const token = getCookie('token') || getCookie('accessToken')
          await fetch(`${API_BASE}/api/payments/${paymentIdForAllocation}/allocate-existing-invoice`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
              'x-business-id': businessId,
            },
            body: JSON.stringify({ invoiceId: createdInvoiceId, amount: allocAmount })
          })
          toast({ title: 'Payment Allocated', description: `Successfully applied to this invoice.` })
        }
        navigate(`/dashboard/${businessId}/payments`)
        return;
      }

      if (formData.projectId) {
        navigate(`/dashboard/${businessId}/project-operations/projects/${formData.projectId}`)
      } else {
        navigate(`/dashboard/${businessId}/invoices`)
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to create invoice', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <TooltipProvider>
      {step === 'form' ? (
        <div className="min-h-svh bg-background pb-12 pt-6">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-8 w-full flex flex-col gap-6">
            {/* Top bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-6 rounded-xl border border-border shadow-sm w-full">
              <header className="flex items-center justify-between gap-4 w-full">
                <div className="flex min-w-0 items-center gap-4">
                  <Link to={`/dashboard/${businessId}/invoices`}>
                    <Button variant="ghost" size="icon" className="h-10 w-10 cursor-pointer text-muted-foreground hover:text-foreground bg-muted hover:bg-muted rounded-xl">
                      <ArrowLeftIcon className="size-5" />
                    </Button>
                  </Link>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl hidden sm:block">
                    <FileTextIcon className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-2xl font-bold text-foreground tracking-tight">{invoiceId ? 'Edit Invoice' : 'Create New Invoice'}</span>
                    <span className="text-sm font-medium text-muted-foreground mt-0.5">
                      {invoiceId ? 'Update invoice details' : 'Generate a new invoice for your customer'}
                    </span>
                  </div>
                </div>
              </header>
            </div>

            <Card className="w-full rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/50 border-b border-border pb-6">
                <CardTitle className="text-lg text-foreground flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-blue-600" />
                  {invoiceId ? 'Invoice Details' : 'New Invoice Details'}
                </CardTitle>
                <p className="text-sm text-muted-foreground font-medium">Manage your invoice details and items</p>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Top Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="customer">Customer *</Label>


                      <Select
                        value={formData.customerId}
                        onValueChange={(value) => {
                          const cust = customers.find(c => c.id === value)
                          setFormData((prev) => ({
                            ...prev,
                            customerId: value,
                            country: cust?.country || '',
                            state: cust?.billingState || cust?.state || '',
                            emirate: cust?.emirate || '',
                            currency: (cust?.currency && cust.currency !== 'SYSTEM') ? cust.currency : prev.currency
                          }))
                          setSelectedSOId('none')
                          setManualTaxType(null)
                        }}
                      >
                        <SelectTrigger id="customer" className="h-10 w-full cursor-pointer">
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.company || customer.name || customer.email}
                            </SelectItem>
                          ))}
                          {/* Always-visible Create Customer action */}
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
                      <Label htmlFor="invoiceDate">Invoice Date *</Label>
                      <Input
                        id="invoiceDate"
                        type="date"
                        className="h-10"
                        value={formData.invoiceDate}
                        onChange={(e) => setFormData((prev) => ({ ...prev, invoiceDate: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        className="h-10"
                        value={formData.dueDate}
                        onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </div>

                    {!summary.isBasic && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="salesOrder" className="flex items-center gap-2">
                            Link Sales Order
                            {fetchingSO && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                          </Label>
                          <Select
                            value={selectedSOId}
                            onValueChange={handleSOSelect}
                            disabled={!formData.customerId || fetchingSO}
                          >
                            <SelectTrigger id="salesOrder" className="h-10 w-full cursor-pointer">
                              <SelectValue placeholder={formData.customerId ? 'Select Sales Order (Optional)' : 'Select a customer first'} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Direct Invoice (No SO)</SelectItem>
                              {(() => {
                                const filtered = salesOrders.filter(so => !formData.customerId || so.customerId === formData.customerId)
                                if (filtered.length === 0 && formData.customerId) {
                                  return <div className="py-3 px-3 text-sm text-slate-400 text-center">No sales orders found for this customer</div>
                                }
                                return filtered.map((so) => (
                                  <SelectItem key={so.id} value={so.id}>
                                    {so.orderNumber}
                                    {so.status ? ` · ${so.status}` : ''}
                                  </SelectItem>
                                ))
                              })()}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="poNumber">PO Number / Ref</Label>
                          <Input
                            id="poNumber"
                            className="h-10"
                            value={formData.poNumber}
                            onChange={(e) => setFormData((prev) => ({ ...prev, poNumber: e.target.value }))}
                            placeholder="PO-1001"
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <CurrencySelect
                        value={formData.currency || currency}
                        onValueChange={(v) => setFormData(p => ({ ...p, currency: v }))}
                      />
                    </div>
                  </div>

                  {/* Region Specific Extra Fields */}
                  {summary.isIndia && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-4 bg-orange-50/30 rounded-xl border border-orange-100">
                      <div className="space-y-2">
                        <Label>E-Way Bill No</Label>
                        <Input
                          value={formData.ewayBillNo}
                          onChange={e => setFormData(p => ({ ...p, ewayBillNo: e.target.value }))}
                          placeholder="Optional"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Transport Details</Label>
                        <Input
                          value={formData.transportDetails}
                          onChange={e => setFormData(p => ({ ...p, transportDetails: e.target.value }))}
                          placeholder="Vehicle No, LRN, etc."
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
                      <div className="space-y-2">
                        <Label>TDS Amount (₹)</Label>
                        <Input
                          type="number"
                          value={formData.tds}
                          onChange={e => setFormData(p => ({ ...p, tds: Number(e.target.value || 0) }))}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}

                  {summary.isUAE && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-4 bg-sky-50/30 rounded-xl border border-sky-100">
                      <div className="space-y-2">
                        <Label>VAT Type</Label>
                        <Select
                          value={formData.vatType}
                          onValueChange={(v: any) => setFormData(p => ({ ...p, vatType: v }))}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="exclusive">VAT Exclusive (Add on top)</SelectItem>
                            <SelectItem value="inclusive">VAT Inclusive (Extracted)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
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

                  {/* Line Items Section */}
                  <div className="space-y-4 pt-4 border-t border-border mt-6">
                    {summary.isIndia && (
                      <div className="flex gap-2 mb-4 p-1 bg-muted rounded-xl w-fit border border-border">
                        <Button
                          type="button"
                          variant={summary.isIntrastate ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setManualTaxType('intra')}
                          className={cn("text-xs h-9 px-4 rounded-lg transition-colors cursor-pointer", summary.isIntrastate ? "bg-card text-foreground shadow-sm font-semibold hover:bg-card" : "text-muted-foreground")}
                        >
                          Same State (CGST, SGST)
                        </Button>
                        <Button
                          type="button"
                          variant={!summary.isIntrastate ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setManualTaxType('inter')}
                          className={cn("text-xs h-9 px-4 rounded-lg transition-colors cursor-pointer", !summary.isIntrastate ? "bg-card text-foreground shadow-sm font-semibold hover:bg-card" : "text-muted-foreground")}
                        >
                          Different State (IGST)
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <ShoppingBagIcon className="h-5 w-5 text-blue-600" />
                        Line Items *
                      </h3>
                      <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl cursor-pointer shadow-sm">
                        <Plus className="h-4 w-4" />
                        <span className="font-semibold">Add Item</span>
                      </Button>
                    </div>

                    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                      <div className="overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[1200px] w-full table-fixed">
                          <TableHeader className="bg-muted/80">
                            <TableRow className="hover:bg-background border-border">
                              <TableHead className="w-[180px] h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{summary.isBasic ? 'Item Name' : 'Product'}</TableHead>
                              <TableHead className="w-[200px] h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Description</TableHead>
                              {!summary.isBasic && hasGoodsItem && <TableHead className="w-[130px] h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Warehouse</TableHead>}
                              {!summary.isBasic && <TableHead className="w-[110px] h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{items.length > 0 && items[0].itemType === 'SERVICE' ? 'SAC' : 'HSN'}</TableHead>}
                              <TableHead className="w-[70px] h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                {items.length > 0 ? (
                                  items[0].itemType === 'SERVICE' ? 'HRS' :
                                  ['kg', 'gram', 'meter', 'litre'].includes((items[0].unit || '').toLowerCase()) ? items[0].unit?.toUpperCase() : 'QTY'
                                ) : 'QTY'}
                              </TableHead>
                              {!summary.isBasic && <TableHead className="w-[90px] h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Unit</TableHead>}
                              <TableHead className="w-[110px] h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">Rate</TableHead>
                              {summary.isOtherCountry ? (
                                <TableHead className="w-[80px] h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">{summary.taxLabel}</TableHead>
                              ) : summary.isIndia ? (
                                summary.isIntrastate ? (
                                  <>
                                    <TableHead className="w-[80px] h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">CGST%</TableHead>
                                    <TableHead className="w-[80px] h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">SGST%</TableHead>
                                  </>
                                ) : (
                                  <TableHead className="w-[80px] h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">IGST%</TableHead>
                                )
                              ) : (
                                <TableHead className="w-[80px] h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">VAT%</TableHead>
                              )}
                              <TableHead className="w-[120px] h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">Total</TableHead>
                              <TableHead className="w-[40px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.map((item, index) => {
                              const product = products.find(p => p.id === item.productId)
                              const isService = product?.type === 'SERVICE' || item.itemType === 'SERVICE'
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
                                <TableRow key={item.id} className="group hover:bg-muted/30">
                                  <TableCell className="align-top py-4">
                                    {summary.isBasic ? (
                                      <Input 
                                        value={item.itemName || ''} 
                                        placeholder="Item Name"
                                        className="h-9 text-sm bg-background px-2"
                                        onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                                      />
                                    ) : (
                                      <Select value={item.productId || 'none'} onValueChange={v => handleProductSelect(index, v === 'none' ? '' : v)}>
                                        <SelectTrigger className="h-9 w-full bg-background"><SelectValue placeholder="Product" /></SelectTrigger>
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

                                  <TableCell className="align-top py-4">
                                    <Input
                                      value={item.description}
                                      placeholder="Item name"
                                      className="h-9 text-sm bg-background"
                                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                                    />
                                  </TableCell>

                                  {!summary.isBasic && hasGoodsItem && (
                                    <TableCell className="align-top py-4">
                                      {!isService ? (
                                        <Select
                                          value={item.warehouseId}
                                          onValueChange={(val) => updateItem(index, 'warehouseId', val)}
                                        >
                                          <SelectTrigger className="h-9 w-full bg-background">
                                            <SelectValue placeholder="WH" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <div className="h-9 flex items-center justify-center text-muted-foreground">—</div>
                                      )}
                                    </TableCell>
                                  )}

                                  {!summary.isBasic && (
                                    <TableCell className="align-top py-4">
                                      <div className="relative">
                                        <Input
                                          value={item.hsnSacCode || ''}
                                          placeholder=""
                                          className="h-9 text-sm font-mono bg-background"
                                          onChange={(e) => updateItem(index, 'hsnSacCode', e.target.value)}
                                        />
                                      </div>
                                    </TableCell>
                                  )}

                                  <TableCell className="align-top py-4">
                                    <div className="relative">
                                      <Input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        className="h-9 text-sm bg-background pl-2"
                                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                      />
                                    </div>
                                  </TableCell>

                                  {!summary.isBasic && (
                                    <TableCell className="align-top py-4">
                                      <Select value={item.unit || 'pcs'} onValueChange={v => updateItem(index, 'unit', v)}>
                                        <SelectTrigger className="h-9 w-full bg-background"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                          {['pcs', 'kg', 'ltr', 'm', 'box', 'set', 'hr', 'day'].map(u => (
                                            <SelectItem key={u} value={u}>{u}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                  )}

                                  <TableCell className="align-top py-4">
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={item.price}
                                      className="h-9 text-sm text-right bg-background"
                                      onChange={(e) => updateItem(index, 'price', e.target.value)}
                                    />
                                  </TableCell>

                                  {summary.isOtherCountry ? (
                                    <TableCell className="align-top py-4">
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={item.taxPercent ?? 0}
                                        className="h-9 text-sm text-right bg-background"
                                        onChange={(e) => updateItem(index, 'taxPercent', e.target.value)}
                                      />
                                    </TableCell>
                                  ) : summary.isIndia ? (
                                    summary.isIntrastate ? (
                                      <>
                                        <TableCell className="align-top py-4">
                                          {/* CGST% — India, Same State */}
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
                                        <TableCell className="align-top py-4">
                                          {/* SGST% — India, Same State (mirrors CGST) */}
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
                                      <TableCell className="align-top py-4">
                                        {/* IGST% — India, Different State */}
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
                                    <TableCell className="align-top py-4">
                                      {/* VAT% — UAE or Default */}
                                      <EditableTaxSelect
                                        value={item.taxPercent ?? 0}
                                        onChange={(val) => updateItem(index, 'taxPercent', val)}
                                        options={[0, 5, 12, 15, 18, 28]}
                                        size="sm"
                                      />
                                    </TableCell>
                                  )}

                                  <TableCell className="align-top py-4">
                                    <div className="h-9 flex items-center justify-end px-3 rounded-md bg-muted/30 text-sm font-bold">
                                      {totalLineAmount.toFixed(2)}
                                    </div>
                                  </TableCell>

                                  <TableCell className="align-top py-4">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                                      onClick={() => removeItem(index)}
                                      disabled={items.length === 1}
                                    >
                                      <Trash2 className="h-4 w-4" />
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

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 pt-8 border-t border-border">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="notes" className="text-sm font-semibold text-foreground">Notes</Label>
                        <Textarea
                          id="notes"
                          rows={4}
                          value={formData.notes}
                          onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                          placeholder="Internal notes or customer messages..."
                          className="resize-none rounded-xl border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="terms" className="text-sm font-semibold text-foreground">Terms & Conditions</Label>
                        <Textarea
                          id="terms"
                          rows={4}
                          value={formData.terms}
                          onChange={(e) => setFormData(p => ({ ...p, terms: e.target.value }))}
                          placeholder="Payment terms, warranty, etc."
                          className="resize-none rounded-xl border-border"
                        />
                      </div>
                    </div>

                    <div className="bg-muted/80 rounded-xl p-6 space-y-4 border border-border shadow-sm">
                      <h4 className="font-bold text-foreground border-b border-border pb-3 mb-4 text-base">Order Summary</h4>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground font-medium">Subtotal</span>
                        <span className="font-bold text-foreground">{formData.currency || currency} {summary.subtotal.toFixed(2)}</span>
                      </div>

                      {summary.isIndia ? (
                        <>
                          {summary.isIntrastate ? (
                            <>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-medium">CGST Total</span>
                                <span className="font-bold text-blue-600">+{formData.currency || currency} {summary.cgst.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-medium">SGST Total</span>
                                <span className="font-bold text-blue-600">+{formData.currency || currency} {summary.sgst.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm border-t border-border pt-1 text-foreground">
                                <span className="text-muted-foreground font-semibold">Total GST (CGST + SGST)</span>
                                <span className="font-bold text-foreground">+{formData.currency || currency} {(summary.cgst + summary.sgst).toFixed(2)}</span>
                              </div>
                            </>
                          ) : (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground font-medium">IGST Total</span>
                              <span className="font-bold text-blue-600">+{formData.currency || currency} {summary.igst.toFixed(2)}</span>
                            </div>
                          )}
                        </>
                      ) : summary.isUAE ? (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground font-medium">VAT Total</span>
                          <span className="font-bold text-blue-600">+{formData.currency || currency} {summary.vat.toFixed(2)}</span>
                        </div>
                      ) : null}

                      <div className="flex justify-between items-center text-sm border-t border-border pt-3">
                        <span className="text-muted-foreground font-medium">Tax Total</span>
                        <span className="font-bold text-blue-600">+{formData.currency || currency} {summary.taxTotal.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between items-center gap-4">
                        <span className="text-sm text-muted-foreground font-medium">Shipping</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-400">{formData.currency || currency}</span>
                          <Input
                            type="number"
                            value={formData.shippingCharges}
                            onChange={(e) => setFormData(p => ({ ...p, shippingCharges: Number(e.target.value || 0) }))}
                            className="h-9 w-28 text-right bg-card border-border rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center gap-4">
                        <span className="text-sm text-muted-foreground font-medium">Discount</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-400">{formData.currency || currency}</span>
                          <Input
                            type="number"
                            value={formData.discount}
                            onChange={(e) => setFormData(p => ({ ...p, discount: Number(e.target.value || 0) }))}
                            className="h-9 w-28 text-right bg-card border-border rounded-lg"
                          />
                        </div>
                      </div>

                      {summary.isIndia && summary.tds > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground font-medium">TDS Deduction</span>
                          <span className="font-bold text-rose-600">-{formData.currency || currency} {summary.tds.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-5 border-t border-border">
                        <span className="text-base font-bold text-foreground">Grand Total</span>
                        <span className="text-2xl font-black text-blue-600">
                          {formData.currency || currency} {summary.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex cursor-pointer justify-end gap-3 pt-6 mt-6 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (formData.projectId) {
                          navigate(`/dashboard/${businessId}/project-operations/projects/${formData.projectId}`)
                        } else {
                          navigate(-1)
                        }
                      }}
                      disabled={isSubmitting}
                      className="rounded-xl px-6 cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="gap-2 cursor-pointer px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <SaveIcon className="h-4 w-4" />
                      )}
                      <span className="font-semibold">{invoiceId ? 'Update Invoice' : 'Save & Create'}</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="min-h-svh bg-background pb-12 pt-6">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-8 w-full flex flex-col gap-6">
            {/* Template Select Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-6 rounded-xl border border-border shadow-sm w-full">
              <header className="flex items-center justify-between gap-4 w-full">
                <div className="flex min-w-0 items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-muted-foreground hover:text-foreground bg-muted hover:bg-muted rounded-xl cursor-pointer"
                    onClick={() => setStep('form')}
                  >
                    <ArrowLeftIcon className="size-5" />
                  </Button>
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hidden sm:block">
                    <FileTextIcon className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-2xl font-bold text-foreground tracking-tight">Select Invoice Template</span>
                    <span className="text-sm font-medium text-muted-foreground mt-0.5">Choose a design for your generated PDF invoice</span>
                  </div>
                </div>
                <div className="flex flex-1 items-center justify-end gap-3">
                  <Button
                    variant="outline"
                    className="rounded-xl border-border cursor-pointer"
                    onClick={() => setStep('form')}
                    disabled={isSubmitting}
                  >
                    Back to Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 px-6 rounded-xl border-border cursor-pointer"
                    onClick={() => handleFinalSubmit(selectedTemplate, false)}
                    disabled={isSubmitting}
                  >
                    <SaveIcon className="h-4 w-4" />
                    <span className="font-semibold">Save Only</span>
                  </Button>
                  <Button
                    className="gap-2 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm cursor-pointer"
                    onClick={() => handleFinalSubmit(selectedTemplate, true)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <DownloadIcon className="h-4 w-4" />
                    )}
                    <span className="font-semibold">Save & Download</span>
                  </Button>
                </div>
              </header>
            </div>

            <div className="w-full py-8">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold tracking-tight mb-2">Professional Templates</h2>
                <p className="text-muted-foreground">Select the layout that best represents your business</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    id: 'modern',
                    name: 'Corporate Blue',
                    description: 'Professional layout with clear tax breakdown and brand visibility. Perfect for B2B.',
                    preview: 'bg-card border-border',
                    headerStyle: 'border-b-2 border-blue-600 pb-2',
                    accentColor: 'bg-blue-600'
                  },
                  {
                    id: 'classic',
                    name: 'Yellow Creative',
                    description: 'Bright and clean layout with yellow accents. Perfect for agencies and freelancers.',
                    preview: 'bg-card border-border',
                    headerStyle: 'border-b-2 border-yellow-500 pb-2',
                    accentColor: 'bg-yellow-500'
                  },
                  {
                    id: 'minimal',
                    name: 'Orange Geometric',
                    description: 'Bold geometric shapes with orange and dark blue accents. High-impact design.',
                    preview: 'bg-card border-border',
                    headerStyle: 'bg-slate-900 -mx-4 -mt-4 p-4 mb-4 text-white',
                    accentColor: 'bg-orange-500'
                  },
                ].map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className={cn(
                      "group relative cursor-pointer rounded-2xl border-4 p-6 transition-all duration-300",
                      selectedTemplate === tpl.id
                        ? "border-primary bg-primary/5 shadow-xl ring-2 ring-primary/20 scale-[1.02]"
                        : "border-transparent bg-card hover:border-muted-foreground/20 hover:shadow-lg"
                    )}
                  >
                    <div className={cn("aspect-[3/4.2] rounded-lg mb-6 border shadow-2xl flex flex-col relative overflow-hidden", tpl.preview)}>

                      {/* REAL-TIME HTML PREVIEW */}
                      {isLoadingPreviews ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-sm z-10">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </div>
                      ) : previews[tpl.id] ? (
                        <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-start justify-center">
                          <div className="w-[794px] h-[1123px] origin-top transform scale-[0.35] md:scale-[0.28] lg:scale-[0.32] xl:scale-[0.38] 2xl:scale-[0.42]">
                            <iframe
                              srcDoc={previews[tpl.id]}
                              className="w-full h-full border-none bg-card"
                              sandbox="allow-same-origin"
                              title={`${tpl.name} preview`}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col p-4">
                          {/* Fallback to stylized preview if HTML fails */}
                          {tpl.id === 'minimal' ? (
                            <div className={tpl.headerStyle}>
                              <div className="flex justify-between items-center">
                                <div className="h-5 w-5 bg-card/40 rounded-sm" />
                                <div className="text-right">
                                  <div className="text-[6px] font-bold text-white/90 uppercase tracking-tighter">TAX INVOICE</div>
                                  <div className="text-[5px] text-white/60">#INV-PREVIEW</div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className={cn("flex justify-between items-start mb-4", tpl.headerStyle)}>
                              <div className="h-6 w-6 bg-muted rounded border flex items-center justify-center">
                                <div className="h-3 w-3 bg-slate-300 rounded-sm" />
                              </div>
                              <div className="text-right">
                                <div className="text-[6px] font-bold text-primary uppercase tracking-tighter">TAX INVOICE</div>
                                <div className="text-[5px] text-slate-400">#INV-PREVIEW</div>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2 mb-4">
                            <div className="space-y-1">
                              <div className="text-[5px] font-bold text-slate-400 uppercase tracking-tighter">Bill To</div>
                              <div className="text-[6px] font-bold truncate">
                                {customers.find(c => c.id === formData.customerId)?.company || customers.find(c => c.id === formData.customerId)?.name || 'Select Customer'}
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <div className="text-[5px] font-bold text-slate-400 uppercase tracking-tighter">Details</div>
                              <div className="text-[5px]">Total: {formData.currency || currency} {summary.total.toFixed(0)}</div>
                            </div>
                          </div>

                          <div className="rounded border border-border overflow-hidden mb-3">
                            <div className={cn("h-3 w-full flex items-center px-2", tpl.accentColor)}>
                              <div className="text-[4px] text-white font-bold w-1/2">Description</div>
                              <div className="text-[4px] text-white font-bold w-1/4 text-right">Total</div>
                            </div>
                            <div className="p-1 space-y-0.5">
                              {items.slice(0, 2).map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center border-b border-slate-50 pb-0.5">
                                  <div className="text-[4px] text-muted-foreground truncate w-1/2">{item.description || 'Item Name'}</div>
                                  <div className="text-[4px] text-muted-foreground w-1/4 text-right">{(Number(item.quantity || 0) * Number(item.price || 0)).toFixed(0)}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-auto flex justify-between items-end border-t border-border pt-2">
                            <div className="h-2 w-8 border-b border-border" />
                            <div className={cn("text-[6px] font-bold px-1 py-0.5 rounded-sm text-white", tpl.accentColor)}>
                              {formData.currency || currency} {summary.total.toFixed(0)}
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedTemplate === tpl.id && (
                        <div className="absolute inset-0 bg-primary/5 flex flex-col items-center justify-center backdrop-blur-[1px] z-20 gap-4">
                          <div className="bg-primary text-white p-3 rounded-full shadow-2xl transform scale-125">
                            <Check className="h-8 w-8 stroke-[3]" />
                          </div>
                          <Button
                            type="button"
                            variant="default"
                            className="shadow-lg pointer-events-auto z-30 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              setPreviewDialogTpl(tpl.id)
                            }}
                          >
                            View Full Size
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xl">{tpl.name}</h4>
                        {selectedTemplate === tpl.id && <Badge className="bg-primary">Selected</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{tpl.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL SIZE PREVIEW DIALOG */}
      <Dialog open={!!previewDialogTpl} onOpenChange={(open) => !open && setPreviewDialogTpl(null)}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="p-4 border-b bg-background z-10">
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>Review how your generated PDF invoice will look</DialogDescription>
          </DialogHeader>
          <div
            className="flex-1 bg-muted flex justify-center py-4 sm:py-8 overflow-y-auto overflow-x-hidden"
            style={{ containerType: 'inline-size' } as React.CSSProperties}
          >
            {previewDialogTpl && previews[previewDialogTpl] && (
              <div
                className="bg-card shadow-2xl origin-top rounded-sm"
                style={{
                  width: '794px',
                  height: '1123px',
                  flexShrink: 0,
                  transform: 'scale(min(1, calc(100cqi / 850)))',
                  marginBottom: 'calc(1123px * (min(1, calc(100cqi / 850)) - 1))'
                }}
              >
                <iframe
                  srcDoc={previews[previewDialogTpl]}
                  className="w-full h-full border-none"
                  sandbox="allow-same-origin"
                  title="Full Preview"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
          setManualTaxType(null)
        }}
      />

      <CreateProductModal
        open={showCreateProduct}
        onClose={() => setShowCreateProduct(false)}
        businessId={businessId}
        onCreated={(newProd) => {
          setProducts((prev) => [...prev, newProd])
        }}
      />

      {/* Confirmation: Replace line items when SO changes */}
      <Dialog open={confirmSOOpen} onOpenChange={setConfirmSOOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Replace Line Items?</DialogTitle>
            <DialogDescription>
              Changing the linked Sales Order will replace the current line items, currency, discount and notes with data from the new Sales Order. Any manual edits will be lost. Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setConfirmSOOpen(false); setPendingSOId('') }}>
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                setConfirmSOOpen(false)
                doFetchSO(pendingSOId)
                setPendingSOId('')
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
