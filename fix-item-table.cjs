const fs = require('fs');

const p = 'c:/Users/DELL/Downloads/new-queerp/frontend/src/components/dashboard/inventory-item-table.tsx';
let c = fs.readFileSync(p, 'utf8');

const targetLogic = `            updated.description = product.description || product.name
            updated.hsnSacCode = product.taxCode || ''
            updated.price = mode === 'purchase' ? (product.costPrice || 0) : (product.sellingPrice || 0)
            updated.taxPercent = product.taxRate || 0
            updated.itemType = (product.type as any) || 'GOODS'
            updated.unit = typeof product.unit === 'object' ? product.unit?.abbreviation : (product.unit || 'pcs')`;

const replacementLogic = `            updated.description = product.description || product.name
            updated.hsnSacCode = product.taxCode || (product as any).hsnCode || ''
            updated.price = mode === 'purchase' ? (product.costPrice || 0) : (product.price || (product as any).sellingPrice || 0)
            updated.taxPercent = product.taxPercent || (product as any).taxRate || 0
            updated.itemType = (product.type as any) || 'GOODS'
            updated.unit = typeof product.unit === 'object' ? (product as any).unit?.abbreviation : (product.unit || 'pcs')`;

c = c.replace(targetLogic, replacementLogic);

fs.writeFileSync(p, c);
console.log('Fixed inventory-item-table.tsx mapping logic');
