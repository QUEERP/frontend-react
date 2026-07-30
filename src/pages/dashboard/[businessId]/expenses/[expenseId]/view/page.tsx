import { ViewExpenseClient } from "@/components/dashboard/view-expense-client";
import { useParams } from "react-router-dom";

export default function ViewExpensePage() {
  const { businessId, expenseId } = useParams();
  return <ViewExpenseClient businessId={businessId!} expenseId={expenseId!} />;
}