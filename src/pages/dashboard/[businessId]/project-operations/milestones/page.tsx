import React from 'react';
import { GlobalMilestonesWorkspace } from '@/components/project-operations/GlobalMilestonesWorkspace';
import { useParams } from "react-router-dom";

export default function MilestonesPage() {
  const { businessId } = useParams();
  return (
    <div className="flex flex-col min-h-[calc(100vh-4.25rem)] bg-gray-50 dark:bg-gray-950 w-full min-w-0">
      <div className="flex-1 flex flex-col min-h-0 w-full min-w-0">
        <GlobalMilestonesWorkspace businessId={businessId as string} />
      </div>
    </div>
  );
}
