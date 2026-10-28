import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, FileText, Calculator, FileCheck2, ArrowRight, Download, Plus,
  X, ChevronDown, CheckCircle, ArrowDownUp, SlidersHorizontal, Eye, Edit2,
  Trash2, MoreVertical, FileSignature, CheckCircle2, Clock
} from 'lucide-react';
import { projectOperationsAPI } from '@/lib/api/project-operations';
import { useToast } from "@/components/ui/use-toast";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export function EstimationsWorkspace({ businessId }: { businessId: string }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [estimations, setEstimations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [filters, setFilters] = useState<{
    status?: string;
    customer?: string;
    minBudget?: string;
    maxBudget?: string;
    quickFilter?: string;
  }>({});
  const [tempFilters, setTempFilters] = useState<{
    status?: string;
    customer?: string;
    minBudget?: string;
    maxBudget?: string;
    quickFilter?: string;
  }>({});
  const [activeSort, setActiveSort] = useState('Newest First');

  useEffect(() => {
    if (businessId) {
      fetchEstimations();
    }
  }, [businessId]);

  const fetchEstimations = async () => {
    try {
      setLoading(true);
      const data = await projectOperationsAPI.getEstimations(businessId);
      setEstimations(data.estimations || []);
    } catch (error: any) {
      console.error("Error fetching estimations:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load estimations.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper: extract Customer Name
  const getCustomerName = (est: any): string => {
    return (
      est.requirement?.customer?.company ||
      est.requirement?.customer?.name ||
      est.customer?.company ||
      est.customer?.name ||
      est.inquiry?.company ||
      '-'
    );
  };

  // Helper: displayable Estimation Number
  const getEstNumber = (est: any): string => {
    if (est.estNumber) return est.estNumber;
    if (est.estimateNumber) return est.estimateNumber;
    return `EST-${(est.id || '').slice(0, 8).toUpperCase()}`;
  };

  // Helper: total amount
  const getEstAmount = (est: any): number => {
    if (typeof est.totalCost === 'number') return est.totalCost;
    if (typeof est.totalAmount === 'number') return est.totalAmount;
    return parseFloat(String(est.totalCost || est.totalAmount || '0').replace(/[^0-9.-]+/g, '')) || 0;
  };

  // Distinct customers from loaded estimations
  const uniqueCustomers = useMemo(() => {
    return Array.from(
      new Set(
        estimations
          .map(e => getCustomerName(e))
          .filter(c => c && c !== '-')
      )
    ).sort();
  }, [estimations]);

  // Filtered and Sorted Estimations
  const filteredAndSortedEstimations = useMemo(() => {
    let list = [...estimations];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter((est: any) => {
        const id = (est.id || '').toLowerCase();
        const estNum = getEstNumber(est).toLowerCase();
        const title = (est.title || '').toLowerCase();
        const cust = getCustomerName(est).toLowerCase();
        const status = (est.status || '').toLowerCase();
        const reqNum = (est.requirement?.requirementNumber || '').toLowerCase();
        return (
          id.includes(term) ||
          estNum.includes(term) ||
          title.includes(term) ||
          cust.includes(term) ||
          status.includes(term) ||
          reqNum.includes(term)
        );
      });
    }

    // Status filter
    if (filters.status && filters.status !== 'All') {
      const target = filters.status.toLowerCase();
      list = list.filter((est: any) => {
        const s = (est.status || '').toLowerCase();
        if (target === 'approved' || target === 'approved for proposal') {
          return s.includes('approved');
        }
        if (target === 'pending' || target === 'pending approval') {
          return s.includes('pending');
        }
        if (target === 'draft') {
          return s.includes('draft');
        }
        return s === target;
      });
    }

    // Customer filter
    if (filters.customer && filters.customer !== 'All Customers') {
      list = list.filter((est: any) => getCustomerName(est) === filters.customer);
    }

    // Min Budget filter
    if (filters.minBudget) {
      const min = parseFloat(filters.minBudget);
      if (!isNaN(min)) {
        list = list.filter((est: any) => getEstAmount(est) >= min);
      }
    }

    // Max Budget filter
    if (filters.maxBudget) {
      const max = parseFloat(filters.maxBudget);
      if (!isNaN(max)) {
        list = list.filter((est: any) => getEstAmount(est) <= max);
      }
    }

    // Quick filter
    if (filters.quickFilter) {
      if (filters.quickFilter === 'Drafts') {
        list = list.filter((est: any) => (est.status || '').toLowerCase().includes('draft'));
      } else if (filters.quickFilter === 'Pending Approval') {
        list = list.filter((est: any) => (est.status || '').toLowerCase().includes('pending'));
      } else if (filters.quickFilter === 'Approved for Proposal') {
        list = list.filter((est: any) => (est.status || '').toLowerCase().includes('approved'));
      } else if (filters.quickFilter === 'High Budget Estimates') {
        list = list.filter((est: any) => getEstAmount(est) >= 10000);
      }
    }

    // Sorting
    return list.sort((a: any, b: any) => {
      const valA = getEstAmount(a);
      const valB = getEstAmount(b);
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      const updateA = a.updatedAt ? new Date(a.updatedAt).getTime() : dateA;
      const updateB = b.updatedAt ? new Date(b.updatedAt).getTime() : dateB;

      switch (activeSort) {
        case 'Newest First':
          return (dateB - dateA) || (b.id || '').localeCompare(a.id || '');
        case 'Oldest First':
          return (dateA - dateB) || (a.id || '').localeCompare(b.id || '');
        case 'Recently Updated':
          return (updateB - updateA) || (b.id || '').localeCompare(a.id || '');
        case 'Estimate Number':
          return (b.id || '').localeCompare(a.id || '', undefined, { numeric: true });
        case 'Customer Name':
          return getCustomerName(a).localeCompare(getCustomerName(b));
        case 'Budget High → Low':
          return valB - valA;
        case 'Budget Low → High':
          return valA - valB;
        case 'Estimated Cost High → Low':
          return (valB * 0.7) - (valA * 0.7);
        case 'Profit High → Low':
          return (valB * 0.3) - (valA * 0.3);
        default:
          return 0;
      }
    });
  }, [estimations, searchTerm, filters, activeSort]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('draft')) return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    if (s.includes('pending') || s.includes('sent')) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    if (s.includes('approved')) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (s.includes('rejected') || s.includes('cancelled')) return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400';
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  };

  // Convert to Proposal Action
  const handleConvertToProposal = async (e: React.MouseEvent, est: any) => {
    e.stopPropagation();
    try {
      // 1. Update estimation status to 'Approved for Proposal'
      await projectOperationsAPI.updateEstimation(businessId, est.id, {
        status: 'Approved for Proposal'
      });

      // 2. Update local state so table updates immediately
      setEstimations(prev => prev.map(item => item.id === est.id ? { ...item, status: 'Approved for Proposal' } : item));

      toast({
        title: "Converted to Proposal",
        description: `Estimation status updated to 'Approved for Proposal'. Opening proposal generator...`
      });

      // 3. Navigate to proposals creation pre-filled with this estimation
      navigate(`/dashboard/${businessId}/project-operations/proposals/create?estimateId=${est.id}`);
    } catch (err: any) {
      console.error("Convert to proposal error:", err);
      toast({
        title: "Conversion Error",
        description: err.message || "Could not convert estimation to proposal.",
        variant: "destructive"
      });
    }
  };

  // Delete Estimation Action
  const handleDeleteEstimation = async (e: React.MouseEvent, est: any) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete estimation "${est.title || getEstNumber(est)}"?`)) {
      return;
    }
    try {
      await projectOperationsAPI.deleteEstimation(businessId, est.id);
      setEstimations(prev => prev.filter(item => item.id !== est.id));
      toast({
        title: "Deleted Successfully",
        description: `Estimation "${est.title || getEstNumber(est)}" has been deleted.`
      });
    } catch (err: any) {
      console.error("Delete estimation error:", err);
      toast({
        title: "Delete Failed",
        description: err.message || "Could not delete estimation.",
        variant: "destructive"
      });
    }
  };

  // Download Single Estimation PDF
  const handleDownloadSinglePDF = (e: React.MouseEvent, est: any) => {
    e.stopPropagation();
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const primaryColor: [number, number, number] = [41, 128, 185];

      // Header Banner
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('PROJECT ESTIMATION', 14, 25);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 14, 25, { align: 'right' });

      // Summary Info
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Estimation: ${getEstNumber(est)}`, 14, 52);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Title: ${est.title || 'Untitled'}`, 14, 60);
      doc.text(`Customer: ${getCustomerName(est)}`, 14, 68);
      doc.text(`Status: ${est.status || 'Draft'}`, 14, 76);
      doc.text(`Created: ${est.createdAt ? new Date(est.createdAt).toLocaleDateString() : 'N/A'}`, 14, 84);

      // Cost Breakdown Table
      const costRows = [
        ['Material Cost', `$${Number(est.materialCost || 0).toLocaleString()}`],
        ['Labour Cost', `$${Number(est.labourCost || 0).toLocaleString()}`],
        ['Machine Cost', `$${Number(est.machineCost || 0).toLocaleString()}`],
        ['Subcontract Cost', `$${Number(est.subcontractCost || 0).toLocaleString()}`],
        ['Travel & Expenses', `$${Number(est.travelCost || 0).toLocaleString()}`],
        ['Miscellaneous Cost', `$${Number(est.miscCost || 0).toLocaleString()}`],
        ['Tax', `$${Number(est.tax || 0).toLocaleString()}`],
        ['Profit Margin', `${Number(est.profitMargin || 0)}%`],
        ['TOTAL ESTIMATED BUDGET', `$${getEstAmount(est).toLocaleString()}`]
      ];

      autoTable(doc, {
        head: [['Cost Category', 'Amount']],
        body: costRows,
        startY: 94,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: 255 },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } }
      });

      doc.save(`${getEstNumber(est)}_Summary.pdf`);
      toast({ title: "Success", description: "Estimation PDF downloaded successfully." });
    } catch (err: any) {
      console.error("PDF generation error:", err);
      toast({ title: "Export Failed", description: err.message || "Failed to generate PDF", variant: "destructive" });
    }
  };

  // Full Table PDF Export (All/Filtered)
  const handleExportPDF = () => {
    try {
      const dataToExport = filteredAndSortedEstimations.length > 0 ? filteredAndSortedEstimations : estimations;
      if (!dataToExport || dataToExport.length === 0) {
        toast({ title: "No Data", description: "There are no records to export.", variant: "destructive" });
        return;
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const primaryColor: [number, number, number] = [41, 128, 185];

      // Header Banner
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('PROJECT ESTIMATIONS REPORT', 14, 25);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 14, 25, { align: 'right' });

      const tableColumn = ["Est. Number", "Title", "Customer", "Status", "Total Amount", "Date"];
      const tableRows = dataToExport.map(est => [
        getEstNumber(est),
        est.title || 'Standard Estimation',
        getCustomerName(est),
        est.status || 'Draft',
        `$${getEstAmount(est).toLocaleString()}`,
        est.createdAt ? new Date(est.createdAt).toLocaleDateString() : 'N/A'
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: 255 },
        styles: { fontSize: 9 }
      });

      doc.save(`Estimations_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast({ title: "Success", description: "Estimations report PDF downloaded successfully." });
    } catch (error: any) {
      toast({ title: "Export Failed", description: error.message || "Unable to export estimations.", variant: "destructive" });
    }
  };

  // Full Table Excel Export
  const handleExportExcel = () => {
    try {
      const dataToExport = filteredAndSortedEstimations.length > 0 ? filteredAndSortedEstimations : estimations;
      if (dataToExport.length === 0) {
        toast({ title: "No Data", description: "There are no records to export." });
        return;
      }

      const exportData = dataToExport.map(est => ({
        "Estimate Number": getEstNumber(est),
        "Full ID": est.id,
        "Estimate Name": est.title || 'Standard Estimation',
        "Customer": getCustomerName(est),
        "Linked Requirement": est.requirement?.requirementNumber || est.requirementId || 'N/A',
        "Status": est.status,
        "Material Cost": est.materialCost || 0,
        "Labour Cost": est.labourCost || 0,
        "Machine Cost": est.machineCost || 0,
        "Subcontract Cost": est.subcontractCost || 0,
        "Travel Cost": est.travelCost || 0,
        "Misc Cost": est.miscCost || 0,
        "Tax": est.tax || 0,
        "Profit Margin %": est.profitMargin || 0,
        "Total Budget": getEstAmount(est),
        "Created Date": est.createdAt ? new Date(est.createdAt).toLocaleDateString() : 'N/A'
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Estimations");
      XLSX.writeFile(workbook, `Estimations_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({ title: "Success", description: "Estimations exported to Excel successfully." });
    } catch (error: any) {
      toast({ title: "Export Failed", description: error.message || "Unable to export estimations.", variant: "destructive" });
    }
  };

  const sortOptions = [
    { id: 'Newest First', label: 'Newest First' },
    { id: 'Oldest First', label: 'Oldest First' },
    { id: 'Recently Updated', label: 'Recently Updated' },
    { id: 'Estimate Number', label: 'Estimate Number' },
    { id: 'Customer Name', label: 'Customer Name' },
    { id: 'Budget High → Low', label: 'Budget High → Low' },
    { id: 'Budget Low → High', label: 'Budget Low → High' },
    { id: 'Estimated Cost High → Low', label: 'Estimated Cost High → Low' },
    { id: 'Profit High → Low', label: 'Profit High → Low' }
  ];

  const draftCount = estimations.filter(e => (e.status || '').toLowerCase().includes('draft')).length;
  const pendingCount = estimations.filter(e => (e.status || '').toLowerCase().includes('pending') || (e.status || '').toLowerCase().includes('sent')).length;
  const approvedCount = estimations.filter(e => (e.status || '').toLowerCase().includes('approved')).length;

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Header */}
      <div className="flex-none px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm z-10">
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
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg text-sm font-semibold hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" /> Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors shadow-sm cursor-pointer"
            >
              <FileText className="w-4 h-4" /> PDF
            </button>
            <button
              onClick={() => navigate(`/dashboard/${businessId}/project-operations/estimations/create`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer ml-1"
            >
              <Plus className="w-4 h-4" /> New Estimation
            </button>
          </div>
        </div>
      </div>

      <div data-lenis-prevent className="flex-1 overflow-y-auto p-6 space-y-5 pb-16">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2 flex-none">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-4 shadow-xs">
            <div className="p-3 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 rounded-lg">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Draft Estimations</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{draftCount}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-4 shadow-xs">
            <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-900/30 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Sent for Approval</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{pendingCount}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-4 shadow-xs">
            <div className="p-3 bg-green-50 text-green-600 dark:bg-green-900/30 rounded-lg">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Approved (Ready for Project)</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{approvedCount}</h3>
            </div>
          </div>
        </div>

        {/* Search, Filter & Sort Actions Bar */}
        <div className="flex flex-col gap-3 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex-none">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search estimations..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-1 focus:ring-blue-500 transition-all outline-none text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="text-xs text-gray-400 font-medium whitespace-nowrap hidden md:block">
                Showing {filteredAndSortedEstimations.length} of {estimations.length} Estimations
              </div>

              {/* Filter Button */}
              <button
                type="button"
                onClick={() => {
                  setTempFilters({ ...filters });
                  setIsFilterOpen(true);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors cursor-pointer ${activeFilterCount > 0
                    ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="bg-blue-600 text-white rounded-full w-4 h-4 inline-flex items-center justify-center text-[10px] font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Sort Dropdown */}
              <DropdownMenu open={isSortOpen} onOpenChange={setIsSortOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors focus:outline-none cursor-pointer ${activeSort !== 'Newest First'
                        ? 'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                  >
                    <ArrowDownUp className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate max-w-[120px]">{activeSort}</span>
                    <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={4} className="w-56 p-1 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-50">
                  {sortOptions.map(opt => (
                    <DropdownMenuItem
                      key={opt.id}
                      onClick={() => { setActiveSort(opt.id); setIsSortOpen(false); }}
                      className={`w-full px-3 py-2 text-xs rounded-md flex items-center justify-between cursor-pointer ${activeSort === opt.id
                          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-bold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    >
                      <span>{opt.label}</span>
                      {activeSort === opt.id && <CheckCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Active Filter Chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-800">
              {filters.status && (
                <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs font-semibold border border-blue-100 dark:border-blue-800">
                  <span>Status: {filters.status}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-blue-900" onClick={() => setFilters(prev => ({ ...prev, status: undefined }))} />
                </div>
              )}
              {filters.customer && (
                <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs font-semibold border border-blue-100 dark:border-blue-800">
                  <span>Customer: {filters.customer}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-blue-900" onClick={() => setFilters(prev => ({ ...prev, customer: undefined }))} />
                </div>
              )}
              {(filters.minBudget || filters.maxBudget) && (
                <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs font-semibold border border-blue-100 dark:border-blue-800">
                  <span>Budget: ${filters.minBudget || '0'} - ${filters.maxBudget || '∞'}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-blue-900" onClick={() => setFilters(prev => ({ ...prev, minBudget: undefined, maxBudget: undefined }))} />
                </div>
              )}
              {filters.quickFilter && (
                <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs font-semibold border border-blue-100 dark:border-blue-800">
                  <span>{filters.quickFilter}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-blue-900" onClick={() => setFilters(prev => ({ ...prev, quickFilter: undefined }))} />
                </div>
              )}
              <button
                onClick={() => setFilters({})}
                className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 px-2 font-medium cursor-pointer"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* List Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <span className="text-gray-500 text-sm">Loading estimations...</span>
              </div>
            ) : filteredAndSortedEstimations.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <Calculator className="w-12 h-12 text-gray-300 mb-3" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">No estimations found</h3>
                <p className="text-gray-500 text-xs max-w-sm mb-4">
                  {activeFilterCount > 0 ? "Try adjusting your search query or removing active filters." : "Get started by creating your first project estimation."}
                </p>
                <div className="flex items-center gap-2">
                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => { setSearchTerm(''); setFilters({}); }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-sm cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/dashboard/${businessId}/project-operations/estimations/create`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                  >
                    New Estimation
                  </button>
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
                  {filteredAndSortedEstimations.map(est => {
                    const estNum = getEstNumber(est);
                    const custName = getCustomerName(est);
                    const totalAmt = getEstAmount(est);

                    return (
                      <tr
                        key={est.id}
                        onClick={() => navigate(`/dashboard/${businessId}/project-operations/estimations/${est.id}`)}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center shrink-0">
                              <Calculator className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-semibold text-gray-900 dark:text-gray-100 block">{estNum}</span>
                              <span className="text-[10px] text-gray-400 font-mono">
                                {est.requirement?.requirementNumber ? `REQ: ${est.requirement.requirementNumber}` : (est.id ? `${est.id.slice(0, 8)}...` : '')}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900 dark:text-gray-100 block">
                            {est.title || 'Standard Estimation'}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {est.createdAt ? new Date(est.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-medium ${custName !== '-' ? 'text-gray-900 dark:text-gray-200' : 'text-gray-400'}`}>
                            {custName}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${getStatusColor(est.status)}`}>
                            {est.status || 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-gray-100">
                          ${totalAmt.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="h-8 w-8 inline-flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors shadow-xs cursor-pointer focus:outline-none"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" sideOffset={4} className="w-52 p-1 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-50">
                              <DropdownMenuItem
                                onClick={(e) => handleConvertToProposal(e, est)}
                                className="w-full px-3 py-2 text-xs rounded-md flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer"
                              >
                                <FileSignature className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                <span>Convert to Proposal</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1 bg-gray-100 dark:border-gray-800" />
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/${businessId}/project-operations/estimations/${est.id}`); }}
                                className="w-full px-3 py-2 text-xs rounded-md flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 shrink-0" />
                                <span>View Estimation</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/${businessId}/project-operations/estimations/create?editId=${est.id}`); }}
                                className="w-full px-3 py-2 text-xs rounded-md flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5 shrink-0" />
                                <span>Edit Estimation</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => handleDownloadSinglePDF(e, est)}
                                className="w-full px-3 py-2 text-xs rounded-md flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5 shrink-0" />
                                <span>Download PDF</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1 bg-gray-100 dark:border-gray-800" />
                              <DropdownMenuItem
                                onClick={(e) => handleDeleteEstimation(e, est)}
                                className="w-full px-3 py-2 text-xs rounded-md flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                <span>Delete Estimation</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
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
              <button
                onClick={() => setIsFilterOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
              {/* Quick Filters */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Filters</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'Drafts', label: 'Drafts' },
                    { id: 'Pending Approval', label: 'Pending Approval' },
                    { id: 'Approved for Proposal', label: 'Approved for Proposal' },
                    { id: 'High Budget Estimates', label: 'High Budget (> $10k)' }
                  ].map(qf => {
                    const isSelected = tempFilters.quickFilter === qf.id;
                    return (
                      <button
                        key={qf.id}
                        type="button"
                        onClick={() => setTempFilters(prev => ({ ...prev, quickFilter: isSelected ? undefined : qf.id }))}
                        className={`px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors cursor-pointer ${isSelected
                            ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-semibold'
                            : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                      >
                        {qf.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customer */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Customer</h3>
                <div>
                  <select
                    value={tempFilters.customer || ''}
                    onChange={e => setTempFilters(prev => ({ ...prev, customer: e.target.value || undefined }))}
                    className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none text-gray-900 dark:text-gray-100"
                  >
                    <option value="">All Customers</option>
                    {uniqueCustomers.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Status</h3>
                <div className="flex flex-wrap gap-2">
                  {['All', 'Draft', 'Pending Approval', 'Approved for Proposal', 'Rejected'].map(s => {
                    const isSelected = (s === 'All' && !tempFilters.status) || tempFilters.status === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setTempFilters(prev => ({ ...prev, status: s === 'All' ? undefined : s }))}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${isSelected
                            ? 'bg-blue-600 text-white font-semibold shadow-xs'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-transparent'
                          }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Budget Range */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Budget Range</h3>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input
                      type="number"
                      placeholder="Min"
                      value={tempFilters.minBudget || ''}
                      onChange={e => setTempFilters(prev => ({ ...prev, minBudget: e.target.value || undefined }))}
                      onWheel={e => e.currentTarget.blur()}
                      className="w-full pl-7 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <span className="text-gray-400">-</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={tempFilters.maxBudget || ''}
                      onChange={e => setTempFilters(prev => ({ ...prev, maxBudget: e.target.value || undefined }))}
                      onWheel={e => e.currentTarget.blur()}
                      className="w-full pl-7 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>

            </div>

            <div className="flex-none p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setTempFilters({});
                  setFilters({});
                  setIsFilterOpen(false);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilters({ ...tempFilters });
                  setIsFilterOpen(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
