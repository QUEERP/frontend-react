import React, { useState, useEffect } from 'react'
import {  useParams, useNavigate  } from 'react-router-dom';
import { campaignsAPI, Campaign } from '@/lib/api/crm'
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
  Megaphone, 
  Plus, 
  Loader2, 
  Trash2, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function CampaignsPage() {
  const params = useParams()
  const navigate = useNavigate()
  
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'EMAIL',
    status: 'PLANNING',
    budget: '',
    actualCost: '',
    expectedRevenue: '',
    startDate: '',
    endDate: '',
    description: '',
  })

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const res = await campaignsAPI.getAll(businessId)
      if (res.success) {
        setCampaigns(res.data)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [businessId])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Campaign name is required')
      return
    }

    setFormLoading(true)
    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        status: formData.status,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        actualCost: formData.actualCost ? parseFloat(formData.actualCost) : undefined,
        expectedRevenue: formData.expectedRevenue ? parseFloat(formData.expectedRevenue) : undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        description: formData.description || undefined,
      }
      const res = await campaignsAPI.create(businessId, payload)
      if (res.success) {
        toast.success('Campaign launched successfully!')
        setShowAddForm(false)
        setFormData({
          name: '',
          type: 'EMAIL',
          status: 'PLANNING',
          budget: '',
          actualCost: '',
          expectedRevenue: '',
          startDate: '',
          endDate: '',
          description: '',
        })
        fetchCampaigns()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create campaign')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to archive this campaign?')) return
    try {
      const res = await campaignsAPI.delete(businessId, id)
      if (res.success) {
        toast.success('Campaign archived')
        fetchCampaigns()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete campaign')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shadow-sm px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px]">Active</Badge>
      case 'PLANNING': return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 shadow-sm px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px]">Planning</Badge>
      case 'COMPLETED': return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 shadow-sm px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px]">Completed</Badge>
      case 'CANCELLED': return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 shadow-sm px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px]">Cancelled</Badge>
      default: return <Badge variant="outline" className="shadow-sm px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px] dark:border-slate-700 dark:text-slate-300">{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'EMAIL': return <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 shadow-sm px-2.5 py-0.5 rounded-md font-bold text-[10px]">Email</Badge>
      case 'SOCIAL_MEDIA': return <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 shadow-sm px-2.5 py-0.5 rounded-md font-bold text-[10px]">Social Media</Badge>
      case 'PPC': return <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 shadow-sm px-2.5 py-0.5 rounded-md font-bold text-[10px]">PPC / Ads</Badge>
      case 'EVENT': return <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 shadow-sm px-2.5 py-0.5 rounded-md font-bold text-[10px]">Event</Badge>
      default: return <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 shadow-sm px-2.5 py-0.5 rounded-md font-bold text-[10px]">{type}</Badge>
    }
  }

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return 'N/A'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-[#f8fafc] dark:bg-slate-950 px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex min-w-0 items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-xl hidden sm:block">
            <Megaphone className="h-6 w-6" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">CRM Campaigns</span>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">Design, execute, and monitor sales marketing initiatives.</span>
          </div>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 shadow-sm cursor-pointer transition-colors shrink-0">
          {showAddForm ? 'Close Form' : (
            <>
              <Plus className="h-4 w-4" />
              Launch Campaign
            </>
          )}
        </Button>
      </div>

      {/* QUICK ADD FORM */}
      {showAddForm && (
        <div className="rounded-2xl border-t-4 border-t-amber-500 border-x border-b border-x-slate-200 border-b-slate-200 dark:border-x-slate-800 dark:border-b-slate-800 bg-white dark:bg-slate-900 shadow-md animate-in fade-in slide-in-from-top-2 duration-200 transition-colors overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Launch Marketing Campaign</h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Setup parameters, budgets, and milestones.</p>
            </div>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Campaign Name <span className="text-rose-500">*</span></Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={(e) => handleInputChange('name', e.target.value)} 
                    placeholder="e.g. Summer Special 2026"
                    className="rounded-xl border-slate-200 dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="type" className="text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Campaign Channel</Label>
                  <Select value={formData.type} onValueChange={(val) => handleInputChange('type', val)}>
                    <SelectTrigger id="type" className="rounded-xl border-slate-200 dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100">
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 dark:border-slate-800 rounded-xl">
                      <SelectItem value="EMAIL" className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">Email Marketing</SelectItem>
                      <SelectItem value="SOCIAL_MEDIA" className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">Social Media Post/Ads</SelectItem>
                      <SelectItem value="PPC" className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">Google PPC Adwords</SelectItem>
                      <SelectItem value="EVENT" className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">Trade Event / Webinar</SelectItem>
                      <SelectItem value="OTHER" className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">Other Channel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="status" className="text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Execution Status</Label>
                  <Select value={formData.status} onValueChange={(val) => handleInputChange('status', val)}>
                    <SelectTrigger id="status" className="rounded-xl border-slate-200 dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 dark:border-slate-800 rounded-xl">
                      <SelectItem value="PLANNING" className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">Planning / Warmup</SelectItem>
                      <SelectItem value="ACTIVE" className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">Currently Running</SelectItem>
                      <SelectItem value="COMPLETED" className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">Ended / Finished</SelectItem>
                      <SelectItem value="CANCELLED" className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">Stopped / Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="budget" className="text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Allocated Budget ($)</Label>
                  <Input 
                    id="budget" 
                    type="number" 
                    value={formData.budget} 
                    onChange={(e) => handleInputChange('budget', e.target.value)} 
                    placeholder="e.g. 5000"
                    className="rounded-xl border-slate-200 dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="actualCost" className="text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Actual Spent ($)</Label>
                  <Input 
                    id="actualCost" 
                    type="number" 
                    value={formData.actualCost} 
                    onChange={(e) => handleInputChange('actualCost', e.target.value)} 
                    placeholder="e.g. 4200"
                    className="rounded-xl border-slate-200 dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="expectedRevenue" className="text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Expected Revenue ($)</Label>
                  <Input 
                    id="expectedRevenue" 
                    type="number" 
                    value={formData.expectedRevenue} 
                    onChange={(e) => handleInputChange('expectedRevenue', e.target.value)} 
                    placeholder="e.g. 25000"
                    className="rounded-xl border-slate-200 dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="startDate" className="text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Initiation Date</Label>
                  <Input 
                    id="startDate" 
                    type="date" 
                    value={formData.startDate} 
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="rounded-xl border-slate-200 dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100 [&::-webkit-calendar-picker-indicator]:dark:invert"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endDate" className="text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Closing Date</Label>
                  <Input 
                    id="endDate" 
                    type="date" 
                    value={formData.endDate} 
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="rounded-xl border-slate-200 dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100 [&::-webkit-calendar-picker-indicator]:dark:invert"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Core Description &amp; Targets</Label>
                <Textarea 
                  id="description" 
                  value={formData.description} 
                  onChange={(e) => handleInputChange('description', e.target.value)} 
                  placeholder="Map out key conversion funnels or criteria..."
                  rows={4}
                  className="rounded-xl border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100 resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 dark:border-slate-800 mt-6">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="rounded-xl h-10 px-6 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer">Cancel</Button>
                <Button type="submit" disabled={formLoading} className="rounded-xl h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 shadow-sm cursor-pointer">
                  {formLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                  Deploy Campaign
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENDER CAMPAIGNS GRID */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-dashed rounded-2xl shadow-sm">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-full w-max mx-auto mb-4 border border-slate-100 dark:border-slate-800">
            <Megaphone className="h-8 w-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">No Campaigns Configured</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto text-sm font-medium">
            Launch structured multi-channel marketing campaigns to track sales acquisition channels.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((c) => {
            const hasFinancials = c.budget !== undefined && c.actualCost !== undefined;
            const costPercentage = hasFinancials && c.budget! > 0 
              ? Math.min((c.actualCost! / c.budget!) * 100, 100) 
              : 0;
            return (
              <div key={c.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
                <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-start relative">
                  <div className="space-y-2 pr-6">
                    <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 tracking-tight truncate max-w-[220px]">{c.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      {getStatusBadge(c.status)}
                      {getTypeBadge(c.type)}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg shrink-0 cursor-pointer absolute right-4 top-4"
                    onClick={() => handleDelete(c.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-5 space-y-5 flex-1 flex flex-col">
                  {c.description && (
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">{c.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Start: {c.startDate ? new Date(c.startDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold justify-end">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>End: {c.endDate ? new Date(c.endDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>

                  {/* Financial Progress */}
                  <div className="space-y-2.5 border-t border-slate-100 dark:border-slate-700 pt-4 mt-auto">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>Cost Utilization</span>
                      <span>{costPercentage.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className={`h-full rounded-full transition-all ${costPercentage > 90 ? 'bg-rose-500 dark:bg-rose-600' : 'bg-blue-600 dark:bg-blue-500'}`}
                        style={{ width: `${costPercentage}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-2">
                      <div>
                        <p className="font-semibold uppercase tracking-wider mb-0.5">Budget</p>
                        <p className="font-bold text-slate-800 dark:text-slate-100 text-xs">{formatCurrency(c.budget)}</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold uppercase tracking-wider mb-0.5">Spent</p>
                        <p className="font-bold text-slate-800 dark:text-slate-100 text-xs">{formatCurrency(c.actualCost)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold uppercase tracking-wider mb-0.5">Expected</p>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">{formatCurrency(c.expectedRevenue)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
