const fs = require('fs');
const file = 'C:/Users/DELL/Downloads/new-queerp/frontend/src/components/dashboard/leaves-page-client.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'type LeaveTypeOption = {\n  code: string\n  yearlyLimit: number\n}',
  'type LeaveTypeOption = {\n  code: string\n  title: string\n  yearlyLimit: number\n}'
);

content = content.replace(
  /const code = String\(item\?\.code \|\| item\?\.title \|\| item\?\.name \|\| ''\)\.trim\(\)\s*const yearlyLimit = Number\(item\?\.yearlyLimit \?\? item\?\.count \?\? item\?\.limit \?\? 0\)\s*return \{\s*code,\s*yearlyLimit/g,
  `const code = String(item?.code || item?.title || item?.name || '').trim()\n      const title = String(item?.title || item?.name || code).trim()\n      const yearlyLimit = Number(item?.yearlyLimit ?? item?.count ?? item?.limit ?? 0)\n      return {\n        code,\n        title,\n        yearlyLimit`
);

content = content.replace(
  /\{ code: LWP_CODE, yearlyLimit: Number\.POSITIVE_INFINITY \}/g,
  '{ code: LWP_CODE, title: LWP_CODE, yearlyLimit: Number.POSITIVE_INFINITY }'
);

content = content.replace(
  /\(code\) => \(\{ code, yearlyLimit: 0 \}\)/g,
  '(code) => ({ code, title: code, yearlyLimit: 0 })'
);

content = content.replace(
  /const displayName = \(item as any\)\.name \|\| item\.code/g,
  'const displayName = item.title || item.code'
);

content = content.replace(
  />\s*\{leaveType\.code\}\s*<\/SelectItem>/g,
  '>\n                      {leaveType.title || leaveType.code}\n                    </SelectItem>'
);

fs.writeFileSync(file, content);
console.log('Modified leaves-page-client.tsx');
