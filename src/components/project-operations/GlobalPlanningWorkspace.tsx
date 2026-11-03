import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, Calendar, Clock, Users, DollarSign, AlertTriangle,
  CheckCircle, FileText, Download, Filter, X, ChevronDown, Briefcase,
  Target, MoreVertical, Eye, Edit, Trash2, ArrowUpRight, RotateCcw
} from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    'DRAFT': 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    'PLANNING': 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    'ACTIVE': 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    'ON_HOLD': 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
    'COMPLETED': 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors[status] || colors['DRAFT']}`}>
      {(status || 'DRAFT').replace('_', ' ')}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const colors: Record<string, string> = {
    'Low': 'bg-gray-100 text-gray-600',
    'Medium': 'bg-yellow-100 text-yellow-700',
    'High': 'bg-orange-100 text-orange-700',
    'Critical': 'bg-red-100 text-red-700',
  };
  return priority ? (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${colors[priority] || colors['Medium']}`}>
      {priority}
    </span>
  ) : null;
};

export function GlobalPlanningWorkspace({ businessId: propBusinessId }: { businessId?: string }) {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const projectIdParam = searchParams.get('projectId');
  const businessId = (propBusinessId || params?.businessId) as string;
  const { toast } = useToast();
  const navigate = useNavigate();

  const [plannings, setPlannings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteModalPlan, setDeleteModalPlan] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggleComplete = async (plan: any, targetStatus?: string) => {
    const nextStatus = targetStatus || (plan.status === 'COMPLETED' ? 'ACTIVE' : 'COMPLETED');
    const isCompleted = nextStatus === 'COMPLETED';
    try {
      setTogglingId(plan.id);
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '');
      const payload = {
        status: nextStatus,
        completionPercentage: isCompleted ? 100 : 0,
        currentProgress: isCompleted ? 100 : 0,
        progressStatus: isCompleted ? 'Completed' : 'In Progress'
      };
      const res = await fetch(`${API_BASE}/api/projects/global/plannings/${plan.id}`, {
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
        throw new Error(data.message || 'Failed to update schedule status');
      }
      toast({
        title: isCompleted ? "Schedule Completed" : "Schedule Reopened",
        description: isCompleted
          ? `"${plan.planName}" (${plan.planCode}) marked as 100% completed.`
          : `"${plan.planName}" reopened as Active.`
      });
      await fetchPlannings();
    } catch (err: any) {
      toast({
        title: "Update Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setTogglingId(null);
    }
  };

  useEffect(() => {
    function handleDocClick(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest('.action-menu-container')) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  const getToken = () => {
    let token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('accessToken')) : '';
    if (!token || token === 'null' || token === 'undefined') {
      token = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1] ||
        document.cookie.split('; ').find(r => r.startsWith('accessToken='))?.split('=')[1] || '';
    }
    return token;
  };

  const fetchPlannings = async () => {
    if (!businessId) return;
    try {
      setLoading(true);
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '');
      const res = await fetch(`${API_BASE}/api/projects/global/plannings`, {
        headers: { 'Authorization': `Bearer ${getToken()}`, 'x-business-id': businessId }
      });
      const data = await res.json();
      const list = data.plannings || [];
      setPlannings(list);
    } catch (err) {
      console.error('Failed to load plannings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlannings(); }, [businessId]);

  const confirmDeletePlanning = async () => {
    if (!deleteModalPlan || !businessId) return;
    try {
      setIsDeleting(true);
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '');
      const res = await fetch(`${API_BASE}/api/projects/global/plannings/${deleteModalPlan.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'x-business-id': businessId
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete planning schedule');
      }
      toast({
        title: "Schedule Deleted",
        description: `Plan "${deleteModalPlan.planName}" (${deleteModalPlan.planCode}) has been removed.`
      });
      setDeleteModalPlan(null);
      fetchPlannings();
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

  const filtered = useMemo(() => {
    return plannings.filter(p => {
      if (projectIdParam && p.projectId !== projectIdParam && p.project?.id !== projectIdParam) {
        return false;
      }
      const s = search.toLowerCase();
      if (s && !(p.planName || '').toLowerCase().includes(s) && !(p.planCode || '').toLowerCase().includes(s) && !(p.project?.projectName || '').toLowerCase().includes(s)) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      if (priorityFilter && p.priority !== priorityFilter) return false;
      return true;
    });
  }, [plannings, search, statusFilter, priorityFilter, projectIdParam]);

  const totalPlans = plannings.length;
  const activePlans = plannings.filter(p => p.status === 'ACTIVE').length;
  const totalEstCost = plannings.reduce((sum, p) => sum + (p.estimatedCost || 0), 0);
  const avgCompletion = plannings.length > 0
    ? Math.round(plannings.reduce((sum, p) => sum + (p.completionPercentage || 0), 0) / plannings.length)
    : 0;

  const fmt = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Header */}
      <div className="flex-none px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          <span>Project Operations</span><span className="text-gray-300">/</span>
          <span>Execution</span><span className="text-gray-300">/</span>
          <span className="text-blue-600 font-bold">Planning</span>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Global Planning</h1>
            <p className="text-sm text-gray-500 mt-1">Manage master schedules, timelines, and dependencies.</p>
          </div>
          <div className="flex gap-3">
            <Link to={`/dashboard/${businessId}/project-operations/planning/create`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Master Schedule
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Schedules', value: totalPlans, icon: Briefcase, color: 'blue' },
            { label: 'Active', value: activePlans, icon: CheckCircle, color: 'green' },
            { label: 'Avg Completion', value: `${avgCompletion}%`, icon: Target, color: 'purple' },
            { label: 'Total Est. Cost', value: `$${totalEstCost.toLocaleString()}`, icon: DollarSign, color: 'orange' },
          ].map((card, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
              <div className={`p-2.5 rounded-lg bg-${card.color}-50 dark:bg-${card.color}-900/20 text-${card.color}-600`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{card.label}</p>
                <p className="text-xl font-black text-gray-900 dark:text-white">{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by plan name, code, or project..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none">
              <option value="">All Statuses</option>
              {['DRAFT', 'PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none">
              <option value="">All Priorities</option>
              {['Low', 'Medium', 'High', 'Critical'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {(statusFilter || priorityFilter || search) && (
              <button onClick={() => { setSearch(''); setStatusFilter(''); setPriorityFilter(''); }} className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold flex items-center gap-1 cursor-pointer">
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center h-64 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-gray-500">Loading Planning Schedules...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <Calendar className="w-12 h-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-1">No Planning Schedules Found</h3>
            <p className="text-sm text-gray-400 mb-4">Create your first master schedule to get started.</p>
            <Link to={`/dashboard/${businessId}/project-operations/planning/create`} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Master Schedule
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 text-[11px] font-black text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5 whitespace-nowrap">Plan Code</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Plan Name</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Project</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Phase / Model</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Status</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Priority</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Timeline</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Tasks</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Completion</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Est. Cost</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Risk</th>
                    <th className="px-4 py-3.5 whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map(p => {
                    const isCompleted = p.status === 'COMPLETED';
                    const isToggling = togglingId === p.id;
                    const hasPhase = Boolean(p.phase);
                    const taskCount = (p.tasks && p.tasks.length) || (p.taskTitle ? 1 : 0);

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-blue-50/40 dark:hover:bg-gray-800/40 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/dashboard/${businessId}/project-operations/planning/${p.id}`)}
                      >
                        {/* Plan Code */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-md border border-blue-100 dark:border-blue-800/60 whitespace-nowrap shadow-2xs">
                            {p.planCode}
                          </span>
                        </td>

                        {/* Plan Name */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="font-semibold text-gray-900 dark:text-white block max-w-[200px] truncate group-hover:text-blue-600 transition-colors" title={p.planName}>
                            {p.planName}
                          </span>
                        </td>

                        {/* Project */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {p.project ? (
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="font-mono text-[11px] font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 whitespace-nowrap">
                                {p.project.projectCode}
                              </span>
                              <span className="font-medium text-gray-700 dark:text-gray-300 max-w-[140px] truncate" title={p.project.projectName}>
                                {p.project.projectName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>

                        {/* Phase / Model */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                          {hasPhase ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                              {p.phase}
                            </span>
                          ) : (p.sprint || p.execType) ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              {p.sprint || p.execType}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <StatusBadge status={p.status} />
                        </td>

                        {/* Priority */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <PriorityBadge priority={p.priority} />
                        </td>

                        {/* Timeline */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex flex-col text-xs leading-tight">
                            <span className="font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                              {fmt(p.startDate)} → {fmt(p.endDate)}
                            </span>
                            {p.duration ? (
                              <span className="text-[11px] text-gray-400 mt-0.5 font-medium">{p.duration} days</span>
                            ) : null}
                          </div>
                        </td>

                        {/* Tasks */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {taskCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                              {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>

                        {/* Completion */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${(p.completionPercentage || 0) >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                                  }`}
                                style={{ width: `${Math.min(100, Math.max(0, p.completionPercentage || 0))}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 w-8">
                              {p.completionPercentage || 0}%
                            </span>
                          </div>
                        </td>

                        {/* Est. Cost */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          ${(p.estimatedCost || 0).toLocaleString()}
                        </td>

                        {/* Risk Level */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {p.riskLevel ? (
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${p.riskLevel === 'High' || p.riskLevel === 'Critical' ? 'bg-red-100 text-red-700' : p.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                              {p.riskLevel}
                            </span>
                          ) : <span className="text-gray-400 text-xs">—</span>}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-right action-menu-container" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {/* Complete Button */}
                            {isCompleted ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleComplete(p, 'ACTIVE');
                                }}
                                disabled={isToggling}
                                title="Schedule is completed. Click to reopen as Active."
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-all cursor-pointer shadow-2xs"
                              >
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Completed</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleComplete(p, 'COMPLETED');
                                }}
                                disabled={isToggling}
                                title="Mark schedule and all connected tasks as completed"
                                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-lg transition-all cursor-pointer shadow-xs disabled:opacity-50"
                              >
                                {isToggling ? (
                                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <CheckCircle className="w-3.5 h-3.5" />
                                )}
                                <span>Complete</span>
                              </button>
                            )}

                            {/* Three Dots Menu */}
                            <div className="relative inline-block text-left">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(openMenuId === p.id ? null : p.id);
                                }}
                                title="Actions menu"
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {openMenuId === p.id && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      handleToggleComplete(p, isCompleted ? 'ACTIVE' : 'COMPLETED');
                                    }}
                                    className={`w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${isCompleted
                                        ? 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                                        : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                                      }`}
                                  >
                                    {isCompleted ? <RotateCcw className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                    <span>{isCompleted ? 'Reopen Schedule' : 'Mark as Completed'}</span>
                                  </button>
                                  <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      navigate(`/dashboard/${businessId}/project-operations/planning/${p.id}`);
                                    }}
                                    className="w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center gap-2.5 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                                    <span>View Details</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      navigate(`/dashboard/${businessId}/project-operations/planning/${p.id}/edit`);
                                    }}
                                    className="w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center gap-2.5 text-gray-700 dark:text-gray-200 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-600 transition-colors cursor-pointer"
                                  >
                                    <Edit className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Edit Schedule</span>
                                  </button>
                                  <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      setDeleteModalPlan(p);
                                    }}
                                    className="w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center gap-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs text-gray-500">
              <span>Showing <span className="font-bold text-gray-800 dark:text-gray-200">{filtered.length}</span> of <span className="font-bold">{plannings.length}</span> schedules</span>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalPlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => !isDeleting && setDeleteModalPlan(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-xl flex-shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Delete Planning Schedule</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Are you sure you want to delete <span className="font-bold text-gray-900 dark:text-white">{deleteModalPlan.planName}</span> (<span className="font-mono text-blue-600 font-bold">{deleteModalPlan.planCode}</span>)? This will permanently remove this planning schedule and its milestones.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteModalPlan(null)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeletePlanning}
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
    </div>
  );
}
