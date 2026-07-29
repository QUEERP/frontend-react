import React, { useState, useEffect } from 'react'
import { contactsAPI, CreateContactData, Contact, Customer } from '@/lib/api/contacts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, User, Mail, Phone, Building, UserPlus } from 'lucide-react'
import { CreateCustomerModal } from '@/components/dashboard/create-customer-modal'

interface ContactFormProps {
  businessId: string;
  customerId?: string;
  contact?: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ContactForm({
  businessId,
  customerId,
  contact,
  isOpen,
  onClose,
  onSuccess,
}: ContactFormProps) {
  const [formData, setFormData] = useState<CreateContactData>({
    customerId: customerId || contact?.customerId || '',
    fullName: contact?.fullName || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    position: contact?.position || '',
    isActive: contact?.isActive ?? true,
  })
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [customersLoading, setCustomersLoading] = useState(false)
  const [showCreateCustomer, setShowCreateCustomer] = useState(false)

  const fetchCustomers = async () => {
    try {
      setCustomersLoading(true)
      const response = await contactsAPI.getCustomers(businessId)
      if (response.success) {
        setCustomers(response.customers)
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    } finally {
      setCustomersLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && !customerId) {
      fetchCustomers()
    }
  }, [isOpen, customerId, businessId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.customerId || !formData.fullName) {
      toast.error('Customer and full name are required')
      return
    }

    setLoading(true)
    try {
      if (contact) {
        await contactsAPI.updateContact(businessId, contact.id, formData)
        toast.success('Contact updated successfully')
      } else {
        await contactsAPI.createContact(businessId, formData)
        toast.success('Contact created successfully')
      }

      onSuccess()
      onClose()
      setFormData({
        customerId: customerId || '',
        fullName: '',
        email: '',
        phone: '',
        position: '',
        isActive: true,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  const selectedCustomer = customers.find(c => c.id === formData.customerId)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl p-0 overflow-hidden bg-white">
        <DialogHeader className="px-6 py-5 bg-slate-50/50 border-b border-slate-100 m-0">
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <User className="h-5 w-5" />
            </div>
            {contact ? 'Edit Contact Profile' : 'Add New Contact Profile'}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 font-medium mt-1">
            {contact
              ? 'Update the contact information below.'
              : 'Fill in the contact information below to add a new contact.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-6 max-h-[65vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="customerId" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Building className="h-4 w-4 text-slate-400" />
                Associated Customer *
              </Label>
              <Select
                value={formData.customerId}
                onValueChange={(value) =>
                  setFormData(prev => ({ ...prev, customerId: value }))
                }
                disabled={!!customerId || customersLoading}
              >
                <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 focus:ring-blue-500 bg-slate-50/50 focus:bg-white transition-colors text-slate-700">
                  <SelectValue placeholder={customersLoading ? 'Loading customers...' : 'Select a customer'} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200">
                  {customers.length === 0 && !customersLoading && (
                    <div className="px-2 py-4 text-center text-sm text-slate-400 font-medium">
                      No customers found
                    </div>
                  )}
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id} className="rounded-lg cursor-pointer">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700">{customer.company || customer.name || 'Unknown Customer'}</span>
                        {customer.email && (
                          <span className="text-xs text-slate-400 font-medium">{customer.email}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                  <div className="border-t border-slate-100 mt-1 pt-1">
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
              {selectedCustomer && (
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 font-semibold text-xs">
                    Selected: {selectedCustomer.company || selectedCustomer.name}
                  </Badge>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-semibold text-slate-700">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, fullName: e.target.value }))
                }
                placeholder="John Doe"
                className="h-10 rounded-xl border-slate-200 focus-visible:ring-blue-500 bg-slate-50/50 focus:bg-white transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Mail className="h-4 w-4 text-slate-400" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="john@example.com"
                  className="h-10 rounded-xl border-slate-200 focus-visible:ring-blue-500 bg-slate-50/50 focus:bg-white transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Phone className="h-4 w-4 text-slate-400" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="+1 234 567 8900"
                  className="h-10 rounded-xl border-slate-200 focus-visible:ring-blue-500 bg-slate-50/50 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position" className="text-sm font-semibold text-slate-700">Job Position / Title</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, position: e.target.value }))
                }
                placeholder="Manager, Assistant, Director, etc."
                className="h-10 rounded-xl border-slate-200 focus-visible:ring-blue-500 bg-slate-50/50 focus:bg-white transition-colors"
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50/50">
              <div className="space-y-1">
                <Label htmlFor="isActive" className="text-sm font-bold text-slate-800">Active Profile Status</Label>
                <p className="text-xs text-slate-500 font-medium">
                  Inactive contacts are hidden from search and direct actions.
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({ ...prev, isActive: checked }))
                }
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>
          </div>

          <DialogFooter className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex-col sm:flex-row gap-3 sm:gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="h-10 cursor-pointer rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="h-10 cursor-pointer rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold w-full sm:w-auto">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {contact ? 'Save Changes' : 'Create Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
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
    </Dialog>
  )
}
