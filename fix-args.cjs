const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/DELL/Downloads/new-queerp/frontend/src/components/dashboard';

// Helper to replace line by line based on string matches to avoid regex cross-line issues
function fixFile(filename, replacements) {
  const p = path.join(dir, filename);
  let lines = fs.readFileSync(p, 'utf8').split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('formatAmountOnly()')) {
      // Find the first replacement that matches context (e.g., surrounding text or just by order if we want)
      for (const rep of replacements) {
        if (lines[i].includes(rep.search)) {
          lines[i] = lines[i].replace('formatAmountOnly()', `formatAmountOnly(${rep.arg})`);
          break; // only apply one per line
        }
      }
    }
    // Handle multiple on same line
    while (lines[i].includes('formatAmountOnly()')) {
      let replaced = false;
      for (const rep of replacements) {
        if (lines[i].includes(rep.search)) {
          lines[i] = lines[i].replace('formatAmountOnly()', `formatAmountOnly(${rep.arg})`);
          replaced = true;
          break;
        }
      }
      if (!replaced) break; // prevent infinite loop if no match
    }
  }
  
  fs.writeFileSync(p, lines.join('\n'));
}

// 1. Inventory Report
fixFile('trading-inventory-report-client.tsx', [
  { search: 'title="Total Inventory Value"', arg: 'data?.kpis?.totalInventoryValue || 0' },
  { search: 'title="Low Stock Items"', arg: 'data?.kpis?.lowStockItems || 0' }, // Wait, total value is line 313
  { search: 'value={formatAmountOnly()}', arg: 'data?.kpis?.totalInventoryValue || 0' },
  { search: 'item.totalValue', arg: 'item.totalValue' },
  { search: 'item.unitCost', arg: 'item.unitCost' },
  // If we just match "formatAmountOnly()" in table cells:
  // line 470, 505, 576, 614
]);

let invLines = fs.readFileSync(path.join(dir, 'trading-inventory-report-client.tsx'), 'utf8').split('\n');
invLines.forEach((l, i) => {
    if (l.includes('formatAmountOnly()')) {
        if (l.includes('text-right text-muted-foreground')) invLines[i] = l.replace('formatAmountOnly()', 'formatAmountOnly(item.unitCost)');
        else invLines[i] = l.replace('formatAmountOnly()', 'formatAmountOnly(item.totalValue)');
    }
});
fs.writeFileSync(path.join(dir, 'trading-inventory-report-client.tsx'), invLines.join('\n'));


// 2. Procurement Report
let proLines = fs.readFileSync(path.join(dir, 'trading-procurement-report-client.tsx'), 'utf8').split('\n');
proLines.forEach((l, i) => {
    if (l.includes('formatAmountOnly()')) {
        if (l.includes('title="Total Spend"')) proLines[i+1] = proLines[i+1].replace('formatAmountOnly()', 'formatAmountOnly(data?.kpis?.totalSpend || 0)');
        if (l.includes('title="Outstanding Bills"')) proLines[i+1] = proLines[i+1].replace('formatAmountOnly()', 'formatAmountOnly(data?.kpis?.outstandingBills || 0)');
        if (l.includes('title="Pending POs"')) proLines[i+1] = proLines[i+1].replace('formatAmountOnly()', 'formatAmountOnly(data?.kpis?.pendingPos || 0)');
        
        // table cells
        if (l.includes('text-emerald-600')) proLines[i] = l.replace('formatAmountOnly()', 'formatAmountOnly(item.amountPaid || item.paidAmount || item.total)');
        else if (l.includes('text-rose-600')) proLines[i] = l.replace('formatAmountOnly()', 'formatAmountOnly(item.balanceDue || item.amountRemaining || item.balance)');
        else proLines[i] = l.replace('formatAmountOnly()', 'formatAmountOnly(item.amount || item.totalAmount || item.total)');
    }
});
fs.writeFileSync(path.join(dir, 'trading-procurement-report-client.tsx'), proLines.join('\n'));

// 3. Sales Report
let salesLines = fs.readFileSync(path.join(dir, 'trading-sales-report-client.tsx'), 'utf8').split('\n');
salesLines.forEach((l, i) => {
    if (l.includes('formatAmountOnly()')) {
        // Funnel
        if (l.includes('name: \'Quotations\'')) salesLines[i] = l.replace('formatAmountOnly()', 'formatAmountOnly(data.funnel.quotations.value)');
        if (l.includes('name: \'Sales Orders\'')) salesLines[i] = l.replace('formatAmountOnly()', 'formatAmountOnly(data.funnel.orders.value)');
        if (l.includes('name: \'Invoices\'')) salesLines[i] = l.replace('formatAmountOnly()', 'formatAmountOnly(data.funnel.invoices.value)');
        if (l.includes('name: \'Payments\'')) salesLines[i] = l.replace('formatAmountOnly()', 'formatAmountOnly(data.funnel.payments.value)');
        if (l.includes('name: \'Credit Notes\'')) salesLines[i] = l.replace('formatAmountOnly()', 'formatAmountOnly(data.creditNotesList?.reduce((acc, curr) => acc + (curr.amount || 0), 0))');
        if (l.includes('name: \'Returns\'')) salesLines[i] = l.replace('formatAmountOnly()', 'formatAmountOnly(data.returnsList?.reduce((acc, curr) => acc + (curr.amount || 0), 0))');
        if (l.includes('name: \'Recurring\'')) salesLines[i] = l.replace('formatAmountOnly()', 'formatAmountOnly(data.recurringList?.reduce((acc, curr) => acc + (curr.amount || 0), 0))');

        // KPIs
        if (salesLines[i-1] && salesLines[i-1].includes('title="Total Payments"')) salesLines[i] = l.replace('formatAmountOnly()', 'formatAmountOnly(data?.kpis?.totalPayments || 0)');
        if (salesLines[i-1] && salesLines[i-1].includes('title="Credit Notes"')) salesLines[i] = l.replace('formatAmountOnly()', 'formatAmountOnly(data?.kpis?.totalCreditNotes || 0)');
        
        if (l.includes('Allocated')) salesLines[i] = l.replace('formatAmountOnly()', 'formatAmountOnly(data?.kpis?.paymentsAllocated || 0)');
        if (l.includes('Remaining') && l.includes('text-rose-600')) salesLines[i] = l.replace('formatAmountOnly()', 'formatAmountOnly(data?.kpis?.paymentsRemaining || 0)');
        
        // Table Cells
        if (l.includes('text-emerald-600')) salesLines[i] = l.replace('formatAmountOnly()', 'formatAmountOnly(item.amountPaid || item.paidAmount || item.total || payment?.amountAllocated || customer?.totalPaid || invoice?.amountPaid)');
        else if (l.includes('text-rose-600')) salesLines[i] = l.replace('formatAmountOnly()', 'formatAmountOnly(item.balanceDue || item.amountRemaining || item.balance || customer?.totalRemaining || invoice?.balanceDue)');
        else salesLines[i] = l.replace('formatAmountOnly()', 'formatAmountOnly(item.amount || item.totalAmount || item.total || payment?.amount || customer?.totalInvoiced || invoice?.totalAmount || note?.amount || quote?.totalAmount || order?.totalAmount || ret?.amount || rec?.totalAmount)');
    }
});

// Since the iterators variable names change (item, payment, customer, invoice, note, quote, order, ret, rec), we need to inject the right one.
// We can just use a regex to find what the map variable is, or just brute force it by checking the context.
for (let i = 0; i < salesLines.length; i++) {
    let l = salesLines[i];
    if (l.includes('formatAmountOnly(')) {
        // clean up the brute force
        if (l.includes('payment?.')) {
            l = l.replace('item.amountPaid || item.paidAmount || item.total || payment?.amountAllocated || customer?.totalPaid || invoice?.amountPaid', 'payment.amountAllocated');
            l = l.replace('item.amount || item.totalAmount || item.total || payment?.amount || customer?.totalInvoiced || invoice?.totalAmount || note?.amount || quote?.totalAmount || order?.totalAmount || ret?.amount || rec?.totalAmount', 'payment.amount');
            salesLines[i] = l;
        } else if (l.includes('customer?.')) {
            l = l.replace('item.amountPaid || item.paidAmount || item.total || payment?.amountAllocated || customer?.totalPaid || invoice?.amountPaid', 'customer.totalPaid');
            l = l.replace('item.balanceDue || item.amountRemaining || item.balance || customer?.totalRemaining || invoice?.balanceDue', 'customer.totalRemaining');
            l = l.replace('item.amount || item.totalAmount || item.total || payment?.amount || customer?.totalInvoiced || invoice?.totalAmount || note?.amount || quote?.totalAmount || order?.totalAmount || ret?.amount || rec?.totalAmount', 'customer.totalInvoiced');
            salesLines[i] = l;
        } else if (salesLines[i-1] && salesLines[i-1].includes('quote.customer')) {
            salesLines[i] = l.replace('item.amount || item.totalAmount || item.total || payment?.amount || customer?.totalInvoiced || invoice?.totalAmount || note?.amount || quote?.totalAmount || order?.totalAmount || ret?.amount || rec?.totalAmount', 'quote.totalAmount');
        } else if (salesLines[i-1] && salesLines[i-1].includes('order.customer')) {
            salesLines[i] = l.replace('item.amount || item.totalAmount || item.total || payment?.amount || customer?.totalInvoiced || invoice?.totalAmount || note?.amount || quote?.totalAmount || order?.totalAmount || ret?.amount || rec?.totalAmount', 'order.totalAmount');
        } else if (l.includes('invoice?.')) {
             l = l.replace('item.amountPaid || item.paidAmount || item.total || payment?.amountAllocated || customer?.totalPaid || invoice?.amountPaid', 'invoice.amountPaid');
             l = l.replace('item.balanceDue || item.amountRemaining || item.balance || customer?.totalRemaining || invoice?.balanceDue', 'invoice.balanceDue');
             l = l.replace('item.amount || item.totalAmount || item.total || payment?.amount || customer?.totalInvoiced || invoice?.totalAmount || note?.amount || quote?.totalAmount || order?.totalAmount || ret?.amount || rec?.totalAmount', 'invoice.totalAmount');
             salesLines[i] = l;
        } else if (salesLines[i-1] && salesLines[i-1].includes('note.reason')) {
             salesLines[i] = l.replace('item.amount || item.totalAmount || item.total || payment?.amount || customer?.totalInvoiced || invoice?.totalAmount || note?.amount || quote?.totalAmount || order?.totalAmount || ret?.amount || rec?.totalAmount', 'note.amount');
        } else if (salesLines[i-1] && salesLines[i-1].includes('ret.reason')) {
             salesLines[i] = l.replace('item.amount || item.totalAmount || item.total || payment?.amount || customer?.totalInvoiced || invoice?.totalAmount || note?.amount || quote?.totalAmount || order?.totalAmount || ret?.amount || rec?.totalAmount', 'ret.amount');
        } else if (salesLines[i-1] && salesLines[i-1].includes('rec.nextInvoiceDate')) {
             salesLines[i] = l.replace('item.amount || item.totalAmount || item.total || payment?.amount || customer?.totalInvoiced || invoice?.totalAmount || note?.amount || quote?.totalAmount || order?.totalAmount || ret?.amount || rec?.totalAmount', 'rec.totalAmount');
        }
    }
}
fs.writeFileSync(path.join(dir, 'trading-sales-report-client.tsx'), salesLines.join('\n'));

console.log('done');
