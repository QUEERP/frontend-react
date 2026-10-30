import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom';
import { contractsAPI, ContractType, CreateContractData } from '@/lib/api/contracts'
import { negotiationsAPI } from '@/lib/api/negotiations'
import { proposalsAPI } from '@/lib/api/proposals'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeft, FileText, Calendar, DollarSign, User, Loader2, UserPlus, Edit, Handshake, FileSignature, Sparkles, Plus } from 'lucide-react'
import { CreateCustomerModal } from '@/components/dashboard/create-customer-modal'
import { toast } from 'sonner'
import { useBusinessData } from '@/components/dashboard/business-data-provider'

interface AddContractClientProps {
  businessId: string;
  contractId?: string;
}

type CustomerOption = {
  id: string;
  name: string;
  email?: string;
};

function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([\\^$|?*+()[\]{}.])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : '';
}

export function AddContractClient({ businessId, contractId }: AddContractClientProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromNegotiation = searchParams.get('fromNegotiation') || searchParams.get('negotiationId') || searchParams.get('fromNeg')
  const fromProposal = searchParams.get('fromProposal') || searchParams.get('proposalId') || searchParams.get('fromProp')
  const [sourceNegotiation, setSourceNegotiation] = useState<any>(null)
  const [sourceProposal, setSourceProposal] = useState<any>(null)

  const isProjectOps = typeof window !== 'undefined' && window.location.pathname.includes('/project-operations');
  const contractsBasePath = isProjectOps
    ? `/dashboard/${businessId}/project-operations/contracts`
    : `/dashboard/${businessId}/contracts`;

  const { business } = useBusinessData()
  const [contractTypes, setContractTypes] = useState<ContractType[]>([])
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [loading, setLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [showCreateCustomer, setShowCreateCustomer] = useState(false)
  const [showCreateType, setShowCreateType] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const [creatingType, setCreatingType] = useState(false)
  const [formData, setFormData] = useState<CreateContractData>({
    customerId: '',
    title: '',
    description: '',
    value: 0,
    currency: 'USD',
    startDate: '',
    endDate: '',
    isDeleted: false,
    isHidden: false,
  })

  const isEditMode = Boolean(contractId)

  // Prefer live customer list from API to ensure IDs match backend validation.
  const fetchCustomers = async () => {
    try {
      const token = getCookie('token') || getCookie('accessToken')
      if (!token) return

      const API_BASE_RAW = (
        import.meta.env.VITE_API_BASE ||
        import.meta.env.VITE_API_URL ||
        ''
      ).trim()
      const API_BASE = API_BASE_RAW.replace(/\/$/, '')
      const apiRoot = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`

      const response = await fetch(`${apiRoot}/customers`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-business-id': businessId,
        },
      })

      if (!response.ok) return

      const data = await response.json()
      if (data?.success && Array.isArray(data.customers)) {
        setCustomers(
          data.customers.map((c: any) => ({
            id: c.id,
            name: c.company || c.name || '',
            email: c.email || '',
          }))
        )
      }
    } catch {
      // Silent fallback handled below with business data.
    }
  }

  // Fetch contract types
  const fetchContractTypes = async () => {
    try {
      const response = await contractsAPI.getContractTypes(businessId)
      if (response.success && Array.isArray(response.types)) {
        setContractTypes(response.types)
      }
    } catch (error) {
      console.error('Failed to fetch contract types:', error)
    }
  }

  const handleCreateType = async () => {
    if (!newTypeName.trim()) {
      toast.error('Contract type name is required')
      return
    }
    try {
      setCreatingType(true)
      const res = await contractsAPI.createContractType(businessId, newTypeName.trim())
      if (res.success && res.type) {
        setContractTypes(prev => [...prev, res.type])
        setFormData(prev => ({ ...prev, typeId: res.type.id }))
        toast.success(`Contract type "${res.type.name}" created! 🎉`)
        setNewTypeName('')
        setShowCreateType(false)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create contract type')
    } finally {
      setCreatingType(false)
    }
  }

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true)
        await Promise.all([fetchContractTypes(), fetchCustomers()])

        if (contractId) {
          const response = await contractsAPI.getContractById(businessId, contractId)
          const contract = response.contract

          // Ensure currently selected customer is present in dropdown even if
          // customer list endpoint fails or returns a partial list.
          if (contract.customerId) {
            setCustomers((prev) => {
              if (prev.some((item) => item.id === contract.customerId)) {
                return prev
              }

              return [
                ...prev,
                {
                  id: contract.customerId,
                  name: contract.customer?.company || contract.customer?.name || 'Selected customer',
                  email: contract.customer?.email || '',
                },
              ]
            })
          }

          setFormData({
            customerId: contract.customerId || '',
            typeId: contract.typeId || undefined,
            title: contract.title || '',
            description: contract.description || '',
            value: Number(contract.value || 0),
            currency: contract.currency || 'USD',
            startDate: contract.startDate ? contract.startDate.split('T')[0] : '',
            endDate: contract.endDate ? contract.endDate.split('T')[0] : '',
            isDeleted: Boolean(contract.isDeleted),
            isHidden: Boolean(contract.isHidden),
          })
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load contract')
      } finally {
        setLoading(false)
      }
    }

    initialize()
  }, [businessId, contractId])

  // Fallback customer source from business provider.
  useEffect(() => {
    if (customers.length > 0) return
    setCustomers(
      (business?.customers ?? []).map((c: any) => ({
        id: c.id,
        name: c.company || c.name || '',
        email: c.email || '',
      }))
    )
  }, [business, customers.length])

  // Pre-fill Contract Form from Negotiation & Proposal
  useEffect(() => {
    if (!fromNegotiation || contractId) return;

    const fetchFromNegotiation = async () => {
      try {
        setLoading(true);
        const res = await negotiationsAPI.getNegotiationById(businessId, fromNegotiation);
        const deal = res.negotiation || (res as any).data;
        if (deal) {
          setSourceNegotiation(deal);

          // Try fetching linked proposal if present
          let proposalData: any = null;
          if (deal.linkedProposal) {
            try {
              const pRes = await proposalsAPI.getProposalById(businessId, deal.linkedProposal);
              proposalData = pRes.proposal || pRes.quotation || (pRes as any).data;
              if (proposalData) setSourceProposal(proposalData);
            } catch (e) {
              console.warn("Could not load linked proposal:", e);
            }
          }

          // Assemble comprehensive scope and commercial terms
          const descLines = [
            `Auto-generated from Negotiation: ${deal.negNumber || deal.id}`,
            deal.linkedProposal ? `Proposal Reference: ${deal.linkedProposal}` : '',
            '',
            '--- PROJECT SCOPE & EXECUTION COVENANTS ---',
            deal.addedScope ? `Scope: ${deal.addedScope}` : (proposalData?.terms || 'Standard Project Scope as defined in approved proposal.'),
            deal.finalTimeline ? `Agreed Timeline: ${deal.finalTimeline}` : '',
            deal.paymentTerms ? `Commercial Payment Terms: ${deal.paymentTerms}` : '',
            deal.advancePct ? `Advance Payment Required: ${deal.advancePct}%` : '',
            deal.retentionPct ? `Retention Term: ${deal.retentionPct}%` : '',
          ].filter(Boolean).join('\n');

          const contractVal = Number(deal.finalAmount || deal.negAmount || deal.amount || 0);
          const startDate = deal.expectedCloseDate ? deal.expectedCloseDate.split('T')[0] : new Date().toISOString().split('T')[0];
          const custId = deal.customerId || deal.customer?.id || '';

          if (custId) {
            setCustomers(prev => {
              if (prev.some(c => c.id === custId)) return prev;
              return [
                ...prev,
                {
                  id: custId,
                  name: deal.customer?.company || deal.customer?.name || 'Customer from Negotiation',
                  email: deal.customer?.email || '',
                }
              ];
            });
          }

          setFormData(prev => ({
            ...prev,
            customerId: custId,
            title: `${deal.dealName || deal.name} - Contract`,
            value: contractVal,
            startDate: startDate,
            description: descLines,
            currency: deal.currency || 'USD',
          }));
        }
      } catch (err) {
        console.error("Failed to load negotiation data for contract:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFromNegotiation();
  }, [businessId, fromNegotiation, contractId]);

  // Pre-fill Contract Form directly from Proposal
  useEffect(() => {
    if (!fromProposal || fromNegotiation || contractId) return;

    const fetchFromProposal = async () => {
      try {
        setLoading(true);
        const res = await proposalsAPI.getProposalById(businessId, fromProposal);
        const prop: any = res.proposal || (res as any).data || (res as any).quotation;
        if (prop) {
          setSourceProposal(prop);

          const propNum = prop.quotationNumber || prop.quoteNumber || prop.proposalNumber || prop.number || prop.id;
          const custId = prop.customerId || prop.customer?.id || '';

          if (custId) {
            setCustomers(prev => {
              if (prev.some(c => c.id === custId)) return prev;
              return [
                ...prev,
                {
                  id: custId,
                  name: prop.customer?.company || prop.customer?.name || 'Customer from Proposal',
                  email: prop.customer?.email || '',
                }
              ];
            });
          }

          const contractVal = Number(prop.totalAmount ?? prop.finalPrice ?? prop.grandTotal ?? prop.total ?? 0);
          const startDate = prop.issueDate ? prop.issueDate.split('T')[0] : (prop.date ? prop.date.split('T')[0] : new Date().toISOString().split('T')[0]);
          const endDate = prop.validUntil ? prop.validUntil.split('T')[0] : (prop.expiryDate ? prop.expiryDate.split('T')[0] : '');

          const lineItems = Array.isArray(prop.items) && prop.items.length > 0
            ? `Deliverables / Scope of Services:\n${prop.items.map((it: any, idx: number) => `• ${it.description || it.name || 'Deliverable'} (Qty: ${it.quantity || 1}, Rate: ${it.rate || it.unitPrice || 0})`).join('\n')}`
            : '';

          const descLines = [
            `Auto-generated from Proposal: ${propNum}`,
            prop.title ? `Proposal Reference: ${prop.title}` : '',
            '',
            '--- PROJECT SCOPE & AGREEMENT TERMS ---',
            prop.terms ? `Terms & Conditions:\n${prop.terms}` : '',
            lineItems,
            prop.notes ? `Special Notes:\n${prop.notes}` : '',
          ].filter(Boolean).join('\n\n');

          setFormData(prev => ({
            ...prev,
            customerId: custId,
            title: prop.title ? `${prop.title} - Contract` : `Proposal ${propNum} - Contract`,
            value: contractVal,
            startDate: startDate,
            endDate: endDate,
            description: descLines,
            currency: prop.currency || 'USD',
          }));
        }
      } catch (err) {
        console.error("Failed to load proposal data for contract:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFromProposal();
  }, [businessId, fromProposal, fromNegotiation, contractId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.customerId || !formData.title || !formData.value || !formData.startDate) {
      toast.error('Please fill in all required fields')
      return
    }

    setFormLoading(true)
    try {
      if (isEditMode && contractId) {
        const response = await contractsAPI.updateContract(businessId, contractId, formData)
        if (response.success) {
          toast.success('Contract updated successfully')
          navigate(contractsBasePath)
        }
      } else {
        const response = await contractsAPI.createContract(businessId, formData)
        if (response.success) {
          // If converted from negotiation, ensure negotiation is marked WON
          if (sourceNegotiation?.id) {
            negotiationsAPI.updateNegotiation(businessId, sourceNegotiation.id, { stage: 'Won', status: 'Won' }).catch(console.error);
          }
          toast.success('Contract created successfully! 🎉')
          navigate(contractsBasePath)
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'create'} contract`)
    } finally {
      setFormLoading(false)
    }
  }

  const handleBack = () => {
    navigate(contractsBasePath)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-svh">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const linkedNegNumber = formData.description?.match(/Negotiation:\s*([A-Za-z0-9-_]+)/i)?.[1] || null;

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-10 pt-0 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-4 py-4">
        <Button variant="ghost" onClick={handleBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Contracts
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{isEditMode ? 'Edit Contract' : 'Add New Contract'}</h1>
            {linkedNegNumber && (
              <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded-md bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400">
                Negotiation: {linkedNegNumber}
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-xs mt-0.5">
            {isEditMode ? 'Update contract details or switch to the full negotiation pipeline editor.' : 'Create a new contract for your business'}
          </p>
        </div>
      </div>

      {/* Negotiation Conversion Banner */}
      {sourceNegotiation && (
        <div className="max-w-2xl p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 rounded-lg shrink-0">
              <Handshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                  Converting from Negotiation: {sourceNegotiation.negNumber || sourceNegotiation.name}
                </h4>
                <span className="bg-emerald-600 text-white font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                  Won Deal
                </span>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                Customer, title, value ({sourceNegotiation.currency || 'USD'} {Number(sourceNegotiation.finalAmount || sourceNegotiation.amount || 0).toLocaleString()}), dates, and commercial scope have been pre-filled from Negotiation {sourceNegotiation.linkedProposal ? `& Proposal ${sourceNegotiation.linkedProposal}` : ''}. Review and confirm details below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Proposal Conversion Banner */}
      {sourceProposal && !sourceNegotiation && (
        <div className="max-w-2xl p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 rounded-lg shrink-0">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-blue-950 dark:text-blue-200">
                  Converting from Proposal: {sourceProposal.quotationNumber || sourceProposal.quoteNumber || sourceProposal.title || sourceProposal.id}
                </h4>
                <span className="bg-blue-600 text-white font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                  Approved Proposal
                </span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                Customer, title, value ({sourceProposal.currency || 'USD'} {Number(sourceProposal.totalAmount || sourceProposal.finalPrice || 0).toLocaleString()}), dates, and specifications have been pre-filled from this proposal. Review and confirm below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Linked Negotiation Banner */}
      {linkedNegNumber && (
        <div className="max-w-2xl p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border border-orange-200 dark:border-orange-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-100 dark:bg-orange-900/50 text-orange-600 rounded-lg shrink-0">
              <Handshake className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-orange-950 dark:text-orange-200">
                Originated from Pre-Sales Negotiation ({linkedNegNumber})
              </h4>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-0.5">
                Want to update negotiation commercials, win probability, scope adjustments, or linked proposals? Open the full negotiation workspace.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => navigate(`/dashboard/${businessId}/project-operations/negotiations/create?edit=${linkedNegNumber}`)}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shrink-0 shadow-sm"
          >
            <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit Full Negotiation
          </Button>
        </div>
      )}

      {/* Form */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contract Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Select - Same pattern as invoice page */}
              <div className="space-y-2">
                <Label htmlFor="customerId" className="text-sm font-medium flex items-center gap-1">
                  Customer <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.customerId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
                >
                  <SelectTrigger className="text-sm w-full">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{customer.name}</span>
                          {customer.email && (
                            <span className="text-xs text-muted-foreground">{customer.email}</span>
                          )}
                        </div>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="typeId">Contract Type</Label>
                  <button
                    type="button"
                    onClick={() => setShowCreateType(true)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" /> Add Type
                  </button>
                </div>
                <Select
                  value={formData.typeId || 'none'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, typeId: value === 'none' ? undefined : value }))}
                >
                  <SelectTrigger className="text-sm w-full">
                    <SelectValue placeholder="Select type (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No type</SelectItem>
                    {contractTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                    <div className="border-t border-border mt-1 pt-1">
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); setShowCreateType(true) }}
                        className="flex w-full items-center gap-2 px-2 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded cursor-pointer transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        + Create Contract Type
                      </button>
                    </div>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Contract Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Service Agreement"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Contract details and terms..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency || 'USD'}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, currency: val }))}
                >
                  <SelectTrigger id="currency" className="text-sm w-full">
                    <SelectValue placeholder="USD" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="AED">AED (AED)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">Contract Value *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    min={formData.startDate}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading} className="flex-1">
                {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Update Contract' : 'Create Contract'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <CreateCustomerModal
        open={showCreateCustomer}
        onClose={() => setShowCreateCustomer(false)}
        businessId={businessId}
        onCreated={(newCust) => {
          setCustomers((prev) => [
            ...prev,
            {
              id: newCust.id,
              name: newCust.company || newCust.name || '',
              email: newCust.email || '',
            },
          ])
          setFormData((prev) => ({
            ...prev,
            customerId: newCust.id,
          }))
        }}
      />

      {/* Create Contract Type Modal */}
      <Dialog open={showCreateType} onOpenChange={setShowCreateType}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-blue-600" /> Create Contract Type
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Add a new contract classification (e.g. NDA, MSA, Fixed-Price, Retainer) for this business.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="newTypeName" className="text-xs font-semibold uppercase text-muted-foreground">Type Name *</Label>
              <Input
                id="newTypeName"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="e.g. Non-Disclosure Agreement (NDA)"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateType())}
                className="rounded-xl h-10"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setShowCreateType(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateType}
              disabled={!newTypeName.trim() || creatingType}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {creatingType ? 'Creating...' : 'Create Type'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
