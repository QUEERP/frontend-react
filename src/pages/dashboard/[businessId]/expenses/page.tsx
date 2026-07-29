import { ExpensePageClient } from '@/components/dashboard/expense-page-client'
import { useParams } from "react-router-dom";

export default function ExpensesPage() {
  const { businessId } = useParams()
  return <ExpensePageClient businessId={businessId} />
}
