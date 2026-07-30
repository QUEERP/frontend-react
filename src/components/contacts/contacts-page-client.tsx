import React, { useState, useEffect } from 'react'
import { contactsAPI, Contact } from '@/lib/api/contacts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Plus, 
  Search, 
  Users, 
  Filter,
  UserCheck,
  UserX,
  Calendar,
  Mail,
  Phone
} from 'lucide-react'
import { ContactList } from './contact-list'
import { ContactForm } from './contact-form'
import { ContactDetails } from './contact-details'
import { toast } from 'sonner'

export function ContactsPageClient({ businessId }: { businessId: string }) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [viewingContact, setViewingContact] = useState<Contact | null>(null)

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const response = await contactsAPI.getContacts(businessId)
      if (response.success) {
        setContacts(response.contacts)
      }
    } catch (error) {
      toast.error('Failed to fetch contacts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [businessId])

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone?.includes(searchTerm) ||
      contact.position?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && contact.isActive) ||
      (statusFilter === 'inactive' && !contact.isActive)

    return matchesSearch && matchesStatus
  })

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact)
    setIsFormOpen(true)
  }

  const handleView = (contact: Contact) => {
    setViewingContact(contact)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingContact(null)
  }

  const handleSuccess = () => {
    fetchContacts()
  }

  const stats = {
    total: contacts.length,
    active: contacts.filter(c => c.isActive).length,
    inactive: contacts.filter(c => !c.isActive).length,
    withEmail: contacts.filter(c => c.email).length,
    withPhone: contacts.filter(c => c.phone).length,
  }

  return (
    <div className="grid min-h-svh grid-cols-1 content-start gap-6 bg-[#f8fafc] px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 text-slate-800">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            Global Contacts
          </h1>
          <p className="text-slate-500 mt-2 text-sm sm:text-base font-medium">
            Manage all customer contacts and their information across your organization.
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} size="lg" className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold w-full sm:w-auto cursor-pointer">
          <Plus className="mr-2 h-5 w-5" />
          Add New Contact
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden col-span-2 lg:col-span-1">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Contacts</p>
              <p className="text-2xl font-black text-slate-800">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hidden sm:block">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Active</p>
              <p className="text-2xl font-black text-emerald-600">{stats.active}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-slate-100 text-slate-500 rounded-xl hidden sm:block">
              <UserX className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Inactive</p>
              <p className="text-2xl font-black text-slate-600">{stats.inactive}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hidden sm:block">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">With Email</p>
              <p className="text-2xl font-black text-slate-800">{stats.withEmail}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl hidden sm:block">
              <Phone className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">With Phone</p>
              <p className="text-2xl font-black text-slate-800">{stats.withPhone}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            Search & Filter Directory
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Search by name, email, phone, or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-colors"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-full sm:w-[220px] h-11 rounded-xl border-slate-200 bg-white font-medium text-slate-700 cursor-pointer">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200">
                <SelectItem value="all" className="rounded-lg cursor-pointer">All Contacts</SelectItem>
                <SelectItem value="active" className="rounded-lg cursor-pointer">Active Contacts Only</SelectItem>
                <SelectItem value="inactive" className="rounded-lg cursor-pointer">Inactive Contacts Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Active Filters */}
          {(searchTerm || statusFilter !== 'all') && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
              {searchTerm && (
                <Badge variant="secondary" className="gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border-none rounded-lg text-xs font-semibold">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5 cursor-pointer transition-colors"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none rounded-lg text-xs font-semibold">
                  Status: {statusFilter}
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="ml-1 hover:bg-indigo-200 rounded-full p-0.5 cursor-pointer transition-colors"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-semibold text-slate-500">
          Showing <span className="text-slate-900">{filteredContacts.length}</span> of {contacts.length} contacts
        </p>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-500">
            Updated: {new Date().toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Contacts List */}
      <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Contact Directory
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <ContactList
            businessId={businessId}
            onEdit={handleEdit}
            onView={handleView}
            onRefresh={handleSuccess}
          />
        </CardContent>
      </Card>

      {/* Forms and Dialogs */}
      <ContactForm
        businessId={businessId}
        contact={editingContact}
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleSuccess}
      />

      <ContactDetails
        contact={viewingContact}
        isOpen={!!viewingContact}
        onClose={() => setViewingContact(null)}
      />
    </div>
  )
}
