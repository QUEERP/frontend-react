import { LeaveApprovalsPageClient } from '@/components/dashboard/leave-approvals-page-client'
import { useParams } from "react-router-dom";

export default function LeaveApprovalsPage() {
  const { businessId } = useParams()
  return <LeaveApprovalsPageClient businessId={businessId} />
}
