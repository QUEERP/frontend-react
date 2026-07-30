import { AddExpenseClient } from '@/components/dashboard/add-expense-client'
import { useParams, useSearchParams } from "react-router-dom";

export default function AddExpensePage() {
  const routerParams = useParams() as any;
  const { businessId } = routerParams;

  
  const searchParams = useSearchParams()[0];

  return <AddExpenseClient businessId={businessId as string}  />
}
