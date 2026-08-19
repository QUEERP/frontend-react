const fs = require('fs');

const files = [
  'trading-sales-report-client.tsx',
  'trading-procurement-report-client.tsx',
  'trading-inventory-report-client.tsx',
  'project-operations-report-client.tsx'
];

for (const file of files) {
  const filePath = `C:/Users/DELL/Downloads/new-queerp/frontend/src/components/dashboard/${file}`;
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Add useRef if not imported
  if (!content.includes('useRef')) {
    content = content.replace("import React, { useEffect, useState }", "import React, { useEffect, useState, useRef }");
  }

  // Insert cache ref
  if (!content.includes('tabCache = useRef')) {
    content = content.replace(
      /const \[page, setPage\] = useState\(1\)/,
      "const [page, setPage] = useState(1)\n  const tabCache = useRef<Record<string, any>>({})"
    );
  }

  // Update useEffect caching logic
  // Find the exact API call structure. 
  // It varies slightly per file, but generally it's:
  // getXXXReport(businessId, ...) .then((res) => { ... })
  // We want to wrap or modify it. It's safer to just inject a check before the API call.
  
  // They all have: let isMounted = true
  const cacheKeyStr = `const cacheKey = \`\${activeTab}-\${page}-\${pageSize}\`;`;
  
  if (!content.includes(cacheKeyStr)) {
    content = content.replace(
      /let isMounted = true/,
      `let isMounted = true\n    const cacheKey = \`\${activeTab}-\${page}-\${pageSize}\`;\n    if (tabCache.current[cacheKey]) {\n      setData(prev => prev ? { ...prev, ...tabCache.current[cacheKey] } : tabCache.current[cacheKey]);\n      return;\n    }`
    );

    // Now modify the .then to cache the response.
    // .then((res) => {
    //   if (isMounted) {
    //     setData(prev => prev ? { ...prev, ...res.data } : res.data)
    
    // For sales and inventory: res.data
    // For project ops and procurement: res or res.data
    // Let's just find `if (isMounted) {` inside the `.then`
    
    content = content.replace(
      /\.then\(\(res\) => \{\s*if \(isMounted\) \{\s*setData\(prev => prev \? \{ \.\.\.prev, \.\.\.res(\.data)? \} : res(\.data)?\)/,
      `.then((res) => {\n        if (isMounted) {\n          const responseData = res.data || res;\n          tabCache.current[cacheKey] = responseData;\n          setData(prev => prev ? { ...prev, ...responseData } : responseData)`
    );
  }

  fs.writeFileSync(filePath, content);
  console.log(`Updated caching in ${file}`);
}
