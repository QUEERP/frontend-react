import { BasicSalesReportClient } from '@/components/dashboard/basic-sales-report-client'
import { TradingSalesReportClient } from '@/components/dashboard/trading-sales-report-client'
import { useBusinessData } from '@/components/dashboard/business-data-provider'

export const metadata = {
  title: 'Sales Report - Dashboard',
  description: 'View sales report and analytics',
}

export default function BasicSalesReportPage() {
  const { business } = useBusinessData();
  const isTrading = business?.businessType?.toLowerCase() === 'trading';

  if (isTrading) {
    return <TradingSalesReportClient />;
  }

  return <BasicSalesReportClient />
}
