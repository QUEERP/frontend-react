import React from 'react';
import { GitPullRequest, Search, Plus, Filter, CheckCircle, XCircle, Clock, DollarSign, Calendar } from 'lucide-react';
import { StatusBadge } from '@/components/project-operations/StatusBadge';

export function ChangeRequestWorkspace({ project }: { project: any }) {
  const changeRequests = [
    { id: 'CR-001', title: 'Add Single Sign-On (SSO) Support', requestedBy: 'Acme Corp (Client)', status: 'Pending Approval', costImpact: 4500, timelineImpact: '+2 Weeks', loggedDate: '2023-10-25' },
    { id: 'CR-002', title: 'Update Dashboard Analytics Charts', requestedBy: 'Sarah Jenkins (PM)', status: 'Approved', costImpact: 0, timelineImpact: 'None', loggedDate: '2023-10-15' },
    { id: 'CR-003', title: 'Migrate to PostgreSQL 15', requestedBy: 'DevOps Team', status: 'Rejected', costImpact: 2000, timelineImpact: '+3 Days', loggedDate: '2023-10-10' },
  ];

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search change requests..." 
              className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-transparent rounded-lg text-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 w-64"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">
          <Plus className="w-4 h-4" /> New Change Request
        </button>
      </div>

      <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="px-6 py-4">Change Request</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Impact</th>
              <th className="px-6 py-4">Requested By</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {changeRequests.map(cr => (
              <tr key={cr.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${cr.status === 'Approved' ? 'bg-green-100 text-green-600' : cr.status === 'Rejected' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                      <GitPullRequest className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{cr.title}</p>
                      <p className="text-xs text-gray-500">{cr.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={cr.status === 'Pending Approval' ? 'PENDING' : cr.status.toUpperCase()} size="sm" />
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs">
                      <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                      <span className={cr.costImpact > 0 ? 'text-orange-600 font-medium' : 'text-gray-500'}>
                        {cr.costImpact > 0 ? `+$${cr.costImpact}` : 'No Cost Impact'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span className={cr.timelineImpact !== 'None' ? 'text-orange-600 font-medium' : 'text-gray-500'}>
                        {cr.timelineImpact}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium">{cr.requestedBy}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {cr.loggedDate}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  {cr.status === 'Pending Approval' ? (
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-md transition-colors" title="Approve">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors" title="Reject">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Processed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
