import React from 'react';
import { Plus, Search, Filter, FolderKanban } from 'lucide-react';

import { useBusinessData } from '@/components/dashboard/business-data-provider';

export default function ProjectsTab({ businessId }: { businessId: string }) {
  const { business } = useBusinessData();
  
  const liveProjects = React.useMemo(() => {
    const projects = Array.isArray((business as any)?.projects) ? (business as any).projects : [];
    return projects.map((p: any) => ({
      id: p.id,
      code: p.projectCode || p.id,
      name: p.name,
      customer: p.customer?.company || p.customer?.companyName || 'Unknown Customer',
      manager: p.manager?.name || p.assignedTo?.name || 'Unassigned',
      progress: p.progress || 0,
      type: p.type || p.mode || 'SERVICE',
      status: p.status || 'Active'
    }));
  }, [business]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search projects..." 
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none w-64 dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <button className="p-2 border rounded-lg hover:bg-gray-50 dark:border-gray-700 text-gray-600 dark:text-gray-300">
            <FolderKanban className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:border-gray-700 transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 mt-4">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-900 dark:text-gray-400">
            <tr>
              <th className="px-6 py-3">Project Code</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Mode</th>
              <th className="px-6 py-3">Progress</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {liveProjects.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No projects found.</td></tr>
            )}
            {liveProjects.map((p: any, i: number) => (
              <tr key={p.id || i} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 font-medium text-blue-600">{p.code}</td>
                <td className="px-6 py-4 font-medium">{p.name}</td>
                <td className="px-6 py-4">{p.customer}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wide rounded-md ${
                    p.type === 'SERVICE' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                    p.type === 'PRODUCT' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                  }`}>
                    {p.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${p.progress}%` }}></div>
                  </div>
                  <span className="text-xs text-gray-500 mt-1 inline-block">{p.progress}% Complete</span>
                </td>
                <td className="px-6 py-4"><span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{p.status}</span></td>
                <td className="px-6 py-4">
                  <button className="text-blue-600 hover:underline">Manage</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
