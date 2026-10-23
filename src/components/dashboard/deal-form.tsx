import * as React from 'react'
import { contactsAPI, Contact, Customer } from '@/lib/api/contacts'
import { DEAL_STAGES, CreateDealData } from '@/lib/api/deals'
import { BusinessUser, usersAPI } from '@/lib/api/users'
import { leadsAPI, Lead } from '@/lib/api/leads'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, UserPlus, Check, ChevronsUpDown, X, Sparkles } from 'lucide-react'
import { CreateCustomerModal } from '@/components/dashboard/create-customer-modal'
import { toast } from 'sonner'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { CURRENCIES, getCurrencyByCountry, getCurrencySymbol } from '@/lib/currencies'

interface DealFormProps {
  businessId: string
  title: string
  description: string
  submitLabel: string
  initialData?: Partial<CreateDealData>
  onSubmit: (data: CreateDealData) => Promise<void>
  showLeadDropdown?: boolean
}

const LEAD_SOURCES = [
  'Website', 'Social Media', 'Facebook', 'Instagram', 'LinkedIn', 'Google Search',
  'Google Ads', 'Referral', 'Existing Customer', 'Walk-in', 'Cold Call', 'Email Campaign',
  'WhatsApp', 'Trade Show', 'Exhibition', 'Partner', 'Distributor', 'Marketplace',
  'Newspaper', 'Television', 'Radio', 'Other'
]

const DEFAULT_FORM_DATA: CreateDealData = {
  name: '',
  amount: 0,
  customerId: '',
  contactId: '',
  assignedToId: '',
  stage: 'New',
  expectedCloseDate: '',
  probability: undefined,
  source: '',
  description: '',
  currency: 'INR',
  leadId: '',
}

export function DealForm({
  businessId,
  title,
  description,
  submitLabel,
  initialData,
  onSubmit,
  showLeadDropdown = true,
}: DealFormProps) {
  const [formData, setFormData] = React.useState<CreateDealData>({
    ...DEFAULT_FORM_DATA,
    ...initialData,
    currency: initialData?.currency || DEFAULT_FORM_DATA.currency || 'INR',
  })
  const { business } = useBusinessData()
  const [customers, setCustomers] = React.useState<Customer[]>([])
  const [contacts, setContacts] = React.useState<Contact[]>([])
  const [loadingContacts, setLoadingContacts] = React.useState(false)
  const [users, setUsers] = React.useState<BusinessUser[]>([])
  const [loadingLookups, setLoadingLookups] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [showCreateCustomer, setShowCreateCustomer] = React.useState(false)

  // Lead dropdown state
  const [leads, setLeads] = React.useState<Lead[]>([])
  const [loadingLeads, setLoadingLeads] = React.useState(false)
  const [selectedLeadId, setSelectedLeadId] = React.useState<string>(initialData?.leadId || '')

  // Popover open states
  const [openSource, setOpenSource] = React.useState(false)
  const [openCurrency, setOpenCurrency] = React.useState(false)

  React.useEffect(() => {
    setFormData({
      ...DEFAULT_FORM_DATA,
      ...initialData,
      currency: initialData?.currency || DEFAULT_FORM_DATA.currency || 'INR',
    })
    if (initialData?.leadId !== undefined) {
      setSelectedLeadId(initialData.leadId)
    }
  }, [initialData])

  React.useEffect(() => {
    if (!showLeadDropdown) return
    const loadLeads = async () => {
      try {
        setLoadingLeads(true)
        const res = await leadsAPI.getAllLeads(businessId, { type: 'LEAD', limit: 500 })
        if (res.success && Array.isArray(res.data)) {
          setLeads(res.data)
        }
      } catch (err) {
        console.error('Failed to load leads for deal form:', err)
      } finally {
        setLoadingLeads(false)
      }
    }
    loadLeads()
  }, [businessId, showLeadDropdown])

  const availableLeads = React.useMemo(() => {
    return leads.filter((l) => {
      if (selectedLeadId && l.id === selectedLeadId) return true
      const hasDeal = Boolean(l.conversionLog?.dealId)
      return !hasDeal
    })
  }, [leads, selectedLeadId])

  const handleLeadChange = (newLeadId: string) => {
    if (newLeadId === 'none' || !newLeadId) {
      setSelectedLeadId('')
      setFormData(prev => ({
        ...prev,
        leadId: undefined,
      }))
      return
    }

    setSelectedLeadId(newLeadId)
    const chosenLead = leads.find(l => l.id === newLeadId)
    if (!chosenLead) return

    let targetCustomerId = chosenLead.customerId || ''
    if (!targetCustomerId && (chosenLead.company || chosenLead.name)) {
      const nameToMatch = (chosenLead.company || chosenLead.name || '').trim().toLowerCase()
      const matchedCustomer = customers.find(c => 
        (c.company || c.name || '').trim().toLowerCase() === nameToMatch
      )
      if (matchedCustomer) {
        targetCustomerId = matchedCustomer.id
      }
    }

    const closeDate = (chosenLead as any).expectedDecisionDate
      ? new Date((chosenLead as any).expectedDecisionDate).toISOString().split('T')[0]
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    setFormData(prev => ({
      ...prev,
      leadId: chosenLead.id,
      name: prev.name && prev.name !== 'Delton' && !prev.name.endsWith(' - Deal')
        ? prev.name
        : (chosenLead.company ? `${chosenLead.company} - Deal` : `${chosenLead.name} - Deal`),
      amount: chosenLead.leadValue ? Number(chosenLead.leadValue) : prev.amount,
      currency: chosenLead.currency || prev.currency || 'INR',
      source: chosenLead.source || prev.source,
      description: chosenLead.description || prev.description || '',
      assignedToId: chosenLead.assignedToId || prev.assignedToId,
      expectedCloseDate: prev.expectedCloseDate || closeDate,
      customerId: targetCustomerId || prev.customerId,
    }))
  }

  React.useEffect(() => {
    const loadLookups = async () => {
      setLoadingLookups(true)

      const [customersResult, usersResult] = await Promise.allSettled([
        contactsAPI.getCustomers(businessId),
        usersAPI.getBusinessUsers(businessId),
      ])

      if (customersResult.status === 'fulfilled') {
        setCustomers(customersResult.value.customers || [])
      } else {
        setCustomers([])
        toast.error(
          customersResult.reason instanceof Error
            ? customersResult.reason.message
            : 'Failed to load customers',
        )
      }

      if (usersResult.status === 'fulfilled') {
        setUsers(Array.isArray(usersResult.value.data) ? usersResult.value.data : [])
      } else {
        setUsers([])
      }

      setLoadingLookups(false)
    }

    loadLookups()
  }, [businessId])

  React.useEffect(() => {
    const customerId = formData.customerId
    if (!customerId) {
      setContacts([])
      setLoadingContacts(false)
      return
    }

    // Clear old contact options immediately when customer changes.
    setContacts([])
    setLoadingContacts(true)

    const loadContacts = async () => {
      try {
        const response = await contactsAPI.getContacts(businessId, customerId)
        const safeContacts = (response.contacts || []).filter(
          (contact) => contact.customerId === customerId,
        )
        setContacts(safeContacts)
      } catch (error) {
        setContacts([])
        toast.error(error instanceof Error ? error.message : 'Failed to load contacts')
      } finally {
        setLoadingContacts(false)
      }
    }

    loadContacts()
  }, [businessId, formData.customerId])

    // Contact clearing on customer change is handled in the Select onValueChange handler.


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!formData.name.trim() || !formData.customerId || !formData.amount) {
      toast.error('Name, amount and customer are required')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        name: formData.name.trim(),
        amount: Number(formData.amount),
        customerId: formData.customerId,
        contactId: formData.contactId || undefined,
        assignedToId: formData.assignedToId || undefined,
        stage: formData.stage,
        expectedCloseDate: formData.expectedCloseDate || undefined,
        probability:
          typeof formData.probability === 'number' && !Number.isNaN(formData.probability)
            ? formData.probability
            : undefined,
        source: formData.source?.trim() || undefined,
        description: formData.description?.trim() || undefined,
        currency: formData.currency?.trim() || 'INR',
        leadId: formData.leadId || selectedLeadId || undefined,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save deal')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="border-border bg-card shadow-sm overflow-hidden rounded-xl w-full max-w-none">
      <CardHeader className="border-b border-border bg-muted/50 pb-5 pt-6 px-8">
        <CardTitle className="text-xl font-bold text-foreground">{title}</CardTitle>
        <p className="text-sm font-medium text-muted-foreground mt-1">{description}</p>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-10">

          {/* Lead Selector for Add Deal */}
          {showLeadDropdown && (
            <div className="space-y-3 p-5 rounded-2xl border border-blue-100 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900/40">
              <div className="flex items-center justify-between">
                <Label htmlFor="leadSelect" className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  Lead
                </Label>
                {selectedLeadId && (
                  <button
                    type="button"
                    onClick={() => handleLeadChange('none')}
                    className="text-xs text-muted-foreground hover:text-foreground font-semibold cursor-pointer transition-colors"
                  >
                    Clear Lead
                  </button>
                )}
              </div>
              <Select
                value={selectedLeadId || 'none'}
                onValueChange={handleLeadChange}
                disabled={loadingLeads}
              >
                <SelectTrigger id="leadSelect" className="w-full rounded-xl border-border bg-card h-11 focus:ring-blue-500 shadow-sm font-medium">
                  <SelectValue placeholder={loadingLeads ? "Loading available leads..." : "Select lead..."} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border shadow-lg max-h-72">
                  <SelectItem value="none" className="cursor-pointer text-muted-foreground font-medium">
                    No lead (Direct Deal)
                  </SelectItem>
                  {availableLeads.map((l) => (
                    <SelectItem key={l.id} value={l.id} className="cursor-pointer">
                      <span className="font-semibold text-foreground">{l.name}</span>
                      {l.company && <span className="text-muted-foreground"> · {l.company}</span>}
                      {l.leadValue && l.leadValue > 0 ? (
                        <span className="text-emerald-600 font-semibold text-xs ml-2">
                          ({getCurrencySymbol(l.currency)} {Number(l.leadValue).toLocaleString()})
                        </span>
                      ) : null}
                      {l.customerId && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded ml-2 font-medium">
                          Customer linked
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Showing active leads not yet converted to deals. Selecting a lead auto-fills opportunity details, values, and customer accounts.
              </p>
            </div>
          )}

          <div className="space-y-6">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">Core Information</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-foreground">Deal Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Website redesign retainer"
                  className="rounded-xl border-border bg-muted/50 h-11 focus-visible:ring-blue-500 shadow-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-semibold text-foreground">Amount *</Label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold text-sm">
                      {getCurrencySymbol(formData.currency) || '₹'}
                    </span>
                  </div>
                  <Input
                    id="amount"
                    type="text"
                    inputMode="decimal"
                    value={formData.amount || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d.]/g, '');
                      const parts = val.split('.');
                      const finalVal = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : val;
                      setFormData((prev) => ({
                        ...prev,
                        amount: finalVal as unknown as number,
                      }))
                    }}
                    placeholder="25000"
                    style={{
                      paddingLeft: `${Math.max(2.4, (getCurrencySymbol(formData.currency) || '₹').length * 0.75 + 1.2)}rem`
                    }}
                    className="rounded-xl border-border bg-muted/50 h-11 focus-visible:ring-blue-500 shadow-sm"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2 flex flex-col">
                <Label htmlFor="currency" className="text-sm font-semibold text-foreground">Currency</Label>
                <Popover open={openCurrency} onOpenChange={setOpenCurrency}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCurrency}
                      className={cn(
                        "w-full justify-between rounded-xl border-border bg-muted/50 h-11 focus:ring-blue-500 shadow-sm font-normal",
                        !formData.currency && "text-muted-foreground"
                      )}
                    >
                      {formData.currency
                        ? (() => {
                            const curr = CURRENCIES.find((c) => c.code.toUpperCase() === (formData.currency || '').toUpperCase())
                            return curr ? `${curr.flag} ${curr.code} - ${curr.name} (${curr.symbol})` : formData.currency
                          })()
                        : "Select currency"}
                      <div className="flex items-center gap-1">
                        {formData.currency && (
                          <div
                            role="button"
                            className="px-1 hover:text-foreground text-muted-foreground"
                            onClick={(e) => {
                              e.stopPropagation()
                              setFormData((prev) => ({ ...prev, currency: 'INR' }))
                            }}
                          >
                            <X className="h-4 w-4" />
                          </div>
                        )}
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-border shadow-lg pointer-events-auto" align="start">
                    <Command>
                      <CommandInput placeholder="Search currency..." />
                      <CommandList>
                        <CommandEmpty>No currency found.</CommandEmpty>
                        <CommandGroup>
                          {CURRENCIES.map((curr) => (
                            <CommandItem
                              key={curr.code}
                              value={`${curr.code} ${curr.name}`}
                              onSelect={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  currency: curr.code
                                }))
                                setOpenCurrency(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.currency === curr.code ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {curr.flag} {curr.code} - {curr.name} ({curr.symbol})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">Customer & Contact</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customerId" className="text-sm font-semibold text-foreground">Customer *</Label>
                <Select
                  value={formData.customerId}
                  onValueChange={(value) => {
                    setFormData((prev) => {
                      const updates: any = { customerId: value, contactId: '' };
                      const selectedCustomer = customers.find(c => c.id === value);
                      if (selectedCustomer?.country) {
                        const newCurrency = getCurrencyByCountry(selectedCustomer.country);
                        if (newCurrency) updates.currency = newCurrency;
                      }
                      return { ...prev, ...updates };
                    });
                  }}
                  disabled={loadingLookups}
                >
                  <SelectTrigger id="customerId" className="w-full rounded-xl border-border bg-muted/50 h-11 focus:ring-blue-500 shadow-sm">
                    <SelectValue placeholder={loadingLookups ? 'Loading customers...' : 'Select customer'} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border shadow-lg">
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id} className="cursor-pointer focus:bg-muted">
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactId" className="text-sm font-semibold text-foreground">Contact Person</Label>
                <Select
                  value={formData.contactId || 'none'}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      contactId: value === 'none' ? '' : value,
                    }))
                  }
                  disabled={!formData.customerId || loadingContacts}
                >
                  <SelectTrigger id="contactId" className="w-full rounded-xl border-border bg-muted/50 h-11 focus:ring-blue-500 shadow-sm">
                    <SelectValue
                      placeholder={
                        !formData.customerId
                          ? 'Choose customer first'
                          : loadingContacts
                            ? 'Loading contacts...'
                            : 'Select contact'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border shadow-lg">
                    <SelectItem value="none" className="cursor-pointer focus:bg-muted">No contact</SelectItem>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id} className="cursor-pointer focus:bg-muted">
                        {contact.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">Assignment & Stage</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="assignedToId" className="text-sm font-semibold text-foreground">Assigned To</Label>
                <Select
                  value={formData.assignedToId || 'none'}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      assignedToId: value === 'none' ? '' : value,
                    }))
                  }
                  disabled={loadingLookups}
                >
                  <SelectTrigger id="assignedToId" className="w-full rounded-xl border-border bg-muted/50 h-11 focus:ring-blue-500 shadow-sm">
                    <SelectValue placeholder={loadingLookups ? 'Loading users...' : 'Select user'} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border shadow-lg">
                    <SelectItem value="none" className="cursor-pointer focus:bg-muted">Unassigned</SelectItem>
                    {users.map((member) => (
                      <SelectItem key={member.id} value={member.id} className="cursor-pointer focus:bg-muted">
                        {member.user?.name || member.user?.email || 'Unknown user'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stage" className="text-sm font-semibold text-foreground">Pipeline Stage</Label>
                <Select
                  value={formData.stage || 'New'}
                  onValueChange={(value: (typeof DEAL_STAGES)[number]) =>
                    setFormData((prev) => ({ ...prev, stage: value }))
                  }
                >
                  <SelectTrigger id="stage" className="w-full rounded-xl border-border bg-muted/50 h-11 focus:ring-blue-500 shadow-sm">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border shadow-lg">
                    {DEAL_STAGES.map((stage) => (
                      <SelectItem key={stage} value={stage} className="cursor-pointer focus:bg-muted font-medium">
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">Forecasting & Tracking</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="expectedCloseDate" className="text-sm font-semibold text-foreground">Expected Close Date</Label>
                <Input
                  id="expectedCloseDate"
                  type="date"
                  value={formData.expectedCloseDate || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, expectedCloseDate: e.target.value }))
                  }
                  className="rounded-xl border-border bg-muted/50 h-11 focus-visible:ring-blue-500 shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="probability" className="text-sm font-semibold text-foreground">Win Probability (%)</Label>
                <Input
                  id="probability"
                  type="text"
                  inputMode="numeric"
                  value={formData.probability ?? ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^\d]/g, '');
                    let num = val ? Number(val) : undefined;
                    if (num !== undefined && num > 100) num = 100;
                    setFormData((prev) => ({
                      ...prev,
                      probability: num,
                    }))
                  }}
                  placeholder="60"
                  className="rounded-xl border-border bg-muted/50 h-11 focus-visible:ring-blue-500 shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source" className="text-sm font-semibold text-foreground">Source</Label>
              <Popover open={openSource} onOpenChange={setOpenSource}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openSource}
                    className={cn(
                      "w-full justify-between rounded-xl border-border bg-muted/50 h-11 focus:ring-blue-500 shadow-sm font-normal",
                      !formData.source && "text-muted-foreground"
                    )}
                  >
                    {formData.source ? formData.source : "Select Source"}
                    <div className="flex items-center gap-1">
                      {formData.source && (
                        <div
                          role="button"
                          className="px-1 hover:text-foreground text-muted-foreground"
                          onClick={(e) => {
                            e.stopPropagation()
                            setFormData((prev) => ({ ...prev, source: '' }))
                          }}
                        >
                          <X className="h-4 w-4" />
                        </div>
                      )}
                      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-border shadow-lg pointer-events-auto" align="start">
                  <Command>
                    <CommandInput placeholder="Search source..." />
                    <CommandList>
                      <CommandEmpty>No source found.</CommandEmpty>
                      <CommandGroup>
                        {LEAD_SOURCES.map((source) => (
                          <CommandItem
                            key={source}
                            value={source}
                            onSelect={(currentValue) => {
                              const newSource = currentValue.toLowerCase() === formData.source?.toLowerCase() ? '' : source
                              setFormData((prev) => ({
                                ...prev,
                                source: newSource
                              }))
                              setOpenSource(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.source === source ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {source}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold text-foreground">Deal Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Deal notes, requirements, and next steps..."
                className="rounded-xl border-border bg-muted/50 focus-visible:ring-blue-500 shadow-sm resize-y min-h-[120px]"
                rows={5}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-border">
            <Button type="submit" disabled={submitting || loadingLookups} className="w-full cursor-pointer sm:w-auto h-11 px-8 gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm font-bold text-sm transition-all border-none">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
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
            contactId: '',
          }))
        }}
      />
    </Card>
  )
}
