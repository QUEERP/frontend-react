import React from 'react';
import { GlobalChangeRequestsWorkspace } from '@/components/project-operations/GlobalChangeRequestsWorkspace';
import { useParams } from "react-router-dom";

export default function ChangeRequestsPage() {
  const { businessId } = useParams();
  return (
    <div className="flex flex-col min-h-[calc(100vh-4.25rem)] bg-gray-50 dark:bg-gray-950 w-full min-w-0">
      <GlobalChangeRequestsWorkspace businessId={businessId as string} />
    </div>
  );
}
