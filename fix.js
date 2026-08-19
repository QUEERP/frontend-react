const fs = require('fs');
function replaceOptional(content, name) {
  const start = 'export interface ' + name + ' {';
  const iStart = content.indexOf(start);
  if(iStart === -1) return content;
  let braceCount = 0;
  let i = iStart + start.length - 1;
  for(; i < content.length; i++) {
    if(content[i] === '{') braceCount++;
    if(content[i] === '}') {
      braceCount--;
      if(braceCount === 0) break;
    }
  }
  const before = content.substring(0, iStart);
  const inside = content.substring(iStart, i + 1).replace(/\?:/g, ':');
  const after = content.substring(i + 1);
  return before + inside + after;
}

let f1 = 'src/lib/api/project-operations-reports.ts';
if(fs.existsSync(f1)) fs.writeFileSync(f1, replaceOptional(fs.readFileSync(f1, 'utf8'), 'ProjectOperationsReportData'));

let f2 = 'src/lib/api/inventory.ts';
if(fs.existsSync(f2)) fs.writeFileSync(f2, replaceOptional(fs.readFileSync(f2, 'utf8'), 'TradingInventoryReportData'));

let f3 = 'src/lib/api/purchase.ts';
if(fs.existsSync(f3)) fs.writeFileSync(f3, replaceOptional(fs.readFileSync(f3, 'utf8'), 'TradingProcurementReportData'));

let f4 = 'src/components/dashboard/project-operations-report-client.tsx';
if(fs.existsSync(f4)) {
  let c = fs.readFileSync(f4, 'utf8');
  c = c.replace(/import React, \{ useState, useEffect, useMemo \} from 'react';/, "import React, { useState, useEffect, useMemo, useRef } from 'react';");
  fs.writeFileSync(f4, c);
}

let f5 = 'src/components/dashboard/trading-inventory-report-client.tsx';
if(fs.existsSync(f5)) {
  let c = fs.readFileSync(f5, 'utf8');
  if(!c.includes('const handleTabChange')) {
    c = c.replace('const getExportConfig = () => getTabExportConfig(activeTab);', 'const handleTabChange = (value: string) => { setActiveTab(value); setPage(1); };\n\n  const getExportConfig = () => getTabExportConfig(activeTab);');
    fs.writeFileSync(f5, c);
  }
}
