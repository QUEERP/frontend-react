import { toast } from 'sonner';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Save, ChevronDown, CheckCircle, Info, FileText, User,
  Target, Calendar, DollarSign, Users, AlertTriangle,
  Paperclip, Briefcase, Layout, Clock, Play, Search, X,
  Eye, Download, ExternalLink, Trash2
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { UserSelect } from "@/components/project-operations/UserSelect";
import { SearchableCurrencySelect } from "@/components/project-operations/SearchableCurrencySelect";
import { MultiTaskOwnerSelect, TaskOwnerOption } from "@/components/project-operations/MultiTaskOwnerSelect";
import { getCurrencySymbolFromCode } from "@/lib/constants/currencies";

// ------------------------------------------------------------------
// CONSTANTS
// ------------------------------------------------------------------

export const ALL_DEPARTMENTS = [
  "Engineering",
  "Software Development",
  "Product Management",
  "Operations & Delivery",
  "Quality Assurance & Testing (QA)",
  "UI/UX Design & Creative",
  "Consulting & Professional Services",
  "IT Infrastructure & DevOps",
  "Cybersecurity & Compliance",
  "Sales & Business Development",
  "Marketing & Communications",
  "Customer Success & Support",
  "Accounting & Finance",
  "Human Resources (HR)",
  "Legal & Procurement",
  "Research & Development (R&D)",
  "Administration & Facilities",
  "General Management",
  "Supply Chain & Logistics"
];

export const ALL_EXECUTION_TYPES = [
  {
    group: "Core Delivery Models",
    options: [
      { label: "Turnkey (End-to-End)", value: "Turnkey (End-to-End)" },
      { label: "Service", value: "Service" },
      { label: "Product", value: "Product" },
      { label: "Hybrid", value: "Hybrid" },
      { label: "Auto Detect", value: "Auto Detect" },
    ]
  },
  {
    group: "Contract & Billing Models",
    options: [
      { label: "Time & Materials (T&M)", value: "Time & Materials" },
      { label: "Fixed Price / Milestone", value: "Fixed Price / Milestone" },
      { label: "Retainer / Ongoing Support", value: "Retainer / Ongoing Support" },
      { label: "Milestone-Based", value: "Milestone-Based" },
    ]
  },
  {
    group: "Methodology & Resource Models",
    options: [
      { label: "Dedicated Team / Staff Augmentation", value: "Dedicated Team" },
      { label: "Agile / Sprint-Based", value: "Agile / Sprint-Based" },
      { label: "Waterfall", value: "Waterfall" },
      { label: "Build-Operate-Transfer (BOT)", value: "Build-Operate-Transfer (BOT)" },
    ]
  }
];

// ------------------------------------------------------------------
// REUSABLE COMPONENTS
// ------------------------------------------------------------------

const InputField = ({ label, type = "text", value, onChange, placeholder, required = false, prefix, suffix, multiline = false, rows = 3 }: any) => {
  const displayVal = (value === null || value === undefined) ? '' : value;
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-1 whitespace-nowrap min-h-[1.25rem]">
        <span>{label}</span>
        {required && <span className="text-red-500 font-bold inline-block leading-none">*</span>}
      </label>
      <div className="relative flex items-center">
        {prefix && <div className="absolute left-3 text-gray-500 text-sm font-medium select-none pointer-events-none">{prefix}</div>}
        {multiline ? (
          <textarea
            value={displayVal}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all outline-none resize-y`}
          />
        ) : (
          <input
            type={type}
            value={displayVal}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all outline-none ${prefix ? 'pl-9' : ''} ${suffix ? 'pr-9' : ''}`}
          />
        )}
        {suffix && <div className="absolute right-3 text-gray-500 text-sm">{suffix}</div>}
      </div>
    </div>
  );
};

const SelectField = ({ label, value, onChange, options, required = false, icon: Icon }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-1 whitespace-nowrap min-h-[1.25rem]">
      <span>{label}</span>
      {required && <span className="text-red-500 font-bold inline-block leading-none">*</span>}
    </label>
    <div className="relative flex items-center">
      {Icon && <div className="absolute left-3 text-gray-500"><Icon className="w-4 h-4" /></div>}
      <select
        value={typeof value === 'object' && value !== null ? (value.value ?? value.name ?? value.id ?? '') : (value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all outline-none cursor-pointer appearance-none ${Icon ? 'pl-9' : ''}`}
      >
        <option value="" disabled>Select {label}...</option>
        {options.map((opt: any, i: number) => {
          if (opt && opt.group && Array.isArray(opt.options)) {
            return (
              <optgroup key={i} label={opt.group}>
                {opt.options.map((sub: any, j: number) => {
                  const val = typeof sub === 'object' && sub !== null ? (sub.value ?? sub.name ?? sub.id) : sub;
                  const lbl = typeof sub === 'object' && sub !== null ? (sub.label ?? sub.name ?? sub.value) : sub;
                  return (
                    <option key={j} value={String(val)}>{String(lbl)}</option>
                  );
                })}
              </optgroup>
            );
          }
          const val = typeof opt === 'object' && opt !== null ? (opt.value ?? opt.name ?? opt.id) : opt;
          const lbl = typeof opt === 'object' && opt !== null ? (opt.label ?? opt.name ?? opt.value) : opt;
          return (
            <option key={i} value={String(val)}>{String(lbl)}</option>
          );
        })}
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
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm mb-6 transition-all duration-200 ${isOpen ? 'overflow-visible' : 'overflow-hidden'}`}>
      <div
        className={`px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors select-none rounded-t-xl ${!isOpen ? 'rounded-b-xl border-b-0' : ''}`}
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
        <div className="p-6 animate-in fade-in slide-in-from-top-4 duration-300 overflow-visible">
          {children}
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------------------

export default function CreatePlanningPage({ planIdProp }: { planIdProp?: string } = {}) {
  const routerParams = useParams() as any;
  const { businessId, planId: routePlanId } = routerParams;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = planIdProp || routePlanId || searchParams.get('editId') || searchParams.get('id');
  const projectIdParam = searchParams.get('projectId');
  const isEditMode = Boolean(editId);

  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPlan, setIsLoadingPlan] = useState<boolean>(() => Boolean(editId));
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<any[]>([]);
  const [documentsToDelete, setDocumentsToDelete] = useState<string[]>([]);
  const [previewingFile, setPreviewingFile] = useState<{
    file?: File;
    name: string;
    url: string;
    type?: string;
    size?: number;
    isBlob?: boolean;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    projectId: '',
    planCode: isEditMode ? '' : 'PLN-' + Math.floor(10000 + Math.random() * 90000),
    planName: '',
    phase: '',
    sprint: '',
    execType: 'Turnkey (End-to-End)',
    status: 'ACTIVE',
    priority: 'Medium',
    description: '',

    startDate: '',
    endDate: '',
    duration: '',
    workingDays: '',
    milestone: '',
    dependency: '',
    expectedCompletion: '',

    projectManager: '',
    department: 'Engineering',
    taskOwner: '',
    taskOwnerIds: [] as string[],
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
    progressStatus: 'On Track',
    riskLevel: 'Low',
    completionPercentage: '',

    estimatedCost: '',
    actualCost: '',
    variance: '',
    currency: 'USD',

    comments: '',
    privateNotes: '',
    approvals: ''
  });

  const [projects, setProjects] = useState<any[]>([]);
  const [allBusinessUsers, setAllBusinessUsers] = useState<TaskOwnerOption[]>([]);
  const [projectTeamMembers, setProjectTeamMembers] = useState<TaskOwnerOption[]>([]);

  // Helpers for file handling
  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const fmtDocDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter(f => f.size <= 50 * 1024 * 1024);
    const oversized = Array.from(files).filter(f => f.size > 50 * 1024 * 1024);
    if (oversized.length > 0) {
      toast({ title: 'File too large', description: `${oversized.length} file(s) exceed 50MB limit and were skipped.`, variant: 'destructive' });
    }
    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const handlePreviewFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewingFile({ file, name: file.name, url, type: file.type, size: file.size, isBlob: true });
  };

  const handlePreviewExistingDoc = (doc: any) => {
    setPreviewingFile({
      name: doc.title,
      url: doc.fileUrl,
      type: doc.mimeType || doc.fileType || '',
      size: doc.fileSize,
      isBlob: false
    });
  };

  const handleClosePreview = () => {
    if (previewingFile?.isBlob && previewingFile.url) {
      URL.revokeObjectURL(previewingFile.url);
    }
    setPreviewingFile(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewingFile) {
        handleClosePreview();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewingFile]);

  const removeFile = (idx: number) => {
    const fileToRemove = attachedFiles[idx];
    if (previewingFile && previewingFile.file === fileToRemove) {
      handleClosePreview();
    }
    setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const removeExistingDoc = (docId: string) => {
    setDocumentsToDelete(prev => [...prev, docId]);
    setExistingDocuments(prev => prev.filter(d => d.id !== docId));
  };

  const formatFileSize = (bytes?: number) => {
    if (bytes == null || isNaN(bytes)) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (nameOrFile: File | string, mime?: string) => {
    let name = '';
    let type = mime || '';
    if (typeof nameOrFile === 'object' && nameOrFile !== null && 'name' in nameOrFile) {
      name = nameOrFile.name;
      type = nameOrFile.type || type;
    } else {
      name = String(nameOrFile || '');
    }
    const n = name.toLowerCase();
    const t = type.toLowerCase();
    if (t.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(n)) return '🖼️';
    if (t === 'application/pdf' || n.endsWith('.pdf')) return '📄';
    if (t.includes('word') || /\.(docx?|rtf)$/i.test(n)) return '📝';
    if (t.includes('excel') || t.includes('spreadsheet') || /\.(xlsx?|csv)$/i.test(n)) return '📊';
    if (t.includes('zip') || t.includes('rar') || /\.(zip|rar|7z|tar|gz)$/i.test(n)) return '🗜️';
    return '📎';
  };

  // Helper normalizers for auto-populating from selected project
  const normalizeExecType = (raw: any): string => {
    if (!raw) return 'Turnkey (End-to-End)';
    const s = String(typeof raw === 'object' ? raw.name || raw.value : raw).trim().toLowerCase();
    if (s.includes('turnkey')) return 'Turnkey (End-to-End)';
    if (s.includes('product')) return 'Product';
    if (s.includes('service')) return 'Service';
    if (s.includes('hybrid')) return 'Hybrid';
    if (s.includes('time') || s.includes('material')) return 'Time & Materials';
    if (s.includes('fixed') || s.includes('milestone')) return 'Fixed Price / Milestone';
    if (s.includes('retainer')) return 'Retainer / Ongoing Support';
    if (s.includes('dedicated') || s.includes('staff')) return 'Dedicated Team';
    if (s.includes('agile') || s.includes('sprint')) return 'Agile / Sprint-Based';
    if (s.includes('waterfall')) return 'Waterfall';
    if (s.includes('bot') || s.includes('operate')) return 'Build-Operate-Transfer (BOT)';
    if (s.includes('auto')) return 'Auto Detect';
    return 'Turnkey (End-to-End)';
  };

  const normalizePriority = (raw: any): string => {
    if (!raw) return 'Medium';
    const s = String(typeof raw === 'object' ? raw.name || raw.value : raw).trim().toUpperCase();
    if (s === 'CRITICAL') return 'Critical';
    if (s === 'HIGH') return 'High';
    if (s === 'LOW') return 'Low';
    return 'Medium';
  };

  const normalizeDepartment = (raw: any): string => {
    if (!raw) return 'Engineering';
    const name = String(typeof raw === 'object' ? raw.name || raw.value : raw).trim();
    const match = ALL_DEPARTMENTS.find(d => d.toLowerCase() === name.toLowerCase() || name.toLowerCase().includes(d.toLowerCase()));
    return match || name || 'Engineering';
  };

  const calculateWorkingDays = (startDateStr: string, endDateStr: string): number => {
    try {
      const start = new Date(startDateStr);
      const end = new Date(endDateStr);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
      let count = 0;
      const cur = new Date(start);
      while (cur <= end) {
        const day = cur.getDay();
        if (day !== 0 && day !== 6) count++;
        cur.setDate(cur.getDate() + 1);
      }
      return count;
    } catch {
      return 0;
    }
  };

  // Helper to load project details and its assigned team members
  const loadProjectDetails = async (projId: string, currentProjectsList?: any[], autoPopulateForm: boolean = true) => {
    if (!projId || !businessId) return;
    try {
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '');
      let token = localStorage.getItem('token') || '';
      if (!token || token === 'null' || token === 'undefined') {
        token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] ||
          document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1] || '';
      }
      const headers = { 'Authorization': `Bearer ${token}`, 'x-business-id': businessId as string };

      const p = (currentProjectsList || projects).find(x => x.id === projId || x._id === projId);

      // Fetch detailed project info from /api/projects/:id (which has projectManager, allocations, budget, dates)
      let proj = p;
      try {
        const res = await fetch(`${API_BASE}/api/projects/${projId}`, { headers });
        if (res.ok) {
          const data = await res.json();
          proj = data.project || data.data || p;
        }
      } catch (fetchErr) {
        console.warn("Could not fetch remote project details, falling back to list item:", fetchErr);
      }

      if (proj) {
        const pmId = proj.projectManagerId || proj.projectManager?.id || (p && (p.projectManagerId || p.projectManager?.id)) || '';
        const deptName = normalizeDepartment(proj.department);
        const execTypeName = normalizeExecType(proj.executionType);
        const priorityName = normalizePriority(proj.priority);

        const startDateStr = proj.startDate ? new Date(proj.startDate).toISOString().split('T')[0] : '';
        const endDateStr = proj.endDate ? new Date(proj.endDate).toISOString().split('T')[0] : '';

        let durationDays = '';
        let workingDaysCount = '';
        if (startDateStr && endDateStr) {
          const startMs = new Date(startDateStr).getTime();
          const endMs = new Date(endDateStr).getTime();
          if (endMs >= startMs) {
            const diff = Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24));
            durationDays = String(diff);
            const wDays = calculateWorkingDays(startDateStr, endDateStr);
            workingDaysCount = wDays > 0 ? String(wDays) : String(diff);
          }
        }

        // Collect team members: project manager + resource allocations
        const membersMap = new Map<string, TaskOwnerOption>();
        if (proj.projectManager) {
          const pm = proj.projectManager;
          const pmName = typeof pm === 'object' ? (pm.name || pm.user?.name || 'Project Manager') : 'Project Manager';
          const pmRole = typeof pm.role === 'object' ? (pm.role?.name || 'Project Manager') : (pm.role || 'Project Manager');
          membersMap.set(pm.id, {
            id: pm.id,
            name: pmName,
            email: pm.email || '',
            role: pmRole,
            department: deptName,
            isProjectAssigned: true,
          });
        }
        if (Array.isArray(proj.resourceAllocations)) {
          proj.resourceAllocations.forEach((ra: any) => {
            const emp = ra.employee || ra.user;
            if (emp && emp.id && !membersMap.has(emp.id)) {
              const empName = typeof emp === 'object' ? (emp.name || emp.user?.name || 'Assigned Member') : 'Assigned Member';
              const empRole = typeof ra.role === 'object' ? ra.role?.name : (ra.role || (typeof emp.role === 'object' ? emp.role?.name : emp.role) || 'Allocated Resource');
              const empDept = typeof ra.department === 'object' ? ra.department?.name : (ra.department || (typeof emp.department === 'object' ? emp.department?.name : emp.department) || deptName);
              membersMap.set(emp.id, {
                id: emp.id,
                name: empName,
                email: emp.email || '',
                role: empRole,
                department: empDept,
                isProjectAssigned: true,
              });
            }
          });
        }
        const teamList = Array.from(membersMap.values());
        setProjectTeamMembers(teamList);

        if (autoPopulateForm) {
          const assignedOwnerIds = Array.from(membersMap.keys());

          setFormData(prev => ({
            ...prev,
            projectId: projId,
            planName: prev.planName || (proj.projectName ? `${proj.projectName} - Schedule` : prev.planName),
            projectManager: pmId || prev.projectManager,
            department: deptName || prev.department,
            execType: execTypeName || prev.execType,
            priority: priorityName || prev.priority,
            estimatedCost: proj.budget != null ? String(proj.budget) : prev.estimatedCost,
            estimatedHours: proj.estimatedHours != null ? String(proj.estimatedHours) : prev.estimatedHours,
            startDate: startDateStr || prev.startDate,
            endDate: endDateStr || prev.endDate,
            duration: durationDays || prev.duration,
            workingDays: workingDaysCount || prev.workingDays,
            description: prev.description || proj.note || '',
            resources: teamList.length > 0 ? String(teamList.length) : prev.resources,
            taskOwnerIds: prev.taskOwnerIds.length > 0 ? prev.taskOwnerIds : assignedOwnerIds,
            taskOwner: prev.taskOwnerIds.length > 0 ? prev.taskOwnerIds.join(',') : assignedOwnerIds.join(','),
          }));

          toast({
            title: "Project Information Fetched",
            description: `Loaded manager, timeline (${durationDays ? durationDays + ' days' : 'dates'}), budget, and team for "${proj.projectName}".`
          });
        }
      }
    } catch (err) {
      console.error("Failed to load project details:", err);
    }
  };

  // Initial Data Load
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '');
        let token = localStorage.getItem('token') || '';
        if (!token || token === 'null' || token === 'undefined') {
          token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] ||
            document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1] || '';
        }
        const headers = { 'Authorization': `Bearer ${token}`, 'x-business-id': businessId as string };

        // 1. Load Business country currency
        fetch(`${API_BASE}/api/business`, { headers })
          .then(res => res.json())
          .then(data => {
            const business = data.data || data.business;
            if (business && business.country && !isEditMode) {
              const c = business.country.toLowerCase();
              if (c.includes('india') || c === 'in') setFormData(prev => ({ ...prev, currency: 'INR' }));
              else if (c.includes('uae') || c.includes('united arab emirates') || c === 'ae') setFormData(prev => ({ ...prev, currency: 'AED' }));
              else setFormData(prev => ({ ...prev, currency: 'USD' }));
            }
          }).catch(console.error);

        // 2. Load Projects and Users
        const [projRes, userRes] = await Promise.all([
          fetch(`${API_BASE}/api/projects`, { headers }),
          fetch(`${API_BASE}/api/user-management`, { headers }),
        ]);

        const [projData, userData] = await Promise.all([projRes.json(), userRes.json()]);
        const projList = projData.data || projData.projects || [];
        const rawUsers = userData.data || userData.users || [];

        setProjects(projList);

        const formattedUsers: TaskOwnerOption[] = rawUsers.map((u: any) => {
          const uName = typeof u.user === 'object' && u.user?.name ? u.user.name : (typeof u.name === 'string' ? u.name : (u.user?.email || u.email || 'Team Member'));
          const uEmail = typeof u.user === 'object' && u.user?.email ? u.user.email : (typeof u.email === 'string' ? u.email : '');
          const uRole = typeof u.role === 'object' && u.role !== null ? (u.role.name || 'Member') : (typeof u.role === 'string' ? u.role : 'Member');
          const uDept = typeof u.department === 'object' && u.department !== null ? (u.department.name || 'General') : (typeof u.department === 'string' ? u.department : 'General');
          const uId = u.user?.id || u.id;

          return {
            id: uId,
            name: uName,
            email: uEmail,
            role: uRole,
            department: uDept,
            isProjectAssigned: false
          };
        });
        setAllBusinessUsers(formattedUsers);

        // 3. Handle Edit Mode or Project Preselection
        if (editId) {
          setIsLoadingPlan(true);
          try {
            const planRes = await fetch(`${API_BASE}/api/projects/global/plannings/${editId}`, { headers });
            const planData = await planRes.json();
            const plan = planData.planning || planData.data;
            if (plan) {
              let ownerIds: string[] = [];
              if (plan.taskOwnerId) {
                try {
                  if (plan.taskOwnerId.startsWith('[') && plan.taskOwnerId.endsWith(']')) {
                    ownerIds = JSON.parse(plan.taskOwnerId);
                  } else {
                    ownerIds = plan.taskOwnerId.split(',').map((s: string) => s.trim()).filter(Boolean);
                  }
                } catch (e) {
                  ownerIds = [plan.taskOwnerId];
                }
              }

              setFormData({
                projectId: plan.projectId || '',
                planCode: plan.planCode || '',
                planName: plan.planName || '',
                phase: plan.phase || '',
                sprint: plan.sprint || '',
                execType: typeof plan.execType === 'object' && plan.execType ? (plan.execType.name || 'Turnkey (End-to-End)') : (plan.execType || 'Turnkey (End-to-End)'),
                status: plan.status || 'ACTIVE',
                priority: plan.priority || 'Medium',
                description: plan.description || '',
                startDate: plan.startDate ? new Date(plan.startDate).toISOString().split('T')[0] : '',
                endDate: plan.endDate ? new Date(plan.endDate).toISOString().split('T')[0] : '',
                expectedCompletion: plan.expectedCompletion ? new Date(plan.expectedCompletion).toISOString().split('T')[0] : '',
                duration: plan.duration != null ? String(plan.duration) : '',
                workingDays: plan.workingDays != null ? String(plan.workingDays) : '',
                milestone: plan.milestone || '',
                dependency: plan.dependency || '',
                projectManager: plan.projectManagerId || '',
                department: typeof plan.department === 'object' && plan.department ? (plan.department.name || 'Engineering') : (plan.department || 'Engineering'),
                taskOwner: plan.taskOwnerId || '',
                taskOwnerIds: ownerIds,
                resources: plan.resources != null ? String(plan.resources) : '',
                estimatedHours: plan.estimatedHours != null ? String(plan.estimatedHours) : '',
                billableHours: plan.billableHours != null ? String(plan.billableHours) : '',
                resourceCost: plan.resourceCost != null ? String(plan.resourceCost) : '',
                taskTitle: plan.taskTitle || '',
                subTask: plan.subTask || '',
                sequence: plan.sequence != null ? String(plan.sequence) : '',
                criticalTask: Boolean(plan.criticalTask),
                recurring: Boolean(plan.recurring),
                reminder: plan.reminder != null ? String(plan.reminder) : '',
                initialProgress: plan.initialProgress != null ? String(plan.initialProgress) : '',
                currentProgress: plan.currentProgress != null ? String(plan.currentProgress) : '',
                completionPercentage: plan.completionPercentage != null ? String(plan.completionPercentage) : '',
                progressStatus: plan.progressStatus || 'On Track',
                riskLevel: plan.riskLevel || 'Low',
                estimatedCost: plan.estimatedCost != null ? String(plan.estimatedCost) : '',
                actualCost: plan.actualCost != null ? String(plan.actualCost) : '',
                variance: plan.variance != null ? String(plan.variance) : '',
                currency: plan.currency || 'USD',
                comments: plan.comments || '',
                privateNotes: plan.privateNotes || '',
                approvals: plan.approvals || '',
              });

              if (plan.projectId) {
                loadProjectDetails(plan.projectId, projList, false);
              }

              // Load associated documents
              if (plan.documents && Array.isArray(plan.documents)) {
                setExistingDocuments(plan.documents);
              } else {
                try {
                  const docRes = await fetch(`${API_BASE}/api/project-operations/documents?entityType=PLANNING&entityId=${editId}`, { headers });
                  const docData = await docRes.json();
                  if (docData.documents && Array.isArray(docData.documents)) {
                    setExistingDocuments(docData.documents);
                  }
                } catch (docErr) {
                  console.error("Failed to load attached documents:", docErr);
                }
              }
            }
          } catch (err) {
            console.error("Failed to load existing plan for edit:", err);
          } finally {
            setIsLoadingPlan(false);
          }
        } else if (projectIdParam) {
          loadProjectDetails(projectIdParam, projList);
        }
      } catch (err) {
        console.error("Failed to load dependency data:", err);
      }
    };

    loadAllData();
  }, [businessId, editId, projectIdParam]);

  // Handle Input Changes
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // When Project changes, trigger auto-fetch of Project Manager, Dates, Department and Assigned Resources
    if (field === 'projectId' && value) {
      loadProjectDetails(value);
    }
  };

  // Form Submit Handler
  const handleSubmit = async (publish: boolean) => {
    if (!formData.projectId || !formData.planName || !formData.startDate) {
      toast({ title: "Validation Error", description: "Project, Plan Name, and Start Date are required.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '');
      let token = localStorage.getItem('token') || '';
      if (!token || token === 'null' || token === 'undefined') {
        token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] ||
          document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1] || '';
      }

      const payload: any = {
        projectId: formData.projectId,
        planName: formData.planName.trim(),
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
        taskOwnerId: formData.taskOwnerIds.length > 0 ? formData.taskOwnerIds.join(',') : (formData.taskOwner || undefined),
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

      const endpoint = isEditMode
        ? `${API_BASE}/api/projects/global/plannings/${editId}`
        : `${API_BASE}/api/projects/global/plannings`;
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-business-id': businessId as string
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Failed to ${isEditMode ? 'update' : 'save'} planning schedule.`);
      }

      const targetPlanId = isEditMode ? editId : (data.planning?.id || data.data?.id || data.id);

      // Process deletions for removed existing documents
      if (documentsToDelete.length > 0) {
        for (const docId of documentsToDelete) {
          try {
            await fetch(`${API_BASE}/api/project-operations/documents/${docId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
                'x-business-id': businessId as string
              }
            });
          } catch (delErr) {
            console.error("Failed to delete document:", docId, delErr);
          }
        }
      }

      // Upload newly attached files as ProjectDocuments
      if (attachedFiles.length > 0 && targetPlanId) {
        for (const file of attachedFiles) {
          try {
            const dataUrl = await readFileAsDataUrl(file);
            await fetch(`${API_BASE}/api/project-operations/documents`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'x-business-id': businessId as string,
                'x-skip-crud-tracking': 'true',
              },
              body: JSON.stringify({
                title: file.name,
                fileUrl: dataUrl,
                fileType: file.type || 'application/octet-stream',
                mimeType: file.type || 'application/octet-stream',
                fileSize: file.size,
                folder: 'Planning',
                entityType: 'PLANNING',
                entityId: targetPlanId,
                projectId: formData.projectId || undefined,
                description: `Attachment for planning schedule ${formData.planName || ''}`
              })
            });
          } catch (uploadErr) {
            console.error("Failed to upload document:", file.name, uploadErr);
          }
        }
      }

      toast({
        title: "Success",
        description: `Planning Schedule ${isEditMode ? 'Updated' : (publish ? 'Published' : 'Saved as Draft')} Successfully.`
      });
      if (targetPlanId) {
        navigate(`/dashboard/${businessId}/project-operations/planning/${targetPlanId}`);
      } else {
        navigate(`/dashboard/${businessId}/project-operations/planning`);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isEditMode) {
      navigate(`/dashboard/${businessId}/project-operations/planning/${editId}`);
    } else {
      navigate(`/dashboard/${businessId}/project-operations/planning`);
    }
  };

  const currentCurrencySymbol = getCurrencySymbolFromCode(formData.currency);

  if (isLoadingPlan) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-950 p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-500">Loading Master Schedule Details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Header */}
      <div className="flex-none px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors cursor-pointer"
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
                {isEditMode && (
                  <>
                    <span>/</span>
                    <span className="text-blue-600 font-bold">{formData.planCode}</span>
                    <span>/</span>
                    <span className="text-blue-600 font-bold">Edit</span>
                  </>
                )}
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                {isEditMode ? `Edit Master Schedule • ${formData.planCode}` : "Create Master Schedule"}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {isEditMode ? "Update milestones, dependencies, resource allocations and timelines." : "Define schedule timeline, dependencies, task owners, and budgets."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 shadow-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Saving...</>
              ) : (
                <><CheckCircle className="w-4 h-4" /> {isEditMode ? "Update Schedule" : "Publish Schedule"}</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin" data-lenis-prevent="true">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">

          <div className="flex-1 min-w-0 flex flex-col gap-6">

            {/* Section 1: General Information */}
            <SectionCard title="1. General Information" icon={Briefcase}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-1">
                      <span>Project</span> <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <select
                        value={formData.projectId}
                        onChange={(e) => handleChange('projectId', e.target.value)}
                        className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 transition-all outline-none cursor-pointer appearance-none"
                      >
                        <option value="">Select Project...</option>
                        {projects.map((p: any) => {
                          const pCode = typeof p.projectCode === 'object' && p.projectCode ? (p.projectCode.name || '') : String(p.projectCode || '');
                          const pName = typeof p.projectName === 'object' && p.projectName ? (p.projectName.name || '') : String(p.projectName || '');
                          return (
                            <option key={p.id || p._id} value={p.id || p._id}>
                              {pCode} - {pName}
                            </option>
                          );
                        })}
                      </select>
                      <div className="absolute right-3 pointer-events-none text-gray-500"><ChevronDown className="w-4 h-4" /></div>
                    </div>
                  </div>
                </div>

                <InputField label="Planning Name" value={formData.planName} onChange={(val: any) => handleChange('planName', val)} required />
                <InputField label="Phase" value={formData.phase} onChange={(val: any) => handleChange('phase', val)} placeholder="e.g. Phase 1 - Inception" />
                <InputField label="Sprint / Iteration" value={formData.sprint} onChange={(val: any) => handleChange('sprint', val)} placeholder="e.g. Sprint 01" />

                <SelectField label="Execution Type" value={formData.execType} onChange={(val: any) => handleChange('execType', val)} options={ALL_EXECUTION_TYPES} />
                <SelectField label="Status" value={formData.status} onChange={(val: any) => handleChange('status', val)} options={['ACTIVE', 'PLANNING', 'DRAFT', 'ON_HOLD', 'COMPLETED']} />
                <SelectField label="Priority" value={formData.priority} onChange={(val: any) => handleChange('priority', val)} options={['Low', 'Medium', 'High', 'Critical']} />

                <div className="lg:col-span-3">
                  <InputField label="Description" value={formData.description} onChange={(val: any) => handleChange('description', val)} multiline rows={3} placeholder="Describe the objectives and scope of this master plan..." />
                </div>
              </div>
            </SectionCard>

            {/* Section 2: Timeline */}
            <SectionCard title="2. Timeline" icon={Calendar}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InputField label="Start Date" type="date" value={formData.startDate} onChange={(val: any) => handleChange('startDate', val)} required />
                <InputField label="End Date" type="date" value={formData.endDate} onChange={(val: any) => handleChange('endDate', val)} required />
                <InputField label="Expected Completion" type="date" value={formData.expectedCompletion} onChange={(val: any) => handleChange('expectedCompletion', val)} />

                <InputField label="Duration (Days)" type="number" value={formData.duration} onChange={(val: any) => handleChange('duration', val)} placeholder="e.g. 60" />
                <InputField label="Working Days" type="number" value={formData.workingDays} onChange={(val: any) => handleChange('workingDays', val)} placeholder="e.g. 45" />

                <InputField label="Milestone" value={formData.milestone} onChange={(val: any) => handleChange('milestone', val)} placeholder="Linked milestone name..." />
                <InputField label="Dependency (Task Code)" value={formData.dependency} onChange={(val: any) => handleChange('dependency', val)} placeholder="e.g. TSK-1002" />
              </div>
            </SectionCard>

            {/* Section 3: Resource Allocation */}
            <SectionCard title="3. Resource Allocation" icon={Users}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                {/* Project Manager (Auto-fetched from Project) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-1 whitespace-nowrap min-h-[1.25rem]">
                      <span>Project Manager</span>
                    </label>
                    {formData.projectManager && (
                      <span className="text-[10px] font-bold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded border border-green-200 dark:border-green-800">
                        Auto-fetched
                      </span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <UserSelect
                      businessId={businessId as string}
                      value={formData.projectManager}
                      onChange={(v) => handleChange('projectManager', v)}
                      placeholder="Select Manager..."
                    />
                  </div>
                </div>

                {/* Task Owner (Multi-select, filtered to project & planning assigned) */}
                <div className="space-y-1.5">
                  <MultiTaskOwnerSelect
                    value={formData.taskOwnerIds}
                    onChange={(ids) => setFormData(prev => ({ ...prev, taskOwnerIds: ids, taskOwner: ids.join(',') }))}
                    assignedMembers={projectTeamMembers}
                    allUsers={allBusinessUsers}
                    projectSelected={Boolean(formData.projectId)}
                  />
                </div>

                {/* Department (Contains all enterprise departments) */}
                <SelectField
                  label="Department"
                  value={formData.department}
                  onChange={(val: any) => handleChange('department', val)}
                  options={ALL_DEPARTMENTS}
                />

                <InputField label="Resources (Count)" type="number" value={formData.resources} onChange={(val: any) => handleChange('resources', val)} placeholder="e.g. 5" />
                <InputField label="Estimated Hours" type="number" value={formData.estimatedHours} onChange={(val: any) => handleChange('estimatedHours', val)} placeholder="0.0" />
                <InputField label="Billable Hours" type="number" value={formData.billableHours} onChange={(val: any) => handleChange('billableHours', val)} placeholder="0.0" />
                <InputField label="Resource Cost" type="number" prefix={currentCurrencySymbol} value={formData.resourceCost} onChange={(val: any) => handleChange('resourceCost', val)} placeholder="0.00" />
                <SearchableCurrencySelect
                  label="Currency"
                  value={formData.currency}
                  onChange={(code: string) => handleChange('currency', code)}
                />
              </div>
            </SectionCard>

            {/* Section 4: Scheduling */}
            <SectionCard title="4. Scheduling" icon={Clock}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <InputField label="Task" value={formData.taskTitle} onChange={(val: any) => handleChange('taskTitle', val)} placeholder="Primary task objective..." />
                </div>
                <InputField label="Sub Task" value={formData.subTask} onChange={(val: any) => handleChange('subTask', val)} placeholder="Sub task title..." />
                <InputField label="Sequence" type="number" value={formData.sequence} onChange={(val: any) => handleChange('sequence', val)} placeholder="e.g. 1" />
                <InputField label="Reminder (Days Before)" type="number" value={formData.reminder} onChange={(val: any) => handleChange('reminder', val)} placeholder="e.g. 2" />
                <div className="flex gap-4 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={formData.criticalTask} onChange={(e) => handleChange('criticalTask', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Critical Task</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={formData.recurring} onChange={(e) => handleChange('recurring', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recurring</span>
                  </label>
                </div>
              </div>
            </SectionCard>

            {/* Section 5: Progress */}
            <SectionCard title="5. Progress" icon={Target}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InputField label="Initial Progress %" type="number" value={formData.initialProgress} onChange={(val: any) => handleChange('initialProgress', val)} placeholder="0" />
                <InputField label="Current Progress %" type="number" value={formData.currentProgress} onChange={(val: any) => handleChange('currentProgress', val)} placeholder="0" />
                <InputField label="Completion %" type="number" value={formData.completionPercentage} onChange={(val: any) => handleChange('completionPercentage', val)} placeholder="0" />
                <SelectField label="Status" value={formData.progressStatus} onChange={(val: any) => handleChange('progressStatus', val)} options={['On Track', 'At Risk', 'Delayed', 'Completed']} />
                <SelectField label="Risk Level" value={formData.riskLevel} onChange={(val: any) => handleChange('riskLevel', val)} options={['Low', 'Medium', 'High']} />
              </div>
            </SectionCard>

            {/* Section 6: Budget with Searchable Currency */}
            <SectionCard title="6. Budget" icon={DollarSign}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                <InputField
                  label="Estimated Cost"
                  type="number"
                  prefix={currentCurrencySymbol}
                  value={formData.estimatedCost}
                  onChange={(val: any) => handleChange('estimatedCost', val)}
                  placeholder="0.00"
                />
                <InputField
                  label="Actual Cost"
                  type="number"
                  prefix={currentCurrencySymbol}
                  value={formData.actualCost}
                  onChange={(val: any) => handleChange('actualCost', val)}
                  placeholder="0.00"
                />
                <InputField
                  label="Variance"
                  type="number"
                  prefix={currentCurrencySymbol}
                  value={formData.variance}
                  onChange={(val: any) => handleChange('variance', val)}
                  placeholder="0.00"
                />
                <SearchableCurrencySelect
                  value={formData.currency}
                  onChange={(code) => handleChange('currency', code)}
                />
              </div>
            </SectionCard>

            {/* Section 7: Attachments */}
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
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-gray-500 transition-all cursor-pointer select-none ${isDragging ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-[1.01]' : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/20 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-gray-800/40'}`}
              >
                <div className={`p-4 rounded-full mb-3 transition-colors ${isDragging ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <FileText className={`w-8 h-8 ${isDragging ? 'text-blue-500' : 'text-blue-400'}`} />
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{isDragging ? 'Drop files here' : 'Click or drag files to upload'}</p>
                <p className="text-xs text-gray-400 mt-1 text-center">Supports PDF, Images, Word, Excel, ZIP and more · Max 50MB per file</p>
              </div>
              {/* Saved / Existing Documents (In Edit Mode) */}
              {existingDocuments.length > 0 && (
                <div className="mt-5 space-y-2.5">
                  <div className="flex items-center justify-between pb-1">
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Saved Documents ({existingDocuments.length})
                    </p>
                    <span className="text-[11px] text-gray-400">Stored in repository</span>
                  </div>
                  {existingDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => handlePreviewExistingDoc(doc)}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-900/40 rounded-xl group hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-all cursor-pointer shadow-xs"
                      title="Click to preview document"
                    >
                      <span className="text-xl select-none">{getFileIcon(doc.title, doc.mimeType || doc.fileType)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                            {doc.title}
                          </p>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                            Saved
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          <span>{formatFileSize(doc.fileSize)}</span>
                          {doc.createdAt && (
                            <>
                              <span>•</span>
                              <span>{fmtDocDate(doc.createdAt)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handlePreviewExistingDoc(doc); }}
                          title="Preview document"
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <a
                          href={doc.fileUrl}
                          download={doc.title}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Download document"
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeExistingDoc(doc.id); }}
                          title="Remove document"
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* New Staged Files */}
              {attachedFiles.length > 0 && (
                <div className="mt-5 space-y-2.5">
                  <div className="flex items-center justify-between pb-1">
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      New Files to Upload ({attachedFiles.length})
                    </p>
                    <span className="text-[11px] text-blue-500 font-semibold">Will be uploaded on save</span>
                  </div>
                  {attachedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      onClick={() => handlePreviewFile(file)}
                      className="flex items-center gap-3 p-3 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl group hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/60 dark:hover:bg-blue-900/20 transition-all cursor-pointer shadow-xs"
                      title="Click to preview document"
                    >
                      <span className="text-xl select-none">{getFileIcon(file)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                            {file.name}
                          </p>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                            Ready to Upload
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{formatFileSize(file.size)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handlePreviewFile(file); }}
                          title="Preview document"
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); removeFile(idx); }}
                          title="Remove file"
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Section 8: Internal Notes */}
            <SectionCard title="8. Internal Notes" icon={Info}>
              <div className="space-y-6">
                <InputField label="Comments" value={formData.comments} onChange={(val: any) => handleChange('comments', val)} multiline rows={3} placeholder="Add general team comments..." />
                <InputField label="Private Notes" value={formData.privateNotes} onChange={(val: any) => handleChange('privateNotes', val)} multiline rows={3} placeholder="Confidential management notes..." />
                <InputField label="Approvals" value={formData.approvals} onChange={(val: any) => handleChange('approvals', val)} placeholder="Sign-off authority / approval reference..." />
              </div>
            </SectionCard>

            {/* Bottom Actions Bar at End of Page */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span>Make sure all required fields (*Project, Plan Name, Start Date) are completed before saving.</span>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 shadow-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit(false)}
                  className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Saving...</>
                  ) : (
                    <><CheckCircle className="w-4 h-4" /> {isEditMode ? "Update Schedule" : "Publish Schedule"}</>
                  )}
                </button>
              </div>
            </div>

          </div>

          {/* Sticky Summary Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="sticky top-6 flex flex-col gap-4">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
                <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold tracking-widest text-blue-400 uppercase">{formData.planCode}</span>
                    <h3 className="font-bold text-sm truncate max-w-[200px]">{formData.planName || 'Schedule Summary'}</h3>
                  </div>
                  <Layout className="w-4 h-4 text-gray-400" />
                </div>
                <div className="p-5 flex flex-col gap-4 text-xs">
                  <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
                    <span className="font-bold text-gray-500 uppercase">Project</span>
                    <span className="font-bold text-gray-900 dark:text-white truncate max-w-[150px]">
                      {(() => {
                        const p = projects.find(x => x.id === formData.projectId || x._id === formData.projectId);
                        if (!p) return '-';
                        return typeof p.projectName === 'object' && p.projectName ? (p.projectName.name || '-') : (p.projectName || '-');
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
                    <span className="font-bold text-gray-500 uppercase">Model</span>
                    <span className="font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded truncate max-w-[150px]">
                      {typeof formData.execType === 'object' && formData.execType ? (formData.execType as any)?.name : (formData.execType || '-')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
                    <span className="font-bold text-gray-500 uppercase">Est. Cost</span>
                    <span className="font-bold text-green-600 text-sm">
                      {currentCurrencySymbol}{Number(formData.estimatedCost || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
                    <span className="font-bold text-gray-500 uppercase">Department</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {typeof formData.department === 'object' && formData.department ? (formData.department as any)?.name : (formData.department || '-')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
                    <span className="font-bold text-gray-500 uppercase">Task Owners</span>
                    <span className="font-bold text-gray-900 dark:text-white">{formData.taskOwnerIds.length} Assigned</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="font-bold text-gray-500 uppercase">Files</span>
                    <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1">
                      <Paperclip className="w-3.5 h-3.5 text-blue-500" /> {existingDocuments.length + attachedFiles.length} Attachments
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 p-4">
                <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Next Milestone Milestones
                </h4>
                <p className="text-xs text-blue-900/70 dark:text-blue-200/70 leading-relaxed">
                  Saving this master schedule assigns resources, enables Gantt timeline tracking, and links directly to operational tasks.
                </p>
              </div>

              {/* Sidebar Quick Save Actions */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm space-y-2">
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Saving...</>
                  ) : (
                    <><CheckCircle className="w-4 h-4" /> {isEditMode ? "Update Schedule" : "Publish Schedule"}</>
                  )}
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit(false)}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Save Draft
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Document Preview Modal */}
      {previewingFile && (
        <div
          data-lenis-prevent="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={handleClosePreview}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/80 dark:bg-gray-900/80 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl select-none">{getFileIcon(previewingFile.name, previewingFile.type)}</span>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate max-w-md">
                    {previewingFile.name}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {formatFileSize(previewingFile.size)} {previewingFile.type ? `• ${previewingFile.type}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewingFile.url}
                  download={previewingFile.name}
                  className="px-3 py-1.5 text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-gray-200 dark:border-gray-700"
                  title="Download file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </a>
                <a
                  href={previewingFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-gray-200 dark:border-gray-700"
                  title="Open in new window"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Open in Tab</span>
                </a>
                <button
                  type="button"
                  onClick={handleClosePreview}
                  className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer ml-1"
                  title="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body Preview */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-100 dark:bg-gray-950/70 min-h-[350px]">
              {previewingFile.type?.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(previewingFile.name) ? (
                <img
                  src={previewingFile.url}
                  alt={previewingFile.name}
                  className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-md"
                />
              ) : previewingFile.type === 'application/pdf' || previewingFile.name.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewingFile.url}
                  title={previewingFile.name}
                  className="w-full h-[68vh] border-0 rounded-lg shadow-sm bg-white"
                />
              ) : previewingFile.type?.startsWith('text/') || /\.(txt|csv|json)$/i.test(previewingFile.name) ? (
                <iframe
                  src={previewingFile.url}
                  title={previewingFile.name}
                  className="w-full h-[65vh] border border-gray-200 dark:border-gray-800 rounded-lg p-4 font-mono text-xs bg-white dark:bg-gray-900"
                />
              ) : (
                <div className="text-center p-8 flex flex-col items-center gap-3">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl">
                    <FileText className="w-16 h-16" />
                  </div>
                  <h4 className="font-bold text-gray-800 dark:text-gray-200 text-base">{previewingFile.name}</h4>
                  <p className="text-xs text-gray-500 max-w-sm">
                    In-browser preview is best viewed by opening directly or downloading the document.
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <a
                      href={previewingFile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <ExternalLink className="w-4 h-4" /> Open in New Tab
                    </a>
                    <a
                      href={previewingFile.url}
                      download={previewingFile.name}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-bold hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Download className="w-4 h-4" /> Download File
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-between items-center text-xs text-gray-500 flex-shrink-0">
              <span>Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 font-mono text-[10px]">Esc</kbd> to close</span>
              <button
                type="button"
                onClick={handleClosePreview}
                className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
