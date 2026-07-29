import { AddContractClient } from '@/components/dashboard/add-contract-client'
import { useParams } from "react-router-dom";

export default function AddContractPage() {
  const { businessId } = useParams()
  return <AddContractClient businessId={businessId} />
}
