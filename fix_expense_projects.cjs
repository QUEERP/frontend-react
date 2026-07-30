const fs = require('fs');

const files = [
  'src/components/dashboard/add-expense-client.tsx',
  'src/components/dashboard/edit-expense-client.tsx',
  'src/components/dashboard/view-expense-client.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // Add state
  if (!content.includes('const [projects, setProjects]')) {
    content = content.replace(
      /const \[vendors, setVendors\] = useState<VendorOption\[\]>\(\[\]\)/,
      "const [vendors, setVendors] = useState<VendorOption[]>([])\n  const [projects, setProjects] = useState<any[]>([])"
    );
  }

  // Add fetch logic
  if (!content.includes('/api/projects')) {
    const fetchVendorsBlock = "const res = await fetch(`${API_BASE}/api/purchase/vendors?limit=1000`";
    const fetchProjectsStr = `
        const projRes = await fetch(\`\${API_BASE}/api/projects\`, {
          headers: { Authorization: \`Bearer \${token}\`, 'x-business-id': businessId }
        });
        const projData = await projRes.json();
        if (projRes.ok && projData?.success) {
          setProjects(projData.data || projData.projects || []);
        }
    `;
    content = content.replace(fetchVendorsBlock, fetchProjectsStr + "\n        " + fetchVendorsBlock);
  }

  // Add select group
  if (!content.includes('<SelectLabel>Projects</SelectLabel>')) {
    const fallbackProject = `{formData.referenceType === 'Project' && formData.referenceId && (`
    const fullProjectGroup = `
                      <SelectGroup>
                        <SelectLabel>Projects</SelectLabel>
                        {projects.filter(p => !formData.customerId || p.customerId === formData.customerId).map(p => (
                          <SelectItem key={\`Project|\${p.id}\`} value={\`Project|\${p.id}\`}>{p.projectName || p.projectCode}</SelectItem>
                        ))}
                      </SelectGroup>
                      {formData.referenceType === 'Project' && formData.referenceId && !projects.find(p => p.id === formData.referenceId) && (`;
    content = content.replace(fallbackProject, fullProjectGroup);
  }

  fs.writeFileSync(file, content);
  console.log('Fixed', file);
}
