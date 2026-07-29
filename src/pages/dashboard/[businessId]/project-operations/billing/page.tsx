import React from 'react';
import { GlobalBillingWorkspace } from '@/components/project-operations/GlobalBillingWorkspace';
import { useParams } from "react-router-dom";

export default function BillingPage() {
  const { businessId } = useParams();
  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] overflow-hidden bg-gray-50 dark:bg-gray-950">
      <div className="flex-none px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          <span>Project Operations</span>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span>Financials</span>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="text-blue-600 dark:text-blue-400">Billing</span>
        </div>
        <div className="flex justify-between items-center">
          <div>
             <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Project Billing</h1>
             <p className="text-sm text-gray-500 mt-1">Manage invoices, payments, and client billing cycles.</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <GlobalBillingWorkspace businessId={businessId} />
      </div>
    </div>
  );
}
