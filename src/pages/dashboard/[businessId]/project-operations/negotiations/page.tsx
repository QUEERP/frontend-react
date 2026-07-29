import React from 'react';
import { NegotiationsWorkspace } from '@/components/project-operations/NegotiationsWorkspace';
import { useParams } from "react-router-dom";

export default function NegotiationsPage() {
  const { businessId } = useParams();
  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] overflow-hidden bg-gray-50 dark:bg-gray-950">
      <NegotiationsWorkspace businessId={businessId} />
    </div>
  );
}
