import { toast } from 'sonner';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, Receipt, FileSpreadsheet, FileText, X, CheckCircle, 
  AlertCircle, DollarSign, Calendar, Calculator, MoreVertical, CreditCard,
  MessageSquare, User, Clock
} from 'lucide-react';
import { projectOperationsAPI } from '@/lib/api/project-operations';
import { useToast } from '@/hooks/use-toast';
import { API_ROOT } from "@/config/api";

export function GlobalExpensesWorkspace({ businessId }: { businessId: string }) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<any>({});
  
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [showActionModal, setShowActionModal] = useState<string | null>(null); // 'Submit', 'Approve (Manager)', 'Approve (Finance)', 'Reimburse', 'Reject'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expenseData, setExpenseData] = useState({
    title: '', amount: '', category: 'Travel', paymentMethod: 'Card', date: new Date().toISOString().split('T')[0], projectId: '', notes: ''
  });
  const [actionComments, setActionComments] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchData = async () => {
    if (!businessId) return;
    try {
      setLoading(true);
      const res = await projectOperationsAPI.getGlobalExpenses(businessId);
      if (res.success || res.expenses) {
        setExpenses(res.expenses || []);
      }
      
      let token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      if (!token && typeof window !== 'undefined') {
        token = localStorage.getItem('token') || localStorage.getItem('accessToken') || undefined;
      }
      
      const projectsRes = await fetch(`${API_ROOT}/project-operations`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-business-id': businessId }
      });
      const projectsData = await projectsRes.json();
      if (projectsData.success) {
        setProjects(projectsData.projects || []);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to load data", variant: "destructive" });
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
      if (!token && typeof window !== 'undefined') {
        token = localStorage.getItem('token') || localStorage.getItem('accessToken') || undefined;
      }
      
                        
      const queryParams = new URLSearchParams();
      if (debouncedSearch) queryParams.append('search', debouncedSearch);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.category) queryParams.append('category', filters.category);

      const url = `${API_ROOT}/project-operations/expenses/export/${type}?${queryParams.toString()}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'x-business-id': businessId }
      });

      if (!res.ok) throw new Error(`Export failed with status ${res.status}`);

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Expense_Report_${new Date().toISOString().split('T')[0]}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
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

  const handleAction = async () => {
    if (!selectedExpense || !showActionModal) return;
    try {
      setIsProcessing(true);
      await projectOperationsAPI.updateExpenseWorkflow(businessId, {
        expenseId: selectedExpense.id,
        action: showActionModal,
        comments: actionComments
      });
      toast({ title: "Success", description: `Expense ${showActionModal.toLowerCase()} successfully.` });
      setShowActionModal(null);
      setActionComments('');
      setSelectedExpense(null);
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseData.title || !expenseData.amount) {
      toast({ title: "Error", description: "Title and Amount are required", variant: "destructive" });
      return;
    }
    
    try {
      setIsProcessing(true);
      await projectOperationsAPI.createGlobalExpense(businessId, expenseData);
      toast({ title: "Success", description: "Expense submitted successfully." });
      setShowCreateModal(false);
      setExpenseData({ title: '', amount: '', category: 'Travel', paymentMethod: 'Card', date: new Date().toISOString().split('T')[0], projectId: '', notes: '' });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredData = useMemo(() => {
    return expenses.filter(e => {
      let m = true;
      const s = debouncedSearch.toLowerCase();
      if (s) {
        m = m && (
          (e.title || '').toLowerCase().includes(s) ||
          (e.project?.projectName || '').toLowerCase().includes(s) ||
          (e.employee?.name || '').toLowerCase().includes(s)
        );
      }
      if (filters.status && e.status !== filters.status) m = false;
      if (filters.category && e.category !== filters.category) m = false;
      return m;
    });
  }, [expenses, debouncedSearch, filters]);

  const kpis = useMemo(() => {
    const totalAmount = filteredData.reduce((sum, e) => sum + (e.amount || 0), 0);
    const pendingAmount = filteredData.filter(e => ['Submitted', 'Manager Approval', 'Finance Approval'].includes(e.status)).reduce((sum, e) => sum + (e.amount || 0), 0);
    const approvedAmount = filteredData.filter(e => e.status === 'Approved').reduce((sum, e) => sum + (e.amount || 0), 0);
    const reimbursedAmount = filteredData.filter(e => e.status === 'Reimbursed').reduce((sum, e) => sum + (e.amount || 0), 0);
    const pendingCount = filteredData.filter(e => ['Submitted', 'Manager Approval', 'Finance Approval'].includes(e.status)).length;
    return { totalAmount, pendingAmount, approvedAmount, reimbursedAmount, pendingCount };
  }, [filteredData]);

  if (loading && expenses.length === 0) {
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
             Expense Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review, approve, and reimburse employee and project expenses.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
          >
            + Submit Expense
          </button>
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
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-center">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Expenses</p>
            <Receipt className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white">${kpis.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
        </div>
        
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-center">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending Approval</p>
            <Clock className="w-5 h-5 text-orange-500" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white">${kpis.pendingAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
          <p className="text-xs text-gray-500 mt-1 font-medium">{kpis.pendingCount} pending requests</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-center">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Approved (Awaiting Reimbursement)</p>
            <CheckCircle className="w-5 h-5 text-indigo-500" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white">${kpis.approvedAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-center">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Reimbursed</p>
            <CreditCard className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white">${kpis.reimbursedAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
        </div>
      </div>

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
                placeholder="Search expenses, employees or projects..."
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
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="Manager Approval">Manager Approval</option>
                <option value="Finance Approval">Finance Approval</option>
                <option value="Approved">Approved</option>
                <option value="Reimbursed">Reimbursed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
              <Receipt className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-lg font-medium">No expenses found</p>
              <p className="text-sm">Try adjusting your filters or search term.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-800/80 text-xs uppercase font-bold text-gray-500 dark:text-gray-400 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 font-bold tracking-wider">Expense Details</th>
                  <th className="px-6 py-3 font-bold tracking-wider">Project / Task</th>
                  <th className="px-6 py-3 font-bold tracking-wider">Employee</th>
                  <th className="px-6 py-3 font-bold tracking-wider">Date</th>
                  <th className="px-6 py-3 font-bold tracking-wider text-right">Amount</th>
                  <th className="px-6 py-3 font-bold tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                {filteredData.map((e) => (
                  <tr key={e.id} onClick={() => setSelectedExpense(e)} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 cursor-pointer transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-gray-100">{e.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5 font-medium">{e.category || 'Uncategorized'} • {e.paymentMethod}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800 dark:text-gray-300">{e.project?.projectName || 'No Project'}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{e.task?.title || 'No Task'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800 dark:text-gray-300">{e.employee?.name || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800 dark:text-gray-300">{new Date(e.date).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-gray-900 dark:text-white">${(e.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${
                        e.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:border-red-800/30' :
                        e.status === 'Approved' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800/30' :
                        e.status === 'Reimbursed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/30' :
                        e.status === 'Draft' ? 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700' :
                        'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800/30'
                      }`}>
                        {e.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Expense Details Panel */}
      {selectedExpense && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-all">
          <div className="w-[600px] max-w-full bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col border-l border-gray-200 dark:border-gray-800 animate-in slide-in-from-right">
            
            {/* Panel Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedExpense.title}</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedExpense.category} • {new Date(selectedExpense.date).toLocaleDateString()}</p>
              </div>
              <button 
                onClick={() => setSelectedExpense(null)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Amount</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">${(selectedExpense.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</p>
                  <p className="text-lg font-bold mt-1 text-indigo-600 dark:text-indigo-400">{selectedExpense.status}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Associations</h3>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    <div className="flex justify-between p-3 text-sm">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Employee</span>
                      <span className="font-bold text-gray-900 dark:text-white">{selectedExpense.employee?.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between p-3 text-sm">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Project</span>
                      <span className="font-bold text-gray-900 dark:text-white">{selectedExpense.project?.projectName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between p-3 text-sm">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Payment Method</span>
                      <span className="font-bold text-gray-900 dark:text-white">{selectedExpense.paymentMethod || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Audit Log</h3>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                  {(!selectedExpense.auditLogs || selectedExpense.auditLogs.length === 0) ? (
                    <div className="p-4 text-sm text-gray-500 text-center">No audit history.</div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {selectedExpense.auditLogs.map((log: any) => (
                        <div key={log.id} className="p-4 text-sm flex gap-3">
                          <div className="mt-1"><Clock className="w-4 h-4 text-gray-400" /></div>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="font-bold text-gray-900 dark:text-white">{log.action}</span>
                              <span className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mt-1 text-xs">
                              {log.comments || 'No comments'}
                            </p>
                            <p className="text-gray-500 mt-1 text-xs font-medium">By: {log.performedBy}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Workflow Actions */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex flex-wrap gap-2 justify-end">
               {selectedExpense.status === 'Draft' && (
                 <button onClick={() => setShowActionModal('Submit')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">Submit for Approval</button>
               )}
               {selectedExpense.status === 'Submitted' && (
                 <>
                   <button onClick={() => setShowActionModal('Reject')} className="px-4 py-2 border border-red-200 text-red-600 bg-white rounded-lg text-sm font-bold hover:bg-red-50">Reject</button>
                   <button onClick={() => setShowActionModal('Approve (Manager)')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">Manager Approve</button>
                 </>
               )}
               {selectedExpense.status === 'Finance Approval' && (
                 <>
                   <button onClick={() => setShowActionModal('Reject')} className="px-4 py-2 border border-red-200 text-red-600 bg-white rounded-lg text-sm font-bold hover:bg-red-50">Reject</button>
                   <button onClick={() => setShowActionModal('Approve (Finance)')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700">Finance Approve</button>
                 </>
               )}
               {selectedExpense.status === 'Approved' && (
                 <button onClick={() => setShowActionModal('Reimburse')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700">Mark Reimbursed</button>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-[400px] max-w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{showActionModal} Expense</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Comments (Optional)</label>
                <textarea 
                  rows={3}
                  placeholder="Add any remarks..."
                  value={actionComments}
                  onChange={e => setActionComments(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowActionModal(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAction}
                  disabled={isProcessing}
                  className={`flex items-center gap-2 px-5 py-2 text-white text-sm font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 ${
                    showActionModal === 'Reject' ? 'bg-red-600 hover:bg-red-700' : 
                    showActionModal === 'Reimburse' ? 'bg-emerald-600 hover:bg-emerald-700' :
                    'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isProcessing ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Expense Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-[500px] max-w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Submit New Expense</h2>
            </div>
            
            <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Expense Title / Reason *</label>
                <input required value={expenseData.title} onChange={e => setExpenseData({...expenseData, title: e.target.value})} placeholder="e.g. Client Dinner"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Amount *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input required type="number" step="0.01" value={expenseData.amount} onChange={e => setExpenseData({...expenseData, amount: e.target.value})} placeholder="0.00"
                      className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Date *</label>
                  <input required type="date" value={expenseData.date} onChange={e => setExpenseData({...expenseData, date: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Category</label>
                  <select value={expenseData.category} onChange={e => setExpenseData({...expenseData, category: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm">
                    {['Travel', 'Meals', 'Office Supplies', 'Software', 'Hardware', 'Other'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Payment Method</label>
                  <select value={expenseData.paymentMethod} onChange={e => setExpenseData({...expenseData, paymentMethod: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm">
                    {['Card', 'Cash', 'Bank Transfer'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Project (Optional)</label>
                <select value={expenseData.projectId} onChange={e => setExpenseData({...expenseData, projectId: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm">
                  <option value="">None / General</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectCode} - {p.projectName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Notes</label>
                <textarea rows={2} value={expenseData.notes} onChange={e => setExpenseData({...expenseData, notes: e.target.value})} placeholder="Additional details..."
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={isProcessing} className="px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {isProcessing ? 'Submitting...' : 'Submit Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
