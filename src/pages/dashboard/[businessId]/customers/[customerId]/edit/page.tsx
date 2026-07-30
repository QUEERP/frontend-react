import { CustomerEditClient } from '@/components/dashboard/customer-edit-client'
import { useParams } from "react-router-dom";

export default function CustomerEditPage() {
  const routerParams = useParams() as any;
  const { businessId } = routerParams;

  const { customerId } = useParams()
  return <CustomerEditClient businessId={businessId as string} customerId={customerId as string} />
}
