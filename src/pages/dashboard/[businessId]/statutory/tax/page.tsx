import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import { useBusinessData } from '@/components/dashboard/business-data-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import {
  Calendar as CalendarIcon,
  Download,
  Loader2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  Table as TableIcon,
  FileJson,
  TrendingUp,
  ReceiptText,
  Wallet,
  CheckCircle2,
  ExternalLink,
  Info,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { formatTaxCurrency, getGstPeriodPresets, getIndianFinancialYear } from '@/lib/taxUtils';

interface TaxLine {
  id: string;
  category: string;
  transactionType: string;
  documentId: string;
  documentNumber: string;
  documentDate: string;
  partyName: string;
  transactionCurrency: string;
  taxType: string;
  taxRate: number;
  taxableAmountTxnCcy: number;
  taxableAmountBaseCcy: number;
  totalTaxTxnCcy: number;
  totalTaxBaseCcy: number;
  isInvalidRate?: boolean;
  placeOfSupply?: string | boolean;
}

interface DataQualityWarning {
  code: string;
  documentNumber?: string;
  message: string;
  taxType?: string;
  recordedRate?: number;
}

interface TaxReportKpis {
  outputTax: number;
  inputTax: number;
  netPayable: number;
  netItcCarryForward: number;
  netItcReceivable: number;
  taxableSales: number;
  taxablePurchases: number;
}

export default function TaxReportsPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { business } = useBusinessData();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [summaryLines, setSummaryLines] = useState<TaxLine[]>([]);
  const [warnings, setWarnings] = useState<DataQualityWarning[]>([]);
  const [kpis, setKpis] = useState<TaxReportKpis | null>(null);
  const [activePreset, setActivePreset] = useState<string>('this-fy');

  // Default to current Indian Financial Year
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>(() => {
    const fy = getIndianFinancialYear();
    return { from: fy.from, to: fy.to };
  });

  const baseCcy = (business as any)?.baseCurrency?.code || business?.currency || 'INR';

  const fetchTaxSummary = async () => {
    try {
      setLoading(true);
      let url = `/reports/tax/summary?businessId=${businessId}`;
      if (dateRange.from) {
        url += `&fromDate=${dateRange.from.toISOString()}`;
      }
      if (dateRange.to) {
        url += `&toDate=${dateRange.to.toISOString()}`;
      }

      const res = await api.get(url);
      if (res.data?.success) {
        setSummaryLines(res.data.summary || []);
        setWarnings(res.data.dataQualityWarnings || []);
        setKpis(res.data.kpis || null);
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

  const handlePresetSelect = (presetId: string) => {
    setActivePreset(presetId);
    if (presetId === 'all') {
      setDateRange({ from: undefined, to: undefined });
      return;
    }
    const presets = getGstPeriodPresets();
    const found = presets.find(p => p.id === presetId);
    if (found) {
      const range = found.getRange();
      setDateRange({ from: range.from, to: range.to });
    }
  };

  const handleExport = async (exportFormat: string) => {
    try {
      setExporting(true);
      toast({
        title: "Exporting...",
        description: `Generating GST tax summary ${exportFormat.toUpperCase()} export...`,
      });

      let url = `/reports/tax/summary/export/${exportFormat}?businessId=${businessId}`;
      if (dateRange.from) url += `&fromDate=${dateRange.from.toISOString()}`;
      if (dateRange.to) url += `&toDate=${dateRange.to.toISOString()}`;

      const ext = exportFormat === 'excel' ? 'xlsx' : exportFormat;
      const defaultFilename = `Tax_Summary_${format(new Date(), 'yyyy-MM-dd')}.${ext}`;
      await api.download(url, defaultFilename);

      toast({
        title: "Export Completed",
        description: `Tax summary ${exportFormat.toUpperCase()} downloaded successfully.`,
      });
    } catch (err: any) {
      console.error('Tax summary export error:', err);
      toast({
        title: "Export Failed",
        description: err.message || `Failed to export as ${exportFormat.toUpperCase()}`,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  // Grouped summary lines by statutory category
  const groupedData = useMemo(() => {
    const outputLines: TaxLine[] = [];
    const inputLines: TaxLine[] = [];
    const reverseLines: TaxLine[] = [];
    const unclassifiedLines: TaxLine[] = [];

    summaryLines.forEach(line => {
      const cat = (line.category || '').toLowerCase();
      if (cat.includes('output') || cat.includes('sales')) {
        outputLines.push(line);
      } else if (cat.includes('input') || cat.includes('purchases')) {
        inputLines.push(line);
      } else if (cat.includes('reverse')) {
        reverseLines.push(line);
      } else {
        unclassifiedLines.push(line);
      }
    });

    const calcSubtotal = (lines: TaxLine[]) => {
      // Sum taxable values once per unique document
      const docTaxableMap = new Map<string, number>();
      let totalTax = 0;
      lines.forEach(l => {
        if (!docTaxableMap.has(l.documentId)) {
          docTaxableMap.set(l.documentId, l.taxableAmountBaseCcy);
        }
        totalTax += (l.totalTaxBaseCcy || 0);
      });
      let taxableTotal = 0;
      docTaxableMap.forEach(v => { taxableTotal += v; });
      return { taxableTotal, totalTax };
    };

    return {
      output: { lines: outputLines, ...calcSubtotal(outputLines) },
      input: { lines: inputLines, ...calcSubtotal(inputLines) },
      reverse: { lines: reverseLines, ...calcSubtotal(reverseLines) },
      unclassified: { lines: unclassifiedLines, ...calcSubtotal(unclassifiedLines) },
    };
  }, [summaryLines]);

  const activePeriodLabel = useMemo(() => {
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
              Tax Summary & Statutory GST Report
            </h1>
            <Badge variant="outline" className="border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold px-2.5 py-0.5">
              ERP-Grade
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
            <span>Period:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              {activePeriodLabel}
            </span>
            <span>• Base Currency: <strong className="text-slate-900 dark:text-white">{baseCcy}</strong></span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Presets */}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-2xs">
            {getGstPeriodPresets().map(preset => (
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
            <Button
              variant={activePreset === 'all' ? 'default' : 'ghost'}
              size="sm"
              className={`h-8 px-2.5 text-xs font-semibold transition-all ${
                activePreset === 'all'
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              onClick={() => handlePresetSelect('all')}
            >
              All
            </Button>
          </div>

          {/* Date Picker Popover with Clear option */}
          <Popover>
            <PopoverTrigger asChild>
              <div className="relative inline-flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-9 justify-start text-left font-normal shadow-xs transition-all bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/80 ${
                    dateRange.from ? 'border-blue-300 dark:border-blue-700 ring-1 ring-blue-500/20' : ''
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="truncate">
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'dd MMM yyyy')} – {format(dateRange.to, 'dd MMM yyyy')}
                        </>
                      ) : (
                        format(dateRange.from, 'dd MMM yyyy')
                      )
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400">All dates (No filter)</span>
                    )}
                  </span>
                  {dateRange.from && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setActivePreset('all');
                        setDateRange({ from: undefined, to: undefined });
                      }}
                      className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      title="Clear selected dates"
                    >
                      <X className="h-3.5 w-3.5" />
                    </span>
                  )}
                </Button>
              </div>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl overflow-hidden"
              align="end"
            >
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from || new Date()}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range: any) => {
                  setActivePreset('custom');
                  setDateRange(range || { from: undefined, to: undefined });
                }}
                numberOfMonths={2}
              />
              {/* Action footer */}
              <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {dateRange.from ? (
                    dateRange.to ? (
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                        Selected: <strong className="text-slate-900 dark:text-white font-semibold">{format(dateRange.from, 'dd MMM yyyy')} – {format(dateRange.to, 'dd MMM yyyy')}</strong>
                      </span>
                    ) : (
                      <span>From: <strong className="text-slate-900 dark:text-white font-semibold">{format(dateRange.from, 'dd MMM yyyy')}</strong> (Pick end date)</span>
                    )
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400 italic">No date filter active (All time)</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePresetSelect('this-month')}
                    className="h-7 text-xs px-2 text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800"
                  >
                    This Month
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActivePreset('all');
                      setDateRange({ from: undefined, to: undefined });
                    }}
                    disabled={!dateRange.from && !dateRange.to}
                    className="h-7 text-xs px-2.5 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-40"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={exporting}
                className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Download className={`mr-2 h-4 w-4 ${exporting ? 'animate-bounce text-blue-600' : ''}`} />
                {exporting ? 'Exporting...' : 'Export'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
              <DropdownMenuItem onClick={() => handleExport('pdf')} className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                <FileText className="mr-2 h-4 w-4 text-red-500" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')} className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                <TableIcon className="mr-2 h-4 w-4 text-emerald-600" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')} className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                <FileJson className="mr-2 h-4 w-4 text-blue-600" />
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Data Quality Warning Banner ────────────────────────── */}
      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-300/80 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-amber-200/60 dark:bg-amber-900/50 p-1.5 text-amber-900 dark:text-amber-200 mt-0.5">
              <AlertTriangle className="h-5 w-5 text-amber-800 dark:text-amber-300" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-semibold text-amber-950 dark:text-amber-100 flex items-center gap-2">
                Data Quality & Statutory Audit Notices ({warnings.length})
              </h4>
              <ul className="text-xs text-amber-900/90 dark:text-amber-200/90 space-y-1 list-disc pl-4">
                {warnings.map((w, idx) => (
                  <li key={idx} className="leading-relaxed">
                    <strong className="text-amber-950 dark:text-amber-100">[{w.code}]</strong> {w.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Executive KPI Cards ────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Output Tax */}
        <Card className="border-l-4 border-l-emerald-600 shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Output Tax (Sales)
            </CardTitle>
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-28 bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ) : (
              <>
                <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                  {formatTaxCurrency(kpis?.outputTax, baseCcy)}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Tax collected on posted sales</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Input Tax Credit */}
        <Card className="border-l-4 border-l-blue-600 shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Input Tax Credit (ITC)
            </CardTitle>
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-28 bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ) : (
              <>
                <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                  {formatTaxCurrency(kpis?.inputTax, baseCcy)}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Eligible credit on purchases</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Net Tax Position / Net ITC Carry Forward */}
        <Card className={`border-l-4 ${kpis && (kpis.netPayable < 0 || kpis.netItcCarryForward > 0) ? 'border-l-teal-500' : kpis && kpis.netPayable > 0 ? 'border-l-rose-500' : 'border-l-slate-400'} shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {kpis && kpis.netPayable < 0 ? 'Net ITC Carry Forward' : 'Net Payable'}
            </CardTitle>
            <div className="p-1 rounded bg-slate-100 dark:bg-slate-800 shadow-2xs">
              <Badge variant={kpis && kpis.netPayable < 0 ? 'default' : kpis && kpis.netPayable > 0 ? 'destructive' : 'secondary'} className="text-[10px] px-1.5 py-0">
                {kpis && kpis.netPayable < 0 ? 'ITC Refundable' : kpis && kpis.netPayable > 0 ? 'Liability' : 'Balanced'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-28 bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ) : (
              <>
                <div className={`text-2xl font-bold tracking-tight font-mono ${kpis && kpis.netPayable < 0 ? 'text-teal-600 dark:text-teal-400' : kpis && kpis.netPayable > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                  {formatTaxCurrency(kpis?.netPayable && kpis.netPayable < 0 ? kpis.netItcCarryForward : kpis?.netPayable, baseCcy)}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {kpis && kpis.netPayable < 0 ? 'Credit available against future sales' : 'Net liability due for tax filing'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Taxable Sales Turnover */}
        <Card className="border-l-4 border-l-violet-600 shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Taxable Sales
            </CardTitle>
            <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-28 bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ) : (
              <>
                <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                  {formatTaxCurrency(kpis?.taxableSales, baseCcy)}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Tax-bearing sales base (deduplicated)</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Taxable Purchases Turnover */}
        <Card className="border-l-4 border-l-cyan-600 shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Taxable Purchases
            </CardTitle>
            <div className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-28 bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ) : (
              <>
                <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                  {formatTaxCurrency(kpis?.taxablePurchases, baseCcy)}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Tax-bearing bills base (deduplicated)</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Tax Report Detailed Breakdown ───────────────────────── */}
      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-[220px] w-full rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <Skeleton className="h-[220px] w-full rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
        ) : summaryLines.length === 0 ? (
          <Card className="flex h-[320px] flex-col items-center justify-center border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <ReceiptText className="h-10 w-10 text-slate-400 dark:text-slate-500 mb-2" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-white">No Tax Documents Found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm text-center mt-1">
              No posted invoices, bills, or credit notes with tax were recorded during the selected period.
            </p>
          </Card>
        ) : (
          <>
            {/* Section 1: Output Tax (Sales) */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 py-3.5 px-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                      Output Tax (Sales Invoices & Reversals)
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs font-medium dark:bg-slate-800 dark:text-slate-300">
                      {groupedData.output.lines.length} lines
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      Taxable Turnover: <strong className="text-slate-900 dark:text-white font-mono">{formatTaxCurrency(groupedData.output.taxableTotal, baseCcy)}</strong>
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-100/60 dark:bg-emerald-950/60 px-2.5 py-1 rounded">
                      Output Tax: <span className="font-mono">{formatTaxCurrency(groupedData.output.totalTax, baseCcy)}</span>
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50 dark:bg-slate-800/40">
                    <TableRow className="border-b border-slate-200 dark:border-slate-800 text-xs">
                      <TableHead className="w-[140px] font-semibold text-slate-600 dark:text-slate-400">Doc #</TableHead>
                      <TableHead className="w-[100px] font-semibold text-slate-600 dark:text-slate-400">Date</TableHead>
                      <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Customer (Buyer)</TableHead>
                      <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Place of Supply</TableHead>
                      <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Tax Type</TableHead>
                      <TableHead className="text-right font-semibold text-slate-600 dark:text-slate-400">Rate (%)</TableHead>
                      <TableHead className="text-right font-semibold text-slate-600 dark:text-slate-400">Taxable Value ({baseCcy})</TableHead>
                      <TableHead className="text-right font-semibold text-slate-600 dark:text-slate-400">Tax Amount ({baseCcy})</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedData.output.lines.map((line) => {
                      const linkTarget = line.transactionType === 'INVOICE'
                        ? `/dashboard/${businessId}/invoices/${line.documentId}`
                        : `/dashboard/${businessId}/sales/credit-notes/${line.documentId}`;

                      return (
                        <TableRow key={line.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors text-xs font-normal border-b border-slate-100 dark:border-slate-800/60">
                          <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                            <Link to={linkTarget} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 hover:underline flex items-center gap-1">
                              {line.documentNumber}
                              <ExternalLink className="h-3 w-3 opacity-60" />
                            </Link>
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">
                            {line.documentDate ? format(new Date(line.documentDate), 'dd MMM yyyy') : '—'}
                          </TableCell>
                          <TableCell className="text-slate-800 dark:text-slate-200 font-medium">
                            {line.partyName}
                          </TableCell>
                          <TableCell>
                            {line.placeOfSupply === true ? (
                              <Badge variant="outline" className="text-[10px] bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800">
                                Inter-State (IGST)
                              </Badge>
                            ) : line.placeOfSupply === false ? (
                              <Badge variant="outline" className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                                Intra-State (CGST+SGST)
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800">
                                Undetermined POS
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-semibold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700">
                              {line.taxType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium text-slate-800 dark:text-slate-200">
                            {line.isInvalidRate ? (
                              <span className="text-amber-700 dark:text-amber-300 font-bold bg-amber-100/80 dark:bg-amber-950/80 px-1.5 py-0.5 rounded">
                                {line.taxRate}% ⚠
                              </span>
                            ) : (
                              `${line.taxRate}%`
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-slate-700 dark:text-slate-300">
                            {formatTaxCurrency(line.taxableAmountBaseCcy, baseCcy)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatTaxCurrency(line.totalTaxBaseCcy, baseCcy)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter className="bg-slate-50/90 dark:bg-slate-800/70 font-semibold text-xs border-t border-slate-200 dark:border-slate-800">
                    <TableRow>
                      <TableCell colSpan={6} className="text-right text-slate-600 dark:text-slate-400">
                        Subtotal Output Tax (Sales):
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-900 dark:text-white">
                        {formatTaxCurrency(groupedData.output.taxableTotal, baseCcy)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatTaxCurrency(groupedData.output.totalTax, baseCcy)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </CardContent>
            </Card>

            {/* Section 2: Input Tax Credit (Purchases) */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 py-3.5 px-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                      Input Tax Credit (Vendor Bills & Expenses)
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs font-medium dark:bg-slate-800 dark:text-slate-300">
                      {groupedData.input.lines.length} lines
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      Taxable Turnover: <strong className="text-slate-900 dark:text-white font-mono">{formatTaxCurrency(groupedData.input.taxableTotal, baseCcy)}</strong>
                    </span>
                    <span className="text-blue-700 dark:text-blue-300 font-bold bg-blue-100/60 dark:bg-blue-950/60 px-2.5 py-1 rounded">
                      Total ITC: <span className="font-mono">{formatTaxCurrency(groupedData.input.totalTax, baseCcy)}</span>
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50 dark:bg-slate-800/40">
                    <TableRow className="border-b border-slate-200 dark:border-slate-800 text-xs">
                      <TableHead className="w-[140px] font-semibold text-slate-600 dark:text-slate-400">Bill #</TableHead>
                      <TableHead className="w-[100px] font-semibold text-slate-600 dark:text-slate-400">Date</TableHead>
                      <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Vendor (Supplier)</TableHead>
                      <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Classification</TableHead>
                      <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Tax Type</TableHead>
                      <TableHead className="text-right font-semibold text-slate-600 dark:text-slate-400">Rate (%)</TableHead>
                      <TableHead className="text-right font-semibold text-slate-600 dark:text-slate-400">Taxable Value ({baseCcy})</TableHead>
                      <TableHead className="text-right font-semibold text-slate-600 dark:text-slate-400">ITC Claimed ({baseCcy})</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedData.input.lines.map((line) => {
                      const linkTarget = `/dashboard/${businessId}/bills/${line.documentId}`;

                      return (
                        <TableRow key={line.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors text-xs font-normal border-b border-slate-100 dark:border-slate-800/60">
                          <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                            <Link to={linkTarget} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 hover:underline flex items-center gap-1">
                              {line.documentNumber}
                              <ExternalLink className="h-3 w-3 opacity-60" />
                            </Link>
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">
                            {line.documentDate ? format(new Date(line.documentDate), 'dd MMM yyyy') : '—'}
                          </TableCell>
                          <TableCell className="text-slate-800 dark:text-slate-200 font-medium">
                            {line.partyName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                              Input Goods / Services
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-semibold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700">
                              {line.taxType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium text-slate-800 dark:text-slate-200">
                            {line.isInvalidRate ? (
                              <span className="text-amber-700 dark:text-amber-300 font-bold bg-amber-100/80 dark:bg-amber-950/80 px-1.5 py-0.5 rounded">
                                {line.taxRate}% ⚠
                              </span>
                            ) : (
                              `${line.taxRate}%`
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-slate-700 dark:text-slate-300">
                            {formatTaxCurrency(line.taxableAmountBaseCcy, baseCcy)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatTaxCurrency(line.totalTaxBaseCcy, baseCcy)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter className="bg-slate-50/90 dark:bg-slate-800/70 font-semibold text-xs border-t border-slate-200 dark:border-slate-800">
                    <TableRow>
                      <TableCell colSpan={6} className="text-right text-slate-600 dark:text-slate-400">
                        Subtotal Input Tax Credit (ITC):
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-900 dark:text-white">
                        {formatTaxCurrency(groupedData.input.taxableTotal, baseCcy)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                        {formatTaxCurrency(groupedData.input.totalTax, baseCcy)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </CardContent>
            </Card>

            {/* Section 3: Unclassified Lines (If Any Encountered) */}
            {groupedData.unclassified.lines.length > 0 && (
              <Card className="border-amber-300 dark:border-amber-900/60 shadow-xs overflow-hidden bg-white dark:bg-slate-900">
                <CardHeader className="border-b border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/40 py-3.5 px-6">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                    <AlertTriangle className="h-4 w-4" />
                    <CardTitle className="text-sm font-bold text-amber-950 dark:text-amber-100">Unclassified Tax Lines</CardTitle>
                    <Badge variant="outline" className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800 text-xs">
                      {groupedData.unclassified.lines.length} lines
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50/50 dark:bg-slate-800/40">
                      <TableRow className="border-b border-slate-200 dark:border-slate-800 text-xs">
                        <TableHead className="text-slate-600 dark:text-slate-400">Doc #</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Party</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Tax Type</TableHead>
                        <TableHead className="text-right text-slate-600 dark:text-slate-400">Rate (%)</TableHead>
                        <TableHead className="text-right text-slate-600 dark:text-slate-400">Taxable Amount</TableHead>
                        <TableHead className="text-right text-slate-600 dark:text-slate-400">Tax Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedData.unclassified.lines.map((l) => (
                        <TableRow key={l.id} className="text-xs text-slate-900 dark:text-slate-100 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/60">
                          <TableCell className="font-medium text-slate-900 dark:text-slate-100">{l.documentNumber}</TableCell>
                          <TableCell className="text-slate-800 dark:text-slate-200">{l.partyName}</TableCell>
                          <TableCell className="text-slate-800 dark:text-slate-200">{l.taxType}</TableCell>
                          <TableCell className="text-right font-mono text-slate-800 dark:text-slate-200">{l.taxRate}%</TableCell>
                          <TableCell className="text-right font-mono text-slate-700 dark:text-slate-300">{formatTaxCurrency(l.taxableAmountBaseCcy, baseCcy)}</TableCell>
                          <TableCell className="text-right font-mono font-bold text-slate-900 dark:text-white">{formatTaxCurrency(l.totalTaxBaseCcy, baseCcy)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* ── Statutory Grand Total Summary Panel ────────────── */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    Statutory Filing Summary
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Computed in integer paise for precision. Output Tax minus ITC credit equals net position.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">Total Output Tax:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {formatTaxCurrency(kpis?.outputTax, baseCcy)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">Total Input Credit:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {formatTaxCurrency(kpis?.inputTax, baseCcy)}
                    </span>
                  </div>
                  <div className="border-l pl-4 border-slate-200 dark:border-slate-800">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">
                      {kpis && kpis.netPayable < 0 ? 'Net ITC Carry Forward:' : 'Net Tax Payable:'}
                    </span>
                    <span className={`font-mono text-lg font-extrabold ${kpis && kpis.netPayable < 0 ? 'text-teal-600 dark:text-teal-400' : kpis && kpis.netPayable > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                      {formatTaxCurrency(kpis?.netPayable && kpis.netPayable < 0 ? kpis.netItcCarryForward : kpis?.netPayable, baseCcy)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
