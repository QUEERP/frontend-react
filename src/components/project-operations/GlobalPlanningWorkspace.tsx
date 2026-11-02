import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, Calendar, Clock, Users, DollarSign, AlertTriangle,
  CheckCircle, FileText, Download, Filter, X, ChevronDown, Briefcase,
  Target, MoreVertical, Eye, Edit, Trash2, ArrowUpRight
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
    let token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    if (!token || token === 'null') {
      token = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1] || '';
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
                <thead className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700 text-[11px] font-black text-gray-500 uppercase tracking-widest">
                  <tr>
                    <th className="px-5 py-4">Plan Code</th>
                    <th className="px-5 py-4">Plan Name</th>
                    <th className="px-5 py-4">Project</th>
                    <th className="px-5 py-4">Phase</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Priority</th>
                    <th className="px-5 py-4">Start Date</th>
                    <th className="px-5 py-4">End Date</th>
                    <th className="px-5 py-4">Task</th>
                    <th className="px-5 py-4">Completion</th>
                    <th className="px-5 py-4">Est. Cost</th>
                    <th className="px-5 py-4">Risk Level</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map(p => (
                    <tr
                      key={p.id}
                      className="hover:bg-blue-50/40 dark:hover:bg-gray-800/40 transition-colors cursor-pointer"
                      onClick={() => navigate(`/dashboard/${businessId}/project-operations/planning/${p.id}`)}
                    >
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">{p.planCode}</span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white max-w-[180px] truncate">{p.planName}</td>
                      <td className="px-5 py-4 text-gray-600 dark:text-gray-400 text-xs">
                        {p.project ? `${p.project.projectCode} - ${p.project.projectName}` : '—'}
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-xs">{p.phase || '-'}</td>
                      <td className="px-5 py-4"><StatusBadge status={p.status} /></td>
                      <td className="px-5 py-4"><PriorityBadge priority={p.priority} /></td>
                      <td className="px-5 py-4 text-xs text-gray-500">{fmt(p.startDate)}</td>
                      <td className="px-5 py-4 text-xs text-gray-500">{fmt(p.endDate)}</td>
                      <td className="px-5 py-4 text-xs text-gray-700 dark:text-gray-300 max-w-[140px] truncate">{p.taskTitle || '-'}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden w-16">
                            <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${p.completionPercentage || 0}%` }} />
                          </div>
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{p.completionPercentage || 0}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs font-bold text-green-700">${(p.estimatedCost || 0).toLocaleString()}</td>
                      <td className="px-5 py-4">
                        {p.riskLevel ? (
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${p.riskLevel === 'High' ? 'bg-red-100 text-red-700' : p.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                            {p.riskLevel}
                          </span>
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-5 py-4 text-right action-menu-container" onClick={(e) => e.stopPropagation()}>
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
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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
                      </td>
                    </tr>
                  ))}
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
