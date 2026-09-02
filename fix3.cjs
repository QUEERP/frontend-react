const fs = require('fs');
const path = require('path');

const interfacesToPatch = [
  'ExpenseItem', 'Product', 'InvoiceItem', 'BillItem', 
  'QuotationItem', 'QuotationItemInput', 'SalesOrderItem', 'ItemRow'
];

function patchInterfaces(content) {
  let modified = content;
  for (const name of interfacesToPatch) {
    // Regex matches "export interface X {" or "interface X {"
    const regex = new RegExp(`(interface\\s+${name}(?:\\s+extends\\s+[^{]+)?\\s*\\{)`, 'g');
    modified = modified.replace(regex, `$1\n  taxPercent?: number;\n  cgstPercent?: number;\n  sgstPercent?: number;\n  igstPercent?: number;\n`);
  }
  // Remove duplicates just in case
  modified = modified.replace(/(taxPercent\?: number;\s*){2,}/g, 'taxPercent?: number;\n  ');
  return modified;
}

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.ts') || file.endsWith('.tsx')) results.push(file);
    }
  });
  return results;
};

const files = walk(path.join(__dirname, 'src'));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  content = patchInterfaces(content);

  // Specific inline fixes
  if (file.includes('create-product-modal.tsx')) {
    content = content.replace(/taxCode:\s*string;/, 'taxCode: string; taxPercent?: string;');
  }
  
  if (file.includes('recurring-invoices-page-client.tsx')) {
    content = content.replace(/rate:\s*string;\s*\}>/, 'rate: string; taxPercent?: string; }>');
    content = content.replace(/rate:\s*'',?\s*\}/, "rate: '', taxPercent: '0' }");
  }

  if (file.includes('sales-returns-page-client.tsx')) {
    content = content.replace(/total:\s*number;\s*\}>/, 'total: number; taxPercent?: number; }>');
  }

  if (file.includes('inventory-item-table.tsx')) {
    content = content.replace(/availableStock\?:\s*number;\s*\}>/, 'availableStock?: number; taxPercent?: number; }>');
  }

  if (file.includes('new-vendor-bill-page-client.tsx')) {
    content = content.replace(/\{ description:\s*'',\s*quantity:\s*1,\s*unitPrice:\s*0\s*\}/, "{ description: '', quantity: 1, unitPrice: 0, taxPercent: 0 }");
  }

  // Quotation form `FormState` doesn't exist, but inline quotation item initialization might need `taxPercent: 0`
  if (file.includes('quotation-form.tsx')) {
    content = content.replace(/discount:\s*0\s*\}/, 'discount: 0, taxPercent: 0 }');
  }

  // Remove `taxRate?: number;` if we added it, but let's just let it be. We only added `taxPercent` above.

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
  }
}

console.log("Clean fixes applied");
