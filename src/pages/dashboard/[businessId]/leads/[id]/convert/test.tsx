import React from 'react'
import {  useNavigate, useParams  } from 'react-router-dom';
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function TestConvertPage() {
  const routerParams = useParams() as any;
  const { businessId } = routerParams;

  const navigate = useNavigate()
  const params = useParams()
  
  const { id } = useParams();
const leadId = id as string

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => navigate(`/dashboard/${businessId}/leads/${leadId}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lead
        </Button>
        <h1 className="text-3xl font-bold">Test Convert Page</h1>
        <p className="text-muted-foreground">
          This is a test page. Business ID: {businessId}, Lead ID: {leadId}
        </p>
      </div>

      <div className="space-y-4">
        <p>If you can see this page, the routing is working correctly!</p>
        <Button onClick={() => alert('Button works!')}>
          Test Button
        </Button>
      </div>
    </div>
  )
}
