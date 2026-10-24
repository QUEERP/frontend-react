import { useParams, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import ProjectDetailTabs from './ProjectDetailTabs';
import { BasicProjectDetailsClient } from '@/components/dashboard/basic-project-details-client';
import { useBusinessData } from '@/components/dashboard/business-data-provider';
import { projectOperationsAPI } from '@/lib/api/project-operations';
import { ArrowLeft, Edit } from 'lucide-react';

export default function ProjectDetailsPage() {
  const routerParams = useParams() as any;
  const navigate = useNavigate();
  const { businessId, projectId } = routerParams;
  const { business } = useBusinessData();
  
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (businessId && projectId) {
      loadProject();
    }
  }, [businessId, projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const res = await projectOperationsAPI.getProjectDetails(businessId, projectId);
      if (res.success && res.project) {
        setProject(res.project);
      }
    } catch (err) {
      console.error("Failed to load project:", err);
    } finally {
      setLoading(false);
    }
  };

  const isBasic = business?.businessType?.toLowerCase() === 'basic';

  if (isBasic) {
    return <BasicProjectDetailsClient businessId={businessId as string} projectId={projectId as string} />;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold">Loading project details...</p>
      </div>
    );
  }

  const activeProject = project || {
    id: projectId,
    projectCode: "PRJ-00000",
    projectName: "Project",
    executionType: "HYBRID",
    status: "ACTIVE",
    customer: { name: 'Internal' }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(`/dashboard/${businessId}/project-operations/projects`)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 transition-colors mr-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{activeProject.projectName}</h1>
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {activeProject.executionType || 'HYBRID'}
            </span>
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {activeProject.status || 'ACTIVE'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1 ml-9">
            {activeProject.projectCode} • Customer: {activeProject.customer?.name || activeProject.customer?.company || 'Internal'}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate(`/dashboard/${businessId}/project-operations/projects/${projectId}/edit`)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:border-gray-700 text-sm font-medium transition-colors"
          >
            <Edit className="w-4 h-4" /> Edit Project
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <ProjectDetailTabs project={activeProject} businessId={businessId as string} onProjectUpdate={loadProject} />
      </div>
    </div>
  );
}
