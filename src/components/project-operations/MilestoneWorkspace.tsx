import React from 'react';
import { Flag, Plus, Calendar, DollarSign, CheckCircle } from 'lucide-react';
import { StatusBadge } from '@/components/project-operations/StatusBadge';
import { ProgressBar } from '@/components/project-operations/ProgressBar';

export function MilestoneWorkspace({ project }: { project: any }) {
  const milestones = [
    { id: 'MIL-001', title: 'Phase 1: Design Sign-off', status: 'Completed', date: '2023-10-30', progress: 100, triggerBilling: true, amount: 25000 },
    { id: 'MIL-002', title: 'Phase 2: Core Infrastructure', status: 'Active', date: '2023-11-30', progress: 45, triggerBilling: true, amount: 45000 },
    { id: 'MIL-003', title: 'Phase 3: UAT & Go Live', status: 'Planning', date: '2023-12-15', progress: 0, triggerBilling: true, amount: 30000 },
  ];

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Project Milestones</h3>
          <p className="text-xs text-gray-500">Track key deliverables and billing triggers</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">
          <Plus className="w-4 h-4" /> Add Milestone
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-4">
        {milestones.map(milestone => (
          <div key={milestone.id} className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col group hover:border-blue-300 transition-colors cursor-pointer">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                <Flag className="w-5 h-5 text-gray-500 group-hover:text-blue-600" />
              </div>
              <StatusBadge status={milestone.status} size="sm" />
            </div>
            
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{milestone.title}</h4>
            <p className="text-xs text-gray-500 mb-4 font-mono">{milestone.id}</p>
            
            <div className="space-y-3 mb-5 flex-1">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 gap-2">
                <Calendar className="w-4 h-4" /> Due: {milestone.date}
              </div>
              {milestone.triggerBilling && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" /> Billing: ${milestone.amount.toLocaleString()}
                </div>
              )}
            </div>
            
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <ProgressBar progress={milestone.progress} showPercent={true} colorClass={milestone.progress === 100 ? 'bg-green-500' : 'bg-blue-600'} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
