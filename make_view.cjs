const fs = require('fs');

let c = fs.readFileSync('src/components/dashboard/edit-expense-client.tsx', 'utf-8');
c = c.replace(/EditExpenseClient/g, 'ViewExpenseClient');
c = c.replace(/Edit Expense/g, 'View Expense');
c = c.replace(/Update Expense/g, 'View Expense');
c = c.replace(/<Button type="button" onClick=\{handleSubmit\}[\s\S]*?<\/Button>/, '');
c = c.replace(/<Input /g, '<Input disabled ');
c = c.replace(/<Textarea /g, '<Textarea disabled ');
c = c.replace(/<Select /g, '<Select disabled ');
fs.writeFileSync('src/components/dashboard/view-expense-client.tsx', c);

fs.mkdirSync('src/pages/dashboard/[businessId]/expenses/[expenseId]/view', {recursive:true});
fs.writeFileSync('src/pages/dashboard/[businessId]/expenses/[expenseId]/view/page.tsx', `import { ViewExpenseClient } from "@/components/dashboard/view-expense-client";
import { useParams } from "react-router-dom";

export default function ViewExpensePage() {
  const { businessId, expenseId } = useParams();
  return <ViewExpenseClient businessId={businessId!} expenseId={expenseId!} />;
}`);

console.log("View expense generated");
