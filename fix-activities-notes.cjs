const fs = require('fs');

// Fix 1: activities-page-client.tsx
const p1 = 'c:/Users/DELL/Downloads/new-queerp/frontend/src/components/dashboard/activities-page-client.tsx';
let c1 = fs.readFileSync(p1, 'utf8');

c1 = c1.replace(
  /if \(data\.success && Array\.isArray\(data\.activities\)\) \{\s*setActivities\(data\.activities\);\s*\}/g,
  'if (data.success && Array.isArray(data.data)) {\n        setActivities(data.data);\n      }'
);

fs.writeFileSync(p1, c1);
console.log('Fixed activities-page-client.tsx');

// Fix 2: notes/page.tsx
const p2 = 'c:/Users/DELL/Downloads/new-queerp/frontend/src/pages/dashboard/[businessId]/notes/page.tsx';
let c2 = fs.readFileSync(p2, 'utf8');

c2 = c2.replace(
  /if \(leadsRes\.ok\) setLeads\(\(await leadsRes\.json\(\)\)\.leads \|\| \[\]\)/g,
  'if (leadsRes.ok) setLeads((await leadsRes.json()).data || [])'
);
c2 = c2.replace(
  /if \(dealsRes\.ok\) setDeals\(\(await dealsRes\.json\(\)\)\.deals \|\| \[\]\)/g,
  'if (dealsRes.ok) setDeals((await dealsRes.json()).data || [])'
);
c2 = c2.replace(
  /if \(customersRes\.ok\) setCustomers\(\(await customersRes\.json\(\)\)\.customers \|\| \[\]\)/g,
  'if (customersRes.ok) setCustomers((await customersRes.json()).data || [])'
);

fs.writeFileSync(p2, c2);
console.log('Fixed notes/page.tsx');
