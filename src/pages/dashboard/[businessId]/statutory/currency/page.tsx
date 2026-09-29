import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '@/lib/api';
import { useBusinessData } from '@/components/dashboard/business-data-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Download, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, Table as TableIcon, FileJson } from 'lucide-react';

interface CurrencyUsageData {
  currency: string;
  exchangeRate?: number;
  summary: {
    sales: number;
    purchases: number;
    receivables: number;
    payables: number;
  };
}

interface CurrencyGainLossData {
  currency: string;
  realizedGain: number;
  realizedLoss: number;
  netGainLoss: number;
}

export default function CurrencyReportsPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { business } = useBusinessData();
  const [loading, setLoading] = useState(true);
  const [usageData, setUsageData] = useState<CurrencyUsageData[]>([]);
  const [fxData, setFxData] = useState<CurrencyGainLossData[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      let queryParams = `?businessId=${businessId}`;
      if (dateRange.from) queryParams += `&fromDate=${dateRange.from.toISOString()}`;
      if (dateRange.to) queryParams += `&toDate=${dateRange.to.toISOString()}`;

      const [usageRes, fxRes] = await Promise.all([
        api.get(`/reports/currency/usage${queryParams}`),
        api.get(`/reports/currency/gain-loss${queryParams}`)
      ]);

      if (usageRes.data?.success) {
        setUsageData(usageRes.data.usage || []);
      }
      
      if (fxRes.data?.success) {
        setFxData(fxRes.data.fxGainLoss || []);
      }

    } catch (err) {
      console.error('Failed to fetch currency reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) {
      fetchData();
    }
  }, [businessId, dateRange]);

  const handleExport = (format: string) => {
    let url = `/api/reports/currency/transactions/export/${format}?businessId=${businessId}`;
    if (dateRange.from) url += `&fromDate=${dateRange.from.toISOString()}`;
    if (dateRange.to) url += `&toDate=${dateRange.to.toISOString()}`;
    
    window.location.href = url;
  };

  // Combine usage and fx data
  const combinedData = usageData.map(usage => {
    const fx = fxData.find(f => f.currency === usage.currency) || {
      realizedGain: 0,
      realizedLoss: 0,
      netGainLoss: 0
    };
    return { ...usage, fx, exchangeRate: usage.exchangeRate };
  });

  const baseCcy = (business as any)?.baseCurrency?.code || 'Base';

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Currency Reports</h2>
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[280px] justify-start text-left font-normal shadow-sm">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(dateRange.from, 'LLL dd, y')
                  )
                ) : (
                  <span>Select date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range: any) => setDateRange(range || { from: undefined, to: undefined })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="shadow-sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="mr-2 h-4 w-4" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <TableIcon className="mr-2 h-4 w-4" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                <FileJson className="mr-2 h-4 w-4" />
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <>
            <Skeleton className="h-[250px] w-full rounded-xl" />
            <Skeleton className="h-[250px] w-full rounded-xl" />
            <Skeleton className="h-[250px] w-full rounded-xl" />
          </>
        ) : combinedData.length === 0 ? (
          <div className="col-span-full">
            <Card className="flex h-[300px] items-center justify-center border-dashed bg-slate-50/50">
              <div className="text-center">
                <h3 className="mt-2 text-sm font-semibold text-slate-900">No currency data</h3>
                <p className="mt-1 text-sm text-slate-500">No multi-currency transactions found for this period.</p>
              </div>
            </Card>
          </div>
        ) : (
          combinedData.map((item) => (
            <Card key={item.currency} className="overflow-hidden shadow-sm transition-all hover:shadow-md border-t-4 border-t-blue-500">
              <CardHeader className="bg-slate-50/50 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700">
                      {item.currency}
                    </div>
                    {item.exchangeRate && item.currency !== baseCcy && (
                      <span className="text-sm font-medium text-slate-500 bg-white px-2 py-1 rounded-md border shadow-sm">
                        1 {item.currency} = {item.exchangeRate.toLocaleString(undefined, { maximumFractionDigits: 6 })} {baseCcy}
                      </span>
                    )}
                  </CardTitle>
                  {item.currency === baseCcy && (
                    <span className="text-xs font-semibold uppercase bg-slate-200 text-slate-700 px-2 py-1 rounded-full">
                      Base Currency
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-500">Sales Volume</p>
                      <p className="text-xl font-semibold text-slate-900">
                        {item.summary.sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-500">Purchases Volume</p>
                      <p className="text-xl font-semibold text-slate-900">
                        {item.summary.purchases.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {item.currency !== baseCcy && (
                    <>
                      <div className="h-px w-full bg-slate-100" />
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                          <RefreshCcw className="size-4 text-blue-500" />
                          Realized FX Impact
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-xs font-medium text-green-700 mb-1 flex items-center gap-1">
                              <TrendingUp className="size-3" /> Gains
                            </p>
                            <p className="text-lg font-bold text-green-800">
                              {item.fx.realizedGain.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div className="bg-red-50 p-3 rounded-lg">
                            <p className="text-xs font-medium text-red-700 mb-1 flex items-center gap-1">
                              <TrendingDown className="size-3" /> Losses
                            </p>
                            <p className="text-lg font-bold text-red-800">
                              {item.fx.realizedLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                        <div className="pt-1 flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-600">Net FX Position:</span>
                          <span className={`font-bold ${item.fx.netGainLoss > 0 ? 'text-green-600' : item.fx.netGainLoss < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                            {item.fx.netGainLoss > 0 ? '+' : ''}{item.fx.netGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })} {baseCcy}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
