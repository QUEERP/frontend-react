import React, { useState, useEffect } from 'react'
import { contactsAPI, Contact, CreateContactData } from '@/lib/api/contacts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Phone,
  Mail,
  User,
  Users,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface CustomerContactsProps {
  businessId: string;
  customerId: string;
}

export function CustomerContacts({ businessId, customerId }: CustomerContactsProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [formData, setFormData] = useState<CreateContactData>({
    customerId,
    fullName: '',
    email: '',
    phone: '',
    position: '',
    isActive: true,
  })
  const [formLoading, setFormLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<string | null>(null)

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const response = await contactsAPI.getContacts(businessId, customerId)
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
    const timer = setTimeout(() => {
      fetchContacts()
    }, 1000)
    return () => clearTimeout(timer)
  }, [businessId, customerId])

  const handleCreate = () => {
    setEditingContact(null)
    setFormData({
      customerId,
      fullName: '',
      email: '',
      phone: '',
      position: '',
      isActive: true,
    })
    setIsFormOpen(true)
  }

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact)
    setFormData({
      customerId,
      fullName: contact.fullName,
      email: contact.email || '',
      phone: contact.phone || '',
      position: contact.position || '',
      isActive: contact.isActive,
    })
    setIsFormOpen(true)
  }

  const handleDelete = async (contactId: string) => {
    setContactToDelete(contactId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!contactToDelete) return

    try {
      const response = await contactsAPI.deleteContact(businessId, contactToDelete)
      if (response.success) {
        toast.success('Contact deleted successfully')
        fetchContacts()
      }
    } catch (error) {
      toast.error('Failed to delete contact')
    } finally {
      setDeleteDialogOpen(false)
      setContactToDelete(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.fullName) {
      toast.error('Full name is required')
      return
    }

    setFormLoading(true)
    try {
      if (editingContact) {
        await contactsAPI.updateContact(businessId, editingContact.id, formData)
        toast.success('Contact updated successfully')
      } else {
        await contactsAPI.createContact(businessId, formData)
        toast.success('Contact created successfully')
      }

      setIsFormOpen(false)
      fetchContacts()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Operation failed')
    } finally {
      setFormLoading(false)
    }
  }

  const activeContacts = contacts.filter(c => c.isActive)
  const inactiveContacts = contacts.filter(c => !c.isActive)

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl shadow-sm border-slate-200 bg-white overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Customer Contacts
              <Badge variant="secondary" className="bg-slate-200 text-slate-700 hover:bg-slate-200 rounded-full px-2 py-0.5">{contacts.length}</Badge>
            </CardTitle>
            <Button onClick={handleCreate} size="sm" className="h-9 cursor-pointer px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 p-0 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 m-4 sm:m-0">
              <User className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-sm font-semibold text-slate-900">No contacts</h3>
              <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
                Add contacts to manage key people at this customer.
              </p>
              <Button onClick={handleCreate} className="mt-6 h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-sm font-medium">
                <Plus className="mr-2 h-4 w-4" />
                Add First Contact
              </Button>
            </div>
          ) : (
            <div className="space-y-6 px-4 pb-4 sm:p-0">
              {/* Active Contacts */}
              {activeContacts.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 ml-1">Active Contacts</h4>
                  <div className="rounded-xl border border-slate-200 overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="font-semibold text-slate-700 whitespace-nowrap">Name</TableHead>
                          <TableHead className="font-semibold text-slate-700 whitespace-nowrap">Email</TableHead>
                          <TableHead className="font-semibold text-slate-700 whitespace-nowrap">Phone</TableHead>
                          <TableHead className="font-semibold text-slate-700 whitespace-nowrap">Position</TableHead>
                          <TableHead className="w-[70px] text-right"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeContacts.map((contact) => (
                          <TableRow key={contact.id} className="hover:bg-slate-50/50">
                            <TableCell className="font-medium text-slate-900 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                                  <User className="h-4 w-4" />
                                </div>
                                {contact.fullName}
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {contact.email ? (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-slate-400" />
                                  <a
                                    href={`mailto:${contact.email}`}
                                    className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                                  >
                                    {contact.email}
                                  </a>
                                </div>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {contact.phone ? (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-slate-400" />
                                  <a
                                    href={`tel:${contact.phone}`}
                                    className="text-slate-700 hover:text-slate-900 hover:underline font-medium"
                                  >
                                    {contact.phone}
                                  </a>
                                </div>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                {contact.position || 'N/A'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 rounded-lg">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl shadow-lg border-slate-200">
                                  <DropdownMenuItem onClick={() => handleEdit(contact)} className="cursor-pointer font-medium text-slate-700 rounded-lg focus:bg-slate-50">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(contact.id)}
                                    className="text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer font-medium rounded-lg"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Inactive Contacts */}
              {inactiveContacts.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 ml-1 mt-6">Inactive Contacts</h4>
                  <div className="rounded-xl border border-slate-200 overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="font-semibold text-slate-700 whitespace-nowrap">Name</TableHead>
                          <TableHead className="font-semibold text-slate-700 whitespace-nowrap">Email</TableHead>
                          <TableHead className="font-semibold text-slate-700 whitespace-nowrap">Phone</TableHead>
                          <TableHead className="font-semibold text-slate-700 whitespace-nowrap">Position</TableHead>
                          <TableHead className="w-[70px] text-right"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inactiveContacts.map((contact) => (
                          <TableRow key={contact.id} className="opacity-60 hover:bg-slate-50/50">
                            <TableCell className="font-medium text-slate-900 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
                                  <User className="h-4 w-4" />
                                </div>
                                {contact.fullName}
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {contact.email ? (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-slate-400" />
                                  <a
                                    href={`mailto:${contact.email}`}
                                    className="text-slate-600 hover:text-blue-600 hover:underline font-medium"
                                  >
                                    {contact.email}
                                  </a>
                                </div>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {contact.phone ? (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-slate-400" />
                                  <a
                                    href={`tel:${contact.phone}`}
                                    className="text-slate-600 hover:text-slate-900 hover:underline font-medium"
                                  >
                                    {contact.phone}
                                  </a>
                                </div>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                {contact.position || 'N/A'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 rounded-lg">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl shadow-lg border-slate-200">
                                  <DropdownMenuItem onClick={() => handleEdit(contact)} className="cursor-pointer font-medium text-slate-700 rounded-lg focus:bg-slate-50">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(contact.id)}
                                    className="text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer font-medium rounded-lg"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100">
            <DialogTitle className="text-xl font-bold text-slate-800">
              {editingContact ? 'Edit Contact' : 'Add New Contact'}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1">
              {editingContact
                ? 'Update the contact information below.'
                : 'Fill in the contact information below.'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-5 p-6 pt-4 max-h-[65vh] overflow-y-auto">

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-semibold text-slate-700">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, fullName: e.target.value }))
                  }
                  placeholder="John Doe"
                  className="h-10 rounded-xl border-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="john@example.com"
                    className="h-10 rounded-xl border-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="+1 234 567 8900"
                    className="h-10 rounded-xl border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position" className="text-sm font-semibold text-slate-700">Position</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, position: e.target.value }))
                  }
                  placeholder="Manager, Assistant, etc."
                  className="h-10 rounded-xl border-slate-200"
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                <div className="space-y-1">
                  <Label htmlFor="isActive" className="text-sm font-bold text-slate-800">Active Profile Status</Label>
                  <p className="text-xs text-slate-500 font-medium">
                    Inactive contacts are hidden from view.
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

            <DialogFooter className="p-6 pt-4 border-t border-slate-100 bg-slate-50/30 gap-2 sm:gap-3">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="h-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading} className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium">
                {formLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingContact ? 'Update Contact' : 'Create Contact'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">Delete Contact</DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-2">
              Are you sure you want to delete this contact? This action cannot be undone and will permanently remove this profile.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)} className="h-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete} className="h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm font-medium">
              Delete Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
