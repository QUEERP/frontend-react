const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const srcDir = path.join(__dirname, 'src');

walkDir(srcDir, (filePath) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;

  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  // Replace Next.js / Node.js process.env with Vite import.meta.env
  content = content.replace(/process\.env\.VITE_/g, 'import.meta.env.VITE_');
  content = content.replace(/process\.env\.NEXT_PUBLIC_/g, 'import.meta.env.VITE_');
  content = content.replace(/process\.env\.NODE_ENV\s*===\s*['"]production['"]/g, 'import.meta.env.PROD');
  content = content.replace(/process\.env\.NODE_ENV/g, 'import.meta.env.MODE');
  // Just in case there are naked process.env refs
  content = content.replace(/process\.env/g, 'import.meta.env');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Fixed process.env in: ${filePath}`);
  }
});

console.log("process.env fixes completed.");
