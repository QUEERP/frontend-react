import React from 'react';
import { ProposalsWorkspace } from '@/components/project-operations/ProposalsWorkspace';
import { useParams } from "react-router-dom";

export default function ProposalsPage() {
  const { businessId } = useParams();
  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] overflow-hidden bg-gray-50 dark:bg-gray-950">
      <ProposalsWorkspace businessId={businessId as string} />
    </div>
  );
}
