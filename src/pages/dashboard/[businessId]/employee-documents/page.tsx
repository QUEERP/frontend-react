import React, { useState, useEffect } from 'react'
import {  useParams  } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { getCookie } from '@/lib/utils'
import {
  Users, FileText, Upload, Search, Download, Eye, Trash2, MoreHorizontal, AlertCircle, CheckCircle2, Clock, 
  FileSearchIcon, FileBadgeIcon, ShieldCheckIcon, AlertTriangleIcon, UserSquareIcon, Loader2
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const STATUS_BADGE: Record<string, string> = {
  Verified: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  Pending:  'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  Expired:  'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
}

export default function EmployeeDocumentsPage() {
  const routerParams = useParams() as any;
  const { businessId } = routerParams;

  const params = useParams()
  

  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<any[]>([])
  const [docs, setDocs] = useState<any[]>([])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    employeeId: '',
    type: '',
    status: 'Pending',
    url: '',
    expires: ''
  })

  useEffect(() => {
    fetchData()
  }, [businessId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = getCookie('token') || getCookie('accessToken')
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/$/, '')
      
      const empRes = await fetch(`${API_BASE}/api/employees`, {
        headers: { Authorization: `Bearer ${token}`, 'x-business-id': businessId as string }
      })
      const empData = await empRes.json()
      setEmployees(empData.employees || empData.data || [])

      const docRes = await fetch(`${API_BASE}/api/employee-documents`, {
        headers: { Authorization: `Bearer ${token}`, 'x-business-id': businessId as string }
      })
      const docData = await docRes.json()
      
      const formatted = (docData.documents || []).map((d: any) => ({
        id: d.id,
        employee: d.employee?.name || 'Unknown',
        type: d.type,
        status: d.status,
        uploaded: d.createdAt,
        expires: d.expires,
        url: d.url
      }))
      setDocs(formatted)

    } catch (err: any) {
      toast.error(err.message || 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.employeeId || !formData.type) return toast.error('Employee and Type are required')

    setSubmitting(true)
    try {
      const token = getCookie('token') || getCookie('accessToken')
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/$/, '')

      const res = await fetch(`${API_BASE}/api/employee-documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId as string
        },
        body: JSON.stringify(formData)
      })

      if (!res.ok) throw new Error('Failed to upload')
      
      toast.success('Document added successfully')
      setIsUploadOpen(false)
      setFormData({ employeeId: '', type: '', status: 'Pending', url: '', expires: '' })
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Error uploading document')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure you want to delete this document?")) return;
    try {
      const token = getCookie('token') || getCookie('accessToken')
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/$/, '')

      await fetch(`${API_BASE}/api/employee-documents/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'x-business-id': businessId as string }
      })
      toast.success('Deleted successfully')
      setDocs(prev => prev.filter(d => d.id !== id))
    } catch (err: any) {
      toast.error('Failed to delete document')
    }
  }

  const filtered = docs.filter(d =>
    (statusFilter === 'All' || d.status === statusFilter) &&
    (search === '' || d.employee.toLowerCase().includes(search.toLowerCase()) || d.type.toLowerCase().includes(search.toLowerCase()))
  )

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-slate-50/50 dark:bg-slate-950/50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col gap-8 bg-slate-50/50 dark:bg-slate-950/50 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm">
            <UserSquareIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Employee Documents
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage compliance, HR records, and identity files securely.</p>
          </div>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-10 px-6 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white shadow-sm transition-all hover:shadow-md gap-2">
              <Upload className="h-4 w-4" /> 
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Employee Document</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Employee</Label>
                <Select value={formData.employeeId} onValueChange={(v) => setFormData({...formData, employeeId: v})}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Input placeholder="e.g., Offer Letter, Aadhaar Card" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                    <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Verified">Verified</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date (Optional)</Label>
                  <Input type="date" value={formData.expires} onChange={e => setFormData({...formData, expires: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Document URL</Label>
                <Input placeholder="https://..." value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Files', value: docs.length,                               icon: FileSearchIcon, colorGroup: 'blue'    },
          { label: 'Verified',    value: docs.filter(d => d.status === 'Verified').length, icon: ShieldCheckIcon, colorGroup: 'emerald' },
          { label: 'Pending',     value: docs.filter(d => d.status === 'Pending').length,  icon: Clock, colorGroup: 'amber'   },
          { label: 'Expired',     value: docs.filter(d => d.status === 'Expired').length,  icon: AlertTriangleIcon, colorGroup: 'rose'    },
        ].map(s => {
          const colorStyles: Record<string, string> = {
            blue: 'hover:border-b-blue-500 text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10',
            emerald: 'hover:border-b-emerald-500 text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10',
            amber: 'hover:border-b-amber-500 text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10',
            rose: 'hover:border-b-rose-500 text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10',
          }
          return (
            <Card key={s.label} className={`rounded-2xl border-x border-t border-b-[3px] border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all group overflow-hidden ${colorStyles[s.colorGroup].split(' ')[0]}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                    <p className="text-3xl font-bold mt-2 bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">{s.value}</p>
                  </div>
                  <div className={`rounded-2xl p-4 transition-transform duration-300 group-hover:scale-110 shadow-sm ${colorStyles[s.colorGroup].split(' ').slice(1).join(' ')}`}>
                    <s.icon className="h-6 w-6 dark:opacity-80" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 backdrop-blur-xl">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by employee or document type..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pl-9 rounded-xl transition-all focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-10 w-full" 
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['All', 'Verified', 'Pending', 'Expired'].map(s => (
            <Button 
              key={s} 
              variant={statusFilter === s ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setStatusFilter(s)}
              className={`rounded-xl h-9 px-4 transition-colors shadow-sm ${
                statusFilter === s 
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' 
                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800'
              }`}
            >{s}</Button>
          ))}
        </div>
      </div>

      {/* Document Records */}
      <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm overflow-hidden flex-1">
        <CardHeader className="border-b border-border/50 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
          <CardTitle className="text-base flex items-center gap-2 font-semibold">
            <FileBadgeIcon className="h-5 w-5 text-indigo-500" />
            Compliance Directory
            <Badge variant="secondary" className="rounded-full px-2.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 ml-2">{filtered.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center gap-3">
              <FileSearchIcon className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
              <p className="text-sm text-muted-foreground">No documents found matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                    {['Employee', 'Document Type', 'Status', 'Uploaded', 'Expires', 'Actions'].map(h => (
                      <th key={h} className={`px-6 py-4 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filtered.map(doc => (
                    <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/40 dark:to-indigo-800/40 text-indigo-700 dark:text-indigo-300 font-semibold text-xs shadow-sm shrink-0">
                            {getInitials(doc.employee)}
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{doc.employee}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-slate-700 dark:text-slate-300">{doc.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={`font-semibold border px-2.5 py-0.5 ${STATUS_BADGE[doc.status] || ''}`}>
                          {doc.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">{new Date(doc.uploaded).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                      <td className="px-6 py-4">
                        {doc.expires ? (
                          <span className={`font-medium ${doc.status === 'Expired' ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                            {new Date(doc.expires).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                              <MoreHorizontal className="h-4 w-4 text-slate-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            {doc.url && <DropdownMenuItem className="cursor-pointer rounded-lg text-xs font-medium" onClick={() => window.open(doc.url, '_blank')}><Eye className="mr-2 h-4 w-4 text-indigo-500" /> View Document</DropdownMenuItem>}
                            <DropdownMenuItem onClick={() => handleDelete(doc.id)} className="cursor-pointer rounded-lg text-xs font-medium text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-500/10">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Record
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
