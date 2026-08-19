import React from 'react';
import { useBusinessData } from '@/components/dashboard/business-data-provider';
import { TradingProcurementReportClient } from '@/components/dashboard/trading-procurement-report-client';
import PurchaseReportsPageClient from '@/components/dashboard/purchase-reports-page-client';

export default function ProcurementReportPage() {
  const { business } = useBusinessData();
  const isTrading = business?.businessType?.toLowerCase() === 'trading';

  if (isTrading) {
    return <TradingProcurementReportClient />;
  }

  return <PurchaseReportsPageClient />;
}
