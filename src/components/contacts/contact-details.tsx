import React, { useState } from 'react'
import { Contact } from '@/lib/api/contacts'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  Briefcase,
  Shield,
  Copy,
  Check,
  Edit,
  Star,
  Sparkles,
  Hash,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

interface ContactDetailsProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  customerName?: string;
  onEdit?: (contact: Contact) => void;
}

function getInitials(name: string) {
  if (!name) return 'C'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatDate(dateString?: string) {
  if (!dateString) return '-'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateString
  }
}

export function ContactDetails({
  contact,
  isOpen,
  onClose,
  customerName,
  onEdit,
}: ContactDetailsProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  if (!contact) return null

  const copyToClipboard = (text: string, label: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    toast.success(`${label} copied to clipboard`)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[620px] rounded-3xl p-0 overflow-hidden border border-border shadow-2xl bg-card text-card-foreground">
        
        {/* Hero Profile Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-background dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-background border-b border-border/80 px-6 pt-7 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 text-white font-bold text-xl shadow-md flex items-center justify-center ring-4 ring-background flex-shrink-0">
                {getInitials(contact.fullName)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">
                    {contact.fullName}
                  </h2>
                  <Badge 
                    variant={contact.isActive ? 'default' : 'secondary'}
                    className={
                      contact.isActive 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold' 
                        : 'bg-muted text-muted-foreground border-border text-xs'
                    }
                  >
                    {contact.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  {contact.isPrimary && (
                    <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 gap-1 text-xs font-semibold">
                      <Star className="size-3 fill-amber-500 text-amber-500" />
                      Primary Contact
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
                  {contact.position && (
                    <span className="font-medium text-foreground">{contact.position}</span>
                  )}
                  {contact.position && customerName && <span>•</span>}
                  {customerName && (
                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                      <Building2 className="size-3.5" />
                      {customerName}
                    </span>
                  )}
                  {!contact.position && !customerName && (
                    <span>Customer Contact Profile</span>
                  )}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              {contact.email && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 gap-1.5 rounded-xl border-border bg-background/80 hover:bg-background shadow-xs text-xs font-semibold cursor-pointer"
                  onClick={() => window.open(`mailto:${contact.email}`, '_self')}
                >
                  <Mail className="size-3.5 text-blue-600" />
                  Email
                </Button>
              )}
              {contact.phone && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 gap-1.5 rounded-xl border-border bg-background/80 hover:bg-background shadow-xs text-xs font-semibold cursor-pointer"
                  onClick={() => window.open(`tel:${contact.phone}`, '_self')}
                >
                  <Phone className="size-3.5 text-emerald-600" />
                  Call
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Body Content */}
        <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
          {/* Contact Details Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <User className="size-3.5 text-blue-600" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Email */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 mt-0.5">
                    <Mail className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">Email Address</p>
                    {contact.email ? (
                      <a 
                        href={`mailto:${contact.email}`}
                        className="text-sm font-semibold text-foreground hover:text-blue-600 dark:hover:text-blue-400 hover:underline truncate block mt-0.5"
                      >
                        {contact.email}
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground italic mt-0.5">Not provided</p>
                    )}
                  </div>
                </div>
                {contact.email && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                    onClick={() => copyToClipboard(contact.email!, 'Email', 'email')}
                    title="Copy email"
                  >
                    {copiedKey === 'email' ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                  </Button>
                )}
              </div>

              {/* Phone */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-0.5">
                    <Phone className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">Phone Number</p>
                    {contact.phone ? (
                      <a 
                        href={`tel:${contact.phone}`}
                        className="text-sm font-semibold text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline truncate block mt-0.5"
                      >
                        {contact.phone}
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground italic mt-0.5">Not provided</p>
                    )}
                  </div>
                </div>
                {contact.phone && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                    onClick={() => copyToClipboard(contact.phone!, 'Phone number', 'phone')}
                    title="Copy phone"
                  >
                    {copiedKey === 'phone' ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                  </Button>
                )}
              </div>

              {/* Company / Customer */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mt-0.5">
                  <Building2 className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">Customer Account</p>
                  <p className="text-sm font-semibold text-foreground truncate mt-0.5">
                    {customerName || 'None assigned'}
                  </p>
                </div>
              </div>

              {/* Position */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 mt-0.5">
                  <Briefcase className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">Position / Role</p>
                  <p className="text-sm font-semibold text-foreground truncate mt-0.5">
                    {contact.position || 'Not specified'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tags (if any) */}
          {Array.isArray(contact.tags) && contact.tags.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                <Sparkles className="size-3.5 text-amber-500" />
                Tags & Categorization
              </h3>
              <div className="flex flex-wrap gap-2">
                {contact.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-xs font-medium bg-muted text-foreground border border-border rounded-lg"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* System & Audit Metadata */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Shield className="size-3.5 text-slate-500" />
              System Metadata
            </h3>
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="size-3.5" /> Created Date
                </span>
                <span className="font-semibold text-foreground">{formatDate(contact.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-border/60 pt-2.5">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="size-3.5" /> Last Updated
                </span>
                <span className="font-semibold text-foreground">{formatDate(contact.updatedAt)}</span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-border/60 pt-2.5">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Hash className="size-3.5" /> Contact Record ID
                </span>
                <div className="flex items-center gap-1.5">
                  <code className="bg-background px-2 py-0.5 rounded border border-border text-[11px] font-mono text-muted-foreground">
                    {contact.id}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-6 text-muted-foreground hover:text-foreground cursor-pointer"
                    onClick={() => copyToClipboard(contact.id, 'Record ID', 'id')}
                    title="Copy ID"
                  >
                    {copiedKey === 'id' ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer Actions */}
        <div className="px-6 py-4 bg-muted/20 border-t border-border flex items-center justify-between gap-3">
          {onEdit ? (
            <Button 
              variant="outline" 
              onClick={() => {
                onClose()
                onEdit(contact)
              }} 
              className="h-10 px-4 rounded-xl border-border gap-2 font-medium hover:bg-muted cursor-pointer"
            >
              <Edit className="size-4 text-blue-600" />
              Edit Profile
            </Button>
          ) : (
            <div />
          )}
          <Button 
            variant="default" 
            onClick={onClose} 
            className="h-10 px-6 rounded-xl font-medium cursor-pointer"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
