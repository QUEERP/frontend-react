import { toast } from 'sonner';
import React, { useState, useEffect, use, useMemo } from 'react';
import {  Link , useParams } from 'react-router-dom';
import {  useNavigate  } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle, Info, User, 
  Target, Calendar, Clock, Layout, FileText, ChevronDown, Activity, Settings
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { usersAPI } from '@/lib/api/users';
import { projectOperationsAPI } from '@/lib/api/project-operations';

// ------------------------------------------------------------------
// REUSABLE COMPONENTS
// ------------------------------------------------------------------

const InputField = ({ label, type = "text", value, onChange, placeholder, required = false, prefix, suffix, multiline = false, rows = 3, readOnly = false, className = "" }: any) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
      {label} {required && !readOnly && <span className="text-red-500">*</span>}
    </label>
    <div className="relative flex items-center">
      {prefix && <div className="absolute left-3 text-gray-500 z-10">{prefix}</div>}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          readOnly={readOnly}
          className={`w-full p-2.5 border rounded-lg text-sm transition-all outline-none resize-y ${
            readOnly 
              ? 'bg-gray-100 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed font-medium'
              : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900'
          }`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full p-2.5 border rounded-lg text-sm transition-all outline-none ${prefix ? 'pl-9' : ''} ${suffix ? 'pr-9' : ''} ${
            readOnly 
              ? 'bg-gray-100 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed font-medium'
              : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900'
          }`}
        />
      )}
      {suffix && <div className="absolute right-3 text-gray-500">{suffix}</div>}
    </div>
  </div>
);

const SelectField = ({ label, value, onChange, options, required = false, icon: Icon, disabled = false, className = "" }: any) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative flex items-center">
      {Icon && <div className="absolute left-3 text-gray-500"><Icon className="w-4 h-4"/></div>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full p-2.5 border rounded-lg text-sm transition-all outline-none appearance-none ${Icon ? 'pl-9' : ''} ${
          disabled
            ? 'bg-gray-100 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed font-medium'
            : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 cursor-pointer'
        }`}
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

const SectionCard = ({ title, icon: Icon, children, isExpanded, onToggle, id }: any) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden mb-6 transition-all duration-200">
      <div 
        className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors select-none"
        onClick={() => onToggle(id)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-500 rounded-lg">
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">{title}</h3>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
      </div>
      <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------------------

export default function LogTimePage() {
  const routerParams = useParams() as any;
  const { businessId } = routerParams;

  
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [businessUsers, setBusinessUsers] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    employeeId: '',
    projectId: '',
    taskId: '',
    date: '',
    hours: '',
    overtime: '',
    billable: true,
    status: '',
    description: ''
  });

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    general: true, details: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    if (businessId) {
      fetchInitialData();
    }
  }, [businessId]);

  const fetchInitialData = async () => {
    try {
      setFetching(true);
      const [projRes, usersRes] = await Promise.all([
        projectOperationsAPI.getProjects(businessId).catch(() => ({})),
        usersAPI.getBusinessUsers(businessId).catch(() => ({}))
      ]);
      
      if (projRes.success) setProjects(projRes.projects || []);
      else if (Array.isArray(projRes)) setProjects(projRes);
      else if (projRes.data) setProjects(projRes.data);

      if (usersRes.success || Array.isArray(usersRes.data) || Array.isArray(usersRes.users)) {
        setBusinessUsers(usersRes.users || usersRes.data || (Array.isArray(usersRes) ? usersRes : []));
      }
      
      // Auto-set employee to logged in user if available
      const API = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/$/, '');
      const token = localStorage.getItem('token') || document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || '';
      const meRes = await fetch(`${API}/api/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null);
      if (meRes && meRes.ok) {
        const meData = await meRes.json();
        const meId = meData.user?.id;
        if (meId) {
          setFormData(prev => ({ ...prev, employeeId: meId }));
        }
      }
      
    } catch (err) {
      toast({ title: "Error", description: "Failed to load form data.", variant: "destructive" });
    } finally {
      setFetching(false);
    }
  };

  const handleProjectChange = async (val: string) => {
    setFormData(prev => ({ ...prev, projectId: val, taskId: '' }));
    if (val) {
      try {
        const tskRes = await projectOperationsAPI.getTasks(businessId, val);
        if (tskRes.success) setTasks(tskRes.tasks || []);
        else if (Array.isArray(tskRes)) setTasks(tskRes);
        else if (tskRes.data) setTasks(tskRes.data);
      } catch (err) {}
    } else {
      setTasks([]);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.projectId || !formData.employeeId || !formData.hours || parseFloat(formData.hours) <= 0) {
      toast({ title: "Validation Error", description: "Project, Employee, and valid Hours are required.", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        projectId: formData.projectId,
        taskId: formData.taskId || undefined,
        employeeId: formData.employeeId,
        businessUserId: formData.employeeId,
        date: formData.date,
        hours: parseFloat(formData.hours),
        overtime: parseFloat(formData.overtime || '0'),
        billable: formData.billable,
        status: formData.status,
        description: formData.description
      };

      const res = await projectOperationsAPI.createTimeEntry(businessId, payload);

      if (res.success || res.entry) {
        toast({ title: "Success", description: "Time logged successfully." });
        navigate(`/dashboard/${businessId}/project-operations/projects/${formData.projectId}`);
        navigate(0);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to log time", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };



  const selectedProject = projects.find(p => (p.id || p._id) === formData.projectId);
  const selectedTask = tasks.find(t => (t.id || t._id) === formData.taskId);
  const employeeUser = businessUsers.find(u => (u.user?.id || u.id) === formData.employeeId);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 overflow-hidden relative">
      
      {/* Header - Sticky */}
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
                <span>Timesheets</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                Log Time
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 shadow-sm">
              Cancel
            </button>
            <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-sm">
              Save Draft
            </button>
            <button 
              onClick={() => handleSubmit()} 
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Saving...</>
              ) : (
                <><CheckCircle className="w-4 h-4" /> Submit Log</>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin relative">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
          
          {/* Main Form Content (75%) */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            
            <SectionCard id="general" title="General Information" icon={Info} isExpanded={expandedSections.general} onToggle={toggleSection}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3">
                  <SelectField 
                    label={fetching ? "Loading Employee..." : "Employee"}
                    value={formData.employeeId} 
                    onChange={(val: any) => handleChange('employeeId', val)}
                    options={businessUsers.map(u => ({ value: u.user?.id || u.id, label: `${u.user?.name || u.name || 'Unknown User'} ${u.user?.email ? `(${u.user.email})` : ''}` }))}
                    icon={User}
                    required
                    disabled={fetching}
                  />
                </div>
                <div className="lg:col-span-2">
                  <SelectField 
                    label={fetching ? "Loading Project..." : "Project"}
                    value={formData.projectId} 
                    onChange={handleProjectChange}
                    options={projects.map(p => ({ value: p.id || p._id, label: `${p.projectCode ? p.projectCode + ' - ' : ''}${p.projectName}` }))}
                    icon={Layout}
                    required
                    disabled={fetching}
                  />
                </div>
                <SelectField 
                  label="Task (Optional)" 
                  value={formData.taskId} 
                  onChange={(val: any) => handleChange('taskId', val)}
                  options={tasks.map(t => ({ value: t.id || t._id, label: t.title }))}
                  disabled={!formData.projectId}
                />
                <InputField label="Date" type="date" value={formData.date} onChange={(val: any) => handleChange('date', val)} required />
                <InputField label="Regular Hours" type="number" value={formData.hours} onChange={(val: any) => handleChange('hours', val)} required suffix="hrs" />
                <InputField label="Overtime Hours" type="number" value={formData.overtime} onChange={(val: any) => handleChange('overtime', val)} suffix="hrs" />
                <div className="md:col-span-2 lg:col-span-3">
                  <InputField label="Description / Notes" value={formData.description} onChange={(val: any) => handleChange('description', val)} multiline rows={3} placeholder="What did you work on today?" />
                </div>
              </div>
            </SectionCard>

            <SectionCard id="details" title="Settings & Status" icon={Settings} isExpanded={expandedSections.details} onToggle={toggleSection}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3 pt-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={formData.billable} onChange={(e) => handleChange('billable', e.target.checked)} className="w-5 h-5 text-blue-600 rounded" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Billable to Client</span>
                  </label>
                </div>
                <SelectField 
                  label="Status" 
                  value={formData.status} 
                  onChange={(val: any) => handleChange('status', val)}
                  options={['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED']}
                />
              </div>
            </SectionCard>

          </div>

          {/* Sticky Summary Panel (25%) */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="sticky top-6 flex flex-col gap-4">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
                <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
                  <h3 className="font-bold">Time Summary</h3>
                  <Clock className="w-4 h-4 text-gray-400" />
                </div>
                <div className="p-5 flex flex-col gap-4">
                  <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">Employee</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white text-right max-w-[150px] truncate">
                      {employeeUser?.user?.name || employeeUser?.name || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">Project</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white text-right max-w-[150px] truncate">
                      {selectedProject?.projectName || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">Task</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white text-right max-w-[150px] truncate">
                      {selectedTask?.title || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">Date</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white text-right max-w-[150px] truncate">
                      {formData.date ? new Date(formData.date).toLocaleDateString() : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">Total Hours</span>
                    <span className="text-lg font-black text-blue-600 dark:text-blue-400 text-right max-w-[150px] truncate">
                      {parseFloat(formData.hours || '0') + parseFloat(formData.overtime || '0')} hrs
                    </span>
                  </div>
                  <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">Billable</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      formData.billable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {formData.billable ? 'YES' : 'NO'}
                    </span>
                  </div>
                  <div className="flex justify-between items-end pt-1">
                    <span className="text-xs font-bold text-gray-500 uppercase">Status</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      formData.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' :
                      formData.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      formData.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {formData.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 p-4">
                <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4"/> Next Automations
                </h4>
                <ul className="space-y-2">
                  {['Notify project manager', 'Update resource utilization', 'Log hours for billing'].map((task, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-blue-900/70 dark:text-blue-200/70">
                      <CheckCircle className="w-3.5 h-3.5 mt-0.5 text-blue-500 flex-shrink-0" />
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
