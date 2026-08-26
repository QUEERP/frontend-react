import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '@/lib/api';
import { useBusinessData } from '@/components/dashboard/business-data-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Download } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, Table as TableIcon, FileJson } from 'lucide-react';

interface TaxSummaryRow {
  category: string;
  transactionType: string;
  transactionCurrency: string;
  taxType: string;
  taxRate: number;
  totalTaxBaseCcy: number;
  totalTaxTxnCcy: number;
}

export default function TaxReportsPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { business } = useBusinessData();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TaxSummaryRow[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  const fetchTaxSummary = async () => {
    try {
      setLoading(true);
      let url = `/reports/tax/summary?businessId=${businessId}`;
      if (dateRange.from) url += `&fromDate=${dateRange.from.toISOString()}`;
      if (dateRange.to) url += `&toDate=${dateRange.to.toISOString()}`;

      const res = await api.get(url);
      if (res.data?.success) {
        const transformed = transformTaxData(res.data.summary || []);
        setData(transformed);
      }
    } catch (err) {
      console.error('Failed to fetch tax summary', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) {
      fetchTaxSummary();
    }
  }, [businessId, dateRange]);

  const handleExport = (format: string, reportType: 'summary' | 'transactions') => {
    let url = `/api/reports/tax/${reportType}/export/${format}?businessId=${businessId}`;
    if (dateRange.from) url += `&fromDate=${dateRange.from.toISOString()}`;
    if (dateRange.to) url += `&toDate=${dateRange.to.toISOString()}`;
    
    // For file downloads, we can't easily use Axios because of how browsers handle attachments natively.
    // The easiest robust way is just redirecting the browser or using an anchor tag.
    // Assuming token is in cookie. If it relies on Auth header, we'd need to fetch as blob.
    
    window.location.href = url;
  };

  const transformTaxData = (summary: any[]): TaxSummaryRow[] => {
    // Map to group additive and subtractive types
    const grouped = new Map<string, TaxSummaryRow>();

    summary.forEach(row => {
      const { transactionType, transactionCurrency, taxType, taxRate, totalTaxBaseCcy, totalTaxTxnCcy } = row;
      
      let category = 'Other';
      let multiplier = 1;

      if (['INVOICE'].includes(transactionType)) {
        category = 'Collected (Sales)';
      } else if (['CREDIT_NOTE'].includes(transactionType)) {
        category = 'Collected (Sales)';
        multiplier = -1; // Reversal reduces collected sales
      } else if (['BILL'].includes(transactionType)) {
        category = 'Paid (Purchases)';
      } else if (['PURCHASE_RETURN'].includes(transactionType)) {
        category = 'Paid (Purchases)';
        multiplier = -1; // Reversal reduces paid purchases
      }

      const key = `${category}_${transactionCurrency}_${taxType}_${taxRate}`;
      
      if (!grouped.has(key)) {
        grouped.set(key, {
          category,
          transactionType,
          transactionCurrency: transactionCurrency || 'UNKNOWN',
          taxType: taxType || 'Unknown',
          taxRate: taxRate || 0,
          totalTaxBaseCcy: 0,
          totalTaxTxnCcy: 0
        });
      }

      const current = grouped.get(key)!;
      current.totalTaxBaseCcy += (totalTaxBaseCcy || 0) * multiplier;
      current.totalTaxTxnCcy += (totalTaxTxnCcy || 0) * multiplier;
    });

    return Array.from(grouped.values()).sort((a, b) => {
      // Sort by Currency, then Category, then Tax Type
      if (a.transactionCurrency !== b.transactionCurrency) return a.transactionCurrency.localeCompare(b.transactionCurrency);
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.taxType.localeCompare(b.taxType);
    });
  };

  // Group by currency for visual representation
  const dataByCurrency = data.reduce((acc, row) => {
    if (!acc[row.transactionCurrency]) acc[row.transactionCurrency] = [];
    acc[row.transactionCurrency].push(row);
    return acc;
  }, {} as Record<string, TaxSummaryRow[]>);

  const baseCcy = (business as any)?.baseCurrency?.code || 'Base';

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Tax Reports</h2>
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
              <DropdownMenuLabel>Export Summary</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleExport('pdf', 'summary')}>
                <FileText className="mr-2 h-4 w-4" /> PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel', 'summary')}>
                <TableIcon className="mr-2 h-4 w-4" /> Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json', 'summary')}>
                <FileJson className="mr-2 h-4 w-4" /> JSON
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Export Transactions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleExport('pdf', 'transactions')}>
                <FileText className="mr-2 h-4 w-4" /> PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel', 'transactions')}>
                <TableIcon className="mr-2 h-4 w-4" /> Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json', 'transactions')}>
                <FileJson className="mr-2 h-4 w-4" /> JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-[250px] w-full rounded-xl" />
            <Skeleton className="h-[250px] w-full rounded-xl" />
          </div>
        ) : Object.keys(dataByCurrency).length === 0 ? (
          <Card className="flex h-[300px] items-center justify-center border-dashed bg-slate-50/50">
            <div className="text-center">
              <h3 className="mt-2 text-sm font-semibold text-slate-900">No tax data</h3>
              <p className="mt-1 text-sm text-slate-500">No tax transactions found for this period.</p>
            </div>
          </Card>
        ) : (
          Object.entries(dataByCurrency).map(([currency, rows]) => {
            const totalCollected = rows.filter(r => r.category.includes('Collected')).reduce((sum, r) => sum + r.totalTaxTxnCcy, 0);
            const totalPaid = rows.filter(r => r.category.includes('Paid')).reduce((sum, r) => sum + r.totalTaxTxnCcy, 0);
            const netPayable = totalCollected - totalPaid;

            return (
              <Card key={currency} className="overflow-hidden shadow-sm transition-all hover:shadow-md">
                <CardHeader className="border-b bg-slate-50/50 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{currency} Tax Ledger</span>
                    </CardTitle>
                    <div className="flex gap-4">
                      <div className="text-right">
                        <p className="text-xs text-slate-500 font-medium">Net Payable (Txn Ccy)</p>
                        <p className={`text-lg font-bold ${netPayable > 0 ? 'text-red-600' : netPayable < 0 ? 'text-green-600' : 'text-slate-700'}`}>
                          {netPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50/80">
                      <TableRow>
                        <TableHead className="w-[180px]">Category</TableHead>
                        <TableHead>Tax Type</TableHead>
                        <TableHead>Rate (%)</TableHead>
                        <TableHead className="text-right">Tax Amount ({currency})</TableHead>
                        {currency !== baseCcy && (
                          <TableHead className="text-right">Base Amount ({baseCcy})</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row, i) => (
                        <TableRow key={i} className="group hover:bg-slate-50/50">
                          <TableCell className="font-medium">
                            <Badge variant={row.category.includes('Collected') ? 'default' : 'secondary'} className="bg-opacity-20 hover:bg-opacity-30">
                              {row.category}
                            </Badge>
                          </TableCell>
                          <TableCell>{row.taxType}</TableCell>
                          <TableCell>{row.taxRate}%</TableCell>
                          <TableCell className="text-right font-medium">
                            {row.totalTaxTxnCcy.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          {currency !== baseCcy && (
                            <TableCell className="text-right text-slate-500">
                              {row.totalTaxBaseCcy.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
