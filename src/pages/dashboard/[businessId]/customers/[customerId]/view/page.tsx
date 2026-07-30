import { CustomerViewClient } from '@/components/dashboard/customer-view-client'
import { useParams } from "react-router-dom";

export default function CustomerViewPage() {
  const routerParams = useParams() as any;
  const { businessId } = routerParams;

  const { customerId } = useParams()
  return <CustomerViewClient businessId={businessId as string} customerId={customerId as string} />
}
