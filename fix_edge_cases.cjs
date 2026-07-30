const fs = require('fs');
const path = require('path');

function fixFile(filePath, replacer) {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) return;
    let content = fs.readFileSync(fullPath, 'utf8');
    const newContent = replacer(content);
    if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log('Fixed', filePath);
    }
}

// 1. Fix duplicate useParams imports
fixFile('src/pages/dashboard/[businessId]/expenses/add/page.tsx', c => {
    return c.replace("import { useParams } from 'react-router-dom';\n", '');
});
fixFile('src/pages/dashboard/[businessId]/invoices/add/page.tsx', c => {
    return c.replace("import { useParams } from 'react-router-dom';\n", '');
});

// 2. Fix expenses/add/page.tsx projectId prop
fixFile('src/pages/dashboard/[businessId]/expenses/add/page.tsx', c => {
    return c.replace('projectId={projectId as string}', '');
});

// 3. Fix project-operations/change-requests/create/page.tsx
fixFile('src/pages/dashboard/[businessId]/project-operations/change-requests/create/page.tsx', c => {
    c = c.replace(/getProjects\(businessId\)/g, 'getProjects(businessId as string)');
    c = c.replace(/getBusinessUsers\(businessId\)/g, 'getBusinessUsers(businessId as string)');
    c = c.replace(/getCustomers\(businessId\)/g, 'getCustomers(businessId as string)');
    c = c.replace(/getContacts\(businessId\)/g, 'getContacts(businessId as string)');
    c = c.replace(/createChangeRequest\(businessId/g, 'createChangeRequest(businessId as string');
    
    // Fix custRes.success -> (custRes as any).success
    c = c.replace(/custRes\.success/g, '(custRes as any).success');
    c = c.replace(/custRes\.customers/g, '(custRes as any).customers');
    c = c.replace(/custRes\.data/g, '(custRes as any).data');
    
    c = c.replace(/contRes\.success/g, '(contRes as any).success');
    c = c.replace(/contRes\.contacts/g, '(contRes as any).contacts');
    c = c.replace(/contRes\.data/g, '(contRes as any).data');
    
    return c;
});

// 4. Fix requirements/create/page.tsx multiple properties 'description'
fixFile('src/pages/dashboard/[businessId]/project-operations/requirements/create/page.tsx', c => {
    return c.replace(/description: "No Inquiries", description: /g, 'title: "No Inquiries", description: ')
            .replace(/description: "Inquiry Fetch Error", description: /g, 'title: "Inquiry Fetch Error", description: ');
});

// 5. Fix projects/create/page.tsx argument type string | undefined
fixFile('src/pages/dashboard/[businessId]/project-operations/projects/create/page.tsx', c => {
    return c.replace(/getContractById\(businessId, contractId\)/g, 'getContractById(businessId as string, contractId)');
});
