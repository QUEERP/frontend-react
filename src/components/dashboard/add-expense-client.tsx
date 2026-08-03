import { toast } from 'sonner';
import React, { useEffect, useState } from 'react'
import {  useNavigate, useSearchParams  } from 'react-router-dom';
import {
  Loader2Icon,
  PlusIcon,
  Building2Icon,
  CalendarIcon,
  CreditCardIcon,
  ChevronLeftIcon,
  UserIcon,
  FileTextIcon,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select'
import { contactsAPI, Customer } from '@/lib/api/contacts'
import { quotationsAPI, Quotation } from '@/lib/api/quotations'
import { invoicesAPI, Invoice } from '@/lib/api/invoices'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { useToast } from '@/components/ui/use-toast'
import { DashboardPageSkeleton } from '@/components/dashboard/dashboard-page-skeleton'
import { CurrencySelect } from '@/components/dashboard/currency-select'

type VendorOption = {
  id: string
  name: string
}

type ExpenseItem = {
  id: string
  itemName: string
  description: string
  quantity: number
  rate: number
  taxPercent: number
  amount: number
}

type CreateFormData = {
  title: string
  amount: string
  currency: string
  category: string
  paymentMethod: string
  date: string
  notes: string
  vendorId: string
  customerId?: string
  referenceType?: string
  referenceId?: string
  projectId?: string
}

const CATEGORY_OPTIONS = [
  'Office Supplies',
  'Rent',
  'Utilities',
  'Travel',
  'Marketing',
  'Software',
  'Hardware',
  'Salary',
  'Insurance',
  'Maintenance',
  'Other',
]

const PAYMENT_METHOD_OPTIONS = [
  'Cash',
  'Bank Transfer',
  'Credit Card',
  'Debit Card',
  'Cheque',
  'Online',
  'Other',
]

export function AddExpenseClient({ businessId }: { businessId: string }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialQuotationId = searchParams.get('quotationId')
  const initialInvoiceId = searchParams.get('invoiceId')
  const initialCustomerId = searchParams.get('customerId')
  const initialProjectId = searchParams.get('projectId')
  const { toast } = useToast()
  const { loading: businessLoading, currencySymbol, business } = useBusinessData()

  const isBasic = business?.businessType?.toLowerCase() === 'basic'
  const [items, setItems] = useState<ExpenseItem[]>([])
  
  const addItem = () => setItems([...items, { id: Date.now().toString(), itemName: '', description: '', quantity: 1, rate: 0, taxPercent: 0, amount: 0 }])
  const removeItem = (id: string) => {
    const newItems = items.filter(i => i.id !== id)
    setItems(newItems)
    if (isBasic) {
      const total = newItems.reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
      setFormData(prev => ({ ...prev, amount: total.toString() }))
    }
  }
  const updateItem = (id: string, field: keyof ExpenseItem, val: any) => {
    const newItems = items.map(i => i.id === id ? { ...i, [field]: val } : i)
    // auto-calculate amount if q, rate, tax change
    if (['quantity', 'rate', 'taxPercent'].includes(field)) {
      newItems.forEach(item => {
        const q = Number(item.quantity) || 0;
        const r = Number(item.rate) || 0;
        const t = Number(item.taxPercent) || 0;
        item.amount = q * r + (q * r * t / 100);
      });
    }

    setItems(newItems)
    if (isBasic) {
      const total = newItems.reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
      setFormData(prev => ({ ...prev, amount: total.toString() }))
    }
  }

  const [vendors, setVendors] = useState<VendorOption[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [referenceProjectName, setReferenceProjectName] = useState<string>('')

  const [formData, setFormData] = useState<CreateFormData>({
    title: '',
    amount: '',
    currency: business?.currency || 'AED',
    category: '',
    paymentMethod: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    vendorId: '',
    customerId: initialCustomerId || '',
    referenceType: initialQuotationId ? 'Quotation' : initialInvoiceId ? 'Invoice' : initialProjectId ? 'Project' : '',
    referenceId: initialQuotationId || initialInvoiceId || initialProjectId || '',
    projectId: initialProjectId || '',
  })

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(
      new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\\^])/g, '\\$1') + '=([^;]*)'),
    )
    return match ? decodeURIComponent(match[1]) : ''
  }

  useEffect(() => {
    const fetchVendors = async () => {
      const token = getCookie('token') || getCookie('accessToken')
      if (!token) return

      try {
        const res = await fetch(`${API_BASE}/api/purchase/vendors?limit=1000`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-business-id': businessId,
          },
        })
        const data = await res.json()
        if (res.ok && data?.success) {
          const vendorsArray = data?.vendors || data?.data || []
          const vendorRows = (Array.isArray(vendorsArray) ? vendorsArray : []).map((item: any) => ({
            id: String(item?.id || ''),
            name: String(item?.name || item?.company || ''),
          }))
          setVendors(vendorRows)
        }
      } catch (err) {
        console.error('Failed to load vendors', err)
      }
    }
    
    if (!businessLoading) {
      fetchVendors()
    }
  }, [businessLoading, API_BASE, businessId])

  const [customers, setCustomers] = useState<Customer[]>([])
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])

  useEffect(() => {
    if (businessLoading) return;
    if (!isBasic) return;

    const init = async () => {
      // Load customers, quotations, invoices, and the initial quotation all in parallel
      const [customersRes, quotationsRes, invoicesRes, quotationRes] = await Promise.all([
        contactsAPI.getCustomers(businessId).catch(() => ({ customers: [] as Customer[] })),
        quotationsAPI.getQuotations(businessId).catch(() => ({ quotations: [] as Quotation[] })),
        invoicesAPI.getInvoices(businessId).catch(() => ({ invoices: [] as Invoice[] })),
        initialQuotationId
          ? quotationsAPI.getQuotationById(businessId, initialQuotationId).catch(() => null)
          : Promise.resolve(null),
      ]);

      const allCustomers: Customer[] = (customersRes as any).customers || [];
      const allQuotations = (quotationsRes as any).quotations || [];
      const allInvoices = (invoicesRes as any).invoices || [];

      // Get the specific quotation we came from
      const quote = quotationRes
        ? ((quotationRes as any).quotation || (quotationRes as any).data)
        : null;

      // Build quotations list — merge the specific quote in case it's not in the full list
      let mergedQuotations = [...allQuotations];
      if (quote && !mergedQuotations.find((q: any) => q.id === quote.id)) {
        mergedQuotations = [quote, ...mergedQuotations];
      }

      // Build customers list — check if the customer from URL param is in the list
      // If not (e.g. over 100 customer limit), add the embedded customer from the quotation
      let mergedCustomers = [...allCustomers];
      const targetCustomerId = initialCustomerId || quote?.customerId;
      if (targetCustomerId) {
        const alreadyInList = mergedCustomers.find((c: any) => c.id === targetCustomerId);
        if (!alreadyInList && quote?.customer) {
          mergedCustomers = [quote.customer as Customer, ...mergedCustomers];
        }
      }

      // Set all state at once
      setCustomers(mergedCustomers);
      setQuotations(mergedQuotations);
      setInvoices(allInvoices);

      // Pre-fill the form — customerId from URL param, quotation from the fetched quote
      const prefilledCustomerId = initialCustomerId || quote?.customerId || '';
      if (prefilledCustomerId || quote) {
        setFormData(prev => ({
          ...prev,
          customerId: prefilledCustomerId || prev.customerId,
          referenceType: quote ? 'Quotation' : prev.referenceType,
          referenceId: quote ? quote.id : prev.referenceId,
          currency: quote?.currency || prev.currency,
        }));
      }
    };

    init();
  }, [businessLoading, isBasic, businessId, initialQuotationId, initialCustomerId])

  useEffect(() => {
    const fetchReferenceItems = async () => {
      if (!isBasic || !formData.referenceId || !formData.referenceType) {
        return;
      }
      try {
        let fetchedItems: any[] = [];
        if (formData.referenceType === 'Quotation') {
          const res = await quotationsAPI.getQuotationById(businessId, formData.referenceId);
          const quote = res.quotation || (res as any).data;
          if (res.success && quote?.items) {
             fetchedItems = quote.items;
             setFormData(prev => ({ 
               ...prev, 
               title: prev.title || `Expense for Quotation: ${quote.quoteNumber || quote.id}` 
             }));
          }
        } else if (formData.referenceType === 'Invoice') {
          const res = await invoicesAPI.getInvoiceById(businessId, formData.referenceId);
          const inv = res.invoice || (res as any).data;
          if (res.success && inv?.items) {
             fetchedItems = inv.items;
          }
        } else if (formData.referenceType === 'Project') {
          const token = getCookie('token') || getCookie('accessToken');
          const res = await fetch(`${API_BASE}/api/projects/${formData.referenceId}`, {
             headers: { Authorization: `Bearer ${token}`, 'x-business-id': businessId }
          });
          const projData = await res.json();
          const proj = projData.project || projData.data;
          
          if (projData.success && proj) {
             setFormData(prev => ({ 
               ...prev, 
               title: prev.title || `Expense for Project: ${proj.projectCode || proj.id}` 
             }));
             let currencyToSet = proj.currency;
             
             // If project has a quotation, fetch it to get the line items and currency
             if (proj.quotationId) {
               try {
                 const quotRes = await fetch(`${API_BASE}/api/quotation/${proj.quotationId}`, { 
                   headers: { Authorization: `Bearer ${token}`, 'x-business-id': businessId } 
                 });
                 const quotData = await quotRes.json();
                 const quote = quotData.quotation || quotData.data;
                 if (quote?.items) {
                   fetchedItems = quote.items;
                 }
                 if (quote?.currency) {
                   currencyToSet = quote.currency;
                 }
               } catch (err) {
                 console.error('Failed to fetch project quotation', err);
               }
             }
             
             // If no items were fetched from a quotation, attempt to use the project's direct items
             if ((!fetchedItems || fetchedItems.length === 0) && proj.items?.length > 0) {
               fetchedItems = proj.items;
             }

             setFormData(prev => ({ 
               ...prev, 
               customerId: prev.customerId || proj.customerId || '',
               currency: currencyToSet || prev.currency,
             }));
             if (proj.customerId && proj.customer) {
               setCustomers(prev => prev.find(c => c.id === proj.customerId) ? prev : [proj.customer, ...prev]);
             }
             setReferenceProjectName(proj.projectCode || proj.projectName || proj.id);
          }
        }

        if (fetchedItems.length > 0) {
          const newExpenseItems: ExpenseItem[] = fetchedItems.map(item => {
             const qty = Number(item.quantity) || 1;
             const rate = Number(item.price || item.rate) || 0;
             const tax = Number(item.taxPercent) || 0;
             return {
                id: Date.now().toString() + Math.random().toString(),
                itemName: item.itemName || item.description?.substring(0, 20) || 'Item',
                description: item.description || '',
                quantity: qty,
                rate: rate,
                taxPercent: tax,
                amount: item.total || (qty * rate + (qty * rate * tax / 100))
             };
          });
          
          setItems(newExpenseItems);
          const total = newExpenseItems.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
          setFormData(prev => ({ ...prev, amount: total.toString() }));
        }
      } catch (err) {
        console.error("Failed to fetch reference details", err);
      }
    };

    fetchReferenceItems();
  }, [formData.referenceId, formData.referenceType, businessId, isBasic]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast({ title: 'Validation error', description: 'Title is required.', variant: 'destructive' })
      return
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast({ title: 'Validation error', description: 'Amount must be greater than 0.', variant: 'destructive' })
      return
    }
    if (!isBasic && !formData.category) {
      toast({ title: 'Validation error', description: 'Category is required.', variant: 'destructive' })
      return
    }
    if (!formData.paymentMethod) {
      toast({ title: 'Validation error', description: 'Payment method is required.', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const token = getCookie('token') || getCookie('accessToken')
      const body: Record<string, any> = {
        title: formData.title.trim(),
        amount: Number(formData.amount),
        currency: formData.currency,
        category: isBasic ? 'Basic' : formData.category,
      }
      if (isBasic && items.length > 0) {
        body.items = items;
      }
      if (formData.paymentMethod) body.paymentMethod = formData.paymentMethod
      if (formData.date) body.date = formData.date
      if (formData.notes.trim()) body.notes = formData.notes.trim()
      if (formData.vendorId) body.vendorId = formData.vendorId
      if (formData.customerId) body.customerId = formData.customerId
      if (formData.referenceType) body.referenceType = formData.referenceType
      if (formData.referenceId) body.referenceId = formData.referenceId
      if (formData.projectId) body.projectId = formData.projectId

      const res = await fetch(`${API_BASE}/api/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to create expense')
      }

      toast({ title: 'Expense created', description: 'Expense has been recorded successfully.' })
      if (formData.projectId) {
        navigate(`/dashboard/${businessId}/project-operations/projects/${formData.projectId}`)
      } else {
        navigate(`/dashboard/${businessId}/expenses`)
      }
    } catch (err: any) {
      toast({
        title: 'Failed to create expense',
        description: err?.message || 'Unknown error',
        variant: 'destructive',
      })
      setSubmitting(false)
    }
  }

  if (businessLoading) {
    return <DashboardPageSkeleton />
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto pb-24 pt-4 px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col gap-4">
        <div>
          <Button 
            variant="ghost" 
            onClick={() => {
              if (formData.projectId) {
                navigate(`/dashboard/${businessId}/project-operations/projects/${formData.projectId}`)
              } else {
                navigate(`/dashboard/${businessId}/expenses`)
              }
            }}
            className="h-9 px-3 rounded-xl hover:bg-slate-200 text-muted-foreground -ml-3"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Back to Expenses
          </Button>
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Create Expense</h1>
          <p className="text-muted-foreground">Record a new business expense in your ledger. Fields marked with * are required.</p>
        </div>
      </div>

      <Card className="rounded-2xl border border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm overflow-visible">
        <form onSubmit={handleCreate} className="flex flex-col">
          <div className="flex flex-col p-6 md:p-8 space-y-8">
            
            <div className="space-y-2">
              <Label className="text-foreground font-semibold">Title *</Label>
              <Input
                type="text"
                placeholder="Enter expense title (e.g. Office Supplies)"
                className="h-11 rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                disabled={submitting}
              />
            </div>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-foreground font-semibold">Amount *</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">
                    {formData.currency}
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    className="h-11 pl-12 rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20"
                    value={formData.amount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-semibold">Currency</Label>
                <CurrencySelect
                  value={formData.currency}
                  onValueChange={(val) => setFormData(prev => ({...prev, currency: val}))}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-foreground font-semibold">Date</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="date"
                    className="h-11 pl-12 rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
              {!isBasic && (<div className="space-y-2">
                <Label className="text-foreground font-semibold">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                  disabled={submitting}
                >
                  <SelectTrigger className="h-11 rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {CATEGORY_OPTIONS.map((cat) => (
                      <SelectItem key={cat} value={cat} className="rounded-lg">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>)}

              <div className="space-y-2">
                <Label className="text-foreground font-semibold">Payment Method *</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, paymentMethod: value }))}
                  disabled={submitting}
                >
                  <SelectTrigger className="h-11 rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20">
                    <div className="flex items-center gap-2">
                      <CreditCardIcon className="size-4 text-muted-foreground" />
                      <SelectValue placeholder="Select method" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {PAYMENT_METHOD_OPTIONS.map((method) => (
                      <SelectItem key={method} value={method} className="rounded-lg">
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-semibold">Vendor (Optional)</Label>
              <Select
                value={formData.vendorId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, vendorId: value === '__none__' ? '' : value }))}
                disabled={submitting}
              >
                <SelectTrigger className="h-11 rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20">
                  <div className="flex items-center gap-2">
                    <Building2Icon className="size-4 text-muted-foreground" />
                    <SelectValue placeholder="Select vendor" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="__none__" className="rounded-lg">No vendor</SelectItem>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id} className="rounded-lg">
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isBasic && (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-foreground font-semibold">Customer (Optional)</Label>
                  <Select
                    value={formData.customerId || '__none__'}
                    onValueChange={(val) => {
                      setFormData(prev => ({
                        ...prev, 
                        customerId: val === '__none__' ? '' : val,
                        referenceType: '',
                        referenceId: ''
                      }))
                    }}
                  >
                    <SelectTrigger className="h-11 rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20">
                      <div className="flex items-center gap-2">
                        <UserIcon className="size-4 text-muted-foreground" />
                        <SelectValue placeholder="Select Customer" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-60">
                      <SelectItem value="__none__">No Customer</SelectItem>
                      {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.company || c.name || c.id}</SelectItem>)}
                      {/* Fallback: show pre-filled customer even if list hasn't loaded yet */}
                      {formData.customerId && formData.customerId !== '__none__' && !customers.find(c => c.id === formData.customerId) && (
                        <SelectItem value={formData.customerId}>Loading customer...</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-foreground font-semibold">Reference (Optional)</Label>
                  <Select
                    disabled={(!formData.customerId && formData.referenceType !== 'Project') || submitting}
                    value={formData.referenceId ? `${formData.referenceType}|${formData.referenceId}` : '__none__'}
                    onValueChange={(val) => {
                      if (val === '__none__') {
                        setFormData(prev => ({ ...prev, referenceType: '', referenceId: '' }))
                      } else {
                        const [type, id] = val.split('|')
                        setFormData(prev => ({ ...prev, referenceType: type, referenceId: id }))
                      }
                    }}
                  >
                    <SelectTrigger className="h-11 rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20">
                      <div className="flex items-center gap-2">
                        <FileTextIcon className="size-4 text-muted-foreground" />
                        <SelectValue placeholder={formData.customerId || formData.referenceType === 'Project' ? "Select Reference" : "Select Customer First"} />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-60">
                      <SelectItem value="__none__">None</SelectItem>
                      <SelectGroup>
                        <SelectLabel>Quotations</SelectLabel>
                        {quotations.filter(q => q.customerId === formData.customerId || q.id === formData.referenceId).map(q => (
                          <SelectItem key={`Quotation|${q.id}`} value={`Quotation|${q.id}`}>{q.quoteNumber || 'Quotation'}</SelectItem>
                        ))}
                        {formData.referenceType === 'Quotation' && formData.referenceId && !quotations.find(q => q.id === formData.referenceId) && (
                          <SelectItem key={`Quotation|${formData.referenceId}`} value={`Quotation|${formData.referenceId}`}>
                            Selected Quotation
                          </SelectItem>
                        )}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Invoices</SelectLabel>
                        {invoices.filter(i => i.customerId === formData.customerId).map(i => (
                          <SelectItem key={`Invoice|${i.id}`} value={`Invoice|${i.id}`}>{i.invoiceNumber}</SelectItem>
                        ))}
                      </SelectGroup>
                      
                      <SelectGroup>
                        <SelectLabel>Projects</SelectLabel>
                        {projects.filter(p => !formData.customerId || p.customerId === formData.customerId).map(p => (
                          <SelectItem key={`Project|${p.id}`} value={`Project|${p.id}`}>{p.projectName || p.projectCode}</SelectItem>
                        ))}
                      </SelectGroup>
                      {formData.referenceType === 'Project' && formData.referenceId && !projects.find(p => p.id === formData.referenceId) && (
                        <SelectGroup>
                          <SelectLabel>Project</SelectLabel>
                          <SelectItem key={`Project|${formData.referenceId}`} value={`Project|${formData.referenceId}`}>
                            {referenceProjectName || 'Selected Project'}
                          </SelectItem>
                        </SelectGroup>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-foreground font-semibold">Notes</Label>
              <Textarea
                placeholder="Add any internal remarks or notes..."
                rows={4}
                className="rounded-xl resize-none transition-all focus:ring-2 focus:ring-blue-500/20 text-[15px]"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                disabled={submitting}
              />
            </div>

            {isBasic && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <Label className="text-foreground font-semibold">Line Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem} disabled={submitting}>
                    <PlusIcon className="w-4 h-4 mr-1" /> Add Item
                  </Button>
                </div>
                <div className="space-y-3">
                  {items.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-xl">
                      No line items added yet. Click "Add Item".
                    </div>
                  )}
                  {items.map((item, index) => (
                    <div key={item.id} className="flex gap-2 items-start bg-slate-50/50 dark:bg-slate-800/30 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="w-1/4 space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground ml-1">Item Name</Label>
                        <Input
                          placeholder="Name"
                          value={item.itemName || ''}
                          onChange={(e) => updateItem(item.id, 'itemName', e.target.value)}
                          disabled={submitting}
                          className="rounded-lg h-9 text-sm"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground ml-1">Description</Label>
                        <Input
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          disabled={submitting}
                          className="rounded-lg h-9 text-sm"
                        />
                      </div>
                      <div className="w-20 space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground ml-1">Qty</Label>
                        <Input
                          type="number"
                          placeholder="1"
                          value={item.quantity || ''}
                          onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                          disabled={submitting}
                          className="rounded-lg h-9 text-sm px-2"
                        />
                      </div>
                      <div className="w-24 space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground ml-1">Rate</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={item.rate || ''}
                          onChange={(e) => updateItem(item.id, 'rate', e.target.value)}
                          disabled={submitting}
                          className="rounded-lg h-9 text-sm px-2"
                        />
                      </div>
                      <div className="w-20 space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground ml-1">Tax %</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={item.taxPercent || ''}
                          onChange={(e) => updateItem(item.id, 'taxPercent', e.target.value)}
                          disabled={submitting}
                          className="rounded-lg h-9 text-sm px-2"
                        />
                      </div>
                      <div className="w-28 space-y-1 relative">
                        <Label className="text-[10px] uppercase text-muted-foreground ml-1">Amount</Label>
                        <Input
                          type="number"
                          value={item.amount === 0 ? '' : item.amount}
                          onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                          disabled={submitting}
                          className="rounded-lg h-9 text-sm px-2 bg-slate-100 dark:bg-slate-900 border font-semibold text-right text-muted-foreground"
                        />
                      </div>
                      <div className="w-10 flex items-center justify-center pt-[22px]">
                        <Button
                          type="button"
                          variant="ghost"
                          className="size-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          onClick={() => removeItem(item.id)}
                          disabled={submitting}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="p-6 border-t border-border flex justify-end gap-3 bg-muted/90 sticky bottom-0 z-20 backdrop-blur-md rounded-b-2xl shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.05)]">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                if (formData.projectId) {
                  navigate(`/dashboard/${businessId}/project-operations/projects/${formData.projectId}`)
                } else {
                  navigate(`/dashboard/${businessId}/expenses`)
                }
              }} 
              disabled={submitting} 
              className="h-11 px-8 rounded-xl border-border font-semibold hover:bg-card text-[15px]"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitting} 
              className="h-11 px-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 shadow-sm transition-all text-[15px]"
            >
              {submitting ? <Loader2Icon className="size-4 animate-spin" /> : <PlusIcon className="size-4" />}
              {submitting ? 'Creating Expense...' : 'Create Expense'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
