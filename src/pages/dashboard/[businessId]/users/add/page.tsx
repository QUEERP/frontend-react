import { AddUserPageClient } from '@/components/dashboard/add-user-page-client'
import { useParams } from "react-router-dom";

export default function AddUserPage() {
  const { businessId } = useParams()
  return <AddUserPageClient businessId={businessId as string} />
}
