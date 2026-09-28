const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/DELL/Downloads/new-queerp/frontend/src/components/dashboard';

const files = ['basic-sales-report-client.tsx', 'trading-sales-report-client.tsx'];

for (const file of files) {
  const filepath = path.join(dir, file);
  let c = fs.readFileSync(filepath, 'utf8');

  // Replace for amount
  c = c.replace(
    /<TableCell className="text-right font-medium text-slate-900">\{formatAmountOnly\(payment\.amount\)\}<\/TableCell>/g,
    '<TableCell className="text-right font-medium text-slate-900">{formatAmountOnly(payment.amount)} {payment.currency || \'AED\'}</TableCell>'
  );

  // Replace for amountAllocated
  c = c.replace(
    /<TableCell className="text-right text-emerald-600 font-medium">\{formatAmountOnly\(payment\.amountAllocated\)\}<\/TableCell>/g,
    '<TableCell className="text-right text-emerald-600 font-medium">{formatAmountOnly(payment.amountAllocated)} {payment.currency || \'AED\'}</TableCell>'
  );

  fs.writeFileSync(filepath, c);
  console.log('Fixed ' + file);
}
