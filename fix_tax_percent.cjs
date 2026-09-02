const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const files = [
  'src/components/dashboard/add-expense-client.tsx',
  'src/components/dashboard/add-invoice-client.tsx',
  'src/components/dashboard/create-product-modal.tsx',
  'src/components/dashboard/edit-expense-client.tsx',
  'src/components/dashboard/inventory-item-table.tsx',
  'src/components/dashboard/invoice-details-client.tsx',
  'src/components/dashboard/new-vendor-bill-page-client.tsx',
  'src/components/dashboard/products-page-client.tsx',
  'src/components/dashboard/purchase-order-form.tsx',
  'src/components/dashboard/quotation-details-client.tsx',
  'src/components/dashboard/quotation-form.tsx',
  'src/components/dashboard/recurring-invoices-page-client.tsx',
  'src/components/dashboard/sales-order-details-client.tsx',
  'src/components/dashboard/sales-returns-page-client.tsx',
  'src/components/dashboard/view-expense-client.tsx',
  'src/lib/api/expense.ts',
  'src/lib/api/invoice.ts',
  'src/lib/api/products.ts',
  'src/lib/api/purchase.ts',
  'src/lib/api/quotation.ts',
  'src/lib/api/sales.ts'
];

for (const relPath of files) {
  const file = path.join(__dirname, relPath);
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // Fix ExpenseItem
  content = content.replace(/interface ExpenseItem \{([^}]+)\}/g, (match, p1) => {
    if (!p1.includes('taxPercent')) return `interface ExpenseItem {${p1}  taxPercent?: number;\n}`;
    return match;
  });

  // Fix Product
  content = content.replace(/interface Product \{([^}]+)\}/g, (match, p1) => {
    if (!p1.includes('taxPercent')) return `interface Product {${p1}  taxPercent?: number; taxRate?: number;\n}`;
    return match;
  });
  
  // Fix FormState in create-product-modal
  content = content.replace(/type FormState = \{([^}]+)\}/g, (match, p1) => {
    if (!p1.includes('taxPercent')) return `type FormState = {${p1}  taxPercent?: string;\n}`;
    return match;
  });

  // Fix ItemRow
  content = content.replace(/interface ItemRow \{([^}]+)\}/g, (match, p1) => {
    if (!p1.includes('taxPercent')) return `interface ItemRow {${p1}  taxPercent?: number; cgstPercent?: number; sgstPercent?: number; igstPercent?: number;\n}`;
    return match;
  });

  // Fix InvoiceItem
  content = content.replace(/interface InvoiceItem \{([^}]+)\}/g, (match, p1) => {
    if (!p1.includes('taxPercent')) return `interface InvoiceItem {${p1}  taxPercent?: number;\n}`;
    return match;
  });

  // Fix BillItem
  content = content.replace(/interface BillItem \{([^}]+)\}/g, (match, p1) => {
    if (!p1.includes('taxPercent')) return `interface BillItem {${p1}  taxPercent?: number;\n}`;
    return match;
  });

  // Fix QuotationItem
  content = content.replace(/interface QuotationItem \{([^}]+)\}/g, (match, p1) => {
    if (!p1.includes('taxPercent')) return `interface QuotationItem {${p1}  taxPercent?: number;\n}`;
    return match;
  });

  // Fix QuotationItemInput
  content = content.replace(/interface QuotationItemInput \{([^}]+)\}/g, (match, p1) => {
    if (!p1.includes('taxPercent')) return `interface QuotationItemInput {${p1}  taxPercent?: number; cgstPercent?: number; sgstPercent?: number; igstPercent?: number;\n}`;
    return match;
  });

  // Fix SalesOrderItem
  content = content.replace(/interface SalesOrderItem \{([^}]+)\}/g, (match, p1) => {
    if (!p1.includes('taxPercent')) return `interface SalesOrderItem {${p1}  taxPercent?: number;\n}`;
    return match;
  });
  
  // Fix recurring-invoices-page-client state
  content = content.replace(/customerId: string;\n\s*frequency: string;/g, `customerId: string;\n  frequency: string;\n  taxPercent?: string | number;`);

  // Fix sales-returns-page-client inline type
  content = content.replace(/description: string;\n\s*quantity: number;\n\s*price: number;\n\s*total: number;\n\s*}/g, `description: string;\n  quantity: number;\n  price: number;\n  total: number;\n  taxPercent?: number;\n}`);

  // Fix inventory-item-table inline type (items array)
  content = content.replace(/amount: number;\n\s*unit: string;\n\s*availableStock\?: number;/g, `amount: number;\n  unit: string;\n  taxPercent?: number;\n  availableStock?: number;`);

  // Some components might have `type ExpenseItem = {`
  content = content.replace(/type ExpenseItem = \{([^}]+)\}/g, (match, p1) => {
    if (!p1.includes('taxPercent')) return `type ExpenseItem = {${p1}  taxPercent?: number | string;\n}`;
    return match;
  });

  fs.writeFileSync(file, content, 'utf8');
}

console.log("Types updated.");
