import { toast } from 'sonner';
import React, { useState, useEffect, useMemo } from 'react';
import { BarChart2, FileText, TrendingUp, AlertCircle, DollarSign, Clock, FileSpreadsheet, Filter, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { API_ROOT } from "@/config/api";

const REPORT_TYPES = [
  { key: 'projects', label: 'Projects', icon: BarChart2, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' },
  { key: 'expenses', label: 'Expenses', icon: DollarSign, color: 'bg-red-50 text-red-600 dark:bg-red-900/20' },
  { key: 'billing', label: 'Billing / Invoices', icon: FileText, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' },
  { key: 'timesheets', label: 'Timesheets', icon: Clock, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20' },
  { key: 'issues', label: 'Issues', icon: AlertCircle, color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20' },
  { key: 'profitability', label: 'Profitability', icon: TrendingUp, color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20' },
];

const PIE_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];

function getCookie(name: string) {
  if (typeof document === 'undefined') return '';
  return document.cookie.split('; ').find(r => r.startsWith(name + '='))?.split('=')[1] || '';
}

function KpiCard({ label, value, sub, color }: any) {
  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <h3 className={`text-2xl font-black ${color || 'text-gray-900 dark:text-white'}`}>{value}</h3>
      {sub && <p className="text-xs text-gray-500 mt-1 font-medium">{sub}</p>}
    </div>
  );
}

export function GlobalReportsWorkspace({ businessId }: { businessId: string }) {
  const [activeReport, setActiveReport] = useState('projects');
  const [data, setData] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const { toast } = useToast();

  const getToken = () => getCookie('token') || (typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('accessToken') || '' : '');
  
  const fetchReport = async () => {
    if (!businessId) return;
    try {
      setLoading(true);
      const token = getToken();
      const params = new URLSearchParams({ reportType: activeReport });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (status) params.append('status', status);

      const res = await fetch(`${API_ROOT}/project-operations/reports/summary?${params}`, {
        headers: { Authorization: `Bearer ${token}`, 'x-business-id': businessId }
      });
      const json = await res.json();
      setData(json.data);
      setSummary(json.data?.summary);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchReport(); }, [businessId, activeReport]);

  const handleExport = async (type: 'excel' | 'pdf') => {
    try {
      type === 'excel' ? setIsExportingExcel(true) : setIsExportingPDF(true);
      toast({ title: `Generating ${type.toUpperCase()}...` });
      const token = getToken();
      const params = new URLSearchParams({ reportType: activeReport });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (status) params.append('status', status);
      const url = `${API_ROOT}/project-operations/reports/export/${type}?${params}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, 'x-business-id': businessId } });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(blob);
      a.download = `Report_${activeReport}_${new Date().toISOString().split('T')[0]}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(a.href);
      toast({ title: 'Success', description: `${type.toUpperCase()} downloaded.` });
    } catch (err: any) {
      toast({ title: 'Export Failed', description: err.message, variant: 'destructive' });
    } finally { setIsExportingExcel(false); setIsExportingPDF(false); }
  };

  const chartData = useMemo(() => {
    if (!data) return [];
    if (activeReport === 'projects' && data.projects) {
      return data.projects.slice(0, 10).map((p: any) => ({
        name: p.code || p.name?.slice(0, 12),
        Revenue: p.revenue || 0,
        Cost: p.cost || 0,
        Profit: p.profit || 0,
      }));
    }
    if (activeReport === 'expenses' && data.expenses) {
      const byCategory: Record<string, number> = {};
      data.expenses.forEach((e: any) => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
      return Object.entries(byCategory).map(([name, value]) => ({ name, value }));
    }
    if (activeReport === 'billing' && data.invoices) {
      const byStatus: Record<string, number> = {};
      data.invoices.forEach((i: any) => { byStatus[i.status] = (byStatus[i.status] || 0) + (i.grandTotal || 0); });
      return Object.entries(byStatus).map(([name, value]) => ({ name, value }));
    }
    if (activeReport === 'issues' && data.issues) {
      const byPriority: Record<string, number> = {};
      data.issues.forEach((i: any) => { byPriority[i.priority || 'Unknown'] = (byPriority[i.priority || 'Unknown'] || 0) + 1; });
      return Object.entries(byPriority).map(([name, value]) => ({ name, value }));
    }
    return [];
  }, [data, activeReport]);

  const tableRows = useMemo(() => {
    if (!data) return [];
    if (activeReport === 'projects') return data.projects || [];
    if (activeReport === 'expenses') return data.expenses || [];
    if (activeReport === 'billing') return data.invoices || [];
    if (activeReport === 'timesheets') return data.timeEntries || [];
    if (activeReport === 'issues') return data.issues || [];
    return [];
  }, [data, activeReport]);

  const fmt = (n: number) => `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const isPie = ['expenses', 'billing', 'issues'].includes(activeReport);

  return (
    <div className="flex flex-col h-full bg-gray-50/50 dark:bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex justify-between items-center p-6 pb-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports Engine</h1>
          <p className="text-sm text-gray-500 mt-1">Dynamic cross-module ERP reporting from live data.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('excel')} disabled={isExportingExcel}
            className="flex items-center gap-2 px-4 py-2 border border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors shadow-sm disabled:opacity-50">
            {isExportingExcel ? <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />} Excel
          </button>
          <button onClick={() => handleExport('pdf')} disabled={isExportingPDF}
            className="flex items-center gap-2 px-4 py-2 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors shadow-sm disabled:opacity-50">
            {isExportingPDF ? <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" /> : <FileText className="w-4 h-4" />} PDF
          </button>
        </div>
      </div>

      {/* Report Type Cards */}
      <div className="px-6 pt-4 grid grid-cols-3 sm:grid-cols-6 gap-3">
        {REPORT_TYPES.map(r => {
          const Icon = r.icon;
          return (
            <button key={r.key} onClick={() => setActiveReport(r.key)}
              className={`p-3 rounded-xl border-2 text-center transition-all ${activeReport === r.key ? 'border-blue-500 shadow-md shadow-blue-100 dark:shadow-blue-900/20 scale-105' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-blue-300'}`}>
              <div className={`w-8 h-8 rounded-lg mx-auto mb-1 flex items-center justify-center ${r.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300 leading-tight">{r.label}</p>
            </button>
          );
        })}
      </div>

      {/* Filters Bar */}
      <div className="px-6 pt-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <Filter className="w-3 h-3" /> Filters:
        </div>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
          className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm" />
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
          className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm" />
        <input type="text" value={status} onChange={e => setStatus(e.target.value)} placeholder="Status filter..."
          className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm" />
        <button onClick={fetchReport} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Run
        </button>
      </div>

      {/* KPI Summary */}
      {summary && (
        <div className="px-6 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard label="Total Projects" value={summary.projectCount} />
          <KpiCard label="Open Issues" value={summary.openIssues} color="text-orange-600 dark:text-orange-400" />
          <KpiCard label="Total Expenses" value={fmt(summary.totalExpenses)} color="text-red-600 dark:text-red-400" />
          <KpiCard label="Revenue Collected" value={fmt(summary.collectedRevenue)} color="text-emerald-600 dark:text-emerald-400" />
        </div>
      )}

      {/* Chart + Table */}
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          </div>
        ) : (
          <>
            {/* Chart */}
            {chartData.length > 0 && (
              <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                  {REPORT_TYPES.find(r => r.key === activeReport)?.label} — Visual Overview
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {isPie ? (
                      <PieChart>
                        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {chartData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => typeof v === 'number' && v > 100 ? fmt(v) : v} />
                      </PieChart>
                    ) : (
                      <BarChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(v: number) => `$${v.toLocaleString()}`} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                        <Bar dataKey="Revenue" fill="#3b82f6" radius={[3,3,0,0]} maxBarSize={32} />
                        <Bar dataKey="Cost" fill="#ef4444" radius={[3,3,0,0]} maxBarSize={32} />
                        <Bar dataKey="Profit" fill="#10b981" radius={[3,3,0,0]} maxBarSize={32} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Data Table */}
            {tableRows.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">{tableRows.length} Records</h3>
                </div>
                <div className="overflow-auto max-h-80">
                  <table className="w-full text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 dark:bg-gray-800/80 text-xs uppercase font-bold text-gray-500 sticky top-0 z-10">
                      <tr>
                        {activeReport === 'projects' && ['Project', 'Customer', 'Status', 'Budget', 'Revenue', 'Cost', 'Profit', 'Margin'].map(h => <th key={h} className="px-5 py-3 text-left">{h}</th>)}
                        {activeReport === 'expenses' && ['Title', 'Project', 'Employee', 'Category', 'Amount', 'Status'].map(h => <th key={h} className="px-5 py-3 text-left">{h}</th>)}
                        {activeReport === 'billing' && ['Invoice #', 'Customer', 'Project', 'Amount', 'Status'].map(h => <th key={h} className="px-5 py-3 text-left">{h}</th>)}
                        {activeReport === 'timesheets' && ['Project', 'Employee', 'Task', 'Hours', 'Date'].map(h => <th key={h} className="px-5 py-3 text-left">{h}</th>)}
                        {activeReport === 'issues' && ['Title', 'Project', 'Priority', 'Status', 'Created'].map(h => <th key={h} className="px-5 py-3 text-left">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50 text-gray-600 dark:text-gray-400">
                      {tableRows.slice(0, 50).map((row: any) => (
                        <tr key={row.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                          {activeReport === 'projects' && <>
                            <td className="px-5 py-3 font-bold text-gray-900 dark:text-gray-100">{row.name}</td>
                            <td className="px-5 py-3">{row.customer || '-'}</td>
                            <td className="px-5 py-3">{row.status}</td>
                            <td className="px-5 py-3">{fmt(row.budget)}</td>
                            <td className="px-5 py-3 text-blue-600 font-bold">{fmt(row.revenue)}</td>
                            <td className="px-5 py-3 text-red-600">{fmt(row.cost)}</td>
                            <td className={`px-5 py-3 font-black ${row.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(row.profit)}</td>
                            <td className="px-5 py-3">{row.margin}%</td>
                          </>}
                          {activeReport === 'expenses' && <>
                            <td className="px-5 py-3 font-bold text-gray-900 dark:text-gray-100">{row.title}</td>
                            <td className="px-5 py-3">{row.project?.projectName || '-'}</td>
                            <td className="px-5 py-3">{row.employee?.name || '-'}</td>
                            <td className="px-5 py-3">{row.category}</td>
                            <td className="px-5 py-3 font-bold text-gray-900 dark:text-white">{fmt(row.amount)}</td>
                            <td className="px-5 py-3">{row.status}</td>
                          </>}
                          {activeReport === 'billing' && <>
                            <td className="px-5 py-3 font-bold text-gray-900 dark:text-gray-100">{row.invoiceNumber}</td>
                            <td className="px-5 py-3">{row.customer?.name || '-'}</td>
                            <td className="px-5 py-3">{row.project?.projectName || '-'}</td>
                            <td className="px-5 py-3 font-bold">{fmt(row.grandTotal)}</td>
                            <td className="px-5 py-3">{row.status}</td>
                          </>}
                          {activeReport === 'timesheets' && <>
                            <td className="px-5 py-3">{row.project?.projectName || '-'}</td>
                            <td className="px-5 py-3">{row.employee?.name || '-'}</td>
                            <td className="px-5 py-3">{row.task?.title || '-'}</td>
                            <td className="px-5 py-3 font-bold">{row.hours}h</td>
                            <td className="px-5 py-3">{row.date ? new Date(row.date).toLocaleDateString() : '-'}</td>
                          </>}
                          {activeReport === 'issues' && <>
                            <td className="px-5 py-3 font-bold text-gray-900 dark:text-gray-100">{row.title}</td>
                            <td className="px-5 py-3">{row.project?.projectName || '-'}</td>
                            <td className="px-5 py-3">{row.priority || '-'}</td>
                            <td className="px-5 py-3">{row.status}</td>
                            <td className="px-5 py-3">{new Date(row.createdAt).toLocaleDateString()}</td>
                          </>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tableRows.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                <BarChart2 className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-lg font-medium">No data for this report</p>
                <p className="text-sm">Try adjusting filters or selecting a different report type.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
