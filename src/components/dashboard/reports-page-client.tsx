import { toast } from 'sonner';
import * as React from 'react'
import { 
  BarChart3, 
  CalendarRange, 
  RefreshCw, 
  TrendingUp, 
  Target, 
  Layers, 
  Download,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { useLocation } from 'react-router-dom';

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

import { 
  getProfitLossReport,
  getBalanceSheetReport,
  getCashFlowReport,
  getTrialBalanceReport,
  getGeneralLedgerReport,
  getAccountsReceivableReport,
  getAccountsPayableReport,
  type ProfitLossReport,
  type BalanceSheetReport,
  type CashFlowReport,
  type TrialBalanceReport,
  type GeneralLedgerReport,
  type AccountsReceivableReport,
  type AccountsPayableReport
} from '@/lib/api/reports'

import { KpiCard } from './shared/kpi-card'
import { StatusPill } from './shared/status-pill'
import { TabPills } from './shared/tab-pills'
import { ServerPagination } from '@/components/ui/server-pagination'

function getCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([\^$|?*+()[\]{}])/g, '\\$1') + '=([^;]*)')
  )
  return match ? decodeURIComponent(match[1]) : ''
}

const REPORT_TABS = [
  { value: 'profit-loss', label: 'Profit & Loss' },
  { value: 'balance-sheet', label: 'Balance Sheet' },
  { value: 'cash-flow', label: 'Cash Flow' },
  { value: 'trial-balance', label: 'Trial Balance' },
  { value: 'general-ledger', label: 'General Ledger' },
  { value: 'accounts-receivable', label: 'Accounts Receivable' },
  { value: 'accounts-payable', label: 'Accounts Payable' },
];

export default function ReportsPageClient() {
  const pathname = useLocation().pathname
  const { toast } = useToast()

  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || ''
  const token = React.useMemo(() => getCookie('token') || getCookie('accessToken'), [])

  const [activeTab, setActiveTab] = React.useState('profit-loss')
  
  // States
  const [profitLoss, setProfitLoss] = React.useState<ProfitLossReport | null>(null)
  const [balanceSheet, setBalanceSheet] = React.useState<BalanceSheetReport | null>(null)
  const [cashFlow, setCashFlow] = React.useState<CashFlowReport | null>(null)
  const [trialBalance, setTrialBalance] = React.useState<TrialBalanceReport | null>(null)
  const [generalLedger, setGeneralLedger] = React.useState<GeneralLedgerReport | null>(null)
  const [arReport, setArReport] = React.useState<AccountsReceivableReport | null>(null)
  const [apReport, setApReport] = React.useState<AccountsPayableReport | null>(null)

  // Filters
  const [fromDate, setFromDate] = React.useState('')
  const [toDate, setToDate] = React.useState('')
  const [asOfDate, setAsOfDate] = React.useState('')
  const [page, setPage] = React.useState(1)
  const limit = 25

  const [isLoading, setIsLoading] = React.useState(true)

  const loadData = React.useCallback(async () => {
    if (!token || !businessId) return;
    setIsLoading(true);
    
    try {
      if (activeTab === 'profit-loss') {
        const data = await getProfitLossReport(token, businessId, { fromDate: fromDate || undefined, toDate: toDate || undefined });
        setProfitLoss(data);
      } else if (activeTab === 'balance-sheet') {
        const data = await getBalanceSheetReport(token, businessId, asOfDate || undefined);
        setBalanceSheet(data);
      } else if (activeTab === 'cash-flow') {
        const data = await getCashFlowReport(token, businessId, { fromDate: fromDate || undefined, toDate: toDate || undefined });
        setCashFlow(data);
      } else if (activeTab === 'trial-balance') {
        const data = await getTrialBalanceReport(token, businessId);
        setTrialBalance(data);
      } else if (activeTab === 'general-ledger') {
        const data = await getGeneralLedgerReport(token, businessId, page, limit);
        setGeneralLedger(data);
      } else if (activeTab === 'accounts-receivable') {
        const data = await getAccountsReceivableReport(token, businessId, page, limit);
        setArReport(data);
      } else if (activeTab === 'accounts-payable') {
        const data = await getAccountsPayableReport(token, businessId, page, limit);
        setApReport(data);
      }
    } catch (err) {
      toast({
        title: 'Error loading report',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, token, businessId, fromDate, toDate, asOfDate, page, limit]);

  React.useEffect(() => {
    setPage(1); // Reset page on tab change
  }, [activeTab]);

  React.useEffect(() => {
    loadData();
  }, [loadData, activeTab, page]);

  const currencyValue = React.useCallback((value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0))
  }, [])

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background dark:bg-slate-950 px-4 pb-12 pt-6 sm:px-6 lg:px-8 w-full min-w-0 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card dark:bg-slate-900 p-6 rounded-2xl border border-border dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex min-w-0 items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-xl hidden sm:block">
            <Layers className="h-6 w-6" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-2xl font-bold text-foreground dark:text-slate-100 tracking-tight">Financial Statements</span>
            <span className="text-sm font-medium text-muted-foreground dark:text-slate-400 mt-0.5">Enterprise Accounting Ledger & Reports.</span>
          </div>
        </div>
      </div>

      <div className="mt-2">
        <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setFromDate(''); setToDate(''); setAsOfDate(''); }} className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <TabPills tabs={REPORT_TABS} />
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="bg-white hover:bg-slate-50 border-slate-200 text-rose-600">
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm" className="bg-white hover:bg-slate-50 border-slate-200 text-emerald-600">
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>

          {/* PROFIT & LOSS */}
          <TabsContent value="profit-loss" className="space-y-6 pt-0 outline-none focus:ring-0 m-0">
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Synthetic Ledger Source</AlertTitle>
              <AlertDescription>
                P&L and Balance Sheet still use synthetic aggregation from Invoices/Expenses/Payments, not JournalEntry. They may diverge from Trial Balance for periods with manual journal entries.
              </AlertDescription>
            </Alert>
            <div className="bg-card dark:bg-slate-900 rounded-2xl border border-border dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-5 flex flex-col gap-4 md:flex-row md:items-end">
                <div className="space-y-1.5 flex-1 max-w-[240px]">
                  <label className="text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase tracking-wider">From Date</label>
                  <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-xl border-border" />
                </div>
                <div className="space-y-1.5 flex-1 max-w-[240px]">
                  <label className="text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase tracking-wider">To Date</label>
                  <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-xl border-border" />
                </div>
                <Button onClick={loadData} className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                  <RefreshCw className="h-4 w-4 mr-2" /> Apply
                </Button>
              </div>
            </div>

            {isLoading && !profitLoss ? <p>Loading...</p> : profitLoss && (
              <div className="grid gap-6 md:grid-cols-3">
                <KpiCard title="Income" value={`$${currencyValue(profitLoss.income)}`} icon={TrendingUp} colorClass="border-emerald-500" bgClass="bg-emerald-50" textClass="text-emerald-600" />
                <KpiCard title="Expense" value={`$${currencyValue(profitLoss.expense)}`} icon={TrendingUp} colorClass="border-rose-500" bgClass="bg-rose-50" textClass="text-rose-600" />
                <KpiCard title="Net Profit" value={`${profitLoss.profit >= 0 ? '+' : '-'}$${currencyValue(Math.abs(profitLoss.profit))}`} icon={Target} colorClass={profitLoss.profit >= 0 ? "border-emerald-500" : "border-rose-500"} bgClass={profitLoss.profit >= 0 ? "bg-emerald-50" : "bg-rose-50"} textClass={profitLoss.profit >= 0 ? "text-emerald-600" : "text-rose-600"} />
              </div>
            )}
          </TabsContent>

          {/* BALANCE SHEET */}
          <TabsContent value="balance-sheet" className="space-y-6 pt-0 outline-none focus:ring-0 m-0">
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Synthetic Ledger Source</AlertTitle>
              <AlertDescription>
                P&L and Balance Sheet still use synthetic aggregation from Invoices/Expenses/Payments, not JournalEntry. They may diverge from Trial Balance for periods with manual journal entries.
              </AlertDescription>
            </Alert>
            <div className="bg-card dark:bg-slate-900 rounded-2xl border border-border dark:border-slate-800 shadow-sm overflow-hidden p-5 flex gap-4 items-end">
              <div className="space-y-1.5 flex-1 max-w-[240px]">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">As Of Date</label>
                <Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className="rounded-xl border-border" />
              </div>
              <Button onClick={loadData} className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold">Apply</Button>
            </div>

            {isLoading && !balanceSheet ? <p>Loading...</p> : balanceSheet && (
              <div className="space-y-6">
                {balanceSheet.balances ? (
                  <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Balance Sheet Balances</AlertTitle>
                    <AlertDescription>Internal consistency check passed — not yet backed by posted journal entries.</AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Balance Sheet does not balance!</AlertTitle>
                    <AlertDescription>Total Assets (${currencyValue(balanceSheet.totalAssets)}) does not equal Liabilities + Equity (${currencyValue(balanceSheet.totalLiabilities + balanceSheet.totalEquity)}). Please check ledger data.</AlertDescription>
                  </Alert>
                )}
                <div className="grid gap-6 md:grid-cols-3">
                  <KpiCard title="Total Assets" value={`$${currencyValue(balanceSheet.totalAssets)}`} icon={Layers} colorClass="border-blue-500" bgClass="bg-blue-50" textClass="text-blue-600" />
                  <KpiCard title="Total Liabilities" value={`$${currencyValue(balanceSheet.totalLiabilities)}`} icon={Layers} colorClass="border-amber-500" bgClass="bg-amber-50" textClass="text-amber-600" />
                  <KpiCard title="Total Equity" value={`$${currencyValue(balanceSheet.totalEquity)}`} icon={Layers} colorClass="border-purple-500" bgClass="bg-purple-50" textClass="text-purple-600" />
                </div>
              </div>
            )}
          </TabsContent>

          {/* CASH FLOW */}
          <TabsContent value="cash-flow" className="space-y-6 pt-0 outline-none focus:ring-0 m-0">
            <div className="bg-card dark:bg-slate-900 rounded-2xl border border-border dark:border-slate-800 shadow-sm overflow-hidden p-5 flex gap-4 items-end">
               <div className="space-y-1.5 flex-1 max-w-[240px]">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">From Date</label>
                  <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-xl border-border" />
                </div>
                <div className="space-y-1.5 flex-1 max-w-[240px]">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">To Date</label>
                  <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-xl border-border" />
                </div>
                <Button onClick={loadData} className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold">Apply</Button>
            </div>
            
            {isLoading && !cashFlow ? <p>Loading...</p> : cashFlow && (
              <div className="grid gap-6 md:grid-cols-3">
                <KpiCard title="Opening Balance" value={`$${currencyValue(cashFlow.openingBalance)}`} icon={Layers} colorClass="border-slate-500" bgClass="bg-slate-50" textClass="text-slate-600" />
                <KpiCard title="Net Cash Flow" value={`$${currencyValue(cashFlow.netCashFlow)}`} icon={RefreshCw} colorClass="border-emerald-500" bgClass="bg-emerald-50" textClass="text-emerald-600" />
                <KpiCard title="Closing Balance" value={`$${currencyValue(cashFlow.closingBalance)}`} icon={Layers} colorClass="border-blue-500" bgClass="bg-blue-50" textClass="text-blue-600" />
              </div>
            )}
          </TabsContent>

          {/* TRIAL BALANCE */}
          <TabsContent value="trial-balance" className="space-y-6 pt-0 outline-none focus:ring-0 m-0">
            {isLoading && !trialBalance ? <p>Loading...</p> : trialBalance && (
              <div className="space-y-6">
                {trialBalance.balances ? (
                  <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Ledger Balanced</AlertTitle>
                    <AlertDescription>Internal consistency check passed — not yet backed by posted journal entries.</AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Trial Balance mismatch!</AlertTitle>
                    <AlertDescription>Total Debit (${currencyValue(trialBalance.totalDebit)}) does not equal Total Credit (${currencyValue(trialBalance.totalCredit)}). Please check Journal Entries.</AlertDescription>
                  </Alert>
                )}
                
                <div className="rounded-xl border bg-card overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right text-emerald-600 font-bold">Debit</TableHead>
                        <TableHead className="text-right text-rose-600 font-bold">Credit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trialBalance.accounts.map(acc => (
                        <TableRow key={acc.id}>
                          <TableCell className="font-medium">{acc.name} <span className="text-xs text-muted-foreground ml-2">{acc.code}</span></TableCell>
                          <TableCell>{acc.type}</TableCell>
                          <TableCell className="text-right text-emerald-600">{acc.netDebit > 0 ? `$${currencyValue(acc.netDebit)}` : '-'}</TableCell>
                          <TableCell className="text-right text-rose-600">{acc.netCredit > 0 ? `$${currencyValue(acc.netCredit)}` : '-'}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-slate-50 font-bold border-t-2">
                        <TableCell colSpan={2} className="text-right">Totals:</TableCell>
                        <TableCell className="text-right text-emerald-600">$${currencyValue(trialBalance.totalDebit)}</TableCell>
                        <TableCell className="text-right text-rose-600">$${currencyValue(trialBalance.totalCredit)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* GENERAL LEDGER */}
          <TabsContent value="general-ledger" className="space-y-6 pt-0 outline-none focus:ring-0 m-0">
            {isLoading && !generalLedger ? <p>Loading...</p> : generalLedger && (
               <div className="space-y-6">
                  <div className="rounded-xl border bg-card overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Account</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right text-emerald-600">Debit</TableHead>
                          <TableHead className="text-right text-rose-600">Credit</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {generalLedger.entries.length === 0 ? (
                          <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No journal entries found</TableCell></TableRow>
                        ) : generalLedger.entries.map(entry => (
                          <TableRow key={entry.id}>
                            <TableCell className="whitespace-nowrap">{new Date(entry.date).toLocaleDateString()}</TableCell>
                            <TableCell>{entry.account.name}</TableCell>
                            <TableCell className="text-muted-foreground">{entry.description || '-'}</TableCell>
                            <TableCell className="text-right text-emerald-600">{entry.debit > 0 ? `$${currencyValue(entry.debit)}` : '-'}</TableCell>
                            <TableCell className="text-right text-rose-600">{entry.credit > 0 ? `$${currencyValue(entry.credit)}` : '-'}</TableCell>
                            <TableCell className="text-right font-medium">$${currencyValue(entry.runningBalance)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {generalLedger.pagination.totalPages > 1 && (
                    <ServerPagination page={page} pageSize={generalLedger.pagination.limit} totalCount={generalLedger.pagination.total} onPageChange={setPage} />
                  )}
               </div>
            )}
          </TabsContent>

          {/* ACCOUNTS RECEIVABLE */}
          <TabsContent value="accounts-receivable" className="space-y-6 pt-0 outline-none focus:ring-0 m-0">
             {isLoading && !arReport ? <p>Loading...</p> : arReport && (
                <div className="space-y-6">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    <div className="bg-white border rounded-xl p-3 min-w-[120px] shadow-sm">
                      <div className="text-xs font-semibold text-emerald-600 uppercase">Current</div>
                      <div className="font-bold">${currencyValue(arReport.buckets.current.total)}</div>
                      <div className="text-xs text-muted-foreground">{arReport.buckets.current.count} invoices</div>
                    </div>
                    <div className="bg-white border rounded-xl p-3 min-w-[120px] shadow-sm">
                      <div className="text-xs font-semibold text-amber-600 uppercase">1-30 Days</div>
                      <div className="font-bold">${currencyValue(arReport.buckets.thirty.total)}</div>
                      <div className="text-xs text-muted-foreground">{arReport.buckets.thirty.count} invoices</div>
                    </div>
                    <div className="bg-white border rounded-xl p-3 min-w-[120px] shadow-sm">
                      <div className="text-xs font-semibold text-orange-600 uppercase">31-60 Days</div>
                      <div className="font-bold">${currencyValue(arReport.buckets.sixty.total)}</div>
                      <div className="text-xs text-muted-foreground">{arReport.buckets.sixty.count} invoices</div>
                    </div>
                    <div className="bg-white border rounded-xl p-3 min-w-[120px] shadow-sm">
                      <div className="text-xs font-semibold text-rose-500 uppercase">61-90 Days</div>
                      <div className="font-bold">${currencyValue(arReport.buckets.ninety.total)}</div>
                      <div className="text-xs text-muted-foreground">{arReport.buckets.ninety.count} invoices</div>
                    </div>
                    <div className="bg-white border rounded-xl p-3 min-w-[120px] shadow-sm">
                      <div className="text-xs font-semibold text-rose-700 uppercase">90+ Days</div>
                      <div className="font-bold">${currencyValue(arReport.buckets.older.total)}</div>
                      <div className="text-xs text-muted-foreground">{arReport.buckets.older.count} invoices</div>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-card overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Dates</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Days Overdue</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                         {arReport.invoices.length === 0 ? (
                           <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No pending receivables</TableCell></TableRow>
                         ) : arReport.invoices.map(inv => (
                            <TableRow key={inv.id}>
                              <TableCell className="font-medium">{inv.customerName}</TableCell>
                              <TableCell className="text-muted-foreground">{inv.invoiceNumber}</TableCell>
                              <TableCell>
                                <div className="text-xs text-muted-foreground">{new Date(inv.invoiceDate).toLocaleDateString()}</div>
                                <div className="text-sm font-medium">{new Date(inv.dueDate).toLocaleDateString()}</div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="text-xs text-muted-foreground">${currencyValue(inv.amount)}</div>
                                <div className="font-bold text-rose-600">${currencyValue(inv.balanceDue)}</div>
                              </TableCell>
                              <TableCell className="text-right font-medium text-rose-600">{inv.daysOverdue > 0 ? inv.daysOverdue : '-'}</TableCell>
                              <TableCell className="text-right">
                                 <StatusPill status={inv.status} />
                              </TableCell>
                            </TableRow>
                         ))}
                      </TableBody>
                    </Table>
                  </div>
                  {arReport.pagination.totalPages > 1 && (
                    <ServerPagination page={page} pageSize={arReport.pagination.limit} totalCount={arReport.pagination.total} onPageChange={setPage} />
                  )}
                </div>
             )}
          </TabsContent>

          {/* ACCOUNTS PAYABLE */}
          <TabsContent value="accounts-payable" className="space-y-6 pt-0 outline-none focus:ring-0 m-0">
             {isLoading && !apReport ? <p>Loading...</p> : apReport && (
                <div className="space-y-6">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    <div className="bg-white border rounded-xl p-3 min-w-[120px] shadow-sm">
                      <div className="text-xs font-semibold text-emerald-600 uppercase">Current</div>
                      <div className="font-bold">${currencyValue(apReport.buckets.current.total)}</div>
                      <div className="text-xs text-muted-foreground">{apReport.buckets.current.count} bills</div>
                    </div>
                    <div className="bg-white border rounded-xl p-3 min-w-[120px] shadow-sm">
                      <div className="text-xs font-semibold text-amber-600 uppercase">1-30 Days</div>
                      <div className="font-bold">${currencyValue(apReport.buckets.thirty.total)}</div>
                      <div className="text-xs text-muted-foreground">{apReport.buckets.thirty.count} bills</div>
                    </div>
                    <div className="bg-white border rounded-xl p-3 min-w-[120px] shadow-sm">
                      <div className="text-xs font-semibold text-orange-600 uppercase">31-60 Days</div>
                      <div className="font-bold">${currencyValue(apReport.buckets.sixty.total)}</div>
                      <div className="text-xs text-muted-foreground">{apReport.buckets.sixty.count} bills</div>
                    </div>
                    <div className="bg-white border rounded-xl p-3 min-w-[120px] shadow-sm">
                      <div className="text-xs font-semibold text-rose-500 uppercase">61-90 Days</div>
                      <div className="font-bold">${currencyValue(apReport.buckets.ninety.total)}</div>
                      <div className="text-xs text-muted-foreground">{apReport.buckets.ninety.count} bills</div>
                    </div>
                    <div className="bg-white border rounded-xl p-3 min-w-[120px] shadow-sm">
                      <div className="text-xs font-semibold text-rose-700 uppercase">90+ Days</div>
                      <div className="font-bold">${currencyValue(apReport.buckets.older.total)}</div>
                      <div className="text-xs text-muted-foreground">{apReport.buckets.older.count} bills</div>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-card overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Bill #</TableHead>
                          <TableHead>Dates</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Days Overdue</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                         {apReport.bills.length === 0 ? (
                           <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No pending payables</TableCell></TableRow>
                         ) : apReport.bills.map(bill => (
                            <TableRow key={bill.id}>
                              <TableCell className="font-medium">{bill.vendorName}</TableCell>
                              <TableCell className="text-muted-foreground">{bill.billNumber}</TableCell>
                              <TableCell>
                                <div className="text-xs text-muted-foreground">{new Date(bill.billDate).toLocaleDateString()}</div>
                                <div className="text-sm font-medium">{new Date(bill.dueDate).toLocaleDateString()}</div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="text-xs text-muted-foreground">${currencyValue(bill.amount)}</div>
                                <div className="font-bold text-rose-600">${currencyValue(bill.balanceDue)}</div>
                              </TableCell>
                              <TableCell className="text-right font-medium text-rose-600">{bill.daysOverdue > 0 ? bill.daysOverdue : '-'}</TableCell>
                              <TableCell className="text-right">
                                 <StatusPill status={bill.status} />
                              </TableCell>
                            </TableRow>
                         ))}
                      </TableBody>
                    </Table>
                  </div>
                  {apReport.pagination.totalPages > 1 && (
                    <ServerPagination page={page} pageSize={apReport.pagination.limit} totalCount={apReport.pagination.total} onPageChange={setPage} />
                  )}
                </div>
             )}
          </TabsContent>

        </Tabs>
      </div>
    </div>
  )
}
