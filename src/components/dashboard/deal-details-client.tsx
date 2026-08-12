import * as React from 'react'
import {  useNavigate  } from 'react-router-dom';
import { dealsAPI, Deal, DEAL_STAGES } from '@/lib/api/deals'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Calendar,
  CircleDollarSign,
  Edit,
  Handshake,
  Loader2,
  User,
  Building2,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Plus,
  Target,
  TrendingUp,
  MessageSquare,
  BarChart3,
} from 'lucide-react'
import { toast } from 'sonner'

interface DealDetailsClientProps {
  businessId: string
  dealId: string
}

// Stage pipeline with order
const STAGE_PIPELINE = [
  { key: 'New',          label: 'New',          icon: Target,      color: 'text-blue-600',     bg: 'bg-blue-50',     border: 'border-blue-200'    },
  { key: 'Contacted',    label: 'Contacted',    icon: Phone,       color: 'text-indigo-600',   bg: 'bg-indigo-50',   border: 'border-indigo-200'  },
  { key: 'Proposal',     label: 'Proposal',     icon: FileText,    color: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-200' },
  { key: 'Negotiation',  label: 'Negotiation',  icon: MessageSquare,color:'text-cyan-600', bg: 'bg-cyan-50',  border: 'border-cyan-200' },
  { key: 'Won',          label: 'Won',          icon: CheckCircle2,color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200'},
  { key: 'Lost',         label: 'Lost',         icon: XCircle,     color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-200'   },
]

const STAGE_BADGE: Record<string, string> = {
  New:         'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm',
  Contacted:   'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm',
  Proposal:    'bg-violet-50 text-violet-700 border border-violet-200 shadow-sm',
  Negotiation: 'bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-sm',
  Won:         'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm',
  Lost:        'bg-rose-50 text-rose-700 border border-rose-200 shadow-sm',
}

const fmt = (amount: number, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)

const NEXT_STAGES: Record<string, string[]> = {
  New:         ['Contacted', 'Won', 'Lost'],
  Contacted:   ['Proposal', 'Won', 'Lost'],
  Proposal:    ['Negotiation', 'Won', 'Lost'],
  Negotiation: ['Won', 'Lost'],
  Won:         [],
  Lost:        ['New'],
}

interface NoteEntry {
  id: string
  text: string
  createdAt: string
}

export function DealDetailsClient({ businessId, dealId }: DealDetailsClientProps) {
  const navigate = useNavigate()
  const [deal, setDeal] = React.useState<Deal | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [stageUpdating, setStageUpdating] = React.useState(false)
  const [noteText, setNoteText] = React.useState('')
  const [notes, setNotes] = React.useState<NoteEntry[]>([])
  const [activeTab, setActiveTab] = React.useState<'overview' | 'notes' | 'actions'>('overview')

  const loadDeal = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await dealsAPI.getDealById(businessId, dealId)
      if (response.success) {
        const d = response.deal;
        const isValidStage = DEAL_STAGES.includes(d.stage as any);
        setDeal({
          ...d,
          stage: isValidStage ? d.stage : 'New'
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch deal details')
    } finally {
      setLoading(false)
    }
  }, [businessId, dealId])

  React.useEffect(() => { loadDeal() }, [loadDeal])

  const handleStageChange = async (newStage: string) => {
    if (!deal) return
    try {
      setStageUpdating(true)
      await dealsAPI.updateDeal(businessId, dealId, { stage: newStage as any })
      toast.success(`Deal moved to "${newStage}"`)
      loadDeal()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update stage')
    } finally {
      setStageUpdating(false)
    }
  }

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteText.trim()) return
    setNotes(prev => [{
      id: Date.now().toString(),
      text: noteText.trim(),
      createdAt: new Date().toISOString(),
    }, ...prev])
    setNoteText('')
    toast.success('Note added')
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!deal) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Deal not found.</p>
        <Button onClick={() => navigate(`/dashboard/${businessId}/deals`)}>Back to Deals</Button>
      </div>
    )
  }

  // Current stage index
  const currentStageIdx = STAGE_PIPELINE.findIndex(s => s.key === deal.stage)
  const isWon  = deal.stage === 'Won'
  const isLost = deal.stage === 'Lost'
  const nextMoves = NEXT_STAGES[deal.stage] || []

  return (
    <div className="flex min-h-svh w-full flex-col gap-6 bg-background px-4 pb-12 pt-0 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between py-6">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/dashboard/${businessId}/deals`)}
            className="gap-2 mt-0.5 text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Deals
          </Button>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">{deal.name}</h1>
            <p className="text-muted-foreground text-sm mt-1.5 font-medium">
              {deal.customer?.name || deal.customer?.company || 'No customer linked'} · Created {new Date(deal.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button
            variant="outline"
            onClick={() => navigate(`/dashboard/${businessId}/quotations/add?dealId=${deal.id}&customerId=${deal.customerId}`)}
            className="gap-2 h-10 bg-card shadow-sm border-border text-foreground hover:bg-muted rounded-xl px-4 font-semibold"
            size="sm"
          >
            <FileText className="h-4 w-4 text-slate-400" />
            Create Quotation
          </Button>
          <Button
            onClick={() => navigate(`/dashboard/${businessId}/deals/${deal.id}/edit`)}
            className="gap-2 h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-xl px-5 font-semibold border-none"
            size="sm"
          >
            <Edit className="h-4 w-4" />
            Edit Deal
          </Button>
        </div>
      </div>

      {/* Stage Pipeline Stepper */}
      <Card className="border-border bg-card shadow-sm rounded-2xl overflow-hidden mb-2">
        <CardHeader className="pb-3 pt-5 px-6 border-b border-border bg-muted/50">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-indigo-100 text-indigo-600">
              <BarChart3 className="h-4 w-4" />
            </div>
            Deal Pipeline Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center gap-0 overflow-x-auto pb-4 hide-scrollbar">
            {STAGE_PIPELINE.filter(s => s.key !== 'Lost').map((stage, idx, arr) => {
              const isPast    = currentStageIdx > idx && !isLost
              const isCurrent = stage.key === deal.stage
              const isFuture  = currentStageIdx < idx

              return (
                <React.Fragment key={stage.key}>
                  <div className="flex flex-col items-center gap-2 min-w-[100px] group">
                    <div className={`
                      rounded-full p-3 border-[3px] transition-all duration-300 ease-out
                      ${isCurrent ? `${stage.bg} ${stage.border} ring-4 ring-blue-50/50 ${stage.color} scale-110 shadow-sm` : ''}
                      ${isPast    ? 'bg-emerald-50 border-emerald-300 text-emerald-600 hover:scale-105' : ''}
                      ${isFuture  ? 'bg-muted border-border text-slate-400' : ''}
                    `}>
                      {isPast
                        ? <CheckCircle2 className="h-4 w-4" />
                        : <stage.icon className="h-4 w-4" />
                      }
                    </div>
                    <span className={`text-[11px] font-bold tracking-wider uppercase text-center whitespace-nowrap mt-1 transition-colors
                      ${isCurrent ? 'text-foreground' : ''}
                      ${isPast    ? 'text-emerald-700' : ''}
                      ${isFuture  ? 'text-slate-400' : ''}
                    `}>{stage.label}</span>
                  </div>
                  {idx < arr.length - 1 && (
                    <div className={`flex-1 h-1 min-w-[30px] mx-2 rounded-full transition-colors duration-300
                      ${isPast ? 'bg-emerald-300' : 'bg-muted'}
                    `} />
                  )}
                </React.Fragment>
              )
            })}

            {/* Lost indicator (separate) */}
            {isLost && (
              <>
                <div className="mx-4 text-slate-300 font-bold">|</div>
                <div className="flex flex-col items-center gap-2 min-w-[100px]">
                  <div className="rounded-full p-3 border-[3px] bg-rose-50 border-rose-300 ring-4 ring-rose-50/50 text-rose-600 scale-110 shadow-sm">
                    <XCircle className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-bold tracking-wider uppercase text-rose-700 mt-1">Lost</span>
                </div>
              </>
            )}
          </div>

          {/* Move Stage Actions */}
          {nextMoves.length > 0 && (
            <div className="mt-4 pt-5 border-t border-border flex flex-wrap items-center gap-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Next Step:</span>
              {nextMoves.map(nextStage => {
                const cfg = STAGE_PIPELINE.find(s => s.key === nextStage)!
                return (
                  <Button
                    key={nextStage}
                    variant="outline"
                    size="sm"
                    disabled={stageUpdating}
                    onClick={() => handleStageChange(nextStage)}
                    className={`gap-2 h-8 rounded-lg shadow-sm font-semibold border-border ${cfg.color} bg-card hover:${cfg.bg}`}
                  >
                    {stageUpdating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <cfg.icon className="h-3.5 w-3.5" />
                    )}
                    {nextStage}
                    <ChevronRight className="h-3 w-3 opacity-50" />
                  </Button>
                )
              })}
            </div>
          )}

          {(isWon || isLost) && (
            <div className={`mt-4 pt-4 border-t border-border flex items-center gap-2 text-sm font-bold px-4 py-3 rounded-lg border
              ${isWon ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}
            `}>
              {isWon
                ? <><CheckCircle2 className="h-5 w-5" /> This deal has been Won! 🎉 Create a Quotation or Sales Order to proceed.</>
                : <><XCircle className="h-5 w-5" /> This deal was marked as Lost. You can re-open it by moving it to "New".</>
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content: Stats + Details + Sidebar */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Left: Deal Details */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-border bg-card shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="pt-6 pb-6 text-center">
                <div className="mx-auto mb-3 h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center">
                  <CircleDollarSign className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-2xl font-black text-foreground">{fmt(deal.amount, deal.currency)}</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Deal Value</p>
              </CardContent>
            </Card>
            <Card className="border-border bg-card shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="pt-6 pb-6 text-center">
                <div className="mx-auto mb-3 h-10 w-10 bg-violet-50 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-violet-600" />
                </div>
                <p className="text-2xl font-black text-foreground">{deal.probability != null ? `${deal.probability}%` : '—'}</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Win Probability</p>
              </CardContent>
            </Card>
            <Card className="border-border bg-card shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="pt-6 pb-6 text-center">
                <div className="mx-auto mb-3 h-10 w-10 bg-amber-50 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <p className="text-2xl font-black text-foreground">
                  {deal.expectedCloseDate
                    ? new Date(deal.expectedCloseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                    : '—'
                  }
                </p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Expected Close</p>
              </CardContent>
            </Card>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-2 border-b border-border pb-px">
            {(['overview', 'notes', 'actions'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 text-sm font-bold capitalize transition-all relative
                  ${activeTab === tab
                    ? 'text-blue-600'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted rounded-t-lg'
                  }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: 'Deal Name',      value: deal.name                                             },
                { label: 'Stage',          value: <Badge className={`${STAGE_BADGE[deal.stage] || 'bg-muted text-foreground'} px-2 py-0.5 rounded-md`}>{deal.stage}</Badge> },
                { label: 'Amount',         value: <span className="font-bold text-foreground">{fmt(deal.amount, deal.currency)}</span> },
                { label: 'Currency',       value: deal.currency || 'INR'                                 },
                { label: 'Customer',       value: deal.customer?.name || deal.customer?.company || '—'   },
                { label: 'Contact',        value: deal.contact?.fullName || '—'                          },
                { label: 'Assigned To',    value: deal.assignedTo?.user?.name || 'Unassigned'            },
                { label: 'Source',         value: deal.source || '—'                                     },
                { label: 'Expected Close', value: deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString('en-IN') : '—' },
                { label: 'Created',        value: new Date(deal.createdAt).toLocaleDateString('en-IN')          },
                { label: 'Last Updated',   value: new Date(deal.updatedAt).toLocaleDateString('en-IN')          },
                { label: 'Probability',    value: deal.probability != null ? `${deal.probability}%` : '—'},
              ].map(item => (
                <div key={item.label} className="space-y-1.5 rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</div>
                  <div className="text-sm font-semibold text-foreground">{item.value}</div>
                </div>
              ))}

              {deal.description && (
                <div className="sm:col-span-2 space-y-2 rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</div>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{deal.description}</p>
                </div>
              )}
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-6 bg-card border border-border shadow-sm rounded-2xl p-6">
              <form onSubmit={handleAddNote} className="flex flex-col gap-3">
                <Label htmlFor="note-input" className="text-sm font-bold text-foreground">Add a Note</Label>
                <Textarea
                  id="note-input"
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Enter notes, next steps, or follow-up details..."
                  className="rounded-xl border-border focus-visible:ring-blue-500 shadow-sm resize-none bg-muted"
                  rows={3}
                />
                <Button type="submit" size="sm" className="self-end gap-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg shadow-sm px-4">
                  <Plus className="h-4 w-4" /> Add Note
                </Button>
              </form>

              <Separator className="bg-muted" />

              <div className="space-y-4">
                {notes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="h-12 w-12 rounded-full bg-muted border border-border flex items-center justify-center mb-3">
                      <FileText className="h-5 w-5 text-slate-300" />
                    </div>
                    <p className="text-sm font-semibold text-slate-400">No notes yet</p>
                  </div>
                ) : (
                  notes.map(note => (
                    <div key={note.id} className="rounded-xl border border-border bg-muted/50 p-4 shadow-sm relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-l-xl" />
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{note.text}</p>
                      <p className="text-[11px] font-bold text-slate-400 mt-3 uppercase tracking-wider">
                        {new Date(note.createdAt).toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Actions Tab */}
          {activeTab === 'actions' && (
            <div className="space-y-4 bg-card border border-border shadow-sm rounded-2xl p-6">
              <p className="text-sm font-bold text-foreground">Advance this deal through the sales process:</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    icon: FileText,
                    label: 'Create Quotation',
                    desc: 'Generate a quote for this deal',
                    color: 'text-violet-600',
                    bg: 'bg-violet-50',
                    border: 'border-violet-100 hover:border-violet-300',
                    onClick: () => navigate(`/dashboard/${businessId}/quotations/add?dealId=${deal.id}&customerId=${deal.customerId}`),
                  },
                  {
                    icon: Handshake,
                    label: 'Create Sales Order',
                    desc: 'Convert to a confirmed order',
                    color: 'text-blue-600',
                    bg: 'bg-blue-50',
                    border: 'border-blue-100 hover:border-blue-300',
                    onClick: () => navigate(`/dashboard/${businessId}/sales-orders/add?dealId=${deal.id}&customerId=${deal.customerId}`),
                  },
                  {
                    icon: User,
                    label: 'View Customer',
                    desc: 'Open the linked profile',
                    color: 'text-amber-600',
                    bg: 'bg-amber-50',
                    border: 'border-amber-100 hover:border-amber-300',
                    onClick: () => navigate(`/dashboard/${businessId}/customers/${deal.customerId}`),
                  },
                  {
                    icon: CheckCircle2,
                    label: 'Mark as Won',
                    desc: 'Close deal as successful',
                    color: 'text-emerald-600',
                    bg: 'bg-emerald-50',
                    border: 'border-emerald-100 hover:border-emerald-300',
                    onClick: () => handleStageChange('Won'),
                  },
                ].map(action => (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className={`flex items-start gap-4 rounded-xl border p-4 text-left transition-all hover:shadow-md ${action.border} bg-card group`}
                  >
                    <div className={`rounded-xl ${action.bg} p-3 flex-shrink-0 group-hover:scale-105 transition-transform`}>
                      <action.icon className={`h-5 w-5 ${action.color}`} />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm">{action.label}</p>
                      <p className="text-[11px] font-semibold text-muted-foreground mt-1 uppercase tracking-wider">{action.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Customer & Contact Info */}
        <div className="flex flex-col gap-5">

          {/* Customer Card */}
          <Card className="border-border bg-card shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 pt-5 px-5 bg-muted/50 border-b border-border">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-100 text-blue-600">
                  <Building2 className="h-4 w-4" />
                </div>
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {deal.customer ? (
                <>
                  <div>
                    <p className="font-bold text-foreground">{deal.customer.name || deal.customer.company}</p>
                    {deal.customer.company && deal.customer.name !== deal.customer.company && (
                      <p className="text-sm font-medium text-muted-foreground">{deal.customer.company}</p>
                    )}
                  </div>
                  {deal.customer.email && (
                    <div className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span className="truncate">{deal.customer.email}</span>
                    </div>
                  )}
                  {deal.customer.phone && (
                    <div className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span>{deal.customer.phone}</span>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 rounded-lg border-border text-foreground hover:bg-muted shadow-sm font-semibold mt-2"
                    onClick={() => navigate(`/dashboard/${businessId}/customers/${deal.customerId}`)}
                  >
                    <ArrowLeft className="h-4 w-4 rotate-180 text-slate-400" />
                    Open Customer Profile
                  </Button>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm font-semibold text-slate-400">No customer linked</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Card */}
          {deal.contact && (
            <Card className="border-border bg-card shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 pt-5 px-5 bg-muted/50 border-b border-border">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-amber-100 text-amber-600">
                    <User className="h-4 w-4" />
                  </div>
                  Contact Person
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                <div>
                  <p className="font-bold text-foreground">{deal.contact.fullName}</p>
                  {deal.contact.position && (
                    <p className="text-sm font-medium text-muted-foreground">{deal.contact.position}</p>
                  )}
                </div>
                {deal.contact.email && (
                  <div className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="truncate">{deal.contact.email}</span>
                  </div>
                )}
                {deal.contact.phone && (
                  <div className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span>{deal.contact.phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Assigned To */}
          <Card className="border-border bg-card shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 pt-5 px-5 bg-muted/50 border-b border-border">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-600">
                  <User className="h-4 w-4" />
                </div>
                Assigned To
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-muted border border-border flex flex-shrink-0 items-center justify-center">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              {deal.assignedTo?.user ? (
                <div>
                  <p className="font-bold text-foreground">{deal.assignedTo.user.name}</p>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{deal.assignedTo.user.email}</p>
                  {deal.assignedTo.role && (
                    <Badge variant="secondary" className="mt-1.5 text-[10px] bg-muted text-muted-foreground border-border">{deal.assignedTo.role.name}</Badge>
                  )}
                </div>
              ) : (
                <p className="text-sm font-semibold text-slate-400">Unassigned</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Stage Panel */}
          <Card className="border-border bg-card shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 pt-5 px-5 bg-muted/50 border-b border-border">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-rose-100 text-rose-600">
                  <BarChart3 className="h-4 w-4" />
                </div>
                Update Stage
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-2">
              {STAGE_PIPELINE.map(s => (
                <button
                  key={s.key}
                  disabled={s.key === deal.stage || stageUpdating}
                  onClick={() => handleStageChange(s.key)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all font-semibold border
                    ${s.key === deal.stage
                      ? `${s.bg} ${s.color} border-current cursor-default shadow-sm`
                      : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border'
                    }
                  `}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${s.key === deal.stage ? 'bg-current shadow-sm' : 'bg-slate-300'}`} />
                  {s.label}
                  {s.key === deal.stage && (
                    <Badge variant="secondary" className="ml-auto text-[10px] uppercase tracking-wider bg-card/50 text-inherit border-current/20">Current</Badge>
                  )}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
