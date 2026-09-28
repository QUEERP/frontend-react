const fs = require('fs');

const pTable = 'c:/Users/DELL/Downloads/new-queerp/frontend/src/components/dashboard/inventory-item-table.tsx';
let cTable = fs.readFileSync(pTable, 'utf8');

cTable = cTable.replace(
  /<th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-\[100px\]">/g,
  '<th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[120px]">'
);

cTable = cTable.replace(
  /<th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-\[120px\]">Unit<\/th>/g,
  '<th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[120px]">Unit</th>'
);

cTable = cTable.replace(
  /<th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-\[120px\]">Rate<\/th>/g,
  '<th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[160px]">Rate</th>'
);

cTable = cTable.replace(
  /<th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider w-\[140px\]">Total<\/th>/g,
  '<th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[160px]">Total</th>'
);

// Add max length validation to quantity
cTable = cTable.replace(
  /onChange=\{\(e\) => updateItem\(index, \{ quantity: parseFloat\(e\.target\.value\) \|\| 0 \}\)\}/g,
  `onChange={(e) => {
                        const val = e.target.value;
                        if (val.length > 10) return;
                        updateItem(index, { quantity: parseFloat(val) || 0 })
                      }}`
);

// Add max length validation to rate
cTable = cTable.replace(
  /onChange=\{\(e\) => updateItem\(index, \{ price: parseFloat\(e\.target\.value\) \|\| 0 \}\)\}/g,
  `onChange={(e) => {
                        const val = e.target.value;
                        if (val.length > 12) return;
                        updateItem(index, { price: parseFloat(val) || 0 })
                      }}`
);

// Add truncate to Total amount cell
cTable = cTable.replace(
  /<div className="h-10 flex items-center justify-end font-semibold text-sm">/g,
  `<div className="h-10 flex items-center justify-end font-semibold text-sm truncate" title={\`\${currency} \${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`}>`
);

fs.writeFileSync(pTable, cTable);

const pForm = 'c:/Users/DELL/Downloads/new-queerp/frontend/src/components/dashboard/purchase-order-form.tsx';
let cForm = fs.readFileSync(pForm, 'utf8');

cForm = cForm.replace(
  /<p className="text-2xl font-bold text-blue-700 dark:text-blue-400">\{displayCurrency\} \{summary\.total\.toLocaleString\(\)\}<\/p>/g,
  '<p className="text-2xl font-bold text-blue-700 dark:text-blue-400 truncate max-w-[200px]" title={`${displayCurrency} ${summary.total.toLocaleString()}`}>{displayCurrency} {summary.total.toLocaleString()}</p>'
);

fs.writeFileSync(pForm, cForm);

console.log('Fixed widths and validations');
