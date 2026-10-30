import { ContractDetailsClient } from '@/components/dashboard/contract-details-client'
import { useParams } from "react-router-dom";

export default function ProjectOperationsContractDetailsPage() {
  const { businessId, id } = useParams()
  return <ContractDetailsClient businessId={businessId as string} contractId={id as string} />
}

