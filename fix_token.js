const fs = require('fs');
const path = 'src/pages/dashboard/[businessId]/project-operations/projects/ProjectsWorkspace.tsx';
let c = fs.readFileSync(path, 'utf-8');
c = c.replace(/token = document\.cookie\.split[^;]*?; \)\?.find\(row => row\.startsWith\('token='\)\)\?\.split\('='\)\\\[1\\\] \|\|\s*document\.cookie\.split[^;]*?; \)\?.find\(row => row\.startsWith\('accessToken='\)\)\?\.split\('='\)\\\[1\\\] \|\| '';/s, 
`const getCookie = (name) => {
          if (typeof document === 'undefined') return '';
          const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\\[\\]\\\\/+^])/g, '\\\\$1') + '=([^;]*)'));
          return match ? decodeURIComponent(match[1]) : '';
        };
        token = getCookie('token') || getCookie('accessToken') || '';`);
fs.writeFileSync(path, c);
console.log("Done");
