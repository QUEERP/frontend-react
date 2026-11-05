import { toast as sonnerToast } from 'sonner';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Search, Filter, MoreVertical, Layout, AlignLeft, Calendar as CalendarIcon,
  Map, CheckSquare, Flag, Users, Clock, Receipt, Package, ShoppingCart, 
  DollarSign, AlertCircle, ShieldAlert, GitPullRequest, HeadphonesIcon, 
  BarChart, Activity, Download, FileText, LayoutGrid, List, SlidersHorizontal, X, ArrowRight, Eye, Edit, Copy, Trash2, CheckCircle2, Lock, Settings,
  ChevronLeft, ChevronRight, Plus, ExternalLink, Upload, Paperclip
} from 'lucide-react';
import { StatusBadge } from '@/components/project-operations/StatusBadge';
import { ProgressBar } from '@/components/project-operations/ProgressBar';
import { useToast } from "@/components/ui/use-toast";
import { useBusinessData } from '@/components/dashboard/business-data-provider';
import { ProjectsTable } from './ProjectsTable';

// ------------------------------------------------------------------
// TAB WORKSPACE COMPONENTS
// ------------------------------------------------------------------

const ResourceWorkspaceTab = ({ project, businessId, navigate }: any) => {
  const allocations = project?.resourceAllocations || [];
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div>
          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
            Resource Allocations ({allocations.length})
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Team members allocated to {project?.projectName || 'this project'}</p>
        </div>
        <button 
          onClick={() => navigate(`/dashboard/${businessId}/project-operations/resources/create?projectId=${project?.id}`)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Users className="w-3.5 h-3.5" /> + Allocate Resource
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        {allocations.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">No resources allocated yet</h4>
            <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">Assign team members to this project to track capacity, hours, and responsibilities.</p>
            <button 
              onClick={() => navigate(`/dashboard/${businessId}/project-operations/resources/create?projectId=${project?.id}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              + Allocate First Resource
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Team Member</th>
                  <th className="px-6 py-3.5 font-bold">Role & Dept</th>
                  <th className="px-6 py-3.5 font-bold">Assigned Task</th>
                  <th className="px-6 py-3.5 font-bold">Duration</th>
                  <th className="px-6 py-3.5 font-bold">Allocation</th>
                  <th className="px-6 py-3.5 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {allocations.map((alloc: any) => {
                  const empName = alloc.employee?.name || alloc.employee?.email || 'Assigned Member';
                  const initial = (empName || 'U').charAt(0).toUpperCase();
                  const startDate = alloc.startDate ? new Date(alloc.startDate).toLocaleDateString() : 'Immediate';
                  const endDate = alloc.endDate ? new Date(alloc.endDate).toLocaleDateString() : 'Ongoing';
                  return (
                    <tr key={alloc.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black text-xs">
                            {initial}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-gray-100">{empName}</div>
                            <div className="text-xs text-gray-400">{alloc.employee?.email || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-800 dark:text-gray-200">{alloc.role || 'Team Member'}</div>
                        <div className="text-xs text-gray-400">{alloc.department || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        {alloc.task ? (
                          <span className="text-xs font-semibold px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300">
                            {alloc.task.taskNumber || alloc.task.title}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Project-wide</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {startDate} → {endDate}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-1">
                          {alloc.allocationPercent || 100}% ({alloc.estimatedHours || 0} hrs)
                        </div>
                        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${alloc.allocationPercent > 100 ? 'bg-red-500' : 'bg-blue-600'}`}
                            style={{ width: `${Math.min(alloc.allocationPercent || 100, 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md ${
                          alloc.status === 'Active' || alloc.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {alloc.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const TaskWorkspaceTab = ({ project, businessId, navigate }: any) => {
  const tasks = project?.tasks || [];
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div>
          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
            Project Tasks ({tasks.length})
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Tasks scheduled and assigned for {project?.projectName}</p>
        </div>
        <button 
          onClick={() => navigate(`/dashboard/${businessId}/project-operations/tasks/create?projectId=${project?.id}`)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <CheckSquare className="w-3.5 h-3.5" /> + Create Task
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        {tasks.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">No tasks created yet</h4>
            <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">Create tasks to track deliverables, milestones, and assignments.</p>
            <button 
              onClick={() => navigate(`/dashboard/${businessId}/project-operations/tasks/create?projectId=${project?.id}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              + Create First Task
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Code / Title</th>
                  <th className="px-6 py-3.5 font-bold">Assignee</th>
                  <th className="px-6 py-3.5 font-bold">Milestone</th>
                  <th className="px-6 py-3.5 font-bold">Due Date</th>
                  <th className="px-6 py-3.5 font-bold">Priority</th>
                  <th className="px-6 py-3.5 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {tasks.map((task: any) => {
                  const assigneeName = task.assignedTo?.name || task.assignedTo?.email || 'Unassigned';
                  const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date';
                  return (
                    <tr key={task.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 dark:text-gray-100">{task.title}</div>
                        <div className="text-xs text-gray-400">{task.taskNumber || 'TSK'}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-gray-800 dark:text-gray-200">
                        {assigneeName}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {task.milestone?.title || '-'}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-gray-600 dark:text-gray-300">
                        {dueDate}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                          task.priority === 'HIGH' || task.priority === 'CRITICAL' ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400' :
                          task.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {task.priority || 'NORMAL'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={task.status || 'PENDING'} size="sm" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const MilestoneWorkspaceTab = ({ project, businessId, navigate }: any) => {
  const milestones = project?.milestones || [];
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div>
          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
            Milestones ({milestones.length})
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Key project target gates and deliverables</p>
        </div>
        <button 
          onClick={() => navigate(`/dashboard/${businessId}/project-operations/milestones/create?projectId=${project?.id}`)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Flag className="w-3.5 h-3.5" /> + Create Milestone
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        {milestones.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Flag className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">No milestones recorded</h4>
            <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">Define critical project delivery milestones to ensure schedule compliance.</p>
            <button 
              onClick={() => navigate(`/dashboard/${businessId}/project-operations/milestones/create?projectId=${project?.id}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              + Create First Milestone
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Title</th>
                  <th className="px-6 py-3.5 font-bold">Target Date</th>
                  <th className="px-6 py-3.5 font-bold">Weight / Cost</th>
                  <th className="px-6 py-3.5 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {milestones.map((m: any) => (
                  <tr key={m.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-gray-100">{m.title}</td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-600 dark:text-gray-300">
                      {m.targetDate ? new Date(m.targetDate).toLocaleDateString() : 'TBD'}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-gray-800 dark:text-gray-200">
                      {m.cost ? `$${Number(m.cost).toLocaleString()}` : `${m.weight || 0}%`}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={m.status || 'PENDING'} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};


const PlanningWorkspaceTab = ({ project, businessId, navigate }: any) => {
  const plannings = project?.plannings || [];
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div>
          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
            Planning Management ({plannings.length})
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Master schedules, execution models, and timelines for {project?.projectName || 'this project'}</p>
        </div>
        <button 
          onClick={() => navigate(`/dashboard/${businessId}/project-operations/planning/create?projectId=${project?.id}`)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Map className="w-3.5 h-3.5" /> + New Master Schedule
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        {plannings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Map className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">No planning records found for {project?.projectName || 'this project'}</h4>
            <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">Create a master schedule to map deliverables, timeline dependencies, and budgets.</p>
            <button 
              onClick={() => navigate(`/dashboard/${businessId}/project-operations/planning/create?projectId=${project?.id}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              + Create First Master Schedule
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Schedule / Code</th>
                  <th className="px-6 py-3.5 font-bold">Model / Department</th>
                  <th className="px-6 py-3.5 font-bold">Timeline</th>
                  <th className="px-6 py-3.5 font-bold">Status</th>
                  <th className="px-6 py-3.5 font-bold">Progress</th>
                  <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {plannings.map((plan: any) => {
                  const startDateStr = plan.startDate ? new Date(plan.startDate).toLocaleDateString() : 'TBD';
                  const endDateStr = plan.endDate ? new Date(plan.endDate).toLocaleDateString() : 'TBD';
                  const progress = plan.completionPercentage || 0;
                  return (
                    <tr 
                      key={plan.id} 
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/dashboard/${businessId}/project-operations/planning/${plan.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 transition-colors">
                            {plan.planName || 'Unnamed Schedule'}
                          </span>
                          <span className="text-xs font-mono text-gray-400 mt-0.5">{plan.planCode || '—'}</span>
                          {plan.phase && (
                            <span className="text-[11px] text-gray-500 mt-0.5">Phase: {plan.phase}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {plan.execType || 'Turnkey'}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">{plan.department || '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-gray-600 dark:text-gray-300">
                        <div className="flex flex-col gap-0.5">
                          <span>{startDateStr} → {endDateStr}</span>
                          {plan.duration != null && (
                            <span className="text-[11px] text-gray-400 font-mono">({plan.duration} Days)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={plan.status || 'ACTIVE'} size="sm" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-28 space-y-1">
                          <div className="flex justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigate(`/dashboard/${businessId}/project-operations/planning/${plan.id}`)}
                            title="View Schedule"
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/dashboard/${businessId}/project-operations/planning/${plan.id}/edit`)}
                            title="Edit Schedule"
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
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
    </div>
  );
};

const TimesheetWorkspaceTab = ({ project, businessId, navigate }: any) => {
  const times = project?.timeEntries || [];
  const totalLoggedHours = times.reduce((sum: number, t: any) => sum + (t.hours || 0), 0);
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div>
          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
            Timesheets & Logged Hours ({times.length})
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Total hours logged: <span className="font-bold text-blue-600">{totalLoggedHours} hrs</span></p>
        </div>
        <button 
          onClick={() => navigate(`/dashboard/${businessId}/project-operations/timesheets/create?projectId=${project?.id}`)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Clock className="w-3.5 h-3.5" /> + Log Time
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        {times.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">No time logged yet</h4>
            <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">Track team hours, billable rates, and actual effort against this project.</p>
            <button 
              onClick={() => navigate(`/dashboard/${businessId}/project-operations/timesheets/create?projectId=${project?.id}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              + Log First Time Entry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Team Member</th>
                  <th className="px-6 py-3.5 font-bold">Date</th>
                  <th className="px-6 py-3.5 font-bold">Hours</th>
                  <th className="px-6 py-3.5 font-bold">Task</th>
                  <th className="px-6 py-3.5 font-bold">Billable</th>
                  <th className="px-6 py-3.5 font-bold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {times.map((t: any) => {
                  const empName = t.employee?.name || t.businessUser?.user?.name || 'Member';
                  const date = t.date ? new Date(t.date).toLocaleDateString() : 'N/A';
                  return (
                    <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-gray-100">{empName}</td>
                      <td className="px-6 py-4 text-xs font-medium text-gray-600 dark:text-gray-300">{date}</td>
                      <td className="px-6 py-4 text-xs font-black text-blue-600">{t.hours} hrs</td>
                      <td className="px-6 py-4 text-xs text-gray-500">{t.task?.title || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          t.isBillable ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {t.isBillable ? 'BILLABLE' : 'NON-BILLABLE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 truncate max-w-xs">{t.notes || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const IssueWorkspaceTab = ({ project, businessId, navigate }: any) => {
  const issues = project?.issues || [];
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div>
          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
            Issues & Bugs ({issues.length})
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Track bugs, roadblocks, and issue resolutions</p>
        </div>
        <button 
          onClick={() => navigate(`/dashboard/${businessId}/project-operations/issues/create?projectId=${project?.id}`)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <AlertCircle className="w-3.5 h-3.5" /> + Report Issue
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        {issues.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">No open issues</h4>
            <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">All project systems are running without reported impediments.</p>
            <button 
              onClick={() => navigate(`/dashboard/${businessId}/project-operations/issues/create?projectId=${project?.id}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              + Report New Issue
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Issue Code / Title</th>
                  <th className="px-6 py-3.5 font-bold">Severity</th>
                  <th className="px-6 py-3.5 font-bold">Priority</th>
                  <th className="px-6 py-3.5 font-bold">Assignee</th>
                  <th className="px-6 py-3.5 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {issues.map((issue: any) => {
                  const assigneeName = issue.assignee?.name || issue.assignee?.email || 'Unassigned';
                  return (
                    <tr key={issue.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 dark:text-gray-100">{issue.title}</div>
                        <div className="text-xs text-gray-400">{issue.issueCode || 'ISSUE'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                          issue.severity === 'CRITICAL' || issue.severity === 'High' ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400' :
                          'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}>
                          {issue.severity || 'Normal'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {issue.priority || 'Normal'}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-gray-800 dark:text-gray-200">
                        {assigneeName}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={issue.status || 'OPEN'} size="sm" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const TeamWorkspaceTab = ({ project, businessId, navigate }: any) => {
  const pm = project?.projectManager;
  const allocations = project?.resourceAllocations || [];
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div>
          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
            Project Team & Leadership
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Managers and assigned team members for {project?.projectName}</p>
        </div>
        <button 
          onClick={() => navigate(`/dashboard/${businessId}/project-operations/resources/create?projectId=${project?.id}`)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Users className="w-3.5 h-3.5" /> + Add Team Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Project Manager Card */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border-2 border-blue-200 dark:border-blue-900 shadow-sm relative">
          <span className="absolute top-3 right-3 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded">
            Project Lead
          </span>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-sm">
              {((pm?.name || pm?.user?.name || 'P') as string).charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-gray-100 text-base">{pm?.name || pm?.user?.name || 'Unassigned PM'}</h4>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Project Manager</p>
            </div>
          </div>
          <div className="text-xs text-gray-500 space-y-1 border-t border-gray-100 dark:border-gray-800 pt-3">
            <div>Email: <span className="font-semibold text-gray-700 dark:text-gray-300">{pm?.email || pm?.user?.email || 'N/A'}</span></div>
          </div>
        </div>

        {/* Allocated Members */}
        {allocations.map((alloc: any) => {
          const emp = alloc.employee;
          const name = emp?.name || emp?.email || 'Member';
          return (
            <div key={alloc.id} className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center justify-center font-bold text-sm">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{name}</h4>
                  <p className="text-xs text-gray-500 font-medium">{alloc.role || 'Team Member'}</p>
                </div>
              </div>
              <div className="text-xs text-gray-500 space-y-1.5 border-t border-gray-100 dark:border-gray-800 pt-3">
                <div className="flex justify-between">
                  <span>Department:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{alloc.department || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Allocation:</span>
                  <span className="font-semibold text-blue-600">{alloc.allocationPercent || 100}% ({alloc.estimatedHours || 0} hrs)</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TimelineWorkspaceTab = ({ project }: any) => {
  const events: any[] = [];
  if (project?.createdAt) {
    events.push({
      date: new Date(project.createdAt),
      title: "Project Initialized",
      desc: `${project.projectName} was created with code ${project.projectCode}.`,
      icon: Activity,
      color: "bg-blue-500"
    });
  }
  (project?.resourceAllocations || []).forEach((a: any) => {
    if (a.createdAt) {
      events.push({
        date: new Date(a.createdAt),
        title: `Resource Allocated: ${a.employee?.name || 'Member'}`,
        desc: `Allocated as ${a.role || 'Member'} (${a.estimatedHours || 0} hrs).`,
        icon: Users,
        color: "bg-emerald-500"
      });
    }
  });
  (project?.tasks || []).forEach((t: any) => {
    if (t.createdAt) {
      events.push({
        date: new Date(t.createdAt),
        title: `Task Created: ${t.title}`,
        desc: `Status: ${t.status || 'PENDING'}, Priority: ${t.priority || 'Normal'}`,
        icon: CheckSquare,
        color: "bg-indigo-500"
      });
    }
  });
  (project?.milestones || []).forEach((m: any) => {
    if (m.createdAt) {
      events.push({
        date: new Date(m.createdAt),
        title: `Milestone Set: ${m.title}`,
        desc: `Target Date: ${m.targetDate ? new Date(m.targetDate).toLocaleDateString() : 'TBD'}`,
        icon: Flag,
        color: "bg-amber-500"
      });
    }
  });
  (project?.issues || []).forEach((i: any) => {
    if (i.createdAt) {
      events.push({
        date: new Date(i.createdAt),
        title: `Issue Logged: ${i.title}`,
        desc: `Severity: ${i.severity || 'Normal'}, Assignee: ${i.assignee?.name || 'Unassigned'}`,
        icon: AlertCircle,
        color: "bg-red-500"
      });
    }
  });

  events.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
          Project Activity Timeline
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">Chronological audit trail of milestone gates, tasks, and allocations</p>
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No activity events recorded yet.</div>
        ) : (
          <div className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-800 space-y-6">
            {events.map((evt, idx) => {
              const Icon = evt.icon;
              return (
                <div key={idx} className="relative">
                  <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full ${evt.color} border-2 border-white dark:border-gray-900 flex items-center justify-center`} />
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">{evt.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{evt.desc}</p>
                    </div>
                    <span className="text-[11px] font-bold text-gray-400">
                      {evt.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};


// ------------------------------------------------------------------
// DOCUMENTS WORKSPACE TAB
// ------------------------------------------------------------------

const DocumentWorkspaceTab = ({ project, businessId, onRefresh }: any) => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('ALL');
  const [docForm, setDocForm] = useState({
    title: '',
    folder: 'General',
    description: '',
    fileUrl: '',
    fileType: '',
    fileSize: 0,
    mimeType: ''
  });

  const docs = project?.documents || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setDocForm(prev => ({
        ...prev,
        title: prev.title || file.name,
        fileUrl: reader.result as string,
        fileType: file.type || file.name.split('.').pop() || 'unknown',
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream'
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.fileUrl || !docForm.title.trim()) {
      sonnerToast.error('Please select a file and provide a document title.');
      return;
    }
    setUploading(true);
    try {
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '');
      const getCookie = (name: string) => {
        if (typeof document === 'undefined') return '';
        const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\\^])/g, '\\$1') + '=([^;]*)'));
        return match ? decodeURIComponent(match[1]) : '';
      };
      let token = getCookie('token') || getCookie('accessToken');
      if (!token && typeof window !== 'undefined') {
        token = localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
      }

      const res = await fetch(`${API_BASE}/api/project-operations/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: project.id,
          entityType: 'PROJECT',
          entityId: project.id,
          title: docForm.title.trim(),
          fileUrl: docForm.fileUrl,
          fileType: docForm.fileType,
          fileSize: docForm.fileSize,
          mimeType: docForm.mimeType,
          folder: docForm.folder,
          description: docForm.description
        })
      });
      const data = await res.json();
      if (data.success) {
        sonnerToast.success('Document uploaded successfully.');
        setIsUploadOpen(false);
        setDocForm({ title: '', folder: 'General', description: '', fileUrl: '', fileType: '', fileSize: 0, mimeType: '' });
        onRefresh();
      } else {
        sonnerToast.error(data.message || 'Failed to upload document.');
      }
    } catch (err: any) {
      sonnerToast.error(err.message || 'Error uploading document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    setDeletingId(docId);
    try {
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '');
      const getCookie = (name: string) => {
        if (typeof document === 'undefined') return '';
        const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\\^])/g, '\\$1') + '=([^;]*)'));
        return match ? decodeURIComponent(match[1]) : '';
      };
      let token = getCookie('token') || getCookie('accessToken');
      if (!token && typeof window !== 'undefined') {
        token = localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
      }

      const res = await fetch(`${API_BASE}/api/project-operations/documents/${docId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        sonnerToast.success('Document deleted successfully.');
        onRefresh();
      } else {
        sonnerToast.error(data.message || 'Failed to delete document.');
      }
    } catch (err: any) {
      sonnerToast.error(err.message || 'Error deleting document.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const filteredDocs = docs.filter((d: any) => {
    const matchesSearch = !searchTerm || d.title?.toLowerCase().includes(searchTerm.toLowerCase()) || d.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = selectedFolder === 'ALL' || d.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  const folders = Array.from(new Set(['General', 'Planning', 'Specifications', 'Contracts', 'Deliverables', ...docs.map((d: any) => d.folder).filter(Boolean)]));

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div>
          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" /> Documents & Attachments ({docs.length})
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Manage and organize all files, specs, and deliverables for {project?.projectName}</p>
        </div>
        <button 
          onClick={() => setIsUploadOpen(true)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" /> Upload Document
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents by name or notes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400 font-bold uppercase text-[10px]">Folder:</span>
          <select
            value={selectedFolder}
            onChange={e => setSelectedFolder(e.target.value)}
            className="py-1.5 px-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium cursor-pointer"
          >
            <option value="ALL">All Folders ({docs.length})</option>
            {folders.map(f => (
              <option key={f as string} value={f as string}>{f as string}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        {filteredDocs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">
              {docs.length === 0 ? 'No documents uploaded yet' : 'No matching documents found'}
            </h4>
            <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">
              {docs.length === 0 
                ? `Attach blueprints, scopes, contracts, or planning files to ${project?.projectName || 'this project'}.`
                : 'Try adjusting your search filter.'}
            </p>
            {docs.length === 0 && (
              <button 
                onClick={() => setIsUploadOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Upload First Document
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredDocs.map((doc: any) => {
              const isPdf = doc.title?.toLowerCase().endsWith('.pdf') || doc.mimeType?.includes('pdf') || doc.fileType?.includes('pdf');
              const isImage = /\.(png|jpe?g|webp|gif|svg)$/i.test(doc.title) || doc.mimeType?.startsWith('image/');
              
              return (
                <div key={doc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex-shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-black text-gray-900 dark:text-white truncate max-w-md">{doc.title}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                          {doc.folder || 'General'}
                        </span>
                        {doc.entityType && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                            {doc.entityType}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1 font-medium">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span>{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}</span>
                        {doc.description && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-xs text-gray-500">{doc.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </button>
                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        download={doc.title}
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    )}
                    <button
                      type="button"
                      disabled={deletingId === doc.id}
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setIsUploadOpen(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-800 z-10 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" /> Upload Project Document
              </h3>
              <button onClick={() => setIsUploadOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-600 dark:text-gray-300 mb-1.5 font-bold uppercase text-[10px]">Select File *</label>
                <input
                  type="file"
                  required
                  onChange={handleFileChange}
                  className="w-full p-2 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-gray-600 dark:text-gray-300 mb-1 font-bold uppercase text-[10px]">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. System Architecture Diagram"
                  value={docForm.title}
                  onChange={e => setDocForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-normal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 dark:text-gray-300 mb-1 font-bold uppercase text-[10px]">Folder Category</label>
                  <select
                    value={docForm.folder}
                    onChange={e => setDocForm(prev => ({ ...prev, folder: e.target.value }))}
                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-normal"
                  >
                    <option value="General">General</option>
                    <option value="Planning">Planning</option>
                    <option value="Specifications">Specifications</option>
                    <option value="Contracts">Contracts</option>
                    <option value="Deliverables">Deliverables</option>
                    <option value="Architecture">Architecture</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 dark:text-gray-300 mb-1 font-bold uppercase text-[10px]">File Size</label>
                  <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-500 font-normal">
                    {formatFileSize(docForm.fileSize)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-600 dark:text-gray-300 mb-1 font-bold uppercase text-[10px]">Description / Scope Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional brief description of this document..."
                  value={docForm.description}
                  onChange={e => setDocForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-normal"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
                >
                  {uploading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setPreviewDoc(null)} />
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-lg">{previewDoc.title}</h3>
                <p className="text-xs text-gray-400">{formatFileSize(previewDoc.fileSize)} • {previewDoc.folder}</p>
              </div>
              <div className="flex items-center gap-2">
                {previewDoc.fileUrl && (
                  <a
                    href={previewDoc.fileUrl}
                    download={previewDoc.title}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                )}
                <button onClick={() => setPreviewDoc(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[350px] max-h-[70vh] bg-gray-100 dark:bg-gray-950">
              {previewDoc.title?.toLowerCase().endsWith('.pdf') || previewDoc.mimeType?.includes('pdf') || previewDoc.fileType?.includes('pdf') ? (
                <iframe src={previewDoc.fileUrl} title={previewDoc.title} className="w-full h-full min-h-[500px] border-0 rounded-lg" />
              ) : previewDoc.fileType?.startsWith('image/') || /\.(png|jpe?g|svg|webp|gif)$/i.test(previewDoc.title) ? (
                <img src={previewDoc.fileUrl} alt={previewDoc.title} className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-md mx-auto" />
              ) : (
                <div className="text-center p-8">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Preview not supported for this file type.</p>
                  <a href={previewDoc.fileUrl} download={previewDoc.title} className="mt-3 inline-flex items-center gap-1 text-xs text-blue-600 font-bold hover:underline">
                    <Download className="w-3.5 h-3.5" /> Download file instead
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------------
// RISKS WORKSPACE TAB
// ------------------------------------------------------------------

const RiskWorkspaceTab = ({ project, businessId, onRefresh }: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    probability: 'MEDIUM',
    impact: 'MEDIUM',
    mitigation: '',
    status: 'Active'
  });

  const risks = project?.risks || [];

  const handleOpenCreate = () => {
    setEditingRisk(null);
    setForm({ title: '', description: '', probability: 'MEDIUM', impact: 'MEDIUM', mitigation: '', status: 'Active' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (risk: any) => {
    setEditingRisk(risk);
    setForm({
      title: risk.title || '',
      description: risk.description || '',
      probability: risk.probability || 'MEDIUM',
      impact: risk.impact || 'MEDIUM',
      mitigation: risk.mitigation || '',
      status: risk.status || 'Active'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      sonnerToast.error('Risk title is required.');
      return;
    }
    setSubmitting(true);
    try {
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '');
      const getCookie = (name: string) => {
        if (typeof document === 'undefined') return '';
        const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\\^])/g, '\\$1') + '=([^;]*)'));
        return match ? decodeURIComponent(match[1]) : '';
      };
      let token = getCookie('token') || getCookie('accessToken');
      if (!token && typeof window !== 'undefined') {
        token = localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
      }

      const url = editingRisk 
        ? `${API_BASE}/api/project-operations/risks/${editingRisk.id}`
        : `${API_BASE}/api/project-operations/${project.id}/risks`;
      const method = editingRisk ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        sonnerToast.success(editingRisk ? 'Risk updated successfully.' : 'Risk logged successfully.');
        setIsModalOpen(false);
        onRefresh();
      } else {
        sonnerToast.error(data.message || 'Failed to save risk.');
      }
    } catch (err: any) {
      sonnerToast.error(err.message || 'Error saving risk.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (riskId: string) => {
    if (!window.confirm('Are you sure you want to delete this risk?')) return;
    try {
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '');
      const getCookie = (name: string) => {
        if (typeof document === 'undefined') return '';
        const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\\^])/g, '\\$1') + '=([^;]*)'));
        return match ? decodeURIComponent(match[1]) : '';
      };
      let token = getCookie('token') || getCookie('accessToken');
      if (!token && typeof window !== 'undefined') {
        token = localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
      }

      const res = await fetch(`${API_BASE}/api/project-operations/risks/${riskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        sonnerToast.success('Risk removed.');
        onRefresh();
      } else {
        sonnerToast.error(data.message || 'Failed to delete risk.');
      }
    } catch (err: any) {
      sonnerToast.error(err.message || 'Error deleting risk.');
    }
  };

  const getProbBadge = (val: string) => {
    switch (val?.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300 border-yellow-200';
      default: return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200';
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div>
          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500" /> Risk Register ({risks.length})
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Identify, evaluate, and track mitigation plans for {project?.projectName}</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> + Identify Risk
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        {risks.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">No risks identified yet</h4>
            <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">
              Maintain project health by recording potential project risks, likelihood, and mitigation steps.
            </p>
            <button 
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Identify First Risk
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {risks.map((risk: any) => (
              <div key={risk.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-black text-gray-900 dark:text-white">{risk.title}</h4>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getProbBadge(risk.probability)}`}>
                      Prob: {risk.probability || 'MEDIUM'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getProbBadge(risk.impact)}`}>
                      Impact: {risk.impact || 'MEDIUM'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      risk.status === 'Closed' ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' :
                      risk.status === 'Mitigated' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                    }`}>
                      {risk.status || 'Active'}
                    </span>
                  </div>

                  {risk.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">{risk.description}</p>
                  )}

                  {risk.mitigation && (
                    <div className="text-[11px] text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                      <strong className="text-gray-800 dark:text-gray-200">Mitigation: </strong>{risk.mitigation}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  <button
                    onClick={() => handleOpenEdit(risk)}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer"
                    title="Edit Risk"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(risk.id)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                    title="Delete Risk"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Risk Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-800 z-10 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                {editingRisk ? 'Edit Project Risk' : 'Identify New Project Risk'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-600 dark:text-gray-300 mb-1 font-bold uppercase text-[10px]">Risk Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vendor delay on key components"
                  value={form.title}
                  onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-normal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 dark:text-gray-300 mb-1 font-bold uppercase text-[10px]">Probability</label>
                  <select
                    value={form.probability}
                    onChange={e => setForm(prev => ({ ...prev, probability: e.target.value }))}
                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-normal"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 dark:text-gray-300 mb-1 font-bold uppercase text-[10px]">Impact</label>
                  <select
                    value={form.impact}
                    onChange={e => setForm(prev => ({ ...prev, impact: e.target.value }))}
                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-normal"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-600 dark:text-gray-300 mb-1 font-bold uppercase text-[10px]">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-normal"
                >
                  <option value="Active">Active</option>
                  <option value="Mitigated">Mitigated</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-600 dark:text-gray-300 mb-1 font-bold uppercase text-[10px]">Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe the cause and risk factors..."
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-normal"
                />
              </div>

              <div>
                <label className="block text-gray-600 dark:text-gray-300 mb-1 font-bold uppercase text-[10px]">Mitigation Plan</label>
                <textarea
                  rows={2}
                  placeholder="Steps taken to prevent or resolve this risk..."
                  value={form.mitigation}
                  onChange={e => setForm(prev => ({ ...prev, mitigation: e.target.value }))}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-normal"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingRisk ? 'Update Risk' : 'Add Risk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const GenericWorkspaceTab = ({ title, project }: any) => (
  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
      <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">{title} Management</h3>
      <div className="flex gap-2">
        <button className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded text-xs font-bold border border-gray-200">Filter</button>
      </div>
    </div>
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="p-12 text-center text-gray-400">
        <p className="text-sm font-medium">No {title.toLowerCase()} records found for {project?.projectName || 'this project'}.</p>
      </div>
    </div>
  </div>
);

// ------------------------------------------------------------------
// MAIN PROJECTS WORKSPACE COMPONENT
// ------------------------------------------------------------------

export default function ProjectsWorkspace({ businessId: propBusinessId }: { businessId?: string }) {
  const navigate = useNavigate();
  const params = useParams();
  const businessId = (propBusinessId || (params as any)?.businessId) as string;
  const { toast } = useToast();
  const { business } = useBusinessData();
  const isBasic = business?.businessType?.toLowerCase() === 'basic';
  
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  const tabContainerRef = useRef<HTMLDivElement>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLeftPaneOpen, setIsLeftPaneOpen] = useState(true);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortOrder, setSortOrder] = useState('Newest First');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<any>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    setIsDeletingProject(true);
    try {
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '');
      const getCookie = (name: string) => {
        if (typeof document === 'undefined') return '';
        const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\\^])/g, '\\$1') + '=([^;]*)'));
        return match ? decodeURIComponent(match[1]) : '';
      };
      let token = getCookie('token') || getCookie('accessToken');
      if (!token && typeof window !== 'undefined') {
        token = localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
      }

      const res = await fetch(`${API_BASE}/api/project-operations/${projectToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        sonnerToast.success(`Project "${projectToDelete.projectName}" deleted successfully.`);
        if (selectedProject?.id === projectToDelete.id) {
          setSelectedProject(null);
        }
        setProjectToDelete(null);
        fetchProjects();
      } else {
        sonnerToast.error(data.message || 'Failed to delete project.');
      }
    } catch (err: any) {
      sonnerToast.error(err.message || 'Error deleting project.');
    } finally {
      setIsDeletingProject(false);
    }
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabContainerRef.current) {
      const scrollAmount = direction === 'left' ? -250 : 250;
      tabContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchProjects();
  }, [businessId]);

  const fetchProjects = async () => {
    if (!businessId) return;
    try {
      setLoading(true);
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '');
      const getCookie = (name: string) => {
        if (typeof document === 'undefined') return '';
        const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\\^])/g, '\\$1') + '=([^;]*)'));
        return match ? decodeURIComponent(match[1]) : '';
      };
      let token = getCookie('token') || getCookie('accessToken');
      if (!token && typeof window !== 'undefined') {
         token = localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
      }
      
      const res = await fetch(`${API_BASE}/api/projects`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-business-id': businessId as string },
        cache: 'no-store'
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data || data.projects)) {
        const list = data.data || data.projects;
        const sorted = list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setProjects(sorted);
        setSelectedProject((prev: any) => {
          if (!prev) return sorted[0] || null;
          return sorted.find((p: any) => p.id === prev.id) || sorted[0] || null;
        });
      } else {
        toast({ title: "API Error", description: data.message || JSON.stringify(data), variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Error fetching projects:", error);
      toast({ title: "Error", description: error.message || "Failed to load projects.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(proj => {
    const searchLower = debouncedSearch.toLowerCase();
    const name = (proj.projectName || '').toLowerCase();
    const code = (proj.projectCode || '').toLowerCase();
    const cust = (proj.customer?.name || proj.customer?.company || '').toLowerCase();
    const mgr = (proj.projectManager?.name || proj.projectManager?.user?.name || '').toLowerCase();
    const stat = (proj.status || '').toLowerCase();
    
    if (searchLower && !name.includes(searchLower) && !code.includes(searchLower) && !cust.includes(searchLower) && !mgr.includes(searchLower) && !stat.includes(searchLower)) return false;
    
    if (filters['Status'] && proj.status !== filters['Status']) return false;
    if (filters['Type'] && proj.executionType !== filters['Type']) return false;
    if (filters['Priority'] && proj.priority !== filters['Priority']) return false;
    if (filters['Customer'] && proj.customerId !== filters['Customer']) return false;
    if (filters['Manager'] && proj.projectManagerId !== filters['Manager']) return false;
    if (filters['Department'] && proj.department !== filters['Department']) return false;
    
    if (filters['Budget']) {
      const b = proj.budget || 0;
      if (filters['Budget'] === 'under10k' && b >= 10000) return false;
      if (filters['Budget'] === '10k-50k' && (b < 10000 || b > 50000)) return false;
      if (filters['Budget'] === 'over50k' && b <= 50000) return false;
    }
    
    if (filters['Progress']) {
      const p = proj.completionPercentage || 0;
      if (filters['Progress'] === '0' && p !== 0) return false;
      if (filters['Progress'] === 'under50' && p >= 50) return false;
      if (filters['Progress'] === 'over50' && p < 50) return false;
      if (filters['Progress'] === '100' && p !== 100) return false;
    }
    
    return true;
  }).sort((a: any, b: any) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    if (sortOrder === 'Newest First') return dateB - dateA;
    if (sortOrder === 'Oldest First') return dateA - dateB;
    if (sortOrder === 'Recently Updated') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    return dateB - dateA;
  }).filter((a: any) => {
    if (sortOrder === 'Today') {
       return new Date(a.createdAt).toDateString() === new Date().toDateString();
    }
    if (sortOrder === 'Last 7 Days') {
       return new Date(a.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
    }
    if (sortOrder === 'Last 30 Days') {
       return new Date(a.createdAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000;
    }
    return true;
  });

  const getHealth = (proj: any) => {
    if (proj.status === 'COMPLETED') return { color: 'bg-green-500', text: 'Healthy' };
    const progress = proj.completionPercentage || 0;
    const now = new Date().getTime();
    const end = proj.endDate ? new Date(proj.endDate).getTime() : 0;
    if (end > 0 && now > end && progress < 100) return { color: 'bg-red-500', text: 'Delayed' };
    if (progress < 20 && end > 0 && (end - now) < 86400000 * 7) return { color: 'bg-yellow-500', text: 'At Risk' };
    return { color: 'bg-green-500', text: 'Healthy' };
  };

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
      
      const API_BASE_RAW = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').trim();
      const API_BASE = API_BASE_RAW.replace(/\/$/, '');
      const apiRoot = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;
      
      const res = await fetch(`${apiRoot}/projects/export/${type}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'x-business-id': businessId as string }
      });
      
      if (!res.ok) {
        const errorText = await res.json().catch(() => ({ message: `Failed to export ${type.toUpperCase()}` }));
        throw new Error(errorText.message || `Failed to export ${type.toUpperCase()}`);
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Projects_${new Date().toISOString().split('T')[0]}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
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

  const tabs = useMemo(() => {
    if (!selectedProject) return [];
    return [
      { id: "overview", label: "Overview", icon: Layout },
      { id: "resources", label: "Resources", icon: Users, count: (selectedProject.resourceAllocations || []).length },
      { id: "tasks", label: "Tasks", icon: CheckSquare, count: (selectedProject.tasks || []).length },
      { id: "milestones", label: "Milestones", icon: Flag, count: (selectedProject.milestones || []).length },
      { id: "timesheets", label: "Timesheets", icon: Clock, count: (selectedProject.timeEntries || []).length },
      { id: "issues", label: "Issues", icon: AlertCircle, count: (selectedProject.issues || []).length },
      { id: "team", label: "Team", icon: Users, count: (selectedProject.resourceAllocations || []).length + (selectedProject.projectManager ? 1 : 0) },
      { id: "timeline", label: "Timeline", icon: Activity },
      { id: "invoices", label: "Invoices", icon: Receipt, count: (selectedProject.invoices || []).length },
      { id: "planning", label: "Planning", icon: Map, count: (selectedProject.plannings || []).length },
      { id: "documents", label: "Documents", icon: FileText, count: (selectedProject.documents || []).length },
      { id: "risks", label: "Risks", icon: ShieldAlert, count: (selectedProject.risks || []).length },
      { id: "reports", label: "Reports", icon: BarChart },
      { id: "settings", label: "Settings", icon: Settings },
    ];
  }, [selectedProject]);

  if (isBasic) {
    return (
      <ProjectsTable 
        businessId={businessId as string} 
        projects={projects} 
        loading={loading} 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        filteredProjects={filteredProjects} 
        onDeleteProject={(p) => setProjectToDelete(p)}
      />
    );
  }

    // Pre-calculated stats for the selected project
  const isTaskDone = (t: any) => t.status === 'DONE' || t.status === 'COMPLETED';
  const completedTasks = (selectedProject?.tasks || []).filter(isTaskDone).length;
  const pendingTasks = (selectedProject?.tasks || []).filter((t: any) => !isTaskDone(t)).length;
  const totalTasks = (selectedProject?.tasks || []).length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const projectProgress = typeof selectedProject?.completionPercentage === 'number' && selectedProject.completionPercentage > 0
    ? selectedProject.completionPercentage
    : (totalTasks > 0 ? taskCompletionRate : 0);
  const openIssues = (selectedProject?.issues || []).filter((i: any) => i.status !== 'CLOSED' && i.status !== 'RESOLVED').length;
  const identifiedRisks = (selectedProject?.risks || []).length;
  const hoursLogged = (selectedProject?.timeEntries || []).reduce((sum: number, t: any) => sum + (t.hours || 0), 0);
  const allocatedResourcesCount = (selectedProject?.resourceAllocations || []).length;

  return (
    <div className="flex flex-col min-h-full relative bg-gray-50 dark:bg-gray-950">
      
      {/* Header */}
      <div className="flex-none px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm z-10">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          <span>Project Operations</span><span>/</span><span className="text-blue-600 dark:text-blue-400">Projects Master</span>
        </div>
        <div className="flex justify-between items-center">
          <div>
             <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects Workspace</h1>
             <p className="text-sm text-gray-500 mt-1">Manage, execute, and monitor all enterprise projects in one place.</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleBackendExport('excel')} 
              disabled={isExportingExcel || isExportingPDF}
              className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-lg text-sm font-semibold border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
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
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-lg text-sm font-semibold border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isExportingPDF ? (
                <div className="w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <FileText className="w-4 h-4" />
              )}
              PDF
            </button>
            <button 
              onClick={() => {
                if (!businessId) return;
                navigate(`/dashboard/${businessId}/project-operations/projects/create`);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm ml-2 cursor-pointer"
            >
              + Create Project
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-[calc(100vh-11rem)] relative">
        {/* LEFT PANE: List */}
        <div className={`flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col shadow-sm relative z-20 sticky top-0 self-start max-h-[calc(100vh-4.25rem)] transition-all duration-300 ease-in-out ${isLeftPaneOpen ? 'w-[380px] lg:w-[420px]' : 'w-0 border-r-0 overflow-hidden opacity-0 pointer-events-none'}`}>
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 space-y-3 bg-gray-50/50 dark:bg-gray-900/50 flex-none min-w-[380px]">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search projects by code, name, customer..." 
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none shadow-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsLeftPaneOpen(false)}
                title="Collapse projects panel"
                aria-label="Collapse projects panel"
                className="p-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer flex-shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsFilterOpen(true)} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold border rounded-lg transition-colors cursor-pointer ${Object.keys(filters).length > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                <Filter className="w-3.5 h-3.5" /> Filters {Object.keys(filters).length > 0 && `(${Object.keys(filters).length})`}
              </button>
              <div className="flex-1 relative">
                <button onClick={() => setShowSortMenu(!showSortMenu)} className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold border border-gray-200 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <Clock className="w-3.5 h-3.5" /> Recent
                </button>
                {showSortMenu && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg z-50 overflow-hidden py-1">
                    {['Today', 'Last 7 Days', 'Last 30 Days', 'Newest First', 'Oldest First', 'Recently Updated'].map(opt => (
                      <button key={opt} onClick={() => { setSortOrder(opt); setShowSortMenu(false); }} className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${sortOrder === opt ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300'}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto scrollbar-thin bg-gray-50 dark:bg-gray-950">
            {loading ? (
               <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500">
                 <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                 <span className="text-xs font-bold uppercase tracking-widest">Loading Projects...</span>
               </div>
            ) : projects.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full p-10 text-center">
                 <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                   <LayoutGrid className="w-10 h-10 text-gray-300" />
                 </div>
                 <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">No Projects Available</h3>
                 <p className="text-sm text-gray-500 mb-6 max-w-[250px]">Your project directory is completely empty.</p>
                 <button onClick={() => {
                   if (!businessId) return;
                   navigate(`/dashboard/${businessId}/project-operations/projects/create`);
                 }} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors cursor-pointer">
                   Create First Project
                 </button>
               </div>
            ) : filteredProjects.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full p-10 text-center">
                 <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">No matching projects</h3>
                 <p className="text-xs text-gray-500 mb-4">Try adjusting your search or filters.</p>
                 <button onClick={() => { setSearchTerm(''); setFilters({}); setSortOrder('Newest First'); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold cursor-pointer">Clear Filters</button>
               </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredProjects.map(proj => {
                  const health = getHealth(proj);
                  const isSelected = selectedProject?.id === proj.id;
                  return (
                    <div 
                      key={proj.id} 
                      onClick={() => setSelectedProject(proj)}
                      className={`p-4 cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-600' 
                          : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 border-l-4 border-l-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-black text-gray-500 uppercase tracking-widest">{proj.projectCode || 'PRJ'}</span>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${health.color}`} title={health.text}></div>
                          <StatusBadge status={proj.status || 'ACTIVE'} size="sm" />
                        </div>
                      </div>
                      <h4 className="text-sm font-black text-gray-900 dark:text-gray-100 mb-1 leading-tight">{proj.projectName}</h4>
                      <p className="text-xs text-gray-500 font-medium mb-3 truncate">{proj.customer?.name || proj.customer?.company || 'Internal'}</p>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-black text-gray-900 dark:text-white">${Number(proj.budget || 0).toLocaleString()}</span>
                        <span className="font-bold text-gray-400 flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" /> {proj.createdAt ? new Date(proj.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric'}) : 'N/A'}
                        </span>
                      </div>
                      <div className="mt-3">
                         <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase mb-1">
                            <span>Progress</span>
                            <span>{proj.completionPercentage || 0}%</span>
                         </div>
                         <ProgressBar progress={proj.completionPercentage || 0} showPercent={false} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: Details Workspace */}
        <div data-lenis-prevent className="flex-1 min-w-0 flex flex-col bg-gray-50/50 dark:bg-gray-950/30 relative z-10">
          {!isLeftPaneOpen && (
            <div className="px-6 py-2.5 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between flex-none sticky top-0 z-30 shadow-xs">
              <button
                type="button"
                onClick={() => setIsLeftPaneOpen(true)}
                title="Open projects list"
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <ChevronRight className="w-4 h-4" />
                <span>Show Projects List</span>
              </button>
              <span className="text-xs text-gray-400 font-medium">Projects panel collapsed</span>
            </div>
          )}
          {selectedProject ? (
            <>
              {/* Header */}
              <div className="px-8 py-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-between items-start flex-none sticky top-0 z-20 shadow-xs">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight">{selectedProject.projectName}</h2>
                    <span className={`px-2.5 py-1 text-[10px] uppercase font-black rounded-md tracking-widest ${selectedProject.executionType === 'SERVICE' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                      {selectedProject.executionType || 'HYBRID'}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-xs font-semibold text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1.5"><LayoutGrid className="w-3.5 h-3.5 text-gray-400" /> {selectedProject.projectCode || 'PRJ'}</span>
                    <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-gray-400" /> PM: {selectedProject.projectManager?.name || selectedProject.projectManager?.user?.name || 'Unassigned'}</span>
                    <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-blue-500" /> {allocatedResourcesCount} Resources</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigate(`/dashboard/${businessId}/project-operations/projects/${selectedProject.id}/edit`)}
                    className="px-4 py-2 text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Edit Details
                  </button>
                  <button 
                    onClick={() => navigate(`/dashboard/${businessId}/project-operations/projects/${selectedProject.id}`)}
                    className="px-4 py-2 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    Manage Project
                  </button>
                </div>
              </div>

              {/* Tabs Navigation with Horizontal Scroll Controls */}
              <div className="relative border-b border-gray-200 dark:border-gray-800 flex items-center bg-white dark:bg-gray-900 shadow-xs z-20 flex-none px-2 sticky top-[81px]">
                <button 
                  onClick={() => scrollTabs('left')}
                  aria-label="Scroll tabs left"
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-none cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div ref={tabContainerRef} className="flex-1 flex overflow-x-auto scrollbar-hide px-2">
                  {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const count = (tab as any).count;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center px-4 py-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                          isActive 
                            ? 'border-blue-600 text-blue-700 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-900/20' 
                            : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 mr-2" />
                        <span>{tab.label}</span>
                        {typeof count === 'number' && (
                          <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                          }`}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <button 
                  onClick={() => scrollTabs('right')}
                  aria-label="Scroll tabs right"
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-none cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Tab Content */}
              <div data-lenis-prevent className="flex-1 p-6 md:p-8 pb-36 min-w-0">
                <div className="max-w-6xl mx-auto space-y-6 pb-20">
                  {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
                      
                      {/* Financials KPI */}
                      <div className="col-span-1 md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1.5 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Total Budget</p>
                          <h3 className="text-xl font-black text-gray-900 dark:text-white">${Number(selectedProject.budget || 0).toLocaleString()}</h3>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1.5 flex items-center gap-1.5"><Receipt className="w-3.5 h-3.5 text-red-500" /> Spent Cost</p>
                          <h3 className="text-xl font-black text-red-600">${Number(selectedProject.actualCost || 0).toLocaleString()}</h3>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1.5 flex items-center gap-1.5"><BarChart className="w-3.5 h-3.5 text-green-500" /> Remaining</p>
                          <h3 className="text-xl font-black text-green-600">${(Number(selectedProject.budget || 0) - Number(selectedProject.actualCost || 0)).toLocaleString()}</h3>
                        </div>
                        <div className="bg-gradient-to-br from-blue-900 to-blue-800 p-5 rounded-xl shadow-lg text-white">
                          <p className="text-[10px] text-blue-300 uppercase font-black tracking-widest mb-1.5 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Completion</p>
                          <h3 className="text-2xl font-black">{projectProgress}%</h3>
                        </div>
                      </div>

                      {/* Work Items KPI */}
                      <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                          <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white mb-4">Task Execution</h3>
                            <div className="flex justify-between items-end mb-2">
                               <div>
                                 <p className="text-3xl font-black text-blue-600">{completedTasks}</p>
                                 <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Completed</p>
                               </div>
                               <div className="text-right">
                                 <p className="text-2xl font-black text-gray-400">{pendingTasks}</p>
                                 <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Pending</p>
                               </div>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mt-4">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${projectProgress}%` }}></div>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                          <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white mb-4">Health & Operations</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center pb-2.5 border-b border-gray-100 dark:border-gray-800">
                               <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 text-red-500" /> Open Issues</span>
                               <span className="text-xs font-black text-gray-900 dark:text-white">{openIssues}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2.5 border-b border-gray-100 dark:border-gray-800">
                               <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-orange-500" /> Identified Risks</span>
                               <span className="text-xs font-black text-gray-900 dark:text-white">{identifiedRisks}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2.5 border-b border-gray-100 dark:border-gray-800">
                               <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-blue-500" /> Hours Logged</span>
                               <span className="text-xs font-black text-gray-900 dark:text-white">{hoursLogged} hrs</span>
                            </div>
                            <div className="flex justify-between items-center">
                               <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-indigo-500" /> Team Allocated</span>
                               <span className="text-xs font-black text-gray-900 dark:text-white">{allocatedResourcesCount} members</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Details Sidebar */}
                      <div className="col-span-1 space-y-4">
                        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                          <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white mb-4">Project Meta</h3>
                          <div className="space-y-3.5 text-xs">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Start Date</span>
                              <span className="font-bold text-gray-900 dark:text-white">{selectedProject.startDate ? new Date(selectedProject.startDate).toLocaleDateString() : 'TBD'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">End Date</span>
                              <span className="font-bold text-gray-900 dark:text-white">{selectedProject.endDate ? new Date(selectedProject.endDate).toLocaleDateString() : 'TBD'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Priority</span>
                              <span className="font-bold text-orange-600 uppercase">{selectedProject.priority || 'Medium'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</span>
                              <span className="font-bold text-gray-900 dark:text-white">{selectedProject.customer?.name || selectedProject.customer?.company || 'Internal'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}
                  
                  {activeTab === 'resources' && (
                    <ResourceWorkspaceTab project={selectedProject} businessId={businessId} navigate={navigate} />
                  )}

                  {activeTab === 'tasks' && (
                    <TaskWorkspaceTab project={selectedProject} businessId={businessId} navigate={navigate} />
                  )}

                  {activeTab === 'milestones' && (
                    <MilestoneWorkspaceTab project={selectedProject} businessId={businessId} navigate={navigate} />
                  )}

                  {activeTab === 'timesheets' && (
                    <TimesheetWorkspaceTab project={selectedProject} businessId={businessId} navigate={navigate} />
                  )}

                  {activeTab === 'issues' && (
                    <IssueWorkspaceTab project={selectedProject} businessId={businessId} navigate={navigate} />
                  )}

                  {activeTab === 'team' && (
                    <TeamWorkspaceTab project={selectedProject} businessId={businessId} navigate={navigate} />
                  )}

                  {activeTab === 'timeline' && (
                    <TimelineWorkspaceTab project={selectedProject} />
                  )}

                  {activeTab === 'planning' && (
                    <PlanningWorkspaceTab project={selectedProject} businessId={businessId} navigate={navigate} />
                  )}

                  {activeTab !== 'overview' && 
                   activeTab !== 'resources' && 
                   activeTab !== 'tasks' && 
                   activeTab !== 'milestones' && 
                   activeTab !== 'timesheets' && 
                   activeTab !== 'issues' && 
                   activeTab !== 'team' && 
                   activeTab !== 'timeline' && 
                   activeTab !== 'planning' && (
                    <GenericWorkspaceTab title={tabs.find(t => t.id === activeTab)?.label || 'Workspace'} project={selectedProject} />
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <LayoutGrid className="w-12 h-12 mb-3 text-gray-300" />
              <p className="text-sm font-semibold">Select a project from the left pane to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Project Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setProjectToDelete(null)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-800 z-10 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Delete Project</h3>
                <p className="text-xs text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete project <strong className="text-gray-900 dark:text-white">{projectToDelete.projectName}</strong> ({projectToDelete.projectCode})? All associated tasks, schedules, and documents will be removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={isDeletingProject}
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingProject}
                onClick={handleDeleteProject}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeletingProject ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Panel Slide-over */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right border-l border-gray-200 dark:border-gray-800">
            <div className="flex-none p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2 text-gray-900 dark:text-white"><SlidersHorizontal className="w-5 h-5 text-blue-600" /> Advanced Filters</h2>
              <button onClick={() => setIsFilterOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 p-6 space-y-8 overflow-y-auto">
              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Status</h3>
                <div className="flex flex-wrap gap-2">
                  {['DRAFT', 'PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'].map(s => (
                    <button key={s} onClick={() => setFilters({...filters, 'Status': s})} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${filters['Status'] === s ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>{s.replace('_', ' ')}</button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Priority</h3>
                <div className="flex flex-wrap gap-2">
                  {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(s => (
                    <button key={s} onClick={() => setFilters({...filters, 'Priority': s})} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${filters['Priority'] === s ? 'bg-orange-50 border-orange-200 text-orange-700 shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Execution Type</h3>
                <div className="flex flex-wrap gap-2">
                  {['SERVICE', 'PRODUCT', 'HYBRID'].map(s => (
                    <button key={s} onClick={() => setFilters({...filters, 'Type': s})} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${filters['Type'] === s ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Department</h3>
                <div className="flex flex-wrap gap-2">
                  {['Enterprise', 'SMB', 'Government', 'Internal'].map(s => (
                    <button key={s} onClick={() => setFilters({...filters, 'Department': s})} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${filters['Department'] === s ? 'bg-green-50 border-green-200 text-green-700 shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>{s}</button>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Customer</h3>
                <select value={filters['Customer'] || ''} onChange={(e) => setFilters({...filters, 'Customer': e.target.value})} className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none shadow-sm">
                  <option value="">All Customers</option>
                  {Array.from(new Set(projects.filter(p => p.customerId).map(p => p.customerId))).map(id => {
                    const cust = projects.find(p => p.customerId === id)?.customer;
                    return <option key={id} value={id}>{cust?.name || cust?.company}</option>
                  })}
                </select>
              </div>

              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Project Manager</h3>
                <select value={filters['Manager'] || ''} onChange={(e) => setFilters({...filters, 'Manager': e.target.value})} className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none shadow-sm">
                  <option value="">All Managers</option>
                  {Array.from(new Set(projects.filter(p => p.projectManagerId).map(p => p.projectManagerId))).map(id => {
                    const mgr = projects.find(p => p.projectManagerId === id)?.projectManager;
                    return <option key={id} value={id}>{mgr?.name || mgr?.user?.name || mgr?.email}</option>
                  })}
                </select>
              </div>

              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Budget Range</h3>
                <select value={filters['Budget'] || ''} onChange={(e) => setFilters({...filters, 'Budget': e.target.value})} className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none shadow-sm">
                  <option value="">All Budgets</option>
                  <option value="under10k">Under $10,000</option>
                  <option value="10k-50k">$10,000 - $50,000</option>
                  <option value="over50k">Over $50,000</option>
                </select>
              </div>

              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Progress</h3>
                <select value={filters['Progress'] || ''} onChange={(e) => setFilters({...filters, 'Progress': e.target.value})} className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none shadow-sm">
                  <option value="">Any Progress</option>
                  <option value="0">0% (Not Started)</option>
                  <option value="under50">Under 50%</option>
                  <option value="over50">50% and above</option>
                  <option value="100">100% (Completed)</option>
                </select>
              </div>
            </div>
            <div className="flex-none p-6 border-t border-gray-100 dark:border-gray-800 flex gap-3 bg-white dark:bg-gray-900">
              <button onClick={() => setFilters({})} className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-black uppercase tracking-wider hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer">Clear</button>
              <button onClick={() => setIsFilterOpen(false)} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg text-sm font-black uppercase tracking-wider shadow-md hover:bg-blue-700 transition-colors cursor-pointer">Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
