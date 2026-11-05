import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Flag, Plus, Calendar, DollarSign, CheckCircle, AlertTriangle, Clock, ArrowRight, Layers
} from 'lucide-react';
import { StatusBadge } from '@/components/project-operations/StatusBadge';
import { ProgressBar } from '@/components/project-operations/ProgressBar';

export function MilestoneWorkspace({ project }: { project: any }) {
  const { businessId } = useParams() as any;
  const navigate = useNavigate();

  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const projectId = project?.id || project?._id;

  useEffect(() => {
    if (!projectId) return;
    const fetchMilestones = async () => {
      setLoading(true);
      try {
        const API = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '');
        let token = localStorage.getItem('token');
        if (!token || token === 'null' || token === 'undefined') {
          token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] ||
            document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1] || '';
        }
        const res = await fetch(`${API}/api/milestones?projectId=${projectId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-business-id': businessId || ''
          }
        });
        const data = await res.json();
        if (data?.success && data?.milestones) {
          setMilestones(data.milestones);
        }
      } catch (err) {
        console.error('Error fetching project milestones:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMilestones();
  }, [projectId, businessId]);

  // Summary Metrics
  const summary = useMemo(() => {
    const total = milestones.length;
    const completed = milestones.filter(m => m.status === 'COMPLETED' || m.completion === 100).length;
    const now = new Date();
    const overdue = milestones.filter(m =>
      m.dueDate && new Date(m.dueDate) < now && m.status !== 'COMPLETED' && m.status !== 'CANCELLED'
    ).length;

    // Upcoming next milestone
    const pending = milestones
      .filter(m => m.dueDate && new Date(m.dueDate) >= now && m.status !== 'COMPLETED' && m.status !== 'CANCELLED')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    const nextMilestone = pending[0] || null;

    // Total billing weight used
    const totalBillingWeight = milestones.reduce((sum, m) => sum + (m.isBilling ? (Number(m.weight) || 0) : 0), 0);

    return {
      total,
      completed,
      overdue,
      nextMilestone,
      totalBillingWeight: Math.min(100, parseFloat(totalBillingWeight.toFixed(1)))
    };
  }, [milestones]);

  const handleAddMilestone = () => {
    navigate(`/dashboard/${businessId}/project-operations/milestones/create?projectId=${projectId}`);
  };

  const handleOpenMilestone = (mId: string) => {
    navigate(`/dashboard/${businessId}/project-operations/milestones/${mId}`);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header with KPI cards */}
      <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Project Milestones</h3>
            <p className="text-xs text-gray-500">Track deliverables, payment weights and schedule targets</p>
          </div>
          <button
            onClick={handleAddMilestone}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Milestone
          </button>
        </div>

        {/* Milestone KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Total Milestones</span>
            <span className="text-xl font-black text-gray-900 dark:text-white">{summary.total}</span>
          </div>

          <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-lg border border-emerald-100/60 dark:border-emerald-900/30">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-0.5">Completed</span>
            <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">{summary.completed}</span>
          </div>

          <div className="p-3 bg-red-50/60 dark:bg-red-950/20 rounded-lg border border-red-100/60 dark:border-red-900/30">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 block mb-0.5">Overdue</span>
            <span className="text-xl font-black text-red-700 dark:text-red-300">{summary.overdue}</span>
          </div>

          <div className="p-3 bg-blue-50/60 dark:bg-blue-900/20 rounded-lg border border-blue-100/60 dark:border-blue-900/30">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-0.5">Billing Weight Used</span>
            <span className="text-xl font-black text-blue-700 dark:text-blue-300">{summary.totalBillingWeight}%</span>
          </div>

          <div className="col-span-2 md:col-span-1 p-3 bg-purple-50/60 dark:bg-purple-950/20 rounded-lg border border-purple-100/60 dark:border-purple-900/30">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block mb-0.5">Next Target</span>
            <span className="text-xs font-bold text-purple-900 dark:text-purple-200 truncate block">
              {summary.nextMilestone ? summary.nextMilestone.name : 'All completed / None'}
            </span>
            {summary.nextMilestone?.dueDate && (
              <span className="text-[10px] text-purple-600 dark:text-purple-400 block mt-0.5">
                Due {new Date(summary.nextMilestone.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Milestones Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading milestones...</span>
        </div>
      ) : milestones.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 text-center p-6">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-3">
            <Flag className="w-8 h-8 text-blue-500" />
          </div>
          <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1">No Milestones Defined Yet</h4>
          <p className="text-xs text-gray-500 max-w-sm mb-4">Add your first milestone to define deliverables, set payment gates, and track overall progress.</p>
          <button
            onClick={handleAddMilestone}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Milestone
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-4">
          {milestones.map(m => {
            const isOverdue = m.dueDate && new Date(m.dueDate) < new Date() && m.status !== 'COMPLETED' && m.status !== 'CANCELLED';
            return (
              <div
                key={m.id}
                onClick={() => handleOpenMilestone(m.id)}
                className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col group hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                      <Flag className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                    </div>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                      {m.milestoneCode}
                    </span>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${m.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                    m.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
                      m.status === 'DELAYED' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                    {m.status?.replace('_', ' ') || 'PLANNED'}
                  </span>
                </div>

                <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-1 leading-snug group-hover:text-blue-600 transition-colors">
                  {m.name}
                </h4>

                {m.planning && (
                  <p className="text-[11px] text-gray-400 mb-3 flex items-center gap-1 truncate">
                    <Layers className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{m.planning.planName}</span>
                  </p>
                )}

                <div className="space-y-2 mb-4 flex-1 text-xs">
                  <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Target: {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : '—'}</span>
                    {isOverdue && <span className="text-[10px] uppercase tracking-wider bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-bold ml-1">Overdue</span>}
                  </div>

                  {m.isBilling && (
                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-semibold">Billing Weight: <strong className="text-emerald-600 font-bold">{m.weight || 0}%</strong></span>
                    </div>
                  )}

                  {m.tasks && m.tasks.length > 0 && (
                    <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                      <span>{m.tasks.length} connected task{m.tasks.length > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between items-center text-[11px] font-bold text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{m.completion || 0}%</span>
                  </div>
                  <ProgressBar progress={m.completion || 0} showPercent={false} colorClass={m.completion === 100 ? 'bg-emerald-500' : 'bg-blue-600'} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
