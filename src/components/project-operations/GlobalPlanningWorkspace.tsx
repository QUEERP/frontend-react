import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Calendar, Clock, Users, DollarSign, AlertTriangle, CheckCircle, FileText, Download, Filter, X, ChevronDown, Briefcase, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import {  useParams  } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";

const StatusBadge = ({ status }: { status: string }) => {
  const colors: any = {
    'DRAFT': 'bg-gray-100 text-gray-700',
    'PLANNING': 'bg-blue-100 text-blue-700',
    'ACTIVE': 'bg-green-100 text-green-700',
    'ON_HOLD': 'bg-orange-100 text-orange-700',
    'COMPLETED': 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors[status] || colors['DRAFT']}`}>
      {(status || 'DRAFT').replace('_', ' ')}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const colors: any = {
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
  const businessId = (propBusinessId || params?.businessId) as string;
  const { toast } = useToast();

  const [plannings, setPlannings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedPlanning, setSelectedPlanning] = useState<any>(null);

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
      setPlannings(data.plannings || []);
    } catch (err) {
      console.error('Failed to load plannings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlannings(); }, [businessId]);

  const filtered = useMemo(() => {
    return plannings.filter(p => {
      const s = search.toLowerCase();
      if (s && !(p.planName || '').toLowerCase().includes(s) && !(p.planCode || '').toLowerCase().includes(s) && !(p.project?.projectName || '').toLowerCase().includes(s)) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      if (priorityFilter && p.priority !== priorityFilter) return false;
      return true;
    });
  }, [plannings, search, statusFilter, priorityFilter]);

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
          <span className="text-blue-600">Planning</span>
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
              <button onClick={() => { setSearch(''); setStatusFilter(''); setPriorityFilter(''); }} className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold flex items-center gap-1">
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map(p => (
                    <tr
                      key={p.id}
                      className="hover:bg-blue-50/30 dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedPlanning(p)}
                    >
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{p.planCode}</span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white max-w-[180px] truncate">{p.planName}</td>
                      <td className="px-5 py-4 text-gray-600 dark:text-gray-400 text-xs">{p.project?.projectCode} - {p.project?.projectName}</td>
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

      {/* Detail Drawer */}
      {selectedPlanning && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedPlanning(null)} />
          <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right border-l border-gray-200 dark:border-gray-800 overflow-y-auto">
            <div className="flex-none p-5 border-b border-gray-200 dark:border-gray-800 flex items-start justify-between bg-gray-50 dark:bg-gray-900/50">
              <div>
                <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-bold">{selectedPlanning.planCode}</span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-1">{selectedPlanning.planName}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{selectedPlanning.project?.projectCode} — {selectedPlanning.project?.projectName}</p>
              </div>
              <button onClick={() => setSelectedPlanning(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Status Row */}
              <div className="flex gap-2 flex-wrap">
                <StatusBadge status={selectedPlanning.status} />
                <PriorityBadge priority={selectedPlanning.priority} />
                {selectedPlanning.execType && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">{selectedPlanning.execType}</span>}
                {selectedPlanning.criticalTask && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">CRITICAL</span>}
                {selectedPlanning.recurring && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700">RECURRING</span>}
              </div>

              {selectedPlanning.description && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-400">{selectedPlanning.description}</div>
              )}

              <Section title="General">
                <Row label="Phase" value={selectedPlanning.phase} />
                <Row label="Sprint / Iteration" value={selectedPlanning.sprint} />
                <Row label="Department" value={selectedPlanning.department} />
              </Section>

              <Section title="Timeline">
                <Row label="Start Date" value={fmt(selectedPlanning.startDate)} />
                <Row label="End Date" value={fmt(selectedPlanning.endDate)} />
                <Row label="Expected Completion" value={fmt(selectedPlanning.expectedCompletion)} />
                <Row label="Duration (Days)" value={selectedPlanning.duration} />
                <Row label="Working Days" value={selectedPlanning.workingDays} />
                <Row label="Milestone" value={selectedPlanning.milestone} />
                <Row label="Dependency" value={selectedPlanning.dependency} />
              </Section>

              <Section title="Resource Allocation">
                <Row label="Est. Hours" value={selectedPlanning.estimatedHours} />
                <Row label="Billable Hours" value={selectedPlanning.billableHours} />
                <Row label="Resources" value={selectedPlanning.resources} />
                <Row label="Resource Cost" value={selectedPlanning.resourceCost ? `$${selectedPlanning.resourceCost.toLocaleString()}` : null} />
              </Section>

              <Section title="Scheduling">
                <Row label="Task" value={selectedPlanning.taskTitle} />
                <Row label="Sub Task" value={selectedPlanning.subTask} />
                <Row label="Sequence" value={selectedPlanning.sequence} />
                <Row label="Reminder (Days)" value={selectedPlanning.reminder} />
              </Section>

              <Section title="Progress">
                <Row label="Initial Progress" value={selectedPlanning.initialProgress != null ? `${selectedPlanning.initialProgress}%` : null} />
                <Row label="Current Progress" value={selectedPlanning.currentProgress != null ? `${selectedPlanning.currentProgress}%` : null} />
                <Row label="Completion" value={`${selectedPlanning.completionPercentage || 0}%`} />
                <Row label="Progress Status" value={selectedPlanning.progressStatus} />
                <Row label="Risk Level" value={selectedPlanning.riskLevel} />
              </Section>

              <Section title="Budget">
                <Row label="Estimated Cost" value={selectedPlanning.estimatedCost ? `$${selectedPlanning.estimatedCost.toLocaleString()}` : null} />
                <Row label="Actual Cost" value={selectedPlanning.actualCost ? `$${selectedPlanning.actualCost.toLocaleString()}` : null} />
                <Row label="Variance" value={selectedPlanning.variance ? `$${selectedPlanning.variance.toLocaleString()}` : null} />
                <Row label="Currency" value={selectedPlanning.currency} />
              </Section>

              {(selectedPlanning.comments || selectedPlanning.privateNotes || selectedPlanning.approvals) && (
                <Section title="Internal Notes">
                  <Row label="Comments" value={selectedPlanning.comments} />
                  <Row label="Approvals" value={selectedPlanning.approvals} />
                </Section>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pb-1 border-b border-gray-100 dark:border-gray-800">{title}</h4>
    <div className="space-y-2">{children}</div>
  </div>
);

const Row = ({ label, value }: { label: string; value: any }) => {
  if (value == null || value === '' || value === 0) return null;
  return (
    <div className="flex justify-between items-start text-sm">
      <span className="text-gray-500 text-xs font-medium">{label}</span>
      <span className="text-gray-900 dark:text-white text-xs font-semibold text-right max-w-[60%]">{String(value)}</span>
    </div>
  );
};
