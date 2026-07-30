const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/pages/dashboard/[businessId]/activities/[activityId]/edit/page.tsx',
  'src/pages/dashboard/[businessId]/attendance/page.tsx',
  'src/pages/dashboard/[businessId]/bills/[billId]/edit/page.tsx',
  'src/pages/dashboard/[businessId]/campaigns/page.tsx',
  'src/pages/dashboard/[businessId]/crm-tasks/page.tsx',
  'src/pages/dashboard/[businessId]/deals/[id]/edit/page.tsx',
  'src/pages/dashboard/[businessId]/deals/[id]/page.tsx',
  'src/pages/dashboard/[businessId]/deals/add/page.tsx',
  'src/pages/dashboard/[businessId]/documents/page.tsx',
  'src/pages/dashboard/[businessId]/email-logs/page.tsx',
  'src/pages/dashboard/[businessId]/employee-documents/page.tsx',
  'src/pages/dashboard/[businessId]/hr-analytics/page.tsx',
  'src/pages/dashboard/[businessId]/leads/[id]/convert/page.tsx',
  'src/pages/dashboard/[businessId]/leads/[id]/convert/test.tsx',
  'src/pages/dashboard/[businessId]/leads/[id]/edit/page.tsx',
  'src/pages/dashboard/[businessId]/leads/add/page.tsx',
  'src/pages/dashboard/[businessId]/notes/page.tsx',
  'src/pages/dashboard/[businessId]/project-operations/estimations/create/page.tsx',
  'src/pages/dashboard/[businessId]/project-operations/issues/create/page.tsx',
  'src/pages/dashboard/[businessId]/project-operations/meetings/create/page.tsx',
  'src/pages/dashboard/[businessId]/project-operations/milestones/create/page.tsx',
  'src/pages/dashboard/[businessId]/project-operations/negotiations/create/page.tsx',
  'src/pages/dashboard/[businessId]/project-operations/page.tsx',
  'src/pages/dashboard/[businessId]/project-operations/planning/create/page.tsx',
  'src/pages/dashboard/[businessId]/project-operations/projects/[projectId]/edit/page.tsx',
  'src/pages/dashboard/[businessId]/project-operations/projects/[projectId]/page.tsx',
  'src/pages/dashboard/[businessId]/project-operations/proposals/create/page.tsx',
  'src/pages/dashboard/[businessId]/project-operations/requirements/create/page.tsx',
  'src/pages/dashboard/[businessId]/project-operations/resources/create/page.tsx',
  'src/pages/dashboard/[businessId]/project-operations/tasks/create/page.tsx',
  'src/pages/dashboard/[businessId]/project-operations/timesheets/create/page.tsx',
  'src/pages/dashboard/[businessId]/purchase-orders/[id]/edit/page.tsx',
  'src/pages/dashboard/[businessId]/purchase-orders/add/page.tsx',
  'src/pages/dashboard/[businessId]/purchase-requests/[id]/page.tsx',
  'src/pages/dashboard/[businessId]/sales-orders/[id]/edit/page.tsx',
  'src/pages/dashboard/[businessId]/sales-orders/add/page.tsx',
  'src/pages/dashboard/[businessId]/bank-change-requests/[requestId]/page.tsx',
  'src/pages/dashboard/[businessId]/credit-notes/[id]/page.tsx',
  'src/pages/dashboard/[businessId]/customers/[customerId]/contacts/page.tsx',
  'src/pages/dashboard/[businessId]/customers/[customerId]/edit/page.tsx',
  'src/pages/dashboard/[businessId]/customers/[customerId]/view/page.tsx',
  'src/pages/dashboard/[businessId]/employees/[employeeId]/edit/page.tsx',
  'src/pages/dashboard/[businessId]/employees/[employeeId]/page.tsx',
  'src/pages/dashboard/[businessId]/expenses/[expenseId]/edit/page.tsx',
  'src/pages/dashboard/[businessId]/expenses/add/page.tsx',
  'src/pages/dashboard/[businessId]/invoices/[id]/page.tsx',
  'src/pages/dashboard/[businessId]/invoices/add/page.tsx',
  'src/pages/dashboard/[businessId]/journal-entries/[id]/page.tsx',
  'src/pages/dashboard/[businessId]/payrolls/[payrollId]/page.tsx',
  'src/pages/dashboard/[businessId]/warehouses/[warehouseId]/page.tsx',
];

for (const relPath of filesToFix) {
  const fullPath = path.join(__dirname, relPath);
  if (!fs.existsSync(fullPath)) continue;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  const origContent = content;
  
  // Inject useParams if missing
  if (!content.includes('import { useParams }')) {
    if (content.includes("from 'react-router-dom'")) {
      content = content.replace(/import\s*\{(.*?)\}\s*from\s*'react-router-dom';/, (match, p1) => {
        if (!p1.includes('useParams')) {
          return `import { ${p1}, useParams } from 'react-router-dom';`;
        }
        return match;
      });
    } else {
      content = "import { useParams } from 'react-router-dom';\n" + content;
    }
  }

  // Define extraction code cleanly WITHOUT removing anything else
  const extractCode = `\n  const routerParams = useParams() as any;\n  const { businessId, activityId, billId, customerId, dealId, employeeId, entryId, expenseId, invoiceId, leadId, orderId, payrollId, projectId, quotationId, requestId, salesOrderId, warehouseId, id } = routerParams;\n`;
  
  // Just inject it after the function signature
  if (!content.includes('routerParams')) {
    const regexFunc = /export (default )?function [A-Za-z0-9_]+\s*\([^)]*\)\s*\{/;
    content = content.replace(regexFunc, match => match + extractCode);
  }

  // Typecasting in JSX or method arguments if not already done
  content = content.replace(/businessId=\{businessId\}/g, "businessId={businessId as string}");
  content = content.replace(/requestId=\{requestId\}/g, "requestId={requestId as string}");
  content = content.replace(/creditNoteId=\{id\}/g, "creditNoteId={id as string}");
  content = content.replace(/customerId=\{customerId\}/g, "customerId={customerId as string}");
  content = content.replace(/dealId=\{id\}/g, "dealId={id as string}");
  content = content.replace(/employeeId=\{employeeId\}/g, "employeeId={employeeId as string}");
  content = content.replace(/expenseId=\{expenseId\}/g, "expenseId={expenseId as string}");
  content = content.replace(/projectId=\{projectId\}/g, "projectId={projectId as string}");
  content = content.replace(/invoiceId=\{id\}/g, "invoiceId={id as string}");
  content = content.replace(/entryId=\{id\}/g, "entryId={id as string}");
  content = content.replace(/payrollId=\{payrollId\}/g, "payrollId={payrollId as string}");
  content = content.replace(/warehouseId=\{warehouseId\}/g, "warehouseId={warehouseId as string}");

  // Fix ...d spread error in hr-analytics
  if (relPath.includes('hr-analytics')) {
    content = content.replace(/\.\.\.d,/g, '...d as any,');
    content = content.replace(/d\.totalSalary/g, '(d as any).totalSalary');
    content = content.replace(/d\.headcount/g, '(d as any).headcount');
  }

  // Fix setProjects(pd?.data || pd?.projects || [])
  if (relPath.includes('milestones/create/page.tsx')) {
    content = content.replace(/pd\?\.data/g, '(pd as any)?.data');
    content = content.replace(/pd\?\.projects/g, '(pd as any)?.projects');
    content = content.replace(/ud\?\.data/g, '(ud as any)?.data');
    content = content.replace(/ud\?\.users/g, '(ud as any)?.users');
  }
  
  // Fix toast title in requirements/create
  if (relPath.includes('requirements/create/page.tsx')) {
    content = content.replace(/toast\(\{\s*title:/g, 'toast({ description:');
  }

  if (origContent !== content) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Fixed safely', relPath);
  }
}
