const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'dashboard', 'app-sidebar.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  "if (!businessType || businessType === 'unknown') return false;",
  "if (!businessType || businessType === 'unknown') return true;"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed app-sidebar.tsx');
