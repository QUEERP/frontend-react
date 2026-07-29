import React, { useState, useEffect, useRef } from 'react'
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
  FolderOpen,
  FileText,
  File,
  FileSpreadsheet,
  Image,
  Download,
  Search,
  Upload,
  Trash2,
  MoreHorizontal,
  Eye,
  Loader2,
  FolderKanbanIcon,
  Share2Icon,
  X,
  FileUp,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const TYPE_BADGE: Record<string, string> = {
  PDF:   'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
  Excel: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  Word:  'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
  Image: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20',
  Other: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-700',
}

const CATEGORIES = ['All', 'Legal', 'Tax', 'Finance', 'HR', 'Branding', 'Other']

function getFileType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (!ext) return 'Other'
  if (['pdf'].includes(ext)) return 'PDF'
  if (['xlsx', 'xls', 'csv'].includes(ext)) return 'Excel'
  if (['doc', 'docx'].includes(ext)) return 'Word'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'Image'
  return 'Other'
}

function getFileIcon(type: string) {
  switch (type) {
    case 'PDF':   return FileText
    case 'Excel': return FileSpreadsheet
    case 'Image': return Image
    case 'Word':  return File
    default:      return File
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export default function DocumentsPage() {
  const params = useParams()
  

  const [loading, setLoading] = useState(true)
  const [docs, setDocs] = useState<any[]>([])
  const [search, setSearch]     = useState('')
  const [category, setCategory] = useState('All')

  // Upload Dialog
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [submitting, setSubmitting]     = useState(false)
  const [dragOver, setDragOver]         = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({ name: '', type: 'Other', category: 'Other', url: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/$/, '')

  const getHeaders = () => {
    const token = getCookie('token') || getCookie('accessToken')
    return { Authorization: `Bearer ${token}`, 'x-business-id': businessId }
  }

  useEffect(() => { fetchDocs() }, [businessId])

  const fetchDocs = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/api/documents`, { headers: getHeaders() })
      const data = await res.json()
      setDocs(data.documents || [])
    } catch (err: any) {
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  /* ── File selection ── */
  const handleFileSelected = (file: File) => {
    setSelectedFile(file)
    const detectedType = getFileType(file.name)
    setFormData(f => ({
      ...f,
      name: file.name,
      type: detectedType,
    }))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelected(file)
  }

  /* ── Upload submit ── */
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) return toast.error('File name is required')
    if (!selectedFile && !formData.url) return toast.error('Please select a file or enter a URL')

    setSubmitting(true)
    try {
      // Build payload — store file as data URL for local preview (production would use S3/Cloudinary)
      let fileUrl = formData.url
      let fileSize = '—'

      if (selectedFile) {
        fileSize = formatBytes(selectedFile.size)
        // Convert to data URL so it can be previewed
        fileUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(selectedFile)
        })
      }

      const payload = {
        name: formData.name,
        type: formData.type,
        size: fileSize,
        category: formData.category,
        url: fileUrl,
      }

      const res = await fetch(`${API_BASE}/api/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Upload failed')
      }

      toast.success('Document uploaded successfully')
      setIsUploadOpen(false)
      resetForm()
      fetchDocs()
    } catch (err: any) {
      toast.error(err.message || 'Error uploading document')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setFormData({ name: '', type: 'Other', category: 'Other', url: '' })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return
    try {
      await fetch(`${API_BASE}/api/documents/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      })
      toast.success('Deleted')
      setDocs(prev => prev.filter(d => d.id !== id))
    } catch {
      toast.error('Failed to delete')
    }
  }

  const filtered = docs.filter(d =>
    (category === 'All' || d.category === category) &&
    (search === '' || d.name.toLowerCase().includes(search.toLowerCase()))
  )

  /* ── Stats ── */
  const statCards = [
    { label: 'Total Files',  value: docs.length,                                              colorGroup: 'blue'    },
    { label: 'PDFs',         value: docs.filter(d => d.type === 'PDF').length,                colorGroup: 'rose'    },
    { label: 'Spreadsheets', value: docs.filter(d => d.type === 'Excel').length,              colorGroup: 'emerald' },
    { label: 'Other',        value: docs.filter(d => !['PDF','Excel'].includes(d.type)).length, colorGroup: 'violet'  },
  ]

  const colorMap: Record<string, string> = {
    blue:    'hover:border-b-blue-500    text-blue-600    bg-blue-50    dark:text-blue-400    dark:bg-blue-500/10',
    rose:    'hover:border-b-rose-500    text-rose-600    bg-rose-50    dark:text-rose-400    dark:bg-rose-500/10',
    emerald: 'hover:border-b-emerald-500 text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10',
    violet:  'hover:border-b-violet-500  text-violet-600  bg-violet-50  dark:text-violet-400  dark:bg-violet-500/10',
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-slate-50/50 dark:bg-slate-950/50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col gap-8 bg-slate-50/50 dark:bg-slate-950/50 px-4 pb-12 pt-6 sm:px-6 lg:px-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm">
            <FolderKanbanIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Document Center
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage business documents, certificates, and files securely.</p>
          </div>
        </div>

        <Dialog open={isUploadOpen} onOpenChange={(open) => { setIsUploadOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-10 px-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-sm transition-all hover:shadow-md gap-2">
              <Upload className="h-4 w-4" />
              Upload File
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileUp className="h-5 w-5 text-blue-500" />
                Upload Document
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleUpload} className="space-y-5 mt-2">
              {/* Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed cursor-pointer transition-all p-8
                  ${dragOver
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                    : selectedFile
                    ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelected(f) }}
                />
                {selectedFile ? (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatBytes(selectedFile.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); resetForm() }}
                      className="absolute top-3 right-3 rounded-full bg-slate-100 dark:bg-slate-800 p-1 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-slate-500 hover:text-rose-600 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-500">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Drag & drop or click to browse</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, Word, Excel, Images and more</p>
                    </div>
                  </>
                )}
              </div>

              {/* OR URL input */}
              {!selectedFile && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Or paste a document URL</Label>
                  <Input
                    placeholder="https://..."
                    value={formData.url}
                    onChange={e => setFormData(f => ({ ...f, url: e.target.value }))}
                  />
                </div>
              )}

              {/* File name */}
              <div className="space-y-1.5">
                <Label>File Name</Label>
                <Input
                  placeholder="e.g., Company Registration Certificate.pdf"
                  value={formData.name}
                  onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>File Type</Label>
                  <Select value={formData.type} onValueChange={v => setFormData(f => ({ ...f, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['PDF', 'Excel', 'Word', 'Image', 'Other'].map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={v => setFormData(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.filter(c => c !== 'All').map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => { setIsUploadOpen(false); resetForm() }}>Cancel</Button>
                <Button type="submit" disabled={submitting} className="gap-2">
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : <><Upload className="h-4 w-4" /> Upload</>}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Stats ── */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(s => (
          <Card key={s.label} className={`rounded-2xl border-x border-t border-b-[3px] border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all group overflow-hidden ${colorMap[s.colorGroup].split(' ')[0]}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                  <p className="text-3xl font-bold mt-2 bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">{s.value}</p>
                </div>
                <div className={`rounded-2xl p-4 transition-transform duration-300 group-hover:scale-110 shadow-sm ${colorMap[s.colorGroup].split(' ').slice(1).join(' ')}`}>
                  <FileText className="h-6 w-6 dark:opacity-80" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 backdrop-blur-xl">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 rounded-xl focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-10 w-full"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(c => (
            <Button
              key={c}
              variant={category === c ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategory(c)}
              className={`rounded-xl h-9 px-4 transition-colors shadow-sm ${
                category === c
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800'
              }`}
            >{c}</Button>
          ))}
        </div>
      </div>

      {/* ── Document List ── */}
      <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm overflow-hidden flex-1">
        <CardHeader className="border-b border-border/50 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
          <CardTitle className="text-base flex items-center gap-2 font-semibold">
            <FolderOpen className="h-5 w-5 text-blue-500" /> All Documents
            <Badge variant="secondary" className="rounded-full px-2.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 ml-2">{filtered.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                <FolderOpen className="h-8 w-8" />
              </div>
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">No documents yet</p>
                <p className="text-sm text-muted-foreground mt-1">Click "Upload File" to add your first document.</p>
              </div>
              <Button
                onClick={() => setIsUploadOpen(true)}
                variant="outline"
                className="rounded-xl gap-2 mt-2"
              >
                <Upload className="h-4 w-4" /> Upload File
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                    {['File Name', 'Type', 'Category', 'Size', 'Date Added', 'Actions'].map(h => (
                      <th key={h} className={`px-6 py-4 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filtered.map(doc => {
                    const Icon = getFileIcon(doc.type)
                    const iconBg =
                      doc.type === 'PDF'   ? 'bg-rose-100    dark:bg-rose-900/30    text-rose-600    dark:text-rose-400'    :
                      doc.type === 'Excel' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                      doc.type === 'Word'  ? 'bg-blue-100    dark:bg-blue-900/30    text-blue-600    dark:text-blue-400'    :
                      doc.type === 'Image' ? 'bg-violet-100  dark:bg-violet-900/30  text-violet-600  dark:text-violet-400'  :
                                            'bg-slate-100   dark:bg-slate-800       text-slate-600   dark:text-slate-400'

                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${iconBg}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <span className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer">
                              {doc.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={`font-semibold border ${TYPE_BADGE[doc.type] || TYPE_BADGE['Other']}`}>
                            {doc.type}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">{doc.category}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">{doc.size}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
                          {new Date(doc.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                                <MoreHorizontal className="h-4 w-4 text-slate-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                              {doc.url && (
                                <DropdownMenuItem
                                  className="cursor-pointer rounded-lg text-xs font-medium"
                                  onClick={() => window.open(doc.url, '_blank')}
                                >
                                  <Eye className="mr-2 h-4 w-4 text-blue-500" /> Preview File
                                </DropdownMenuItem>
                              )}
                              {doc.url && (
                                <DropdownMenuItem
                                  className="cursor-pointer rounded-lg text-xs font-medium"
                                  onClick={() => {
                                    const a = document.createElement('a')
                                    a.href = doc.url
                                    a.download = doc.name
                                    a.click()
                                  }}
                                >
                                  <Download className="mr-2 h-4 w-4 text-emerald-500" /> Download
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDelete(doc.id)}
                                className="cursor-pointer rounded-lg text-xs font-medium text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-500/10"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
