const fs = require('fs');
const path = require('path');

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

  // Add taxPercent to interfaces only if they don't already have it
  const interfaces = ['ExpenseItem', 'Product', 'InvoiceItem', 'BillItem', 'QuotationItem', 'QuotationItemInput', 'SalesOrderItem', 'ItemRow'];
  
  for (const name of interfaces) {
    const regex = new RegExp(`(interface\\s+${name}(?:\\s+extends\\s+[^{]+)?\\s*\\{)([\\s\\S]*?\\})`, 'g');
    content = content.replace(regex, (match, p1, p2) => {
      let injected = p2;
      if (!injected.includes('taxPercent')) injected = '\n  taxPercent?: number;' + injected;
      if (!injected.includes('cgstPercent')) injected = '\n  cgstPercent?: number;' + injected;
      if (!injected.includes('sgstPercent')) injected = '\n  sgstPercent?: number;' + injected;
      if (!injected.includes('igstPercent')) injected = '\n  igstPercent?: number;' + injected;
      return p1 + injected;
    });
  }

  // specific fixes
  if (file.includes('create-product-modal.tsx')) {
    content = content.replace(/type FormState = \{([\s\S]*?)\}/, (match, p1) => {
      if (!p1.includes('taxPercent')) return `type FormState = {${p1}  taxPercent?: string;\n}`;
      return match;
    });
  }

  if (file.includes('recurring-invoices-page-client.tsx')) {
    content = content.replace(/rate:\s*string;(\s*)\}>/, 'rate: string;$1  taxPercent?: string;$1}>');
    content = content.replace(/rate:\s*''(\s*)\}/, "rate: '',$1  taxPercent: '0'$1}");
  }

  if (file.includes('sales-returns-page-client.tsx')) {
    content = content.replace(/total:\s*number;(\s*)\}>/, 'total: number;$1  taxPercent?: number;$1}>');
  }

  if (file.includes('new-vendor-bill-page-client.tsx')) {
    content = content.replace(/const tax = items\.reduce\(\(s, i\) => s \+ \(i\.quantity \* i\.unitPrice \* i\.taxPercent\) \/ 100, 0\)/, 'const tax = items.reduce((s, i) => s + (i.quantity * i.unitPrice * (i.taxPercent || 0)) / 100, 0)');
  }

  if (file.includes('quotation-form.tsx')) {
    content = content.replace(/discount:\s*0\n(\s*)\}/, 'discount: 0,\n$1  taxPercent: 0\n$1}');
  }

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
  }
}

console.log("Safe TS fixes applied");
