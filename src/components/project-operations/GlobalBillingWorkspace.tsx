import { toast } from 'sonner';
import React, { useState, useEffect, useMemo } from 'react';
import { Search, FileSpreadsheet, FileText, X, DollarSign, Clock, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';
import { projectOperationsAPI } from '@/lib/api/project-operations';
import { useToast } from '@/hooks/use-toast';
import { API_ROOT } from "@/config/api";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
  SENT: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/30',
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/30',
  PARTIALLY_PAID: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800/30',
  OVERDUE: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:border-red-800/30',
  CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700',
};

export function GlobalBillingWorkspace({ businessId }: { businessId: string }) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState({
    customerId: '', projectId: '', amount: '', dueDate: new Date().toISOString().split('T')[0], status: 'DRAFT'
  });
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('Bank Transfer');
  const [payNote, setPayNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const { toast } = useToast();

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 300); return () => clearTimeout(t); }, [search]);

  const fetchData = async () => {
    if (!businessId) return;
    try {
      setLoading(true);
      const res = await projectOperationsAPI.getGlobalBilling(businessId);
      setInvoices(res.invoices || []);
      
      let token = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1];
      if (!token && typeof window !== 'undefined') {
        token = localStorage.getItem('token') || localStorage.getItem('accessToken') || undefined;
      }
      
      const [projectsRes, customersRes] = await Promise.all([
        fetch(`${API_ROOT}/project-operations`, { headers: { 'Authorization': `Bearer ${token}`, 'x-business-id': businessId } }),
        fetch(`${API_ROOT}/customers`, { headers: { 'Authorization': `Bearer ${token}`, 'x-business-id': businessId } })
      ]);
      const projectsData = await projectsRes.json();
      const customersData = await customersRes.json();
      
      if (projectsData.success) setProjects(projectsData.projects || []);
      
      const cList = customersData.data || customersData.customers || [];
      if (Array.isArray(cList)) setCustomers(cList);

    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [businessId]);

  const filtered = useMemo(() => invoices.filter(inv => {
    const s = debouncedSearch.toLowerCase();
    const matchSearch = !s || (inv.invoiceNumber || '').toLowerCase().includes(s) || (inv.customer?.name || '').toLowerCase().includes(s) || (inv.project?.projectName || '').toLowerCase().includes(s);
    const matchStatus = !statusFilter || inv.status === statusFilter;
    return matchSearch && matchStatus;
  }), [invoices, debouncedSearch, statusFilter]);

  const kpis = useMemo(() => {
    const total = filtered.reduce((s, i) => s + (i.grandTotal || 0), 0);
    const paid = filtered.filter(i => i.status === 'PAID').reduce((s, i) => s + (i.grandTotal || 0), 0);
    const outstanding = filtered.filter(i => ['SENT', 'PARTIALLY_PAID'].includes(i.status)).reduce((s, i) => s + (i.grandTotal || 0), 0);
    const overdue = filtered.filter(i => i.status === 'OVERDUE').reduce((s, i) => s + (i.grandTotal || 0), 0);
    const draft = filtered.filter(i => i.status === 'DRAFT').length;
    return { total, paid, outstanding, overdue, draft };
  }, [filtered]);

  const handleExport = async (type: 'excel' | 'pdf') => {
    try {
      type === 'excel' ? setIsExportingExcel(true) : setIsExportingPDF(true);
      toast({ title: `Generating ${type.toUpperCase()}...` });
      let token = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1];
      if (!token && typeof window !== 'undefined') token = localStorage.getItem('token') || localStorage.getItem('accessToken') || undefined;
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (statusFilter) params.append('status', statusFilter);
      const url = `${API_ROOT}/project-operations/billing/export/${type}?${params}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, 'x-business-id': businessId } });
      if (!res.ok) throw new Error(`Export failed`);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(blob);
      a.download = `Billing_${new Date().toISOString().split('T')[0]}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(a.href);
      toast({ title: 'Success', description: `${type.toUpperCase()} downloaded.` });
    } catch (err: any) {
      toast({ title: 'Export Failed', description: err.message, variant: 'destructive' });
    } finally { setIsExportingExcel(false); setIsExportingPDF(false); }
  };

  const handleSend = async () => {
    if (!selected) return;
    try {
      setIsProcessing(true);
      await projectOperationsAPI.updateInvoiceWorkflow(businessId, { invoiceId: selected.id, action: 'Send' });
      toast({ title: 'Invoice Sent' });
      setSelected(null); fetchData();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setIsProcessing(false); }
  };

  const handlePayment = async () => {
    if (!selected || !payAmount) return;
    try {
      setIsProcessing(true);
      await projectOperationsAPI.addInvoicePayment(businessId, { invoiceId: selected.id, amount: parseFloat(payAmount), paymentMode: payMode, note: payNote });
      toast({ title: 'Payment Recorded' });
      setShowPaymentModal(false); setPayAmount(''); setPayNote(''); setSelected(null); fetchData();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setIsProcessing(false); }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceData.amount) {
      toast({ title: "Error", description: "Amount is required", variant: "destructive" });
      return;
    }
    
    try {
      setIsProcessing(true);
      const res = await projectOperationsAPI.createGlobalBilling(businessId, invoiceData);
      toast({ title: "Success", description: "Invoice generated successfully." });
      
      if (res.invoice?.id) {
        let token = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1];
        if (!token && typeof window !== 'undefined') token = localStorage.getItem('token') || localStorage.getItem('accessToken') || undefined;

        toast({ title: "Generating PDF..." });
        try {
          const pdfRes = await fetch(`${API_ROOT}/invoices/${res.invoice.id}/generate-pdf`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'x-business-id': businessId }
          });
          
          if (pdfRes.ok) {
            window.open(`${API_ROOT}/invoices/${res.invoice.id}/download-pdf?token=${token}&businessId=${businessId}`, '_blank');
          }
        } catch (pdfErr) {
          console.error("Auto PDF generation failed:", pdfErr);
        }
      }

      setShowCreateModal(false);
      setInvoiceData({ customerId: '', projectId: '', amount: '', dueDate: new Date().toISOString().split('T')[0], status: 'DRAFT' });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const fmt = (n: number) => `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading && !invoices.length) return (
    <div className="flex flex-col h-full space-y-4 p-6 animate-pulse">
      <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl" />)}</div>
      <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-xl" />
    </div>
  );

  return (
    <div className="flex flex-col h-full space-y-4 p-6 bg-gray-50/50 dark:bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Project Billing</h1>
          <p className="text-sm text-gray-500 mt-1">Manage invoices, payments, and billing for all projects.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
          >
            + Generate Invoice
          </button>
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
        {[
          { label: 'Total Invoiced', value: fmt(kpis.total), icon: DollarSign, color: 'text-blue-500' },
          { label: 'Collected (Paid)', value: fmt(kpis.paid), icon: CheckCircle, color: 'text-emerald-500' },
          { label: 'Outstanding', value: fmt(kpis.outstanding), icon: Clock, color: 'text-orange-500' },
          { label: 'Overdue', value: fmt(kpis.overdue), icon: AlertCircle, color: 'text-red-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</p>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">{value}</h3>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden min-h-[400px]">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-wrap gap-3 items-center bg-gray-50/50 dark:bg-gray-900/50">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices, customers..."
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm">
            <option value="">All Statuses</option>
            {['DRAFT','SENT','PARTIALLY_PAID','PAID','OVERDUE','CANCELLED'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
              <CreditCard className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-lg font-medium">No invoices found</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-800/80 text-xs uppercase font-bold text-gray-500 sticky top-0 z-10">
                <tr>
                  {['Invoice #', 'Customer', 'Project', 'Date', 'Due Date', 'Amount', 'Paid', 'Status'].map(h => (
                    <th key={h} className="px-6 py-3 font-bold tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                {filtered.map(inv => {
                  const totalPaid = (inv.payments || []).reduce((s: number, p: any) => s + p.amount, 0);
                  return (
                    <tr key={inv.id} onClick={() => setSelected(inv)}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 cursor-pointer transition-colors text-gray-600 dark:text-gray-400">
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-gray-100">{inv.invoiceNumber}</td>
                      <td className="px-6 py-4">{inv.customer?.name || '-'}</td>
                      <td className="px-6 py-4">{inv.project?.projectName || '-'}</td>
                      <td className="px-6 py-4">{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '-'}</td>
                      <td className="px-6 py-4">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}</td>
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{fmt(inv.grandTotal)}</td>
                      <td className="px-6 py-4 text-emerald-600 font-bold">{fmt(totalPaid)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${STATUS_COLORS[inv.status] || ''}`}>
                          {inv.status?.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
          <div className="w-[560px] max-w-full bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col border-l border-gray-200 dark:border-gray-800 animate-in slide-in-from-right">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selected.invoiceNumber}</h2>
                <p className="text-sm text-gray-500 mt-1">{selected.customer?.name} • {selected.project?.projectName || 'No Project'}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Amount</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{fmt(selected.grandTotal)}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</p>
                  <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-md border mt-1 inline-block ${STATUS_COLORS[selected.status] || ''}`}>
                    {selected.status?.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Payment History</h3>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                  {(!selected.payments || selected.payments.length === 0) ? (
                    <p className="p-4 text-sm text-gray-500 text-center">No payments recorded yet.</p>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {selected.payments.map((p: any) => (
                        <div key={p.id} className="flex justify-between p-3 text-sm">
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">{fmt(p.amount)}</p>
                            <p className="text-xs text-gray-500">{p.paymentMode} • {new Date(p.paymentDate).toLocaleDateString()}</p>
                          </div>
                          <p className="text-xs text-gray-500 font-medium">{p.paymentNumber}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Audit Log</h3>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                  {(!selected.auditLogs || selected.auditLogs.length === 0) ? (
                    <p className="p-4 text-sm text-gray-500 text-center">No audit history.</p>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {selected.auditLogs.map((log: any) => (
                        <div key={log.id} className="p-3 text-sm">
                          <div className="flex justify-between mb-1">
                            <span className="font-bold text-gray-900 dark:text-white">{log.action}</span>
                            <span className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-gray-500">{log.comments || 'No comments'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 flex gap-2 justify-end flex-wrap">
              {selected.status === 'DRAFT' && (
                <button onClick={handleSend} disabled={isProcessing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50">
                  {isProcessing ? 'Sending...' : 'Mark as Sent'}
                </button>
              )}
              {['SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(selected.status) && (
                <button onClick={() => setShowPaymentModal(true)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700">
                  Record Payment
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-[400px] max-w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Record Payment</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Amount *</label>
                <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="0.00"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Payment Mode</label>
                <select value={payMode} onChange={e => setPayMode(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm">
                  {['Bank Transfer', 'Cash', 'Cheque', 'Online', 'Card'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Note</label>
                <input value={payNote} onChange={e => setPayNote(e.target.value)} placeholder="Optional note..."
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">Cancel</button>
                <button onClick={handlePayment} disabled={isProcessing || !payAmount}
                  className="px-5 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                  {isProcessing ? 'Recording...' : 'Confirm Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-[500px] max-w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Generate Invoice</h2>
            </div>
            
            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Customer (Optional)</label>
                <select value={invoiceData.customerId} onChange={e => setInvoiceData({...invoiceData, customerId: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm">
                  <option value="">Select a Customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Project (Optional)</label>
                <select value={invoiceData.projectId} onChange={e => setInvoiceData({...invoiceData, projectId: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm">
                  <option value="">Select a Project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.projectCode} - {p.projectName}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Amount *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input required type="number" step="0.01" value={invoiceData.amount} onChange={e => setInvoiceData({...invoiceData, amount: e.target.value})} placeholder="0.00"
                      className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Due Date *</label>
                  <input required type="date" value={invoiceData.dueDate} onChange={e => setInvoiceData({...invoiceData, dueDate: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Action</label>
                <select value={invoiceData.status} onChange={e => setInvoiceData({...invoiceData, status: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm">
                  <option value="DRAFT">Save as Draft</option>
                  <option value="SENT">Send to Customer Now</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={isProcessing} className="px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {isProcessing ? 'Generating...' : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
