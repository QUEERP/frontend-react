import React, { useState, useEffect } from 'react'
import {  useNavigate  } from 'react-router-dom';
import { contractsAPI, ContractType, CreateContractData } from '@/lib/api/contracts'
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
import { ArrowLeft, FileText, Calendar, DollarSign, User, Loader2, UserPlus } from 'lucide-react'
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
  const { business } = useBusinessData()
  const [contractTypes, setContractTypes] = useState<ContractType[]>([])
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [loading, setLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [showCreateCustomer, setShowCreateCustomer] = useState(false)
  const [formData, setFormData] = useState<CreateContractData>({
    customerId: '',
    title: '',
    description: '',
    value: 0,
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
      if (response.success) {
        setContractTypes(response.types)
      }
    } catch (error) {
      console.error('Failed to fetch contract types:', error)
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
          navigate(`/dashboard/${businessId}/contracts`)
        }
      } else {
        const response = await contractsAPI.createContract(businessId, formData)
        if (response.success) {
          toast.success('Contract created successfully')
          navigate(`/dashboard/${businessId}/contracts`)
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'create'} contract`)
    } finally {
      setFormLoading(false)
    }
  }

  const handleBack = () => {
    navigate(`/dashboard/${businessId}/contracts`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-svh">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-10 pt-0 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-4 py-4">
        <Button variant="ghost" onClick={handleBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Contracts
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{isEditMode ? 'Edit Contract' : 'Add New Contract'}</h1>
          <p className="text-muted-foreground">
            {isEditMode ? 'Update contract details' : 'Create a new contract for your business'}
          </p>
        </div>
      </div>

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
                <Label htmlFor="typeId">Contract Type</Label>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
    </div>
  )
}
