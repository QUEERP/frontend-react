import React from 'react';
import { useParams } from 'react-router-dom';
import { GeneralReportsWorkspace } from '@/components/general-reports/GeneralReportsWorkspace';

export default function GeneralReportsPage() {
  const { businessId } = useParams<{ businessId: string }>();

  if (!businessId) return null;

  return (
    <div className="h-[calc(100vh-theme(spacing.16))] bg-gray-50 dark:bg-[#0a0a0a]">
      <GeneralReportsWorkspace businessId={businessId} />
    </div>
  );
}
