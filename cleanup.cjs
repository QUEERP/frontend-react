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
        // Clean up safe exact matches
        content = content.replace(/const\s+\{\s*businessId\s*\}\s*=\s*useParams\(\);?\n?/g, '');
        content = content.replace(/const\s+\{\s*businessId,\s*id\s*\}\s*=\s*useParams\(\);?\n?/g, '');
        content = content.replace(/const\s+\{\s*businessId,\s*projectId\s*\}\s*=\s*useParams\(\);?\n?/g, '');
        content = content.replace(/const\s+\{\s*businessId,\s*orderId\s*\}\s*=\s*useParams\(\);?\n?/g, '');
        content = content.replace(/const\s+\{\s*businessId,\s*leadId\s*\}\s*=\s*useParams\(\);?\n?/g, '');
        content = content.replace(/const\s+\{\s*businessId,\s*payrollId\s*\}\s*=\s*useParams\(\);?\n?/g, '');
        content = content.replace(/const\s+\{\s*businessId,\s*warehouseId\s*\}\s*=\s*useParams\(\);?\n?/g, '');
        
        // Remove trailing or duplicate extractions
        content = content.replace(/const\s+businessId\s*=\s*.*?;\n?/g, '');
        content = content.replace(/const\s+orderId\s*=\s*.*?;\n?/g, '');
        content = content.replace(/const\s+projectId\s*=\s*.*?;\n?/g, '');
        content = content.replace(/const\s+id\s*=\s*.*?;\n?/g, '');
        content = content.replace(/const\s+dealId\s*=\s*.*?;\n?/g, '');
        content = content.replace(/const\s+quotationId\s*=\s*.*?;\n?/g, '');
        content = content.replace(/const\s+warehouseId\s*=\s*.*?;\n?/g, '');
        content = content.replace(/const\s+invoiceId\s*=\s*.*?;\n?/g, '');
        content = content.replace(/const\s+leadId\s*=\s*.*?;\n?/g, '');
        content = content.replace(/const\s+payrollId\s*=\s*.*?;\n?/g, '');
        
        // Fix project operations ProjectsWorkspace which shadows businessId
        content = content.replace(/const\s+\{\s*businessId:\s*paramBusinessId\s*\}\s*=\s*useParams\(\);?\n?/g, '');
        
        // Fix tsx duplicates
        content = content.replace(/const\s+\{\s*businessId:\s*paramBusinessId\s*\}\s*=\s*useParams\(\)[^;]*;\n?/g, '');
    }

    if (origContent !== content) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`Cleaned up ${filePath}`);
    }
  }
});
