const fs = require('fs');
const path = require('path');

function replaceFile(filePath, search, replace) {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) return;
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(search, replace);
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Fixed', filePath);
}

// 1. Missing variables from routerParams
replaceFile('src/pages/dashboard/[businessId]/activities/[activityId]/edit/page.tsx', 
    'const { businessId } = routerParams;', 
    'const { businessId, activityId } = routerParams;');

replaceFile('src/pages/dashboard/[businessId]/bills/[billId]/edit/page.tsx', 
    'const { businessId } = routerParams;', 
    'const { businessId, billId } = routerParams;');

replaceFile('src/pages/dashboard/[businessId]/credit-notes/[id]/page.tsx', 
    'const { businessId } = routerParams;', 
    'const { businessId, id } = routerParams;');

replaceFile('src/pages/dashboard/[businessId]/deals/[id]/page.tsx', 
    'const { businessId } = routerParams;', 
    'const { businessId, id } = routerParams;');

replaceFile('src/pages/dashboard/[businessId]/invoices/[id]/page.tsx', 
    'const { businessId } = routerParams;', 
    'const { businessId, id } = routerParams;');

replaceFile('src/pages/dashboard/[businessId]/invoices/add/page.tsx', 
    'const { businessId } = routerParams;', 
    'const { businessId, id, projectId } = routerParams;');

replaceFile('src/pages/dashboard/[businessId]/invoices/add/page.tsx', 
    'id={id as string}', 'id={(id || \'\') as string}');

replaceFile('src/pages/dashboard/[businessId]/payrolls/[payrollId]/page.tsx', 
    'const { businessId } = routerParams;', 
    'const { businessId, payrollId } = routerParams;');

replaceFile('src/pages/dashboard/[businessId]/project-operations/projects/[projectId]/edit/page.tsx', 
    'const { businessId } = routerParams;', 
    'const { businessId, projectId } = routerParams;');

replaceFile('src/pages/dashboard/[businessId]/project-operations/projects/[projectId]/page.tsx', 
    'const { businessId } = routerParams;', 
    'const { businessId, projectId } = routerParams;');

replaceFile('src/pages/dashboard/[businessId]/purchase-requests/[id]/page.tsx', 
    'const { businessId } = routerParams;', 
    'const { businessId, id } = routerParams;');

// 2. Cannot redeclare block-scoped variable 'businessId'
const duplicateFiles = [
    'src/pages/dashboard/[businessId]/bank-change-requests/[requestId]/page.tsx',
    'src/pages/dashboard/[businessId]/customers/[customerId]/contacts/page.tsx',
    'src/pages/dashboard/[businessId]/customers/[customerId]/edit/page.tsx',
    'src/pages/dashboard/[businessId]/customers/[customerId]/view/page.tsx',
    'src/pages/dashboard/[businessId]/employees/[employeeId]/edit/page.tsx',
    'src/pages/dashboard/[businessId]/employees/[employeeId]/page.tsx',
    'src/pages/dashboard/[businessId]/expenses/[expenseId]/edit/page.tsx',
    'src/pages/dashboard/[businessId]/leads/[id]/convert/page.tsx',
];

duplicateFiles.forEach(f => {
    replaceFile(f, /const\s+\{\s*businessId,?\s*[^}]*\}\s*=\s*useParams\(\);?/g, (match) => {
        // e.g. const { businessId, requestId } = useParams()
        // we want to strip businessId out, or just remove the line if it's only businessId
        let m = match.replace(/businessId,?\s*/, '');
        if (m.match(/\{\s*\}/)) return '';
        return m;
    });
});

replaceFile('src/pages/dashboard/[businessId]/leads/[id]/convert/page.tsx',
    /const\s+\{\s*id,\s*businessId\s*\}\s*=\s*useParams\(\)/g,
    'const { id } = useParams()'
);

replaceFile('src/pages/dashboard/[businessId]/project-operations/projects/ProjectsWorkspace.tsx',
    /const\s+\{\s*businessId:\s*paramBusinessId\s*\}\s*=\s*useParams\(\);?\s*/g,
    ''
);
replaceFile('src/pages/dashboard/[businessId]/project-operations/projects/ProjectsWorkspace.tsx',
    /const\s+\{\s*businessId,\s*\.\.\.params\s*\}\s*=\s*useParams\(\);?\s*/g,
    'const params = useParams();'
);
replaceFile('src/pages/dashboard/[businessId]/project-operations/projects/ProjectsWorkspace.tsx',
    /const\s+businessId\s*=\s*\(propBusinessId\s*\|\|\s*params\?\.businessId\)\s*as\s*string;/g,
    'const businessId = (propBusinessId || (params as any)?.businessId) as string;'
);

// 3. Object literal may only specify known properties, and 'title' does not exist in type
replaceFile('src/pages/dashboard/[businessId]/project-operations/requirements/create/page.tsx',
    /title:\s*"No Inquiries",\s*description:/g,
    'description:'
);
replaceFile('src/pages/dashboard/[businessId]/project-operations/requirements/create/page.tsx',
    /title:\s*"Inquiry Fetch Error",\s*description:/g,
    'description:'
);

