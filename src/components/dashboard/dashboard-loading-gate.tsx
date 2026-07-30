import React from 'react'

import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { DashboardPageSkeleton } from '@/components/dashboard/dashboard-page-skeleton'

export function DashboardLoadingGate({ children }: { children: React.ReactNode }) {
  const { loading } = useBusinessData()

  if (loading) {
    return <DashboardPageSkeleton />
  }

  return <>{children}</>
}
