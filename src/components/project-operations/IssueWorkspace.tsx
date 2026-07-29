import React from 'react';
import { AlertCircle, Plus, Search, Filter, ShieldAlert, ArrowRight, MessageSquare, Clock } from 'lucide-react';
import { StatusBadge } from '@/components/project-operations/StatusBadge';

export function IssueWorkspace({ project }: { project: any }) {
  const issues = [
    { id: 'ISS-001', title: 'Server Memory Leak', priority: 'Critical', status: 'Active', reporter: 'Alex Chen', assignedTo: 'DevOps Team', loggedDate: '2023-10-22', comments: 12 },
    { id: 'ISS-002', title: 'Client Feedback on UI', priority: 'Medium', status: 'Review', reporter: 'Sarah Jenkins', assignedTo: 'Design Team', loggedDate: '2023-10-24', comments: 3 },
  ];

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search issues..." 
              className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-transparent rounded-lg text-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 w-64"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 shadow-sm">
          <AlertCircle className="w-4 h-4" /> Log Issue
        </button>
      </div>

      <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="px-6 py-4">Issue</th>
              <th className="px-6 py-4">Priority</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Assigned To</th>
              <th className="px-6 py-4">Logged</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {issues.map(issue => (
              <tr key={issue.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className={`w-5 h-5 ${issue.priority === 'Critical' ? 'text-red-500' : 'text-orange-500'}`} />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{issue.title}</p>
                      <p className="text-xs text-gray-500">{issue.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full tracking-wider ${
                    issue.priority === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30'
                  }`}>
                    {issue.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={issue.status} size="sm" />
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium">{issue.assignedTo}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {issue.loggedDate}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-3 text-gray-400">
                    <span className="flex items-center gap-1 text-xs"><MessageSquare className="w-3.5 h-3.5" /> {issue.comments}</span>
                    <button className="p-1.5 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
