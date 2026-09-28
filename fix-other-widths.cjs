const fs = require('fs');

const pBill = 'c:/Users/DELL/Downloads/new-queerp/frontend/src/components/dashboard/bill-form.tsx';
if (fs.existsSync(pBill)) {
  let cBill = fs.readFileSync(pBill, 'utf8');
  cBill = cBill.replace(
    /<p className="text-2xl font-bold">\$\{total\.toFixed\(2\)\}<\/p>/g,
    '<p className="text-2xl font-bold truncate max-w-[200px]" title={`$${total.toFixed(2)}`}>${total.toFixed(2)}</p>'
  );
  fs.writeFileSync(pBill, cBill);
}

const pInvoice = 'c:/Users/DELL/Downloads/new-queerp/frontend/src/components/dashboard/invoice-form.tsx';
if (fs.existsSync(pInvoice)) {
  let cInvoice = fs.readFileSync(pInvoice, 'utf8');
  cInvoice = cInvoice.replace(
    /<p className="text-2xl font-bold text-blue-700 dark:text-blue-400">\{displayCurrency\} \{summary\.total\.toLocaleString\(\)\}<\/p>/g,
    '<p className="text-2xl font-bold text-blue-700 dark:text-blue-400 truncate max-w-[200px]" title={`${displayCurrency} ${summary.total.toLocaleString()}`}>{displayCurrency} {summary.total.toLocaleString()}</p>'
  );
  fs.writeFileSync(pInvoice, cInvoice);
}

const pSales = 'c:/Users/DELL/Downloads/new-queerp/frontend/src/components/dashboard/sales-order-form.tsx';
if (fs.existsSync(pSales)) {
  let cSales = fs.readFileSync(pSales, 'utf8');
  cSales = cSales.replace(
    /<p className="text-2xl font-bold text-blue-700 dark:text-blue-400">\{displayCurrency\} \{summary\.total\.toLocaleString\(\)\}<\/p>/g,
    '<p className="text-2xl font-bold text-blue-700 dark:text-blue-400 truncate max-w-[200px]" title={`${displayCurrency} ${summary.total.toLocaleString()}`}>{displayCurrency} {summary.total.toLocaleString()}</p>'
  );
  fs.writeFileSync(pSales, cSales);
}

const pQuote = 'c:/Users/DELL/Downloads/new-queerp/frontend/src/components/dashboard/quotation-form.tsx';
if (fs.existsSync(pQuote)) {
  let cQuote = fs.readFileSync(pQuote, 'utf8');
  cQuote = cQuote.replace(
    /<p className="text-2xl font-bold text-blue-700 dark:text-blue-400">\{displayCurrency\} \{summary\.total\.toLocaleString\(\)\}<\/p>/g,
    '<p className="text-2xl font-bold text-blue-700 dark:text-blue-400 truncate max-w-[200px]" title={`${displayCurrency} ${summary.total.toLocaleString()}`}>{displayCurrency} {summary.total.toLocaleString()}</p>'
  );
  fs.writeFileSync(pQuote, cQuote);
}

console.log('Fixed other forms');
