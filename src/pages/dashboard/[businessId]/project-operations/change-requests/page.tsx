import React from 'react';
import { GlobalChangeRequestsWorkspace } from '@/components/project-operations/GlobalChangeRequestsWorkspace';
import { useParams } from "react-router-dom";

export default function ChangeRequestsPage() {
  const { businessId } = useParams();
  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] overflow-hidden bg-gray-50 dark:bg-gray-950">
      <GlobalChangeRequestsWorkspace businessId={businessId} />
    </div>
  );
}
