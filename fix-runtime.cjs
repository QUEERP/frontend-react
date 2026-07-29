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

  // Replace params.something with just something, because our AST script pulled them into top-level variables via useParams!
  content = content.replace(/params\.([a-zA-Z0-9_]+)/g, '$1');
  
  // Fix missing imports like `toast` or `useParams`
  if (content.includes('toast.') && !content.includes('toast') && !content.includes('sonner')) {
     content = `import { toast } from 'sonner';\n` + content;
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Fixed runtime references in: ${filePath}`);
  }
});

console.log("Runtime fixes completed.");
