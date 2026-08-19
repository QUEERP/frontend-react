import React from 'react'
import { TradingInventoryReportClient } from '@/components/dashboard/trading-inventory-report-client'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export default function InventoryReportPage() {
  const { business } = useBusinessData()
  
  if (business?.businessType !== 'trading') {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Available</AlertTitle>
          <AlertDescription>
            The comprehensive Inventory Report is currently only available for trading businesses.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return <TradingInventoryReportClient />
}
