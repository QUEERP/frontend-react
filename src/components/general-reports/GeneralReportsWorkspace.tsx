import React, { useState, useEffect } from 'react';
import { API_ROOT } from '@/config/api';
import { FileText, Briefcase, Activity, Landmark, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function getCookie(name: string) {
  if (typeof document === 'undefined') return '';
  return document.cookie.split('; ').find(r => r.startsWith(name + '='))?.split('=')[1] || '';
}

export function GeneralReportsWorkspace({ businessId }: { businessId: string }) {
  const [activeReport, setActiveReport] = useState('balance-sheet');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const { toast } = useToast();

  const REPORT_TABS = [
    { key: 'balance-sheet', label: 'Balance Sheet', icon: Landmark, color: 'bg-indigo-50 text-indigo-600' },
    { key: 'trial-balance', label: 'Trial Balance', icon: Briefcase, color: 'bg-emerald-50 text-emerald-600' },
    { key: 'general-ledger', label: 'General Ledger', icon: FileText, color: 'bg-blue-50 text-blue-600' },
    { key: 'profit-loss', label: 'Profit & Loss', icon: Activity, color: 'bg-orange-50 text-orange-600' }
  ];

  const fetchReport = async () => {
    if (!businessId) return;
    try {
      setLoading(true);
      const token = getCookie('token') || localStorage.getItem('token') || '';
      
      let endpoint = activeReport;
      if (activeReport === 'profit-loss') endpoint = ''; // profit and loss is at /api/reports/

      const res = await fetch(`${API_ROOT}/reports/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}`, 'x-business-id': businessId }
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to fetch report');
      setData(json);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: 'excel' | 'pdf') => {
    try {
      type === 'excel' ? setIsExportingExcel(true) : setIsExportingPDF(true);
      toast({ title: `Generating ${type.toUpperCase()}...` });
      
      const token = getCookie('token') || localStorage.getItem('token') || '';
      const endpoint = activeReport === 'profit-loss' ? 'profit-loss' : activeReport;
      const url = `${API_ROOT}/reports/${endpoint}/export/${type}`;
      
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, 'x-business-id': businessId } });
      if (!res.ok) throw new Error('Export failed');
      
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(blob);
      a.download = `GeneralReport_${activeReport}_${new Date().toISOString().split('T')[0]}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(a.href);
      
      toast({ title: 'Success', description: `${type.toUpperCase()} downloaded successfully.` });
    } catch (err: any) {
      toast({ title: 'Export Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsExportingExcel(false); setIsExportingPDF(false);
    }
  };

  useEffect(() => {
    setData(null);
    fetchReport();
  }, [businessId, activeReport]);

  const fmt = (n: number) => `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      <div className="p-6 pb-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">General Reports</h1>
          <div className="flex gap-2">
            <button onClick={() => handleExport('excel')} disabled={isExportingExcel || loading || !data}
              className="flex items-center gap-2 px-4 py-2 border border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors shadow-sm disabled:opacity-50">
              {isExportingExcel ? <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />} Excel
            </button>
            <button onClick={() => handleExport('pdf')} disabled={isExportingPDF || loading || !data}
              className="flex items-center gap-2 px-4 py-2 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors shadow-sm disabled:opacity-50">
              {isExportingPDF ? <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" /> : <FileText className="w-4 h-4" />} PDF
            </button>
          </div>
        </div>
        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800">
          {REPORT_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeReport === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveReport(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors border-b-2 ${
                  isActive ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${isActive ? tab.color : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                  <Icon className="size-4" />
                </div>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
            {activeReport === 'balance-sheet' && data && (
              <div className="p-6 space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b pb-2">Assets</h3>
                  <table className="w-full text-sm">
                    <tbody>
                      {data.assets?.map((a: any) => (
                        <tr key={a.id} className="border-b last:border-0 dark:border-gray-800">
                          <td className="py-2">{a.name}</td>
                          <td className="py-2 text-right font-medium">{fmt(a.balance)}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 dark:bg-gray-800/50 font-bold">
                        <td className="py-2 px-2">Total Assets</td>
                        <td className="py-2 px-2 text-right text-green-600 dark:text-green-400">{fmt(data.totalAssets)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b pb-2">Liabilities</h3>
                  <table className="w-full text-sm">
                    <tbody>
                      {data.liabilities?.map((l: any) => (
                        <tr key={l.id} className="border-b last:border-0 dark:border-gray-800">
                          <td className="py-2">{l.name}</td>
                          <td className="py-2 text-right font-medium">{fmt(l.balance)}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 dark:bg-gray-800/50 font-bold">
                        <td className="py-2 px-2">Total Liabilities</td>
                        <td className="py-2 px-2 text-right text-red-600 dark:text-red-400">{fmt(data.totalLiabilities)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b pb-2">Equity</h3>
                  <table className="w-full text-sm">
                    <tbody>
                      {data.equities?.map((e: any) => (
                        <tr key={e.id} className="border-b last:border-0 dark:border-gray-800">
                          <td className="py-2">{e.name}</td>
                          <td className="py-2 text-right font-medium">{fmt(e.balance)}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 dark:bg-gray-800/50 font-bold">
                        <td className="py-2 px-2">Total Equity</td>
                        <td className="py-2 px-2 text-right text-blue-600 dark:text-blue-400">{fmt(data.totalEquity)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeReport === 'trial-balance' && data && (
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 font-semibold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Account</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3 text-right">Debit</th>
                    <th className="px-6 py-3 text-right">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {data.accounts?.map((a: any) => (
                    <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-6 py-3 font-medium">{a.name}</td>
                      <td className="px-6 py-3">{a.type}</td>
                      <td className="px-6 py-3 text-right">{a.netDebit > 0 ? fmt(a.netDebit) : '-'}</td>
                      <td className="px-6 py-3 text-right">{a.netCredit > 0 ? fmt(a.netCredit) : '-'}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 dark:bg-gray-800/50 font-bold">
                    <td colSpan={2} className="px-6 py-4 text-right">Total</td>
                    <td className="px-6 py-4 text-right text-blue-600 dark:text-blue-400">{fmt(data.totalDebit)}</td>
                    <td className="px-6 py-4 text-right text-blue-600 dark:text-blue-400">{fmt(data.totalCredit)}</td>
                  </tr>
                </tbody>
              </table>
            )}

            {activeReport === 'general-ledger' && data && (
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 font-semibold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Account</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3 text-right">Debit</th>
                    <th className="px-6 py-3 text-right">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {data.entries?.map((e: any) => (
                    <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-6 py-3">{new Date(e.date).toLocaleDateString()}</td>
                      <td className="px-6 py-3 font-medium">{e.account?.name}</td>
                      <td className="px-6 py-3 text-gray-500">{e.description || '-'}</td>
                      <td className="px-6 py-3 text-right text-red-600 dark:text-red-400">{e.debit > 0 ? fmt(e.debit) : '-'}</td>
                      <td className="px-6 py-3 text-right text-green-600 dark:text-green-400">{e.credit > 0 ? fmt(e.credit) : '-'}</td>
                    </tr>
                  ))}
                  {data.entries?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No journal entries found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeReport === 'profit-loss' && data && (
              <div className="p-8 max-w-2xl mx-auto space-y-6">
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-500 uppercase font-semibold text-xs mb-1">Total Income</h3>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{fmt(data.income)}</p>
                  </div>
                  <div>
                    <h3 className="text-gray-500 uppercase font-semibold text-xs mb-1">Total Expenses</h3>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">{fmt(data.expense)}</p>
                  </div>
                </div>
                <div className={`p-6 rounded-xl border-2 ${data.status === 'PROFIT' ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20'}`}>
                  <h2 className="text-center text-xl font-bold mb-2">Net {data.status === 'PROFIT' ? 'Profit' : 'Loss'}</h2>
                  <p className={`text-center text-5xl font-black ${data.status === 'PROFIT' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{fmt(Math.abs(data.profit))}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
