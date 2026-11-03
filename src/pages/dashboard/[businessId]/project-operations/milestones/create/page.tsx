import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle, ChevronDown, Flag, Calendar, Users, 
  DollarSign, Activity, FileText, Plus, Trash2, CheckSquare, Upload, AlertCircle, Info, ShieldAlert 
} from 'lucide-react';
import { UserSelect } from "@/components/project-operations/UserSelect";
import { useToast } from '@/components/ui/use-toast';

const Field = ({ id, label, required, error, children, className = '' }: any) => (
  <div id={id} className={`flex flex-col gap-1.5 ${className}`}>
    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center justify-between">
      <span>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {error && <span className="text-[11px] text-red-500 font-normal lowercase tracking-normal">{error}</span>}
    </label>
    {children}
  </div>
);

const Input = ({ type = 'text', value, onChange, placeholder, className = '', disabled = false, min, max }: any) => (
  <input 
    type={type} 
    value={value} 
    onChange={e => onChange(e.target.value)} 
    placeholder={placeholder}
    disabled={disabled}
    min={min}
    max={max}
    className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed ${className}`} 
  />
);

const Select = ({ value, onChange, children, className = '', disabled = false }: any) => (
  <div className="relative">
    <select 
      value={value} 
      onChange={e => onChange(e.target.value)} 
      disabled={disabled}
      className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none cursor-pointer appearance-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
  </div>
);

const Section = ({ title, icon: Icon, children, id }: any) => {
  const [open, setOpen] = useState(true);
  return (
    <div id={id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden mb-5">
      <div 
        className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 select-none" 
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
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
  const [searchParams] = useSearchParams();
  const urlProjectId = searchParams.get('projectId') || '';
  const urlPlanningId = searchParams.get('planningId') || '';

  const [saving, setSaving] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [projects, setProjects] = useState<any[]>([]);
  const ALL_STANDARD_MILESTONE_TYPES = [
    'Contractual',
    'Internal',
    'Regulatory',
    'Review Gate',
    'Deliverable',
    'Payment / Billing',
    'Phase Gate',
    'Technical / Architectural',
    'Testing / QA',
    'Go-Live / Deployment',
    'Customer Sign-Off',
    'Procurement',
    'Operational',
    'Maintenance & Support'
  ];

  const [formOptions, setFormOptions] = useState<{
    plans: any[];
    projectMilestones: any[];
    categories: string[];
    types: string[];
    departments: string[];
    terminology: Record<string, string>;
    defaultCurrency: string;
    remainingPaymentWeight: number;
    linkedUsers?: any[];
    linkedUserIds?: string[];
    defaultProjectManagerId?: string | null;
    defaultProjectManager?: any | null;
  }>({
    plans: [],
    projectMilestones: [],
    categories: [],
    types: ALL_STANDARD_MILESTONE_TYPES,
    departments: ['Engineering', 'Operations', 'Consulting', 'Sales', 'Finance', 'Design', 'QA', 'Management'],
    terminology: {},
    defaultCurrency: 'USD',
    remainingPaymentWeight: 100,
    linkedUsers: [],
    linkedUserIds: []
  });

  const [form, setForm] = useState({
    milestoneCode: 'MIL-0001',
    title: '',
    projectId: '',
    categoryId: '',
    typeId: '',
    planningId: '',
    phase: '',
    sprint: '',
    priority: 'MEDIUM',
    tags: [] as string[],
    tagInput: '',
    description: '',

    startDate: '',
    targetDate: '',
    expectedCompletion: '',
    dependencies: [] as string[],
    reminderEnabled: false,
    reminderDaysBefore: 3,

    ownerId: '',
    projectManagerId: '',
    approverId: '',
    department: '',

    isBilling: false,
    paymentWeight: 0,
    estimatedCost: 0,
    currency: 'USD',
    invoiceTrigger: 'ON_COMPLETION',

    riskLevel: 'LOW',
    riskMitigation: '',
    status: 'NOT_STARTED',
    completionNotes: '',
  });

  // Dynamic Checklist Items
  const [items, setItems] = useState<Array<{ id?: string; kind: 'DELIVERABLE' | 'ACCEPTANCE_CRITERIA'; title: string; isDone: boolean }>>([
    { kind: 'DELIVERABLE', title: '', isDone: false },
    { kind: 'ACCEPTANCE_CRITERIA', title: '', isDone: false }
  ]);

  // Uploaded documents
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (k: string, v: any) => {
    setForm(p => ({ ...p, [k]: v }));
    if (errors[k]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[k];
        return next;
      });
    }
  };

  const API = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '');

  const getHeaders = () => {
    let token = localStorage.getItem('token');
    if (!token || token === 'null' || token === 'undefined') {
      token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || 
              document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1] || '';
    }
    return {
      'Authorization': `Bearer ${token}`,
      'x-business-id': businessId as string,
      'Content-Type': 'application/json'
    };
  };

  // Initial load: projects & next code
  useEffect(() => {
    const init = async () => {
      try {
        const h = getHeaders();
        const [projRes, codeRes] = await Promise.all([
          fetch(`${API}/api/projects`, { headers: h }).then(r => r.json()).catch(() => ({})),
          fetch(`${API}/api/milestones/next-code`, { headers: h }).then(r => r.json()).catch(() => ({}))
        ]);

        const pList = projRes?.data || projRes?.projects || [];
        setProjects(pList);
        if (codeRes?.success && codeRes?.nextCode) {
          set('milestoneCode', codeRes.nextCode);
        }

        // If URL has projectId, pre-select it
        if (urlProjectId) {
          const matchedProj = pList.find((p: any) => p.id === urlProjectId || p._id === urlProjectId);
          setForm(prev => ({
            ...prev,
            projectId: urlProjectId,
            projectManagerId: matchedProj?.projectManagerId || matchedProj?.projectManager?.id || prev.projectManagerId,
            department: matchedProj?.department || prev.department
          }));
        }
      } catch (e) {
        console.error('Initialization error:', e);
      }
    };
    init();
  }, [businessId]);

  // When project changes, fetch form-options
  useEffect(() => {
    if (!form.projectId) {
      setFormOptions(prev => ({
        ...prev,
        plans: [],
        projectMilestones: [],
        remainingPaymentWeight: 100,
        linkedUsers: [],
        linkedUserIds: [],
        defaultProjectManagerId: null
      }));
      return;
    }

    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const h = getHeaders();
        const res = await fetch(`${API}/api/milestones/form-options?projectId=${form.projectId}`, { headers: h });
        const data = await res.json();
        if (data?.success && data?.options) {
          setFormOptions(data.options);
          if (data.options.defaultCurrency && !form.currency) {
            set('currency', data.options.defaultCurrency);
          }
          // Auto-fetch Project Manager from project options
          if (data.options.defaultProjectManagerId) {
            set('projectManagerId', data.options.defaultProjectManagerId);
          }
          // Pre-select planning if provided in URL
          if (urlPlanningId && data.options.plans?.some((p: any) => p.id === urlPlanningId)) {
            const matchedPlan = data.options.plans.find((p: any) => p.id === urlPlanningId);
            setForm(prev => ({
              ...prev,
              planningId: urlPlanningId,
              phase: matchedPlan?.phase || prev.phase,
              sprint: matchedPlan?.sprint || prev.sprint
            }));
          }
        }
      } catch (e) {
        console.error('Error fetching milestone options:', e);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [form.projectId]);

  // Selected plan logic
  const selectedPlan = formOptions.plans.find(p => p.id === form.planningId);
  const planHasSprint = Boolean(selectedPlan?.sprint && selectedPlan.sprint.trim());

  // Dynamic duration calculation
  const computedDuration = (form.startDate && form.targetDate)
    ? Math.max(0, Math.ceil((new Date(form.targetDate).getTime() - new Date(form.startDate).getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  // Checklist Helpers
  const addItem = (kind: 'DELIVERABLE' | 'ACCEPTANCE_CRITERIA') => {
    setItems(prev => [...prev, { kind, title: '', isDone: false }]);
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, patch: Partial<{ title: string; isDone: boolean; kind: any }>) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, ...patch } : item));
  };

  // Tag helper
  const addTag = () => {
    const val = form.tagInput.trim();
    if (val && !form.tags.includes(val)) {
      set('tags', [...form.tags, val]);
      set('tagInput', '');
    }
  };

  const removeTag = (tag: string) => {
    set('tags', form.tags.filter(t => t !== tag));
  };

  // Document upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const h = getHeaders();
      delete (h as any)['Content-Type'];
      const fd = new FormData();
      fd.append('file', file);
      fd.append('entityType', 'MILESTONE');
      fd.append('folder', 'Milestones');
      if (form.projectId) fd.append('projectId', form.projectId);

      const res = await fetch(`${API}/api/project-operations/documents`, {
        method: 'POST',
        headers: { 'Authorization': h['Authorization'], 'x-business-id': businessId as string },
        body: fd
      });
      const data = await res.json();
      if (data?.success && data?.document) {
        setAttachments(prev => [...prev, data.document]);
        toast({ title: 'Uploaded', description: `${file.name} attached.` });
      } else {
        throw new Error(data?.message || 'Upload failed');
      }
    } catch (err: any) {
      toast({ title: 'Upload Failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Validation & Scroll
  const validate = (isDraft = false) => {
    const errs: Record<string, string> = {};

    if (!isDraft) {
      if (!form.projectId) errs.projectId = 'Project is required';
      if (!form.title.trim()) errs.title = 'Milestone name is required';
      if (!form.targetDate) errs.targetDate = 'Target due date is required';
    }

    if (form.startDate && form.targetDate) {
      if (new Date(form.targetDate) < new Date(form.startDate)) {
        errs.targetDate = 'Target date must be on or after start date';
      }
    }

    if (form.reminderEnabled && Number(form.reminderDaysBefore) < 1) {
      errs.reminderDaysBefore = 'Must be at least 1 day before';
    }

    if (form.isBilling) {
      const w = Number(form.paymentWeight);
      if (isNaN(w) || w <= 0 || w > 100) {
        errs.paymentWeight = 'Weight must be between 1% and 100%';
      } else if (w > formOptions.remainingPaymentWeight) {
        errs.paymentWeight = `Exceeds max available (${formOptions.remainingPaymentWeight}%)`;
      }
    }

    const risk = form.riskLevel.toUpperCase();
    if (['MEDIUM', 'HIGH', 'CRITICAL'].includes(risk) && !form.riskMitigation.trim()) {
      errs.riskMitigation = `Mitigation required when risk is ${form.riskLevel}`;
    }

    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      const firstKey = Object.keys(errs)[0];
      const el = document.getElementById(`field-${firstKey}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }
    return true;
  };

  // Submit Handler
  const handleSubmit = async (publish = true) => {
    const isDraft = !publish;
    if (!validate(isDraft)) {
      toast({
        title: 'Validation Error',
        description: 'Please resolve the highlighted issues before proceeding.',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const h = getHeaders();

      // Clean checklist items
      const validItems = items
        .filter(it => it.title.trim().length > 0)
        .map((it, idx) => ({
          kind: it.kind,
          title: it.title.trim(),
          isDone: it.isDone,
          sortOrder: idx
        }));

      const payload = {
        milestoneCode: form.milestoneCode,
        name: form.title.trim(),
        title: form.title.trim(),
        projectId: form.projectId,
        categoryId: form.categoryId || null,
        typeId: form.typeId || null,
        planningId: form.planningId || null,
        phase: form.phase || null,
        sprint: planHasSprint ? form.sprint : null,
        priority: form.priority,
        tags: form.tags,
        description: form.description || null,

        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        dueDate: form.targetDate ? new Date(form.targetDate).toISOString() : null,
        targetDate: form.targetDate ? new Date(form.targetDate).toISOString() : null,
        expectedCompletion: form.expectedCompletion ? new Date(form.expectedCompletion).toISOString() : null,
        dependencies: form.dependencies.map(id => ({ predecessorId: id })),
        reminderEnabled: form.reminderEnabled,
        reminderDaysBefore: form.reminderEnabled ? Number(form.reminderDaysBefore) : null,

        ownerId: form.ownerId || null,
        projectManagerId: form.projectManagerId || null,
        approverId: form.approverId || null,
        department: form.department || null,

        isBilling: form.isBilling,
        weight: form.isBilling ? Number(form.paymentWeight) : 0,
        paymentWeight: form.isBilling ? Number(form.paymentWeight) : 0,
        estimatedCost: Number(form.estimatedCost) || 0,
        currency: form.currency,
        invoiceTrigger: form.invoiceTrigger,

        items: validItems,
        status: isDraft ? 'DRAFT' : (form.status || 'NOT_STARTED'),
        riskLevel: form.riskLevel,
        riskMitigation: form.riskMitigation || null,
        completionNotes: form.completionNotes || null
      };

      const res = await fetch(`${API}/api/milestones`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create milestone');
      }

      toast({
        title: 'Success',
        description: `Milestone ${data.milestone?.milestoneCode || form.milestoneCode} ${isDraft ? 'saved as draft' : 'created successfully'}.`
      });

      navigate(`/dashboard/${businessId}/project-operations/milestones`);
    } catch (err: any) {
      toast({
        title: 'Error Saving Milestone',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const selProj = projects.find(p => p.id === form.projectId || p._id === form.projectId);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sticky Header */}
      <div className="sticky top-0 px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur shadow-sm z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                <span>Project Operations</span>
                <span>/</span>
                <span>Milestones</span>
                <span>/</span>
                <span className="text-blue-600">Create</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                Create Milestone
                <span className="text-[11px] px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full font-black tracking-widest">
                  {form.milestoneCode}
                </span>
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">Define deliverables, payment triggers, dependencies and timeline goals.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)} 
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => handleSubmit(false)} 
              disabled={saving} 
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Save Draft
            </button>
            <button 
              onClick={() => handleSubmit(true)} 
              disabled={saving} 
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Create Milestone'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
          {/* Main Form Fields */}
          <div className="flex-1 min-w-0">
            {/* Section 1: General Information */}
            <Section id="sec-general" title="1. General Information" icon={Flag}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-3">
                  <Field id="field-projectId" label="Project" required error={errors.projectId}>
                    <Select 
                      value={form.projectId} 
                      onChange={(v: string) => {
                        const p = projects.find(x => x.id === v || x._id === v);
                        const autoPM = p?.projectManagerId || p?.projectManager?.id || p?.projectManager || '';
                        setForm(prev => ({ 
                          ...prev, 
                          projectId: v, 
                          projectManagerId: autoPM || prev.projectManagerId,
                          department: p?.department || prev.department,
                          planningId: '',
                          phase: '',
                          sprint: ''
                        }));
                      }}
                    >
                      <option value="">Select Project...</option>
                      {projects.map((p: any) => (
                        <option key={p.id || p._id} value={p.id || p._id}>
                          {p.projectCode} — {p.projectName}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <div className="lg:col-span-2">
                  <Field id="field-title" label="Milestone Name" required error={errors.title}>
                    <Input 
                      value={form.title} 
                      onChange={(v: string) => set('title', v)} 
                      placeholder="e.g. Phase 1 Architecture Sign-off" 
                    />
                  </Field>
                </div>

                <Field id="field-category" label="Category">
                  <Select value={form.categoryId} onChange={(v: string) => set('categoryId', v)}>
                    <option value="">Select Category...</option>
                    {(formOptions.categories.length > 0 ? formOptions.categories : ['General', 'Planning', 'Execution', 'Review', 'Delivery', 'Payment']).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Select>
                </Field>

                <Field id="field-type" label="Milestone Type">
                  <Select value={form.typeId} onChange={(v: string) => set('typeId', v)}>
                    <option value="">Select Type...</option>
                    {(formOptions.types && formOptions.types.length > 0 ? formOptions.types : ALL_STANDARD_MILESTONE_TYPES).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </Select>
                </Field>

                <Field id="field-planning" label="Planning / Master Schedule">
                  <Select 
                    value={form.planningId} 
                    onChange={(v: string) => {
                      const pl = formOptions.plans.find(p => p.id === v);
                      setForm(prev => ({
                        ...prev,
                        planningId: v,
                        phase: pl?.phase || prev.phase,
                        sprint: pl?.sprint || '',
                        projectManagerId: pl?.projectManagerId || prev.projectManagerId
                      }));
                    }}
                    disabled={!form.projectId || loadingOptions}
                  >
                    {!form.projectId ? (
                      <option value="">Select a project first...</option>
                    ) : loadingOptions ? (
                      <option value="">Loading master schedules...</option>
                    ) : (
                      <>
                        <option value="">None / Direct Project Milestone</option>
                        {formOptions.plans.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.planCode} — {p.planName}
                          </option>
                        ))}
                      </>
                    )}
                  </Select>
                  {form.projectId && !loadingOptions && formOptions.plans.length === 0 && (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                      No master planning schedules found for this project.
                    </span>
                  )}
                </Field>

                <Field id="field-phase" label="Phase">
                  <Input 
                    value={form.phase} 
                    onChange={(v: string) => set('phase', v)} 
                    placeholder="e.g. Planning Phase" 
                  />
                </Field>

                {/* Dynamic Sprint Field: visible only if selected plan has a sprint */}
                {planHasSprint && (
                  <Field id="field-sprint" label={formOptions.terminology['Sprint'] || "Sprint"}>
                    <Input 
                      value={form.sprint} 
                      onChange={(v: string) => set('sprint', v)} 
                      placeholder="e.g. Sprint 2" 
                    />
                  </Field>
                )}

                <Field id="field-priority" label="Priority">
                  <Select value={form.priority} onChange={(v: string) => set('priority', v)}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </Select>
                </Field>

                <div className="lg:col-span-3">
                  <Field id="field-tags" label="Tags">
                    <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg min-h-[42px]">
                      {form.tags.map(t => (
                        <span key={t} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-xs font-semibold">
                          #{t}
                          <button type="button" onClick={() => removeTag(t)} className="hover:text-red-500 font-bold">×</button>
                        </span>
                      ))}
                      <input 
                        type="text" 
                        value={form.tagInput} 
                        onChange={e => set('tagInput', e.target.value)} 
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                        placeholder={form.tags.length === 0 ? "Type tag & press Enter..." : "Add tag..."}
                        className="flex-1 min-w-[120px] bg-transparent text-sm outline-none px-1"
                      />
                    </div>
                  </Field>
                </div>

                <div className="lg:col-span-3">
                  <Field id="field-desc" label="Description">
                    <textarea 
                      value={form.description} 
                      onChange={e => set('description', e.target.value)} 
                      rows={3} 
                      className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 resize-y transition-all" 
                      placeholder="Describe the milestone objectives and deliverables..." 
                    />
                  </Field>
                </div>
              </div>
            </Section>

            {/* Section 2: Timeline */}
            <Section id="sec-timeline" title="2. Timeline" icon={Calendar}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <Field id="field-startDate" label="Start Date">
                  <Input type="date" value={form.startDate} onChange={(v: string) => set('startDate', v)} />
                </Field>

                <Field id="field-targetDate" label="Target Date (Due Date)" required error={errors.targetDate}>
                  <Input type="date" value={form.targetDate} onChange={(v: string) => set('targetDate', v)} />
                </Field>

                <Field id="field-expectedCompletion" label="Expected Completion">
                  <Input type="date" value={form.expectedCompletion} onChange={(v: string) => set('expectedCompletion', v)} />
                </Field>

                <div className="lg:col-span-2">
                  <Field id="field-dependencies" label="Dependencies (Must finish before this milestone)">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg max-h-44 overflow-y-auto space-y-2">
                      {formOptions.projectMilestones.length === 0 ? (
                        <p className="text-xs text-gray-400 py-1">No other milestones in this project yet.</p>
                      ) : (
                        formOptions.projectMilestones.map(m => (
                          <label key={m.id} className="flex items-center gap-2.5 text-xs text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 p-1.5 rounded">
                            <input 
                              type="checkbox" 
                              checked={form.dependencies.includes(m.id)} 
                              onChange={e => {
                                if (e.target.checked) set('dependencies', [...form.dependencies, m.id]);
                                else set('dependencies', form.dependencies.filter(id => id !== m.id));
                              }}
                              className="w-4 h-4 text-blue-600 rounded" 
                            />
                            <span className="font-semibold text-blue-600 dark:text-blue-400">{m.milestoneCode}</span>
                            <span className="truncate">{m.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </Field>
                </div>

                <div className="flex flex-col justify-between">
                  <Field label="Computed Duration">
                    <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300">
                      {computedDuration !== null ? `${computedDuration} Days` : '—'}
                    </div>
                  </Field>

                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={form.reminderEnabled} 
                        onChange={e => set('reminderEnabled', e.target.checked)} 
                        className="w-4 h-4 text-blue-600 rounded" 
                      />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Enable Due Date Reminder</span>
                    </label>

                    {form.reminderEnabled && (
                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Alert</span>
                        <input 
                          type="number" 
                          min={1} 
                          value={form.reminderDaysBefore} 
                          onChange={e => set('reminderDaysBefore', e.target.value)}
                          className="w-16 p-1.5 text-center text-xs bg-white dark:bg-gray-800 border rounded"
                        />
                        <span className="text-xs text-gray-500">days before target date</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Section>

            {/* Section 3: Assignment */}
            <Section id="sec-assignment" title="3. Assignment" icon={Users}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <Field label="Project Manager" required error={errors.projectManagerId}>
                  <UserSelect 
                    businessId={businessId as string} 
                    value={form.projectManagerId} 
                    onChange={(v: string) => set('projectManagerId', v)} 
                    placeholder={!form.projectId ? "Select project first..." : (loadingOptions ? "Loading linked team..." : "Select Project Manager...")}
                    allowedUserIds={form.projectId ? (formOptions.linkedUserIds && formOptions.linkedUserIds.length > 0 ? formOptions.linkedUserIds : ['__NONE__']) : []}
                    customUsers={formOptions.linkedUsers && formOptions.linkedUsers.length > 0 ? formOptions.linkedUsers : undefined}
                    disabled={!form.projectId || loadingOptions}
                    emptyMessage={!form.projectId ? "Please select a project first." : "No team members or managers assigned to this project or planning."}
                  />
                  {form.projectManagerId && formOptions.linkedUsers && (
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      <span>
                        Role: {formOptions.linkedUsers.find(u => u.id === form.projectManagerId)?.badge || 'Project Team Member'}
                      </span>
                    </div>
                  )}
                </Field>

                <Field label="Milestone Owner">
                  <UserSelect 
                    businessId={businessId as string} 
                    value={form.ownerId} 
                    onChange={(v: string) => set('ownerId', v)} 
                    placeholder={!form.projectId ? "Select project first..." : "Select Milestone Owner..."}
                    allowedUserIds={form.projectId && formOptions.linkedUserIds && formOptions.linkedUserIds.length > 0 ? formOptions.linkedUserIds : undefined}
                    customUsers={formOptions.linkedUsers && formOptions.linkedUsers.length > 0 ? formOptions.linkedUsers : undefined}
                    disabled={!form.projectId || loadingOptions}
                    emptyMessage={!form.projectId ? "Please select a project first." : "No team members found."}
                  />
                </Field>

                <Field label="Approver">
                  <UserSelect 
                    businessId={businessId as string} 
                    value={form.approverId} 
                    onChange={(v: string) => set('approverId', v)} 
                    placeholder="Select Approver..." 
                  />
                </Field>

                <Field label="Department">
                  <Select value={form.department} onChange={(v: string) => set('department', v)}>
                    <option value="">Select Department...</option>
                    {formOptions.departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </Select>
                </Field>
              </div>
            </Section>

            {/* Section 4: Commercial */}
            <Section id="sec-commercial" title="4. Commercial & Billing" icon={DollarSign}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-3 flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={form.isBilling} 
                      onChange={e => set('isBilling', e.target.checked)} 
                      className="w-4 h-4 text-blue-600 rounded" 
                    />
                    <span className="text-sm font-bold text-gray-900 dark:text-white">This is a Billing Milestone</span>
                  </label>
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                    Remaining project weight capacity: <span className="font-bold underline">{formOptions.remainingPaymentWeight}%</span>
                  </span>
                </div>

                {form.isBilling && (
                  <>
                    <Field id="field-paymentWeight" label="Payment Weight (%)" required error={errors.paymentWeight}>
                      <Input 
                        type="number" 
                        value={form.paymentWeight} 
                        onChange={(v: string) => set('paymentWeight', Number(v))} 
                        min={0} 
                        max={100} 
                      />
                    </Field>
                    <Field label="Invoice Trigger">
                      <Select value={form.invoiceTrigger} onChange={(v: string) => set('invoiceTrigger', v)}>
                        <option value="ON_COMPLETION">On Milestone Completion</option>
                        <option value="MANUAL">Manual Trigger</option>
                        <option value="UPFRONT">Upfront Advance</option>
                      </Select>
                    </Field>
                  </>
                )}

                <Field label="Estimated Cost">
                  <Input 
                    type="number" 
                    value={form.estimatedCost} 
                    onChange={(v: string) => set('estimatedCost', Number(v))} 
                  />
                </Field>

                <Field label="Currency">
                  <Select value={form.currency} onChange={(v: string) => set('currency', v)}>
                    <option value="USD">USD ($)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="AED">AED (د.إ)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD ($)</option>
                  </Select>
                </Field>
              </div>
            </Section>

            {/* Section 5: Dynamic Deliverables & Acceptance Criteria */}
            <Section id="sec-deliverables" title={`5. ${formOptions.terminology['Deliverables'] || 'Deliverables'} & Checklist`} icon={FileText}>
              <div className="space-y-6">
                {/* Deliverables */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                      {formOptions.terminology['Deliverables'] || 'Deliverables'} Items
                    </h3>
                    <button 
                      type="button" 
                      onClick={() => addItem('DELIVERABLE')}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Deliverable
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {items.filter(it => it.kind === 'DELIVERABLE').map((it, idx) => {
                      const realIndex = items.indexOf(it);
                      return (
                        <div key={realIndex} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-100 dark:border-gray-800">
                          <input 
                            type="checkbox" 
                            checked={it.isDone} 
                            onChange={e => updateItem(realIndex, { isDone: e.target.checked })} 
                            className="w-4 h-4 text-blue-600 rounded" 
                          />
                          <input 
                            type="text" 
                            value={it.title} 
                            onChange={e => updateItem(realIndex, { title: e.target.value })} 
                            placeholder="e.g. System Architecture Diagram and Data Schema" 
                            className="flex-1 bg-transparent text-sm outline-none px-1"
                          />
                          <button 
                            type="button" 
                            onClick={() => removeItem(realIndex)} 
                            className="p-1 text-gray-400 hover:text-red-500 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Acceptance Criteria */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      {formOptions.terminology['Acceptance Criteria'] || 'Acceptance Criteria'}
                    </h3>
                    <button 
                      type="button" 
                      onClick={() => addItem('ACCEPTANCE_CRITERIA')}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Criteria
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {items.filter(it => it.kind === 'ACCEPTANCE_CRITERIA').map((it, idx) => {
                      const realIndex = items.indexOf(it);
                      return (
                        <div key={realIndex} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-100 dark:border-gray-800">
                          <input 
                            type="checkbox" 
                            checked={it.isDone} 
                            onChange={e => updateItem(realIndex, { isDone: e.target.checked })} 
                            className="w-4 h-4 text-emerald-600 rounded" 
                          />
                          <input 
                            type="text" 
                            value={it.title} 
                            onChange={e => updateItem(realIndex, { title: e.target.value })} 
                            placeholder="e.g. 100% test coverage and client stakeholder sign-off" 
                            className="flex-1 bg-transparent text-sm outline-none px-1"
                          />
                          <button 
                            type="button" 
                            onClick={() => removeItem(realIndex)} 
                            className="p-1 text-gray-400 hover:text-red-500 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Attachments Section */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-blue-500" />
                      Attachments
                    </h3>
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      <Plus className="w-3.5 h-3.5" /> Upload File
                    </button>
                    <input 
                      ref={fileInputRef} 
                      type="file" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                  </div>

                  {attachments.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {attachments.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg text-xs">
                          <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{doc.name}</span>
                          <span className="text-[10px] text-gray-400">{doc.extension || 'file'}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">No attachments uploaded yet.</p>
                  )}
                </div>
              </div>
            </Section>

            {/* Section 6: Progress & Risk */}
            <Section id="sec-progress" title="6. Progress & Risk Mitigation" icon={Activity}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <Field label="Progress (Automatically computed from linked tasks and checklist items)">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-1">
                      <span>Initial Progress</span>
                      <span>0%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-0 transition-all duration-300" />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1.5">Progress rolls up automatically as tasks and deliverables are marked complete.</p>
                  </Field>
                </div>

                <Field id="field-riskLevel" label="Risk Level">
                  <Select value={form.riskLevel} onChange={(v: string) => set('riskLevel', v)}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </Select>
                </Field>

                <Field id="field-status" label="Status">
                  <Select value={form.status} onChange={(v: string) => set('status', v)}>
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="DRAFT">Draft</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="AT_RISK">At Risk</option>
                    <option value="DELAYED">Delayed</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </Select>
                </Field>

                <div className="md:col-span-2">
                  <Field 
                    id="field-riskMitigation" 
                    label="Risk Mitigation Strategy" 
                    required={['MEDIUM', 'HIGH', 'CRITICAL'].includes(form.riskLevel.toUpperCase())}
                    error={errors.riskMitigation}
                  >
                    <textarea 
                      value={form.riskMitigation} 
                      onChange={e => set('riskMitigation', e.target.value)} 
                      rows={2} 
                      placeholder={['MEDIUM', 'HIGH', 'CRITICAL'].includes(form.riskLevel.toUpperCase()) ? "Required: Specify contingency steps to mitigate this risk..." : "Optional risk contingency notes..."}
                      className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 resize-y transition-all" 
                    />
                  </Field>
                </div>

                <div className="md:col-span-2">
                  <Field label="Completion Notes">
                    <textarea 
                      value={form.completionNotes} 
                      onChange={e => set('completionNotes', e.target.value)} 
                      rows={2} 
                      placeholder="Stakeholder comments upon handover or sign-off..."
                      className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 resize-y transition-all" 
                    />
                  </Field>
                </div>
              </div>
            </Section>
          </div>

          {/* Sticky Summary Panel */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="sticky top-24">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
                <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
                  <span className="font-bold text-sm">Milestone Summary</span>
                  <span className="text-[11px] font-black text-blue-300 bg-blue-900/60 px-2 py-0.5 rounded-full">
                    {form.milestoneCode}
                  </span>
                </div>
                <div className="p-4 space-y-3.5 text-sm divide-y divide-gray-100 dark:divide-gray-800">
                  {[
                    { label: 'Project', val: selProj?.projectName || '—' },
                    { label: 'Priority', val: form.priority },
                    { label: 'Status', val: form.status.replace('_', ' ') },
                    { label: 'Target Date', val: form.targetDate || '—' },
                    { label: 'Duration', val: computedDuration !== null ? `${computedDuration}d` : '—' },
                    { label: 'Billing Type', val: form.isBilling ? 'Commercial' : 'Internal Gate' },
                    { label: 'Pay. Weight', val: form.isBilling ? `${form.paymentWeight}%` : '0%' },
                    { label: 'Est. Cost', val: form.estimatedCost ? `${form.currency} ${Number(form.estimatedCost).toLocaleString()}` : '—' },
                    { label: 'Deliverables', val: `${items.filter(it => it.title.trim()).length} Items` },
                    { label: 'Progress', val: '0%' },
                  ].map((r, i) => (
                    <div key={i} className="flex justify-between items-center pt-3 first:pt-0">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{r.label}</span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white text-right max-w-[150px] truncate">{r.val}</span>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 space-y-2">
                  <button 
                    type="button"
                    onClick={() => handleSubmit(false)} 
                    disabled={saving}
                    className="w-full py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Save Draft
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleSubmit(true)} 
                    disabled={saving}
                    className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" /> Create Milestone
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
