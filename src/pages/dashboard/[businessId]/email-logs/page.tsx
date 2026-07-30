import React, { useState, useEffect } from 'react'
import {  useParams  } from 'react-router-dom';
import { emailLogsAPI, EmailLog } from '@/lib/api/crm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Mail,
  Plus,
  Loader2,
  Search,
  Calendar,
  Send,
  User,
  CheckCircle,
  Eye,
  AlertTriangle,
  ArrowDownRight
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function EmailLogsPage() {
  const routerParams = useParams() as any;
  const { businessId } = routerParams;

  const params = useParams()
  

  const [logs, setLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    fromEmail: 'sales@deltaledger.com',
    toEmail: '',
    body: '',
    status: 'SENT',
  })

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const res = await emailLogsAPI.getAll(businessId)
      if (res.success && Array.isArray(res.data)) {
        setLogs(res.data)
      } else {
        setLogs([])
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load email logs')
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [businessId])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.toEmail.trim() || !formData.subject.trim()) {
      toast.error('Recipient and Subject are required')
      return
    }

    setFormLoading(true)
    try {
      const res = await emailLogsAPI.create(businessId, formData)
      if (res.success) {
        toast.success('Email dispatched and logged successfully!')
        setShowAddForm(false)
        setFormData({
          subject: '',
          fromEmail: 'sales@deltaledger.com',
          toEmail: '',
          body: '',
          status: 'SENT',
        })
        fetchLogs()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to dispatch email')
    } finally {
      setFormLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPENED': return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shadow-sm px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px] gap-1"><Eye className="h-3 w-3" /> Opened</Badge>
      case 'DELIVERED': return <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-500/10 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20 shadow-sm px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px] gap-1"><CheckCircle className="h-3 w-3" /> Delivered</Badge>
      case 'SENT': return <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px] gap-1"><Send className="h-3 w-3" /> Sent</Badge>
      case 'FAILED': return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 shadow-sm px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px] gap-1"><AlertTriangle className="h-3 w-3" /> Failed</Badge>
      default: return <Badge variant="outline" className="shadow-sm px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px] dark:border-slate-700 dark:text-slate-300">{status}</Badge>
    }
  }

  // Filter logs by search query
  const filteredLogs = (logs || []).filter(log => {
    if (!log) return false
    const subject = (log.subject || '').toLowerCase()
    const toEmail = (log.toEmail || '').toLowerCase()
    const body = (log.body || '').toLowerCase()
    const query = (searchQuery || '').toLowerCase()
    return subject.includes(query) || toEmail.includes(query) || body.includes(query)
  })

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-[#f8fafc] dark:bg-slate-950 px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex min-w-0 items-center gap-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-500/10 text-purple-500 rounded-xl hidden sm:block">
            <Mail className="h-6 w-6" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">CRM Correspondence Audit</span>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">Audit trail of outbound marketing and transaction mail logs.</span>
          </div>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 shadow-sm cursor-pointer transition-colors shrink-0">
          {showAddForm ? 'Close Dispatcher' : (
            <>
              <Plus className="h-4 w-4" />
              Compose Email Log
            </>
          )}
        </Button>
      </div>

      {/* QUICK COMPOSER FORM */}
      {showAddForm && (
        <div className="rounded-2xl border-t-4 border-t-purple-500 border-x border-b border-x-slate-200 border-b-slate-200 dark:border-x-slate-800 dark:border-b-slate-800 bg-white dark:bg-slate-900 shadow-md animate-in fade-in slide-in-from-top-2 duration-200 transition-colors overflow-hidden w-full">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-3">
            <Send className="h-5 w-5 text-purple-500" />
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Log Outbound Message</h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Records a simulated SMTP mail dispatch in lead timeline journals.</p>
            </div>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="fromEmail" className="text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Sender address (Outgoing)</Label>
                  <Input
                    id="fromEmail"
                    value={formData.fromEmail}
                    onChange={(e) => handleInputChange('fromEmail', e.target.value)}
                    placeholder="sales@business.com"
                    className="rounded-xl border-slate-200 dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="toEmail" className="text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Recipient address <span className="text-rose-500">*</span></Label>
                  <Input
                    id="toEmail"
                    type="email"
                    value={formData.toEmail}
                    onChange={(e) => handleInputChange('toEmail', e.target.value)}
                    placeholder="client@gmail.com"
                    required
                    className="rounded-xl border-slate-200 dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Subject Line <span className="text-rose-500">*</span></Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder="e.g. Agreement draft review"
                  required
                  className="rounded-xl border-slate-200 dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="body" className="text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Email Body (Markdown supported)</Label>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) => handleInputChange('body', e.target.value)}
                  placeholder="Dear client, please check..."
                  rows={6}
                  className="rounded-xl border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100 resize-none font-mono text-sm"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 dark:border-slate-800 mt-6">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="rounded-xl h-10 px-6 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer">Cancel</Button>
                <Button type="submit" disabled={formLoading} className="rounded-xl h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 shadow-sm cursor-pointer">
                  {formLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                  Dispatch Mail
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="w-full space-y-6">
        {/* FILTER SEARCH */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search email subjects, recipients, or message content..."
            className="pl-11 rounded-xl border-slate-200 dark:border-slate-800 h-12 bg-white dark:bg-slate-900 shadow-sm focus-visible:ring-purple-500 dark:text-slate-100 transition-colors text-base"
          />
        </div>

        {/* TIMELINE RENDER */}
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-purple-600 dark:text-purple-400" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-dashed rounded-2xl shadow-sm">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-full w-max mx-auto mb-4 border border-slate-100 dark:border-slate-800">
              <Mail className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">No Emails Recorded</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto text-sm font-medium">
              Outgoing mail notifications or CRM correspondence logs will appear in this timeline.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 dark:border-slate-800 space-y-8 pb-4">
            {filteredLogs.map((log) => (
              <div key={log.id} className="relative group">
                {/* Timeline marker */}
                <div className="absolute -left-[35px] sm:-left-[43px] top-1.5 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-white dark:bg-slate-900 border-2 sm:border-[3px] border-purple-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                </div>

                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-500/50 transition-all overflow-hidden relative">
                  <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-base text-slate-800 dark:text-slate-100 truncate pr-2">{log.subject}</span>
                        <div className="shrink-0">{getStatusBadge(log.status)}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300">
                          <User className="h-3 w-3" /> To: {log.toEmail}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(log.sentAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 sm:p-5 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                    {log.body}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
