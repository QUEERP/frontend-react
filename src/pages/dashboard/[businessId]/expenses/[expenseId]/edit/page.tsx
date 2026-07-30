import { EditExpenseClient } from "@/components/dashboard/edit-expense-client"
import { useParams } from "react-router-dom";

export default function EditExpensePage() {
  const routerParams = useParams() as any;
  const { businessId } = routerParams;

  const { expenseId } = useParams();
  return <EditExpenseClient businessId={businessId as string} expenseId={expenseId as string} />
}
