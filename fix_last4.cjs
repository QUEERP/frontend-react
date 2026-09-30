const fs = require('fs');
const path = 'c:/Users/DELL/Downloads/new-queerp/backend/src/services/inventory/product.service.js';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(/taxCode: data\.taxCode \|\| data\.hsnCode \|\| null,\\n        taxPercent: data\.taxPercent !== undefined \? parseFloat\(data\.taxPercent\) : 0,/g, 'null,');

fs.writeFileSync(path, c, 'utf8');
console.log('Fixed more');
