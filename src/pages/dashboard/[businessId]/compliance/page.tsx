import React from 'react'
import ComplianceDashboardClient from '@/components/dashboard/compliance-dashboard-client'

export default function CompliancePage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Compliance</h1>
        <p className="text-muted-foreground">Manage your regulatory compliance and corporate tasks.</p>
      </div>
      <ComplianceDashboardClient />
    </div>
  )
}
