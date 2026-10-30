import { ContractsPageClient } from '@/components/dashboard/contracts-page-client'
import { useParams } from "react-router-dom";

export default function ProjectOperationsContractsPage() {
  const { businessId } = useParams()
  return <ContractsPageClient businessId={businessId as string} />
}

