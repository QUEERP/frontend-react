const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'dashboard', '[businessId]', 'quotations', '[id]', 'edit', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The file got completely mangled. We need to replace everything before `      try {`
// Let's just recreate the top part.
const topPart = `import * as React from 'react'
import {  useParams, useNavigate  } from 'react-router-dom';
import { ArrowLeft, Loader2, Edit3 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { QuotationForm } from '@/components/dashboard/quotation-form'
import { quotationsAPI, UpdateQuotationData } from '@/lib/api/quotations'

export default function EditQuotationPage() {
  const navigate = useNavigate()
  const params = useParams()
  const businessId = params.businessId || ''
  
  const { id } = useParams();
  const quotationId = id as string

  const [initialData, setInitialData] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const load = async () => {
`;

// Find `      try {` in the content, it should be the start of the load function.
const tryIndex = content.indexOf('      try {');
if (tryIndex !== -1) {
    fs.writeFileSync(filePath, topPart + content.slice(tryIndex), 'utf8');
    console.log('Fixed edit quotation page.');
} else {
    console.error('Could not find try block');
}
