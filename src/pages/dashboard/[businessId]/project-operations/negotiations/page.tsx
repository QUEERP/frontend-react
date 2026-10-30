import React from 'react';
import { NegotiationsWorkspace } from '@/components/project-operations/NegotiationsWorkspace';
import { useParams } from "react-router-dom";

export default function NegotiationsPage() {
  const { businessId } = useParams();
  return (
    <div className="flex flex-col h-[calc(100vh-4.25rem)] bg-gray-50 dark:bg-gray-950 w-full min-w-0 overflow-hidden">
      <NegotiationsWorkspace businessId={businessId as string} />
    </div>
  );
}
