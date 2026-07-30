const fs = require('fs');
const files = [
  'src/components/dashboard/app-sidebar.tsx',
  'src/components/dashboard/user-menu.tsx',
  'src/lib/utils.ts'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/const secure = import\.meta\.env\.PROD \? '; Secure' : ''/g, "const secure = window.location.protocol === 'https:' ? '; Secure' : ''");
  fs.writeFileSync(file, content, 'utf8');
});
console.log('Fixed more secure cookie settings');
