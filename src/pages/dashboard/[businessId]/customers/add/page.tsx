import { AddCustomerClient } from '../../../../../components/dashboard/add-customer-client'
import { useParams } from "react-router-dom";

export default function AddCustomerPage() {
  const { businessId } = useParams()
  return <AddCustomerClient businessId={businessId as string} />
}
