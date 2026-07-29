import { EditExpenseClient } from "@/components/dashboard/edit-expense-client"
import { useParams } from "react-router-dom";

export default function EditExpensePage() {
  const { businessId, expenseId } = useParams();
  return <EditExpenseClient businessId={businessId} expenseId={expenseId} />
}
