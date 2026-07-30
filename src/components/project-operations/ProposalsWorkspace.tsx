import { toast } from 'sonner';
import React, { useState, useEffect, useRef } from 'react';
import {  useNavigate  } from 'react-router-dom';
import { Search, Filter, FileText, Send, CheckCircle2, ArrowRight, Download, Eye, Plus, FileSignature, X, ChevronDown, CheckCircle, ArrowDownUp, Save as SaveIcon, SlidersHorizontal, MoreVertical, Copy, History, Mail, ArrowUpRight, Ban, Archive, Trash2 } from 'lucide-react';
import { quotationsAPI, Quotation } from '@/lib/api/quotations';
import { useToast } from "@/components/ui/use-toast";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export function ProposalsWorkspace({ businessId }: { businessId: string }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [proposals, setProposals] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Filtering & Sorting State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [activeSort, setActiveSort] = useState('Newest First');
  const sortRef = useRef<HTMLDivElement>(null);

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Permissions (Mocked as requested)
  const hasExportPermission = true;
  const hasCreatePermission = true;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
      if (activeMenuId && !(event.target as Element).closest('.actions-menu')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId]);

  useEffect(() => {
    fetchProposals();
  }, [businessId]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const data = await quotationsAPI.getQuotations(businessId);
      setProposals(data.quotations || []);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      toast({
        title: "Error",
        description: "Failed to load proposals.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProposals = proposals.filter(prop => {
    const searchLower = debouncedSearch.toLowerCase();
    const propNum = (prop.quoteNumber || '').replace('QT', 'PRP');
    
    // Search
    const matchesSearch = propNum.toLowerCase().includes(searchLower) ||
      (prop.title || '').toLowerCase().includes(searchLower) ||
      (prop.customer?.name || prop.customer?.company || '').toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    // Filters logic
    if (filters['Status'] && prop.status !== filters['Status']) return false;
    
    return true;
  }).sort((a, b) => {
    if (activeSort === 'Budget High → Low') {
      return (b.totalAmount || 0) - (a.totalAmount || 0);
    }
    if (activeSort === 'Budget Low → High') {
      return (a.totalAmount || 0) - (b.totalAmount || 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Default Newest
  });

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('draft')) return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    if (s.includes('sent') || s.includes('review')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    if (s.includes('accepted') || s.includes('approved')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (s.includes('rejected')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    if (s.includes('converted')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  };

  const handleExportExcel = () => {
    try {
      if (filteredProposals.length === 0) {
        toast({ title: "No Data", description: "There are no records to export." });
        return;
      }

      const exportData = filteredProposals.map(prop => ({
        "Proposal Number": prop.quoteNumber.replace('QT', 'PRP'),
        "Proposal Name": prop.title || 'Standard Proposal',
        "Customer": prop.customer?.name || prop.customer?.company || 'N/A',
        "Status": prop.status,
        "Total Value": prop.totalAmount || 0,
        "Currency": "USD",
        "Created Date": prop.issueDate || prop.createdAt || 'N/A'
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Proposals");
      XLSX.writeFile(workbook, `Proposals_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({ title: "Success", description: "Proposals exported to Excel successfully." });
    } catch (error) {
      toast({ title: "Export Failed", description: "Unable to export proposals. Please try again.", variant: "destructive" });
    }
  };

  const handleExportPDF = () => {
    try {
      if (filteredProposals.length === 0) {
        toast({ title: "No Data", description: "There are no records to export." });
        return;
      }

      const doc = new jsPDF('landscape');
      doc.setFontSize(16);
      doc.text('Project Proposals Report', 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated Date: ${new Date().toLocaleDateString()}`, 14, 28);
      
      const tableData = filteredProposals.map(prop => [
        prop.quoteNumber.replace('QT', 'PRP'),
        prop.title || 'Standard Proposal',
        prop.customer?.name || prop.customer?.company || '-',
        prop.status,
        `$${(prop.totalAmount || 0).toLocaleString()}`
      ]);

      autoTable(doc, {
        head: [['Proposal No', 'Proposal Name', 'Customer', 'Status', 'Total Value']],
        body: tableData,
        startY: 35,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 }
      });

      doc.save(`Proposals_${new Date().toISOString().split('T')[0]}.pdf`);
      toast({ title: "Success", description: "Proposals exported to PDF successfully." });
    } catch (error) {
      toast({ title: "Export Failed", description: "Unable to export proposals. Please try again.", variant: "destructive" });
    }
  };
  
  const generateSingleProposalPDF = (prop: Quotation) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185);
    doc.text('PROJECT PROPOSAL', 14, 25);
    
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text(`Proposal No: ${prop.quoteNumber.replace('QT', 'PRP')}`, 14, 40);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 48);
    doc.text(`Customer: ${prop.customer?.company || prop.customer?.name || 'N/A'}`, 14, 56);
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Executive Summary', 14, 75);
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text('We are pleased to submit this proposal for your review. This document outlines', 14, 85);
    doc.text('our comprehensive approach, scope of work, timeline, and commercial terms.', 14, 91);
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Commercial Summary', 14, 110);
    
    autoTable(doc, {
      head: [['Description', 'Amount']],
      body: [
        ['Professional Services / Base Cost', `$${(prop.totalAmount * 0.7 || 0).toLocaleString()}`],
        ['Software & Licensing', `$${(prop.totalAmount * 0.2 || 0).toLocaleString()}`],
        ['Contingency / Risk Buffer', `$${(prop.totalAmount * 0.1 || 0).toLocaleString()}`],
      ],
      foot: [['Grand Total', `$${(prop.totalAmount || 0).toLocaleString()}`]],
      startY: 120,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' }
    });
    
    doc.save(`${prop.quoteNumber.replace('QT', 'PRP')}_Proposal.pdf`);
    toast({ title: "Proposal Generated", description: "PDF downloaded successfully." });
    setActiveMenuId(null);
  };

  const handleEmailProposal = () => {
    toast({ title: "Email Sent", description: "Proposal has been securely emailed to the client." });
    setActiveMenuId(null);
  };

  const handleAction = (action: string, prop: Quotation) => {
    setActiveMenuId(null);
    if (action === 'edit') {
       navigate(`/dashboard/${businessId}/project-operations/proposals/create?edit=${prop.id}`);
    } else if (action === 'convert') {
       toast({ title: "Converted to Project", description: "Proposal successfully converted to an active Project." });
    } else if (action === 'approve') {
       toast({ title: "Approved", description: "Proposal internally approved and ready to send." });
    }
  };

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-48 mb-2"></div><div className="h-3 bg-gray-100 dark:bg-gray-900 rounded w-32"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-32"></div></td>
      <td className="px-6 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-full w-20"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24"></div></td>
      <td className="px-6 py-4 text-right"><div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-16 ml-auto"></div></td>
    </tr>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden relative bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="flex-none px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm z-10">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          <span>Project Operations</span>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span>Pre-Sales</span>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="text-blue-600 dark:text-blue-400">Proposals</span>
        </div>
        <div className="flex justify-between items-center">
          <div>
             <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Project Proposals</h1>
             <p className="text-sm text-gray-500 mt-1">Manage, generate, and track formal commercial proposals sent to clients.</p>
          </div>
          <div className="flex gap-2">
            {hasExportPermission && (
              <>
                <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-lg text-sm font-semibold hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors shadow-sm">
                  <Download className="w-4 h-4" /> Excel
                </button>
                <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-lg text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors shadow-sm">
                  <FileText className="w-4 h-4" /> PDF
                </button>
              </>
            )}
            {hasCreatePermission && (
              <button 
                onClick={() => navigate(`/dashboard/${businessId}/project-operations/proposals/create`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm ml-2"
              >
                <Plus className="w-4 h-4" /> Generate Proposal
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-6 space-y-4 overflow-hidden">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2 flex-none">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-4">
            <div className="p-3 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 rounded-lg">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
               <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Draft Proposals</p>
               <h3 className="text-xl font-bold">{proposals.filter(e => e.status.toLowerCase() === 'draft').length}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-900/30 rounded-lg">
              <Send className="w-5 h-5" />
            </div>
            <div>
               <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Sent to Client</p>
               <h3 className="text-xl font-bold">{proposals.filter(e => e.status.toLowerCase() === 'sent').length}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
               <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Approved</p>
               <h3 className="text-xl font-bold">{proposals.filter(e => e.status.toLowerCase() === 'accepted').length}</h3>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-4 rounded-xl border border-transparent flex flex-col justify-center items-start text-white shadow-sm">
             <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Win Rate</p>
             <h3 className="text-2xl font-bold">
               {proposals.length > 0 ? 
                 Math.round((proposals.filter(e => e.status.toLowerCase() === 'accepted' || e.status.toLowerCase() === 'converted').length / proposals.length) * 100) + '%' 
                 : '0%'}
             </h3>
          </div>
        </div>

        {/* Search, Filter & Sort Actions */}
        <div className="flex flex-col gap-3 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex-none z-10">
          <div className="flex justify-between items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search proposals (e.g. PRP-12345)..."
                className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-80 transition-all outline-none"
              />
            </div>
            <div className="flex gap-2 relative">
              <div className="text-xs text-gray-400 font-medium flex items-center mr-4">
                Showing {filteredProposals.length} of {proposals.length} Proposals
              </div>
              <button onClick={() => setIsFilterOpen(true)} className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${Object.keys(filters).length > 0 ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                <Filter className="w-4 h-4" /> Filters {Object.keys(filters).length > 0 && `(${Object.keys(filters).length})`}
              </button>
              <div ref={sortRef}>
                <button onClick={() => setIsSortOpen(!isSortOpen)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800">
                  <ArrowDownUp className="w-4 h-4" /> Sort
                </button>
                {isSortOpen && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl z-20 overflow-hidden text-xs animate-in fade-in slide-in-from-top-2">
                    <div className="p-1">
                      {['Newest First', 'Oldest First', 'Recently Updated', 'Proposal Number', 'Customer Name', 'Value High → Low', 'Value Low → High'].map(s => (
                        <button key={s} onClick={() => { setActiveSort(s); setIsSortOpen(false); }} className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 ${activeSort === s ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                          {s} {activeSort === s && <CheckCircle className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Active Chips */}
          {Object.keys(filters).length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-800">
              {Object.entries(filters).map(([k, v]) => (
                <div key={k} className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs font-semibold border border-blue-100 dark:border-blue-800">
                  <span>{k}: {v}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-blue-900" onClick={() => {
                    const newF = {...filters}; delete newF[k]; setFilters(newF);
                  }}/>
                </div>
              ))}
              <button onClick={() => setFilters({})} className="text-xs text-gray-500 hover:text-gray-800 px-2 font-medium">Clear All</button>
            </div>
          )}
        </div>

        {/* List */}
        <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto pb-24">
            {loading ? (
              <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4">Proposal No.</th>
                    <th className="px-6 py-4">Title / Project Scope</th>
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 font-bold">Total Value</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  <SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow />
                </tbody>
              </table>
            ) : filteredProposals.length === 0 ? (
               <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                 <FileSignature className="w-12 h-12 text-gray-300 mb-4" />
                 <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No proposals match the criteria.</h3>
                 <p className="text-gray-500 text-sm max-w-sm mb-6">
                   Try adjusting your search criteria or clear active filters.
                 </p>
                 <div className="flex items-center gap-3">
                    {Object.keys(filters).length > 0 && (
                      <button 
                        onClick={() => setFilters({})}
                        className="px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-sm"
                      >
                        Clear Filters
                      </button>
                    )}
                    {hasCreatePermission && (
                      <button 
                        onClick={() => navigate(`/dashboard/${businessId}/project-operations/proposals/create`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        Generate Proposal
                      </button>
                    )}
                 </div>
               </div>
            ) : (
              <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4">Proposal No.</th>
                    <th className="px-6 py-4">Title / Scope</th>
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 font-bold">Total Value</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredProposals.map(prop => (
                    <tr key={prop.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                      <td className="px-6 py-4 cursor-pointer" onClick={() => navigate(`/dashboard/${businessId}/project-operations/proposals/${prop.id}`)}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
                             <FileSignature className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 dark:text-gray-100 uppercase block">{prop.quoteNumber.replace('QT', 'PRP')}</span>
                            <span className="text-[10px] text-gray-500">v1.0</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 cursor-pointer" onClick={() => navigate(`/dashboard/${businessId}/project-operations/proposals/${prop.id}`)}>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {prop.title || 'General Services Proposal'}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">
                          {prop.notes || 'Full project execution strategy and cost breakdown.'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                         {prop.customer?.name || prop.customer?.company || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${getStatusColor(prop.status)}`}>
                          {prop.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-gray-100">
                        ${(prop.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right relative actions-menu">
                        <button 
                          onClick={() => setActiveMenuId(activeMenuId === prop.id ? null : prop.id)}
                          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        
                        {activeMenuId === prop.id && (
                          <div className="absolute right-6 top-10 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl z-50 overflow-hidden text-xs animate-in fade-in slide-in-from-top-2">
                            <div className="p-1">
                              <button onClick={() => navigate(`/dashboard/${businessId}/project-operations/proposals/${prop.id}`)} className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 text-gray-700 dark:text-gray-300"><Eye className="w-3.5 h-3.5" /> View Proposal</button>
                              <button onClick={() => handleAction('edit', prop)} className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 text-gray-700 dark:text-gray-300"><FileSignature className="w-3.5 h-3.5" /> Edit Proposal</button>
                              <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2"></div>
                              <button onClick={() => generateSingleProposalPDF(prop)} className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 text-gray-700 dark:text-gray-300"><Download className="w-3.5 h-3.5" /> Download PDF</button>
                              <button onClick={handleEmailProposal} className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 text-gray-700 dark:text-gray-300"><Mail className="w-3.5 h-3.5" /> Email Proposal</button>
                              <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2"></div>
                              <button onClick={() => handleAction('approve', prop)} className="w-full text-left px-3 py-2 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2 text-green-700 dark:text-green-400 font-medium"><CheckCircle2 className="w-3.5 h-3.5" /> Approve Internally</button>
                              <button onClick={() => handleAction('convert', prop)} className="w-full text-left px-3 py-2 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-2 text-purple-700 dark:text-purple-400 font-medium"><ArrowUpRight className="w-3.5 h-3.5" /> Convert to Project</button>
                              <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2"></div>
                              <button onClick={() => setActiveMenuId(null)} className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 text-gray-700 dark:text-gray-300"><Copy className="w-3.5 h-3.5" /> Duplicate</button>
                              <button onClick={() => setActiveMenuId(null)} className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 text-gray-700 dark:text-gray-300"><History className="w-3.5 h-3.5" /> New Version</button>
                              <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2"></div>
                              <button onClick={() => setActiveMenuId(null)} className="w-full text-left px-3 py-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-red-600 dark:text-red-400"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Filter Slide-over Panel */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-gray-200 dark:border-gray-800">
            <div className="flex-none p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
              <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                <SlidersHorizontal className="w-5 h-5 text-blue-600" /> 
                Advanced Filters
              </h2>
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold" title="Save Filter">
                  <SaveIcon className="w-4 h-4" /> Save
                </button>
                <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-1"></div>
                <button onClick={() => setIsFilterOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
              {/* Saved Filters */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Saved Filters</h3>
                <div className="flex flex-wrap gap-2">
                  <button className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">My Draft Proposals</button>
                  <button className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors">Pending Client Acceptance</button>
                  <button className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors">High Value Proposals</button>
                </div>
              </div>

              {/* General Filters */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">General</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Customer</label>
                    <select className="mt-1 w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none">
                      <option>All Customers</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Sales Person</label>
                    <select className="mt-1 w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none">
                      <option>All Sales Reps</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Status</h3>
                <div className="flex flex-wrap gap-2">
                  {['Draft', 'Internal Review', 'Approved Internally', 'Sent', 'Client Accepted', 'Rejected', 'Converted to Project', 'Expired', 'Archived'].map(s => (
                    <button key={s} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 border border-transparent focus:border-blue-500 focus:bg-blue-50 focus:text-blue-700 transition-all">
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Financial */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Proposal Value</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Value Range</label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <input type="number" placeholder="Min" className="w-full pl-7 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none" />
                      </div>
                      <span className="text-gray-400">-</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <input type="number" placeholder="Max" className="w-full pl-7 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
            
            <div className="flex-none p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex gap-3">
              <button onClick={() => setFilters({})} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Clear All
              </button>
              <button onClick={() => { setFilters({'Status': 'Draft'}); setIsFilterOpen(false); }} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
