import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ChevronDown, Briefcase, Calendar, Users, Target, DollarSign, Paperclip, Info, Layers } from 'lucide-react';
import { UserSelect } from "@/components/project-operations/UserSelect";
import { useToast } from '@/components/ui/use-toast';

const Field = ({ label, required, children }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
    {children}
  </div>
);

const Input = ({ type = 'text', value, onChange, placeholder, className = '' }: any) => (
  <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-all ${className}`} />
);

const Select = ({ value, onChange, disabled, children }: any) => (
  <div className="relative">
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none appearance-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : 'cursor-pointer'}`}
    >
      {children}
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
  </div>
);

const Section = ({ title, icon: Icon, children }: any) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden mb-5">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 select-none" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg"><Icon className="w-5 h-5 text-blue-600" /></div>
          <span className="font-bold text-gray-900 dark:text-white">{title}</span>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>
      {open && <div className="p-6">{children}</div>}
    </div>
  );
};

export default function CreateTaskPage() {
  const routerParams = useParams() as any;
  const { businessId } = routerParams;
  const [searchParams] = useSearchParams();
  const queryProjectId = searchParams.get('projectId') || '';
  const queryPlanningId = searchParams.get('planningId') || '';

  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [plannings, setPlannings] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  const [form, setForm] = useState({
    title: '',
    taskCode: 'TSK-' + Math.floor(10000 + Math.random() * 90000),
    projectId: queryProjectId,
    planningId: queryPlanningId,
    phase: '',
    milestone: '',
    sprint: '',
    assigneeId: '',
    department: '',
    priority: '',
    status: '',
    startDate: '',
    dueDate: '',
    estimatedHours: '',
    actualHours: '',
    progress: 0,
    dependency: '',
    description: '',
    subTask: '',
    sequence: '',
    criticalTask: false,
    recurring: false,
    estimatedCost: '',
    actualCost: '',
    currency: '',
    notes: '',
  });

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const applyPlanningData = (plan: any) => {
    if (!plan) return;
    setForm(prev => ({
      ...prev,
      planningId: plan.id || plan._id,
      projectId: plan.projectId || prev.projectId,
      phase: plan.phase || prev.phase,
      sprint: plan.sprint || prev.sprint,
      milestone: plan.milestone || prev.milestone,
      priority: plan.priority || prev.priority,
      department: plan.department || prev.department,
      startDate: plan.startDate ? new Date(plan.startDate).toISOString().split('T')[0] : prev.startDate,
      dueDate: plan.endDate
        ? new Date(plan.endDate).toISOString().split('T')[0]
        : (plan.expectedCompletion ? new Date(plan.expectedCompletion).toISOString().split('T')[0] : prev.dueDate),
      estimatedHours: prev.estimatedHours || (plan.estimatedHours ? String(plan.estimatedHours) : ''),
      criticalTask: plan.criticalTask !== undefined ? plan.criticalTask : prev.criticalTask,
      recurring: plan.recurring !== undefined ? plan.recurring : prev.recurring,
      currency: plan.currency || prev.currency,
      estimatedCost: prev.estimatedCost || (plan.estimatedCost ? String(plan.estimatedCost) : ''),
      title: prev.title || plan.taskTitle || '',
      description: prev.description || plan.description || '',
    }));
  };

  const handleProjectChange = (projId: string) => {
    const p = projects.find(x => x.id === projId || x._id === projId);
    setForm(prev => {
      const currentPlan = plannings.find(pl => (pl.id === prev.planningId || pl._id === prev.planningId));
      const isPlanValid = currentPlan && currentPlan.projectId === projId;
      return {
        ...prev,
        projectId: projId,
        planningId: isPlanValid ? prev.planningId : '',
        department: p?.department || prev.department,
      };
    });
  };

  const handlePlanningChange = (planId: string) => {
    if (!planId) {
      set('planningId', '');
      return;
    }
    const plan = plannings.find(p => p.id === planId || p._id === planId);
    if (plan) {
      applyPlanningData(plan);
    } else {
      set('planningId', planId);
    }
  };

  useEffect(() => {
    const load = async () => {
      const API = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '');
      let token = localStorage.getItem('token');
      if (!token || token === 'null' || token === 'undefined') {
        token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || 
                document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1] || '';
      }
      const h = { 'Authorization': `Bearer ${token}`, 'x-business-id': businessId as string };

      fetch(`${API}/api/business`, { headers: h }).then(r => r.json()).then(d => {
        const c = (d.data || d.business)?.country?.toLowerCase() || '';
        if (c.includes('india') || c === 'in') set('currency', 'INR');
        else if (c.includes('uae') || c.includes('arab') || c === 'ae') set('currency', 'AED');
      }).catch(() => {});

      try {
        setLoadingPlans(true);
        const [pRes, uRes, plRes] = await Promise.all([
          fetch(`${API}/api/projects`, { headers: h }),
          fetch(`${API}/api/employees`, { headers: h }),
          fetch(`${API}/api/projects/global/plannings`, { headers: h }),
        ]);
        const [pd, ud, pld] = await Promise.all([pRes.json(), uRes.json(), plRes.json()]);
        const projs = pd.data || pd.projects || [];
        const usrs = ud.data || ud.users || [];
        const plans = pld.data || pld.plannings || [];

        setProjects(projs);
        setUsers(usrs);
        setPlannings(plans);

        if (queryPlanningId) {
          const matchedPlan = plans.find((p: any) => p.id === queryPlanningId || p._id === queryPlanningId);
          if (matchedPlan) {
            applyPlanningData(matchedPlan);
          }
        } else if (queryProjectId) {
          const matchedProj = projs.find((p: any) => p.id === queryProjectId || p._id === queryProjectId);
          setForm(prev => ({
            ...prev,
            projectId: queryProjectId,
            department: matchedProj?.department || prev.department,
          }));
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setLoadingPlans(false);
      }
    };
    load();
  }, [businessId, queryPlanningId, queryProjectId]);

  const handleSubmit = async (publish = false) => {
    if (!form.title || !form.projectId || !form.startDate || !form.dueDate || !form.estimatedHours) {
      toast({ title: 'Validation Error', description: 'Project, Task Title, Start Date, Due Date and Estimated Hours are required.', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const API = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '');
      let token = localStorage.getItem('token');
      if (!token || token === 'null' || token === 'undefined') {
        token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || 
                document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1] || '';
      }
      const res = await fetch(`${API}/api/projects/${form.projectId}/tasks`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'x-business-id': businessId as string, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: form.projectId,
          planningId: form.planningId || undefined,
          title: form.title,
          description: form.description || undefined,
          priority: form.priority || undefined,
          startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
          dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
          estimatedHours: parseFloat(form.estimatedHours) || 0,
          actualHours: parseFloat(form.actualHours) || 0,
          completionPercentage: form.progress,
          status: publish ? 'IN_PROGRESS' : (form.status || 'TODO'),
          assignedToId: form.assigneeId || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to create task');
      toast({ title: 'Success', description: `Task ${publish ? 'created & activated' : 'saved as draft'}.` });
      navigate(-1);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const availablePlannings = form.projectId
    ? plannings.filter(p => p.projectId === form.projectId)
    : plannings;

  const selProj = projects.find(p => p.id === form.projectId || p._id === form.projectId);
  const selPlan = plannings.find(p => p.id === form.planningId || p._id === form.planningId);

  return (
    <div className="flex flex-col min-h-[calc(100dvh-4rem)] bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                <span>Project Operations</span><span>/</span><span>Tasks</span><span>/</span><span className="text-blue-600">Create</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                Create Project Task
                <span className="text-[11px] px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full font-black tracking-widest">{form.taskCode}</span>
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">Define task scope, connect to planning schedule, assign resources, and set timelines.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
            <button onClick={() => handleSubmit(false)} disabled={saving} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Save Draft</button>
            <button onClick={() => handleSubmit(true)} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm transition-colors">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Create Task'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
          {/* Main Form */}
          <div className="flex-1 min-w-0">
            <Section title="1. General Information" icon={Briefcase}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Project Selection */}
                <div className="lg:col-span-2">
                  <Field label="Project" required>
                    <Select value={form.projectId} onChange={handleProjectChange}>
                      <option value="">Select Project...</option>
                      {projects.map((p: any) => (
                        <option key={p.id || p._id} value={p.id || p._id}>
                          {p.projectCode} — {p.projectName}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                {/* Planning Selection */}
                <div className="lg:col-span-1">
                  <Field label="Planning / Master Schedule">
                    <Select
                      value={form.planningId}
                      onChange={handlePlanningChange}
                      disabled={loadingPlans}
                    >
                      <option value="">
                        {!form.projectId
                          ? "Select Project first..."
                          : availablePlannings.length === 0
                          ? "No plannings for this project"
                          : "None (Direct Project Task)"}
                      </option>
                      {availablePlannings.map((plan: any) => (
                        <option key={plan.id || plan._id} value={plan.id || plan._id}>
                          {plan.planCode} • {plan.planName} {plan.phase ? `(${plan.phase})` : ''}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  {selPlan && (
                    <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md text-[11px] text-blue-700 dark:text-blue-300 font-semibold truncate">
                      <CheckCircle className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                      <span className="truncate">Linked: <strong className="font-bold">{selPlan.planCode}</strong> — {selPlan.planName}</span>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-2">
                  <Field label="Task Title" required>
                    <Input value={form.title} onChange={(v: string) => set('title', v)} placeholder="e.g. Implement Authentication Module" />
                  </Field>
                </div>
                <Field label="Phase"><Input value={form.phase} onChange={(v: string) => set('phase', v)} placeholder="e.g. Phase 1" /></Field>
                <Field label="Sprint"><Input value={form.sprint} onChange={(v: string) => set('sprint', v)} placeholder="e.g. Sprint 3" /></Field>
                <Field label="Milestone"><Input value={form.milestone} onChange={(v: string) => set('milestone', v)} placeholder="e.g. Beta Launch" /></Field>
                <Field label="Priority">
                  <Select value={form.priority} onChange={(v: string) => set('priority', v)}>
                    <option value="">Select Priority...</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </Select>
                </Field>
                <Field label="Status">
                  <Select value={form.status} onChange={(v: string) => set('status', v)}>
                    <option value="">Select Status...</option>
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="REVIEW">Review</option>
                    <option value="BLOCKED">Blocked</option>
                    <option value="COMPLETED">Completed</option>
                  </Select>
                </Field>
                <div className="lg:col-span-3">
                  <Field label="Description">
                    <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 resize-y transition-all" placeholder="Describe the task in detail..." />
                  </Field>
                </div>
              </div>
            </Section>

            <Section title="2. Timeline" icon={Calendar}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <Field label="Start Date" required><Input type="date" value={form.startDate} onChange={(v: string) => set('startDate', v)} /></Field>
                <Field label="Due Date" required><Input type="date" value={form.dueDate} onChange={(v: string) => set('dueDate', v)} /></Field>
                <Field label="Estimated Hours" required><Input type="number" value={form.estimatedHours} onChange={(v: string) => set('estimatedHours', v)} /></Field>
                <Field label="Actual Hours"><Input type="number" value={form.actualHours} onChange={(v: string) => set('actualHours', v)} /></Field>
                <Field label="Dependency (Task Code)"><Input value={form.dependency} onChange={(v: string) => set('dependency', v)} /></Field>
                <div className="flex gap-5 items-end pt-2 col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.criticalTask} onChange={e => set('criticalTask', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" /><span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Critical Task</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.recurring} onChange={e => set('recurring', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" /><span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recurring</span></label>
                </div>
              </div>
            </Section>

            <Section title="3. Resource Allocation" icon={Users}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <Field label="Assigned Employee">
                  <UserSelect businessId={businessId as string} value={form.assigneeId} onChange={(v) => set('assigneeId', v)} />
                </Field>
                <Field label="Department"><Select value={form.department} onChange={(v: string) => set('department', v)}><option value="">Select Department...</option><option>Engineering</option><option>Operations</option><option>Consulting</option><option>Sales</option><option>Finance</option></Select></Field>
                <Field label="Sequence"><Input type="number" value={form.sequence} onChange={(v: string) => set('sequence', v)} /></Field>
              </div>
            </Section>

            <Section title="4. Progress" icon={Target}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2">
                  <Field label={`Progress — ${form.progress}%`}>
                    <input type="range" min={0} max={100} value={form.progress} onChange={e => set('progress', Number(e.target.value))} className="w-full accent-blue-600 h-2 mt-2" />
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full mt-1 overflow-hidden">
                      <div className="h-2 bg-blue-500 rounded-full transition-all" style={{ width: `${form.progress}%` }}></div>
                    </div>
                  </Field>
                </div>
              </div>
            </Section>

            <Section title="5. Budget" icon={DollarSign}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Field label="Estimated Cost"><Input type="number" value={form.estimatedCost} onChange={(v: string) => set('estimatedCost', v)} /></Field>
                <Field label="Actual Cost"><Input type="number" value={form.actualCost} onChange={(v: string) => set('actualCost', v)} /></Field>
                <Field label="Currency"><Select value={form.currency} onChange={(v: string) => set('currency', v)}><option value="">Select Currency...</option><option value="USD">USD</option><option value="INR">INR</option><option value="AED">AED</option><option value="EUR">EUR</option><option value="GBP">GBP</option></Select></Field>
              </div>
            </Section>

            <Section title="6. Sub Tasks & Notes" icon={Info}>
              <div className="space-y-5">
                <Field label="Sub Task"><Input value={form.subTask} onChange={(v: string) => set('subTask', v)} placeholder="Optional sub-task description" /></Field>
                <Field label="Internal Notes"><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 resize-y transition-all" /></Field>
              </div>
            </Section>
          </div>

          {/* Summary Panel */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <div className="sticky top-28">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
                <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
                  <span className="font-bold text-sm">Task Summary</span>
                  <span className="text-[10px] font-black text-blue-300 bg-blue-900/40 px-2 py-0.5 rounded-full">{form.taskCode}</span>
                </div>
                <div className="p-4 space-y-3.5 text-sm divide-y divide-gray-100 dark:divide-gray-800">
                  {[
                    { label: 'Project', val: selProj?.projectName || '—' },
                    { label: 'Planning', val: selPlan ? `${selPlan.planCode} • ${selPlan.planName}` : 'None (Direct Task)' },
                    { label: 'Priority', val: form.priority || '—' },
                    { label: 'Status', val: (form.status || 'TODO').replace('_', ' ') },
                    { label: 'Start Date', val: form.startDate || '—' },
                    { label: 'Due Date', val: form.dueDate || '—' },
                    { label: 'Est. Hours', val: form.estimatedHours ? `${form.estimatedHours}h` : '—' },
                    { label: 'Progress', val: `${form.progress}%` },
                    { label: 'Est. Cost', val: form.estimatedCost ? `${form.currency || '$'} ${Number(form.estimatedCost).toLocaleString()}` : '—' },
                  ].map((r, i) => (
                    <div key={i} className="flex justify-between items-center pt-3 first:pt-0">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{r.label}</span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white text-right max-w-[140px] truncate" title={r.val}>{r.val}</span>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 space-y-2">
                  <button onClick={() => handleSubmit(false)} className="w-full py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Save Draft</button>
                  <button onClick={() => handleSubmit(true)} className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md transition-colors flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" /> Create Task</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
