const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const directoryPath = path.join(__dirname, 'src', 'pages', 'dashboard');

walkDir(directoryPath, function(filePath) {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    const origContent = content;

    if (content.includes('routerParams')) {
        // Replace the massive destructuring with just businessId
        content = content.replace(
          /const\s+\{\s*businessId,\s*activityId,\s*billId,\s*customerId,\s*dealId,\s*employeeId,\s*entryId,\s*expenseId,\s*invoiceId,\s*leadId,\s*orderId,\s*payrollId,\s*projectId,\s*quotationId,\s*requestId,\s*salesOrderId,\s*warehouseId,\s*id\s*\}\s*=\s*routerParams;/g, 
          'const { businessId } = routerParams;'
        );
    }

    if (origContent !== content) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`Simplified ${filePath}`);
    }
  }
});
