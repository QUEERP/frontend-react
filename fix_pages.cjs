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
    
    // Fix businessId={businessId}
    const origContent = content;
    
    // Some are missing const { businessId } = useParams();
    if (content.includes('businessId={businessId}') && !content.includes('const { businessId } = useParams();') && content.includes('useParams')) {
        content = content.replace('const params = useParams();', 'const { businessId, ...params } = useParams();');
    }

    content = content.replace(/businessId=\{businessId\}/g, "businessId={businessId as string}");
    content = content.replace(/vendorId=\{id\}/g, "vendorId={id as string}");
    content = content.replace(/userId=\{id\}/g, "userId={id as string}");
    content = content.replace(/orderId=\{id\}/g, "orderId={id as string}");
    content = content.replace(/quotationId=\{id\}/g, "quotationId={id as string}");
    content = content.replace(/requestId=\{id\}/g, "requestId={id as string}");
    content = content.replace(/projectId=\{projectId\}/g, "projectId={projectId as string}");
    
    // Fix undefined header in fetch
    content = content.replace(/'x-business-id': businessId/g, "'x-business-id': businessId as string");
    
    // Fix missing businessId from useParams in specific files
    if (content.includes("Cannot find name 'businessId'") || (!content.includes('businessId') && content.includes('export default function'))) {
      // It's safer not to guess, but we can fix the obvious ones.
    }
    
    if (origContent !== content) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`Updated ${filePath}`);
    }
  }
});
