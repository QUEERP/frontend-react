import React from 'react';
import { GlobalPlanningWorkspace } from '@/components/project-operations/GlobalPlanningWorkspace';
import { useParams } from "react-router-dom";

export default function PlanningPage() {
  const { businessId } = useParams();
  return (
    <div className="flex flex-col min-h-[calc(100vh-4.25rem)] bg-gray-50 dark:bg-gray-950 w-full min-w-0">
      <div className="flex-1 min-h-0 flex flex-col w-full min-w-0">
        <GlobalPlanningWorkspace businessId={businessId as string} />
      </div>
    </div>
  );
}
