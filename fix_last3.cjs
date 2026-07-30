const fs = require('fs');
const path = require('path');

function replaceFile(filePath, search, replace) {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) return;
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(search, replace);
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Fixed', filePath);
}

replaceFile('src/pages/dashboard/[businessId]/invoices/add/page.tsx', 
    'invoiceId={id as string} salesOrderId={salesOrderId}',
    'invoiceId={id as string} salesOrderId={salesOrderId || undefined}');

replaceFile('src/pages/dashboard/[businessId]/project-operations/requirements/create/page.tsx',
    /toast\(\{\s*description:\s*(`.*`|"[^"]*"),\s*variant:\s*"destructive"\s*\}\)/g,
    'toast.error($1)'
);

replaceFile('src/pages/dashboard/[businessId]/project-operations/requirements/create/page.tsx',
    /toast\(\{\s*description:\s*(error\.message\s*\|\|\s*"[^"]*"),\s*variant:\s*"destructive"\s*\}\)/g,
    'toast.error($1)'
);
