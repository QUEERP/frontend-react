import React, { useState, useEffect } from 'react'
import {  useParams  } from 'react-router-dom';
import { crmTasksAPI, CrmTask } from '@/lib/api/crm'
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
  CheckSquare, 
  Plus, 
  Loader2, 
  Trash2, 
  Clock, 
  AlertCircle,
  ArrowRight,
  TrendingDown,
  CalendarDays
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function CrmTasksPage() {
  const routerParams = useParams() as any;
  const { businessId } = routerParams;

  const params = useParams()
  
  
  const [tasks, setTasks] = useState<CrmTask[]>([])
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: '',
  })

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const res = await crmTasksAPI.getAll(businessId)
      if (res.success && Array.isArray(res.data)) {
        setTasks(res.data)
      } else {
        setTasks([])
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load tasks')
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [businessId])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast.error('Task title is required')
      return
    }

    setFormLoading(true)
    try {
      const res = await crmTasksAPI.create(businessId, formData)
      if (res.success) {
        toast.success('CRM Task added successfully!')
        setShowAddForm(false)
        setFormData({
          title: '',
          description: '',
          status: 'TODO',
          priority: 'MEDIUM',
          dueDate: '',
        })
        fetchTasks()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create task')
    } finally {
      setFormLoading(false)
    }
  }

  const handleMoveStatus = async (id: string, currentStatus: string) => {
    let nextStatus = 'TODO'
    if (currentStatus === 'TODO') nextStatus = 'IN_PROGRESS'
    else if (currentStatus === 'IN_PROGRESS') nextStatus = 'DONE'
    else return; // already done

    try {
      const res = await crmTasksAPI.update(businessId, id, { status: nextStatus })
      if (res.success) {
        toast.success(`Task moved to ${nextStatus.replace('_', ' ')}`)
        fetchTasks()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update task')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return
    try {
      const res = await crmTasksAPI.delete(businessId, id)
      if (res.success) {
        toast.success('Task removed')
        fetchTasks()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete task')
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH': return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 shadow-sm px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px]">High</Badge>
      case 'MEDIUM': return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 shadow-sm px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px]">Medium</Badge>
      case 'LOW': return <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-500/10 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20 shadow-sm px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px]">Low</Badge>
      default: return <Badge variant="outline" className="px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px] dark:border-slate-700 dark:text-slate-300 shadow-sm">{priority}</Badge>
    }
  }

  // Group tasks by column
  const todoTasks = (tasks || []).filter(t => t && t.status === 'TODO')
  const progressTasks = (tasks || []).filter(t => t && t.status === 'IN_PROGRESS')
  const doneTasks = (tasks || []).filter(t => t && t.status === 'DONE')

  const renderTaskCard = (task: CrmTask) => {
    return (
      <div key={task.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-md transition-all group overflow-hidden">
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-start gap-2">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-snug line-clamp-2">{task.title}</h4>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-slate-400 dark:text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg cursor-pointer"
              onClick={() => handleDelete(task.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {task.description && (
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{task.description}</p>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Date'}</span>
            </div>
            <div>
              {getPriorityBadge(task.priority)}
            </div>
          </div>

          {task.status !== 'DONE' && (
            <Button 
              variant="outline" 
              className="w-full mt-3 text-xs py-1.5 h-8 gap-1.5 font-bold text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg cursor-pointer transition-colors"
              onClick={() => handleMoveStatus(task.id, task.status)}
            >
              <span>Advance Stage</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-[#f8fafc] dark:bg-slate-950 px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex min-w-0 items-center gap-4">
          <div className="p-3 bg-sky-50 dark:bg-sky-500/10 text-sky-500 rounded-xl hidden sm:block">
            <CheckSquare className="h-6 w-6" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">CRM Pipeline Tasks</span>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">Orchestrate operational tasks for Leads and Sales Deals.</span>
          </div>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 shadow-sm cursor-pointer transition-colors shrink-0">
          {showAddForm ? 'Close Form' : (
            <>
              <Plus className="h-4 w-4" />
              Schedule Task
            </>
          )}
        </Button>
      </div>

      {/* QUICK ADD FORM */}
      {showAddForm && (
        <div className="rounded-2xl border-t-4 border-t-sky-500 border-x border-b border-x-slate-200 border-b-slate-200 dark:border-x-slate-800 dark:border-b-slate-800 bg-white dark:bg-slate-900 shadow-md animate-in fade-in slide-in-from-top-2 duration-200 transition-colors overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Schedule Operational Task</h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Allocate task parameters, prioritizations, and timeline milestones.</p>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="title" className="text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Task Title <span className="text-rose-500">*</span></Label>
                  <Input 
                    id="title" 
                    value={formData.title} 
                    onChange={(e) => handleInputChange('title', e.target.value)} 
                    placeholder="e.g. Draft proposal document"
                    className="rounded-xl border-slate-200 dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="priority" className="text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Task Priority</Label>
                  <Select value={formData.priority} onValueChange={(val) => handleInputChange('priority', val)}>
                    <SelectTrigger id="priority" className="rounded-xl border-slate-200 dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 dark:border-slate-800 rounded-xl">
                      <SelectItem value="LOW" className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">Low priority</SelectItem>
                      <SelectItem value="MEDIUM" className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">Medium priority</SelectItem>
                      <SelectItem value="HIGH" className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">High priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="dueDate" className="text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Target Due Date</Label>
                  <Input 
                    id="dueDate" 
                    type="date" 
                    value={formData.dueDate} 
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    className="rounded-xl border-slate-200 dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100 [&::-webkit-calendar-picker-indicator]:dark:invert"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="status" className="text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Initial Status</Label>
                  <Select value={formData.status} onValueChange={(val) => handleInputChange('status', val)}>
                    <SelectTrigger id="status" className="rounded-xl border-slate-200 dark:border-slate-700 h-10 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 dark:border-slate-800 rounded-xl">
                      <SelectItem value="TODO" className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">To Do</SelectItem>
                      <SelectItem value="IN_PROGRESS" className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">In Progress</SelectItem>
                      <SelectItem value="DONE" className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Details / Summary</Label>
                <Textarea 
                  id="description" 
                  value={formData.description} 
                  onChange={(e) => handleInputChange('description', e.target.value)} 
                  placeholder="Draft context, links, or criteria..."
                  rows={4}
                  className="rounded-xl border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500 dark:bg-slate-950 dark:text-slate-100 resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 dark:border-slate-800 mt-6">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="rounded-xl h-10 px-6 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer">Cancel</Button>
                <Button type="submit" disabled={formLoading} className="rounded-xl h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 shadow-sm cursor-pointer">
                  {formLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                  Deploy Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KANBAN BOARD */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Column 1: TODO */}
          <div className="flex flex-col gap-4 bg-slate-50/80 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[400px]">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-sm tracking-tight flex items-center gap-2 text-slate-800 dark:text-slate-100">
                <AlertCircle className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <span>To Do</span>
              </h3>
              <Badge variant="secondary" className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold shadow-none rounded-md px-2">{todoTasks.length}</Badge>
            </div>
            <div className="space-y-3 flex-1">
              {todoTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 py-10">
                  <CheckSquare className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-xs font-medium">No tasks in backlog</p>
                </div>
              ) : todoTasks.map(renderTaskCard)}
            </div>
          </div>

          {/* Column 2: IN PROGRESS */}
          <div className="flex flex-col gap-4 bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/50 shadow-sm min-h-[400px]">
            <div className="flex justify-between items-center pb-3 border-b border-blue-200 dark:border-blue-800">
              <h3 className="font-bold text-sm tracking-tight flex items-center gap-2 text-blue-800 dark:text-blue-100">
                <Clock className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                <span>In Progress</span>
              </h3>
              <Badge variant="secondary" className="bg-blue-200 dark:bg-blue-800/50 text-blue-800 dark:text-blue-300 font-semibold shadow-none rounded-md px-2">{progressTasks.length}</Badge>
            </div>
            <div className="space-y-3 flex-1">
              {progressTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-blue-400 dark:text-blue-600/50 py-10">
                  <Clock className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-xs font-medium">No active tasks</p>
                </div>
              ) : progressTasks.map(renderTaskCard)}
            </div>
          </div>

          {/* Column 3: DONE */}
          <div className="flex flex-col gap-4 bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 shadow-sm min-h-[400px]">
            <div className="flex justify-between items-center pb-3 border-b border-emerald-200 dark:border-emerald-800">
              <h3 className="font-bold text-sm tracking-tight flex items-center gap-2 text-emerald-800 dark:text-emerald-100">
                <CheckSquare className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                <span>Completed</span>
              </h3>
              <Badge variant="secondary" className="bg-emerald-200 dark:bg-emerald-800/50 text-emerald-800 dark:text-emerald-300 font-semibold shadow-none rounded-md px-2">{doneTasks.length}</Badge>
            </div>
            <div className="space-y-3 flex-1">
              {doneTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-emerald-400 dark:text-emerald-600/50 py-10">
                  <CheckSquare className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-xs font-medium">No completed tasks</p>
                </div>
              ) : doneTasks.map(renderTaskCard)}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
