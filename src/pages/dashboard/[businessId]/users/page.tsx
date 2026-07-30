import { UsersPageClient } from '@/components/dashboard/users-page-client'
import { useParams } from "react-router-dom";

export default function UsersPage() {
  const { businessId } = useParams()
  return <UsersPageClient businessId={businessId as string} />
}
