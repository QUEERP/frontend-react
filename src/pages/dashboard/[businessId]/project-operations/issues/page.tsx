import React from 'react';
import { GlobalIssuesWorkspace } from '@/components/project-operations/GlobalIssuesWorkspace';
import { useParams } from "react-router-dom";

export default function IssuesPage() {
  const { businessId } = useParams();
  return (
    <div className="flex flex-col min-h-[calc(100vh-4.25rem)] bg-gray-50 dark:bg-gray-950 w-full min-w-0">
      <GlobalIssuesWorkspace businessId={businessId as string} />
    </div>
  );
}
