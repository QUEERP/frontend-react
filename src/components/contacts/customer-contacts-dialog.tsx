import React, { useState, useEffect } from 'react'
import { contactsAPI, Contact, CreateContactData } from '@/lib/api/contacts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
  Loader2,
  X
} from 'lucide-react'
import { toast } from 'sonner'

interface CustomerContactsDialogProps {
  businessId: string;
  customerId: string;
  customerName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CustomerContactsDialog({ 
  businessId, 
  customerId, 
  customerName,
  isOpen, 
  onClose 
}: CustomerContactsDialogProps) {
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
    if (isOpen) {
      fetchContacts()
    }
  }, [businessId, customerId, isOpen])

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
    if (!confirm('Are you sure you want to delete this contact?')) return

    try {
      const response = await contactsAPI.deleteContact(businessId, contactId)
      if (response.success) {
        toast.success('Contact deleted successfully')
        fetchContacts()
      }
    } catch (error) {
      toast.error('Failed to delete contact')
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Contacts - {customerName}
                <Badge variant="secondary">{contacts.length}</Badge>
              </DialogTitle>
              <DialogDescription>
                Manage contacts for this customer
              </DialogDescription>
            </div>
            <Button onClick={handleCreate} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8">
              <User className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No contacts</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add contacts to manage key people at this customer.
              </p>
              <Button onClick={handleCreate} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add First Contact
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Active Contacts */}
              {activeContacts.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Active Contacts</h4>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Position</TableHead>
                          <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeContacts.map((contact) => (
                          <TableRow key={contact.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                {contact.fullName}
                              </div>
                            </TableCell>
                            <TableCell>
                              {contact.email ? (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  <a 
                                    href={`mailto:${contact.email}`}
                                    className="text-blue-600 hover:underline"
                                  >
                                    {contact.email}
                                  </a>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {contact.phone ? (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <a 
                                    href={`tel:${contact.phone}`}
                                    className="text-blue-600 hover:underline"
                                  >
                                    {contact.phone}
                                  </a>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted">
                                {contact.position || 'N/A'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(contact)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDelete(contact.id)}
                                    className="text-red-600 focus:text-red-600"
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
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Inactive Contacts</h4>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Position</TableHead>
                          <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inactiveContacts.map((contact) => (
                          <TableRow key={contact.id} className="opacity-60">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                {contact.fullName}
                              </div>
                            </TableCell>
                            <TableCell>
                              {contact.email ? (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  <a 
                                    href={`mailto:${contact.email}`}
                                    className="text-blue-600 hover:underline"
                                  >
                                    {contact.email}
                                  </a>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {contact.phone ? (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <a 
                                    href={`tel:${contact.phone}`}
                                    className="text-blue-600 hover:underline"
                                  >
                                    {contact.phone}
                                  </a>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted">
                                {contact.position || 'N/A'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(contact)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDelete(contact.id)}
                                    className="text-red-600 focus:text-red-600"
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
        </div>

        {/* Contact Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingContact ? 'Edit Contact' : 'Add New Contact'}
              </DialogTitle>
              <DialogDescription>
                {editingContact 
                  ? 'Update contact information below.'
                  : 'Fill in the contact information below.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => 
                    setFormData(prev => ({ ...prev, fullName: e.target.value }))
                  }
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => 
                      setFormData(prev => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="john@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => 
                      setFormData(prev => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => 
                    setFormData(prev => ({ ...prev, position: e.target.value }))
                  }
                  placeholder="Manager, Assistant, etc."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, isActive: checked }))
                  }
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingContact ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
