import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Download } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, Table as TableIcon, FileJson } from 'lucide-react';

export default function StatutoryReportDetail() {
  const { businessId, reportCode } = useParams<{ businessId: string; reportCode: string }>();
  const [loading, setLoading] = useState(true);
  const [reportName, setReportName] = useState<string>('');
  const [data, setData] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  const fetchReport = async () => {
    try {
      setLoading(true);
      let url = `/reports/statutory/generate/${reportCode}?businessId=${businessId}`;
      if (dateRange.from) url += `&fromDate=${dateRange.from.toISOString()}`;
      if (dateRange.to) url += `&toDate=${dateRange.to.toISOString()}`;

      const res = await api.get(url);
      if (res.data?.success) {
        setReportName(res.data.report?.reportName || reportCode);
        setData(res.data.report?.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch statutory report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessId && reportCode) {
      fetchReport();
    }
  }, [businessId, reportCode, dateRange]);

  const handleExport = (format: string) => {
    let url = `/api/reports/statutory/generate/${reportCode}/export/${format}?businessId=${businessId}`;
    if (dateRange.from) url += `&fromDate=${dateRange.from.toISOString()}`;
    if (dateRange.to) url += `&toDate=${dateRange.to.toISOString()}`;
    
    window.location.href = url;
  };

  // Extract dynamic columns from the first row of data
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{reportName || 'Statutory Report'}</h2>
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
              <DropdownMenuLabel>Export Options</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="mr-2 h-4 w-4" /> PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <TableIcon className="mr-2 h-4 w-4" /> Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                <FileJson className="mr-2 h-4 w-4" /> JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
        ) : data.length === 0 ? (
          <Card className="flex h-[300px] items-center justify-center border-dashed bg-slate-50/50">
            <div className="text-center">
              <h3 className="mt-2 text-sm font-semibold text-slate-900">No data available</h3>
              <p className="mt-1 text-sm text-slate-500">There are no matching records for this report in the selected period.</p>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden shadow-sm">
            <CardHeader className="border-b bg-slate-50/50 py-3">
              <CardTitle className="text-base font-semibold text-slate-800">Report Data</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/80">
                    <TableRow>
                      {columns.map((col) => (
                        <TableHead key={col} className="font-semibold whitespace-nowrap">
                          {col.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row, i) => (
                      <TableRow key={i} className="hover:bg-slate-50/50">
                        {columns.map((col) => {
                          const val = row[col];
                          // Format numbers if they look like currency/amounts
                          const isNumber = typeof val === 'number';
                          return (
                            <TableCell key={col} className={isNumber ? 'text-right font-medium' : ''}>
                              {isNumber && !col.toLowerCase().includes('rate') ? val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : val}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
