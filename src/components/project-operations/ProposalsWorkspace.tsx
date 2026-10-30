import { toast } from 'sonner';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, FileText, Send, CheckCircle2, ArrowRight, Download, Eye, Plus,
  FileSignature, X, ChevronDown, CheckCircle, ArrowDownUp, SlidersHorizontal,
  MoreVertical, Copy, History, Mail, ArrowUpRight, Trash2, Edit2, XCircle,
  Handshake, FileCheck
} from 'lucide-react';
import { proposalsAPI, Proposal as Quotation } from '@/lib/api/proposals';
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

export function ProposalsWorkspace({ businessId }: { businessId: string }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [proposals, setProposals] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [filters, setFilters] = useState<{
    status?: string;
    customer?: string;
    minValue?: string;
    maxValue?: string;
    quickFilter?: string;
  }>({});
  const [tempFilters, setTempFilters] = useState<{
    status?: string;
    customer?: string;
    minValue?: string;
    maxValue?: string;
    quickFilter?: string;
  }>({});
  const [activeSort, setActiveSort] = useState('Newest First');

  const hasExportPermission = true;
  const hasCreatePermission = true;

  useEffect(() => {
    if (businessId) {
      fetchProposals();
    }
  }, [businessId]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const data = await proposalsAPI.getProposals(businessId);
      const props = data.proposals || data.data || [];
      setProposals(props);
    } catch (error: any) {
      console.error("Error fetching proposals:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load proposals.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getClientName = (prop: Quotation): string => {
    return prop.customer?.name || prop.customer?.company || '-';
  };

  const getPropNumber = (prop: Quotation): string => {
    return prop.quoteNumber || '';
  };

  // Distinct clients from proposals
  const uniqueClients = useMemo(() => {
    return Array.from(
      new Set(
        proposals
          .map(p => getClientName(p))
          .filter(c => c && c !== '-')
      )
    ).sort();
  }, [proposals]);

  // Filtered and Sorted Proposals
  const filteredAndSortedProposals = useMemo(() => {
    let list = [...proposals];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter((prop: Quotation) => {
        const propNum = getPropNumber(prop).toLowerCase();
        const title = (prop.title || '').toLowerCase();
        const client = getClientName(prop).toLowerCase();
        const status = (prop.status || '').toLowerCase();
        return (
          propNum.includes(term) ||
          title.includes(term) ||
          client.includes(term) ||
          status.includes(term)
        );
      });
    }

    // Status filter
    if (filters.status && filters.status !== 'All') {
      const target = filters.status.toLowerCase();
      list = list.filter(prop => {
        const s = (prop.status || '').toLowerCase();
        return s === target || s.includes(target);
      });
    }

    // Customer filter
    if (filters.customer && filters.customer !== 'All Customers') {
      list = list.filter(prop => getClientName(prop) === filters.customer);
    }

    // Min Value
    if (filters.minValue) {
      const min = parseFloat(filters.minValue);
      if (!isNaN(min)) {
        list = list.filter(prop => (prop.totalAmount || 0) >= min);
      }
    }

    // Max Value
    if (filters.maxValue) {
      const max = parseFloat(filters.maxValue);
      if (!isNaN(max)) {
        list = list.filter(prop => (prop.totalAmount || 0) <= max);
      }
    }

    // Quick filter
    if (filters.quickFilter) {
      if (filters.quickFilter === 'Drafts') {
        list = list.filter(p => (p.status || '').toLowerCase().includes('draft'));
      } else if (filters.quickFilter === 'Approved') {
        list = list.filter(p => (p.status || '').toLowerCase().includes('approved') || (p.status || '').toLowerCase().includes('accepted'));
      } else if (filters.quickFilter === 'High Value') {
        list = list.filter(p => (p.totalAmount || 0) >= 100000);
      }
    }

    // Sorting
    return list.sort((a, b) => {
      const valA = a.totalAmount || 0;
      const valB = b.totalAmount || 0;
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      switch (activeSort) {
        case 'Newest First':
          return (dateB - dateA) || getPropNumber(b).localeCompare(getPropNumber(a));
        case 'Oldest First':
          return (dateA - dateB) || getPropNumber(a).localeCompare(getPropNumber(b));
        case 'Recently Updated':
          return (dateB - dateA) || getPropNumber(b).localeCompare(getPropNumber(a));
        case 'Proposal Number':
          return getPropNumber(b).localeCompare(getPropNumber(a), undefined, { numeric: true });
        case 'Customer Name':
        case 'Client Name':
          return getClientName(a).localeCompare(getClientName(b));
        case 'Value High → Low':
        case 'Budget High → Low':
          return valB - valA;
        case 'Value Low → High':
        case 'Budget Low → High':
          return valA - valB;
        default:
          return 0;
      }
    });
  }, [proposals, searchTerm, filters, activeSort]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('draft')) return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    if (s.includes('sent') || s.includes('review')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    if (s.includes('accepted') || s.includes('approved')) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (s.includes('rejected')) return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400';
    if (s.includes('converted')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  };

  const handleExportExcel = () => {
    try {
      const dataToExport = filteredAndSortedProposals.length > 0 ? filteredAndSortedProposals : proposals;
      if (dataToExport.length === 0) {
        toast({ title: "No Data", description: "There are no records to export." });
        return;
      }

      const exportData = dataToExport.map(prop => ({
        "Proposal Number": getPropNumber(prop),
        "Proposal Name": prop.title || 'Standard Proposal',
        "Customer": getClientName(prop),
        "Status": prop.status,
        "Total Value": prop.totalAmount || 0,
        "Currency": "USD",
        "Created Date": prop.issueDate || prop.createdAt ? new Date(prop.createdAt).toLocaleDateString() : 'N/A'
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Proposals");
      XLSX.writeFile(workbook, `Proposals_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({ title: "Success", description: "Proposals exported to Excel successfully." });
    } catch (error: any) {
      toast({ title: "Export Failed", description: error.message || "Unable to export proposals.", variant: "destructive" });
    }
  };

  const handleExportPDF = () => {
    try {
      const dataToExport = filteredAndSortedProposals.length > 0 ? filteredAndSortedProposals : proposals;
      if (dataToExport.length === 0) {
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
      doc.text('PROJECT PROPOSALS REPORT', 14, 25);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 14, 25, { align: 'right' });

      const tableColumn = ["Proposal No", "Title / Scope", "Customer", "Status", "Total Value"];
      const tableRows = dataToExport.map(prop => [
        getPropNumber(prop),
        prop.title || 'Standard Proposal',
        getClientName(prop),
        prop.status,
        `$${(prop.totalAmount || 0).toLocaleString()}`
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: 255 },
        styles: { fontSize: 9 }
      });

      doc.save(`Proposals_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast({ title: "Success", description: "Proposals report PDF downloaded successfully." });
    } catch (error: any) {
      toast({ title: "Export Failed", description: error.message || "Unable to export proposals.", variant: "destructive" });
    }
  };

  const generateSingleProposalPDF = (prop: Quotation) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const primaryColor: [number, number, number] = [41, 128, 185];

      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('PROJECT PROPOSAL', 14, 25);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 14, 25, { align: 'right' });

      doc.setTextColor(50, 50, 50);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Proposal: ${getPropNumber(prop)}`, 14, 52);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Title: ${prop.title || 'Untitled'}`, 14, 60);
      doc.text(`Client: ${getClientName(prop)}`, 14, 68);
      doc.text(`Status: ${prop.status || 'Draft'}`, 14, 76);
      doc.text(`Total Value: $${(prop.totalAmount || 0).toLocaleString()}`, 14, 84);

      if (prop.notes) {
        doc.text(`Notes / Scope: ${prop.notes}`, 14, 94);
      }

      doc.save(`${getPropNumber(prop)}_Summary.pdf`);
      toast({ title: "Success", description: "Proposal PDF downloaded successfully." });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Export Failed", description: err.message || "Failed to generate PDF", variant: "destructive" });
    }
  };

  const handleAction = async (action: string, prop: Quotation) => {
    if (action === 'edit') {
      navigate(`/dashboard/${businessId}/project-operations/proposals/create?edit=${prop.id}`);
    } else if (action === 'approve') {
      try {
        const res = await proposalsAPI.approveProposal(businessId, prop.id);
        toast({ title: "Approved", description: res.message || "Proposal approved successfully." });
        setProposals(prev => prev.map(p => p.id === prop.id ? { ...p, status: 'APPROVED' } : p));
      } catch (err: any) {
        toast({ title: "Approval Failed", description: err.message || "Could not approve proposal.", variant: "destructive" });
      }
    } else if (action === 'reject') {
      try {
        const res = await proposalsAPI.rejectProposal(businessId, prop.id);
        toast({ title: "Rejected", description: res.message || "Proposal rejected successfully." });
        setProposals(prev => prev.map(p => p.id === prop.id ? { ...p, status: 'REJECTED' } : p));
      } catch (err: any) {
        toast({ title: "Rejection Failed", description: err.message || "Could not reject proposal.", variant: "destructive" });
      }
    } else if (action === 'convert') {
      navigate(`/dashboard/${businessId}/project-operations/projects/create?proposalId=${prop.id}`);
    } else if (action === 'delete') {
      if (!window.confirm(`Are you sure you want to delete proposal ${getPropNumber(prop)}?`)) return;
      try {
        const res = await proposalsAPI.deleteProposal(businessId, prop.id);
        toast({ title: "Deleted", description: res.message || "Proposal deleted successfully." });
        setProposals(prev => prev.filter(p => p.id !== prop.id));
      } catch (err: any) {
        toast({ title: "Delete Failed", description: err.message || "Could not delete proposal.", variant: "destructive" });
      }
    }
  };

  const sortOptions = [
    { id: 'Newest First', label: 'Newest First' },
    { id: 'Oldest First', label: 'Oldest First' },
    { id: 'Recently Updated', label: 'Recently Updated' },
    { id: 'Proposal Number', label: 'Proposal Number' },
    { id: 'Customer Name', label: 'Customer Name' },
    { id: 'Value High → Low', label: 'Value High → Low' },
    { id: 'Value Low → High', label: 'Value Low → High' }
  ];

  const draftCount = proposals.filter(e => (e.status || '').toLowerCase().includes('draft')).length;
  const sentCount = proposals.filter(e => (e.status || '').toLowerCase().includes('sent')).length;
  const approvedCount = proposals.filter(e => (e.status || '').toLowerCase().includes('accepted') || (e.status || '').toLowerCase().includes('approved')).length;
  const winRate = proposals.length > 0 ? Math.round((approvedCount / proposals.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Proposals</h1>
            <p className="text-sm text-gray-500 mt-1">Generate, track, and manage client-facing project proposals.</p>
          </div>
          <div className="flex gap-2">
            {hasExportPermission && (
              <>
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
              </>
            )}
            {hasCreatePermission && (
              <button
                onClick={() => navigate(`/dashboard/${businessId}/project-operations/proposals/create`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm ml-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> New Proposal
              </button>
            )}
          </div>
        </div>
      </div>

      <div data-lenis-prevent className="flex-1 overflow-y-auto p-6 space-y-5 pb-16">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2 flex-none">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-4 shadow-xs">
            <div className="p-3 bg-gray-50 text-gray-600 dark:bg-gray-800 rounded-lg">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Draft Proposals</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{draftCount}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-4 shadow-xs">
            <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-900/30 rounded-lg">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Sent to Client</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{sentCount}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-4 shadow-xs">
            <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Approved</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{approvedCount}</h3>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-4 rounded-xl border border-transparent flex flex-col justify-center items-start text-white shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Win Rate</p>
            <h3 className="text-2xl font-bold">{winRate}%</h3>
          </div>
        </div>

        {/* Search, Filter & Sort Actions */}
        <div className="flex flex-col gap-3 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex-none z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search proposals (e.g. PRP-12345)..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-1 focus:ring-blue-500 transition-all outline-none text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="text-xs text-gray-400 font-medium whitespace-nowrap hidden md:block">
                Showing {filteredAndSortedProposals.length} of {proposals.length} Proposals
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

          {/* Active Chips */}
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
              {(filters.minValue || filters.maxValue) && (
                <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs font-semibold border border-blue-100 dark:border-blue-800">
                  <span>Value: ${filters.minValue || '0'} - ${filters.maxValue || '∞'}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-blue-900" onClick={() => setFilters(prev => ({ ...prev, minValue: undefined, maxValue: undefined }))} />
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

        {/* List */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <span className="text-gray-500 text-sm">Loading proposals...</span>
              </div>
            ) : filteredAndSortedProposals.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <FileSignature className="w-12 h-12 text-gray-300 mb-3" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">No proposals found</h3>
                <p className="text-gray-500 text-xs max-w-sm mb-4">
                  {activeFilterCount > 0 ? "Try adjusting your search criteria or clear active filters." : "Create your first proposal to get started."}
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
                  {hasCreatePermission && (
                    <button
                      onClick={() => navigate(`/dashboard/${businessId}/project-operations/proposals/create`)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
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
                  {filteredAndSortedProposals.map(prop => {
                    const propNum = getPropNumber(prop);
                    const clientName = getClientName(prop);

                    return (
                      <tr key={prop.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group cursor-pointer" onClick={() => navigate(`/dashboard/${businessId}/project-operations/proposals/${prop.id}`)}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center shrink-0">
                              <FileSignature className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-semibold text-gray-900 dark:text-gray-100 uppercase block">{propNum}</span>
                              <span className="text-[10px] text-gray-400">v1.0</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {prop.title || 'General Services Proposal'}
                          </div>
                          <div className="text-xs text-gray-400 truncate max-w-[240px]">
                            {prop.notes || 'Full project execution strategy and cost breakdown.'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-medium">
                          {clientName}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${getStatusColor(prop.status)}`}>
                            {prop.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-gray-100">
                          ${(prop.totalAmount || 0).toLocaleString()}
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
                                onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/${businessId}/project-operations/proposals/${prop.id}`); }}
                                className="w-full px-3 py-2 text-xs rounded-md flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 shrink-0" />
                                <span>View Proposal</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); handleAction('edit', prop); }}
                                className="w-full px-3 py-2 text-xs rounded-md flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5 shrink-0" />
                                <span>Edit Proposal</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); generateSingleProposalPDF(prop); }}
                                className="w-full px-3 py-2 text-xs rounded-md flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5 shrink-0" />
                                <span>Download PDF</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `mailto:${prop.customer?.email || ''}?subject=Project Proposal - ${getPropNumber(prop)}&body=Hello, please find the proposal details attached.`;
                                }}
                                className="w-full px-3 py-2 text-xs rounded-md flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                              >
                                <Mail className="w-3.5 h-3.5 shrink-0" />
                                <span>Email Proposal</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1 bg-gray-100 dark:border-gray-800" />
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); handleAction('approve', prop); }}
                                className="w-full px-3 py-2 text-xs rounded-md flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <span>Approve Internally</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); handleAction('reject', prop); }}
                                className="w-full px-3 py-2 text-xs rounded-md flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold hover:bg-rose-50 dark:hover:bg-rose-900/20 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>Reject Proposal</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/dashboard/${businessId}/project-operations/negotiations/create?proposalId=${prop.id}&proposalNo=${propNum}`);
                                }}
                                className="w-full px-3 py-2 text-xs rounded-md flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer"
                              >
                                <Handshake className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                                <span>Create Negotiation</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/dashboard/${businessId}/project-operations/contracts/add?fromProposal=${prop.id}&proposalNo=${propNum}`);
                                }}
                                className="w-full px-3 py-2 text-xs rounded-md flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer"
                              >
                                <FileCheck className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                                <span>Create Contract</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); handleAction('convert', prop); }}
                                className="w-full px-3 py-2 text-xs rounded-md flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                                <span>Convert to Project</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1 bg-gray-100 dark:border-gray-800" />
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); handleAction('delete', prop); }}
                                className="w-full px-3 py-2 text-xs rounded-md flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                <span>Delete Proposal</span>
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
                    { id: 'Approved', label: 'Approved' },
                    { id: 'High Value', label: 'High Value (> $100k)' }
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
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Customer / Client</h3>
                <div>
                  <select
                    value={tempFilters.customer || ''}
                    onChange={e => setTempFilters(prev => ({ ...prev, customer: e.target.value || undefined }))}
                    className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none text-gray-900 dark:text-gray-100"
                  >
                    <option value="">All Customers</option>
                    {uniqueClients.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Status</h3>
                <div className="flex flex-wrap gap-2">
                  {['All', 'Draft', 'Sent', 'Approved', 'Rejected', 'Converted'].map(s => {
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

              {/* Value Range */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Value Range</h3>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input
                      type="number"
                      placeholder="Min"
                      value={tempFilters.minValue || ''}
                      onChange={e => setTempFilters(prev => ({ ...prev, minValue: e.target.value || undefined }))}
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
                      value={tempFilters.maxValue || ''}
                      onChange={e => setTempFilters(prev => ({ ...prev, maxValue: e.target.value || undefined }))}
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
