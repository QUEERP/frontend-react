import React, { useEffect, useState } from 'react'
import { contactsAPI, Contact } from '@/lib/api/contacts'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit, Trash2, Phone, Mail, User, Eye } from 'lucide-react'
import { toast } from 'sonner'

interface ContactListProps {
  businessId: string;
  customerId?: string;
  contacts?: Contact[];
  loading?: boolean;
  onEdit?: (contact: Contact) => void;
  onView?: (contact: Contact) => void;
  onRefresh?: () => void;
  customersMap?: Record<string, string>;
}

export function ContactList({ 
  businessId, 
  customerId, 
  contacts: propContacts,
  loading: propLoading,
  onEdit, 
  onView,
  onRefresh,
  customersMap = {}
}: ContactListProps) {
  const [internalContacts, setInternalContacts] = useState<Contact[]>([])
  const [internalLoading, setInternalLoading] = useState(true)

  const isControlled = propContacts !== undefined
  const contacts = isControlled ? propContacts : internalContacts
  const loading = propLoading !== undefined ? propLoading : internalLoading

  const fetchContacts = async () => {
    if (isControlled) return
    try {
      setInternalLoading(true)
      const response = await contactsAPI.getContacts(businessId, customerId)
      if (response.success) {
        setInternalContacts(response.contacts)
      }
    } catch (error) {
      toast.error('Failed to fetch contacts')
    } finally {
      setInternalLoading(false)
    }
  }

  useEffect(() => {
    if (!isControlled) {
      fetchContacts()
    }
  }, [businessId, customerId, isControlled])

  const handleDelete = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return

    try {
      const response = await contactsAPI.deleteContact(businessId, contactId)
      if (response.success) {
        toast.success('Contact deleted successfully')
        if (!isControlled) {
          fetchContacts()
        }
        onRefresh?.()
      }
    } catch (error) {
      toast.error('Failed to delete contact')
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [businessId, customerId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
              <TableHead className="h-11 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Name</TableHead>
              <TableHead className="h-11 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Email</TableHead>
              <TableHead className="h-11 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Phone</TableHead>
              <TableHead className="h-11 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Position</TableHead>
              <TableHead className="h-11 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Customer</TableHead>
              <TableHead className="h-11 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Status</TableHead>
              <TableHead className="h-11 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Created</TableHead>
              <TableHead className="h-11 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id} className="hover:bg-muted/80 border-b border-border group transition-colors">
                <TableCell className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
                  <div 
                    className="flex items-center gap-2.5 cursor-pointer group"
                    onClick={() => onView?.(contact)}
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center flex-shrink-0 font-semibold text-xs">
                      {contact.fullName.charAt(0).toUpperCase()}
                    </div>
                    <span className="group-hover:text-blue-600 transition-colors font-semibold">
                      {contact.fullName}
                    </span>
                    {contact.isPrimary && (
                      <Badge className="bg-amber-100 text-amber-800 border-none text-[10px] px-1.5 py-0 font-bold ml-1">
                        Primary
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  {contact.email ? (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`mailto:${contact.email}`}
                        className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                      >
                        {contact.email}
                      </a>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  {contact.phone ? (
                    <div className="flex items-center gap-2 max-w-[170px]">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <a 
                        href={`tel:${contact.phone}`}
                        className="text-foreground hover:text-blue-600 hover:underline font-medium truncate"
                        title={contact.phone}
                      >
                        {contact.phone}
                      </a>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-muted text-foreground border border-border">
                    {contact.position || '—'}
                  </span>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                  {customersMap[contact.customerId] || '—'}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <Badge 
                    variant={contact.isActive ? 'default' : 'secondary'}
                    className={`text-xs ${contact.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-muted text-muted-foreground border-border'}`}
                  >
                    {contact.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-muted-foreground font-medium">
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell className="px-6 py-4 text-right whitespace-nowrap">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-lg">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl shadow-lg border-border">
                      <DropdownMenuItem onClick={() => onView?.(contact)} className="cursor-pointer font-medium rounded-lg">
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit?.(contact)} className="cursor-pointer font-medium rounded-lg">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(contact.id)}
                        className="text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer font-medium rounded-lg"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Contact
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {contacts.length === 0 && !loading && (
        <div className="text-center py-12 bg-muted/20 border-t border-border">
          <User className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-sm font-semibold text-foreground">No contacts found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {customerId ? 'This customer has no contacts yet.' : 'Get started by adding a new contact.'}
          </p>
        </div>
      )}
    </div>
  )
}
