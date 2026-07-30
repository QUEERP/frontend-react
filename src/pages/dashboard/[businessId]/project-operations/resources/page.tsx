import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { GlobalResourcesWorkspace } from '@/components/project-operations/GlobalResourcesWorkspace';

export default function ResourcesPage() {
  const { businessId } = useParams();
  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] overflow-hidden bg-gray-50 dark:bg-gray-950">
      <div className="flex-none px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          <span>Project Operations</span>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span>Management</span>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="text-blue-600 dark:text-blue-400">Resources</span>
        </div>
        <div className="flex justify-between items-center">
          <div>
             <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Resource Planning</h1>
             <p className="text-sm text-gray-500 mt-1">Manage team capacity, allocations, and availability.</p>
          </div>
          <div className="flex gap-2">
            <Link to={`/dashboard/${businessId}/project-operations/resources/create`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              + Allocate Resource
            </Link>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <GlobalResourcesWorkspace businessId={businessId as string} />
      </div>
    </div>
  );
}
