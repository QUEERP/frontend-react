import React from 'react';
import { useParams } from 'react-router-dom';
import { EstimationDetailsClient } from '@/components/dashboard/estimation-details-client';

export default function EstimationDetailsPage() {
  const { businessId, id: estimationId } = useParams();

  if (!businessId || !estimationId) {
    return <div>Business ID or Estimation ID is missing.</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <EstimationDetailsClient businessId={businessId} estimationId={estimationId} />
    </div>
  );
}
