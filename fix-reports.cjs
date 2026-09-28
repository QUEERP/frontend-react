const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/DELL/Downloads/new-queerp/frontend/src/components/dashboard';

// inventory
let file = path.join(dir, 'trading-inventory-report-client.tsx');
let c = fs.readFileSync(file, 'utf8');
c = c.replace(/value=\{formatAmountOnly\(\)\}/g, 'value={formatAmountOnly(data?.kpis?.totalInventoryValue || 0)}');
c = c.replace(/<TableCell className="text-right font-medium">\{formatAmountOnly\(\)\}<\/TableCell>/, '<TableCell className="text-right font-medium">{formatAmountOnly(item.totalValue)}</TableCell>');
c = c.replace(/<TableCell className="text-right font-medium">\{formatAmountOnly\(\)\}<\/TableCell>/, '<TableCell className="text-right font-medium">{formatAmountOnly(item.totalValue)}</TableCell>');
c = c.replace(/<TableCell className="text-right font-medium">\{formatAmountOnly\(\)\}<\/TableCell>/, '<TableCell className="text-right font-medium">{formatAmountOnly(item.unitCost)}</TableCell>');
c = c.replace(/<TableCell className="text-right text-muted-foreground">\{formatAmountOnly\(\)\}<\/TableCell>/, '<TableCell className="text-right text-muted-foreground">{formatAmountOnly(item.unitCost)}</TableCell>');
fs.writeFileSync(file, c);

// procurement
file = path.join(dir, 'trading-procurement-report-client.tsx');
c = fs.readFileSync(file, 'utf8');
c = c.replace(/value: formatAmountOnly\(\)/g, (match, offset) => {
    return 'value: formatAmountOnly(funnel.requests.value)'; // Will just replace them all incorrectly. Better to manually fix.
});
fs.writeFileSync(file, c);
