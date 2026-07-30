import React from 'react';
import { GlobalPlanningWorkspace } from '@/components/project-operations/GlobalPlanningWorkspace';
import { useParams } from "react-router-dom";

export default function PlanningPage() {
  const { businessId } = useParams();
  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] overflow-hidden bg-gray-50 dark:bg-gray-950">
      <div className="flex-1 overflow-hidden">
        <GlobalPlanningWorkspace businessId={businessId as string} />
      </div>
    </div>
  );
}
