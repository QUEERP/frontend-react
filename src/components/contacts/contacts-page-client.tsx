import React, { useState, useEffect } from 'react'
import { contactsAPI, Contact } from '@/lib/api/contacts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Phone,
  Download
} from 'lucide-react'
import { ContactList } from './contact-list'
import { ContactForm } from './contact-form'
import { ContactDetails } from './contact-details'
import { toast } from 'sonner'

export function ContactsPageClient({ businessId }: { businessId: string }) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [customersMap, setCustomersMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [viewingContact, setViewingContact] = useState<Contact | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [contactsRes, customersRes] = await Promise.all([
        contactsAPI.getContacts(businessId),
        contactsAPI.getCustomers(businessId)
      ])
      if (contactsRes.success) {
        setContacts(contactsRes.contacts)
      }
      if (customersRes.success) {
        const map: Record<string, string> = {}
        customersRes.customers.forEach(c => {
          map[c.id] = c.company || c.name || c.id
        })
        setCustomersMap(map)
      }
    } catch (error) {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [businessId])

  const filteredContacts = contacts.filter(contact => {
    const searchLower = searchTerm.toLowerCase().trim()
    const matchesSearch = 
      !searchLower ||
      contact.fullName?.toLowerCase().includes(searchLower) ||
      contact.email?.toLowerCase().includes(searchLower) ||
      contact.phone?.toLowerCase().includes(searchLower) ||
      contact.position?.toLowerCase().includes(searchLower) ||
      contact.id?.toLowerCase().includes(searchLower)

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
    fetchData()
  }

  const stats = {
    total: contacts.length,
    active: contacts.filter(c => c.isActive).length,
    inactive: contacts.filter(c => !c.isActive).length,
    withEmail: contacts.filter(c => c.email).length,
    withPhone: contacts.filter(c => c.phone).length,
  }

  const downloadReport = () => {
    if (filteredContacts.length === 0) {
      toast.error('No contact data to export')
      return
    }
    const headers = ['Name', 'Email', 'Phone', 'Position', 'Customer', 'Status', 'Created At']
    const csv = [
      headers.join(','),
      ...filteredContacts.map(c => [
        `"${(c.fullName || '').replace(/"/g, '""')}"`,
        `"${(c.email || '').replace(/"/g, '""')}"`,
        `"${(c.phone || '').replace(/"/g, '""')}"`,
        `"${(c.position || '').replace(/"/g, '""')}"`,
        `"${(customersMap[c.customerId] || '').replace(/"/g, '""')}"`,
        `"${c.isActive ? 'Active' : 'Inactive'}"`,
        `"${new Date(c.createdAt).toLocaleDateString()}"`
      ].join(','))
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.setAttribute('href', URL.createObjectURL(blob))
    link.setAttribute('download', `Contacts_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Report downloaded')
  }

  return (
    <div className="grid min-h-svh grid-cols-1 content-start gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Global Contacts</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all customer contacts and their information across your organization</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={downloadReport}
            className="h-10 gap-2 bg-card hover:bg-muted text-foreground border-border shadow-sm rounded-xl font-medium px-4 cursor-pointer"
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="h-10 cursor-pointer gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-xl border-none font-medium px-5"
          >
            <Plus className="h-4 w-4" /> Add New Contact
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Total Contacts', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
          { label: 'Active', value: stats.active, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
          { label: 'Inactive', value: stats.inactive, icon: UserX, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-100' },
          { label: 'With Email', value: stats.withEmail, icon: Mail, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
          { label: 'With Phone', value: stats.withPhone, icon: Phone, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
        ].map(stat => (
          <Card key={stat.label} className="border-border bg-card shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-black text-foreground mt-1">{stat.value}</p>
                </div>
                <div className={`flex items-center justify-center h-12 w-12 rounded-xl border ${stat.bg} ${stat.color} shadow-sm`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Directory Card */}
      <Card className="border-border bg-card shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/50 pb-5 pt-6 px-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Contact Directory</CardTitle>
              <CardDescription className="text-sm font-medium text-muted-foreground mt-1">
                View and manage all customer contacts in one place.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 pl-9 rounded-xl border-border bg-card focus-visible:ring-blue-500 h-10 text-sm shadow-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                <SelectTrigger className="w-[140px] rounded-xl border-border bg-card h-10 shadow-sm focus:ring-blue-500">
                  <SelectValue placeholder="All Contacts" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border shadow-lg">
                  <SelectItem value="all" className="cursor-pointer focus:bg-muted">All Contacts</SelectItem>
                  <SelectItem value="active" className="cursor-pointer focus:bg-muted">Active</SelectItem>
                  <SelectItem value="inactive" className="cursor-pointer focus:bg-muted">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ContactList
            businessId={businessId}
            contacts={filteredContacts}
            loading={loading}
            onEdit={handleEdit}
            onView={handleView}
            onRefresh={handleSuccess}
            customersMap={customersMap}
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
        customerName={viewingContact ? customersMap[viewingContact.customerId] : undefined}
        onEdit={(contact) => {
          setViewingContact(null)
          handleEdit(contact)
        }}
      />
    </div>
  )
}
