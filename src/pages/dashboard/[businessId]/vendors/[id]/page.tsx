import { ViewVendorClient } from "@/components/dashboard/view-vendor-client"
import { useParams } from "react-router-dom";

export default function ViewVendorPage() {
  const { businessId, id } = useParams();
  return <ViewVendorClient businessId={businessId as string} vendorId={id as string} />
}
