import { VendorForm } from '@/components/dashboard/vendor-form'
import { useParams } from "react-router-dom";

export default function CreateVendorPage() {
  const { businessId } = useParams();
  return (
    <div className="flex-1 w-full bg-[#f8fafc] px-4 sm:px-6 lg:px-8">
      <VendorForm businessId={businessId} isEditing={false} />
    </div>
  )
}
