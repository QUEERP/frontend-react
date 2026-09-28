const fs = require('fs');
const p = 'c:/Users/DELL/Downloads/new-queerp/frontend/src/components/dashboard/inventory-item-table.tsx';
let c = fs.readFileSync(p, 'utf8');

// For QTY input
c = c.replace(
  /"h-10 text-center border-muted-foreground\/20 \[appearance:textfield\]/g,
  '"min-w-[100px] h-10 text-center border-muted-foreground/20 [appearance:textfield]'
);

// For Rate input
c = c.replace(
  /"h-10 pl-8 border-muted-foreground\/20 \[appearance:textfield\]/g,
  '"min-w-[120px] h-10 pl-8 border-muted-foreground/20 [appearance:textfield]'
);

fs.writeFileSync(p, c);
console.log('Fixed input widths');
