const fs = require('fs');

const p = 'c:/Users/DELL/Downloads/new-queerp/frontend/src/components/dashboard/activity-form.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(
  '<SelectContent className="dark:bg-slate-900 dark:border-slate-800 rounded-xl">\r\n                      {customers.map',
  '<SelectContent className="dark:bg-slate-900 dark:border-slate-800 rounded-xl">\r\n                      <SelectItem value="none" className="text-muted-foreground italic">— Clear Selection —</SelectItem>\r\n                      {customers.map'
);

c = c.replace(
  '<SelectContent className="dark:bg-slate-900 dark:border-slate-800 rounded-xl">\n                      {customers.map',
  '<SelectContent className="dark:bg-slate-900 dark:border-slate-800 rounded-xl">\n                      <SelectItem value="none" className="text-muted-foreground italic">— Clear Selection —</SelectItem>\n                      {customers.map'
);

fs.writeFileSync(p, c);
console.log('Fixed customer dropdown clear selection');
