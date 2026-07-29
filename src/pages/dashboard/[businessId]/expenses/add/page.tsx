import { AddExpenseClient } from '@/components/dashboard/add-expense-client'
import { useParams, useSearchParams } from "react-router-dom";

export default function AddExpensePage() {
  const { businessId } = useParams()
  const searchParams = useSearchParams()[0];
const projectId = searchParams.get('projectId');
  return <AddExpenseClient businessId={businessId} projectId={projectId} />
}
