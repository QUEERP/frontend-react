import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  LayoutDashboard, Map, CheckSquare, Flag, Users, Calendar,
  FileText, Clock, Receipt, Package, ShoppingCart, DollarSign,
  AlertCircle, ShieldAlert, GitPullRequest, HeadphonesIcon,
  BarChart, Activity
} from 'lucide-react';
import { useBusinessData } from '@/components/dashboard/business-data-provider';
import { StatusBadge } from '@/components/project-operations/StatusBadge';

export default function ProjectDetailTabs({ project, businessId, onProjectUpdate }: { project: any, businessId: string, onProjectUpdate?: () => void }) {
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(urlTab || "overview");

  useEffect(() => {
    if (urlTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);
  const { business } = useBusinessData();
  const navigate = useNavigate();

  const allocations = project?.resourceAllocations || [];
  const tasks = project?.tasks || [];
  const milestones = project?.milestones || [];
  const timeEntries = project?.timeEntries || [];
  const issues = project?.issues || [];

  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      setUpdatingTaskId(taskId);
      const API = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '');
      let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token || token === 'null' || token === 'undefined') {
        token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] ||
          document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1] || '';
      }
      const res = await fetch(`${API}/api/projects/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-business-id': businessId
        },
        body: JSON.stringify({
          status: newStatus,
          completionPercentage: newStatus === 'DONE' ? 100 : (newStatus === 'IN_PROGRESS' ? 50 : 0)
        })
      });
      if (!res.ok) throw new Error('Failed to update task status');
      if (onProjectUpdate) onProjectUpdate();
    } catch (err: any) {
      console.error(err);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Determine which tabs to show based on Execution Type
  const tabs = useMemo(() => {
    const isService = project.executionType === "SERVICE" || project.executionType === "HYBRID";
    const isProduct = project.executionType === "PRODUCT" || project.executionType === "HYBRID";
    const isBasic = project.executionType === "BASIC" || business?.businessType?.toLowerCase() === 'basic';

    const allTabs = [
      { id: "overview", label: "Overview", icon: LayoutDashboard, show: true },
      { id: "resources", label: "Resources", icon: Users, show: !isBasic, count: allocations.length },
      { id: "tasks", label: "Tasks", icon: CheckSquare, show: !isBasic || tasks.length > 0, count: tasks.length },
      { id: "planning", label: "Planning", icon: Map, show: !isBasic || (project?.plannings && project.plannings.length > 0), count: (project?.plannings || []).length },
      { id: "milestones", label: "Milestones", icon: Flag, show: !isBasic && isService, count: milestones.length },
      { id: "time-tracking", label: "Time Tracking", icon: Clock, show: !isBasic && isService, count: timeEntries.length },
      { id: "issues", label: "Issues", icon: AlertCircle, show: !isBasic, count: issues.length },
      { id: "documents", label: "Documents", icon: FileText, show: !isBasic },
      { id: "billing", label: "Billing", icon: DollarSign, show: !isBasic },
      { id: "risks", label: "Risks", icon: ShieldAlert, show: !isBasic },
      { id: "timeline", label: "Activity Timeline", icon: Activity, show: !isBasic },
    ];

    return allTabs.filter(t => t.show);
  }, [project.executionType, project?.plannings, business?.businessType, allocations.length, tasks.length, milestones.length, timeEntries.length, issues.length]);

  return (
    <div>
      <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 scrollbar-hide px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = (tab as any).count;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-5 py-4 text-sm font-bold transition-colors border-b-2 whitespace-nowrap cursor-pointer ${isActive
                ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 bg-blue-50/50 dark:bg-gray-700/50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
              {typeof count === 'number' && (
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-6 min-h-[400px]">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
                <span className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Budget</span>
                <p className="text-2xl font-black mt-1 text-gray-900 dark:text-white">${Number(project.budget || 0).toLocaleString()}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
                <span className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Spent Cost</span>
                <p className="text-2xl font-black mt-1 text-red-600">${Number(project.actualCost || 0).toLocaleString()}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
                <span className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Remaining</span>
                <p className="text-2xl font-black mt-1 text-green-600">${(Number(project.budget || 0) - Number(project.actualCost || 0)).toLocaleString()}</p>
              </div>
              <div className="p-4 bg-blue-600 text-white rounded-xl shadow-md">
                <span className="text-xs font-semibold uppercase text-blue-200 tracking-wider">Progress</span>
                <p className="text-2xl font-black mt-1">{project.completionPercentage || 0}%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">Execution Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500">Allocated Resources</span>
                    <span className="font-bold text-gray-900 dark:text-white">{allocations.length}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500">Total Tasks</span>
                    <span className="font-bold text-gray-900 dark:text-white">{tasks.length}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500">Active Milestones</span>
                    <span className="font-bold text-gray-900 dark:text-white">{milestones.length}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Open Issues</span>
                    <span className="font-bold text-red-600">{issues.filter((i: any) => i.status !== 'CLOSED' && i.status !== 'RESOLVED').length}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">Project Meta</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500">Customer</span>
                    <span className="font-bold text-gray-900 dark:text-white">{project.customer?.name || project.customer?.company || 'Internal'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500">Project Manager</span>
                    <span className="font-bold text-gray-900 dark:text-white">{project.projectManager?.name || project.projectManager?.user?.name || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500">Start Date</span>
                    <span className="font-bold text-gray-900 dark:text-white">{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">End Date</span>
                    <span className="font-bold text-gray-900 dark:text-white">{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'TBD'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RESOURCES TAB */}
        {activeTab === 'resources' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Allocated Resources ({allocations.length})</h3>
              <button
                onClick={() => navigate(`/dashboard/${businessId}/project-operations/resources/create?projectId=${project.id}`)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                + Allocate Resource
              </button>
            </div>

            {allocations.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="font-semibold text-sm">No resources allocated to this project.</p>
                <button
                  onClick={() => navigate(`/dashboard/${businessId}/project-operations/resources/create?projectId=${project.id}`)}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
                >
                  Allocate Resource
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Member</th>
                      <th className="px-4 py-3">Role & Dept</th>
                      <th className="px-4 py-3">Assigned Task</th>
                      <th className="px-4 py-3">Period</th>
                      <th className="px-4 py-3">Allocation</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {allocations.map((a: any) => (
                      <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                          {a.employee?.name || a.employee?.email || 'Member'}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                          {a.role || 'Member'} • {a.department || '-'}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {a.task?.title || a.task?.taskNumber || 'Project-wide'}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {a.startDate ? new Date(a.startDate).toLocaleDateString() : 'Start'} → {a.endDate ? new Date(a.endDate).toLocaleDateString() : 'End'}
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-blue-600">
                          {a.allocationPercent || 100}% ({a.estimatedHours || 0} hrs)
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-700">
                            {a.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TASKS TAB */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold">Project Tasks ({tasks.length})</h3>
                <p className="text-xs text-gray-500 mt-0.5">Execution tasks connected to this project and its planning schedules.</p>
              </div>
              <button
                onClick={() => navigate(`/dashboard/${businessId}/project-operations/tasks/create?projectId=${project.id}`)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                + Create Task
              </button>
            </div>
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <CheckSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="font-semibold text-sm">No tasks created yet.</p>
                <button
                  onClick={() => navigate(`/dashboard/${businessId}/project-operations/tasks/create?projectId=${project.id}`)}
                  className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  + Add First Task
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Task Title</th>
                      <th className="px-4 py-3">Planning Schedule</th>
                      <th className="px-4 py-3">Assignee</th>
                      <th className="px-4 py-3">Progress</th>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {tasks.map((t: any) => (
                      <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                          <div>{t.title}</div>
                          <div className="text-[11px] font-mono text-gray-400">{t.taskNumber || t.taskCode || ''}</div>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {t.planning ? (
                            <Link
                              to={`/dashboard/${businessId}/project-operations/planning/${t.planning.id || t.planningId}`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-semibold hover:underline"
                            >
                              <Map className="w-3 h-3 flex-shrink-0" />
                              <span className="font-mono font-bold">{t.planning.planCode}</span>
                              <span className="truncate max-w-[120px]">— {t.planning.planName}</span>
                            </Link>
                          ) : (
                            <span className="text-gray-400 italic">Direct Project Task</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">{t.assignedTo?.name || 'Unassigned'}</td>
                        <td className="px-4 py-3 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${t.status === 'DONE' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                style={{ width: `${t.completionPercentage || (t.status === 'DONE' ? 100 : 0)}%` }}
                              />
                            </div>
                            <span className="font-bold text-[11px] text-gray-600 dark:text-gray-300">
                              {t.completionPercentage || (t.status === 'DONE' ? 100 : 0)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs">{t.priority || 'Normal'}</td>
                        <td className="px-4 py-3">
                          <select
                            value={t.status === 'DONE' ? 'DONE' : (t.status || 'TODO')}
                            disabled={updatingTaskId === t.id}
                            onChange={(e) => handleUpdateTaskStatus(t.id, e.target.value)}
                            className="text-xs font-bold px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="TODO">TODO</option>
                            <option value="IN_PROGRESS">IN PROGRESS</option>
                            <option value="DONE">DONE (COMPLETED)</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PLANNING TAB */}
        {activeTab === 'planning' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold">Planning Schedules ({project?.plannings?.length || 0})</h3>
                <p className="text-xs text-gray-500 mt-0.5">Master schedules and execution timelines linked to this project.</p>
              </div>
              <button
                onClick={() => navigate(`/dashboard/${businessId}/project-operations/planning/create?projectId=${project.id}`)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                + Create Schedule
              </button>
            </div>
            {(!project.plannings || project.plannings.length === 0) ? (
              <div className="text-center py-12 text-gray-400 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-900/50">
                <Map className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">No planning schedules created yet.</p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">Create a master schedule to define task owners, estimates, and connect execution tasks.</p>
                <button
                  onClick={() => navigate(`/dashboard/${businessId}/project-operations/planning/create?projectId=${project.id}`)}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  + Add First Schedule
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Schedule Name</th>
                      <th className="px-4 py-3">Phase / Sprint</th>
                      <th className="px-4 py-3">Timeline</th>
                      <th className="px-4 py-3">Tasks</th>
                      <th className="px-4 py-3">Progress</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {project.plannings.map((plan: any) => {
                      const planTaskCount = tasks.filter((t: any) => t.planningId === plan.id).length;
                      return (
                        <tr key={plan.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">{plan.planCode}</span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                            <Link to={`/dashboard/${businessId}/project-operations/planning/${plan.id}`} className="hover:text-blue-600 hover:underline">
                              {plan.planName}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {plan.phase || plan.sprint ? `${plan.phase || ''} ${plan.sprint ? `(${plan.sprint})` : ''}`.trim() : (plan.execType || '—')}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {plan.startDate ? new Date(plan.startDate).toLocaleDateString() : '—'} → {plan.endDate ? new Date(plan.endDate).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-300">
                            {planTaskCount} tasks
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div className={`h-full ${plan.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${plan.completionPercentage || 0}%` }} />
                              </div>
                              <span className="text-xs font-bold">{plan.completionPercentage || 0}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={plan.status || 'DRAFT'} size="sm" />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                to={`/dashboard/${businessId}/project-operations/tasks/create?projectId=${project.id}&planningId=${plan.id}`}
                                className="px-2.5 py-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 rounded"
                              >
                                + Add Task
                              </Link>
                              <Link
                                to={`/dashboard/${businessId}/project-operations/planning/${plan.id}`}
                                className="px-2.5 py-1 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 rounded"
                              >
                                View
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TIME TRACKING TAB */}
        {activeTab === 'time-tracking' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Time Entries ({timeEntries.length})</h3>
              <button
                onClick={() => navigate(`/dashboard/${businessId}/project-operations/timesheets/create?projectId=${project.id}`)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                + Log Time
              </button>
            </div>
            {timeEntries.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="font-semibold text-sm">No time entries recorded.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Member</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Hours</th>
                      <th className="px-4 py-3">Billable</th>
                      <th className="px-4 py-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {timeEntries.map((te: any) => (
                      <tr key={te.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-semibold">{te.employee?.name || te.businessUser?.user?.name || 'Member'}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{te.date ? new Date(te.date).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-4 py-3 text-xs font-bold text-blue-600">{te.hours} hrs</td>
                        <td className="px-4 py-3 text-xs">{te.isBillable ? 'Yes' : 'No'}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 truncate max-w-xs">{te.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ISSUES TAB */}
        {activeTab === 'issues' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Issues ({issues.length})</h3>
              <button
                onClick={() => navigate(`/dashboard/${businessId}/project-operations/issues/create?projectId=${project.id}`)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                + Report Issue
              </button>
            </div>
            {issues.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="font-semibold text-sm">No issues reported for this project.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Code / Title</th>
                      <th className="px-4 py-3">Severity</th>
                      <th className="px-4 py-3">Assignee</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {issues.map((i: any) => (
                      <tr key={i.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-semibold">{i.title}</td>
                        <td className="px-4 py-3 text-xs">{i.severity || 'Normal'}</td>
                        <td className="px-4 py-3 text-xs">{i.assignee?.name || 'Unassigned'}</td>
                        <td className="px-4 py-3"><StatusBadge status={i.status || 'OPEN'} size="sm" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* OTHER TABS */}
        {activeTab !== 'overview' && activeTab !== 'resources' && activeTab !== 'tasks' && activeTab !== 'time-tracking' && activeTab !== 'issues' && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4 py-12">
            {(() => {
              const ActiveIcon = tabs.find(t => t.id === activeTab)?.icon;
              return ActiveIcon ? <ActiveIcon className="w-12 h-12 text-gray-300" /> : null;
            })()}
            <h3 className="text-lg font-medium">{tabs.find(t => t.id === activeTab)?.label} Dashboard</h3>
            <p className="text-sm max-w-md text-center">
              Viewing records for {project.projectName} ({project.projectCode}).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
