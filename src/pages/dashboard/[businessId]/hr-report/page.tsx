import React from 'react';
import { useBusinessData } from '@/components/dashboard/business-data-provider';
import { HRReportClient } from '@/components/dashboard/hr-report-client';
import { Card, CardContent } from '@/components/ui/card';

export default function HRReportPage() {
  const { business } = useBusinessData();
  const isTrading = business?.businessType?.toLowerCase() === 'trading';

  if (isTrading && business?.id) {
    return <HRReportClient businessId={business.id} />;
  }

  return (
    <div className="flex h-[50vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">
            HR Reports are currently only available for trading businesses.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
