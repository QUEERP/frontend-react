import React, { useState } from 'react';
import { 
  CheckSquare, Plus, Filter, Search, Clock, 
  MoreVertical, Calendar, Users, Paperclip, MessageSquare, List, LayoutGrid 
} from 'lucide-react';
import { StatusBadge } from '@/components/project-operations/StatusBadge';

export function TaskWorkspace({ project }: { project: any }) {
  const [viewMode, setViewMode] = useState<'list'|'kanban'>('list');

  // Dummy tasks for visualization
  const tasks = [
    { id: 'TSK-001', title: 'System Architecture Design', assignee: 'Sarah Jenkins', status: 'In Progress', priority: 'High', due: '2023-11-01', progress: 65, comments: 4, attachments: 2 },
    { id: 'TSK-002', title: 'Database Schema Setup', assignee: 'Mike Ross', status: 'Completed', priority: 'High', due: '2023-10-25', progress: 100, comments: 1, attachments: 1 },
    { id: 'TSK-003', title: 'API Gateway Implementation', assignee: 'Alex Chen', status: 'Planning', priority: 'Medium', due: '2023-11-15', progress: 0, comments: 0, attachments: 0 },
    { id: 'TSK-004', title: 'Frontend Dashboard UI', assignee: 'Sarah Jenkins', status: 'Review', priority: 'Medium', due: '2023-11-05', progress: 90, comments: 8, attachments: 3 },
  ];

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header Actions */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-transparent rounded-lg text-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 w-64"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">
            <Plus className="w-4 h-4" /> New Task
          </button>
        </div>
      </div>

      {/* Task Content */}
      <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {viewMode === 'list' ? (
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">Task</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Assignee</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Progress</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {tasks.map(task => (
                <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <CheckSquare className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{task.title}</p>
                        <p className="text-xs text-gray-500">{task.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={task.status} size="sm" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold uppercase">
                        {task.assignee.charAt(0)}
                      </div>
                      <span className="text-sm">{task.assignee}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {task.due}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-1">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${task.progress}%` }}></div>
                    </div>
                    <span className="text-[10px] text-gray-500 font-bold">{task.progress}%</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-all">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 h-full flex items-center justify-center text-gray-500">
            Kanban Board View Framework Configured
          </div>
        )}
      </div>
    </div>
  );
}
