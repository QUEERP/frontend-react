const fs = require('fs');
const filepath = 'c:/Users/DELL/Downloads/new-queerp/frontend/src/components/dashboard/trading-sales-report-client.tsx';
let c = fs.readFileSync(filepath, 'utf8');

c = c.replace(
  /\{formatAmountOnly\(invoice\.totalAmount\)\}/g,
  '{formatAmountOnly(invoice.grandTotal)}'
);
c = c.replace(
  /\{formatAmountOnly\(invoice\.amountPaid\)\}/g,
  '{formatAmountOnly(invoice.paidAmount)}'
);
c = c.replace(
  /\{formatAmountOnly\(invoice\.balanceDue\)\}/g,
  '{formatAmountOnly(invoice.balance)}'
);
c = c.replace(
  /\{formatAmountOnly\(ret\.amount\)\}/g,
  '{formatAmountOnly(ret.totalAmount)}'
);
c = c.replace(
  /\{formatAmountOnly\(rec\.totalAmount\)\}/g,
  '{formatAmountOnly(rec.grandTotal)}'
);

fs.writeFileSync(filepath, c);
console.log('Fixed properties in trading-sales-report-client.tsx');
