import { toast } from 'sonner';
import React, { useState, useEffect, useMemo } from 'react';
import {  useParams  } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Search, Filter, Flag, CalendarCheck, AlertTriangle, Plus, List, LayoutGrid, Download, FileText, CheckCircle, ChevronDown, CheckSquare, Activity, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '@/components/ui/use-toast';
import { API_ROOT } from "@/config/api";

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PLANNED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  PENDING_REVIEW: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  DELAYED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  AT_RISK: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  CANCELLED: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function GlobalMilestonesWorkspace({ businessId: propBusinessId }: { businessId?: string }) {
  const params = useParams();
  const businessId = (propBusinessId || params?.businessId) as string;
  const { toast } = useToast();
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [milestones, setMilestones] = useState<any[]>([]);
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
        const token = localStorage.getItem('token') || '';
        const h = { 'Authorization': `Bearer ${token}`, 'x-business-id': businessId };
        const [mRes, pRes, uRes] = await Promise.all([
          fetch(`${API}/api/projects/global/milestones`, { headers: h }).catch(() => ({ json: () => ({}) })),
          fetch(`${API}/api/projects`, { headers: h }).catch(() => ({ json: () => ({}) })),
          fetch(`${API}/api/employees`, { headers: h }).catch(() => ({ json: () => ({}) })),
        ]);
        const [md, pd, ud] = (await Promise.all([mRes.json?.() || [], pRes.json?.() || [], uRes.json?.() || []])) as any[];
        setMilestones(md?.data || md?.milestones || []);
        setProjects(pd?.data || pd?.projects || []);
        setUsers(ud?.data || ud?.users || []);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, [businessId]);

  const filtered = useMemo(() => {
    const s = debouncedSearch.toLowerCase();
    return milestones.filter(m => {
      if (s && ![(m.name || ''), (m.milestoneCode || ''), (m.project?.projectName || ''), (m.owner?.name || ''), (m.category || '')].some(v => v.toLowerCase().includes(s))) return false;
      if (filters.status && m.status !== filters.status) return false;
      if (filters.priority && m.priority !== filters.priority) return false;
      if (filters.project && m.projectId !== filters.project) return false;
      if (filters.owner && m.ownerId !== filters.owner) return false;
      return true;
    });
  }, [milestones, debouncedSearch, filters]);

  const kpis = useMemo(() => {
    const now = new Date();
    const eow = new Date(now); eow.setDate(now.getDate() + (7 - now.getDay()));
    const eom = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
      upcoming: filtered.filter(m => m.status === 'PLANNED' || m.status === 'IN_PROGRESS').length,
      completed: filtered.filter(m => m.status === 'COMPLETED').length,
      delayed: filtered.filter(m => m.status === 'DELAYED').length,
      atRisk: filtered.filter(m => m.status === 'AT_RISK').length,
      dueWeek: filtered.filter(m => m.dueDate && new Date(m.dueDate) <= eow && m.status !== 'COMPLETED').length,
      dueMonth: filtered.filter(m => m.dueDate && new Date(m.dueDate) <= eom && m.status !== 'COMPLETED').length,
    };
  }, [filtered]);

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
      
                        
      const res = await fetch(`${API_ROOT}/milestones/export/${type}`, {
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
      a.download = `Milestones_${new Date().toISOString().split('T')[0]}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
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

  const kanbanCols = ['PLANNED', 'IN_PROGRESS', 'PENDING_REVIEW', 'DELAYED', 'COMPLETED'];

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 overflow-hidden relative">
      <div className="flex-none px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Project Milestones</h1>
            <p className="text-sm text-gray-500 mt-0.5">Track key deliverables and payment milestones across all projects.</p>
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
            <Link to={`/dashboard/${businessId || 'loading'}/project-operations/milestones/create`} onClick={(e) => { if (!businessId) e.preventDefault(); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm transition-colors">
              <Plus className="w-4 h-4" /> New Milestone
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Upcoming', val: kpis.upcoming, color: 'text-blue-600' },
            { label: 'Completed', val: kpis.completed, color: 'text-emerald-600' },
            { label: 'Delayed', val: kpis.delayed, color: 'text-red-600' },
            { label: 'At Risk', val: kpis.atRisk, color: 'text-pink-600' },
            { label: 'Due This Week', val: kpis.dueWeek, color: 'text-orange-600' },
            { label: 'Due This Month', val: kpis.dueMonth, color: 'text-indigo-600' },
          ].map((k, i) => (
            <div key={i} className={`bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm`}>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{k.label}</p>
              <p className={`text-3xl font-black ${k.color}`}>{k.val}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search milestones, projects..." className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 transition-all" />
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

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading Milestones...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-5 relative">
              <Flag className="w-10 h-10 text-blue-500" />
              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 p-1.5 rounded-full border border-gray-100 dark:border-gray-800 shadow"><Plus className="w-4 h-4 text-orange-500" /></div>
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{search || Object.keys(filters).length ? 'No Matching Milestones' : 'No Milestones Found'}</h3>
            <p className="text-sm text-gray-500 text-center max-w-sm mb-6">{search || Object.keys(filters).length ? 'Try clearing your search or filters.' : 'Create your first milestone to begin tracking project progress.'}</p>
            {search || Object.keys(filters).length > 0 ? (
              <button onClick={() => { setSearch(''); setFilters({}); }} className="px-5 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-bold">Clear Filters</button>
            ) : (
              <Link to={`/dashboard/${businessId || 'loading'}/project-operations/milestones/create`} onClick={(e) => { if (!businessId) e.preventDefault(); }} className="px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"><Plus className="w-4 h-4" /> Create Milestone</Link>
            )}
          </div>
        ) : view === 'list' ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-[10px] text-gray-500 uppercase tracking-widest border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-5 py-3.5">Milestone</th>
                    <th className="px-5 py-3.5">Project</th>
                    <th className="px-5 py-3.5">Owner</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Target Date</th>
                    <th className="px-5 py-3.5">Payment %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map(m => {
                    const isDelayed = m.status === 'DELAYED' || (m.dueDate && new Date(m.dueDate) < new Date() && m.status !== 'COMPLETED');
                    return (
                      <tr key={m.id || m._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group cursor-pointer">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Flag className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white">{m.name}</p>
                              <p className="text-[10px] text-gray-400">{m.milestoneCode || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300 text-xs">{m.project?.projectName || m.project?.name || '-'}</td>
                        <td className="px-5 py-3.5">
                          {m.owner ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center text-[10px] font-black">{(m.owner?.name || 'U')[0].toUpperCase()}</div>
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{m.owner?.name}</span>
                            </div>
                          ) : <span className="text-gray-400 text-xs">Unassigned</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${STATUS_COLORS[m.status] || STATUS_COLORS.DRAFT}`}>{(m.status || 'DRAFT').replace('_', ' ')}</span>
                        </td>
                        <td className={`px-5 py-3.5 text-xs font-medium ${isDelayed ? 'text-red-500' : 'text-gray-500'}`}>
                          {isDelayed && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                          {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{m.weight ? `${m.weight}%` : '-'}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 items-start">
            {kanbanCols.map(status => {
              const colMilestones = filtered.filter(m => (m.status || 'DRAFT') === status);
              return (
                <div key={status} className="w-80 flex-shrink-0 bg-gray-100/50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[70vh]">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 rounded-t-xl sticky top-0 z-10">
                    <h3 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${status.includes('COMPLETED') ? 'bg-green-500' : status.includes('PROGRESS') ? 'bg-blue-500' : status.includes('DELAYED') ? 'bg-red-500' : 'bg-gray-400'}`} />
                      {status.replace('_', ' ')}
                    </h3>
                    <span className="text-[10px] font-bold bg-white dark:bg-gray-900 text-gray-500 px-2 py-0.5 rounded-full shadow-sm">{colMilestones.length}</span>
                  </div>
                  <div className="p-3 flex-1 overflow-y-auto space-y-3">
                    {colMilestones.map(m => (
                      <div key={m.id || m._id} className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm ${PRIORITY_COLORS[m.priority] || PRIORITY_COLORS.MEDIUM}`}>{m.priority || 'MEDIUM'}</span>
                          {m.weight && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">{m.weight}%</span>}
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm leading-tight mb-1">{m.name}</h4>
                        <p className="text-[10px] text-gray-500 mb-3 truncate">{m.project?.projectName || m.project?.name || '-'}</p>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                            <Activity className="w-3.5 h-3.5" /> {m.completion || 0}%
                          </div>
                          {m.owner && (
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 flex items-center justify-center text-[10px] font-black group-hover:ring-2 ring-blue-500 ring-offset-1 transition-all" title={m.owner.name}>
                              {m.owner.name[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isFilterOpen && (
        <div className="absolute inset-y-0 right-0 w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl z-50 flex flex-col transform transition-transform">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Filter className="w-4 h-4" /> Filters</h3>
            <button onClick={() => setIsFilterOpen(false)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Status</label>
              <select value={filters.status || ''} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))} className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none cursor-pointer">
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option><option value="PLANNED">Planned</option><option value="IN_PROGRESS">In Progress</option>
                <option value="PENDING_REVIEW">Pending Review</option><option value="COMPLETED">Completed</option><option value="DELAYED">Delayed</option><option value="AT_RISK">At Risk</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Priority</label>
              <select value={filters.priority || ''} onChange={e => setFilters(p => ({ ...p, priority: e.target.value }))} className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none cursor-pointer">
                <option value="">All Priorities</option>
                <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Project</label>
              <select value={filters.project || ''} onChange={e => setFilters(p => ({ ...p, project: e.target.value }))} className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none cursor-pointer">
                <option value="">All Projects</option>
                {projects.map(p => <option key={p.id || p._id} value={p.id || p._id}>{p.projectName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Owner</label>
              <select value={filters.owner || ''} onChange={e => setFilters(p => ({ ...p, owner: e.target.value }))} className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none cursor-pointer">
                <option value="">All Owners</option>
                {users.map(u => <option key={u.id || u._id} value={u.id || u._id}>{u.name || u.email || 'Unknown Employee'}</option>)}
              </select>
            </div>
          </div>
          <div className="p-5 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex gap-3">
            <button onClick={() => setFilters({})} className="flex-1 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors">Reset</button>
            <button onClick={() => setIsFilterOpen(false)} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">Apply</button>
          </div>
        </div>
      )}
    </div>
  );
}
