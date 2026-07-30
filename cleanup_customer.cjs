const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'dashboard', 'customer-view-client.tsx');
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

const duplicateStart = lines.findIndex(l => l.startsWith("import React, { useEffect, useMemo, useState } from 'react'"));

// We want to find where the duplicate section ends.
// In the duplicate section, there's `const [loadingQuotations, setLoadingQuotations] = useState(false)` right above the second `const [paymentModalOpen, setPaymentModalOpen] = useState(false)`.
const duplicateEnd = lines.findIndex((l, i) => i > duplicateStart && l.includes('const [loadingQuotations, setLoadingQuotations] = useState(false)'));

if (duplicateStart !== -1 && duplicateEnd !== -1) {
  // We delete from duplicateStart up to duplicateEnd (inclusive)
  lines.splice(duplicateStart, duplicateEnd - duplicateStart + 1);
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log('Cleaned up duplicate code!');
} else {
  console.log('Could not find duplicate boundaries', duplicateStart, duplicateEnd);
}
