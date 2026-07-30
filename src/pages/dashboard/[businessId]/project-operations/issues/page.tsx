import React from 'react';
import { GlobalIssuesWorkspace } from '@/components/project-operations/GlobalIssuesWorkspace';
import { useParams } from "react-router-dom";

export default function IssuesPage() {
  const { businessId } = useParams();
  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] overflow-hidden bg-gray-50 dark:bg-gray-950">
      <GlobalIssuesWorkspace businessId={businessId as string} />
    </div>
  );
}
