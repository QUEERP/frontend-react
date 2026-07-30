import { toast } from 'sonner';
import React, { useState, useEffect, useMemo } from 'react';
import { Search, FileSpreadsheet, FileText, TrendingUp, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react';
import { projectOperationsAPI } from '@/lib/api/project-operations';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line
} from 'recharts';
import { API_ROOT } from "@/config/api";

const HEALTH_STYLES: Record<string, string> = {
  Healthy: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/30',
  Warning: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800/30',
  Critical: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800/30',
  Loss: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:border-red-800/30',
};

export function GlobalProfitabilityWorkspace({ businessId }: { businessId: string }) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [healthFilter, setHealthFilter] = useState('');
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const { toast } = useToast();

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 300); return () => clearTimeout(t); }, [search]);

  const fetchData = async () => {
    if (!businessId) return;
    try {
      setLoading(true);
      const res = await projectOperationsAPI.getGlobalProfitability(businessId);
      setProjects(res.projects || []);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [businessId]);

  const filtered = useMemo(() => projects.filter(p => {
    const s = debouncedSearch.toLowerCase();
    const matchSearch = !s || (p.projectName || '').toLowerCase().includes(s) || (p.customer?.name || '').toLowerCase().includes(s);
    const matchHealth = !healthFilter || p.health === healthFilter;
    return matchSearch && matchHealth;
  }), [projects, debouncedSearch, healthFilter]);

  const kpis = useMemo(() => {
    const totalRevenue = filtered.reduce((s, p) => s + (p.revenue || 0), 0);
    const totalCost = filtered.reduce((s, p) => s + (p.cost || 0), 0);
    const totalProfit = totalRevenue - totalCost;
    const avgMargin = filtered.length > 0
      ? filtered.reduce((s, p) => s + (p.margin || 0), 0) / filtered.length
      : 0;
    const best = filtered.reduce((best, p) => (!best || p.profit > best.profit) ? p : best, null as any);
    const worst = filtered.reduce((worst, p) => (!worst || p.profit < worst.profit) ? p : worst, null as any);

    const chartData = [...filtered]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)
      .map(p => ({
        name: p.projectCode || p.projectName?.slice(0, 15),
        Revenue: parseFloat((p.revenue || 0).toFixed(2)),
        Cost: parseFloat((p.cost || 0).toFixed(2)),
        Profit: parseFloat((p.profit || 0).toFixed(2)),
      }));

    return { totalRevenue, totalCost, totalProfit, avgMargin, best, worst, chartData };
  }, [filtered]);

  const handleExport = async (type: 'excel' | 'pdf') => {
    try {
      type === 'excel' ? setIsExportingExcel(true) : setIsExportingPDF(true);
      toast({ title: `Generating ${type.toUpperCase()}...` });
      let token = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1];
      if (!token && typeof window !== 'undefined') token = localStorage.getItem('token') || localStorage.getItem('accessToken') || undefined;
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      const res = await fetch(`${API_ROOT}/project-operations/profitability/export/${type}?${params}`, {
        headers: { Authorization: `Bearer ${token}`, 'x-business-id': businessId },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(blob);
      a.download = `Profitability_${new Date().toISOString().split('T')[0]}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(a.href);
      toast({ title: 'Success', description: `${type.toUpperCase()} downloaded.` });
    } catch (err: any) {
      toast({ title: 'Export Failed', description: err.message, variant: 'destructive' });
    } finally { setIsExportingExcel(false); setIsExportingPDF(false); }
  };

  const fmt = (n: number) => `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading && !projects.length) return (
    <div className="flex flex-col h-full space-y-4 p-6 animate-pulse">
      <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl" />)}</div>
      <div className="h-72 bg-gray-200 dark:bg-gray-800 rounded-xl" />
      <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-xl" />
    </div>
  );

  return (
    <div className="flex flex-col h-full space-y-4 p-6 bg-gray-50/50 dark:bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profitability Analysis</h1>
          <p className="text-sm text-gray-500 mt-1">Live revenue, cost, and margin analysis across all projects.</p>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Revenue</p>
            <DollarSign className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white">{fmt(kpis.totalRevenue)}</h3>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Cost</p>
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white">{fmt(kpis.totalCost)}</h3>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gross Profit</p>
            <TrendingUp className={`w-5 h-5 ${kpis.totalProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
          </div>
          <h3 className={`text-2xl font-black ${kpis.totalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {fmt(kpis.totalProfit)}
          </h3>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Avg Margin</p>
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white">{kpis.avgMargin.toFixed(1)}%</h3>
          {kpis.best && <p className="text-xs text-gray-500 mt-1 font-medium truncate">Best: {kpis.best.projectName}</p>}
        </div>
      </div>

      {/* Chart */}
      {kpis.chartData.length > 0 && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Revenue vs Cost — Top Projects</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kpis.chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Revenue" fill="#3b82f6" radius={[4,4,0,0]} maxBarSize={36} />
                <Bar dataKey="Cost" fill="#ef4444" radius={[4,4,0,0]} maxBarSize={36} />
                <Bar dataKey="Profit" fill="#10b981" radius={[4,4,0,0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden min-h-[300px]">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-wrap gap-3 items-center bg-gray-50/50 dark:bg-gray-900/50">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects or customers..."
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm" />
          </div>
          <select value={healthFilter} onChange={e => setHealthFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm">
            <option value="">All Health</option>
            {['Healthy','Warning','Critical','Loss'].map(h => <option key={h}>{h}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
              <TrendingUp className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-lg font-medium">No profitability data</p>
              <p className="text-sm">Projects with invoices and expenses will appear here.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-800/80 text-xs uppercase font-bold text-gray-500 sticky top-0 z-10">
                <tr>
                  {['Project', 'Customer', 'Revenue', 'Cost', 'Gross Profit', 'Margin %', 'Health'].map(h => (
                    <th key={h} className="px-6 py-3 font-bold tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors text-gray-600 dark:text-gray-400">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-gray-100">{p.projectName}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{p.projectCode}</div>
                    </td>
                    <td className="px-6 py-4">{p.customer?.name || '-'}</td>
                    <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">{fmt(p.revenue)}</td>
                    <td className="px-6 py-4 font-bold text-red-600 dark:text-red-400">{fmt(p.cost)}</td>
                    <td className={`px-6 py-4 font-black ${p.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {fmt(p.profit)}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{p.margin?.toFixed(1)}%</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${HEALTH_STYLES[p.health] || ''}`}>
                        {p.health}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
