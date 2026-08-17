import { toast } from 'sonner';
import React, { useState, useEffect, useMemo } from 'react';
import {  useParams  } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Search, Filter, CheckSquare, Plus, List, LayoutGrid, Clock, X, ChevronDown, Download, FileText, AlertTriangle, CheckCircle, Loader2, SlidersHorizontal, Activity } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '@/components/ui/use-toast';
import { API_ROOT } from "@/config/api";

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
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
  const { toast } = useToast();
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

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
        const [tRes, pRes, uRes] = await Promise.all([
          fetch(`${API}/api/projects/global/tasks`, { headers: h }),
          fetch(`${API}/api/projects`, { headers: h }),
          fetch(`${API}/api/employees`, { headers: h }),
        ]);
        const [td, pd, ud] = await Promise.all([tRes.json(), pRes.json(), uRes.json()]);
        setTasks(td.data || td.tasks || []);
        setProjects(pd.data || pd.projects || []);
        setUsers(ud.data || ud.users || []);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, [businessId]);

  const filtered = useMemo(() => {
    const s = debouncedSearch.toLowerCase();
    return tasks.filter(t => {
      if (s && ![(t.title || ''), (t.taskCode || ''), (t.project?.projectName || ''), (t.assignee?.name || ''), (t.milestone || '')].some(v => v.toLowerCase().includes(s))) return false;
      if (filters.status && t.status !== filters.status) return false;
      if (filters.priority && t.priority !== filters.priority) return false;
      if (filters.project && t.projectId !== filters.project) return false;
      if (filters.assignee && t.assigneeId !== filters.assignee) return false;
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
            <Link to={`/dashboard/${businessId || 'loading'}/project-operations/tasks/create`} onClick={(e) => { if(!businessId) e.preventDefault(); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm transition-colors">
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
              <Link to={`/dashboard/${businessId || 'loading'}/project-operations/tasks/create`} onClick={(e) => { if(!businessId) e.preventDefault(); }} className="px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"><Plus className="w-4 h-4" /> Create Task</Link>
            )}
          </div>
        ) : view === 'list' ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-[10px] text-gray-500 uppercase tracking-widest border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-5 py-3.5">Task</th>
                    <th className="px-5 py-3.5">Project</th>
                    <th className="px-5 py-3.5">Milestone</th>
                    <th className="px-5 py-3.5">Assignee</th>
                    <th className="px-5 py-3.5">Priority</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Progress</th>
                    <th className="px-5 py-3.5">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map(t => {
                    const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED';
                    return (
                      <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group cursor-pointer">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <CheckSquare className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white">{t.title}</p>
                              <p className="text-[10px] text-gray-400">{t.taskCode || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300 text-xs">{t.project?.projectName || t.project?.name || '-'}</td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs">{t.milestone || '-'}</td>
                        <td className="px-5 py-3.5">
                          {t.assignee ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center text-[10px] font-black">{(t.assignee?.name || 'U')[0].toUpperCase()}</div>
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t.assignee?.name}</span>
                            </div>
                          ) : <span className="text-gray-400 text-xs">Unassigned</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.MEDIUM}`}>{t.priority || 'MEDIUM'}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${STATUS_COLORS[t.status] || STATUS_COLORS.TODO}`}>{(t.status || 'TODO').replace('_', ' ')}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${t.progress || 0}%` }}></div>
                            </div>
                            <span className="text-[10px] font-bold text-gray-500">{t.progress || 0}%</span>
                          </div>
                        </td>
                        <td className={`px-5 py-3.5 text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                          {isOverdue && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                          {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}
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
                <div key={col} className="min-w-[260px] max-w-[260px] bg-gray-100 dark:bg-gray-800/50 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between px-1 mb-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${STATUS_COLORS[col] || ''}`}>{col.replace('_', ' ')}</span>
                    <span className="w-5 h-5 bg-white dark:bg-gray-700 rounded-full text-[10px] font-black text-gray-600 dark:text-gray-300 flex items-center justify-center shadow-sm">{colTasks.length}</span>
                  </div>
                  {colTasks.map(t => (
                    <div key={t.id} className="bg-white dark:bg-gray-900 rounded-lg p-3.5 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <p className="text-xs font-bold text-gray-900 dark:text-white mb-1.5 leading-snug">{t.title}</p>
                      <p className="text-[10px] text-gray-400 mb-2">{t.project?.projectName || ''}</p>
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.MEDIUM}`}>{t.priority || 'MED'}</span>
                        {t.assignee && <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-black flex items-center justify-center">{(t.assignee?.name || 'U')[0]}</div>}
                      </div>
                      {t.dueDate && <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-400"><Clock className="w-3 h-3" />{new Date(t.dueDate).toLocaleDateString()}</div>}
                    </div>
                  ))}
                  {colTasks.length === 0 && <div className="py-6 text-center text-xs text-gray-400 font-medium">No tasks</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>

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
