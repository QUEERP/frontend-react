import React, { useState, useEffect, useCallback } from 'react'
import {  useParams, useNavigate  } from 'react-router-dom';
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  FileText, 
  Plus, 
  Loader2, 
  Trash2, 
  Calendar,
  Sparkles,
  Link2,
  Search,
  User,
  Building,
  Briefcase,
  UserPlus
} from 'lucide-react'
import { CreateCustomerModal } from '@/components/dashboard/create-customer-modal'
import { toast } from 'sonner'
import { getCookie } from '@/lib/utils'

interface Note {
  id: string
  content: string
  leadId?: string
  dealId?: string
  customerId?: string
  contactId?: string
  createdAt: string
  lead?: { name: string }
  deal?: { name: string }
  customer?: { company: string }
  contact?: { fullName: string }
  createdBy?: { user?: { name: string } }
}

interface Lead { id: string; name: string }
interface Deal { id: string; name: string }
interface Customer { id: string; company: string }

export default function NotesPage() {
  const params = useParams()
  const navigate = useNavigate()
  
  
  const [notes, setNotes] = useState<Note[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showCreateCustomer, setShowCreateCustomer] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    content: '',
    leadId: '',
    dealId: '',
    customerId: '',
  })

  const API_BASE = (import.meta.env.VITE_API_BASE || '').trim()
  const API_ROOT = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`

  const getHeaders = useCallback(() => {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) throw new Error('No authentication token found')
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-business-id': businessId,
    }
  }, [businessId])

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_ROOT}/crm-notes`, {
        headers: getHeaders(),
      })
      if (!response.ok) throw new Error('Failed to load notes')
      const data = await response.json()
      if (data.success) {
        setNotes(data.notes || [])
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch notes')
    } finally {
      setLoading(false)
    }
  }, [API_ROOT, getHeaders])

  const fetchRelations = useCallback(async () => {
    try {
      const headers = getHeaders()
      const [leadsRes, dealsRes, customersRes] = await Promise.all([
        fetch(`${API_ROOT}/leads`, { headers }),
        fetch(`${API_ROOT}/deals`, { headers }),
        fetch(`${API_ROOT}/customers`, { headers }),
      ])
      
      if (leadsRes.ok) setLeads((await leadsRes.json()).leads || [])
      if (dealsRes.ok) setDeals((await dealsRes.json()).deals || [])
      if (customersRes.ok) setCustomers((await customersRes.json()).customers || [])
    } catch (error) {
      console.error('Relations loading failed:', error)
    }
  }, [API_ROOT, getHeaders])

  useEffect(() => {
    fetchNotes()
    fetchRelations()
  }, [fetchNotes, fetchRelations])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.content.trim()) {
      toast.error('Note content is required')
      return
    }

    setFormLoading(true)
    try {
      const payload = {
        content: formData.content,
        leadId: formData.leadId || undefined,
        dealId: formData.dealId || undefined,
        customerId: formData.customerId || undefined,
      }
      
      const response = await fetch(`${API_ROOT}/crm-notes`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('Failed to create Note')
      const data = await response.json()
      
      if (data.success) {
        toast.success('Note logged successfully!')
        setShowAddForm(false)
        setFormData({
          content: '',
          leadId: '',
          dealId: '',
          customerId: '',
        })
        fetchNotes()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create note')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return
    try {
      const response = await fetch(`${API_ROOT}/crm-notes/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      })

      if (!response.ok) throw new Error('Failed to delete Note')
      const data = await response.json()
      
      if (data.success) {
        toast.success('Note removed')
        fetchNotes()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete note')
    }
  }

  const filteredNotes = notes.filter(n => 
    n.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.lead?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.deal?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.customer?.company.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-[#f8fafc] dark:bg-slate-950 px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex min-w-0 items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-xl hidden sm:block">
            <FileText className="h-6 w-6" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">CRM Notes</span>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">Log internal comments, strategy logs, and client conversation notes.</span>
          </div>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 shadow-sm cursor-pointer transition-colors shrink-0">
          {showAddForm ? 'Close Form' : (
            <>
              <Plus className="h-4 w-4" />
              Add CRM Note
            </>
          )}
        </Button>
      </div>

      {/* QUICK ADD FORM */}
      {showAddForm && (
        <div className="rounded-2xl border-t-4 border-t-indigo-500 border-x border-b border-x-slate-200 border-b-slate-200 dark:border-x-slate-800 dark:border-b-slate-800 bg-white dark:bg-slate-900 shadow-md animate-in fade-in slide-in-from-top-2 duration-200 transition-colors overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Create Corporate Internal Note</h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Jot down details, updates, or plans. Bind note polymorphic-style to a lead, deal, or customer.</p>
            </div>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <Label htmlFor="content" className="text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Note Content <span className="text-rose-500">*</span></Label>
                <Textarea 
                  id="content" 
                  value={formData.content} 
                  onChange={(e) => handleInputChange('content', e.target.value)} 
                  placeholder="Type notes here..."
                  rows={4}
                  className="rounded-xl border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="lead" className="text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Link to Lead</Label>
                  <Select value={formData.leadId} onValueChange={(val) => handleInputChange('leadId', val === 'none' ? '' : val)}>
                    <SelectTrigger id="lead" className="rounded-xl border-slate-200 dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100">
                      <SelectValue placeholder="Optional: Select lead" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 dark:border-slate-800 rounded-xl">
                      <SelectItem value="none" className="dark:focus:bg-slate-800 cursor-pointer rounded-lg text-slate-400">-- None --</SelectItem>
                      {leads.map((l) => (
                        <SelectItem key={l.id} value={l.id} className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="deal" className="text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Link to Deal</Label>
                  <Select value={formData.dealId} onValueChange={(val) => handleInputChange('dealId', val === 'none' ? '' : val)}>
                    <SelectTrigger id="deal" className="rounded-xl border-slate-200 dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100">
                      <SelectValue placeholder="Optional: Select deal" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 dark:border-slate-800 rounded-xl">
                      <SelectItem value="none" className="dark:focus:bg-slate-800 cursor-pointer rounded-lg text-slate-400">-- None --</SelectItem>
                      {deals.map((d) => (
                        <SelectItem key={d.id} value={d.id} className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="customer" className="text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Link to Account</Label>
                  <Select value={formData.customerId} onValueChange={(val) => handleInputChange('customerId', val === 'none' ? '' : val)}>
                    <SelectTrigger id="customer" className="rounded-xl border-slate-200 dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100">
                      <SelectValue placeholder="Optional: Select account" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 dark:border-slate-800 rounded-xl">
                      <SelectItem value="none" className="dark:focus:bg-slate-800 cursor-pointer rounded-lg text-slate-400">-- None --</SelectItem>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">{c.company}</SelectItem>
                      ))}
                      <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); setShowCreateCustomer(true) }}
                          className="flex w-full items-center gap-2 px-2 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded cursor-pointer transition-colors"
                        >
                          <UserPlus className="h-4 w-4" />
                          + Create Customer
                        </button>
                      </div>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 dark:border-slate-800 mt-6">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="rounded-xl h-10 px-6 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer">Cancel</Button>
                <Button type="submit" disabled={formLoading} className="rounded-xl h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 shadow-sm cursor-pointer">
                  {formLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                  Create Note
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SEARCH AND FILTERS */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Search notes content or linked entity name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 rounded-xl border-slate-200 dark:border-slate-800 h-11 bg-white dark:bg-slate-900 shadow-sm focus-visible:ring-blue-500 dark:text-slate-100 transition-colors"
        />
      </div>

      {/* RENDER NOTES */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" />
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-dashed rounded-2xl shadow-sm">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-full w-max mx-auto mb-4 border border-slate-100 dark:border-slate-800">
            <FileText className="h-8 w-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">No Notes Logged</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto text-sm font-medium">
            Keep clear records of corporate strategies, user profiles, or call transcripts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((n) => (
            <div key={n.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
              <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-start">
                <div className="space-y-1">
                  <div className="text-sm font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(n.createdAt).toLocaleDateString()}
                  </div>
                  {n.createdBy?.user?.name && (
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">By {n.createdBy.user.name}</p>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg shrink-0 cursor-pointer"
                  onClick={() => handleDelete(n.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{n.content}</p>
                
                {/* Linked Badges */}
                {(n.leadId || n.dealId || n.customerId) && (
                  <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-700 mt-auto">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                      <Link2 className="h-3 w-3" />
                      Linked:
                    </span>
                    {n.lead && (
                      <span className="inline-flex items-center gap-1 bg-yellow-100 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 text-yellow-800 dark:text-yellow-400 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider">
                        <User className="h-3 w-3" />
                        Lead: {n.lead.name}
                      </span>
                    )}
                    {n.deal && (
                      <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-400 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider">
                        <Briefcase className="h-3 w-3" />
                        Deal: {n.deal.name}
                      </span>
                    )}
                    {n.customer && (
                      <span className="inline-flex items-center gap-1 bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-800 dark:text-indigo-400 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider">
                        <Building className="h-3 w-3" />
                        Acct: {n.customer.company}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <CreateCustomerModal
        open={showCreateCustomer}
        onClose={() => setShowCreateCustomer(false)}
        businessId={businessId}
        onCreated={(newCust) => {
          setCustomers((prev) => [
            ...prev,
            { id: newCust.id, company: newCust.company || newCust.name || '' },
          ])
          handleInputChange('customerId', newCust.id)
        }}
      />
    </div>
  )
}
