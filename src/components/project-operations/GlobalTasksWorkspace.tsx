import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Search, Filter, CheckSquare, Plus, List, LayoutGrid, Clock, X,
  ChevronDown, Download, FileText, AlertTriangle, CheckCircle, Loader2,
  SlidersHorizontal, Activity, Briefcase, Eye, Edit, Trash2, Calendar,
  User, Check, Percent, ExternalLink
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '@/components/ui/use-toast';
import { API_ROOT } from "@/config/api";

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  DONE: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  TODO: 'bg-gray-100 text-gray-700',
  OVERDUE: 'bg-red-100 text-red-700',
  REVIEW: 'bg-orange-100 text-orange-700',
  BLOCKED: 'bg-pink-100 text-pink-700',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

export function GlobalTasksWorkspace({ businessId: propBusinessId }: { businessId?: string }) {
  const params = useParams();
  const businessId = (propBusinessId || params?.businessId) as string;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [plannings, setPlannings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Action Modals State
  const [viewModalTask, setViewModalTask] = useState<any | null>(null);
  const [editModalTask, setEditModalTask] = useState<any | null>(null);
  const [deleteModalTask, setDeleteModalTask] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    planningId: '',
    assigneeId: '',
    priority: 'MEDIUM',
    status: 'TODO',
    completionPercentage: 0,
    startDate: '',
    dueDate: '',
    estimatedHours: '',
    actualHours: '',
    milestone: '',
  });

  const getToken = () => {
    let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token || token === 'null' || token === 'undefined') {
      token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] ||
        document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1] || '';
    }
    return token;
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      setUpdatingId(taskId);
      const API = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '');
      const existing = tasks.find(t => t.id === taskId);
      const currentPct = existing?.completionPercentage ?? (existing?.status === 'DONE' ? 100 : 0);
      const completionPercentage = newStatus === 'DONE' ? 100 : (newStatus === 'TODO' ? 0 : (currentPct === 0 || currentPct === 100 ? 50 : currentPct));

      const res = await fetch(`${API}/api/projects/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
          'x-business-id': businessId
        },
        body: JSON.stringify({
          status: newStatus,
          completionPercentage
        })
      });
      if (!res.ok) throw new Error('Failed to update task status');
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus, completionPercentage } : t));
      if (viewModalTask && viewModalTask.id === taskId) {
        setViewModalTask((prev: any) => ({ ...prev, status: newStatus, completionPercentage }));
      }
      toast({
        title: "Task Updated",
        description: `Task status updated to ${newStatus.replace('_', ' ')} (${completionPercentage}%).`
      });
    } catch (err: any) {
      toast({
        title: "Update Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleProgressChange = async (taskId: string, newPercentage: number) => {
    const val = Math.min(100, Math.max(0, Math.round(newPercentage)));
    const targetStatus = val >= 100 ? 'DONE' : (val > 0 ? 'IN_PROGRESS' : 'TODO');
    try {
      setUpdatingId(taskId);
      const API = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '');
      const res = await fetch(`${API}/api/projects/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
          'x-business-id': businessId
        },
        body: JSON.stringify({
          completionPercentage: val,
          status: targetStatus
        })
      });
      if (!res.ok) throw new Error('Failed to update task progress');
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completionPercentage: val, status: targetStatus } : t));
      if (viewModalTask && viewModalTask.id === taskId) {
        setViewModalTask((prev: any) => ({ ...prev, completionPercentage: val, status: targetStatus }));
      }
      toast({
        title: "Progress Updated",
        description: `Task progress set to ${val}%. Planning and project synchronized.`
      });
    } catch (err: any) {
      toast({
        title: "Update Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const openEditModal = (task: any) => {
    setEditModalTask(task);
    setEditFormData({
      title: task.title || '',
      description: task.description || '',
      projectId: task.projectId || task.project?.id || '',
      planningId: task.planningId || task.planning?.id || '',
      assigneeId: task.assignedToId || task.assigneeId || task.assignedTo?.id || '',
      priority: task.priority || 'MEDIUM',
      status: task.status === 'COMPLETED' ? 'DONE' : (task.status || 'TODO'),
      completionPercentage: task.completionPercentage !== undefined ? task.completionPercentage : (task.status === 'DONE' ? 100 : 0),
      startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      estimatedHours: task.estimatedHours != null ? String(task.estimatedHours) : '',
      actualHours: task.actualHours != null ? String(task.actualHours) : '',
      milestone: task.milestone || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editModalTask || !businessId) return;
    if (!editFormData.title.trim()) {
      toast({ title: "Validation Error", description: "Task title cannot be empty.", variant: "destructive" });
      return;
    }
    try {
      setIsSavingEdit(true);
      const API = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '');
      const pct = Math.min(100, Math.max(0, Number(editFormData.completionPercentage) || 0));
      const targetStatus = pct >= 100 ? 'DONE' : editFormData.status;

      const payload = {
        title: editFormData.title.trim(),
        description: editFormData.description || undefined,
        projectId: editFormData.projectId || undefined,
        planningId: editFormData.planningId || null,
        assignedToId: editFormData.assigneeId || null,
        priority: editFormData.priority || undefined,
        status: targetStatus,
        completionPercentage: pct,
        startDate: editFormData.startDate ? new Date(editFormData.startDate).toISOString() : null,
        dueDate: editFormData.dueDate ? new Date(editFormData.dueDate).toISOString() : null,
        estimatedHours: parseFloat(editFormData.estimatedHours) || 0,
        actualHours: parseFloat(editFormData.actualHours) || 0,
        milestone: editFormData.milestone || null,
      };

      const res = await fetch(`${API}/api/projects/tasks/${editModalTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
          'x-business-id': businessId
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update task');
      }
      const updated = data.task;
      setTasks(prev => prev.map(t => t.id === editModalTask.id ? { ...t, ...updated } : t));
      toast({
        title: "Task Updated",
        description: `Task "${editFormData.title}" has been saved.`
      });
      setEditModalTask(null);
    } catch (err: any) {
      toast({
        title: "Update Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteModalTask || !businessId) return;
    try {
      setIsDeleting(true);
      const API = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '');
      const res = await fetch(`${API}/api/projects/tasks/${deleteModalTask.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'x-business-id': businessId
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete task');
      }
      setTasks(prev => prev.filter(t => t.id !== deleteModalTask.id));
      if (viewModalTask && viewModalTask.id === deleteModalTask.id) {
        setViewModalTask(null);
      }
      toast({
        title: "Task Deleted",
        description: `Task "${deleteModalTask.title}" has been deleted.`
      });
      setDeleteModalTask(null);
    } catch (err: any) {
      toast({
        title: "Delete Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 300); return () => clearTimeout(t); }, [search]);

  useEffect(() => {
    const load = async () => {
      if (!businessId) return;
      try {
        setLoading(true);
        const API = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '');
        let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token || token === 'null' || token === 'undefined') {
          token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] ||
            document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1] || '';
        }
        const h = { 'Authorization': `Bearer ${token}`, 'x-business-id': businessId };
        const [tRes, pRes, uRes, plRes] = await Promise.all([
          fetch(`${API}/api/projects/global/tasks`, { headers: h }),
          fetch(`${API}/api/projects`, { headers: h }),
          fetch(`${API}/api/user-management`, { headers: h }).catch(() => fetch(`${API}/api/employees`, { headers: h })),
          fetch(`${API}/api/projects/global/plannings`, { headers: h }).catch(() => null),
        ]);
        const [td, pd, ud, pld] = await Promise.all([
          tRes.json(),
          pRes.json(),
          uRes.json(),
          plRes ? plRes.json() : { plannings: [] },
        ]);
        setTasks(td.data || td.tasks || []);
        setProjects(pd.data || pd.projects || []);
        const rawUsers = ud.data || ud.users || ud.employees || [];
        setUsers(rawUsers.map((u: any) => ({
          id: u.user?.id || u.id,
          name: u.user?.name || u.name || u.email || 'Team Member',
          email: u.user?.email || u.email || '',
          role: typeof u.role === 'object' ? u.role?.name : (u.role || 'Member'),
          department: typeof u.department === 'object' ? u.department?.name : (u.department || 'General')
        })));
        setPlannings(pld?.data || pld?.plannings || []);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, [businessId]);

  const availableEditPlannings = useMemo(() => {
    if (!editFormData.projectId) return plannings;
    const target = String(editFormData.projectId).toLowerCase().trim();
    return plannings.filter(p => {
      const pId = String(p.projectId || '').toLowerCase().trim();
      const projId = String(p.project?.id || p.project?._id || '').toLowerCase().trim();
      return pId === target || projId === target;
    });
  }, [plannings, editFormData.projectId]);

  const filtered = useMemo(() => {
    const s = debouncedSearch.toLowerCase();
    return tasks.filter(t => {
      if (s && ![(t.title || ''), (t.taskNumber || ''), (t.taskCode || ''), (t.project?.projectName || ''), (t.planning?.planName || ''), (t.planning?.planCode || ''), (t.assignee?.name || ''), (t.assignedTo?.name || ''), (t.milestone || '')].some(v => v.toLowerCase().includes(s))) return false;
      if (filters.status && t.status !== filters.status) return false;
      if (filters.priority && t.priority !== filters.priority) return false;
      if (filters.project && t.projectId !== filters.project) return false;
      if (filters.planning && t.planningId !== filters.planning && t.planning?.id !== filters.planning) return false;
      if (filters.assignee && t.assigneeId !== filters.assignee && t.assignedToId !== filters.assignee) return false;
      return true;
    });
  }, [tasks, debouncedSearch, filters]);

  const kpis = useMemo(() => ({
    total: filtered.length,
    completed: filtered.filter(t => t.status === 'COMPLETED').length,
    inProgress: filtered.filter(t => t.status === 'IN_PROGRESS').length,
    overdue: filtered.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED').length,
    review: filtered.filter(t => t.status === 'REVIEW').length,
    blocked: filtered.filter(t => t.status === 'BLOCKED').length,
  }), [filtered]);

  const handleBackendExport = async (type: 'excel' | 'pdf') => {
    try {
      if (type === 'excel') setIsExportingExcel(true);
      else setIsExportingPDF(true);

      toast({ title: `Generating ${type.toUpperCase()}`, description: "Please wait..." });

      let token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      if (!token) token = document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1];
      if (!token && typeof window !== 'undefined') {
        token = localStorage.getItem('token') || localStorage.getItem('accessToken') || undefined;
      }


      const res = await fetch(`${API_ROOT}/tasks/export/${type}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'x-business-id': businessId }
      });

      if (!res.ok) {
        const errorText = await res.json().catch(() => ({ message: `Failed to export ${type.toUpperCase()}` }));
        throw new Error(errorText.message || `Failed to export ${type.toUpperCase()}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Tasks_${new Date().toISOString().split('T')[0]}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: "Success", description: `${type.toUpperCase()} downloaded successfully.` });
    } catch (error: any) {
      toast({ title: "Export Error", description: error.message || "Failed to generate report", variant: "destructive" });
    } finally {
      setIsExportingExcel(false);
      setIsExportingPDF(false);
    }
  };

  const kanbanCols = ['TODO', 'IN_PROGRESS', 'REVIEW', 'BLOCKED', 'COMPLETED'];

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Header */}
      <div className="flex-none px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          <span>Project Operations</span><span>/</span><span>Execution</span><span>/</span>
          <span className="text-blue-600">Tasks</span>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Project Tasks</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage and track tasks across all active projects.</p>
          </div>
          <div className="flex gap-3 relative">
            <button
              onClick={() => handleBackendExport('excel')}
              disabled={isExportingExcel || isExportingPDF}
              className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-lg text-sm font-semibold border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors shadow-sm disabled:opacity-50"
            >
              {isExportingExcel ? (
                <div className="w-4 h-4 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Download className="w-4 h-4" />
              )}
              Excel
            </button>
            <button
              onClick={() => handleBackendExport('pdf')}
              disabled={isExportingExcel || isExportingPDF}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-lg text-sm font-semibold border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors shadow-sm disabled:opacity-50"
            >
              {isExportingPDF ? (
                <div className="w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <FileText className="w-4 h-4" />
              )}
              PDF
            </button>
            <Link to={`/dashboard/${businessId || 'loading'}/project-operations/tasks/create`} onClick={(e) => { if (!businessId) e.preventDefault(); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm transition-colors">
              <Plus className="w-4 h-4" /> New Task
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total Tasks', val: kpis.total, color: 'text-gray-900 dark:text-white', bg: 'bg-white dark:bg-gray-900' },
            { label: 'Completed', val: kpis.completed, color: 'text-green-600', bg: 'bg-white dark:bg-gray-900' },
            { label: 'In Progress', val: kpis.inProgress, color: 'text-blue-600', bg: 'bg-white dark:bg-gray-900' },
            { label: 'Overdue', val: kpis.overdue, color: 'text-red-600', bg: 'bg-white dark:bg-gray-900' },
            { label: 'In Review', val: kpis.review, color: 'text-orange-600', bg: 'bg-white dark:bg-gray-900' },
            { label: 'Blocked', val: kpis.blocked, color: 'text-pink-600', bg: 'bg-white dark:bg-gray-900' },
          ].map((k, i) => (
            <div key={i} className={`${k.bg} rounded-xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm`}>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{k.label}</p>
              <p className={`text-3xl font-black ${k.color}`}>{k.val}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search task, project, employee..." className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 transition-all" />
            </div>
            <button onClick={() => setIsFilterOpen(true)} className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-bold transition-colors ${Object.keys(filters).length > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 hover:bg-gray-50'}`}>
              <Filter className="w-4 h-4" /> Filter {Object.keys(filters).length > 0 && `(${Object.keys(filters).length})`}
            </button>
          </div>
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 ${view === 'list' ? 'bg-white dark:bg-gray-900 shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}><List className="w-4 h-4" /> List</button>
            <button onClick={() => setView('kanban')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 ${view === 'kanban' ? 'bg-white dark:bg-gray-900 shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}><LayoutGrid className="w-4 h-4" /> Board</button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading Tasks...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-5 relative">
              <CheckSquare className="w-10 h-10 text-blue-500" />
              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 p-1.5 rounded-full border border-gray-100 dark:border-gray-800 shadow"><Plus className="w-4 h-4 text-orange-500" /></div>
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{search || Object.keys(filters).length ? 'No Matching Tasks' : 'No Project Tasks Yet'}</h3>
            <p className="text-sm text-gray-500 text-center max-w-sm mb-6">{search || Object.keys(filters).length ? 'Try clearing your search or filters.' : 'Create your first project task to track execution, milestones, and team progress.'}</p>
            {search || Object.keys(filters).length > 0 ? (
              <button onClick={() => { setSearch(''); setFilters({}); }} className="px-5 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-bold">Clear Filters</button>
            ) : (
              <Link to={`/dashboard/${businessId || 'loading'}/project-operations/tasks/create`} onClick={(e) => { if (!businessId) e.preventDefault(); }} className="px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"><Plus className="w-4 h-4" /> Create Task</Link>
            )}
          </div>
        ) : view === 'list' ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-[10px] text-gray-500 uppercase tracking-widest border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-5 py-3.5 whitespace-nowrap">Task</th>
                    <th className="px-5 py-3.5 whitespace-nowrap">Project</th>
                    <th className="px-5 py-3.5 whitespace-nowrap">Milestone</th>
                    <th className="px-5 py-3.5 whitespace-nowrap">Assignee</th>
                    <th className="px-5 py-3.5 whitespace-nowrap">Priority</th>
                    <th className="px-5 py-3.5 whitespace-nowrap">Status</th>
                    <th className="px-5 py-3.5 whitespace-nowrap">Progress</th>
                    <th className="px-5 py-3.5 whitespace-nowrap">Due Date</th>
                    <th className="px-5 py-3.5 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map(t => {
                    const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE' && t.status !== 'COMPLETED';
                    const currentPct = t.completionPercentage !== undefined ? t.completionPercentage : (t.status === 'DONE' ? 100 : (t.progress || 0));

                    return (
                      <tr
                        key={t.id}
                        className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors group cursor-pointer"
                        onClick={() => setViewModalTask(t)}
                      >
                        {/* Task */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <CheckSquare className={`w-4 h-4 flex-shrink-0 transition-colors ${t.status === 'DONE' ? 'text-emerald-500' : 'text-gray-300 group-hover:text-blue-500'}`} />
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white max-w-[200px] truncate group-hover:text-blue-600 transition-colors" title={t.title}>{t.title}</p>
                              <p className="text-[10px] text-gray-400 font-mono font-semibold">{t.taskNumber || t.taskCode || '-'}</p>
                            </div>
                          </div>
                        </td>

                        {/* Project */}
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs">
                          <div className="font-semibold text-gray-900 dark:text-gray-100 max-w-[160px] truncate" title={t.project?.projectName || t.project?.name}>
                            {t.project?.projectName || t.project?.name || '-'}
                          </div>
                          {t.planning && (
                            <div className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 mt-0.5 font-medium">
                              <Briefcase className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate max-w-[150px]" title={`${t.planning.planCode} • ${t.planning.planName}`}>{t.planning.planCode} • {t.planning.planName}</span>
                            </div>
                          )}
                        </td>

                        {/* Milestone */}
                        <td className="px-5 py-3.5 whitespace-nowrap text-gray-500 text-xs">
                          {t.milestone || '-'}
                        </td>

                        {/* Assignee */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {(t.assignedTo || t.assignee) ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center text-[10px] font-black flex-shrink-0">
                                {((t.assignedTo?.name || t.assignee?.name || 'U')[0]).toUpperCase()}
                              </div>
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate" title={t.assignedTo?.name || t.assignee?.name}>
                                {t.assignedTo?.name || t.assignee?.name}
                              </span>
                            </div>
                          ) : <span className="text-gray-400 text-xs">Unassigned</span>}
                        </td>

                        {/* Priority */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.MEDIUM}`}>
                            {t.priority || 'MEDIUM'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={t.status === 'DONE' ? 'DONE' : (t.status || 'TODO')}
                            disabled={updatingId === t.id}
                            onChange={(e) => handleStatusChange(t.id, e.target.value)}
                            className="text-xs font-bold px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                          >
                            <option value="TODO">TODO</option>
                            <option value="IN_PROGRESS">IN PROGRESS</option>
                            <option value="DONE">DONE (COMPLETED)</option>
                          </select>
                        </td>

                        {/* Progress (Read-Only) */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-300 ${t.status === 'DONE' || currentPct >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                style={{ width: `${Math.min(100, Math.max(0, currentPct))}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{currentPct}%</span>
                          </div>
                        </td>

                        {/* Due Date */}
                        <td className={`px-5 py-3.5 text-xs font-medium whitespace-nowrap ${isOverdue ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                          {isOverdue && <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-red-500" />}
                          {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewModalTask(t)}
                              title="View Task Details"
                              className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => navigate(`/dashboard/${businessId}/project-operations/tasks/${t.id}/edit`)}
                              title="Edit Task"
                              className="p-1.5 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteModalTask(t)}
                              title="Delete Task"
                              className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {kanbanCols.map(col => {
              const colTasks = filtered.filter(t => t.status === col);
              return (
                <div key={col} className="min-w-[270px] max-w-[270px] bg-gray-100 dark:bg-gray-800/50 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between px-1 mb-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${STATUS_COLORS[col] || ''}`}>{col.replace('_', ' ')}</span>
                    <span className="w-5 h-5 bg-white dark:bg-gray-700 rounded-full text-[10px] font-black text-gray-600 dark:text-gray-300 flex items-center justify-center shadow-sm">{colTasks.length}</span>
                  </div>
                  {colTasks.map(t => (
                    <div
                      key={t.id}
                      onClick={() => setViewModalTask(t)}
                      className="bg-white dark:bg-gray-900 rounded-lg p-3.5 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all cursor-pointer"
                    >
                      <p className="text-xs font-bold text-gray-900 dark:text-white mb-1.5 leading-snug">{t.title}</p>
                      <p className="text-[10px] text-gray-400 mb-1">{t.project?.projectName || ''}</p>
                      {t.planning && (
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 mb-2 truncate">
                          <Briefcase className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="truncate">{t.planning.planCode}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.MEDIUM}`}>{t.priority || 'MED'}</span>
                        {t.assignee && <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-black flex items-center justify-center">{(t.assignee?.name || 'U')[0]}</div>}
                      </div>

                      {/* Progress bar in Kanban */}
                      <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1.5 flex-1 mr-2">
                          <div className="flex-1 bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${t.status === 'DONE' ? 'bg-emerald-500' : 'bg-blue-600'}`}
                              style={{ width: `${t.completionPercentage || 0}%` }}
                            />
                          </div>
                          <span className="font-bold text-gray-500">{t.completionPercentage || 0}%</span>
                        </div>
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button type="button" onClick={() => setViewModalTask(t)} className="p-1 text-gray-400 hover:text-blue-600" title="View"><Eye className="w-3.5 h-3.5" /></button>
                          <button type="button" onClick={() => navigate(`/dashboard/${businessId}/project-operations/tasks/${t.id}/edit`)} className="p-1 text-gray-400 hover:text-amber-600" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                          <button type="button" onClick={() => setDeleteModalTask(t)} className="p-1 text-gray-400 hover:text-red-600" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && <div className="py-6 text-center text-xs text-gray-400 font-medium">No tasks</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* VIEW TASK MODAL */}
      {viewModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setViewModalTask(null)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                    {viewModalTask.taskNumber || viewModalTask.taskCode || 'TASK'}
                  </span>
                  <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full ${PRIORITY_COLORS[viewModalTask.priority] || PRIORITY_COLORS.MEDIUM}`}>
                    {viewModalTask.priority || 'MEDIUM'}
                  </span>
                  <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full ${STATUS_COLORS[viewModalTask.status] || 'bg-gray-100 text-gray-700'}`}>
                    {(viewModalTask.status || 'TODO').replace('_', ' ')}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-snug">{viewModalTask.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setViewModalTask(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 space-y-1">
                <span className="text-gray-400 font-semibold uppercase text-[10px] tracking-wider">Project</span>
                <p className="font-bold text-gray-900 dark:text-white text-sm">
                  {viewModalTask.project?.projectName || viewModalTask.project?.name || '—'}
                </p>
                {viewModalTask.project?.projectCode && (
                  <p className="font-mono text-gray-500">{viewModalTask.project.projectCode}</p>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 space-y-1">
                <span className="text-gray-400 font-semibold uppercase text-[10px] tracking-wider">Planning Schedule</span>
                {viewModalTask.planning ? (
                  <div>
                    <p className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                      {viewModalTask.planning.planName}
                    </p>
                    <p className="font-mono text-xs text-gray-500">{viewModalTask.planning.planCode}</p>
                  </div>
                ) : (
                  <p className="text-gray-400 font-medium">Direct Project Task (No Planning)</p>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 space-y-1">
                <span className="text-gray-400 font-semibold uppercase text-[10px] tracking-wider">Assignee</span>
                {(viewModalTask.assignedTo || viewModalTask.assignee) ? (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center font-black text-xs">
                      {((viewModalTask.assignedTo?.name || viewModalTask.assignee?.name || 'U')[0]).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{viewModalTask.assignedTo?.name || viewModalTask.assignee?.name}</p>
                      <p className="text-[11px] text-gray-400">{viewModalTask.assignedTo?.email || viewModalTask.assignee?.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 font-medium">Unassigned</p>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 space-y-1">
                <span className="text-gray-400 font-semibold uppercase text-[10px] tracking-wider">Milestone</span>
                <p className="font-bold text-gray-900 dark:text-white text-sm">{viewModalTask.milestone || '—'}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 space-y-1">
                <span className="text-gray-400 font-semibold uppercase text-[10px] tracking-wider">Timeline</span>
                <p className="font-semibold text-gray-800 dark:text-gray-200">
                  {viewModalTask.startDate ? new Date(viewModalTask.startDate).toLocaleDateString() : 'TBD'} → {viewModalTask.dueDate ? new Date(viewModalTask.dueDate).toLocaleDateString() : 'TBD'}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 space-y-1">
                <span className="text-gray-400 font-semibold uppercase text-[10px] tracking-wider">Hours</span>
                <p className="font-semibold text-gray-800 dark:text-gray-200">
                  Est: <strong>{viewModalTask.estimatedHours || 0} hrs</strong> • Actual: <strong>{viewModalTask.actualHours || 0} hrs</strong>
                </p>
              </div>
            </div>

            {/* Task Progress Meter (Read-Only) */}
            <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-600" />
                  Task Progress
                </span>
                <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                  {viewModalTask.completionPercentage !== undefined ? viewModalTask.completionPercentage : (viewModalTask.status === 'DONE' ? 100 : 0)}%
                </span>
              </div>

              <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    (viewModalTask.completionPercentage || 0) >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, viewModalTask.completionPercentage !== undefined ? viewModalTask.completionPercentage : (viewModalTask.status === 'DONE' ? 100 : 0)))}%` }}
                />
              </div>
            </div>

            {/* Description */}
            {viewModalTask.description && (
              <div className="space-y-1.5 text-xs">
                <span className="text-gray-400 font-semibold uppercase text-[10px] tracking-wider">Description</span>
                <p className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {viewModalTask.description}
                </p>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => {
                  const t = viewModalTask;
                  setViewModalTask(null);
                  setDeleteModalTask(t);
                }}
                className="px-3.5 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Task</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewModalTask(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tId = viewModalTask.id;
                    setViewModalTask(null);
                    navigate(`/dashboard/${businessId}/project-operations/tasks/${tId}/edit`);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Task</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TASK MODAL */}
      {editModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => !isSavingEdit && setEditModalTask(null)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Edit className="w-5 h-5 text-amber-500" />
                  Edit Project Task
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {editModalTask.taskNumber || editModalTask.taskCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditModalTask(null)}
                disabled={isSavingEdit}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Implement Authentication Module"
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-all"
                />
              </div>

              {/* Project & Planning Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Project <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editFormData.projectId}
                    onChange={(e) => {
                      const newProjId = e.target.value;
                      setEditFormData(p => ({
                        ...p,
                        projectId: newProjId,
                        planningId: ''
                      }));
                    }}
                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none cursor-pointer"
                  >
                    <option value="">Select Project...</option>
                    {projects.map((pr: any) => (
                      <option key={pr.id} value={pr.id}>
                        {pr.projectCode ? `${pr.projectCode} - ` : ''}{pr.projectName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Planning / Master Schedule
                  </label>
                  <select
                    value={editFormData.planningId}
                    onChange={(e) => setEditFormData(p => ({ ...p, planningId: e.target.value }))}
                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none cursor-pointer"
                  >
                    <option value="">None (Direct Project Task)</option>
                    {availableEditPlannings.map((pl: any) => (
                      <option key={pl.id} value={pl.id}>
                        {pl.planCode} • {pl.planName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Assignee & Milestone Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Assignee
                  </label>
                  <select
                    value={editFormData.assigneeId}
                    onChange={(e) => setEditFormData(p => ({ ...p, assigneeId: e.target.value }))}
                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u: any) => {
                      const uId = u.user?.id || u.id;
                      const uName = u.user?.name || u.name || u.email || 'Team Member';
                      return (
                        <option key={uId} value={uId}>
                          {uName}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Milestone
                  </label>
                  <input
                    type="text"
                    value={editFormData.milestone}
                    onChange={(e) => setEditFormData(p => ({ ...p, milestone: e.target.value }))}
                    placeholder="e.g. Beta Launch"
                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none"
                  />
                </div>
              </div>

              {/* Priority & Status Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Priority
                  </label>
                  <select
                    value={editFormData.priority}
                    onChange={(e) => setEditFormData(p => ({ ...p, priority: e.target.value }))}
                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none cursor-pointer"
                  >
                    {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(pr => (
                      <option key={pr} value={pr}>{pr}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Status
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => {
                      const s = e.target.value;
                      setEditFormData(p => ({
                        ...p,
                        status: s,
                        completionPercentage: s === 'DONE' ? 100 : (s === 'TODO' ? 0 : (p.completionPercentage === 0 || p.completionPercentage === 100 ? 50 : p.completionPercentage))
                      }));
                    }}
                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none cursor-pointer"
                  >
                    <option value="TODO">TODO</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="DONE">DONE (COMPLETED)</option>
                  </select>
                </div>
              </div>

              {/* Interactive Progress Meter in Edit Modal */}
              <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Completion Progress Meter
                  </label>
                  <div className="flex items-center gap-1 font-bold text-sm text-blue-600 dark:text-blue-400">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editFormData.completionPercentage}
                      onChange={(e) => {
                        const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                        setEditFormData(p => ({
                          ...p,
                          completionPercentage: val,
                          status: val === 100 ? 'DONE' : (val > 0 && p.status === 'TODO' ? 'IN_PROGRESS' : p.status)
                        }));
                      }}
                      className="w-14 px-2 py-1 text-center text-sm font-bold border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-900 outline-none"
                    />
                    <span>%</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={editFormData.completionPercentage}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setEditFormData(p => ({
                      ...p,
                      completionPercentage: val,
                      status: val === 100 ? 'DONE' : (val > 0 && p.status === 'TODO' ? 'IN_PROGRESS' : p.status)
                    }));
                  }}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />

                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                  <span>0% (Not Started)</span>
                  <span>50% (In Progress)</span>
                  <span>100% (Completed)</span>
                </div>
              </div>

              {/* Dates & Hours */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Start Date</label>
                  <input
                    type="date"
                    value={editFormData.startDate}
                    onChange={(e) => setEditFormData(p => ({ ...p, startDate: e.target.value }))}
                    className="p-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Due Date</label>
                  <input
                    type="date"
                    value={editFormData.dueDate}
                    onChange={(e) => setEditFormData(p => ({ ...p, dueDate: e.target.value }))}
                    className="p-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Est. Hours</label>
                  <input
                    type="number"
                    value={editFormData.estimatedHours}
                    onChange={(e) => setEditFormData(p => ({ ...p, estimatedHours: e.target.value }))}
                    className="p-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Actual Hours</label>
                  <input
                    type="number"
                    value={editFormData.actualHours}
                    onChange={(e) => setEditFormData(p => ({ ...p, actualHours: e.target.value }))}
                    className="p-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Description</label>
                <textarea
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder="Describe the task details, deliverables, and acceptance criteria..."
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none resize-y"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                disabled={isSavingEdit}
                onClick={() => setEditModalTask(null)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingEdit}
                onClick={handleSaveEdit}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSavingEdit ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                ) : (
                  <><Check className="w-4 h-4" /> Save Changes</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => !isDeleting && setDeleteModalTask(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-xl flex-shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Delete Project Task</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Are you sure you want to delete <span className="font-bold text-gray-900 dark:text-white">{deleteModalTask.title}</span> (<span className="font-mono text-blue-600 font-bold">{deleteModalTask.taskNumber || deleteModalTask.taskCode}</span>)? This will permanently remove the task and synchronize schedule progress.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteModalTask(null)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteTask}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Deleting...</>
                ) : (
                  <><Trash2 className="w-3.5 h-3.5" /> Confirm Delete</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Drawer */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 h-full flex flex-col shadow-2xl border-l border-gray-200 dark:border-gray-800 animate-in slide-in-from-right">
            <div className="flex-none p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
              <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2"><SlidersHorizontal className="w-5 h-5 text-blue-600" /> Task Filters</h2>
              <button onClick={() => setIsFilterOpen(false)} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {[
                { key: 'status', label: 'Status', options: ['TODO', 'IN_PROGRESS', 'REVIEW', 'BLOCKED', 'COMPLETED', 'OVERDUE'] },
                { key: 'priority', label: 'Priority', options: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
              ].map(f => (
                <div key={f.key}>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{f.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {f.options.map(o => (
                      <button key={o} onClick={() => setFilters(prev => ({ ...prev, [f.key]: o === prev[f.key] ? '' : o }))} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${filters[f.key] === o ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>{o.replace('_', ' ')}</button>
                    ))}
                  </div>
                </div>
              ))}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Project</p>
                <select value={filters.project || ''} onChange={e => setFilters(prev => ({ ...prev, project: e.target.value }))} className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none">
                  <option value="">All Projects</option>
                  {projects.map((p: any) => <option key={p.id} value={p.id}>{p.projectName}</option>)}
                </select>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Planning / Master Schedule</p>
                <select value={filters.planning || ''} onChange={e => setFilters(prev => ({ ...prev, planning: e.target.value }))} className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none">
                  <option value="">All Schedules</option>
                  {plannings.map((pl: any) => <option key={pl.id} value={pl.id}>{pl.planCode} • {pl.planName}</option>)}
                </select>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Assigned To</p>
                <select value={filters.assignee || ''} onChange={e => setFilters(prev => ({ ...prev, assignee: e.target.value }))} className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none">
                  <option value="">All Members</option>
                  {users.map((u: any) => <option key={u.id || u._id} value={u.id || u._id}>{u.name || u.email || 'Unknown Employee'}</option>)}
                </select>
              </div>
            </div>
            <div className="flex-none p-5 border-t border-gray-100 dark:border-gray-800 flex gap-3 bg-white dark:bg-gray-900">
              <button onClick={() => setFilters({})} className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-black uppercase tracking-wider hover:bg-gray-200 transition-colors">Clear</button>
              <button onClick={() => setIsFilterOpen(false)} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-black uppercase tracking-wider hover:bg-blue-700 shadow-md transition-colors">Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
