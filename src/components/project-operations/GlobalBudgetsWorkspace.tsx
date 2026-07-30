import { toast } from 'sonner';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, DollarSign, Target, TrendingDown, TrendingUp, X, CheckCircle, 
  AlertCircle, FileSpreadsheet, FileText, Activity, Layout, Layers, Calendar, ChevronRight, Calculator, BarChart2
} from 'lucide-react';
import { projectOperationsAPI } from '@/lib/api/project-operations';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { API_ROOT } from "@/config/api";

export function GlobalBudgetsWorkspace({ businessId }: { businessId: string }) {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<any>({});
  
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showReallocateModal, setShowReallocateModal] = useState(false);
  const [reallocateData, setReallocateData] = useState({
    fromProjectId: '',
    toProjectId: '',
    amount: '',
    reason: '',
    remarks: '',
    effectiveDate: new Date().toISOString().split('T')[0]
  });
  const [isReallocating, setIsReallocating] = useState(false);
  
  const [showCharts, setShowCharts] = useState(false);
  
  const [activeTab, setActiveTab] = useState('Overview');
  const detailTabs = ['Overview', 'Budget Breakdown', 'Expenses', 'Purchase Orders', 'Invoices', 'Billing', 'Forecast', 'Variance Analysis', 'Attachments', 'Activity Log'];
  
  const { toast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchData = async () => {
    if (!businessId) return;
    try {
      setLoading(true);
      const res = await projectOperationsAPI.getGlobalBudgets(businessId);
      if (res.success || res.budgets) {
        setBudgets(res.budgets || []);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to load budgets", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [businessId]);

  const handleBackendExport = async (type: 'excel' | 'pdf') => {
    try {
      if (type === 'excel') setIsExportingExcel(true);
      else setIsExportingPDF(true);

      toast({ title: `Generating ${type.toUpperCase()}`, description: "Please wait..." });
      
      let token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      if (!token) token = document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1];
      if (!token && typeof window !== 'undefined') {
        token = localStorage.getItem('token') || localStorage.getItem('accessToken') || undefined;
      }
      
                        
      const queryParams = new URLSearchParams();
      if (debouncedSearch) queryParams.append('search', debouncedSearch);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.department) queryParams.append('department', filters.department);

      const url = `${API_ROOT}/project-operations/budgets/export/${type}?${queryParams.toString()}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'x-business-id': businessId }
      });

      if (!res.ok) throw new Error(`Export failed with status ${res.status}`);

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Budget_Report_${new Date().toISOString().split('T')[0]}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      toast({ title: "Success", description: `${type.toUpperCase()} downloaded successfully.` });
    } catch (err: any) {
      toast({ title: "Export Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsExportingExcel(false);
      setIsExportingPDF(false);
    }
  };

  const handleReallocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reallocateData.fromProjectId || !reallocateData.toProjectId || !reallocateData.amount) {
      toast({ title: "Error", description: "Source, Target, and amount are required", variant: "destructive" });
      return;
    }
    if (reallocateData.fromProjectId === reallocateData.toProjectId) {
      toast({ title: "Error", description: "Source and Target projects cannot be the same", variant: "destructive" });
      return;
    }
    
    // Validate amount
    const fromProj = budgets.find(b => b.id === reallocateData.fromProjectId);
    if (fromProj && parseFloat(reallocateData.amount) > (fromProj.remainingBudget || 0)) {
      toast({ title: "Validation Error", description: "Transfer amount exceeds available remaining budget of the source project.", variant: "destructive" });
      return;
    }

    try {
      setIsReallocating(true);
      await projectOperationsAPI.reallocateBudget(businessId, {
        fromProjectId: reallocateData.fromProjectId,
        toProjectId: reallocateData.toProjectId,
        amount: parseFloat(reallocateData.amount),
        reason: reallocateData.reason,
        effectiveDate: reallocateData.effectiveDate,
        remarks: reallocateData.remarks
      });
      toast({ title: "Success", description: "Budget reallocated successfully." });
      setShowReallocateModal(false);
      setReallocateData({ fromProjectId: '', toProjectId: '', amount: '', reason: '', remarks: '', effectiveDate: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsReallocating(false);
    }
  };

  const filteredData = useMemo(() => {
    return budgets.filter(b => {
      let m = true;
      const s = debouncedSearch.toLowerCase();
      if (s) {
        m = m && (
          (b.project?.projectName || '').toLowerCase().includes(s) ||
          (b.project?.projectCode || b.budgetCode || '').toLowerCase().includes(s) ||
          (b.customer?.name || '').toLowerCase().includes(s) ||
          (b.projectManager?.name || '').toLowerCase().includes(s)
        );
      }
      if (filters.status && b.budgetStatus !== filters.status) m = false;
      return m;
    });
  }, [budgets, debouncedSearch, filters]);

  const kpis = useMemo(() => {
    const total = filteredData.reduce((sum, b) => sum + (b.approvedBudget || 0), 0);
    const actual = filteredData.reduce((sum, b) => sum + (b.actualCost || 0), 0);
    const committed = filteredData.reduce((sum, b) => sum + (b.committedCost || 0), 0);
    const utilized = actual + committed;
    const remaining = filteredData.reduce((sum, b) => sum + (b.remainingBudget || 0), 0);
    const overBudget = filteredData.filter(b => b.budgetStatus === 'OVER_BUDGET' || b.budgetStatus === 'AT_RISK').length;
    const underBudget = filteredData.filter(b => b.budgetStatus === 'ON_TRACK').length;
    
    const topSpending = [...filteredData].sort((a,b) => ((b.actualCost||0)+(b.committedCost||0)) - ((a.actualCost||0)+(a.committedCost||0))).slice(0, 5);
    const chartData = topSpending.map(p => ({
      name: p.project?.projectCode || p.project?.projectName || p.budgetCode,
      Budget: p.approvedBudget || 0,
      Utilized: (p.actualCost || 0) + (p.committedCost || 0),
    }));

    return { total, actual, committed, utilized, remaining, overBudget, underBudget, chartData };
  }, [filteredData]);

  if (loading && budgets.length === 0) {
    return (
      <div className="flex flex-col h-full space-y-4 p-6 bg-gray-50/50 dark:bg-[#0a0a0a] animate-pulse">
        <div className="flex justify-between items-center mb-4">
          <div className="w-48 h-8 bg-gray-200 dark:bg-gray-800 rounded"></div>
          <div className="w-32 h-8 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>)}
        </div>
        <div className="h-[400px] bg-gray-200 dark:bg-gray-800 rounded-xl mt-6"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4 p-6 bg-gray-50/50 dark:bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
             Budget Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track portfolio budgets, expenses, and project financial health.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => handleBackendExport('excel')}
            disabled={isExportingExcel || loading}
            className="flex items-center gap-2 px-4 py-2 border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors shadow-sm disabled:opacity-50"
          >
            {isExportingExcel ? <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div> : <FileSpreadsheet className="w-4 h-4" />}
            Excel
          </button>
          <button 
            onClick={() => handleBackendExport('pdf')}
            disabled={isExportingPDF || loading}
            className="flex items-center gap-2 px-4 py-2 border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors shadow-sm disabled:opacity-50"
          >
            {isExportingPDF ? <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div> : <FileText className="w-4 h-4" />}
            PDF
          </button>
          <button 
            onClick={() => setShowReallocateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Calculator className="w-4 h-4" /> Reallocate Budget
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Portfolio Budget</p>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white">${kpis.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Approved Budget</p>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white">${kpis.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Actual Cost</p>
          <h3 className="text-2xl font-black text-red-600 dark:text-red-400">${kpis.actual.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Committed Cost</p>
          <h3 className="text-2xl font-black text-orange-600 dark:text-orange-400">${kpis.committed.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Remaining Budget</p>
          <h3 className="text-2xl font-black text-green-600 dark:text-green-400">${kpis.remaining.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Budget Utilization %</p>
          <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400">{kpis.total > 0 ? ((kpis.utilized / kpis.total) * 100).toFixed(1) : 0}%</h3>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Over Budget Projects</p>
          <h3 className="text-2xl font-black text-red-600 dark:text-red-400">{kpis.overBudget}</h3>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Under Budget Projects</p>
          <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{kpis.underBudget}</h3>
        </div>
      </div>

      {showCharts && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Top Spending Projects (Budget vs Actual)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kpis.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value >= 1000 ? (value/1000) + 'k' : value}`} />
                <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => `$${value.toLocaleString()}`} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Budget" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Utilized" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Workspace Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden min-h-[400px]">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-wrap gap-4 items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex gap-4 items-center flex-1">
            <div className="relative w-80 max-w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects or codes..."
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <select 
                value={filters.status || ''} 
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm"
              >
                <option value="">All Statuses</option>
                <option value="ON_TRACK">On Track</option>
                <option value="AT_RISK">At Risk</option>
                <option value="OVER_BUDGET">Over Budget</option>
              </select>
              <button 
                onClick={() => setShowCharts(!showCharts)}
                className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors shadow-sm ${showCharts ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800/30 dark:text-indigo-400' : 'bg-white border-gray-200 text-gray-700 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300'}`}
              >
                <BarChart2 className="w-4 h-4" /> {showCharts ? 'Hide Analytics' : 'Show Analytics'}
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
              <Calculator className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-lg font-medium">No budgets found</p>
              <p className="text-sm">Try adjusting your filters or search term.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-800/80 text-xs uppercase font-bold text-gray-500 dark:text-gray-400 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 font-bold tracking-wider">Budget Code</th>
                  <th className="px-6 py-3 font-bold tracking-wider">Project</th>
                  <th className="px-6 py-3 font-bold tracking-wider">Customer / Dept</th>
                  <th className="px-6 py-3 font-bold tracking-wider">Project Manager</th>
                  <th className="px-6 py-3 font-bold tracking-wider text-right">Approved Budget</th>
                  <th className="px-6 py-3 font-bold tracking-wider text-right">Actual Cost</th>
                  <th className="px-6 py-3 font-bold tracking-wider text-right">Committed Cost</th>
                  <th className="px-6 py-3 font-bold tracking-wider text-right">Remaining Budget</th>
                  <th className="px-6 py-3 font-bold tracking-wider text-right">Variance</th>
                  <th className="px-6 py-3 font-bold tracking-wider">Status</th>
                  <th className="px-6 py-3 font-bold tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                {filteredData.map((b) => (
                  <tr key={b.id} onClick={() => setSelectedProject(b)} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 cursor-pointer transition-colors whitespace-nowrap">
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-gray-100">{b.budgetCode}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-gray-100">{b.project?.projectName}</div>
                      <div className="text-xs text-gray-500 mt-0.5 font-medium">{b.project?.projectCode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800 dark:text-gray-300">{b.customer?.name || '-'}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{b.department || '-'}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-300">{b.projectManager?.name || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-gray-900 dark:text-white">${(b.approvedBudget || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-medium text-red-600 dark:text-red-400">${(b.actualCost || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-medium text-orange-600 dark:text-orange-400">${(b.committedCost || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-green-600 dark:text-green-400">${(b.remainingBudget || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${b.variance < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {b.variance < 0 ? '-' : '+'}${(Math.abs(b.variance) || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border inline-block text-center ${
                          b.budgetStatus === 'OVER_BUDGET' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:border-red-800/30' :
                          b.budgetStatus === 'AT_RISK' ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800/30' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/30'
                        }`}>
                          {b.budgetStatus.replace('_', ' ')}
                        </span>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${b.utilizationPercent > 100 ? 'bg-red-500' : b.utilizationPercent > 80 ? 'bg-orange-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${Math.min(b.utilizationPercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={(e) => { e.stopPropagation(); setSelectedProject(b); }} className="text-blue-600 hover:text-blue-800 text-sm font-bold">Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Project Details Panel */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-all">
          <div className="w-[600px] max-w-full bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col border-l border-gray-200 dark:border-gray-800 animate-in slide-in-from-right">
            
            {/* Panel Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedProject.project?.projectName || selectedProject.budgetCode}</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedProject.project?.projectCode || selectedProject.budgetCode} • Budget Details</p>
              </div>
              <button 
                onClick={() => setSelectedProject(null)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto scrollbar-hide">
                {detailTabs.map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === 'Overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Approved Budget</p>
                      <p className="text-2xl font-black text-gray-900 dark:text-white">${(selectedProject.approvedBudget || 0).toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Utilized</p>
                      <p className="text-2xl font-black text-gray-900 dark:text-white">${((selectedProject.actualCost || 0) + (selectedProject.committedCost || 0)).toLocaleString()}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Cost Breakdown</h3>
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        <div className="flex justify-between p-3 text-sm">
                          <span className="text-gray-600 dark:text-gray-400 font-medium">Logged Expenses</span>
                          <span className="font-bold text-gray-900 dark:text-white">${selectedProject.actualCost?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex justify-between p-3 text-sm">
                          <span className="text-gray-600 dark:text-gray-400 font-medium">Purchase Orders</span>
                          <span className="font-bold text-gray-900 dark:text-white">${selectedProject.committedCost?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex justify-between p-4 bg-gray-50 dark:bg-gray-800/50 text-sm font-bold border-t-2 border-gray-200 dark:border-gray-700">
                          <span className="text-gray-900 dark:text-white">Total Utilized</span>
                          <span className="text-gray-900 dark:text-white">${((selectedProject.actualCost || 0) + (selectedProject.committedCost || 0)).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Activity Log' && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Audit Log (Reallocations)</h3>
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                    {(!selectedProject.budgetHistories || selectedProject.budgetHistories.length === 0) ? (
                      <div className="p-4 text-sm text-gray-500 text-center">No reallocation history.</div>
                    ) : (
                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {selectedProject.budgetHistories.map((log: any) => (
                          <div key={log.id} className="p-4 text-sm">
                            <div className="flex justify-between mb-1">
                              <span className="font-bold text-gray-900 dark:text-white">
                                {log.difference > 0 ? 'Added' : 'Removed'} ${Math.abs(log.difference).toLocaleString()}
                              </span>
                              <span className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mt-1 text-xs">
                              <span className="font-medium text-gray-700 dark:text-gray-300">Reason:</span> {log.reason || 'N/A'}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 mt-1 text-xs">
                              <span className="font-medium text-gray-700 dark:text-gray-300">Remarks:</span> {log.remarks || 'N/A'}
                            </p>
                            <div className="mt-2 text-xs text-gray-500 font-medium">
                              Old: ${log.oldBudget.toLocaleString()} → New: ${log.newBudget.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab !== 'Overview' && activeTab !== 'Activity Log' && (
                 <div className="p-10 flex flex-col items-center justify-center text-center">
                   <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                     <Layers className="w-8 h-8 text-gray-400" />
                   </div>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white">{activeTab}</h3>
                   <p className="text-sm text-gray-500 mt-2 max-w-sm">This module is part of the professional financial suite and is integrated automatically through related transactions.</p>
                 </div>
              )}
              
            </div>
          </div>
        </div>
      )}

      {/* Reallocate Budget Modal */}
      {showReallocateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-[500px] max-w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Reallocate Budget</h2>
              <button onClick={() => setShowReallocateModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleReallocate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">From Project (Source)</label>
                <select 
                  required
                  value={reallocateData.fromProjectId}
                  onChange={e => setReallocateData({...reallocateData, fromProjectId: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm"
                >
                  <option value="">Select Source Project...</option>
                  {budgets.map(b => (
                    <option key={`from-${b.id}`} value={b.id}>{b.project?.projectCode || b.budgetCode} - {b.project?.projectName || 'N/A'} (Remaining: ${b.remainingBudget || 0})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">To Project (Target)</label>
                <select 
                  required
                  value={reallocateData.toProjectId}
                  onChange={e => setReallocateData({...reallocateData, toProjectId: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm"
                >
                  <option value="">Select Target Project...</option>
                  {budgets.map(b => (
                    <option key={`to-${b.id}`} value={b.id}>{b.project?.projectCode || b.budgetCode} - {b.project?.projectName || 'N/A'} (Current: ${b.approvedBudget || 0})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Transfer Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="number"
                    required
                    step="0.01"
                    min="0.01"
                    placeholder="e.g. 5000"
                    value={reallocateData.amount}
                    onChange={e => setReallocateData({...reallocateData, amount: e.target.value})}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Reason for Change</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Scope Expansion"
                  value={reallocateData.reason}
                  onChange={e => setReallocateData({...reallocateData, reason: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Effective Date</label>
                <input 
                  type="date"
                  required
                  value={reallocateData.effectiveDate}
                  onChange={e => setReallocateData({...reallocateData, effectiveDate: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Remarks / Notes</label>
                <textarea 
                  rows={2}
                  value={reallocateData.remarks}
                  onChange={e => setReallocateData({...reallocateData, remarks: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
                <button 
                  type="button" 
                  onClick={() => setShowReallocateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isReallocating}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isReallocating ? 'Saving...' : 'Apply Reallocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
