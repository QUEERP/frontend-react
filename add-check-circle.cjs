const fs = require('fs');
const p = 'c:/Users/DELL/Downloads/new-queerp/frontend/src/components/dashboard/purchase-orders-page-client.tsx';
let c = fs.readFileSync(p, 'utf8');
if (!c.includes('CheckCircle')) {
  c = c.replace(/FileText\n\} from 'lucide-react'/g, "FileText,\n  CheckCircle\n} from 'lucide-react'");
  fs.writeFileSync(p, c);
  console.log('Added CheckCircle');
} else {
  console.log('CheckCircle already exists');
}
