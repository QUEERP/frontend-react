import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar as CalendarIcon,
  Download,
  FileText,
  Table as TableIcon,
  FileJson,
  FileSpreadsheet,
  Loader2,
  Search,
  Receipt,
  TrendingUp,
  Building2,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  X,
  FileCheck
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/components/ui/use-toast';
import { useBusinessData } from '@/components/dashboard/business-data-provider';

type PresetId = 'all' | 'this_month' | 'last_month' | 'this_quarter' | 'this_fy';

interface PeriodPreset {
  id: PresetId;
  label: string;
  getFrom: () => Date | undefined;
  getTo: () => Date | undefined;
}

const PERIOD_PRESETS: PeriodPreset[] = [
  {
    id: 'all',
    label: 'All Time',
    getFrom: () => undefined,
    getTo: () => undefined,
  },
  {
    id: 'this_month',
    label: 'This Month',
    getFrom: () => startOfMonth(new Date()),
    getTo: () => endOfMonth(new Date()),
  },
  {
    id: 'last_month',
    label: 'Last Month',
    getFrom: () => startOfMonth(subMonths(new Date(), 1)),
    getTo: () => endOfMonth(subMonths(new Date(), 1)),
  },
  {
    id: 'this_quarter',
    label: 'This Quarter',
    getFrom: () => startOfQuarter(new Date()),
    getTo: () => endOfQuarter(new Date()),
  },
  {
    id: 'this_fy',
    label: 'Current FY',
    getFrom: () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      // Indian FY starts on April 1st
      return now.getMonth() >= 3 ? new Date(currentYear, 3, 1) : new Date(currentYear - 1, 3, 1);
    },
    getTo: () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      return now.getMonth() >= 3 ? new Date(currentYear + 1, 2, 31, 23, 59, 59) : new Date(currentYear, 2, 31, 23, 59, 59);
    },
  },
];

export default function StatutoryReportDetail() {
  const { businessId, reportCode } = useParams<{ businessId: string; reportCode: string }>();
  const { toast } = useToast();
  const { business } = useBusinessData();

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [reportName, setReportName] = useState<string>('');
  const [reportPayload, setReportPayload] = useState<any>(null);
  const [activePreset, setActivePreset] = useState<PresetId>('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  // Invoice tab search & filters
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [supplyTypeFilter, setSupplyTypeFilter] = useState<'ALL' | 'B2B' | 'B2C'>('ALL');

  const currSymbol = useMemo(() => {
    return business?.baseCurrency?.symbol || business?.currency === 'INR' || (business as any)?.country === 'INDIA' ? '₹' : (business?.currency || '₹');
  }, [business]);

  const baseCcy = useMemo(() => {
    return business?.baseCurrency?.code || business?.currency || 'INR';
  }, [business]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      let url = `/reports/statutory/generate/${reportCode}?businessId=${businessId}`;
      if (dateRange.from) url += `&fromDate=${dateRange.from.toISOString()}`;
      if (dateRange.to) url += `&toDate=${dateRange.to.toISOString()}`;

      const res = await api.get(url);
      if (res.data?.success) {
        const rep = res.data.report || {};
        setReportName(rep.reportName || reportCode || 'Statutory Report');
        setReportPayload(rep);
      }
    } catch (err: any) {
      console.error('Failed to fetch statutory report', err);
      toast({
        title: "Error Loading Report",
        description: err?.message || "Failed to load statutory report data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessId && reportCode) {
      fetchReport();
    }
  }, [businessId, reportCode, dateRange]);

  const handlePresetSelect = (presetId: PresetId) => {
    setActivePreset(presetId);
    const preset = PERIOD_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setDateRange({ from: preset.getFrom(), to: preset.getTo() });
    }
  };

  const handleExport = async (formatType: string) => {
    try {
      setExporting(true);
      toast({
        title: "Exporting...",
        description: `Generating ${reportName || reportCode} ${formatType.toUpperCase()} file...`,
      });

      let url = `/reports/statutory/generate/${reportCode}/export/${formatType}?businessId=${businessId}`;
      if (dateRange.from) url += `&fromDate=${dateRange.from.toISOString()}`;
      if (dateRange.to) url += `&toDate=${dateRange.to.toISOString()}`;

      const ext = formatType === 'excel' ? 'xlsx' : formatType;
      const safeTitle = (reportName || reportCode || 'Report').replace(/\s+/g, '_');
      const defaultFilename = `${safeTitle}_${format(new Date(), 'yyyy-MM-dd')}.${ext}`;
      await api.download(url, defaultFilename);

      toast({
        title: "Export Completed",
        description: `${reportName || reportCode} ${formatType.toUpperCase()} downloaded successfully.`,
      });
    } catch (err: any) {
      console.error('Statutory export error:', err);
      toast({
        title: "Export Failed",
        description: err.message || `Failed to export as ${formatType.toUpperCase()}`,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  // Extract data sections
  const rateData: any[] = useMemo(() => {
    return Array.isArray(reportPayload?.data) ? reportPayload.data : [];
  }, [reportPayload]);

  const invoicesData: any[] = useMemo(() => {
    return Array.isArray(reportPayload?.invoices) ? reportPayload.invoices : [];
  }, [reportPayload]);

  const hsnData: any[] = useMemo(() => {
    return Array.isArray(reportPayload?.hsnSummary) ? reportPayload.hsnSummary : [];
  }, [reportPayload]);

  const summary = useMemo(() => {
    if (reportPayload?.summary) {
      return reportPayload.summary;
    }
    // Fallback compute summary from rateData
    return rateData.reduce((acc: any, r: any) => {
      acc.totalTaxableAmount = (acc.totalTaxableAmount || 0) + Number(r.taxableAmount || 0);
      acc.totalCgst = (acc.totalCgst || 0) + Number(r.CGST || 0);
      acc.totalSgst = (acc.totalSgst || 0) + Number(r.SGST || 0);
      acc.totalIgst = (acc.totalIgst || 0) + Number(r.IGST || 0);
      acc.totalTax = (acc.totalTax || 0) + Number(r.totalTax || r.totalTaxBaseCcy || 0);
      acc.totalAmount = (acc.totalAmount || 0) + Number(r.totalAmount || (Number(r.taxableAmount || 0) + Number(r.totalTax || 0)));
      acc.totalInvoices = (acc.totalInvoices || 0) + Number(r.invoiceCount || 0);
      return acc;
    }, {
      totalTaxableAmount: 0,
      totalCgst: 0,
      totalSgst: 0,
      totalIgst: 0,
      totalTax: 0,
      totalAmount: 0,
      totalInvoices: 0
    });
  }, [reportPayload, rateData]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoicesData.filter(inv => {
      const matchSearch =
        !invoiceSearch ||
        inv.invoiceNumber?.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
        inv.customerName?.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
        inv.gstin?.toLowerCase().includes(invoiceSearch.toLowerCase());

      const matchType =
        supplyTypeFilter === 'ALL' ||
        inv.supplyType === supplyTypeFilter;

      return matchSearch && matchType;
    });
  }, [invoicesData, invoiceSearch, supplyTypeFilter]);

  const formatCurrency = (val: number | string | undefined | null) => {
    const num = Number(val || 0);
    return `${currSymbol} ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const isGstr1 = reportCode?.toUpperCase() === 'GSTR1';
  const hasSections = Array.isArray(reportPayload?.sections) && reportPayload.sections.length > 0;

  // Active period display string
  const activePeriodString = useMemo(() => {
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, 'dd MMM yyyy')} — ${format(dateRange.to, 'dd MMM yyyy')}`;
    }
    if (dateRange.from) {
      return `From ${format(dateRange.from, 'dd MMM yyyy')}`;
    }
    if (dateRange.to) {
      return `Up to ${format(dateRange.to, 'dd MMM yyyy')}`;
    }
    return 'All Historic Records';
  }, [dateRange]);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto min-h-screen">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {reportName || 'Statutory Return'}
            </h1>
            <Badge variant="outline" className="border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold px-2.5 py-0.5">
              India GST Statutory
            </Badge>
            <Badge variant="outline" className="border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium px-2 py-0.5">
              <CheckCircle2 className="size-3 mr-1" /> CBIC Compliant
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 flex flex-wrap items-center gap-2">
            <span>Reporting Period:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              {activePeriodString}
            </span>
            <span>• Base Currency: <strong className="text-slate-900 dark:text-white">{baseCcy} ({currSymbol})</strong></span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Presets */}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-xs">
            {PERIOD_PRESETS.map(preset => (
              <Button
                key={preset.id}
                variant={activePreset === preset.id ? 'default' : 'ghost'}
                size="sm"
                className={`h-8 px-2.5 text-xs font-semibold transition-all ${
                  activePreset === preset.id
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                onClick={() => handlePresetSelect(preset.id)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Date Picker Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-9 justify-start text-left font-normal shadow-xs transition-all bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 ${
                  dateRange.from ? 'border-blue-300 dark:border-blue-700 ring-1 ring-blue-500/20' : ''
                }`}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate">
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'dd MMM yyyy')} - {format(dateRange.to, 'dd MMM yyyy')}
                      </>
                    ) : (
                      format(dateRange.from, 'dd MMM yyyy')
                    )
                  ) : (
                    <span>Custom Range</span>
                  )}
                </span>
                {dateRange.from && (
                  <X
                    className="ml-2 size-3.5 text-slate-400 hover:text-slate-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDateRange({ from: undefined, to: undefined });
                      setActivePreset('all');
                    }}
                  />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from || new Date()}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range: any) => {
                  setDateRange(range || { from: undefined, to: undefined });
                  setActivePreset('all');
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReport}
            disabled={loading}
            className="h-9 px-2.5 bg-white dark:bg-slate-900"
            title="Refresh Report Data"
          >
            <RefreshCw className={`size-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                size="sm"
                disabled={exporting}
                className="h-9 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs font-semibold px-3"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Download className="h-4 w-4 text-white" />
                )}
                <span>{exporting ? 'Exporting...' : 'Export Return'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 shadow-lg rounded-xl">
              <DropdownMenuLabel className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Official Export Formats
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport('pdf')} disabled={exporting} className="cursor-pointer py-2 font-medium">
                <FileText className="mr-2 h-4 w-4 text-rose-600" /> Export Official PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')} disabled={exporting} className="cursor-pointer py-2 font-medium">
                <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" /> Export Excel (Multi-Sheet)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')} disabled={exporting} className="cursor-pointer py-2 font-medium">
                <TableIcon className="mr-2 h-4 w-4 text-blue-600" /> Export CSV Table
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')} disabled={exporting} className="cursor-pointer py-2 font-medium">
                <FileJson className="mr-2 h-4 w-4 text-amber-600" /> Export JSON (Statutory Schema)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── KPI Summary Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* 1. Taxable Turnover */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Taxable Turnover
              </span>
              <div className="size-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <TrendingUp className="size-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(summary.totalTaxableAmount)}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Net outward taxable value
            </p>
          </CardContent>
        </Card>

        {/* 2. Total GST Liability */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total GST Liability
              </span>
              <div className="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Receipt className="size-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {formatCurrency(summary.totalTax)}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Total outward tax payable
            </p>
          </CardContent>
        </Card>

        {/* 3. Central GST (CGST) */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Central GST (CGST)
              </span>
              <div className="size-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <ShieldCheck className="size-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">
              {formatCurrency(summary.totalCgst)}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Intra-state central share
            </p>
          </CardContent>
        </Card>

        {/* 4. State GST (SGST) */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                State GST (SGST)
              </span>
              <div className="size-8 rounded-lg bg-violet-50 dark:bg-violet-950/60 flex items-center justify-center text-violet-600 dark:text-violet-400">
                <Building2 className="size-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-violet-600 dark:text-violet-400 tracking-tight">
              {formatCurrency(summary.totalSgst)}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Intra-state state share
            </p>
          </CardContent>
        </Card>

        {/* 5. Integrated GST (IGST) */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-shadow col-span-2 md:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Integrated (IGST)
              </span>
              <div className="size-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <FileCheck className="size-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
              {formatCurrency(summary.totalIgst)}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Inter-state outward supplies
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Main Content Area ──────────────────────────────────── */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-[450px] w-full rounded-2xl" />
        </div>
      ) : rateData.length === 0 && (!invoicesData || invoicesData.length === 0) ? (
        <Card className="flex h-[340px] items-center justify-center border-dashed border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl">
          <div className="text-center max-w-sm px-4">
            <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <FileText className="size-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Statutory Records Found</h3>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              There are no posted invoices or outward supplies matching the selected period ({activePeriodString}). Try clearing filters or selecting another date range.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePresetSelect('all')}
              className="mt-4 text-xs font-semibold"
            >
              Show All Time Records
            </Button>
          </div>
        </Card>
      ) : isGstr1 ? (
        // ── GSTR-1 MULTI-TAB WORKSPACE ─────────────────────────
        <Tabs defaultValue="rate_summary" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
            <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <TabsTrigger value="rate_summary" className="text-xs font-semibold rounded-lg px-3 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-xs">
                Rate-wise Summary (Table 8)
                <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0 bg-slate-200 dark:bg-slate-700">
                  {rateData.length} Slabs
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="invoices" className="text-xs font-semibold rounded-lg px-3 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-xs">
                Outward Invoices (B2B / B2C)
                <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0 bg-slate-200 dark:bg-slate-700">
                  {invoicesData.length} Docs
                </Badge>
              </TabsTrigger>
              {hsnData.length > 0 && (
                <TabsTrigger value="hsn" className="text-xs font-semibold rounded-lg px-3 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-xs">
                  HSN / SAC Summary (Table 12)
                  <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0 bg-slate-200 dark:bg-slate-700">
                    {hsnData.length} Codes
                  </Badge>
                </TabsTrigger>
              )}
            </TabsList>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
              <span>Showing:</span>
              <strong className="text-slate-800 dark:text-slate-200">{summary.totalInvoices} Invoices</strong>
              <span>• Total:</span>
              <strong className="text-blue-600 dark:text-blue-400">{formatCurrency(summary.totalAmount)}</strong>
            </div>
          </div>

          {/* TAB 1: Rate Summary */}
          <TabsContent value="rate_summary" className="m-0 focus-visible:outline-none">
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 py-3.5 px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                      Tax Rate-wise Outward Supplies
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                      Statutory GST rate slabs with segregated CGST, SGST, IGST, and taxable turnovers.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-white dark:bg-slate-800 font-semibold text-xs border-slate-200 dark:border-slate-700">
                    {rateData.length} Slabs Configured
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 pl-6">
                          Tax Rate
                        </TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 text-right">
                          Taxable Value ({baseCcy})
                        </TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 text-right">
                          CGST ({baseCcy})
                        </TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-violet-600 dark:text-violet-400 text-right">
                          SGST ({baseCcy})
                        </TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 text-right">
                          IGST ({baseCcy})
                        </TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 text-right">
                          Total GST ({baseCcy})
                        </TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 text-right">
                          Total Invoice Value ({baseCcy})
                        </TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 text-center pr-6">
                          Invoices
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rateData.map((row) => {
                        const rateNum = Number(row.taxRate || 0);
                        return (
                          <TableRow key={row.taxRate} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                            <TableCell className="pl-6 font-bold">
                              <Badge
                                variant="outline"
                                className={`font-bold px-2.5 py-0.5 text-xs ${
                                  rateNum === 0
                                    ? 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300'
                                    : rateNum === 5
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : rateNum === 12
                                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300'
                                    : rateNum === 18
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300'
                                    : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
                                }`}
                              >
                                {rateNum}% {rateNum === 0 ? 'Nil / Exempt' : 'GST Slab'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-slate-900 dark:text-white tabular-nums">
                              {Number(row.taxableAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right font-medium text-indigo-600 dark:text-indigo-400 tabular-nums">
                              {Number(row.CGST || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right font-medium text-violet-600 dark:text-violet-400 tabular-nums">
                              {Number(row.SGST || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right font-medium text-amber-600 dark:text-amber-400 tabular-nums">
                              {Number(row.IGST || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                              {Number(row.totalTax || row.totalTaxBaseCcy || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right font-bold text-blue-700 dark:text-blue-400 tabular-nums">
                              {Number(row.totalAmount || (Number(row.taxableAmount || 0) + Number(row.totalTax || 0))).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-center pr-6">
                              <Badge variant="secondary" className="font-semibold text-xs px-2 bg-slate-100 dark:bg-slate-800">
                                {row.invoiceCount || 0} Docs
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                    <TableFooter className="bg-slate-100/80 dark:bg-slate-900 border-t-2 border-slate-300 dark:border-slate-700">
                      <TableRow className="font-extrabold hover:bg-transparent">
                        <TableCell className="pl-6 text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                          Grand Total
                        </TableCell>
                        <TableCell className="text-right text-slate-900 dark:text-white tabular-nums">
                          {formatCurrency(summary.totalTaxableAmount)}
                        </TableCell>
                        <TableCell className="text-right text-indigo-700 dark:text-indigo-300 tabular-nums">
                          {formatCurrency(summary.totalCgst)}
                        </TableCell>
                        <TableCell className="text-right text-violet-700 dark:text-violet-300 tabular-nums">
                          {formatCurrency(summary.totalSgst)}
                        </TableCell>
                        <TableCell className="text-right text-amber-700 dark:text-amber-300 tabular-nums">
                          {formatCurrency(summary.totalIgst)}
                        </TableCell>
                        <TableCell className="text-right text-emerald-700 dark:text-emerald-300 tabular-nums">
                          {formatCurrency(summary.totalTax)}
                        </TableCell>
                        <TableCell className="text-right text-blue-700 dark:text-blue-300 tabular-nums">
                          {formatCurrency(summary.totalAmount)}
                        </TableCell>
                        <TableCell className="text-center pr-6 text-slate-900 dark:text-white">
                          {summary.totalInvoices} Invoices
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: Outward Invoices */}
          <TabsContent value="invoices" className="m-0 focus-visible:outline-none">
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 py-3.5 px-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                      B2B & B2C Invoices Register
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                      Itemized list of posted outward supply invoices with place of supply and tax breakdown.
                    </CardDescription>
                  </div>

                  {/* Search and Filter bar */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="Search Invoice #, Party, GSTIN..."
                        value={invoiceSearch}
                        onChange={(e) => setInvoiceSearch(e.target.value)}
                        className="h-8 pl-8 text-xs w-56 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 text-xs">
                      {(['ALL', 'B2B', 'B2C'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => setSupplyTypeFilter(type)}
                          className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                            supplyTypeFilter === type
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 pl-6">
                          Invoice #
                        </TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">
                          Date
                        </TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">
                          Customer
                        </TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">
                          GSTIN / URP
                        </TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">
                          Type
                        </TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">
                          Place of Supply
                        </TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 text-right">
                          Taxable ({baseCcy})
                        </TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 text-right">
                          Rate
                        </TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 text-right">
                          CGST
                        </TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-violet-600 dark:text-violet-400 text-right">
                          SGST
                        </TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 text-right">
                          IGST
                        </TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 text-right">
                          Total GST
                        </TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 text-right">
                          Invoice Total
                        </TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 text-center pr-6">
                          Status
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={14} className="text-center py-8 text-xs text-slate-400">
                            No invoices match the search query or filter.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredInvoices.map((inv) => (
                          <TableRow key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                            <TableCell className="pl-6 font-bold text-blue-600 dark:text-blue-400 font-mono text-xs">
                              {inv.invoiceNumber}
                            </TableCell>
                            <TableCell className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {inv.invoiceDate ? format(new Date(inv.invoiceDate), 'dd MMM yyyy') : '-'}
                            </TableCell>
                            <TableCell className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                              {inv.customerName}
                            </TableCell>
                            <TableCell className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                              {inv.gstin}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-bold px-1.5 py-0 ${
                                  inv.supplyType === 'B2B'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                }`}
                              >
                                {inv.supplyType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                inv.placeOfSupply === 'Inter-State'
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}>
                                {inv.placeOfSupply}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-medium text-xs tabular-nums text-slate-900 dark:text-white">
                              {Number(inv.taxableAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right text-xs font-semibold text-slate-600 dark:text-slate-400">
                              {inv.taxRate}%
                            </TableCell>
                            <TableCell className="text-right text-xs text-indigo-600 dark:text-indigo-400 tabular-nums">
                              {inv.cgst > 0 ? Number(inv.cgst).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                            </TableCell>
                            <TableCell className="text-right text-xs text-violet-600 dark:text-violet-400 tabular-nums">
                              {inv.sgst > 0 ? Number(inv.sgst).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                            </TableCell>
                            <TableCell className="text-right text-xs text-amber-600 dark:text-amber-400 tabular-nums">
                              {inv.igst > 0 ? Number(inv.igst).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                            </TableCell>
                            <TableCell className="text-right text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                              {Number(inv.totalTax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right text-xs font-bold text-blue-700 dark:text-blue-400 tabular-nums">
                              {Number(inv.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-center pr-6">
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-bold px-1.5 py-0 ${
                                  inv.status === 'PAID'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
                                }`}
                              >
                                {inv.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: HSN Summary */}
          {hsnData.length > 0 && (
            <TabsContent value="hsn" className="m-0 focus-visible:outline-none">
              <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 py-3.5 px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                        HSN / SAC Summary of Outward Supplies (Table 12)
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 mt-0.5">
                        Harmonized System of Nomenclature classification summary for goods and services.
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-white dark:bg-slate-800 font-semibold text-xs border-slate-200 dark:border-slate-700">
                      {hsnData.length} HSN Codes
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 pl-6">
                            HSN/SAC Code
                          </TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            Description
                          </TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 text-center">
                            UQC / Unit
                          </TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 text-right">
                            Total Quantity
                          </TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 text-right">
                            Taxable Value ({baseCcy})
                          </TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 text-right">
                            Rate
                          </TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 text-right">
                            CGST
                          </TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider text-violet-600 dark:text-violet-400 text-right">
                            SGST
                          </TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 text-right">
                            IGST
                          </TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 text-right pr-6">
                            Total Tax
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {hsnData.map((h, i) => (
                          <TableRow key={i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                            <TableCell className="pl-6 font-bold font-mono text-xs text-blue-600 dark:text-blue-400">
                              {h.hsnCode}
                            </TableCell>
                            <TableCell className="text-xs font-medium text-slate-800 dark:text-slate-200">
                              {h.description}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0 bg-slate-50 dark:bg-slate-800">
                                {h.uqc || 'NOS'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-xs font-semibold tabular-nums">
                              {Number(h.totalQuantity || 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-xs font-semibold text-slate-900 dark:text-white tabular-nums">
                              {Number(h.taxableAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right text-xs font-semibold text-slate-600 dark:text-slate-400">
                              {h.taxRate}%
                            </TableCell>
                            <TableCell className="text-right text-xs text-indigo-600 dark:text-indigo-400 tabular-nums">
                              {h.cgst > 0 ? Number(h.cgst).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                            </TableCell>
                            <TableCell className="text-right text-xs text-violet-600 dark:text-violet-400 tabular-nums">
                              {h.sgst > 0 ? Number(h.sgst).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                            </TableCell>
                            <TableCell className="text-right text-xs text-amber-600 dark:text-amber-400 tabular-nums">
                              {h.igst > 0 ? Number(h.igst).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                            </TableCell>
                            <TableCell className="text-right text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums pr-6">
                              {Number(h.totalTax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      ) : hasSections ? (
        // ── SECTION-BASED STATUTORY REPORTS (GSTR-3B, etc.) ────
        <div className="space-y-6">
          {reportPayload.sections.map((sec: any, secIdx: number) => {
            const secData = Array.isArray(sec.data) ? sec.data : [];
            const secCols = secData.length > 0 ? Object.keys(secData[0]) : [];

            return (
              <Card key={secIdx} className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 py-3.5 px-6">
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                    {sec.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50 dark:bg-slate-900/80">
                        <TableRow className="hover:bg-transparent">
                          {secCols.map((col, cIdx) => (
                            <TableHead
                              key={col}
                              className={`font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 ${
                                cIdx === 0 ? 'pl-6' : 'text-right'
                              }`}
                            >
                              {col === 'category'
                                ? 'Category'
                                : col === 'taxableValue'
                                ? `Taxable Value (${baseCcy})`
                                : `${col} (${baseCcy})`}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {secData.map((row: any, rIdx: number) => (
                          <TableRow key={rIdx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                            {secCols.map((col, cIdx) => {
                              const val = row[col];
                              const isNum = typeof val === 'number';
                              return (
                                <TableCell
                                  key={col}
                                  className={`text-xs ${
                                    cIdx === 0
                                      ? 'pl-6 font-semibold text-slate-800 dark:text-slate-200'
                                      : 'text-right font-medium tabular-nums'
                                  }`}
                                >
                                  {isNum
                                    ? val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                    : val ?? '—'}
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
            );
          })}
        </div>
      ) : (
        // ── GENERIC FALLBACK FOR SIMPLE REPORTS ────────────────
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 py-3.5 px-6">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
              Report Data
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900/80">
                  <TableRow>
                    {(rateData.length > 0 ? Object.keys(rateData[0]) : []).map((col, cIdx) => (
                      <TableHead
                        key={col}
                        className={`font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 ${
                          cIdx === 0 ? 'pl-6' : 'text-right'
                        }`}
                      >
                        {col === 'totalTaxBaseCcy'
                          ? `Total Tax (${baseCcy})`
                          : col.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rateData.map((row, i) => {
                    const cols = Object.keys(row);
                    return (
                      <TableRow key={i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        {cols.map((col, cIdx) => {
                          const val = row[col];
                          const isNumber = typeof val === 'number';
                          return (
                            <TableCell
                              key={col}
                              className={`text-xs ${
                                cIdx === 0
                                  ? 'pl-6 font-semibold text-slate-800 dark:text-slate-200'
                                  : 'text-right font-medium tabular-nums'
                              }`}
                            >
                              {isNumber && !col.toLowerCase().includes('rate')
                                ? val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                : val}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
