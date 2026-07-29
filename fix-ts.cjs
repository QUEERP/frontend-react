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

  // 1. Fix searchParams
  content = content.replace(/const\s+searchParams\s*=\s*useSearchParams\(\)/g, 'const [searchParams] = useSearchParams()');
  // Handle optional chaining `searchParams?.get` which was in the logs
  content = content.replace(/searchParams\?\.get\(/g, 'searchParams.get(');

  // 2. Fix router -> navigate
  if (content.includes('router.back()') || content.includes('router.push(') || content.includes('router.replace(')) {
    content = content.replace(/const\s+router\s*=\s*useRouter\(\)/g, 'const navigate = useNavigate()');
    content = content.replace(/router\.push\(/g, 'navigate(');
    content = content.replace(/router\.replace\(/g, 'navigate(');
    content = content.replace(/router\.back\(\)/g, 'navigate(-1)');
    // If useNavigate is missing but useRouter was removed, add it
    if (content.includes('const navigate = useNavigate()') && !content.includes('useNavigate')) {
       // Just blindly add it to react-router-dom import if it exists
       if (content.includes('react-router-dom')) {
         content = content.replace(/import\s+\{([^}]+)\}\s+from\s+['"]react-router-dom['"]/, (match, p1) => {
           if (!p1.includes('useNavigate')) return `import { useNavigate, ${p1} } from 'react-router-dom'`;
           return match;
         });
       } else {
         content = `import { useNavigate } from 'react-router-dom';\n` + content;
       }
    }
  }

  // 3. Fix img priority
  if (content.includes('priority')) {
    content = content.replace(/<img([^>]*)priority(?:=\{[^}]+\}|="[^"]+"|)([^>]*)>/g, '<img$1$2>');
    content = content.replace(/<img([^>]+)priority\s*>/g, '<img$1>');
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Fixed: ${filePath}`);
  }
});

console.log("TS fixes completed.");
