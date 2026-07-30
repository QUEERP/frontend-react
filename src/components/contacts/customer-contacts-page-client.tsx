import React, { useState, useEffect } from 'react'
import {  useNavigate  } from 'react-router-dom';
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
  Loader2,
  ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'

interface CustomerContactsPageClientProps {
  businessId: string;
  customerId: string;
  customer?: any;
}

interface ContactFormState {
  customerId: string;
  fullName: string;
  email: string;
  phone: string;
  position: string;
  isActive: boolean;
  isPrimary: boolean;
  tags: string;
}

export function CustomerContactsPageClient({ 
  businessId, 
  customerId, 
  customer 
}: CustomerContactsPageClientProps) {
  const navigate = useNavigate()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [displayCustomer, setDisplayCustomer] = useState<any>(null)
  const [customerLoading, setCustomerLoading] = useState(true)
  const [formData, setFormData] = useState<ContactFormState>({
    customerId,
    fullName: '',
    email: '',
    phone: '',
    position: '',
    isActive: true,
    isPrimary: false,
    tags: '',
  })
  const [formLoading, setFormLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<string | null>(null)

  // Fetch customer details
  useEffect(() => {
    if (!displayCustomer && businessId) {
      const fetchCustomerDirectly = async () => {
        try {
          setCustomerLoading(true)
          const token = getCookie('token') || getCookie('accessToken')
          if (!token) return

          const response = await fetch(`${import.meta.env.VITE_API_BASE || ''}/api/customers/${customerId}`, {
            headers: { 
              Authorization: `Bearer ${token}`, 
              'x-business-id': businessId 
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              setDisplayCustomer(data.customer)
            }
          }
        } catch (error) {
          console.error('Failed to fetch customer:', error)
        } finally {
          setCustomerLoading(false)
        }
      }

      fetchCustomerDirectly()
    }
  }, [businessId, customerId, displayCustomer])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const response = await contactsAPI.getContacts(businessId, customerId)
      if (response.success && Array.isArray(response.contacts)) {
        setContacts(response.contacts)
      } else {
        setContacts([])
      }
    } catch (error) {
      toast.error('Failed to fetch contacts')
      setContacts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [businessId, customerId])

  const getCookie = (name: string): string => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\\^])/g, '\\$1') + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : ''
  }

  const handleCreate = () => {
    setEditingContact(null)
    setFormData({
      customerId,
      fullName: '',
      email: '',
      phone: '',
      position: '',
      isActive: true,
      isPrimary: false,
      tags: '',
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
      isPrimary: !!contact.isPrimary,
      tags: Array.isArray(contact.tags) ? contact.tags.join(', ') : '',
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
      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      }
      if (editingContact) {
        await contactsAPI.updateContact(businessId, editingContact.id, payload)
        toast.success('Contact updated successfully')
      } else {
        await contactsAPI.createContact(businessId, payload)
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

  const activeContacts = (contacts || []).filter(c => c && c.isActive)
  const inactiveContacts = (contacts || []).filter(c => c && !c.isActive)

  const backToCustomer = () => {
    navigate(`/dashboard/${businessId}/customers`)
  }

  if (customerLoading) {
    return (
      <div className="flex items-center justify-center min-h-svh">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-10 pt-0 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={backToCustomer} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Customer
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Contacts</h1>
            <p className="text-muted-foreground">
              {customer?.name || 'Customer'} - Contact Management
            </p>
          </div>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {/* Customer Info Card */}
      {customer && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
              <Badge variant={customer.isActive ? 'default' : 'secondary'} className="ml-2">
                {customer.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Company:</span>
                  <span>{customer.company || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Email:</span>
                  <span>{customer.email || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Phone:</span>
                  <span>{customer.phone || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  <Badge variant={customer.isActive ? 'default' : 'secondary'}>
                    {customer.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Customer ID:</span>
                  <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                    {customerId}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contacts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Contacts
            <Badge variant="secondary">{contacts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeContacts.map((contact) => (
                          <TableRow key={contact.id}>
                            <TableCell className="font-medium">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span>{contact.fullName}</span>
                                  {contact.isPrimary && (
                                    <Badge className="bg-amber-500 hover:bg-amber-600 text-[10px] py-0 px-1.5 h-4">
                                      Primary
                                    </Badge>
                                  )}
                                </div>
                                {Array.isArray(contact.tags) && contact.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {contact.tags.map(t => (
                                      <Badge key={t} variant="outline" className="text-[9px] px-1 py-0 h-3.5">
                                        {t}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
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
                              <Badge 
                                variant={contact.isActive ? 'default' : 'secondary'}
                                className="w-fit"
                              >
                                {contact.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(contact)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(contact.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
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
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inactiveContacts.map((contact) => (
                          <TableRow key={contact.id} className="opacity-60">
                            <TableCell className="font-medium">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span>{contact.fullName}</span>
                                  {contact.isPrimary && (
                                    <Badge className="bg-amber-500 hover:bg-amber-600 text-[10px] py-0 px-1.5 h-4">
                                      Primary
                                    </Badge>
                                  )}
                                </div>
                                {Array.isArray(contact.tags) && contact.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {contact.tags.map(t => (
                                      <Badge key={t} variant="outline" className="text-[9px] px-1 py-0 h-3.5">
                                        {t}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
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
                              <Badge 
                                variant={contact.isActive ? 'default' : 'secondary'}
                                className="w-fit"
                              >
                                {contact.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(contact)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(contact.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
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

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => 
                  setFormData(prev => ({ ...prev, tags: e.target.value }))
                }
                placeholder="Decision Maker, VIP"
              />
            </div>

            <div className="flex items-center space-x-4">
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

              <div className="flex items-center space-x-2">
                <Switch
                  id="isPrimary"
                  checked={formData.isPrimary}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, isPrimary: checked }))
                  }
                />
                <Label htmlFor="isPrimary">Primary Contact</Label>
              </div>
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
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this contact? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
