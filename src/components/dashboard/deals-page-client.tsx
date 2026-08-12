import * as React from 'react'
import {  useNavigate  } from 'react-router-dom';
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { dealsAPI, Deal, DEAL_STAGES } from '@/lib/api/deals'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  ArrowRight,
  Calendar,
  CircleDollarSign,
  Edit,
  Download,
  Handshake,
  LayoutGrid,
  List,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Target,
  TrendingUp,
  Trophy,
  Trash2,
  User,
  Building2,
  ChevronRight,
  Zap,
  Users,
  CheckCircle2,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'

interface DealsPageClientProps {
  businessId: string
}

// Stage config matching backend VALID_STAGES
const STAGE_CONFIG = [
  { key: 'New', label: 'New', color: 'bg-blue-500', light: 'bg-muted dark:bg-muted/50 border-border dark:border-border', text: 'text-foreground dark:text-slate-300', badge: 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' },
  { key: 'Contacted', label: 'Contacted', color: 'bg-indigo-500', light: 'bg-muted dark:bg-muted/50 border-border dark:border-border', text: 'text-foreground dark:text-slate-300', badge: 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm' },
  { key: 'Proposal', label: 'Proposal', color: 'bg-violet-500', light: 'bg-muted dark:bg-muted/50 border-border dark:border-border', text: 'text-foreground dark:text-slate-300', badge: 'bg-violet-50 text-violet-700 border border-violet-200 shadow-sm' },
  { key: 'Negotiation', label: 'Negotiation', color: 'bg-cyan-500', light: 'bg-muted dark:bg-muted/50 border-border dark:border-border', text: 'text-foreground dark:text-slate-300', badge: 'bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-sm' },
  { key: 'Won', label: 'Won', color: 'bg-emerald-500', light: 'bg-emerald-50/50 border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm' },
  { key: 'Lost', label: 'Lost', color: 'bg-rose-500', light: 'bg-rose-50/50 border-rose-200', text: 'text-rose-700', badge: 'bg-rose-50 text-rose-700 border border-rose-200 shadow-sm' },
] as const

function getStageCfg(stage: string) {
  return STAGE_CONFIG.find(s => s.key === stage) ?? STAGE_CONFIG[0]
}

const fmt = (amount: number, currency?: string) => {
  if (!currency) {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);
  }
  const validCurrency = currency === 'SYSTEM' ? 'INR' : currency;
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: validCurrency, maximumFractionDigits: 0 }).format(amount)
  } catch(e) {
    return `${validCurrency} ${amount}`;
  }
}

export function DealsPageClient({ businessId }: DealsPageClientProps) {
  const navigate = useNavigate()
  const { business } = useBusinessData()
  const [deals, setDeals] = React.useState<Deal[]>([])
  const [loading, setLoading] = React.useState(true)
  const [viewMode, setViewMode] = React.useState<'board' | 'table'>('board')
  const [search, setSearch] = React.useState('')

  const fetchDeals = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await dealsAPI.getDeals(businessId)
      if (response.success) {
        const sanitizedDeals = (response.deals || []).map((d: Deal) => {
          const isValidStage = STAGE_CONFIG.some(s => s.key === d.stage)
          return {
            ...d,
            stage: isValidStage ? d.stage : 'New'
          }
        })
        setDeals(sanitizedDeals)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch deals')
    } finally {
      setLoading(false)
    }
  }, [businessId])

  React.useEffect(() => { fetchDeals() }, [fetchDeals])

  const handleDelete = async (dealId: string) => {
    try {
      const response = await dealsAPI.deleteDeal(businessId, dealId)
      if (response.success) {
        toast.success('Deal deleted')
        fetchDeals()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete deal')
    }
  }

  const handleStageUpdate = async (dealId: string, stage: string) => {
    try {
      await dealsAPI.updateDeal(businessId, dealId, { stage: stage as any })
      toast.success(`Deal moved to ${stage}`)
      fetchDeals()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update stage')
    }
  }

  const downloadReport = () => {
    if (deals.length === 0) return toast.error('No data to export')
    const headers = ['Deal Name', 'Customer', 'Stage', 'Amount', 'Currency', 'Source', 'Assigned To', 'Expected Close', 'Created At']
    const csv = [
      headers.join(','),
      ...deals.map(d => [
        `"${d.name}"`,
        `"${d.customer?.name || d.customer?.company || ''}"`,
        `"${d.stage}"`,
        d.amount || 0,
        `"${d.currency || 'INR'}"`,
        `"${d.source || ''}"`,
        `"${d.assignedTo?.user?.name || 'Unassigned'}"`,
        d.expectedCloseDate ? new Date(d.expectedCloseDate).toLocaleDateString() : '',
        new Date(d.createdAt).toLocaleDateString(),
      ].join(','))
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.setAttribute('href', URL.createObjectURL(blob))
    link.setAttribute('download', `Deals_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Report downloaded')
  }

  const filtered = deals.filter(d =>
    search === '' ||
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.customer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.customer?.company || '').toLowerCase().includes(search.toLowerCase())
  )

  // Stats
  const wonDeals = deals.filter(d => d.stage === 'Won')
  const lostDeals = deals.filter(d => d.stage === 'Lost')
  const openDeals = deals.filter(d => !['Won', 'Lost'].includes(d.stage))
  const totalOpenValue = openDeals.reduce((s, d) => s + Number(d.amount || 0), 0)
  const totalWonValue = wonDeals.reduce((s, d) => s + Number(d.amount || 0), 0)
  const winRate = (wonDeals.length + lostDeals.length) > 0
    ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100) : 0

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="grid min-h-svh grid-cols-1 content-start gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground dark:text-slate-100">Deals</h1>
          <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">Track deal value, stage movement, and pipeline health</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={downloadReport} className="h-10 gap-2 bg-card dark:bg-card cursor-pointer text-foreground dark:text-slate-300 hover:bg-muted dark:bg-muted/50 border-border dark:border-border shadow-sm rounded-xl font-medium px-4">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={() => navigate(`/dashboard/${businessId}/deals/add`)} className="h-10 cursor-pointer gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-xl border-none font-medium px-5">
            <Plus className="h-4 w-4" /> Add Deal
          </Button>
        </div>
      </div>

      {/* CRM Workflow Banner */}
      <div className="relative overflow-hidden rounded-xl border border-border dark:border-border bg-card dark:bg-card shadow-sm px-6 py-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-0">
          {[
            { icon: Zap, label: 'Lead', sub: 'Prospect captured', color: 'text-slate-400 dark:text-muted-foreground', bg: 'bg-muted dark:bg-muted/50 border border-border dark:border-border', done: true },
            { icon: Target, label: 'Opportunity', sub: 'Deal in progress', color: 'text-blue-600', bg: 'bg-blue-50 border border-blue-100', done: true, active: true },
            { icon: Users, label: 'Customer', sub: 'Won & onboarded', color: 'text-slate-400 dark:text-muted-foreground', bg: 'bg-muted dark:bg-muted/50 border border-border dark:border-border', done: false },
          ].map((step, i, arr) => (
            <React.Fragment key={step.label}>
              <div className={`flex items-center gap-3 py-1 ${step.active ? 'opacity-100' : 'opacity-60'}`}>
                <div className={`flex items-center justify-center h-10 w-10 rounded-full ${step.bg} ${step.active ? 'ring-4 ring-blue-50/50 scale-105' : ''}`}>
                  <step.icon className={`h-4 w-4 ${step.color}`} />
                </div>
                <div>
                  <p className={`text-sm font-bold ${step.active ? 'text-foreground dark:text-slate-100' : 'text-muted-foreground dark:text-slate-400'}`}>{step.label}</p>
                  <p className="text-[11px] font-medium text-muted-foreground dark:text-slate-400 uppercase tracking-wider">{step.sub}</p>
                </div>
              </div>
              {i < arr.length - 1 && (
                <ChevronRight className="mx-4 h-5 w-5 text-slate-300 hidden sm:block" />
              )}
            </React.Fragment>
          ))}
          <div className="ml-auto hidden lg:block text-[11px] font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">
            Managing Deals
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Deals', value: deals.length, icon: Handshake, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
          { label: 'Open Pipeline', value: fmt(totalOpenValue), icon: CircleDollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
          { label: 'Won Value', value: fmt(totalWonValue), icon: Trophy, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
          { label: 'Win Rate', value: `${winRate}%`, icon: TrendingUp, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-100' },
        ].map(stat => (
          <Card key={stat.label} className="border-border dark:border-border bg-card dark:bg-card shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-black text-foreground dark:text-slate-200 mt-1">{stat.value}</p>
                </div>
                <div className={`flex items-center justify-center h-12 w-12 rounded-xl border ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-1 mt-2">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-muted-foreground" />
          <Input
            placeholder="Search deals by name or customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10 border-border dark:border-border bg-card dark:bg-card shadow-sm rounded-lg focus-visible:ring-blue-500"
          />
        </div>
        <div className="flex rounded-lg border border-border dark:border-border bg-card dark:bg-card shadow-sm p-1">
          <Button
            variant={viewMode === 'board' ? 'secondary' : 'ghost'}
            size="sm"
            className={`gap-2 h-8 rounded-md px-4 ${viewMode === 'board' ? 'bg-muted dark:bg-muted text-foreground dark:text-slate-100 font-bold shadow-sm' : 'text-muted-foreground dark:text-slate-400 hover:text-foreground dark:text-slate-300 font-medium'}`}
            onClick={() => setViewMode('board')}
          >
            <LayoutGrid className="h-4 w-4" /> Board
          </Button>
          <Button
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            size="sm"
            className={`gap-2 h-8 rounded-md px-4 ${viewMode === 'table' ? 'bg-muted dark:bg-muted text-foreground dark:text-slate-100 font-bold shadow-sm' : 'text-muted-foreground dark:text-slate-400 hover:text-foreground dark:text-slate-300 font-medium'}`}
            onClick={() => setViewMode('table')}
          >
            <List className="h-4 w-4" /> Table
          </Button>
        </div>
      </div>

      {/* Board View */}
      {viewMode === 'board' && (
        <div className="w-full max-w-full overflow-hidden">
          <div className="w-full overflow-x-auto pb-6 hide-scrollbar">
            <div className="flex gap-5 min-w-max px-0.5 pt-0.5">
              {STAGE_CONFIG.map(stage => {
                const stageDeals = filtered.filter(d => d.stage === stage.key)
                const stageValue = stageDeals.reduce((s, d) => s + Number(d.amount || 0), 0)
                return (
                  <div key={stage.key} className={`w-[300px] rounded-2xl border ${stage.light} bg-muted/50 dark:bg-muted/30 flex flex-col shadow-sm`}>
                    {/* Column header */}
                    <div className="flex flex-col px-4 py-3 border-b border-inherit bg-card dark:bg-card rounded-t-2xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className={`h-2.5 w-2.5 rounded-full ${stage.color} shadow-sm`} />
                          <span className={`text-sm font-bold ${stage.text}`}>{stage.label}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs bg-muted dark:bg-muted text-muted-foreground dark:text-slate-400 border-border dark:border-border">{stageDeals.length}</Badge>
                      </div>
                      {/* Stage total value */}
                      {stageValue > 0 && (
                        <div className="mt-1.5 text-xs font-bold text-muted-foreground dark:text-slate-400">
                          {fmt(stageValue)}
                        </div>
                      )}
                    </div>

                    {/* Deal cards */}
                    <div className="flex flex-col gap-3 p-3 min-h-[250px] flex-1">
                      {stageDeals.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <div className="h-12 w-12 rounded-full bg-muted dark:bg-muted border border-border dark:border-border flex items-center justify-center mb-3">
                            <Handshake className="h-5 w-5 text-slate-300" />
                          </div>
                          <p className="text-xs font-semibold text-slate-400 dark:text-muted-foreground">No deals in this stage</p>
                        </div>
                      ) : (
                        stageDeals.map(deal => (
                          <div
                            key={deal.id}
                            className="rounded-xl border border-border dark:border-border bg-card dark:bg-card p-4 shadow-sm cursor-pointer hover:shadow-md transition-all hover:-translate-y-1 group"
                            onClick={() => navigate(`/dashboard/${businessId}/deals/${deal.id}`)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-bold text-foreground dark:text-slate-200 text-sm leading-tight line-clamp-2">{deal.name}</p>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 dark:text-muted-foreground hover:text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-border dark:border-border" onClick={e => e.stopPropagation()}>
                                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(`/dashboard/${businessId}/deals/${deal.id}`)}>
                                    <ArrowRight className="mr-2 h-4 w-4 text-blue-500" /> View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(`/dashboard/${businessId}/deals/${deal.id}/edit`)}>
                                    <Edit className="mr-2 h-4 w-4 text-indigo-500" /> Edit Deal
                                  </DropdownMenuItem>
                                  {business?.businessType === 'Trading' && (
                                    <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(`/dashboard/${businessId}/quotations/add?customerId=${deal.customerId || deal.customer?.id || ''}&dealId=${deal.id}&dealTitle=${encodeURIComponent(deal.name)}&source=deals`)}>
                                      <FileText className="mr-2 h-4 w-4 text-emerald-600" /> Convert to Quotation
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator className="bg-muted dark:bg-muted" />
                                  <DropdownMenuItem disabled className="text-[10px] uppercase font-bold text-slate-400 dark:text-muted-foreground tracking-wider pt-2">
                                    Move to Stage
                                  </DropdownMenuItem>
                                  {STAGE_CONFIG.filter(s => s.key !== deal.stage).map(s => (
                                    <DropdownMenuItem className="cursor-pointer" key={s.key} onClick={() => handleStageUpdate(deal.id, s.key)}>
                                      <span className={`mr-2 h-2 w-2 rounded-full ${s.color} inline-block`} />
                                      {s.label}
                                    </DropdownMenuItem>
                                  ))}
                                  <DropdownMenuSeparator className="bg-muted dark:bg-muted" />
                                  <DropdownMenuItem className="cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-700" onClick={() => handleDelete(deal.id)}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {(deal.customer?.name || deal.customer?.company) && (
                              <div className="flex items-center gap-2 mt-2 text-xs font-medium text-muted-foreground dark:text-slate-400">
                                <Building2 className="h-3.5 w-3.5 text-slate-400 dark:text-muted-foreground" />
                                <span className="line-clamp-1">{deal.customer.name || deal.customer.company}</span>
                              </div>
                            )}

                            <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-100">
                              {fmt(deal.amount, deal.currency)}
                            </div>

                            <div className="mt-3 pt-3 border-t border-border dark:border-border flex items-center justify-between">
                              {deal.assignedTo?.user?.name ? (
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground dark:text-slate-400">
                                  <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <User className="h-3 w-3" />
                                  </div>
                                  <span className="line-clamp-1">{deal.assignedTo.user.name.split(' ')[0]}</span>
                                </div>
                              ) : (
                                <span className="text-[11px] font-semibold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Unassigned</span>
                              )}
                              {deal.expectedCloseDate && (
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground dark:text-slate-400 bg-muted dark:bg-muted/50 px-2 py-1 rounded border border-border dark:border-border">
                                  <Calendar className="h-3 w-3 text-slate-400 dark:text-muted-foreground" />
                                  <span>{new Date(deal.expectedCloseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add deal button */}
                    <div className="px-3 pb-3 pt-1 border-t border-inherit bg-card dark:bg-card rounded-b-2xl">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`w-full gap-2 text-sm font-semibold hover:bg-muted dark:hover:bg-muted/50 ${stage.text}`}
                        onClick={() => navigate(`/dashboard/${businessId}/deals/add`)}
                      >
                        <Plus className="h-4 w-4" /> Add Deal
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <Card className="border-border dark:border-border bg-card dark:bg-card shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-muted dark:bg-muted/50/50 border-b border-border dark:border-border pb-4 pt-5 px-6">
            <CardTitle className="text-base font-bold text-foreground dark:text-slate-200 flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-blue-100 text-blue-600">
                <Handshake className="h-4 w-4" />
              </div>
              All Deals
              <Badge variant="secondary" className="ml-2 bg-muted dark:bg-muted text-muted-foreground dark:text-slate-400">{filtered.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-muted dark:bg-muted/50 border border-border dark:border-border flex items-center justify-center mx-auto mb-4">
                  <Handshake className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-sm font-bold text-foreground dark:text-slate-300">No deals found</h3>
                <p className="mt-1 text-sm text-muted-foreground dark:text-slate-400 max-w-sm mx-auto">
                  {search ? 'We couldn\'t find any deals matching your search criteria.' : 'Create your first deal to start tracking pipeline activity and closing sales.'}
                </p>
                {!search && (
                  <Button onClick={() => navigate(`/dashboard/${businessId}/deals/add`)} className="mt-6 gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm">
                    <Plus className="h-4 w-4" /> Create First Deal
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted dark:bg-muted/50/50 border-b border-border dark:border-border hover:bg-muted dark:bg-muted/50/50">
                      <TableHead className="font-bold text-muted-foreground dark:text-slate-400 h-12">Deal</TableHead>
                      <TableHead className="font-bold text-muted-foreground dark:text-slate-400 h-12">Customer</TableHead>
                      <TableHead className="font-bold text-muted-foreground dark:text-slate-400 h-12">Stage</TableHead>
                      <TableHead className="font-bold text-muted-foreground dark:text-slate-400 h-12">Amount</TableHead>
                      <TableHead className="font-bold text-muted-foreground dark:text-slate-400 h-12">Assigned</TableHead>
                      <TableHead className="font-bold text-muted-foreground dark:text-slate-400 h-12">Close Date</TableHead>
                      <TableHead className="text-right font-bold text-muted-foreground dark:text-slate-400 h-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((deal) => {
                      const cfg = getStageCfg(deal.stage)
                      return (
                        <TableRow
                          key={deal.id}
                          className="hover:bg-muted dark:bg-muted/50/80 cursor-pointer border-b border-border dark:border-border transition-colors"
                          onClick={() => navigate(`/dashboard/${businessId}/deals/${deal.id}`)}
                        >
                          <TableCell className="py-4">
                            <div className="font-bold text-foreground dark:text-slate-200">{deal.name}</div>
                            {deal.source && <div className="text-[11px] font-semibold text-slate-400 dark:text-muted-foreground mt-0.5 uppercase tracking-wider">{deal.source}</div>}
                          </TableCell>
                          <TableCell className="py-4 font-medium text-muted-foreground dark:text-slate-400">
                            {deal.customer?.name || deal.customer?.company || 'Unknown'}
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge className={`${cfg.badge} font-bold rounded-md px-2.5 py-0.5`}>{deal.stage}</Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-100">
                              {fmt(deal.amount, deal.currency)}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            {deal.assignedTo?.user?.name ? (
                              <div className="flex items-center gap-2 text-sm font-semibold text-foreground dark:text-slate-300">
                                <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                  <User className="h-3.5 w-3.5" />
                                </div>
                                {deal.assignedTo.user.name}
                              </div>
                            ) : (
                              <span className="text-[11px] font-semibold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            {deal.expectedCloseDate ? (
                              <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground dark:text-slate-400">
                                <Calendar className="h-4 w-4 text-slate-400 dark:text-muted-foreground" />
                                {new Date(deal.expectedCloseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </div>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right py-4" onClick={e => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 dark:text-muted-foreground hover:text-blue-600 hover:bg-blue-50">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-border dark:border-border">
                                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(`/dashboard/${businessId}/deals/${deal.id}`)}>
                                  <ArrowRight className="mr-2 h-4 w-4 text-blue-500" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(`/dashboard/${businessId}/deals/${deal.id}/edit`)}>
                                  <Edit className="mr-2 h-4 w-4 text-indigo-500" /> Edit
                                </DropdownMenuItem>
                                {business?.businessType === 'Trading' && (
                                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(`/dashboard/${businessId}/quotations/add?customerId=${deal.customerId || deal.customer?.id || ''}&dealId=${deal.id}&dealTitle=${encodeURIComponent(deal.name)}&source=deals`)}>
                                    <FileText className="mr-2 h-4 w-4 text-emerald-600" /> Convert to Quotation
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator className="bg-muted dark:bg-muted" />
                                <DropdownMenuItem className="cursor-pointer focus:bg-emerald-50 focus:text-emerald-700" onClick={() => handleStageUpdate(deal.id, 'Won')}>
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Mark as Won
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-muted dark:bg-muted" />
                                <DropdownMenuItem className="cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-700" onClick={() => handleDelete(deal.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
