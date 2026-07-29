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

  // 1. Fix `const businessId = businessId as string`
  content = content.replace(/const\s+([a-zA-Z0-9_]+)\s*=\s*\1\s*as\s*[a-zA-Z0-9_]+/g, '');

  // 2. Fix `const leadId = id as string` (where id was already declared or we need to rename)
  if (content.match(/const\s+[a-zA-Z0-9_]+\s*=\s*id\s*as\s*string/) && !content.includes('id =')) {
     content = content.replace(/(const\s+[a-zA-Z0-9_]+\s*=\s*id\s*as\s*string)/, 'const { id } = useParams();\n$1');
  }
  // Generic fix for id missing
  if (content.includes('id as string') && !content.includes('id =') && !content.includes('{ id } = useParams()')) {
     content = content.replace(/(const\s+[a-zA-Z0-9_]+\s*=\s*id\s*as\s*string)/, 'const { id } = useParams();\n$1');
  }

  // 3. Fix `const { id, salesOrderId, projectId } = useSearchParams()[0]`
  content = content.replace(/const\s+\{\s*([^}]+)\s*\}\s*=\s*useSearchParams\(\)\[0\]/g, (match, vars) => {
     const varNames = vars.split(',').map(v => v.trim()).filter(Boolean);
     return `const searchParams = useSearchParams()[0];\n` + varNames.map(v => `const ${v} = searchParams.get('${v}');`).join('\n');
  });

  // 4. Fix `const { businessId } = use(params);` -> `useParams()`
  content = content.replace(/use\(params\)/g, 'useParams()');

  // 5. Fix `Cannot find name 'toast'` - add import if not present
  if (content.includes('toast.') || content.includes('toast(')) {
    if (!content.includes("import { toast }") && !content.includes("sonner")) {
      content = `import { toast } from 'sonner';\n` + content;
    }
  }

  // 6. Fix `Cannot find name 'router'` -> change `router.refresh()` to `navigate(0)`
  if (content.includes('router.refresh()')) {
    content = content.replace(/router\.refresh\(\)/g, 'navigate(0)');
    if (!content.includes('useNavigate()')) {
      content = content.replace(/const\s+\{/, 'const navigate = useNavigate();\nconst {');
      if (!content.includes('useNavigate')) {
         content = `import { useNavigate } from 'react-router-dom';\n` + content;
      }
    }
  }
  
  // 7. Fix any leftover `router` missing errors
  if (content.includes('router.') && !content.includes('const router =')) {
     content = content.replace(/router\.push\(/g, 'navigate(');
     content = content.replace(/router\.back\(\)/g, 'navigate(-1)');
     content = content.replace(/router\.replace\(/g, 'navigate(');
     if (!content.includes('useNavigate()')) {
        content = content.replace(/export\s+default\s+function\s+[a-zA-Z0-9_]+\s*\([^)]*\)\s*\{/g, (match) => `${match}\n  const navigate = useNavigate();`);
        if (!content.includes('useNavigate')) {
           content = `import { useNavigate } from 'react-router-dom';\n` + content;
        }
     }
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Fixed runtime references in: ${filePath}`);
  }
});

console.log("Runtime fixes 2 completed.");
