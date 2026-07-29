import React from 'react'
import { Contact } from '@/lib/api/contacts'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  Briefcase,
  Shield,
  X,
} from 'lucide-react'

interface ContactDetailsProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ContactDetails({ contact, isOpen, onClose }: ContactDetailsProps) {
  if (!contact) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] rounded-2xl p-0 overflow-hidden bg-slate-50/50">
        <DialogHeader className="px-6 py-4 bg-white border-b border-slate-100 m-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <User className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-slate-800">Contact Details</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 rounded-full hover:bg-slate-100 text-slate-500">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription className="text-sm font-medium text-slate-500 mt-2">
            View detailed information about this contact profile.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 px-6 py-6 h-full max-h-[70vh] overflow-y-auto">
          {/* Contact Header */}
          <Card className="rounded-xl border border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg font-bold text-slate-800">{contact.fullName}</span>
                <Badge 
                  variant={contact.isActive ? 'default' : 'secondary'}
                  className={`text-xs ${contact.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}
                >
                  {contact.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {contact.position && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Position</p>
                    <span className="font-bold text-slate-900">{contact.position}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="rounded-xl border border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {contact.email && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Email Address</p>
                    <a 
                      href={`mailto:${contact.email}`}
                      className="text-blue-600 hover:text-blue-700 hover:underline font-bold text-sm"
                    >
                      {contact.email}
                    </a>
                  </div>
                </div>
              )}

              {contact.phone && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Phone Number</p>
                    <a 
                      href={`tel:${contact.phone}`}
                      className="text-slate-900 hover:text-slate-700 hover:underline font-bold text-sm"
                    >
                      {contact.phone}
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                  <Building className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Customer ID</p>
                  <code className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md font-bold">
                    {contact.customerId}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card className="rounded-xl border border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Shield className="h-4 w-4 text-slate-500" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Created Date</p>
                  <p className="text-sm font-bold text-slate-900">
                    {formatDate(contact.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Last Updated</p>
                  <p className="text-sm font-bold text-slate-900">
                    {formatDate(contact.updatedAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Contact Record ID</p>
                  <code className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md font-bold">
                    {contact.id}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Action Buttons */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="h-10 px-6 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-medium">
            Close Panel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
