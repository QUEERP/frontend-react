import React, { useState, useEffect } from 'react'
import {  useParams, useNavigate  } from 'react-router-dom';
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { leadsAPI, Lead, LeadActivity } from '@/lib/api/leads'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Calendar,
  MessageSquare,
  StickyNote,
  CheckSquare,
  Bell,
  Plus,
  Loader2,
  Edit,
  Phone,
  Mail,
  Building2,
  MapPin,
  Globe,
  Tag,
  ChevronRight,
  Sparkles,
  User,
  Zap,
  Target,
  Users,
  BarChart3,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'

interface LeadDetailsClientProps {
  businessId: string
}

// Pipeline stages
const PIPELINE_STAGES = [
  { id: '1', key: 'NEW',         label: 'New',          color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200',   dot: 'bg-blue-500'    },
  { id: '2', key: 'CONTACTED',   label: 'Contacted',    color: 'text-indigo-700', bg: 'bg-indigo-50',  border: 'border-indigo-200', dot: 'bg-indigo-500'  },
  { id: '3', key: 'QUALIFIED',   label: 'Qualified',    color: 'text-cyan-700',   bg: 'bg-cyan-50',    border: 'border-cyan-200',   dot: 'bg-cyan-500'    },
  { id: '4', key: 'PROPOSAL',    label: 'Proposal',     color: 'text-sky-700',    bg: 'bg-sky-50',     border: 'border-sky-200',    dot: 'bg-sky-500'     },
  { id: '5', key: 'NEGOTIATION', label: 'Negotiation',  color: 'text-blue-800',   bg: 'bg-blue-100',   border: 'border-blue-300',   dot: 'bg-blue-600'    },
  { id: '6', key: 'CONVERTED',   label: 'Converted',    color: 'text-emerald-700',bg: 'bg-emerald-50', border: 'border-emerald-200',dot: 'bg-emerald-500' },
]

const STATUS_BADGE: Record<string, string> = {
  NEW:         'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm',
  CONTACTED:   'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm',
  QUALIFIED:   'bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-sm',
  PROPOSAL:    'bg-sky-50 text-sky-700 border border-sky-200 shadow-sm',
  NEGOTIATION: 'bg-blue-50 text-blue-800 border border-blue-300 shadow-sm',
  CONVERTED:   'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm',
}

interface LocalNote { id: string; text: string; createdAt: string }

export function LeadDetailsClient({ businessId }: LeadDetailsClientProps) {
  const params = useParams()
  const navigate = useNavigate()
  const { id } = useParams();
  const leadId = id as string
  const { business } = useBusinessData()
  const isTrading = (business as any)?.businessType === 'Trading'

  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState<LeadActivity[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'notes' | 'tasks'>('overview')
  const [stageMoving, setStageMoving] = useState(false)

  // Form states
  const [activityMessage, setActivityMessage] = useState('')
  const [noteText, setNoteText] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [reminderTitle, setReminderTitle] = useState('')
  const [reminderDate, setReminderDate] = useState('')

  // Local notes/tasks (until full API is implemented)
  const [localNotes, setLocalNotes] = useState<LocalNote[]>([])
  const [localTasks, setLocalTasks] = useState<{ id: string; title: string; done: boolean; createdAt: string }[]>([])

  const fetchLeadDetails = async () => {
    try {
      setLoading(true)
      const response = await leadsAPI.getLeadDetails(businessId, leadId)
      if (response.success) setLead(response.data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch lead details')
    } finally {
      setLoading(false)
    }
  }

  const fetchActivities = async () => {
    try {
      const response = await leadsAPI.getActivities(businessId, leadId)
      if (response.success) setActivities(response.data)
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    }
  }

  useEffect(() => {
    fetchLeadDetails()
    fetchActivities()
  }, [businessId, leadId])

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activityMessage.trim()) return
    try {
      const response = await leadsAPI.addActivity(businessId, leadId, activityMessage)
      if (response.success) {
        toast.success('Activity logged')
        setActivityMessage('')
        fetchActivities()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add activity')
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteText.trim()) return
    try {
      await leadsAPI.addNote(businessId, leadId, noteText)
      setLocalNotes(prev => [{ id: Date.now().toString(), text: noteText.trim(), createdAt: new Date().toISOString() }, ...prev])
      setNoteText('')
      toast.success('Note added')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add note')
    }
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskTitle.trim()) return
    try {
      await leadsAPI.addTask(businessId, leadId, taskTitle)
      setLocalTasks(prev => [{ id: Date.now().toString(), title: taskTitle.trim(), done: false, createdAt: new Date().toISOString() }, ...prev])
      setTaskTitle('')
      toast.success('Task created')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add task')
    }
  }

  const handleMoveStage = async (stageId: string) => {
    try {
      setStageMoving(true)
      const response = await leadsAPI.moveStage(businessId, leadId, stageId)
      if (response.success) {
        toast.success('Lead stage updated')
        fetchLeadDetails()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to move lead stage')
    } finally {
      setStageMoving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-svh">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="flex items-center justify-center min-h-svh">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Lead not found</h2>
          <p className="text-muted-foreground mt-1">The lead you're looking for doesn't exist.</p>
          <Button className="mt-4" onClick={() => navigate(`/dashboard/${businessId}/leads`)}>
            Back to Leads
          </Button>
        </div>
      </div>
    )
  }

  const isConverted = lead.status === 'CONVERTED'
  const currentStageIdx = PIPELINE_STAGES.findIndex(s => s.key === lead.status)

  return (
    <div className="flex min-h-svh w-full flex-col gap-6 bg-background px-4 pb-12 pt-6 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate(`/dashboard/${businessId}/leads`)} 
            className="h-10 w-10 bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted shadow-sm transition-all rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{lead.name}</h1>
              <Badge className={STATUS_BADGE[lead.status] || 'bg-muted text-foreground border-border shadow-sm'}>
                {lead.status}
              </Badge>
            </div>
            <p className="text-sm font-medium text-muted-foreground mt-1">
              {(lead as any).company || lead.email || '—'} <span className="mx-1.5 text-slate-300">•</span> Created {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/dashboard/${businessId}/leads/${leadId}/edit`)}
            className="h-9 gap-2 bg-card text-foreground hover:bg-muted border-border shadow-sm rounded-lg"
          >
            <Edit className="h-4 w-4" /> Edit Lead
          </Button>
          {!isConverted && (
            <Button
              size="sm"
              onClick={() => navigate(`/dashboard/${businessId}/leads/${leadId}/convert`)}
              className="h-9 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm rounded-lg border-none"
            >
              <Sparkles className="h-4 w-4" /> {isTrading ? 'Convert to Deal' : 'Convert to Customer'}
            </Button>
          )}
          {isConverted && (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 px-4 py-1.5 text-sm font-semibold rounded-lg shadow-sm">
              <CheckCircle2 className="h-4 w-4 mr-1.5 inline" /> Converted
            </Badge>
          )}
        </div>
      </div>

      {/* Pipeline Progress Stepper */}
      {!isConverted && (
        <Card className="border-border bg-card shadow-sm overflow-hidden rounded-xl">
          <CardHeader className="bg-muted/50 border-b border-border pb-4 pt-5 px-6">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              Lead Stage Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex w-full items-center justify-between gap-2 overflow-x-auto pb-4 hide-scrollbar">
              {PIPELINE_STAGES.filter(s => s.key !== 'CONVERTED').map((stage, idx, arr) => {
                const isPast    = currentStageIdx > idx
                const isCurrent = stage.key === lead.status
                const isFuture  = currentStageIdx < idx

                return (
                  <React.Fragment key={stage.key}>
                    <button
                      onClick={() => handleMoveStage(stage.id)}
                      disabled={stageMoving || isCurrent}
                      className="flex flex-col items-center gap-2 min-w-[80px] group transition-all"
                    >
                      <div className={`
                        flex items-center justify-center h-10 w-10 rounded-full border-2 transition-transform duration-300
                        ${isCurrent ? `${stage.bg} ${stage.border} ring-4 ring-blue-50 text-blue-700 scale-110 shadow-sm` : ''}
                        ${isPast    ? 'bg-blue-50 border-blue-200 text-blue-600 group-hover:bg-blue-100' : ''}
                        ${isFuture  ? 'bg-muted border-border text-slate-400 group-hover:border-blue-200 group-hover:text-blue-500' : ''}
                      `}>
                        {isPast ? <CheckCircle2 className="h-5 w-5" /> : <Target className="h-4 w-4" />}
                      </div>
                      <span className={`text-xs font-bold text-center whitespace-nowrap mt-1
                        ${isCurrent ? 'text-foreground' : ''}
                        ${isPast    ? 'text-foreground' : ''}
                        ${isFuture  ? 'text-slate-400' : ''}
                      `}>{stage.label}</span>
                    </button>
                    {idx < arr.length - 1 && (
                      <div className={`flex-1 h-1 min-w-[24px] mx-1 rounded-full ${isPast ? 'bg-blue-400' : 'bg-muted'}`} />
                    )}
                  </React.Fragment>
                )
              })}

              {/* Convert arrow */}
              <ChevronRight className="mx-3 h-5 w-5 text-slate-300" />
              <div className="flex flex-col items-center gap-2 min-w-[80px]">
                <div className="flex items-center justify-center h-10 w-10 rounded-full border-2 border-dashed border-emerald-300 text-emerald-500 bg-emerald-50">
                  <Users className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-emerald-600 text-center whitespace-nowrap mt-1">Customer</span>
              </div>
            </div>

            <p className="text-xs font-medium text-muted-foreground mt-2 text-center sm:text-left">
              Click any stage to move this lead, or use <strong className="text-emerald-600 font-semibold">{isTrading ? 'Convert to Deal' : 'Convert to Customer'}</strong> to complete the workflow.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Left: Tabs */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Tab navigation */}
          <div className="flex gap-4 border-b border-border">
            {(['overview', 'activities', 'notes', 'tasks'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-1 py-3 text-sm font-bold capitalize border-b-2 transition-all
                  ${activeTab === tab
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-slate-300'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: 'Full Name',  value: lead.name                        },
                { label: 'Email',      value: lead.email || '—'                },
                { label: 'Phone',      value: (lead as any).phone || '—'       },
                { label: 'Company',    value: (lead as any).company || '—'     },
                { label: 'Position',   value: (lead as any).position || '—'    },
                { label: 'Website',    value: (lead as any).website || '—'     },
                { label: 'Source',     value: (lead as any).source || '—'      },
                { label: 'Lead Value', value: (lead as any).leadValue > 0 ? `₹${Number((lead as any).leadValue).toLocaleString()}` : '—' },
                { label: 'City',       value: (lead as any).city || '—'        },
                { label: 'Country',    value: (lead as any).country || '—'     },
                { label: 'Assigned To',value: (lead as any).assignedTo?.user?.name || 'Unassigned' },
                { label: 'Stage',      value: lead.stage?.name || 'New'        },
              ].map(item => (
                <div key={item.label} className="space-y-1.5 rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</div>
                  <div className="text-sm font-bold text-foreground">{item.value}</div>
                </div>
              ))}

              {(lead as any).description && (
                <div className="sm:col-span-2 space-y-1.5 rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Description</div>
                  <p className="text-sm font-medium text-foreground whitespace-pre-wrap">{(lead as any).description}</p>
                </div>
              )}

              {(lead as any).tags?.length > 0 && (
                <div className="sm:col-span-2 space-y-3 rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-blue-500" /> Tags
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(lead as any).tags.map((tag: string) => (
                      <Badge key={tag} className="bg-muted text-foreground border-border hover:bg-muted shadow-sm rounded-md px-3 py-1 font-medium">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Activities Tab */}
          {activeTab === 'activities' && (
            <div className="space-y-6 bg-card border border-border shadow-sm rounded-2xl p-6">
              <form onSubmit={handleAddActivity} className="flex flex-col gap-3">
                <Label className="text-sm font-bold text-foreground">Log Activity</Label>
                <div className="flex gap-3">
                  <Input
                    value={activityMessage}
                    onChange={e => setActivityMessage(e.target.value)}
                    placeholder="Log an activity (e.g. called customer, sent email...)"
                    className="flex-1 rounded-xl border-border focus-visible:ring-blue-500 shadow-sm bg-muted h-11"
                  />
                  <Button type="submit" size="sm" className="h-11 px-6 gap-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-sm">
                    <Plus className="h-4 w-4" /> Add
                  </Button>
                </div>
              </form>

              <Separator className="bg-muted" />

              <div className="space-y-4">
                {activities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="h-12 w-12 rounded-full bg-muted border border-border flex items-center justify-center mb-3">
                      <MessageSquare className="h-5 w-5 text-slate-300" />
                    </div>
                    <p className="text-sm font-semibold text-slate-400">No activities logged yet</p>
                  </div>
                ) : (
                  activities.map(activity => (
                    <div key={activity.id} className="flex items-start gap-4 rounded-xl border border-border bg-muted/50 p-4 shadow-sm transition-all hover:bg-muted">
                      <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground leading-relaxed">{activity.message}</p>
                        <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-wider">
                          {new Date(activity.createdAt).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-6 bg-card border border-border shadow-sm rounded-2xl p-6">
              <form onSubmit={handleAddNote} className="flex flex-col gap-3">
                <Label className="text-sm font-bold text-foreground">Add a Note</Label>
                <Textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Add a note about this lead..."
                  className="rounded-xl border-border focus-visible:ring-blue-500 shadow-sm resize-none bg-muted min-h-[100px]"
                  rows={3}
                />
                <Button type="submit" size="sm" className="self-end gap-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg shadow-sm px-5 h-10">
                  <StickyNote className="h-4 w-4" /> Add Note
                </Button>
              </form>
              
              <Separator className="bg-muted" />
              
              <div className="space-y-4">
                {localNotes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="h-12 w-12 rounded-full bg-muted border border-border flex items-center justify-center mb-3">
                      <StickyNote className="h-5 w-5 text-slate-300" />
                    </div>
                    <p className="text-sm font-semibold text-slate-400">No notes yet</p>
                  </div>
                ) : (
                  localNotes.map(note => (
                    <div key={note.id} className="rounded-xl border border-border bg-muted/50 p-5 shadow-sm relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 rounded-l-xl" />
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

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="space-y-6 bg-card border border-border shadow-sm rounded-2xl p-6">
              <form onSubmit={handleAddTask} className="flex flex-col gap-3">
                <Label className="text-sm font-bold text-foreground">Add Task</Label>
                <div className="flex gap-3">
                  <Input
                    value={taskTitle}
                    onChange={e => setTaskTitle(e.target.value)}
                    placeholder="Add a follow-up task..."
                    className="flex-1 rounded-xl border-border focus-visible:ring-blue-500 shadow-sm bg-muted h-11"
                  />
                  <Button type="submit" size="sm" className="h-11 px-6 gap-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-sm">
                    <CheckSquare className="h-4 w-4" /> Add
                  </Button>
                </div>
              </form>
              
              <Separator className="bg-muted" />
              
              <div className="space-y-3">
                {localTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="h-12 w-12 rounded-full bg-muted border border-border flex items-center justify-center mb-3">
                      <CheckSquare className="h-5 w-5 text-slate-300" />
                    </div>
                    <p className="text-sm font-semibold text-slate-400">No tasks yet</p>
                  </div>
                ) : (
                  localTasks.map(task => (
                    <div key={task.id} className={`flex items-center gap-4 rounded-xl border p-4 shadow-sm transition-all
                      ${task.done ? 'bg-muted/50 border-border' : 'bg-card border-border hover:border-blue-200 hover:shadow-md'}
                    `}>
                      <button
                        onClick={() => setLocalTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t))}
                        className={`flex-shrink-0 h-6 w-6 rounded-md border-2 flex items-center justify-center transition-all shadow-sm
                          ${task.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-muted text-transparent hover:border-blue-400'}
                        `}
                      >
                        <CheckCircle2 className={`h-4 w-4 ${task.done ? 'opacity-100' : 'opacity-0'}`} />
                      </button>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${task.done ? 'line-through text-slate-400' : 'text-foreground'}`}>{task.title}</p>
                        <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                          {new Date(task.createdAt).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="flex flex-col gap-5">

          {/* Lead Contact Info */}
          <Card className="border-border bg-card shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-border bg-muted/50">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-100 text-blue-600">
                  <User className="h-4 w-4" />
                </div>
                Contact Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              {lead.email && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 rounded-full bg-muted text-muted-foreground border border-border"><Mail className="h-3.5 w-3.5" /></div>
                  <a href={`mailto:${lead.email}`} className="font-medium text-foreground hover:text-blue-600 transition-colors break-all">{lead.email}</a>
                </div>
              )}
              {(lead as any).phone && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 rounded-full bg-muted text-muted-foreground border border-border"><Phone className="h-3.5 w-3.5" /></div>
                  <span className="font-medium text-foreground">{(lead as any).phone}</span>
                </div>
              )}
              {(lead as any).company && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 rounded-full bg-muted text-muted-foreground border border-border"><Building2 className="h-3.5 w-3.5" /></div>
                  <span className="font-medium text-foreground">{(lead as any).company}</span>
                </div>
              )}
              {(lead as any).website && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 rounded-full bg-muted text-muted-foreground border border-border"><Globe className="h-3.5 w-3.5" /></div>
                  <a href={(lead as any).website} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:text-blue-600 transition-colors truncate">
                    {(lead as any).website}
                  </a>
                </div>
              )}
              {((lead as any).city || (lead as any).country) && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 rounded-full bg-muted text-muted-foreground border border-border"><MapPin className="h-3.5 w-3.5" /></div>
                  <span className="font-medium text-foreground">{[(lead as any).city, (lead as any).country].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Change Stage */}
          <Card className="border-border bg-card shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-border bg-muted/50">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-indigo-100 text-indigo-600">
                  <BarChart3 className="h-4 w-4" />
                </div>
                Change Stage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 pt-4">
              {PIPELINE_STAGES.map(stage => (
                <button
                  key={stage.key}
                  disabled={stage.key === lead.status || stageMoving}
                  onClick={() => handleMoveStage(stage.id)}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all
                    ${stage.key === lead.status
                      ? `${stage.bg} border border-border shadow-sm cursor-default`
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground border border-transparent hover:border-border'
                    }
                  `}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${stage.key === lead.status ? stage.dot : 'bg-slate-300'}`} />
                  <span className={stage.key === lead.status ? `font-bold ${stage.color}` : 'font-medium'}>{stage.label}</span>
                  {stage.key === lead.status && (
                    <Badge variant="secondary" className="ml-auto text-[10px] uppercase tracking-wider bg-card border border-border text-muted-foreground shadow-sm">Current</Badge>
                  )}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* CRM Actions */}
          <Card className="border-border bg-card shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-border bg-muted/50">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-600">
                  <Zap className="h-4 w-4" />
                </div>
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-5">
              {!isConverted && (
                <Button
                  className="w-full h-10 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border-none font-semibold rounded-lg"
                  onClick={() => navigate(`/dashboard/${businessId}/leads/${leadId}/convert`)}
                >
                  <Sparkles className="h-4 w-4" /> {isTrading ? 'Convert to Deal' : 'Convert to Customer'}
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full h-10 gap-2 border-border text-foreground hover:bg-muted shadow-sm font-semibold rounded-lg"
                onClick={() => navigate(`/dashboard/${businessId}/activities`)}
              >
                <Calendar className="h-4 w-4 text-blue-500" /> Log Activity
              </Button>
              <Button
                variant="outline"
                className="w-full h-10 gap-2 border-border text-foreground hover:bg-muted shadow-sm font-semibold rounded-lg"
                onClick={() => navigate(`/dashboard/${businessId}/leads/${leadId}/edit`)}
              >
                <Edit className="h-4 w-4 text-indigo-500" /> Edit Lead
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
