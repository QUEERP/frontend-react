const fs = require('fs');
const path = 'c:/Users/DELL/Downloads/new-queerp/backend/src/services/inventory/product.service.js';
let c = fs.readFileSync(path, 'utf8');

const badStr = '||taxCode: data.taxCode || data.hsnCode || null,\\n        taxPercent: data.taxPercent !== undefined ? parseFloat(data.taxPercent) : 0,';

// First, fix the taxCode line in createProduct
c = c.replace('taxCode: data.taxCode ' + badStr, 'taxCode: data.taxCode || data.hsnCode || null,\n        taxPercent: data.taxPercent !== undefined ? parseFloat(data.taxPercent) : 0,');

// Then, replace the remaining bad strings with '|| null,'
c = c.split(badStr).join('|| null,');

// Wait, I also did a second replace for updateProduct:
// c = c.replace(/taxCode: data\.taxCode !== undefined \? data\.taxCode : product\.taxCode,/g, 'taxCode: (data.taxCode !== undefined ? data.taxCode : (data.hsnCode !== undefined ? data.hsnCode : product.taxCode)),\\n        taxPercent: data.taxPercent !== undefined ? parseFloat(data.taxPercent) : product.taxPercent,');
// Let me check if that was correct or if it had backslash issues too.
// Let's replace the literal if it's there.

fs.writeFileSync(path, c, 'utf8');
console.log('Fixed');
