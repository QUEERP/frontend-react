const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/DELL/Downloads/new-queerp/frontend/src/components/dashboard';

function replaceArgsInFile(filename, replacements) {
    let lines = fs.readFileSync(path.join(dir, filename), 'utf8').split('\n');
    for (let i = 0; i < lines.length; i++) {
        for (const [search, replace] of Object.entries(replacements)) {
            if (lines[i].includes(search)) {
                lines[i] = lines[i].replace(search, replace);
            }
        }
    }
    fs.writeFileSync(path.join(dir, filename), lines.join('\n'));
}

replaceArgsInFile('trading-inventory-report-client.tsx', {
    'formatAmountOnly(item.totalValue)': 'formatAmountOnly(c ? c.totalValue : b ? b.totalValue : w ? w.totalValue : 0)', // wait this won't work perfectly. Let's just fix line by line
});

// A better approach: read the file, iterate through lines. Keep track of the current map iterator!
function fixIterators(filename) {
    let lines = fs.readFileSync(path.join(dir, filename), 'utf8').split('\n');
    let currentIterator = null;
    let listName = null;
    for (let i = 0; i < lines.length; i++) {
        const mapMatch = lines[i].match(/\.map\(\(([^,]+)(?:,\s*i)?\)\s*=>/);
        if (mapMatch) {
            currentIterator = mapMatch[1].trim();
        }
        const dataMapMatch = lines[i].match(/data\.([a-zA-Z]+)\.map/);
        if (dataMapMatch) {
            listName = dataMapMatch[1];
        }

        if (lines[i].includes('formatAmountOnly(')) {
            // strip existing args
            lines[i] = lines[i].replace(/formatAmountOnly\([^)]*\)/g, 'formatAmountOnly()');
            
            if (filename === 'trading-inventory-report-client.tsx') {
                if (currentIterator === 'c' || currentIterator === 'b' || currentIterator === 'w') {
                    lines[i] = lines[i].replace('formatAmountOnly()', `formatAmountOnly(${currentIterator}.totalValue)`);
                } else if (currentIterator === 's') {
                    lines[i] = lines[i].replace('formatAmountOnly()', `formatAmountOnly(${currentIterator}.unitCost)`);
                } else if (lines[i].includes('totalInventoryValue')) {
                    lines[i] = lines[i].replace('formatAmountOnly()', 'formatAmountOnly(data?.kpis?.totalStockValue || 0)');
                }
            }
            
            if (filename === 'trading-procurement-report-client.tsx') {
                if (currentIterator === 'vendor') {
                    if (lines[i].includes('emerald')) lines[i] = lines[i].replace('formatAmountOnly()', `formatAmountOnly(${currentIterator}.totalPaid)`);
                    else if (lines[i].includes('rose')) lines[i] = lines[i].replace('formatAmountOnly()', `formatAmountOnly(${currentIterator}.outstanding)`);
                    else lines[i] = lines[i].replace('formatAmountOnly()', `formatAmountOnly(${currentIterator}.totalBilled)`);
                } else if (currentIterator === 'req') {
                     lines[i] = lines[i].replace('formatAmountOnly()', `formatAmountOnly(${currentIterator}.estimatedAmount)`);
                } else if (currentIterator === 'order') {
                     lines[i] = lines[i].replace('formatAmountOnly()', `formatAmountOnly(${currentIterator}.totalAmount)`);
                } else if (currentIterator === 'receipt') {
                     lines[i] = lines[i].replace('formatAmountOnly()', `formatAmountOnly(${currentIterator}.amount)`); // receipt amount? let's use amount
                } else if (currentIterator === 'bill') {
                     if (lines[i].includes('emerald')) lines[i] = lines[i].replace('formatAmountOnly()', `formatAmountOnly(${currentIterator}.amountPaid)`);
                     else if (lines[i].includes('rose')) lines[i] = lines[i].replace('formatAmountOnly()', `formatAmountOnly(${currentIterator}.balanceDue)`);
                     else lines[i] = lines[i].replace('formatAmountOnly()', `formatAmountOnly(${currentIterator}.totalAmount)`);
                } else if (currentIterator === 'payment') {
                     lines[i] = lines[i].replace('formatAmountOnly()', `formatAmountOnly(${currentIterator}.amount)`);
                } else if (currentIterator === 'ret') {
                     lines[i] = lines[i].replace('formatAmountOnly()', `formatAmountOnly(${currentIterator}.amount)`);
                }
            }

            if (filename === 'trading-sales-report-client.tsx') {
                if (currentIterator === 'payment') {
                    if (lines[i].includes('emerald')) lines[i] = lines[i].replace('formatAmountOnly()', `formatAmountOnly(${currentIterator}.amountAllocated)`);
                    else lines[i] = lines[i].replace('formatAmountOnly()', `formatAmountOnly(${currentIterator}.amount)`);
                } else if (currentIterator === 'customer') {
                    if (lines[i].includes('emerald')) lines[i] = lines[i].replace('formatAmountOnly()', `formatAmountOnly(${currentIterator}.totalPaid)`);
                    else if (lines[i].includes('rose')) lines[i] = lines[i].replace('formatAmountOnly()', `formatAmountOnly(${currentIterator}.totalRemaining)`);
                    else lines[i] = lines[i].replace('formatAmountOnly()', `formatAmountOnly(${currentIterator}.totalInvoiced)`);
                } else if (currentIterator === 'note') {
                    lines[i] = lines[i].replace('formatAmountOnly()', `formatAmountOnly(${currentIterator}.amount)`);
                } else if (currentIterator === 'quote') {
                    lines[i] = lines[i].replace('formatAmountOnly()', `formatAmountOnly(${currentIterator}.totalAmount)`);
                } else if (currentIterator === 'order') {
                    lines[i] = lines[i].replace('formatAmountOnly()', `formatAmountOnly(${currentIterator}.totalAmount)`);
                } else if (currentIterator === 'invoice') {
                    if (lines[i].includes('emerald')) lines[i] = lines[i].replace('formatAmountOnly()', `formatAmountOnly(${currentIterator}.amountPaid)`);
                    else if (lines[i].includes('rose')) lines[i] = lines[i].replace('formatAmountOnly()', `formatAmountOnly(${currentIterator}.balanceDue)`);
                    else lines[i] = lines[i].replace('formatAmountOnly()', `formatAmountOnly(${currentIterator}.totalAmount)`);
                } else if (currentIterator === 'ret') {
                    lines[i] = lines[i].replace('formatAmountOnly()', `formatAmountOnly(${currentIterator}.amount)`);
                } else if (currentIterator === 'rec') {
                    lines[i] = lines[i].replace('formatAmountOnly()', `formatAmountOnly(${currentIterator}.totalAmount)`);
                }
            }
        }
    }
    fs.writeFileSync(path.join(dir, filename), lines.join('\n'));
}

fixIterators('trading-inventory-report-client.tsx');
fixIterators('trading-procurement-report-client.tsx');
fixIterators('trading-sales-report-client.tsx');
console.log('done');
