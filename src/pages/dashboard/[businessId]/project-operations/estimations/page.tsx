import React from 'react';
import { EstimationsWorkspace } from '@/components/project-operations/EstimationsWorkspace';
import { useParams } from "react-router-dom";

export default function EstimationsPage() {
  const { businessId } = useParams();
  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] max-h-[calc(100dvh-4rem)] min-h-0 overflow-hidden bg-gray-50 dark:bg-gray-950">
      <EstimationsWorkspace businessId={businessId as string} />
    </div>
  );
}
