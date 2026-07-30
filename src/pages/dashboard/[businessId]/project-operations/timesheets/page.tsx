import React from 'react';
import { GlobalTimesheetsWorkspace } from '@/components/project-operations/GlobalTimesheetsWorkspace';
import { useParams } from "react-router-dom";

export default function TimesheetsPage() {
  const { businessId } = useParams();
  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] overflow-hidden bg-gray-50 dark:bg-gray-950">
      <GlobalTimesheetsWorkspace businessId={businessId as string} />
    </div>
  );
}
