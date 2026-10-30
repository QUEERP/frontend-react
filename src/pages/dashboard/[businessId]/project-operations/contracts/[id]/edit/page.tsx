import { AddContractClient } from '@/components/dashboard/add-contract-client'
import { useParams } from "react-router-dom";

export default function ProjectOperationsEditContractPage() {
  const { businessId, id } = useParams()
  return <AddContractClient businessId={businessId as string} contractId={id as string} />
}

