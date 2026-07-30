import { toast } from 'sonner';
import React, { useState, useEffect, use, useMemo } from 'react';
import {  Link , useParams } from 'react-router-dom';
import {  useNavigate  } from 'react-router-dom';
import { 
  ArrowLeft, Save, ChevronDown, CheckCircle, Info, FileText, User, 
  Target, Calendar, DollarSign, Users, ShieldCheck, Briefcase, 
  Layout, Activity, Clock, Plus, Trash2, Mail
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { usersAPI } from '@/lib/api/users';
import { projectOperationsAPI, Resource } from '@/lib/api/project-operations';

// ------------------------------------------------------------------
// REUSABLE COMPONENTS (Matching Project Operations Standard)
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

export default function CreateAllocationPage() {
  const routerParams = useParams() as any;
  const { businessId } = routerParams;

  
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);

  const [businessUsers, setBusinessUsers] = useState<any[]>([]);

  const allocationCode = useMemo(() => 'ALC-' + Math.floor(10000 + Math.random() * 90000), []);

  const [formData, setFormData] = useState({
    projectId: '',
    taskId: '',
    employeeId: '',
    department: '',
    role: '',
    priority: '',
    allocationType: '',
    notes: '',

    startDate: '',
    endDate: '',
    estimatedHours: '',
    allocationPercent: '',
    workingDays: '',
    weeklyHours: '',

    skills: '',
    responsibilities: '',
    primaryRole: '',
    secondaryRole: '',
    experienceLevel: '',

    hourlyRate: '',
    estimatedCost: '',
    currency: '',
    billable: true,
    nonBillable: false,

    notifyEmployee: true,
    notifyPM: true,
    notifyDeptHead: false,
    sendEmail: true,
    createCalendarEvent: true,
  });

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    general: true, schedule: true, workload: true, skills: false, costing: false, notifications: false
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
      const [projRes, resRes, usersRes] = await Promise.all([
        projectOperationsAPI.getProjects(businessId),
        projectOperationsAPI.getResources(businessId),
        usersAPI.getBusinessUsers(businessId)
      ]);
      
      // Load projects directly from API response
      if (projRes.success) {
        setProjects(projRes.projects || []);
      } else if (Array.isArray(projRes)) {
        setProjects(projRes);
      } else if (projRes.data) {
        setProjects(projRes.data);
      }

      // Load resources for stats
      if (resRes.success) setResources(resRes.resources || []);
      
      // Load all business users for the dropdown
      if (usersRes.success || Array.isArray(usersRes.data) || Array.isArray(usersRes.users)) {
        setBusinessUsers(usersRes.users || usersRes.data || (Array.isArray(usersRes) ? usersRes : []));
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load form data.",
        variant: "destructive"
      });
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProjectChange = async (val: string) => {
    handleChange('projectId', val);
    handleChange('taskId', '');
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

  const handleEmployeeChange = (val: string) => {
    const user = businessUsers.find(u => u.id === val || u.user?.id === val);
    const resourceStat = resources.find(r => r.id === val);
    setFormData(prev => ({
      ...prev,
      employeeId: val,
      department: resourceStat?.department || user?.department || prev.department,
      role: prev.role || resourceStat?.role || user?.role?.name || ''
    }));
  };

  // Auto-calculate Estimated Cost when hours or rate changes
  useEffect(() => {
    const hours = parseFloat(formData.estimatedHours) || 0;
    const rate = parseFloat(formData.hourlyRate) || 0;
    setFormData(prev => ({ ...prev, estimatedCost: (hours * rate).toString() }));
  }, [formData.estimatedHours, formData.hourlyRate]);

  const selectedEmployeeStat = resources.find(r => r.id === formData.employeeId);
  const selectedUser = businessUsers.find(u => (u.user?.id || u.id) === formData.employeeId);
  
  const selectedEmployee = selectedEmployeeStat || (selectedUser ? {
    id: formData.employeeId,
    name: selectedUser.user?.name || selectedUser.name || 'Unknown',
    availability: 'Available',
    utilization: 0,
    projects: 0,
    currentWorkload: 0
  } : null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.projectId || !formData.employeeId || !formData.startDate || !formData.endDate) {
      toast({ title: "Validation Error", description: "Project, Employee, Start Date, and End Date are required.", variant: "destructive" });
      return;
    }
    
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast({ title: "Validation Error", description: "End Date cannot be before Start Date.", variant: "destructive" });
      return;
    }

    if (parseFloat(formData.allocationPercent) > 100) {
      toast({ title: "Validation Error", description: "Allocation cannot exceed 100%.", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await projectOperationsAPI.allocateResource(businessId, {
        projectId: formData.projectId,
        taskId: formData.taskId || undefined,
        employeeId: formData.employeeId,
        department: formData.department,
        role: formData.role,
        startDate: formData.startDate,
        endDate: formData.endDate,
        estimatedHours: parseFloat(formData.estimatedHours || '0'),
        allocationPercent: parseFloat(formData.allocationPercent || '100'),
        priority: formData.priority,
        notes: formData.notes
      });

      if (res.success) {
        toast({ title: "Success", description: "Resource allocated successfully." });
        navigate(`/dashboard/${businessId}/project-operations/projects/${formData.projectId}`);
        navigate(0);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to allocate resource", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 overflow-hidden">
      
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
                <span>Resources</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                Allocate Resource
                <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full uppercase tracking-widest">{allocationCode}</span>
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
                <><CheckCircle className="w-4 h-4" /> Save Allocation</>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
          
          {/* Main Form Content (75%) */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            
            <SectionCard id="general" title="General Information" icon={Info} isExpanded={expandedSections.general} onToggle={toggleSection}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <SelectField 
                    label={fetching ? "Loading Project..." : "Project"}
                    value={formData.projectId} 
                    onChange={handleProjectChange}
                    options={projects.map(p => ({ value: p.id, label: `${p.projectCode} - ${p.projectName}` }))}
                    icon={Layout}
                    required
                    disabled={fetching}
                  />
                </div>
                <SelectField 
                  label="Task" 
                  value={formData.taskId} 
                  onChange={(val: any) => handleChange('taskId', val)}
                  options={tasks.map(t => ({ value: t.id, label: `${t.taskNumber} - ${t.title}` }))}
                  disabled={!formData.projectId}
                />
                <div className="lg:col-span-2">
                  <SelectField 
                    label={fetching ? "Loading Employee..." : "Employee"}
                    value={formData.employeeId} 
                    onChange={handleEmployeeChange}
                    options={businessUsers.map(u => ({ value: u.user?.id || u.id, label: `${u.user?.name || u.name || 'Unknown User'} ${u.user?.email ? `(${u.user.email})` : ''}` }))}
                    icon={User}
                    required
                    disabled={fetching}
                  />
                </div>
                <InputField label="Department" value={formData.department} onChange={(val: any) => handleChange('department', val)} />
                <SelectField 
                  label="Role in Project" 
                  value={formData.role} 
                  onChange={(val: any) => handleChange('role', val)}
                  options={['Project Manager', 'Business Analyst', 'Technical Lead', 'Developer', 'QA Engineer', 'Designer', 'Consultant']}
                  required
                />
                <SelectField 
                  label="Priority" 
                  value={formData.priority} 
                  onChange={(val: any) => handleChange('priority', val)}
                  options={['Low', 'Normal', 'High', 'Critical']}
                />
                <SelectField 
                  label="Allocation Type" 
                  value={formData.allocationType} 
                  onChange={(val: any) => handleChange('allocationType', val)}
                  options={['Full Time', 'Part Time', 'Shared', 'Temporary']}
                />
                <div className="md:col-span-2 lg:col-span-3">
                  <InputField label="Notes" value={formData.notes} onChange={(val: any) => handleChange('notes', val)} multiline rows={3} placeholder="Any special instructions or constraints..." />
                </div>
              </div>
            </SectionCard>

            <SectionCard id="schedule" title="Schedule & Effort" icon={Calendar} isExpanded={expandedSections.schedule} onToggle={toggleSection}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InputField label="Start Date" type="date" value={formData.startDate} onChange={(val: any) => handleChange('startDate', val)} required />
                <InputField label="End Date" type="date" value={formData.endDate} onChange={(val: any) => handleChange('endDate', val)} required />
                <InputField label="Estimated Hours" type="number" value={formData.estimatedHours} onChange={(val: any) => handleChange('estimatedHours', val)} suffix="hrs" />
                <InputField label="Allocation %" type="number" value={formData.allocationPercent} onChange={(val: any) => handleChange('allocationPercent', val)} suffix="%" />
                <InputField label="Working Days" type="number" value={formData.workingDays} onChange={(val: any) => handleChange('workingDays', val)} />
                <InputField label="Weekly Hours" type="number" value={formData.weeklyHours} onChange={(val: any) => handleChange('weeklyHours', val)} suffix="hrs" />
              </div>
            </SectionCard>

            <SectionCard id="workload" title="Current Workload (Auto-Calculated)" icon={Activity} isExpanded={expandedSections.workload} onToggle={toggleSection}>
              {selectedEmployee ? (
                <div className="bg-gray-50 dark:bg-gray-800/30 p-6 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="text-center md:text-left">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Status</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        selectedEmployee.availability === 'Overallocated' ? 'bg-red-100 text-red-700' :
                        selectedEmployee.availability === 'Underutilized' ? 'bg-orange-100 text-orange-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {selectedEmployee.availability}
                      </span>
                    </div>
                    <div className="flex-1 w-full max-w-md">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Utilization %</span>
                        <span className="text-lg font-black text-gray-900 dark:text-white">{selectedEmployee.utilization}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${selectedEmployee.utilization > 100 ? 'bg-red-500' : selectedEmployee.utilization < 40 ? 'bg-orange-500' : 'bg-green-500'}`} 
                          style={{ width: `${Math.min(selectedEmployee.utilization, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center md:text-left">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Current Projects</p>
                      <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{selectedEmployee.projects}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Current Tasks</p>
                      <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">-</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Allocated Hrs</p>
                      <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{selectedEmployee.currentWorkload}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Available Hrs</p>
                      <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">160</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Select an employee to view their current workload.</p>
                </div>
              )}
            </SectionCard>

            <SectionCard id="skills" title="Skills & Responsibilities" icon={Target} isExpanded={expandedSections.skills} onToggle={toggleSection}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InputField label="Primary Role" value={formData.primaryRole} onChange={(val: any) => handleChange('primaryRole', val)} />
                <InputField label="Secondary Role" value={formData.secondaryRole} onChange={(val: any) => handleChange('secondaryRole', val)} />
                <SelectField label="Experience Level" value={formData.experienceLevel} onChange={(val: any) => handleChange('experienceLevel', val)} options={['Entry-Level', 'Junior', 'Mid-Level', 'Senior', 'Lead', 'Expert']} />
                <div className="md:col-span-2 lg:col-span-3">
                  <InputField label="Skills Required" value={formData.skills} onChange={(val: any) => handleChange('skills', val)} multiline rows={2} placeholder="e.g. React, Node.js, Project Management" />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <InputField label="Responsibilities" value={formData.responsibilities} onChange={(val: any) => handleChange('responsibilities', val)} multiline rows={3} placeholder="Describe the main responsibilities..." />
                </div>
              </div>
            </SectionCard>

            <SectionCard id="costing" title="Costing & Billing" icon={DollarSign} isExpanded={expandedSections.costing} onToggle={toggleSection}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InputField label="Hourly Rate" type="number" value={formData.hourlyRate} onChange={(val: any) => handleChange('hourlyRate', val)} prefix="$" />
                <InputField label="Estimated Cost" type="number" value={formData.estimatedCost} onChange={(val: any) => handleChange('estimatedCost', val)} prefix="$" readOnly />
                <SelectField label="Currency" value={formData.currency} onChange={(val: any) => handleChange('currency', val)} options={['USD', 'EUR', 'GBP', 'INR', 'AED']} />
                <div className="lg:col-span-3 flex gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.billable} onChange={(e) => handleChange('billable', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Billable to Client</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.nonBillable} onChange={(e) => handleChange('nonBillable', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Non-Billable Internal</span>
                  </label>
                </div>
              </div>
            </SectionCard>

            <SectionCard id="notifications" title="Notifications" icon={Mail} isExpanded={expandedSections.notifications} onToggle={toggleSection}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <input type="checkbox" checked={formData.notifyEmployee} onChange={(e) => handleChange('notifyEmployee', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Notify Employee</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <input type="checkbox" checked={formData.notifyPM} onChange={(e) => handleChange('notifyPM', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Notify Project Manager</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <input type="checkbox" checked={formData.notifyDeptHead} onChange={(e) => handleChange('notifyDeptHead', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Notify Department Head</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <input type="checkbox" checked={formData.sendEmail} onChange={(e) => handleChange('sendEmail', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Send Email Notification</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <input type="checkbox" checked={formData.createCalendarEvent} onChange={(e) => handleChange('createCalendarEvent', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Create Calendar Event</span>
                </label>
              </div>
            </SectionCard>

          </div>

          {/* Sticky Summary Panel (25%) */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="sticky top-6 flex flex-col gap-4">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
                <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
                  <h3 className="font-bold">Allocation Summary</h3>
                  <Layout className="w-4 h-4 text-gray-400" />
                </div>
                <div className="p-5 flex flex-col gap-4">
                  <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">Code</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white text-right max-w-[150px] truncate">{allocationCode}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">Project</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white text-right max-w-[150px] truncate">
                      {projects.find(p => p.id === formData.projectId)?.projectName || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">Employee</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white text-right max-w-[150px] truncate">
                      {selectedEmployee?.name || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">Role</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white text-right max-w-[150px] truncate">
                      {formData.role || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">Duration</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white text-right max-w-[150px] truncate">
                      {formData.startDate && formData.endDate ? `${formData.startDate} to ${formData.endDate}` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">Effort</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white text-right max-w-[150px] truncate">
                      {formData.estimatedHours} hrs ({formData.allocationPercent}%)
                    </span>
                  </div>
                  <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">Cost</span>
                    <span className="text-sm font-bold text-green-600 text-right max-w-[150px] truncate">
                      {formData.currency} {Number(formData.estimatedCost).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-end pt-1">
                    <span className="text-xs font-bold text-gray-500 uppercase">Priority</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      formData.priority === 'High' || formData.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                      formData.priority === 'Normal' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {formData.priority}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 p-4">
                <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4"/> Next Automations
                </h4>
                <ul className="space-y-2">
                  {['Update employee utilization', 'Add to project team', 'Update resource dashboards', 'Trigger notifications'].map((task, i) => (
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
