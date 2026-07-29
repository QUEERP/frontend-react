import React from 'react';
import { GlobalMilestonesWorkspace } from '@/components/project-operations/GlobalMilestonesWorkspace';
import { useParams } from "react-router-dom";

export default function MilestonesPage() {
  const { businessId } = useParams();
  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] overflow-hidden bg-gray-50 dark:bg-gray-950">
      <div className="flex-1 overflow-hidden">
        <GlobalMilestonesWorkspace businessId={businessId} />
      </div>
    </div>
  );
}
