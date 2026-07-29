import React from 'react';
import { GlobalTicketsWorkspace } from '@/components/project-operations/GlobalTicketsWorkspace';
import { useParams } from "react-router-dom";

export default function TicketsPage() {
  const { businessId } = useParams();
  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] overflow-hidden bg-gray-50 dark:bg-gray-950">
      <div className="flex-none px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          <span>Project Operations</span>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span>Support</span>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="text-blue-600 dark:text-blue-400">Tickets</span>
        </div>
        <div className="flex justify-between items-center">
          <div>
             <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>
             <p className="text-sm text-gray-500 mt-1">Manage client support requests and SLA performance.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm">
              Export Log
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
              + New Ticket
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <GlobalTicketsWorkspace businessId={businessId} />
      </div>
    </div>
  );
}
