import { UserDetailPageClient } from '@/components/dashboard/user-detail-page-client'
import { useParams } from "react-router-dom";

export default function UserDetailPage() {
  const { businessId, id } = useParams()
  return <UserDetailPageClient businessId={businessId} userId={id} />
}
