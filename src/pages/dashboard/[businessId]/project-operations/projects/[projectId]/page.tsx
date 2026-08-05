import { useParams } from 'react-router-dom';
import React, { use } from 'react';
import ProjectDetailTabs from './ProjectDetailTabs';
import { BasicProjectDetailsClient } from '@/components/dashboard/basic-project-details-client';
import { useBusinessData } from '@/components/dashboard/business-data-provider';

export default function ProjectDetailsPage() {
  const routerParams = useParams() as any;
  const { businessId, projectId } = routerParams;

  
  const { business } = useBusinessData();
  
  const isBasic = business?.businessType?.toLowerCase() === 'basic';

  if (isBasic) {
    return <BasicProjectDetailsClient businessId={businessId as string} projectId={projectId as string} />;
  }

  // In a real application, fetch project details here from projectId
  // For demonstration, we simulate fetching the project with its execution type
  const mockedProject = {
    id: projectId,
    projectCode: "PRJ-00124",
    projectName: "Global Corp Rebranding",
    executionType: "HYBRID", // Can be SERVICE, PRODUCT, HYBRID
    status: "Active",
    customer: "Global Corp"
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{mockedProject.projectName}</h1>
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {mockedProject.executionType}
            </span>
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {mockedProject.status}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{mockedProject.projectCode} • Customer: {mockedProject.customer}</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:border-gray-700 text-sm font-medium transition-colors">
            Edit Project
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <ProjectDetailTabs project={mockedProject} businessId={businessId as string} />
      </div>
    </div>
  );
}
