import React from 'react';
import { InquiriesWorkspace } from '@/components/project-operations/InquiriesWorkspace';
import { useParams } from "react-router-dom";

export default function InquiriesPage() {
  const { businessId } = useParams();
  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] overflow-hidden bg-gray-50 dark:bg-gray-950">
      <InquiriesWorkspace businessId={businessId as string} />
    </div>
  );
}
