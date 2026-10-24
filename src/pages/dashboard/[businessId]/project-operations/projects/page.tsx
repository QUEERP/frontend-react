import React from 'react';
import ProjectsWorkspace from './ProjectsWorkspace';
import { useParams } from "react-router-dom";

export default function ProjectsPage() {
  const { businessId } = useParams();
  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] max-h-[calc(100dvh-4rem)] min-h-0 overflow-hidden bg-gray-50 dark:bg-gray-950">
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <ProjectsWorkspace businessId={businessId as string} />
      </div>
    </div>
  );
}
