const fs = require('fs');
const path = require('path');

const invoicePath = path.join(__dirname, 'src', 'components', 'dashboard', 'invoice-payment-page-client.tsx');
let invContent = fs.readFileSync(invoicePath, 'utf8');

// I need to fix the mangled file first, but I don't have the exact backup. Let me check if git helps.
