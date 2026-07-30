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
  onEdit?: (contact: Contact) => void;
  onView?: (contact: Contact) => void;
  onRefresh?: () => void;
}

export function ContactList({ 
  businessId, 
  customerId, 
  onEdit, 
  onView,
  onRefresh 
}: ContactListProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

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

  const handleDelete = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return

    try {
      const response = await contactsAPI.deleteContact(businessId, contactId)
      if (response.success) {
        toast.success('Contact deleted successfully')
        fetchContacts()
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
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 overflow-x-auto bg-white">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-700 whitespace-nowrap">Name</TableHead>
              <TableHead className="font-semibold text-slate-700 whitespace-nowrap">Email</TableHead>
              <TableHead className="font-semibold text-slate-700 whitespace-nowrap">Phone</TableHead>
              <TableHead className="font-semibold text-slate-700 whitespace-nowrap">Position</TableHead>
              <TableHead className="font-semibold text-slate-700 whitespace-nowrap">Status</TableHead>
              <TableHead className="font-semibold text-slate-700 whitespace-nowrap">Created</TableHead>
              <TableHead className="w-[70px] text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
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
                <TableCell className="whitespace-nowrap">
                  <Badge 
                    variant={contact.isActive ? 'default' : 'secondary'}
                    className={`text-xs ${contact.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'}`}
                  >
                    {contact.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="text-sm text-slate-500 font-medium">
                    {new Date(contact.createdAt).toLocaleDateString()}
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
                      <DropdownMenuItem onClick={() => onView?.(contact)} className="cursor-pointer font-medium text-slate-700 rounded-lg focus:bg-slate-50">
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit?.(contact)} className="cursor-pointer font-medium text-slate-700 rounded-lg focus:bg-slate-50">
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
        <div className="text-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          <User className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-sm font-semibold text-slate-900">No contacts found</h3>
          <p className="mt-2 text-sm text-slate-500">
            {customerId ? 'This customer has no contacts yet.' : 'Get started by adding a new contact.'}
          </p>
        </div>
      )}
    </div>
  )
}
