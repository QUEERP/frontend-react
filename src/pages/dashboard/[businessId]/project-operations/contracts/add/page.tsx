import { AddContractClient } from '@/components/dashboard/add-contract-client'
import { useParams } from "react-router-dom";

export default function ProjectOperationsAddContractPage() {
  const { businessId } = useParams()
  return <AddContractClient businessId={businessId as string} />
}

