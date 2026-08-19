import React from 'react';
import { ProjectOperationsReportClient } from '@/components/dashboard/project-operations-report-client';
import { useParams } from "react-router-dom";

export default function ReportsPage() {
  const { businessId } = useParams();
  return <ProjectOperationsReportClient businessId={businessId as string} />;
}
