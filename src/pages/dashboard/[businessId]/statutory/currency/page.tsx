import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '@/lib/api';
import { useBusinessData } from '@/components/dashboard/business-data-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  Calendar as CalendarIcon,
  Download,
  TrendingUp,
  TrendingDown,
  RefreshCcw,
  Coins,
  Calculator,
  ShoppingCart,
  DollarSign,
  Info,
  CheckCircle2,
  ArrowRight,
  ArrowRightLeft,
  FileText,
  Table as TableIcon,
  FileJson,
  X,
  Globe,
  Scale,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface BillReconciliationItem {
  id: string;
  billNumber: string;
  billDate: string;
  vendorName: string;
  status: string;
  currency: string;
  exchangeRate: number;
  subtotal: number;
  tax: number;
  total: number;
  baseCurrencyAmount: number;
}

export interface ReconciliationSummary {
  count: number;
  totalSubtotalBase: number;
  totalTaxBase: number;
  totalPurchasesVolumeBase: number;
  taxReportSum: number;
  variance: number;
  isReconciled: boolean;
}

interface CurrencyUsageData {
  currency: string;
  currencyId?: string;
  exchangeRate?: number;
  rateDetails?: {
    rate: number;
    effectiveDate?: string | null;
    fetchedAt?: string | Date | null;
    source?: string;
    rateType?: string;
    isStale?: boolean;
    staleWarning?: string | null;
  };
  isTaxInclusive?: boolean;
  summary: {
    sales: number;
    salesBase?: number;
    valueAtLatestRate?: number;
    purchases: number;
    purchasesBase?: number;
    receivables: number;
    receivablesBase?: number;
    payables: number;
    payablesBase?: number;
  };
  realizedFx?: {
    gain: number;
    loss: number;
    net: number;
  };
  unrealizedFx?: {
    gain: number;
    loss: number;
    net: number;
    openReceivables: number;
    openPayables: number;
    revaluationRate?: number;
  };
}

interface CurrencyGainLossData {
  currency: string;
  realizedGain: number;
  realizedLoss: number;
  netGainLoss: number;
}

interface FxTransaction {
  id: string;
  date: string;
  currency: string;
  description: string;
  realizedLoss: number;
  realizedGain: number;
  netGainLoss: number;
  documentNumber?: string;
  paymentNumber?: string;
  bookingRate?: number;
  settlementRate?: number;
  foreignAmount?: number;
  type?: string;
}

interface CurrencyTotals {
  totalSalesBase: number;
  totalPurchasesBase: number;
  totalReceivablesBase: number;
  totalPayablesBase: number;
  netVolumeBase?: number;
  realizedFx?: {
    totalGain: number;
    totalLoss: number;
    netFx: number;
  };
  unrealizedFx?: {
    totalGain: number;
    totalLoss: number;
    netFx: number;
  };
  isTaxInclusive?: boolean;
}

export default function CurrencyReportsPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { business, currency, currencySymbol } = useBusinessData();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [usageData, setUsageData] = useState<CurrencyUsageData[]>([]);
  const [fxData, setFxData] = useState<CurrencyGainLossData[]>([]);
  const [fxTransactions, setFxTransactions] = useState<FxTransaction[]>([]);
  const [backendTotals, setBackendTotals] = useState<CurrencyTotals | null>(null);
  const [exporting, setExporting] = useState(false);

  const [billsReconciliation, setBillsReconciliation] = useState<BillReconciliationItem[]>([]);
  const [reconciliationSummary, setReconciliationSummary] = useState<ReconciliationSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'currencies' | 'reconciliation'>('currencies');

  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  // Modal state for Realized FX Impact Details
  const [selectedCurrencyItem, setSelectedCurrencyItem] = useState<{
    currency: string;
    exchangeRate?: number;
    rateDetails?: any;
    fx: CurrencyGainLossData;
    unrealizedFx?: any;
  } | null>(null);
  const [isFxModalOpen, setIsFxModalOpen] = useState(false);

  // Live Exchange Rate Refresh & Statutory Rates State
  const [refreshingRates, setRefreshingRates] = useState(false);
  const [isStatutoryModalOpen, setIsStatutoryModalOpen] = useState(false);
  const [savingStatutory, setSavingStatutory] = useState(false);
  const [statutoryForm, setStatutoryForm] = useState({
    currencyCode: 'USD',
    rate: '',
    effectiveDate: format(new Date(), 'yyyy-MM-dd'),
    source: 'CBIC Notification No. 12/2026 - Customs'
  });

  // Business currency resolution
  const baseCode = (business as any)?.baseCurrency?.code || business?.currencyCode || business?.currency || currency || 'INR';
  const baseSymbol = (business as any)?.baseCurrency?.symbol || business?.currencySymbol || currencySymbol || (baseCode === 'INR' ? '₹' : baseCode === 'AED' ? 'AED' : '$');
  const baseName = (business as any)?.baseCurrency?.name || (baseCode === 'INR' ? 'Indian Rupee' : baseCode === 'AED' ? 'UAE Dirham' : baseCode);
  const baseLabel = `${baseCode} (${baseSymbol})`;

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
        if (usageRes.data.totals) {
          setBackendTotals(usageRes.data.totals);
        }
        if (usageRes.data.billsReconciliation) {
          setBillsReconciliation(usageRes.data.billsReconciliation);
        }
        if (usageRes.data.billsReconciliationSummary) {
          setReconciliationSummary(usageRes.data.billsReconciliationSummary);
        }
      }

      if (fxRes.data?.success) {
        setFxData(fxRes.data.fxGainLoss || []);
        if (fxRes.data.transactions) {
          setFxTransactions(fxRes.data.transactions);
        }
      }
    } catch (err) {
      console.error('Failed to fetch currency reports', err);
      toast({
        title: 'Error loading data',
        description: 'Could not load currency reports. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) {
      fetchData();
    }
  }, [businessId, dateRange]);

  const handleRecalculateFx = async (currencyCode?: string) => {
    try {
      setRecalculating(true);
      const res = await api.post(`/reports/currency/recalculate-fx?businessId=${businessId}`);
      if (res.data?.success) {
        setFxData(res.data.fxGainLoss || []);
        if (res.data.transactions) {
          setFxTransactions(res.data.transactions);
        }
        // Also refresh usage data to ensure rates and totals align
        await fetchData();

        // Update selected modal item if open
        if (selectedCurrencyItem) {
          const updatedFx = (res.data.fxGainLoss || []).find((f: CurrencyGainLossData) => f.currency === selectedCurrencyItem.currency) || {
            currency: selectedCurrencyItem.currency,
            realizedGain: 0,
            realizedLoss: 0,
            netGainLoss: 0
          };
          setSelectedCurrencyItem({
            ...selectedCurrencyItem,
            fx: updatedFx
          });
        }

        toast({
          title: 'Realized FX Impact Recalculated',
          description: currencyCode
            ? `FX position for ${currencyCode} updated against ${baseLabel}.`
            : `All Realized FX gains & losses re-evaluated against ${baseLabel}.`,
        });
      }
    } catch (err) {
      console.error('Failed to recalculate FX impact', err);
      toast({
        title: 'Recalculation Failed',
        description: 'Unable to recalculate Realized FX impact at this time.',
        variant: 'destructive',
      });
    } finally {
      setRecalculating(false);
    }
  };

  const handleOpenFxModal = (item: any) => {
    setSelectedCurrencyItem(item);
    setIsFxModalOpen(true);
  };

  const handleRefreshRates = async () => {
    try {
      setRefreshingRates(true);
      const res = await api.post(`/currency/refresh-rates?businessId=${businessId}`);
      if (res.data?.success) {
        toast({
          title: 'Rates Refreshed Successfully',
          description: res.data.message || 'Live exchange rates fetched and updated from rate provider.',
        });
        await fetchData();
      }
    } catch (err: any) {
      console.error('Failed to refresh rates', err);
      toast({
        title: 'Refresh Rates Failed',
        description: err.message || 'Failed to fetch live rates from rate provider.',
        variant: 'destructive',
      });
    } finally {
      setRefreshingRates(false);
    }
  };

  const handleSaveStatutoryRate = async (e: React.FormEvent) => {
    e.preventDefault();
    const rateNum = Number(statutoryForm.rate);
    if (!rateNum || rateNum <= 0) {
      toast({
        title: 'Invalid Rate',
        description: 'Please enter a valid statutory exchange rate greater than 0.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSavingStatutory(true);
      const res = await api.post(`/currency/statutory-rate?businessId=${businessId}`, {
        currencyCode: statutoryForm.currencyCode,
        rate: rateNum,
        effectiveDate: statutoryForm.effectiveDate,
        source: statutoryForm.source || 'CBIC-Notified'
      });

      if (res.data?.success) {
        toast({
          title: 'Statutory Rate Saved',
          description: `Successfully recorded ${statutoryForm.currencyCode} statutory rate (${rateNum} ${baseCode}) for period.`,
        });
        setIsStatutoryModalOpen(false);
        setStatutoryForm(prev => ({ ...prev, rate: '' }));
        await fetchData();
      }
    } catch (err: any) {
      console.error('Failed to save statutory rate', err);
      toast({
        title: 'Error Saving Statutory Rate',
        description: err.message || 'Unable to record statutory exchange rate.',
        variant: 'destructive',
      });
    } finally {
      setSavingStatutory(false);
    }
  };

  const handleExport = async (exportFormat: string) => {
    try {
      setExporting(true);
      toast({
        title: "Exporting...",
        description: `Generating currency transactions ${exportFormat.toUpperCase()} export...`,
      });

      let url = `/reports/currency/transactions/export/${exportFormat}?businessId=${businessId}`;
      if (dateRange.from) url += `&fromDate=${dateRange.from.toISOString()}`;
      if (dateRange.to) url += `&toDate=${dateRange.to.toISOString()}`;

      const ext = exportFormat === 'excel' ? 'xlsx' : exportFormat;
      const defaultFilename = `Currency_Transactions_${format(new Date(), 'yyyy-MM-dd')}.${ext}`;
      await api.download(url, defaultFilename);

      toast({
        title: "Export Completed",
        description: `Currency transactions ${exportFormat.toUpperCase()} downloaded successfully.`,
      });
    } catch (err: any) {
      console.error('Export error:', err);
      toast({
        title: "Export Failed",
        description: err.message || `Failed to export as ${exportFormat.toUpperCase()}`,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  // Combine usage and fx data
  const combinedData = usageData.map((usage) => {
    const fxFromApi = fxData.find((f) => f.currency === usage.currency);
    const fx = {
      currency: usage.currency,
      realizedGain: usage.realizedFx?.gain ?? fxFromApi?.realizedGain ?? 0,
      realizedLoss: usage.realizedFx?.loss ?? fxFromApi?.realizedLoss ?? 0,
      netGainLoss: usage.realizedFx?.net ?? fxFromApi?.netGainLoss ?? 0,
    };

    const rate = usage.exchangeRate || 1;
    // Strict invariant: for base currency documents, nominal and base volume MUST strictly be equal
    const salesBase = usage.currency === baseCode ? usage.summary.sales : (usage.summary.salesBase ?? Number((usage.summary.sales * rate).toFixed(2)));
    const purchasesBase = usage.currency === baseCode ? usage.summary.purchases : (usage.summary.purchasesBase ?? Number((usage.summary.purchases * rate).toFixed(2)));

    return {
      ...usage,
      fx,
      exchangeRate: rate,
      computedSalesBase: salesBase,
      computedPurchasesBase: purchasesBase
    };
  });

  // Consolidated Base Currency Totals across all currencies
  const consolidatedSalesBase = backendTotals?.totalSalesBase ?? combinedData.reduce((acc, c) => acc + c.computedSalesBase, 0);
  const consolidatedPurchasesBase = backendTotals?.totalPurchasesBase ?? combinedData.reduce((acc, c) => acc + c.computedPurchasesBase, 0);
  const consolidatedGains = backendTotals?.realizedFx?.totalGain ?? combinedData.reduce((acc, f) => acc + (f.fx.realizedGain || 0), 0);
  const consolidatedLosses = backendTotals?.realizedFx?.totalLoss ?? combinedData.reduce((acc, f) => acc + (f.fx.realizedLoss || 0), 0);
  const consolidatedNetFx = backendTotals?.realizedFx?.netFx ?? (consolidatedGains - consolidatedLosses);
  const consolidatedUnrealizedNet = backendTotals?.unrealizedFx?.netFx ?? combinedData.reduce((acc, c) => acc + (c.unrealizedFx?.net || 0), 0);
  const consolidatedGrossVolume = consolidatedSalesBase + consolidatedPurchasesBase;

  const periodLabel = dateRange.from
    ? (dateRange.to
        ? `${format(dateRange.from, 'dd MMM yyyy')} - ${format(dateRange.to, 'dd MMM yyyy')}`
        : `From ${format(dateRange.from, 'dd MMM yyyy')}`)
    : 'All Time (No date filter)';

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Currency Reports</h2>
            <Badge variant="outline" className="bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-semibold px-2.5 py-1">
              Base: {baseLabel}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Consolidated multi-currency conversion, base currency valuation ({baseLabel}), and Realized FX gain/loss analysis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Real Live Rate Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshRates}
            disabled={refreshingRates}
            className="shadow-sm border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-all font-medium"
            title="Fetch real live exchange rates from rate provider (open.er-api.com)"
          >
            <Globe className={`mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400 ${refreshingRates ? 'animate-spin' : ''}`} />
            {refreshingRates ? 'Fetching Rates...' : 'Refresh Rates'}
          </Button>

          {/* Statutory (CBIC/RBI) Rates Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsStatutoryModalOpen(true)}
            className="shadow-sm border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/60 transition-all font-medium"
            title="Manual entry or import of statutory CBIC-notified/RBI reference rates"
          >
            <Scale className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" />
            Statutory Rates (GST)
          </Button>

          {/* Recalculate FX Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRecalculateFx()}
            disabled={recalculating}
            className="shadow-sm border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-all font-medium"
            title="Recalculate and re-sync all Realized FX gains and losses"
          >
            <RefreshCcw className={`mr-2 h-4 w-4 text-blue-600 dark:text-blue-400 ${recalculating ? 'animate-spin' : ''}`} />
            {recalculating ? 'Recalculating...' : 'Sync FX Impact'}
          </Button>

          {/* Date Range Picker with Clear option */}
          <Popover>
            <PopoverTrigger asChild>
              <div className="relative inline-flex items-center">
                <Button
                  variant="outline"
                  className={`w-[270px] justify-start text-left font-normal shadow-sm transition-all bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/80 ${
                    dateRange.from ? 'border-blue-300 dark:border-blue-700 ring-1 ring-blue-500/20' : ''
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="truncate flex-1">
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                        </>
                      ) : (
                        format(dateRange.from, 'LLL dd, y')
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
                onSelect={(range: any) => setDateRange(range || { from: undefined, to: undefined })}
                numberOfMonths={2}
              />
              {/* Action footer with clear button & presets */}
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
                    onClick={() => {
                      const now = new Date();
                      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                      setDateRange({ from: firstDay, to: lastDay });
                    }}
                    className="h-7 text-xs px-2 text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800"
                  >
                    This Month
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDateRange({ from: undefined, to: undefined })}
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

      {/* CONSOLIDATED TOTALS IN BASE CURRENCY (TOTAL FIELDS CALCULATING RATES WITH BASE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Sales (Base) */}
        <Card className="border-l-4 border-l-blue-600 shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2 pt-4 px-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Sales (Tax-Inclusive)
              </p>
              <div className="p-2 bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-lg">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {baseSymbol} {consolidatedSalesBase.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <span>All currency sales converted to {baseLabel}</span>
            </p>
            <div className="mt-2.5 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-md inline-flex items-center gap-1 border border-slate-200/60 dark:border-slate-700/60">
              <CalendarIcon className="size-3 text-slate-400" />
              <span>Period: <strong className="text-slate-700 dark:text-slate-300 font-medium">{periodLabel}</strong></span>
            </div>
          </CardContent>
        </Card>

        {/* Total Purchases (Base) */}
        <Card className="border-l-4 border-l-amber-500 shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2 pt-4 px-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Purchases (Tax-Inclusive)
              </p>
              <div className="p-2 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded-lg">
                <ShoppingCart className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {baseSymbol} {consolidatedPurchasesBase.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <span>All bills & vendor orders converted to {baseLabel}</span>
            </p>
            <div className="mt-2.5 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-md inline-flex items-center gap-1 border border-slate-200/60 dark:border-slate-700/60">
              <CalendarIcon className="size-3 text-slate-400" />
              <span>Period: <strong className="text-slate-700 dark:text-slate-300 font-medium">{periodLabel}</strong></span>
            </div>
          </CardContent>
        </Card>

        {/* Total Realized FX Position (Base) */}
        <Card className={`border-l-4 ${consolidatedNetFx >= 0 ? 'border-l-emerald-500' : 'border-l-rose-500'} shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800`}>
          <CardHeader className="pb-2 pt-4 px-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Realized FX (Settled)
              </p>
              <div className={`p-2 rounded-lg ${consolidatedNetFx >= 0 ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'}`}>
                <ArrowRightLeft className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className={`text-2xl font-bold ${consolidatedNetFx > 0 ? 'text-emerald-700 dark:text-emerald-400' : consolidatedNetFx < 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
              {consolidatedNetFx >= 0 ? '+' : ''}{baseSymbol} {consolidatedNetFx.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Gains: <span className="font-medium text-emerald-600 dark:text-emerald-400">+{baseSymbol}{consolidatedGains.toFixed(2)}</span> | Losses: <span className="font-medium text-rose-600 dark:text-rose-400">-{baseSymbol}{consolidatedLosses.toFixed(2)}</span>
            </p>
            <div className="mt-2.5 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-md inline-flex items-center gap-1 border border-slate-200/60 dark:border-slate-700/60">
              <CalendarIcon className="size-3 text-slate-400" />
              <span>Period: <strong className="text-slate-700 dark:text-slate-300 font-medium">{periodLabel}</strong></span>
            </div>
          </CardContent>
        </Card>

        {/* Unrealized FX (Open Balances) */}
        <Card className={`border-l-4 ${consolidatedUnrealizedNet >= 0 ? 'border-l-teal-500' : 'border-l-amber-500'} shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800`}>
          <CardHeader className="pb-2 pt-4 px-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Unrealized FX (Open)
              </p>
              <div className={`p-2 rounded-lg ${consolidatedUnrealizedNet >= 0 ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'}`}>
                <Coins className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className={`text-2xl font-bold ${consolidatedUnrealizedNet > 0 ? 'text-teal-700 dark:text-teal-400' : consolidatedUnrealizedNet < 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
              {consolidatedUnrealizedNet >= 0 ? '+' : ''}{baseSymbol} {consolidatedUnrealizedNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Revalued open balances at latest market rate
            </p>
            <div className="mt-2.5 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-md inline-flex items-center gap-1 border border-slate-200/60 dark:border-slate-700/60">
              <CalendarIcon className="size-3 text-slate-400" />
              <span>Period: <strong className="text-slate-700 dark:text-slate-300 font-medium">{periodLabel}</strong></span>
            </div>
          </CardContent>
        </Card>

        {/* Total Gross Volume (Base) */}
        <Card className="border-l-4 border-l-purple-600 shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2 pt-4 px-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Business Volume
              </p>
              <div className="p-2 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded-lg">
                <Calculator className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {baseSymbol} {consolidatedGrossVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Total converted business volume in {baseCode}
            </p>
            <div className="mt-2.5 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-md inline-flex items-center gap-1 border border-slate-200/60 dark:border-slate-700/60">
              <CalendarIcon className="size-3 text-slate-400" />
              <span>Period: <strong className="text-slate-700 dark:text-slate-300 font-medium">{periodLabel}</strong></span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABS: CURRENCIES BREAKDOWN & PURCHASES RECONCILIATION */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-4">
        <TabsList className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <TabsTrigger
            value="currencies"
            className="rounded-lg font-medium text-xs sm:text-sm px-4 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-xs"
          >
            <Coins className="size-4 mr-2 text-blue-600 dark:text-blue-400" />
            Currencies Breakdown ({combinedData.length})
          </TabsTrigger>
          <TabsTrigger
            value="reconciliation"
            className="rounded-lg font-medium text-xs sm:text-sm px-4 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-xs"
          >
            <FileText className="size-4 mr-2 text-amber-600 dark:text-amber-400" />
            Purchases Reconciliation ({billsReconciliation.length} Bills)
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: CURRENCY CARDS GRID */}
        <TabsContent value="currencies" className="space-y-4 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Coins className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Currencies Breakdown & Base Valuation
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {combinedData.length} active currenc{combinedData.length === 1 ? 'y' : 'ies'} detected
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <>
                <Skeleton className="h-[320px] w-full rounded-xl" />
                <Skeleton className="h-[320px] w-full rounded-xl" />
                <Skeleton className="h-[320px] w-full rounded-xl" />
              </>
            ) : combinedData.length === 0 ? (
              <div className="col-span-full">
                <Card className="flex h-[300px] items-center justify-center border-dashed bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                  <div className="text-center">
                    <Coins className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No currency data</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">No multi-currency transactions found for this period.</p>
                  </div>
                </Card>
              </div>
            ) : (
              combinedData.map((item) => {
                const isBase = item.currency === baseCode;
                const rate = item.exchangeRate || 1;

                return (
                  <Card
                    key={item.currency}
                    className={`overflow-hidden shadow-sm transition-all hover:shadow-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-t-4 ${
                      isBase ? 'border-t-emerald-600 ring-1 ring-emerald-500/20' : 'border-t-blue-600'
                    }`}
                  >
                    <CardHeader className="bg-slate-50/70 dark:bg-slate-800/60 pb-3 pt-4 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex items-center justify-center w-11 h-11 rounded-xl font-black text-sm tracking-wide shadow-xs ${
                              isBase
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            }`}
                          >
                            {item.currency}
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                              {item.currency}
                            </CardTitle>
                            {isBase ? (
                              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                                <CheckCircle2 className="size-3" /> Business Currency
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500 dark:text-slate-400">Foreign Currency</span>
                            )}
                          </div>
                        </div>

                        {/* Currency Rate Badge / Base Badge */}
                        {isBase ? (
                          <div className="flex flex-col items-end gap-1">
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-200 uppercase font-semibold text-xs px-2.5 py-1">
                              Base: {baseCode} ({baseSymbol})
                            </Badge>
                            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                              1:1 Invariant Ratio
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs">
                              1 {item.currency} = {rate.toLocaleString(undefined, { maximumFractionDigits: 6 })} {baseCode}
                            </span>
                            <div className="flex flex-wrap items-center justify-end gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                Source: {item.rateDetails?.source || 'API:open.er-api.com'}
                              </span>
                              {item.rateDetails?.fetchedAt ? (
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                  Fetched: {format(new Date(item.rateDetails.fetchedAt), 'dd MMM yyyy HH:mm')}
                                </span>
                              ) : item.rateDetails?.effectiveDate ? (
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                  Eff: {format(new Date(item.rateDetails.effectiveDate), 'dd MMM yyyy')}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="pt-5 space-y-5">
                      {/* VOLUMES WITH CALCULATED BASE CURRENCY TOTAL FIELDS */}
                      <div className="space-y-4">
                        {/* Sales Volume Section */}
                        <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                              Sales Volume (Tax-Inclusive)
                            </span>
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                              In {item.currency}
                            </span>
                          </div>
                          <div className="text-lg font-bold text-slate-900 dark:text-white">
                            {item.summary.sales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {item.currency}
                          </div>

                          {/* Calculated Total in Base Currency Field */}
                          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                              <span>Total in {baseLabel} (Booked):</span>
                              <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                                {baseSymbol} {item.computedSalesBase.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {baseCode}
                              </span>
                            </div>
                            {!isBase && (
                              <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                                <span>Value at latest rate:</span>
                                <span className="text-sm font-bold text-indigo-700 dark:text-indigo-400">
                                  {baseSymbol} {(item.summary.valueAtLatestRate ?? Number((item.summary.sales * rate).toFixed(2))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {baseCode}
                                </span>
                              </div>
                            )}
                            {!isBase && (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 text-right font-mono">
                                Booked snapshot: {item.summary.sales.toLocaleString()} @ historic FX
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Purchases Volume Section */}
                        <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                              Purchases Volume (Tax-Inclusive)
                            </span>
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                              In {item.currency}
                            </span>
                          </div>
                          <div className="text-lg font-bold text-slate-900 dark:text-white">
                            {item.summary.purchases.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {item.currency}
                          </div>

                          {/* Calculated Total in Base Currency Field */}
                          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                              <span>Total in {baseLabel} (Booked):</span>
                              <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                                {baseSymbol} {item.computedPurchasesBase.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {baseCode}
                              </span>
                            </div>
                            {!isBase && (
                              <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                                <span>Value at latest rate:</span>
                                <span className="text-sm font-bold text-orange-700 dark:text-orange-400">
                                  {baseSymbol} {Number((item.summary.purchases * rate).toFixed(2)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {baseCode}
                                </span>
                              </div>
                            )}
                            {!isBase && (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 text-right font-mono">
                                Booked snapshot: {item.summary.purchases.toLocaleString()} @ historic FX
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Period & Stale Warning Footer */}
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-2.5">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="size-3 text-slate-400" />
                          Period: {periodLabel}
                        </span>
                        {item.rateDetails?.isStale && (
                          <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 text-[10px] px-1.5 py-0 font-medium">
                            Rate &gt;30d old
                          </Badge>
                        )}
                      </div>

                      {/* REALIZED & UNREALIZED FX IMPACT SECTIONS FOR FOREIGN CURRENCY */}
                      {!isBase && (
                        <div className="space-y-4 pt-2">
                          {/* 1. REALIZED FX IMPACT (SETTLED TRANSACTIONS) */}
                          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 bg-white dark:bg-slate-900/60 space-y-3 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => handleOpenFxModal(item)}
                                className="group flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                title="Click to view settled FX transactions and recalculate impact"
                              >
                                <div className={`p-1 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all ${recalculating ? 'animate-spin' : ''}`}>
                                  <RefreshCcw className="size-3" />
                                </div>
                                <span className="underline decoration-dotted underline-offset-4 decoration-slate-300 dark:decoration-slate-600 group-hover:decoration-blue-500">
                                  Realized FX Impact (Settled)
                                </span>
                              </button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenFxModal(item)}
                                className="h-6 px-2 text-[11px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 border-blue-200 dark:border-blue-800"
                              >
                                Audit Details
                              </Button>
                            </div>

                            {/* Realized Gains & Losses Grid */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                                <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 mb-0.5 flex items-center gap-1">
                                  <TrendingUp className="size-3" /> Gains ({baseCode})
                                </p>
                                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                                  {baseSymbol} {item.fx.realizedGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                              </div>
                              <div className="bg-rose-50/70 dark:bg-rose-950/30 p-2.5 rounded-lg border border-rose-100 dark:border-rose-900/50">
                                <p className="text-[11px] font-semibold text-rose-800 dark:text-rose-300 mb-0.5 flex items-center gap-1">
                                  <TrendingDown className="size-3" /> Losses ({baseCode})
                                </p>
                                <p className="text-sm font-bold text-rose-900 dark:text-rose-100">
                                  {baseSymbol} {item.fx.realizedLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                              </div>
                            </div>

                            {/* Net Realized FX Position */}
                            <div className="pt-1 flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-600 dark:text-slate-300">Net Realized FX:</span>
                              <span
                                className={`font-bold text-xs ${
                                  item.fx.netGainLoss > 0
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : item.fx.netGainLoss < 0
                                    ? 'text-rose-700 dark:text-rose-400'
                                    : 'text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {item.fx.netGainLoss > 0 ? '+' : ''}
                                {baseSymbol} {item.fx.netGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {baseCode}
                              </span>
                            </div>
                          </div>

                          {/* 2. UNREALIZED FX IMPACT (OPEN BALANCES) */}
                          <div className="border border-amber-200/80 dark:border-amber-900/40 rounded-xl p-3.5 bg-amber-50/30 dark:bg-amber-950/20 space-y-2.5 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200">
                                <Coins className="size-3.5 text-amber-600 dark:text-amber-400" />
                                <span>Unrealized FX (Open Balances)</span>
                              </div>
                              <span className="text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded font-medium border border-amber-200 dark:border-amber-800">
                                Revalued @ {rate} {baseCode}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-amber-100 dark:border-amber-900/40">
                              <div>
                                <span className="text-slate-500 dark:text-slate-400 block">Open Receivables:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-100">
                                  {(item.unrealizedFx?.openReceivables || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {item.currency}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 dark:text-slate-400 block">Open Payables:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-100">
                                  {(item.unrealizedFx?.openPayables || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {item.currency}
                                </span>
                              </div>
                            </div>

                            <div className="pt-1 flex items-center justify-between text-xs">
                              <span className="font-semibold text-amber-900 dark:text-amber-300">Net Unrealized FX ({baseCode}):</span>
                              <span
                                className={`font-bold text-xs ${
                                  (item.unrealizedFx?.net || 0) > 0
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : (item.unrealizedFx?.net || 0) < 0
                                    ? 'text-rose-700 dark:text-rose-400'
                                    : 'text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {(item.unrealizedFx?.net || 0) > 0 ? '+' : ''}
                                {baseSymbol} {(item.unrealizedFx?.net || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {baseCode}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* TAB 2: PURCHASES RECONCILIATION */}
        <TabsContent value="reconciliation" className="space-y-4 pt-1">
          {/* Statutory Reconciliation Summary Card */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/70 dark:bg-slate-800/60 pb-3 pt-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="size-5 text-amber-600 dark:text-amber-400" />
                    Purchases Reconciliation: Currency Report vs Tax Report ({baseLabel})
                  </CardTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Itemized audit verifying that Tax-Inclusive Purchases Volume strictly matches the sum of Taxable Value and Input Tax Credit recorded in statutory tax reports.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                  {reconciliationSummary?.isReconciled ? (
                    <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 px-3 py-1 text-xs font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5" />
                      Reconciled (0.00 Variance)
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="px-3 py-1 text-xs font-semibold">
                      Variance Detected
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs text-slate-600 dark:text-slate-300">
                    Period: {periodLabel}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {/* Reconciliation KPI Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Total Bills</span>
                  <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {reconciliationSummary?.count || billsReconciliation.length}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Taxable Base (Subtotal)</span>
                  <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {baseSymbol} {(reconciliationSummary?.totalSubtotalBase || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Input Tax Base (ITC)</span>
                  <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {baseSymbol} {(reconciliationSummary?.totalTaxBase || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-amber-50/80 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800/60">
                  <span className="text-[11px] text-amber-800 dark:text-amber-300 uppercase font-semibold">Tax Report Purchases</span>
                  <div className="text-lg font-bold text-amber-900 dark:text-amber-100 mt-0.5">
                    {baseSymbol} {(reconciliationSummary?.taxReportSum || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400">Taxable + Tax</span>
                </div>

                <div className="bg-blue-50/80 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200 dark:border-blue-800/60">
                  <span className="text-[11px] text-blue-800 dark:text-blue-300 uppercase font-semibold">Currency Purchases Vol</span>
                  <div className="text-lg font-bold text-blue-900 dark:text-blue-100 mt-0.5">
                    {baseSymbol} {(reconciliationSummary?.totalPurchasesVolumeBase || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-blue-700 dark:text-blue-400">Tax-Inclusive Base</span>
                </div>

                <div className={`p-3 rounded-xl border ${
                  (reconciliationSummary?.variance || 0) === 0
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-100'
                    : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-100'
                }`}>
                  <span className="text-[11px] uppercase font-semibold opacity-80">Variance</span>
                  <div className="text-lg font-bold mt-0.5">
                    {baseSymbol} {(reconciliationSummary?.variance || 0).toFixed(2)}
                  </div>
                  <span className="text-[10px] font-medium">
                    {(reconciliationSummary?.variance || 0) === 0 ? '✓ Balanced' : 'Check Entries'}
                  </span>
                </div>
              </div>

              {/* Itemized Bills Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3">Bill Number</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Vendor</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Currency & Rate</th>
                        <th className="p-3 text-right">Subtotal</th>
                        <th className="p-3 text-right">Tax</th>
                        <th className="p-3 text-right">Total (Txn Ccy)</th>
                        <th className="p-3 text-right">Base Amount ({baseCode})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {billsReconciliation.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-500 dark:text-slate-400">
                            No posted bills found for this period.
                          </td>
                        </tr>
                      ) : (
                        billsReconciliation.map((bill) => (
                          <tr key={bill.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="p-3 font-semibold text-slate-900 dark:text-white font-mono">
                              {bill.billNumber}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {bill.billDate ? format(new Date(bill.billDate), 'dd MMM yyyy') : '-'}
                            </td>
                            <td className="p-3 text-slate-800 dark:text-slate-200 font-medium">
                              {bill.vendorName}
                            </td>
                            <td className="p-3">
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-semibold uppercase ${
                                  bill.status === 'PAID'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                                    : bill.status === 'PARTIALLY_PAID' || bill.status === 'PARTIAL_PAID'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300'
                                }`}
                              >
                                {bill.status}
                              </Badge>
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400 font-mono">
                              {bill.currency} {bill.currency !== baseCode ? `@ ${bill.exchangeRate}` : '(1:1)'}
                            </td>
                            <td className="p-3 text-right text-slate-700 dark:text-slate-300 font-mono">
                              {bill.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-right text-slate-700 dark:text-slate-300 font-mono">
                              {bill.tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-right font-medium text-slate-900 dark:text-white font-mono">
                              {bill.currency} {bill.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-right font-bold text-amber-700 dark:text-amber-400 font-mono">
                              {baseSymbol} {bill.baseCurrencyAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t border-slate-200 dark:border-slate-700">
                      <tr>
                        <td colSpan={5} className="p-3 text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                          Grand Total ({billsReconciliation.length} Bills)
                        </td>
                        <td className="p-3 text-right font-mono text-slate-900 dark:text-white">
                          {baseSymbol} {(reconciliationSummary?.totalSubtotalBase || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-900 dark:text-white">
                          {baseSymbol} {(reconciliationSummary?.totalTaxBase || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                          (Txn Sum)
                        </td>
                        <td className="p-3 text-right font-mono text-amber-700 dark:text-amber-400 text-sm">
                          {baseSymbol} {(reconciliationSummary?.totalPurchasesVolumeBase || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* REALIZED FX IMPACT MODAL DIALOG */}
      <Dialog open={isFxModalOpen} onOpenChange={setIsFxModalOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
              <RefreshCcw className="size-5 text-blue-600 dark:text-blue-400" />
              Realized FX Impact Details: {selectedCurrencyItem?.currency} / {baseCode}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
              Foreign exchange realized gain/loss calculated against the business currency ({baseLabel}).
            </DialogDescription>
          </DialogHeader>

          {selectedCurrencyItem && (
            <div className="space-y-5 py-2">
              {/* Rate & Formula Info Banner */}
              <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Current Rate</p>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    1 {selectedCurrencyItem.currency} = {selectedCurrencyItem.exchangeRate} {baseCode} ({baseSymbol})
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Source: {selectedCurrencyItem.rateDetails?.source || 'Commercial Bank / Market Rate'}
                    {selectedCurrencyItem.rateDetails?.effectiveDate ? ` • Eff: ${format(new Date(selectedCurrencyItem.rateDetails.effectiveDate), 'dd MMM yyyy')}` : ''}
                  </p>
                </div>
                <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 self-start sm:self-center font-semibold">
                  Base: {baseName}
                </Badge>
              </div>

              {/* Exact Formula Explanations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50/70 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="space-y-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <TrendingUp className="size-3 text-emerald-600 dark:text-emerald-400" /> Receivable (Invoice Payment):
                  </span>
                  <p className="font-mono text-[11px] text-slate-600 dark:text-slate-200 bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-200 dark:border-slate-700">
                    (Settlement Rate - Booking Rate) × Foreign Settled
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Paid at higher rate = Gain; lower rate = Loss</p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <TrendingDown className="size-3 text-rose-600 dark:text-rose-400" /> Payable (Bill Payment - Reverse Sign):
                  </span>
                  <p className="font-mono text-[11px] text-slate-600 dark:text-slate-200 bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-200 dark:border-slate-700">
                    (Booking Rate - Settlement Rate) × Foreign Settled
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Paid at higher rate = Loss; lower rate = Gain</p>
                </div>
              </div>

              {/* 3 Metric Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/50 text-center">
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-1">
                    <TrendingUp className="size-3" /> Realized Gains
                  </p>
                  <p className="text-lg font-bold text-emerald-900 dark:text-emerald-100 mt-1">
                    {baseSymbol} {selectedCurrencyItem.fx.realizedGain.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">{baseCode}</p>
                </div>

                <div className="bg-rose-50 dark:bg-rose-950/30 p-3.5 rounded-xl border border-rose-100 dark:border-rose-900/50 text-center">
                  <p className="text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-center justify-center gap-1">
                    <TrendingDown className="size-3" /> Realized Losses
                  </p>
                  <p className="text-lg font-bold text-rose-900 dark:text-rose-100 mt-1">
                    {baseSymbol} {selectedCurrencyItem.fx.realizedLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">{baseCode}</p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/50 text-center">
                  <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">Net Realized FX</p>
                  <p
                    className={`text-lg font-bold mt-1 ${
                      selectedCurrencyItem.fx.netGainLoss > 0
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : selectedCurrencyItem.fx.netGainLoss < 0
                        ? 'text-rose-700 dark:text-rose-400'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {selectedCurrencyItem.fx.netGainLoss > 0 ? '+' : ''}
                    {baseSymbol} {selectedCurrencyItem.fx.netGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">{baseCode}</p>
                </div>
              </div>

              {/* Open Balances & Unrealized FX Card */}
              {selectedCurrencyItem.unrealizedFx && (
                <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/50 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-900 dark:text-amber-200">
                    <span className="flex items-center gap-1.5">
                      <Coins className="size-3.5 text-amber-600 dark:text-amber-400" />
                      Unrealized FX (Open Balances Revalued at Latest Rate)
                    </span>
                    <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800 text-[10px]">
                      Latest: {selectedCurrencyItem.exchangeRate} {baseCode}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Open Receivables:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {(selectedCurrencyItem.unrealizedFx.openReceivables || 0).toLocaleString()} {selectedCurrencyItem.currency}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Open Payables:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {(selectedCurrencyItem.unrealizedFx.openPayables || 0).toLocaleString()} {selectedCurrencyItem.currency}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Net Unrealized FX:</span>
                      <span className={`font-bold ${selectedCurrencyItem.unrealizedFx.net > 0 ? 'text-emerald-700 dark:text-emerald-400' : selectedCurrencyItem.unrealizedFx.net < 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                        {selectedCurrencyItem.unrealizedFx.net > 0 ? '+' : ''}{baseSymbol} {(selectedCurrencyItem.unrealizedFx.net || 0).toFixed(2)} {baseCode}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* FX Transactions Table or Info Note */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Settled FX Audit Log</h4>

                {fxTransactions.filter((t) => t.currency === selectedCurrencyItem.currency).length > 0 ? (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-[220px] overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 sticky top-0">
                        <tr>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Description</th>
                          <th className="p-2.5 text-right">Gain ({baseCode})</th>
                          <th className="p-2.5 text-right">Loss ({baseCode})</th>
                          <th className="p-2.5 text-right">Net</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {fxTransactions
                          .filter((t) => t.currency === selectedCurrencyItem.currency)
                          .map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                              <td className="p-2.5 text-slate-600 dark:text-slate-400">{format(new Date(t.date), 'MMM dd, yyyy')}</td>
                              <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">{t.description}</td>
                              <td className="p-2.5 text-right font-medium text-emerald-600 dark:text-emerald-400">
                                {t.realizedGain > 0 ? `${baseSymbol}${t.realizedGain.toFixed(2)}` : '-'}
                              </td>
                              <td className="p-2.5 text-right font-medium text-rose-600 dark:text-rose-400">
                                {t.realizedLoss > 0 ? `${baseSymbol}${t.realizedLoss.toFixed(2)}` : '-'}
                              </td>
                              <td
                                className={`p-2.5 text-right font-bold ${
                                  t.netGainLoss > 0 ? 'text-emerald-600 dark:text-emerald-400' : t.netGainLoss < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {t.netGainLoss > 0 ? '+' : ''}
                                {baseSymbol}
                                {t.netGainLoss.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                    <div className="flex items-start gap-2">
                      <Info className="size-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">Settlement Status for {selectedCurrencyItem.currency}</p>
                        <p className="mt-1 text-slate-500 dark:text-slate-400 leading-relaxed">
                          No settlements/payments have been posted for <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedCurrencyItem.currency}</span> documents in this period. Realized FX remains strictly <span className="font-semibold text-slate-700 dark:text-slate-200">{baseSymbol}0.00</span> until settlements occur.
                        </p>
                        <p className="mt-2 text-slate-500 dark:text-slate-400 font-mono text-[11px] bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                          Unsettled invoices/bills are continuously tracked above under Unrealized FX (Open Balances), revalued at the latest rate ({selectedCurrencyItem.exchangeRate} {baseCode}).
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between sm:justify-between w-full pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleRecalculateFx(selectedCurrencyItem?.currency)}
              disabled={recalculating}
              className="border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/60"
            >
              <RefreshCcw className={`mr-2 h-4 w-4 text-blue-600 dark:text-blue-400 ${recalculating ? 'animate-spin' : ''}`} />
              {recalculating ? 'Recalculating...' : 'Recalculate FX Impact'}
            </Button>
            <Button type="button" onClick={() => setIsFxModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* STATUTORY (CBIC / RBI) EXCHANGE RATE ENTRY DIALOG */}
      <Dialog open={isStatutoryModalOpen} onOpenChange={setIsStatutoryModalOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                  Record Statutory Rate (CBIC / RBI)
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Official customs rate for export taxable valuation. Kept strictly isolated from market API rates.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSaveStatutoryRate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Currency Code *
              </Label>
              <Input
                type="text"
                placeholder="e.g. USD, CAD, AED, EUR"
                className="h-9 uppercase font-mono"
                value={statutoryForm.currencyCode}
                onChange={e => setStatutoryForm(prev => ({ ...prev, currencyCode: e.target.value.toUpperCase() }))}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Statutory Exchange Rate (1 Unit in {baseCode}) *
              </Label>
              <Input
                type="number"
                step="0.0001"
                min="0.0001"
                placeholder="e.g. 84.15"
                className="h-9 font-mono"
                value={statutoryForm.rate}
                onChange={e => setStatutoryForm(prev => ({ ...prev, rate: e.target.value }))}
                required
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                CBIC notified rate for Customs Act / RBI reference rate for statutory GST period.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Effective Date *
              </Label>
              <Input
                type="date"
                className="h-9"
                value={statutoryForm.effectiveDate}
                onChange={e => setStatutoryForm(prev => ({ ...prev, effectiveDate: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                CBIC Notification / Source *
              </Label>
              <Input
                type="text"
                placeholder="e.g. CBIC Notification No. 12/2026 - Customs"
                className="h-9"
                value={statutoryForm.source}
                onChange={e => setStatutoryForm(prev => ({ ...prev, source: e.target.value }))}
                required
              />
            </div>

            <div className="rounded-lg bg-purple-50/70 dark:bg-purple-950/30 p-2.5 border border-purple-200 dark:border-purple-900/60 text-[11px] text-purple-900 dark:text-purple-200">
              💡 <strong>Compliance Note:</strong> This statutory rate is never overwritten by live commercial API sync jobs, ensuring complete audit compliance with CBIC tax requirements.
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsStatutoryModalOpen(false)}
                disabled={savingStatutory}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={savingStatutory}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium"
              >
                {savingStatutory ? 'Recording...' : 'Save Statutory Rate'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
