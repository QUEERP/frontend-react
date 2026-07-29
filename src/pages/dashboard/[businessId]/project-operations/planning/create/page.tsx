import { toast } from 'sonner';
import React, { useState, useEffect, use } from 'react';
import { Link } from 'react-router-dom';
import {  useNavigate  } from 'react-router-dom';
import { 
  ArrowLeft, Save, ChevronDown, CheckCircle, Info, FileText, User, 
  Target, Calendar, DollarSign, Users, AlertTriangle, 
  Paperclip, Briefcase, Layout, Clock, Play
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { UserSelect } from "@/components/project-operations/UserSelect";

// REUSABLE COMPONENTS
const InputField = ({ label, type = "text", value, onChange, placeholder, required = false, prefix, suffix, multiline = false, rows = 3 }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative flex items-center">
      {prefix && <div className="absolute left-3 text-gray-500">{prefix}</div>}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all outline-none resize-y`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all outline-none ${prefix ? 'pl-9' : ''} ${suffix ? 'pr-9' : ''}`}
        />
      )}
      {suffix && <div className="absolute right-3 text-gray-500">{suffix}</div>}
    </div>
  </div>
);

const SelectField = ({ label, value, onChange, options, required = false, icon: Icon }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative flex items-center">
      {Icon && <div className="absolute left-3 text-gray-500"><Icon className="w-4 h-4"/></div>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all outline-none cursor-pointer appearance-none ${Icon ? 'pl-9' : ''}`}
      >
        <option value="" disabled>Select {label}...</option>
        {options.map((opt: any, i: number) => (
          <option key={i} value={opt.value || opt}>{opt.label || opt}</option>
        ))}
      </select>
      <div className="absolute right-3 pointer-events-none text-gray-500">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  </div>
);

const SectionCard = ({ title, icon: Icon, children, defaultOpen = true }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden mb-6 transition-all duration-200">
      <div 
        className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-500 rounded-lg">
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div className="p-6 animate-in fade-in slide-in-from-top-4 duration-300">
          {children}
        </div>
      )}
    </div>
  );
};

export default function CreatePlanningPage() {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter(f => f.size <= 50 * 1024 * 1024);
    const oversized = Array.from(files).filter(f => f.size > 50 * 1024 * 1024);
    if (oversized.length > 0) {
      toast({ title: 'File too large', description: `${oversized.length} file(s) exceed 50MB limit and were skipped.`, variant: 'destructive' });
    }
    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (idx: number) => setAttachedFiles(prev => prev.filter((_, i) => i !== idx));

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type === 'application/pdf') return '📄';
    if (file.type.includes('word')) return '📝';
    if (file.type.includes('excel') || file.type.includes('spreadsheet')) return '📊';
    if (file.type.includes('zip') || file.type.includes('rar')) return '🗜️';
    return '📎';
  };

  const [formData, setFormData] = useState({
    projectId: '',
    planCode: 'PLN-' + Math.floor(10000 + Math.random() * 90000),
    planName: '',
    phase: '',
    sprint: '',
    execType: '',
    status: '',
    priority: '',
    description: '',

    startDate: '',
    endDate: '',
    duration: '',
    workingDays: '',
    milestone: '',
    dependency: '',
    expectedCompletion: '',

    projectManager: '',
    department: '',
    taskOwner: '',
    resources: '',
    estimatedHours: '',
    billableHours: '',
    resourceCost: '',

    taskTitle: '',
    subTask: '',
    sequence: '',
    criticalTask: false,
    recurring: false,
    reminder: '',

    initialProgress: '',
    currentProgress: '',
    progressStatus: '',
    riskLevel: '',
    completionPercentage: '',

    estimatedCost: '',
    actualCost: '',
    variance: '',
    currency: '',

    comments: '',
    privateNotes: '',
    approvals: ''
  });

  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/$/, '');
        let token = localStorage.getItem('token');
        if (!token || token === 'null' || token === 'undefined') {
          token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || 
                  document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1] || '';
        }
        const headers = { 'Authorization': `Bearer ${token}`, 'x-business-id': businessId };

        fetch(`${API_BASE}/api/business`, { headers })
          .then(res => res.json())
          .then(data => {
             const business = data.data || data.business;
             if (business && business.country) {
               const c = business.country.toLowerCase();
               if (c.includes('india') || c === 'in') setFormData(prev => ({ ...prev, currency: 'INR' }));
               else if (c.includes('uae') || c.includes('united arab emirates') || c === 'ae') setFormData(prev => ({ ...prev, currency: 'AED' }));
               else setFormData(prev => ({ ...prev, currency: 'USD' }));
             }
          }).catch(console.error);

        const [projRes, userRes, empRes] = await Promise.all([
          fetch(`${API_BASE}/api/projects`, { headers }),
          fetch(`${API_BASE}/api/user-management`, { headers }),
          fetch(`${API_BASE}/api/employees`, { headers })
        ]);

        const [projData, userData, empData] = await Promise.all([projRes.json(), userRes.json(), empRes.json()]);
        setProjects(projData.data || projData.projects || []);
        setUsers(userData.data || userData.users || []);
        setEmployees(empData.data || empData.employees || []);
      } catch (err) {
        console.error("Failed to load dependency data:", err);
      }
    };
    loadAllData();
  }, [businessId]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      
      // Auto-load project info
      if (field === 'projectId' && value) {
        const p = projects.find(x => x.id === value || x._id === value);
        if (p) {
          next.projectManager = p.projectManagerId || '';
          next.department = p.department || 'Engineering';
          if (p.startDate) next.startDate = new Date(p.startDate).toISOString().split('T')[0];
          if (p.endDate) next.endDate = new Date(p.endDate).toISOString().split('T')[0];
          next.execType = p.executionType || 'Service';
          next.estimatedCost = p.budget || 0;
        }
      }
      return next;
    });
  };

  const handleSubmit = async (publish: boolean) => {
    if (!formData.projectId || !formData.planName || !formData.startDate) {
      toast({ title: "Validation Error", description: "Project, Plan Name, and Start Date are required.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/$/, '');
      let token = localStorage.getItem('token');
      if (!token || token === 'null' || token === 'undefined') {
        token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || 
                document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1] || '';
      }
      
      const payload = {
        projectId: formData.projectId,
        planName: formData.planName,
        phase: formData.phase || undefined,
        sprint: formData.sprint || undefined,
        execType: formData.execType || undefined,
        status: publish ? (formData.status || 'ACTIVE') : 'DRAFT',
        priority: formData.priority || undefined,
        description: formData.description || undefined,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        expectedCompletion: formData.expectedCompletion ? new Date(formData.expectedCompletion).toISOString() : undefined,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        workingDays: formData.workingDays ? parseInt(formData.workingDays) : undefined,
        milestone: formData.milestone || undefined,
        dependency: formData.dependency || undefined,
        projectManagerId: formData.projectManager || undefined,
        taskOwnerId: formData.taskOwner || undefined,
        department: formData.department || undefined,
        resources: formData.resources ? parseInt(formData.resources) : undefined,
        estimatedHours: parseFloat(formData.estimatedHours) || 0,
        billableHours: parseFloat(formData.billableHours) || 0,
        resourceCost: parseFloat(formData.resourceCost) || 0,
        taskTitle: formData.taskTitle || undefined,
        subTask: formData.subTask || undefined,
        sequence: formData.sequence ? parseInt(formData.sequence) : undefined,
        criticalTask: formData.criticalTask,
        recurring: formData.recurring,
        reminder: formData.reminder ? parseInt(formData.reminder) : undefined,
        initialProgress: parseFloat(formData.initialProgress) || 0,
        currentProgress: parseFloat(formData.currentProgress) || 0,
        completionPercentage: parseFloat(formData.completionPercentage) || 0,
        progressStatus: formData.progressStatus || undefined,
        riskLevel: formData.riskLevel || undefined,
        estimatedCost: parseFloat(formData.estimatedCost) || 0,
        actualCost: parseFloat(formData.actualCost) || 0,
        variance: parseFloat(formData.variance) || 0,
        currency: formData.currency || undefined,
        comments: formData.comments || undefined,
        privateNotes: formData.privateNotes || undefined,
        approvals: formData.approvals || undefined,
      };
      
      const res = await fetch(`${API_BASE}/api/projects/global/plannings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-business-id': businessId
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save planning schedule.");
      }
      
      toast({ title: "Success", description: `Planning Schedule ${publish ? 'Published' : 'Saved as Draft'} Successfully.` });
      navigate(-1);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };


  const selProj = projects.find(p => p.id === formData.projectId || p._id === formData.projectId);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Header */}
      <div className="flex-none px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                <span>Project Operations</span>
                <span>/</span>
                <span>Execution</span>
                <span>/</span>
                <span>Planning</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                Create Master Schedule
                <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full uppercase tracking-widest">{formData.planCode}</span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">Create project planning schedule, milestones, dependencies, and resource allocation.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 shadow-sm">
              Cancel
            </button>
            <button disabled={isSubmitting} onClick={() => handleSubmit(false)} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-sm">
              Save Draft
            </button>
            <button 
              onClick={() => handleSubmit(true)} 
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
            >
              {isSubmitting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Saving...</>
              ) : (
                <><CheckCircle className="w-4 h-4" /> Publish Schedule</>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
          
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            
            <SectionCard title="1. General Information" icon={Briefcase}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      Project <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <select
                        value={formData.projectId}
                        onChange={(e) => handleChange('projectId', e.target.value)}
                        className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 transition-all outline-none cursor-pointer appearance-none"
                      >
                        <option value="">Select Project...</option>
                        {projects.map((p: any) => (
                          <option key={p.id || p._id} value={p.id || p._id}>
                            {p.projectCode} - {p.projectName}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 pointer-events-none text-gray-500"><ChevronDown className="w-4 h-4" /></div>
                    </div>
                  </div>
                </div>
                
                <InputField label="Planning Name" value={formData.planName} onChange={(val: any) => handleChange('planName', val)} required />
                <InputField label="Phase" value={formData.phase} onChange={(val: any) => handleChange('phase', val)} />
                <InputField label="Sprint / Iteration" value={formData.sprint} onChange={(val: any) => handleChange('sprint', val)} />
                
                <SelectField label="Execution Type" value={formData.execType} onChange={(val: any) => handleChange('execType', val)} options={['Service', 'Product', 'Hybrid']} />
                <SelectField label="Status" value={formData.status} onChange={(val: any) => handleChange('status', val)} options={['DRAFT', 'PLANNING', 'ACTIVE', 'ON_HOLD']} />
                <SelectField label="Priority" value={formData.priority} onChange={(val: any) => handleChange('priority', val)} options={['Low', 'Medium', 'High', 'Critical']} />
                
                <div className="lg:col-span-3">
                  <InputField label="Description" value={formData.description} onChange={(val: any) => handleChange('description', val)} multiline rows={3} />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="2. Timeline" icon={Calendar}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InputField label="Start Date" type="date" value={formData.startDate} onChange={(val: any) => handleChange('startDate', val)} required />
                <InputField label="End Date" type="date" value={formData.endDate} onChange={(val: any) => handleChange('endDate', val)} required />
                <InputField label="Expected Completion" type="date" value={formData.expectedCompletion} onChange={(val: any) => handleChange('expectedCompletion', val)} />
                
                <InputField label="Duration (Days)" type="number" value={formData.duration} onChange={(val: any) => handleChange('duration', val)} />
                <InputField label="Working Days" type="number" value={formData.workingDays} onChange={(val: any) => handleChange('workingDays', val)} />
                
                <InputField label="Milestone" value={formData.milestone} onChange={(val: any) => handleChange('milestone', val)} />
                <InputField label="Dependency (Task Code)" value={formData.dependency} onChange={(val: any) => handleChange('dependency', val)} />
              </div>
            </SectionCard>

            <SectionCard title="3. Resource Allocation" icon={Users}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Project Manager</label>
                  <div className="relative flex items-center">
                    <UserSelect businessId={businessId} value={formData.projectManager} onChange={(v) => handleChange('projectManager', v)} placeholder="Select Manager..." />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Task Owner</label>
                  <div className="relative flex items-center">
                    <UserSelect businessId={businessId} value={formData.taskOwner} onChange={(v) => handleChange('taskOwner', v)} placeholder="Select Owner..." />
                  </div>
                </div>

                <SelectField label="Department" value={formData.department} onChange={(val: any) => handleChange('department', val)} options={['Engineering', 'Design', 'Marketing', 'Sales', 'Finance']} />
                
                <InputField label="Resources (Count)" type="number" value={formData.resources} onChange={(val: any) => handleChange('resources', val)} />
                <InputField label="Estimated Hours" type="number" value={formData.estimatedHours} onChange={(val: any) => handleChange('estimatedHours', val)} />
                <InputField label="Billable Hours" type="number" value={formData.billableHours} onChange={(val: any) => handleChange('billableHours', val)} />
                <InputField label="Resource Cost" type="number" prefix="$" value={formData.resourceCost} onChange={(val: any) => handleChange('resourceCost', val)} />
              </div>
            </SectionCard>

            <SectionCard title="4. Scheduling" icon={Clock}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                   <InputField label="Task" value={formData.taskTitle} onChange={(val: any) => handleChange('taskTitle', val)} required />
                </div>
                <InputField label="Sub Task" value={formData.subTask} onChange={(val: any) => handleChange('subTask', val)} />
                <InputField label="Sequence" type="number" value={formData.sequence} onChange={(val: any) => handleChange('sequence', val)} />
                <InputField label="Reminder (Days Before)" type="number" value={formData.reminder} onChange={(val: any) => handleChange('reminder', val)} />
                <div className="flex gap-4 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.criticalTask} onChange={(e) => handleChange('criticalTask', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Critical Task</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.recurring} onChange={(e) => handleChange('recurring', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recurring</span>
                  </label>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="5. Progress" icon={Target}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InputField label="Initial Progress %" type="number" value={formData.initialProgress} onChange={(val: any) => handleChange('initialProgress', val)} />
                <InputField label="Current Progress %" type="number" value={formData.currentProgress} onChange={(val: any) => handleChange('currentProgress', val)} />
                <InputField label="Completion %" type="number" value={formData.completionPercentage} onChange={(val: any) => handleChange('completionPercentage', val)} />
                <SelectField label="Status" value={formData.progressStatus} onChange={(val: any) => handleChange('progressStatus', val)} options={['On Track', 'At Risk', 'Delayed', 'Completed']} />
                <SelectField label="Risk Level" value={formData.riskLevel} onChange={(val: any) => handleChange('riskLevel', val)} options={['Low', 'Medium', 'High']} />
              </div>
            </SectionCard>

            <SectionCard title="6. Budget" icon={DollarSign}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <InputField label="Estimated Cost" type="number" prefix="$" value={formData.estimatedCost} onChange={(val: any) => handleChange('estimatedCost', val)} />
                <InputField label="Actual Cost" type="number" prefix="$" value={formData.actualCost} onChange={(val: any) => handleChange('actualCost', val)} />
                <InputField label="Variance" type="number" prefix="$" value={formData.variance} onChange={(val: any) => handleChange('variance', val)} />
                <SelectField label="Currency" value={formData.currency} onChange={(val: any) => handleChange('currency', val)} options={['USD', 'EUR', 'GBP', 'INR', 'AED']} />
              </div>
            </SectionCard>

            <SectionCard title="7. Attachments" icon={Paperclip}>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt,.csv,.dwg,.dxf"
                className="hidden"
                onChange={e => handleFileSelect(e.target.files)}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => { e.preventDefault(); setIsDragging(false); handleFileSelect(e.dataTransfer.files); }}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-gray-500 transition-all cursor-pointer select-none ${ isDragging ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-[1.01]' : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/20 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-gray-800/40'}`}
              >
                <div className={`p-4 rounded-full mb-3 transition-colors ${isDragging ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <FileText className={`w-8 h-8 ${isDragging ? 'text-blue-500' : 'text-blue-400'}`} />
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{isDragging ? 'Drop files here' : 'Click or drag files to upload'}</p>
                <p className="text-xs text-gray-400 mt-1 text-center">Supports PDF, Images, Word, Excel, ZIP and more · Max 50MB per file</p>
              </div>
              {attachedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{attachedFiles.length} file{attachedFiles.length > 1 ? 's' : ''} selected</p>
                  {attachedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg group hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                      <span className="text-xl">{getFileIcon(file)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{file.name}</p>
                        <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); removeFile(idx); }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="8. Internal Notes" icon={Info}>
              <div className="space-y-6">
                 <InputField label="Comments" value={formData.comments} onChange={(val: any) => handleChange('comments', val)} multiline rows={3} />
                 <InputField label="Private Notes" value={formData.privateNotes} onChange={(val: any) => handleChange('privateNotes', val)} multiline rows={3} />
                 <InputField label="Approvals Needed" value={formData.approvals} onChange={(val: any) => handleChange('approvals', val)} />
              </div>
            </SectionCard>

          </div>

          {/* Sticky Summary Panel */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="sticky top-6 flex flex-col gap-4">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
                <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
                  <h3 className="font-bold">Planning Summary</h3>
                  <Layout className="w-4 h-4 text-gray-400" />
                </div>
                <div className="p-5 flex flex-col gap-4">
                  
                  <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">Completion</span>
                    <span className="text-xl font-black text-blue-600">{formData.completionPercentage}%</span>
                  </div>
                  
                  <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">Project</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white text-right max-w-[150px] truncate">{selProj?.projectName || '-'}</span>
                  </div>

                  <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">Start Date</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{formData.startDate || '-'}</span>
                  </div>
                  
                  <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">End Date</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{formData.endDate || '-'}</span>
                  </div>

                  <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">Est. Cost</span>
                    <span className="text-sm font-black text-green-600">${Number(formData.estimatedCost).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">Status</span>
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[10px] font-black uppercase tracking-widest rounded-full">{formData.status}</span>
                  </div>
                  
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-2">
                  <button onClick={() => handleSubmit(false)} className="w-full py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Save Draft
                  </button>
                  <button onClick={() => handleSubmit(true)} className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                    <Play className="w-4 h-4" /> Publish Schedule
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
