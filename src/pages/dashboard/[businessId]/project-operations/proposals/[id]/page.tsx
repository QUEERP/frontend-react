import React from 'react';
import { useParams } from 'react-router-dom';
import { ProposalDetailsClient } from '@/components/dashboard/proposal-details-client';

export default function ProposalDetailsPage() {
  const { businessId, id: proposalId } = useParams();

  if (!businessId || !proposalId) {
    return <div>Business ID or Proposal ID is missing.</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <ProposalDetailsClient businessId={businessId} proposalId={proposalId} />
    </div>
  );
}
