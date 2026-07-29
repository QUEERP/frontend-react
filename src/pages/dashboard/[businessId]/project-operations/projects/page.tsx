import React, { use } from 'react';
import ProjectsWorkspace from './ProjectsWorkspace';
import { useParams } from "react-router-dom";

export default function ProjectsPage() {
  const { businessId } = useParams();
  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] overflow-hidden bg-gray-50 dark:bg-gray-950">
      <div className="flex-1 overflow-hidden">
        <ProjectsWorkspace businessId={businessId} />
      </div>
    </div>
  );
}
