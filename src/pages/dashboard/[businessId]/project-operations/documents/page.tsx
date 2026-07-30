import React from 'react';
import { GlobalDocumentsWorkspace } from '@/components/project-operations/GlobalDocumentsWorkspace';
import { useParams } from "react-router-dom";

export default function DocumentsPage() {
  const { businessId } = useParams();
  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] overflow-hidden bg-gray-50 dark:bg-gray-950">
      <div className="flex-none px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <span>Project Operations</span>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="text-blue-600 dark:text-blue-400">Documents</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden bg-gray-100/50 dark:bg-gray-950">
        <GlobalDocumentsWorkspace businessId={businessId as string} />
      </div>
    </div>
  );
}
