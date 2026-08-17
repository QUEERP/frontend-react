import { toast } from 'sonner';
import React, { useState, useEffect, use } from 'react';
import {  Link , useParams } from 'react-router-dom';
import {  useNavigate  } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ChevronDown, Flag, Calendar, Users, Target, DollarSign, Paperclip, Activity, FileText } from 'lucide-react';
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

const Select = ({ value, onChange, children }: any) => (
  <div className="relative">
    <select value={value} onChange={e => onChange(e.target.value)} className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none cursor-pointer appearance-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all">
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

export default function CreateMilestonePage() {
  const routerParams = useParams() as any;
  const { businessId } = routerParams;

  
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [form, setForm] = useState({
    title: '', milestoneCode: 'MIL-' + Math.floor(1000 + Math.random() * 9000),
    projectId: '', phase: '', sprint: '', category: '',
    priority: '', status: '', description: '',
    startDate: '', targetDate: '', expectedCompletion: '', reminder: false, dependency: '', duration: '',
    projectManagerId: '', department: '', ownerId: '', approverId: '',
    paymentWeight: '', billingMilestone: false, invoiceTrigger: '', estimatedCost: '', currency: '',
    deliverables: '', acceptanceCriteria: '',
    progress: 0, risk: '', notes: ''
  });

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

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

      const [pRes, uRes] = await Promise.all([
        fetch(`${API}/api/projects`, { headers: h }).catch(() => ({ json: () => ({}) })),
        fetch(`${API}/api/employees`, { headers: h }).catch(() => ({ json: () => ({}) })),
      ]);
      const [pd, ud] = await Promise.all([pRes.json?.() || {}, uRes.json?.() || {}]);
      setProjects((pd as any)?.data || (pd as any)?.projects || []);
      setUsers((ud as any)?.data || (ud as any)?.users || []);
    };
    load();
  }, [businessId]);

  const handleSubmit = async (publish = false) => {
    if (!form.title || !form.projectId || !form.targetDate) {
      toast({ title: 'Validation Error', description: 'Milestone Title, Project, and Target Date are required.', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const API = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '');
      let token = localStorage.getItem('token');
      if (!token || token === 'null' || token === 'undefined') {
        token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || 
                document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1] || '';
      }
      const res = await fetch(`${API}/api/projects/${form.projectId}/milestones`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'x-business-id': businessId as string, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          targetDate: new Date(form.targetDate).toISOString(),
          completionPercentage: form.progress,
          status: publish ? 'PLANNED' : 'DRAFT',
          paymentWeight: parseFloat(form.paymentWeight) || 0,
          amount: parseFloat(form.estimatedCost) || 0,
          deliverables: form.deliverables,
        }),
      });
      
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to create milestone');
      
      toast({ title: 'Success', description: `Milestone ${publish ? 'created successfully' : 'saved as draft'}.` });
      navigate(-1);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Error saving milestone', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const selProj = projects.find(p => p.id === form.projectId || p._id === form.projectId);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                <span>Project Operations</span><span>/</span><span>Milestones</span><span>/</span><span className="text-blue-600">Create</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                Create Milestone
                <span className="text-[11px] px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full font-black tracking-widest">{form.milestoneCode}</span>
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">Define project deliverables, payments, and timeline targets.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
            <button onClick={() => handleSubmit(false)} disabled={saving} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Save Draft</button>
            <button onClick={() => handleSubmit(true)} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm transition-colors">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Create Milestone'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
          {/* Main Form */}
          <div className="flex-1 min-w-0">
            <Section title="1. General Information" icon={Flag}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-3">
                  <Field label="Project" required>
                    <Select value={form.projectId} onChange={(v: string) => {
                      const p = projects.find(x => x.id === v || x._id === v);
                      setForm(prev => ({ ...prev, projectId: v, projectManagerId: p?.projectManager || p?.managerId || prev.projectManagerId, department: p?.department || prev.department }));
                    }}>
                      <option value="">Select Project...</option>
                      {projects.map((p: any) => <option key={p.id || p._id} value={p.id || p._id}>{p.projectCode} — {p.projectName}</option>)}
                    </Select>
                  </Field>
                </div>
                <div className="lg:col-span-2"><Field label="Milestone Name" required><Input value={form.title} onChange={(v: string) => set('title', v)} placeholder="e.g. Phase 1 Go-Live" /></Field></div>
                <Field label="Category"><Select value={form.category} onChange={(v: string) => set('category', v)}><option value="">Select Category...</option><option value="General">General</option><option value="Design">Design</option><option value="Development">Development</option><option value="Testing">Testing</option><option value="Delivery">Delivery</option><option value="Payment">Payment</option></Select></Field>
                <Field label="Phase"><Input value={form.phase} onChange={(v: string) => set('phase', v)} placeholder="e.g. Planning Phase" /></Field>
                <Field label="Sprint"><Input value={form.sprint} onChange={(v: string) => set('sprint', v)} placeholder="e.g. Sprint 4" /></Field>
                <Field label="Priority"><Select value={form.priority} onChange={(v: string) => set('priority', v)}><option value="">Select Priority...</option><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option></Select></Field>
                <div className="lg:col-span-3"><Field label="Description"><textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 resize-y transition-all" placeholder="Describe the milestone details..." /></Field></div>
              </div>
            </Section>

            <Section title="2. Timeline" icon={Calendar}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <Field label="Start Date"><Input type="date" value={form.startDate} onChange={(v: string) => set('startDate', v)} /></Field>
                <Field label="Target Date" required><Input type="date" value={form.targetDate} onChange={(v: string) => set('targetDate', v)} /></Field>
                <Field label="Expected Completion"><Input type="date" value={form.expectedCompletion} onChange={(v: string) => set('expectedCompletion', v)} /></Field>
                <Field label="Dependency (Code)"><Input value={form.dependency} onChange={(v: string) => set('dependency', v)} placeholder="e.g. MIL-1002" /></Field>
                <Field label="Duration (Days)"><Input type="number" value={form.duration} onChange={(v: string) => set('duration', v)} /></Field>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.reminder} onChange={e => set('reminder', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" /><span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Set Reminder</span></label>
                </div>
              </div>
            </Section>

            <Section title="3. Assignment" icon={Users}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <Field label="Owner">
                  <UserSelect businessId={businessId as string} value={form.ownerId} onChange={(v) => set('ownerId', v)} />
                </Field>
                <Field label="Project Manager">
                  <UserSelect businessId={businessId as string} value={form.projectManagerId} onChange={(v) => set('projectManagerId', v)} placeholder="Select Manager" />
                </Field>
                <Field label="Approver">
                  <UserSelect businessId={businessId as string} value={form.approverId} onChange={(v) => set('approverId', v)} placeholder="Select Approver" />
                </Field>
                <Field label="Department"><Select value={form.department} onChange={(v: string) => set('department', v)}><option value="">Select Department...</option><option>Engineering</option><option>Design</option><option>Marketing</option><option>Sales</option><option>Finance</option></Select></Field>
              </div>
            </Section>

            <Section title="4. Commercial" icon={DollarSign}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Field label="Payment Weight (%)"><Input type="number" value={form.paymentWeight} onChange={(v: string) => set('paymentWeight', Number(v))} max={100} min={0} /></Field>
                <Field label="Estimated Cost"><Input type="number" value={form.estimatedCost} onChange={(v: string) => set('estimatedCost', Number(v))} /></Field>
                <Field label="Currency"><Select value={form.currency} onChange={(v: string) => set('currency', v)}><option value="">Select Currency...</option><option value="USD">USD</option><option value="INR">INR</option><option value="AED">AED</option><option value="EUR">EUR</option><option value="GBP">GBP</option></Select></Field>
                <div className="flex items-center pt-2">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.billingMilestone} onChange={e => set('billingMilestone', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" /><span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Billing Milestone</span></label>
                </div>
                {form.billingMilestone && (
                   <div className="md:col-span-2"><Field label="Invoice Trigger"><Select value={form.invoiceTrigger} onChange={(v: string) => set('invoiceTrigger', v)}><option value="">Select Trigger</option><option value="ON_COMPLETION">On Completion</option><option value="MANUAL">Manual</option><option value="UPFRONT">Upfront</option></Select></Field></div>
                )}
              </div>
            </Section>

            <Section title="5. Deliverables" icon={FileText}>
              <div className="space-y-5">
                <Field label="Deliverables"><textarea value={form.deliverables} onChange={e => set('deliverables', e.target.value)} rows={3} className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 resize-y transition-all" placeholder="List the tangible outputs required for this milestone..." /></Field>
                <Field label="Acceptance Criteria"><textarea value={form.acceptanceCriteria} onChange={e => set('acceptanceCriteria', e.target.value)} rows={2} className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 resize-y transition-all" placeholder="Criteria required for stakeholder sign-off..." /></Field>
              </div>
            </Section>

            <Section title="6. Progress & Risk" icon={Activity}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <Field label={`Progress — ${form.progress}%`}>
                    <input type="range" min={0} max={100} value={form.progress} onChange={e => set('progress', Number(e.target.value))} className="w-full accent-blue-600 h-2 mt-2" />
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full mt-1 overflow-hidden">
                      <div className="h-2 bg-blue-500 rounded-full transition-all" style={{ width: `${form.progress}%` }}></div>
                    </div>
                  </Field>
                </div>
                <Field label="Risk Level"><Select value={form.risk} onChange={(v: string) => set('risk', v)}><option value="">Select Risk...</option><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></Select></Field>
                <Field label="Status"><Select value={form.status} onChange={(v: string) => set('status', v)}><option value="">Select Status...</option><option value="DRAFT">Draft</option><option value="PLANNED">Planned</option><option value="IN_PROGRESS">In Progress</option><option value="PENDING_REVIEW">Pending Review</option><option value="COMPLETED">Completed</option><option value="DELAYED">Delayed</option><option value="AT_RISK">At Risk</option><option value="CANCELLED">Cancelled</option></Select></Field>
                <div className="md:col-span-2"><Field label="Completion Notes"><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 resize-y transition-all" /></Field></div>
              </div>
            </Section>
          </div>

          {/* Summary Panel */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <div className="sticky top-28">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
                <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
                  <span className="font-bold text-sm">Milestone Summary</span>
                  <span className="text-[10px] font-black text-blue-300 bg-blue-900/40 px-2 py-0.5 rounded-full">{form.milestoneCode}</span>
                </div>
                <div className="p-4 space-y-3.5 text-sm divide-y divide-gray-100 dark:divide-gray-800">
                  {[
                    { label: 'Project', val: selProj?.projectName || '—' },
                    { label: 'Priority', val: form.priority },
                    { label: 'Status', val: form.status.replace('_', ' ') },
                    { label: 'Target Date', val: form.targetDate || '—' },
                    { label: 'Pay. Weight', val: form.paymentWeight ? `${form.paymentWeight}%` : '—' },
                    { label: 'Est. Cost', val: form.estimatedCost ? `${form.currency} ${Number(form.estimatedCost).toLocaleString()}` : '—' },
                    { label: 'Progress', val: `${form.progress}%` },
                  ].map((r, i) => (
                    <div key={i} className="flex justify-between items-center pt-3 first:pt-0">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{r.label}</span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white text-right max-w-[130px] truncate">{r.val}</span>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 space-y-2">
                  <button onClick={() => handleSubmit(false)} className="w-full py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Save Draft</button>
                  <button onClick={() => handleSubmit(true)} className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md transition-colors flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" /> Create Milestone</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
