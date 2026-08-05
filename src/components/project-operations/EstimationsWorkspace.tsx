import { toast } from 'sonner';
import React, { useState, useEffect, useRef } from 'react';
import {  useNavigate  } from 'react-router-dom';
import { Search, Filter, FileText, Calculator, FileCheck2, ArrowRight, Download, Plus, X, ChevronDown, CheckCircle, ArrowDownUp, Save as SaveIcon, SlidersHorizontal } from 'lucide-react';
import { quotationsAPI, Quotation } from '@/lib/api/quotations';
import { useToast } from "@/components/ui/use-toast";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export function EstimationsWorkspace({ businessId }: { businessId: string }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [estimations, setEstimations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Filtering & Sorting State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [activeSort, setActiveSort] = useState('Newest First');
  const sortRef = useRef<HTMLDivElement>(null);

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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchEstimations();
  }, [businessId]);

  const fetchEstimations = async () => {
    try {
      setLoading(true);
      const data = await quotationsAPI.getQuotations(businessId);
      setEstimations(data.quotations || []);
    } catch (error) {
      console.error("Error fetching estimations:", error);
      toast({
        title: "Error",
        description: "Failed to load estimations.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEstimations = estimations.filter(est => {
    const searchLower = debouncedSearch.toLowerCase();
    
    // Search
    const matchesSearch = (est.quoteNumber || '').toLowerCase().includes(searchLower) ||
      (est.title || '').toLowerCase().includes(searchLower) ||
      (est.customer?.name || est.customer?.company || '').toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    // Filters logic
    if (filters['Status'] && est.status !== filters['Status']) return false;
    
    // Add logic here for actual filtering as backend scales.
    return true;
  }).sort((a, b) => {
    // Basic sorting stub, expand for actual sorting
    if (activeSort === 'Budget High → Low') {
      return (b.totalAmount || 0) - (a.totalAmount || 0);
    }
    if (activeSort === 'Budget Low → High') {
      return (a.totalAmount || 0) - (b.totalAmount || 0);
    }
    return 0; // Default or Newest First
  });

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('draft')) return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    if (s.includes('sent')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    if (s.includes('accepted')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (s.includes('rejected')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  };

  const handleExportExcel = () => {
    try {
      if (filteredEstimations.length === 0) {
        toast({ title: "No Data", description: "There are no records to export." });
        return;
      }

      const exportData = filteredEstimations.map(est => ({
        "Estimate Number": est.quoteNumber,
        "Estimate Name": est.title || 'Standard Estimation',
        "Customer": est.customer?.name || est.customer?.company || 'N/A',
        "Requirement": (est as any).requirementId || 'N/A',
        "Status": est.status,
        "Budget": est.totalAmount || 0,
        "Estimated Cost": (est.totalAmount || 0) * 0.7, // Mock derived value
        "Profit": (est.totalAmount || 0) * 0.3,
        "Currency": "USD", // Default or fetch from est
        "Created Date": est.issueDate || est.createdAt || 'N/A'
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Estimations");
      XLSX.writeFile(workbook, `Estimations_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({ title: "Success", description: "Estimations exported to Excel successfully." });
    } catch (error) {
      toast({ title: "Export Failed", description: "Unable to export estimations. Please try again.", variant: "destructive" });
    }
  };

  const handleExportPDF = () => {
    try {
      if (filteredEstimations.length === 0) {
        toast({ title: "No Data", description: "There are no records to export." });
        return;
      }

      const doc = new jsPDF('landscape');
      doc.setFontSize(16);
      doc.text('Project Estimations Report', 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated Date: ${new Date().toLocaleDateString()}`, 14, 28);
      
      const tableData = filteredEstimations.map(est => [
        est.quoteNumber,
        est.title || 'Standard Estimation',
        est.customer?.name || est.customer?.company || '-',
        est.status,
        `$${(est.totalAmount || 0).toLocaleString()}`,
        `$${((est.totalAmount || 0) * 0.7).toLocaleString()}`, // Mock Cost
        `$${((est.totalAmount || 0) * 0.3).toLocaleString()}` // Mock Profit
      ]);

      autoTable(doc, {
        head: [['Estimate No', 'Estimate Name', 'Customer', 'Status', 'Budget', 'Estimated Cost', 'Profit']],
        body: tableData,
        startY: 35,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 }
      });

      doc.save(`Estimations_${new Date().toISOString().split('T')[0]}.pdf`);
      toast({ title: "Success", description: "Estimations exported to PDF successfully." });
    } catch (error) {
      toast({ title: "Export Failed", description: "Unable to export estimations. Please try again.", variant: "destructive" });
    }
  };

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-48"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-32"></div></td>
      <td className="px-6 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-full w-20"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24"></div></td>
      <td className="px-6 py-4 text-right"><div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-16 ml-auto"></div></td>
    </tr>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Header */}
      <div className="flex-none px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          <span>Project Operations</span>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span>Pre-Sales</span>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="text-blue-600 dark:text-blue-400">Estimations</span>
        </div>
        <div className="flex justify-between items-center">
          <div>
             <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Project Estimations</h1>
             <p className="text-sm text-gray-500 mt-1">Calculate costs and forecast pricing before generating proposals.</p>
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
                onClick={() => navigate(`/dashboard/${businessId}/project-operations/estimations/create`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm ml-2"
              >
                <Plus className="w-4 h-4" /> New Estimation
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-6 space-y-4 overflow-hidden">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2 flex-none">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 rounded-lg">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
               <p className="text-sm font-medium text-gray-500">Draft Estimations</p>
               <h3 className="text-xl font-bold">{estimations.filter(e => e.status.toLowerCase() === 'draft').length}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-900/30 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
               <p className="text-sm font-medium text-gray-500">Sent for Approval</p>
               <h3 className="text-xl font-bold">{estimations.filter(e => e.status.toLowerCase() === 'sent').length}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 dark:bg-green-900/30 rounded-lg">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
               <p className="text-sm font-medium text-gray-500">Approved (Ready for Project)</p>
               <h3 className="text-xl font-bold">{estimations.filter(e => e.status.toLowerCase() === 'accepted').length}</h3>
            </div>
          </div>
        </div>

        {/* Search, Filter & Sort Actions */}
        <div className="flex flex-col gap-3 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex-none">
          <div className="flex justify-between items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search estimations..."
                className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-80 transition-all outline-none"
              />
            </div>
            <div className="flex gap-2 relative">
              <div className="text-xs text-gray-400 font-medium flex items-center mr-4">
                Showing {filteredEstimations.length} of {estimations.length} Estimations
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
                      {['Newest First', 'Oldest First', 'Recently Updated', 'Estimate Number', 'Customer Name', 'Budget High → Low', 'Budget Low → High', 'Estimated Cost High → Low', 'Profit High → Low'].map(s => (
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
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4">Est. Number</th>
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 font-bold">Total Amount</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </tbody>
              </table>
            ) : filteredEstimations.length === 0 ? (
               <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                 <Calculator className="w-12 h-12 text-gray-300 mb-4" />
                 <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No estimations match the selected filters.</h3>
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
                        onClick={() => navigate(`/dashboard/${businessId}/project-operations/estimations/create`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        Create New Estimation
                      </button>
                    )}
                 </div>
               </div>
            ) : (
              <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4">Est. Number</th>
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 font-bold">Total Amount</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredEstimations.map(est => (
                    <tr key={est.id} onClick={() => navigate(`/dashboard/${businessId}/project-operations/estimations/${est.id}`)} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
                             <Calculator className="w-4 h-4" />
                          </div>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{est.quoteNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                         {est.title || 'Standard Estimation'}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                         {est.customer?.name || est.customer?.company || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${getStatusColor(est.status)}`}>
                          {est.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-gray-100">
                        ${(est.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs font-semibold flex items-center justify-end gap-1 w-full opacity-0 group-hover:opacity-100 transition-opacity">
                          View Details <ArrowRight className="w-3 h-3" />
                        </button>
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
                  <button className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">My Draft Estimates</button>
                  <button className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors">Pending Approval</button>
                  <button className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors">High Budget Estimates</button>
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
                      <option>Dell</option>
                      <option>Global Corp</option>
                      <option>TechStart</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Prepared By</label>
                    <select className="mt-1 w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none">
                      <option>All Users</option>
                      <option>Admin</option>
                      <option>Sarah Jenkins</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Status</h3>
                <div className="flex flex-wrap gap-2">
                  {['Draft', 'Pending Review', 'Sent For Approval', 'Approved', 'Rejected', 'Expired', 'Cancelled', 'Archived'].map(s => (
                    <button key={s} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 border border-transparent focus:border-blue-500 focus:bg-blue-50 focus:text-blue-700 transition-all">
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Project Classification */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center justify-between cursor-pointer">
                  Classification <ChevronDown className="w-4 h-4" />
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Project Type</label>
                    <select className="mt-1 w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none">
                      <option>All Types</option>
                      <option>Software</option>
                      <option>Basic</option>
                      <option>Manufacturing</option>
                      <option>Consultancy</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Execution Type</label>
                    <select className="mt-1 w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none">
                      <option>All Types</option>
                      <option>Service</option>
                      <option>Product</option>
                      <option>Hybrid</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Financial */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Financial Filters</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Budget Range</label>
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
                  
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Estimated Cost Range</label>
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
                  
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Profit Margin %</label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input type="number" placeholder="Min %" className="w-full px-3 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none" />
                      </div>
                      <span className="text-gray-400">-</span>
                      <div className="relative flex-1">
                        <input type="number" placeholder="Max %" className="w-full px-3 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Dates</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Quick Filters</label>
                    <select className="mt-1 w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none">
                      <option>Any Time</option>
                      <option>Today</option>
                      <option>Yesterday</option>
                      <option>This Week</option>
                      <option>This Month</option>
                      <option>This Quarter</option>
                      <option>Custom Date Range</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Custom Toggles */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Attributes</h3>
                <div className="grid grid-cols-2 gap-2">
                  {['Has Attachments', 'Has Notes', 'Has Requirement', 'Has Proposal', 'Has Approval', 'Has Revisions'].map(t => (
                    <label key={t} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 truncate">{t}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>
            
            <div className="flex-none p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex gap-3">
              <button onClick={() => setFilters({})} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Clear All
              </button>
              <button onClick={() => { setFilters({'Status': 'Draft', 'Budget': '> $10k', 'Prepared By': 'Admin'}); setIsFilterOpen(false); }} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
