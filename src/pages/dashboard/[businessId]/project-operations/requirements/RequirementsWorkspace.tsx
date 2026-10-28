import React, { useState, useRef, useEffect, useMemo } from 'react';
import {  useNavigate, useParams  } from 'react-router-dom';
import { 
  Search, Filter, MoreVertical, Layout, AlignLeft, 
  Calendar, CheckCircle, Clock, FileText, MessageSquare, 
  Paperclip, Activity, Users, Settings2, AlertCircle, DollarSign, Download, Plus,
  Edit3, Copy, Trash2, Archive, Mail, Send, Printer,
  X, ChevronDown, ChevronRight, ArrowDownUp, Save as SaveIcon, SlidersHorizontal, Tag, ArrowLeft
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { projectOperationsAPI } from '@/lib/api/project-operations';
import { toast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export default function RequirementsWorkspace({ businessId: propBusinessId, id: propId }: { businessId?: string, id?: string }) {
  const navigate = useNavigate();
  const params = useParams();
  const businessId = (propBusinessId || params?.businessId) as string;
  const requirementId = propId || params?.id;
  const [requirements, setRequirements] = useState<any[]>([]);
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isLoadingRequirements, setIsLoadingRequirements] = useState(true);
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<{
    customer?: string;
    status?: string;
    priority?: string;
    projectType?: string;
    minBudget?: string;
    maxBudget?: string;
    savedFilter?: string;
  }>({});
  const [tempFilters, setTempFilters] = useState<{
    customer?: string;
    status?: string;
    priority?: string;
    projectType?: string;
    minBudget?: string;
    maxBudget?: string;
    savedFilter?: string;
  }>({});
  const [activeSort, setActiveSort] = useState('Newest First');

  useEffect(() => {
    if (businessId) {
      fetchRequirements();
    }
  }, [businessId]);

  const fetchRequirements = async () => {
    try {
      setIsLoadingRequirements(true);
      const res = await projectOperationsAPI.getRequirements(businessId);
      if (res.success) {
        setRequirements(res.requirements || []);
        if (res.requirements && res.requirements.length > 0 && !selectedReq) {
          const matchingReq = requirementId ? res.requirements.find((r: any) => r.id === requirementId) : null;
          setSelectedReq(matchingReq || res.requirements[0]);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error fetching requirements",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoadingRequirements(false);
    }
  };

  // Distinct customers from requirements
  const uniqueCustomers = useMemo(() => {
    return Array.from(
      new Set(
        requirements
          .map((r: any) => r.customer?.company || r.customer?.name)
          .filter(Boolean)
      )
    ).sort();
  }, [requirements]);

  // Distinct project types from requirements
  const uniqueProjectTypes = useMemo(() => {
    const list = new Set<string>();
    ['Software', 'Basic', 'Consultancy', 'Consulting / Advisory', 'Trading'].forEach(t => list.add(t));
    requirements.forEach((r: any) => {
      if (r.projectType) list.add(r.projectType);
    });
    return Array.from(list).sort();
  }, [requirements]);

  // Filtered and sorted requirements
  const filteredAndSortedRequirements = useMemo(() => {
    let list = [...requirements];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter((r: any) => {
        const title = (r.title || '').toLowerCase();
        const num = (r.requirementNumber || '').toLowerCase();
        const customer = (r.customer?.company || r.customer?.name || '').toLowerCase();
        const status = (r.status || '').toLowerCase();
        const type = (r.projectType || '').toLowerCase();
        const priority = (r.priority || '').toLowerCase();
        return (
          title.includes(term) ||
          num.includes(term) ||
          customer.includes(term) ||
          status.includes(term) ||
          type.includes(term) ||
          priority.includes(term)
        );
      });
    }

    // Customer filter
    if (filters.customer && filters.customer !== 'All Customers') {
      list = list.filter((r: any) => (r.customer?.company || r.customer?.name) === filters.customer);
    }

    // Status filter
    if (filters.status && filters.status !== 'All') {
      const target = filters.status.toLowerCase();
      list = list.filter((r: any) => {
        const s = (r.status || '').toLowerCase();
        if (target === 'review') return s.includes('review');
        if (target === 'new') return s === 'new' || s === 'draft';
        return s === target;
      });
    }

    // Priority filter
    if (filters.priority && filters.priority !== 'All') {
      const targetPriority = filters.priority.toLowerCase();
      list = list.filter((r: any) => (r.priority || '').toLowerCase() === targetPriority);
    }

    // Project Type filter
    if (filters.projectType && filters.projectType !== 'All Types') {
      const targetType = filters.projectType.toLowerCase();
      list = list.filter((r: any) => (r.projectType || '').toLowerCase() === targetType);
    }

    // Min Budget filter
    if (filters.minBudget) {
      const min = parseFloat(filters.minBudget);
      if (!isNaN(min)) {
        list = list.filter((r: any) => {
          const val = parseFloat(String(r.estimatedBudget || r.budgetRange || '0').replace(/[^0-9.-]+/g, '')) || 0;
          return val >= min;
        });
      }
    }

    // Max Budget filter
    if (filters.maxBudget) {
      const max = parseFloat(filters.maxBudget);
      if (!isNaN(max)) {
        list = list.filter((r: any) => {
          const val = parseFloat(String(r.estimatedBudget || r.budgetRange || '0').replace(/[^0-9.-]+/g, '')) || 0;
          return val <= max;
        });
      }
    }

    // Saved Quick filter
    if (filters.savedFilter) {
      if (filters.savedFilter === 'High Priority') {
        list = list.filter((r: any) => ['high', 'critical'].includes((r.priority || '').toLowerCase()));
      } else if (filters.savedFilter === 'Pending Estimates') {
        list = list.filter((r: any) => !r.estimations || r.estimations.length === 0);
      } else if (filters.savedFilter === 'Approved') {
        list = list.filter((r: any) => (r.status || '').toLowerCase() === 'approved');
      }
    }

    // Sorting
    return list.sort((a: any, b: any) => {
      const getVal = (r: any) => parseFloat(String(r.expectedBudget || r.estimatedBudget || r.budgetRange || '0').replace(/[^0-9.-]+/g, '')) || 0;
      switch (activeSort) {
        case 'Newest First': {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return (dateB - dateA) || (b.requirementNumber || '').localeCompare(a.requirementNumber || '', undefined, { numeric: true });
        }
        case 'Oldest First': {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return (dateA - dateB) || (a.requirementNumber || '').localeCompare(b.requirementNumber || '', undefined, { numeric: true });
        }
        case 'Recently Updated': {
          const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          return (dateB - dateA) || (b.requirementNumber || '').localeCompare(a.requirementNumber || '', undefined, { numeric: true });
        }
        case 'Req # High → Low':
        case 'Requirement Number': {
          const numA = a.requirementNumber || '';
          const numB = b.requirementNumber || '';
          return numB.localeCompare(numA, undefined, { numeric: true });
        }
        case 'Req # Low → High': {
          const numA = a.requirementNumber || '';
          const numB = b.requirementNumber || '';
          return numA.localeCompare(numB, undefined, { numeric: true });
        }
        case 'Budget High → Low': {
          return getVal(b) - getVal(a);
        }
        case 'Budget Low → High': {
          return getVal(a) - getVal(b);
        }
        case 'Alphabetical A-Z': {
          return (a.title || '').localeCompare(b.title || '');
        }
        case 'Alphabetical Z-A': {
          return (b.title || '').localeCompare(a.title || '');
        }
        default:
          return 0;
      }
    });
  }, [requirements, searchTerm, filters, activeSort]);

  // Keep selectedReq in sync if current selected item is filtered out
  useEffect(() => {
    if (filteredAndSortedRequirements.length > 0) {
      if (!selectedReq || !filteredAndSortedRequirements.some((r: any) => r.id === selectedReq.id)) {
        setSelectedReq(filteredAndSortedRequirements[0]);
      }
    }
  }, [filteredAndSortedRequirements]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // Header PDF Export matching Customer Inquiries PDF styling
  const handleExportPDF = () => {
    try {
      const dataToExport = filteredAndSortedRequirements.length > 0 ? filteredAndSortedRequirements : requirements;
      if (!dataToExport || dataToExport.length === 0) {
        toast({ title: 'Export Failed', description: 'No requirements data available to export.', variant: 'destructive' });
        return;
      }
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const primaryColor: [number, number, number] = [41, 128, 185];

      // Header Banner
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('PROJECT REQUIREMENTS', 14, 25);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 14, 25, { align: 'right' });

      // Table
      const tableColumn = ["ID", "Title", "Customer", "Status", "Priority", "Budget", "Date"];
      const tableRows = dataToExport.map((req: any) => [
        req.requirementNumber || req.id?.slice(0, 8) || 'N/A',
        req.title || 'N/A',
        req.customer?.company || req.customer?.name || 'N/A',
        req.status || 'N/A',
        req.priority || 'N/A',
        req.budgetRange || req.estimatedBudget ? (String(req.budgetRange || req.estimatedBudget).startsWith('$') ? String(req.budgetRange || req.estimatedBudget) : `$${req.budgetRange || req.estimatedBudget}`) : 'TBD',
        req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'N/A'
      ]);

      autoTable(doc, { 
        head: [tableColumn], 
        body: tableRows, 
        startY: 50,
        theme: 'grid',
        headStyles: { fillColor: primaryColor }
      });
      doc.save("Requirements_Report.pdf");
      toast({ title: 'Success', description: 'PDF exported successfully.' });
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Export Failed', description: err.message || 'An error occurred during PDF generation', variant: 'destructive' });
    }
  };

  // Single Requirement PDF export
  const handleExportSingleReqPDF = (req: any) => {
    if (!req) return;
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
      doc.text(req.requirementNumber || 'REQUIREMENT DETAILS', 14, 22);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(req.title || '', 14, 32);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 14, 25, { align: 'right' });

      // Details Table
      const detailsRows = [
        ['Requirement Number', req.requirementNumber || '-'],
        ['Title', req.title || '-'],
        ['Customer', req.customer?.company || req.customer?.name || '-'],
        ['Status', req.status || '-'],
        ['Priority', req.priority || '-'],
        ['Project Type', req.projectType || '-'],
        ['Execution Type', req.executionType || '-'],
        ['Estimated Budget', req.budgetRange || req.estimatedBudget ? `$${req.budgetRange || req.estimatedBudget}` : 'TBD'],
        ['Target Start Date', req.targetStartDate ? new Date(req.targetStartDate).toLocaleDateString() : '-'],
        ['Target End Date', req.targetEndDate ? new Date(req.targetEndDate).toLocaleDateString() : '-'],
        ['Description', req.description || req.businessRequirement || 'No description provided.'],
        ['Scope Summary', req.scopeSummary || '-'],
      ];

      autoTable(doc, {
        body: detailsRows,
        startY: 50,
        theme: 'grid',
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: [245, 247, 250], cellWidth: 55 },
          1: { cellWidth: 'auto' }
        }
      });

      doc.save(`Requirement_${req.requirementNumber || req.id?.slice(0, 8)}.pdf`);
      toast({ title: 'Success', description: 'Requirement PDF generated.' });
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Export Failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleExportExcel = () => {
    try {
      const dataToExport = filteredAndSortedRequirements.length > 0 ? filteredAndSortedRequirements : requirements;
      if (!dataToExport || dataToExport.length === 0) {
        toast({ title: 'Export Failed', description: 'No requirements data available to export.', variant: 'destructive' });
        return;
      }
      const ws = XLSX.utils.json_to_sheet(dataToExport.map((req: any) => ({
        ID: req.requirementNumber || req.id?.slice(0, 8) || 'N/A',
        Title: req.title || 'N/A',
        Customer: req.customer?.company || req.customer?.name || 'N/A',
        Status: req.status || 'N/A',
        Priority: req.priority || 'N/A',
        Budget: req.budgetRange || req.estimatedBudget || 'TBD',
        Date: req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'N/A'
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Requirements");
      XLSX.writeFile(wb, "Requirements_Report.xlsx");
      toast({ title: 'Success', description: 'Excel exported successfully.' });
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Export Failed', description: err.message || 'An error occurred during Excel generation', variant: 'destructive' });
    }
  };

  const handleSelectReq = (req: any) => {
    if (selectedReq?.id === req.id) return;
    setIsLoadingDetails(true);
    setSelectedReq(req);
    setTimeout(() => {
      setIsLoadingDetails(false);
    }, 300);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layout },
    { id: 'details', label: 'Details', icon: AlignLeft },
    { id: 'meetings', label: 'Meetings', icon: Users },
    { id: 'scope', label: 'Scope', icon: Settings2 },
    { id: 'deliverables', label: 'Deliverables', icon: CheckCircle },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'activities', label: 'Activities', icon: Activity },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'comments', label: 'Comments', icon: MessageSquare },
    { id: 'attachments', label: 'Attachments', icon: Paperclip },
  ];

  return (
    <div className="flex flex-col min-h-full w-full min-w-0 bg-gray-50 dark:bg-gray-950">
      
      {/* Top Header */}
      <div className="flex-none px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm z-10">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          <span>Project Operations</span><span>/</span><span>Pre-Sales</span><span>/</span><span className="text-blue-600 dark:text-blue-400">Requirements</span>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Requirements Workspace</h1>
            <p className="text-sm text-gray-500 mt-1">Manage all your project requirements in one place.</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 border border-green-600 text-green-600 dark:border-green-500 dark:text-green-500 bg-white dark:bg-gray-900 rounded-lg text-sm font-medium hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" /> Excel
            </button>
            <button 
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 border border-red-600 text-red-600 dark:border-red-500 dark:text-red-500 bg-white dark:bg-gray-900 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm cursor-pointer"
            >
              <FileText className="w-4 h-4" /> PDF
            </button>
            <button 
              onClick={() => { if(businessId) navigate(`/dashboard/${businessId}/project-operations/requirements/create`) }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> New Requirement
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-[calc(100vh-11rem)] min-w-0">
      {/* LEFT PANE: Fixed Width Sidebar */}
      <div className="w-[360px] flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col shadow-sm relative z-20 sticky top-0 self-start max-h-[calc(100vh-4.25rem)]">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex-none space-y-3">
          {requirementId && (
            <button 
              onClick={() => navigate(`/dashboard/${businessId}/project-operations/requirements`)}
              className="flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Requirements
            </button>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search requirements..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-transparent rounded-lg text-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all outline-none"
            />
          </div>
          
          {/* Active Filter Chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-1.5 pb-1">
              {filters.customer && (
                <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-[10px] font-semibold border border-blue-100 dark:border-blue-800">
                  <span>Customer: {filters.customer}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-blue-900" onClick={() => setFilters(prev => ({ ...prev, customer: undefined }))} />
                </div>
              )}
              {filters.status && (
                <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-[10px] font-semibold border border-blue-100 dark:border-blue-800">
                  <span>Status: {filters.status}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-blue-900" onClick={() => setFilters(prev => ({ ...prev, status: undefined }))} />
                </div>
              )}
              {filters.priority && (
                <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-[10px] font-semibold border border-blue-100 dark:border-blue-800">
                  <span>Priority: {filters.priority}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-blue-900" onClick={() => setFilters(prev => ({ ...prev, priority: undefined }))} />
                </div>
              )}
              {filters.projectType && (
                <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-[10px] font-semibold border border-blue-100 dark:border-blue-800">
                  <span>Type: {filters.projectType}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-blue-900" onClick={() => setFilters(prev => ({ ...prev, projectType: undefined }))} />
                </div>
              )}
              {(filters.minBudget || filters.maxBudget) && (
                <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-[10px] font-semibold border border-blue-100 dark:border-blue-800">
                  <span>Budget: ${filters.minBudget || '0'} - ${filters.maxBudget || '∞'}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-blue-900" onClick={() => setFilters(prev => ({ ...prev, minBudget: undefined, maxBudget: undefined }))} />
                </div>
              )}
              {filters.savedFilter && (
                <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-[10px] font-semibold border border-blue-100 dark:border-blue-800">
                  <span>{filters.savedFilter}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-blue-900" onClick={() => setFilters(prev => ({ ...prev, savedFilter: undefined }))} />
                </div>
              )}
              <button onClick={() => setFilters({})} className="text-[10px] text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 px-1 font-medium cursor-pointer">Clear All</button>
            </div>
          )}

          <div className="flex gap-2 relative">
            <button 
              onClick={() => {
                setTempFilters({ ...filters });
                setIsFilterOpen(true);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium border rounded-md transition-colors cursor-pointer ${activeFilterCount > 0 ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              <Filter className="w-3.5 h-3.5" /> 
              <span>Filters</span> 
              {activeFilterCount > 0 && (
                <span className="ml-1 bg-blue-600 text-white rounded-full w-4 h-4 inline-flex items-center justify-center text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
            
            <div className="flex-1">
              <DropdownMenu open={isSortOpen} onOpenChange={setIsSortOpen}>
                <DropdownMenuTrigger asChild>
                  <button 
                    type="button"
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium border rounded-md transition-colors focus:outline-none cursor-pointer ${activeSort !== 'Newest First' ? 'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <ArrowDownUp className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">{activeSort}</span>
                    </span>
                    <ChevronDown className="w-3 h-3 text-gray-400 shrink-0 ml-1" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={4} className="w-56 p-1 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-50">
                  {[
                    { id: 'Newest First', label: 'Newest First' },
                    { id: 'Oldest First', label: 'Oldest First' },
                    { id: 'Recently Updated', label: 'Recently Updated' },
                    { id: 'Req # High → Low', label: 'Req # High → Low' },
                    { id: 'Req # Low → High', label: 'Req # Low → High' },
                    { id: 'Budget High → Low', label: 'Budget High → Low' },
                    { id: 'Budget Low → High', label: 'Budget Low → High' },
                    { id: 'Alphabetical A-Z', label: 'Alphabetical A-Z' },
                    { id: 'Alphabetical Z-A', label: 'Alphabetical Z-A' },
                  ].map(item => (
                    <DropdownMenuItem 
                      key={item.id} 
                      onClick={() => { setActiveSort(item.id); setIsSortOpen(false); }} 
                      className={`w-full px-3 py-2 text-xs rounded-md flex items-center justify-between cursor-pointer ${activeSort === item.id ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-bold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                      <span>{item.label}</span>
                      {activeSort === item.id && <CheckCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="text-xs text-gray-400 font-medium">
            Showing {filteredAndSortedRequirements.length} of {requirements.length} Requirements
          </div>
        </div>
        
        {/* Independent Vertical Scroll for Left Sidebar */}
        <div data-lenis-prevent className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
          {isLoadingRequirements ? (
            <div className="flex justify-center items-center h-32">
              <span className="text-gray-500 text-sm">Loading requirements...</span>
            </div>
          ) : filteredAndSortedRequirements.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500">
              <p className="text-sm font-medium mb-1">No requirements found</p>
              <p className="text-xs text-gray-400 mb-3">Try adjusting your search or filters.</p>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => { setSearchTerm(''); setFilters({}); }}
                  className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            filteredAndSortedRequirements.map((req: any) => (
              <div 
                key={req.id} 
                onClick={() => handleSelectReq(req)}
                className={`p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-colors ${
                  selectedReq?.id === req.id 
                    ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-l-blue-600' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-l-4 border-l-transparent'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-gray-500">{req.requirementNumber}</span>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                    req.status === 'Draft' || req.status === 'New' ? 'bg-gray-100 text-gray-700' :
                    req.status === 'Review' || req.status === 'Under Review' ? 'bg-orange-100 text-orange-700' :
                    req.status === 'Approved' ? 'bg-green-100 text-green-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {req.status || 'Draft'}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate mb-1">{req.title}</h4>
                <p className="text-xs text-gray-500 mb-2 truncate">{req.customer?.company || req.customer?.name || 'No Customer'}</p>
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(req.createdAt).toLocaleDateString()}</span>
                  <span className="font-medium text-gray-600 dark:text-gray-300">{req.budgetRange || req.estimatedBudget || 'TBD'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANE: Expanding Content Area */}
      <div data-lenis-prevent className="flex-1 min-w-0 w-auto flex flex-col bg-white dark:bg-gray-900">
        {selectedReq ? (
          <>
            {/* Header Area - Fixed at top */}
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex flex-col gap-4 flex-none bg-white dark:bg-gray-900 min-w-0 w-auto sticky top-0 z-20 shadow-xs">
              {/* Row 1: Title */}
              <div className="flex items-center gap-3 min-w-0">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">{selectedReq.title}</h2>
                <span className="px-3 py-1 text-xs uppercase font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full flex-shrink-0">
                  {selectedReq.requirementNumber}
                </span>
              </div>

              {/* Row 2: Metadata */}
              <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-2 truncate"><Users className="w-4 h-4 flex-shrink-0" /> <span className="truncate">{selectedReq.customer?.company || selectedReq.customer?.name || 'No Customer'}</span></span>
                <span className="flex items-center gap-2 whitespace-nowrap"><AlertCircle className="w-4 h-4 flex-shrink-0" /> Priority: {selectedReq.priority || 'Medium'}</span>
                <span className="flex items-center gap-2 whitespace-nowrap"><DollarSign className="w-4 h-4 flex-shrink-0" /> Budget: {selectedReq.budgetRange || selectedReq.estimatedBudget || 'TBD'}</span>
              </div>

              {/* Row 3: Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button 
                  onClick={() => { if(businessId) navigate(`/dashboard/${businessId}/project-operations/estimations/create?requirementId=${selectedReq?.id}`) }}
                  className="px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  Create Estimate
                </button>
                <button 
                  onClick={() => { if(businessId) navigate(`/dashboard/${businessId}/project-operations/projects/create?requirementId=${selectedReq?.id}`) }}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-sm transition-colors whitespace-nowrap cursor-pointer"
                >
                  Convert to Project
                </button>
                
                {/* Clean DropdownMenu rendered via Portal to avoid overlapping tabs */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button 
                      title="More Actions"
                      className="h-9 w-9 p-0 flex items-center justify-center border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer text-gray-700 dark:text-gray-300 focus:outline-none shrink-0"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent 
                    align="end" 
                    side="bottom"
                    sideOffset={6}
                    className="w-56 p-1.5 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-50 text-left"
                  >
                    <p className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">General</p>
                    
                    <DropdownMenuItem 
                      onClick={() => navigate(`/dashboard/${businessId}/project-operations/requirements/${selectedReq?.id}/edit`)}
                      className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg cursor-pointer text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>Edit Requirement</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem 
                      onClick={() => navigate(`/dashboard/${businessId}/project-operations/requirements/${selectedReq?.id}`)}
                      className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg cursor-pointer text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800"
                    >
                      <Layout className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>View Requirement</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem 
                      onClick={() => {
                        navigator.clipboard.writeText(selectedReq?.requirementNumber || selectedReq?.id);
                        toast({ title: "Copied!", description: "Requirement ID copied to clipboard" });
                      }}
                      className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg cursor-pointer text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800"
                    >
                      <Copy className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>Copy Requirement ID</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="my-1 border-t border-gray-100 dark:border-gray-800" />

                    <p className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Workflow</p>

                    <DropdownMenuItem 
                      onClick={() => navigate(`/dashboard/${businessId}/project-operations/estimations/create?requirementId=${selectedReq?.id}`)}
                      className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg cursor-pointer text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800"
                    >
                      <DollarSign className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>Create Estimate</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem 
                      onClick={() => navigate(`/dashboard/${businessId}/project-operations/proposals/create?requirementId=${selectedReq?.id}`)}
                      className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg cursor-pointer text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800"
                    >
                      <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>Create Proposal</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem 
                      onClick={() => navigate(`/dashboard/${businessId}/project-operations/projects/create?requirementId=${selectedReq?.id}`)}
                      className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg cursor-pointer text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800"
                    >
                      <Layout className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>Convert to Project</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="my-1 border-t border-gray-100 dark:border-gray-800" />

                    <p className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Communication & Export</p>

                    <DropdownMenuItem 
                      onClick={() => handleExportSingleReqPDF(selectedReq)}
                      className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg cursor-pointer text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800"
                    >
                      <Printer className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>Export Requirement PDF</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="my-1 border-t border-gray-100 dark:border-gray-800" />

                    <p className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Management</p>

                    <DropdownMenuItem 
                      variant="destructive"
                      onClick={() => {
                        toast({ title: "Coming soon", description: "Delete requirement functionality is not yet available." });
                      }}
                      className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg cursor-pointer focus:bg-red-50 dark:focus:bg-red-950/30 focus:text-red-600 dark:focus:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Tabs Navigation - Fixed below header */}
            <div className="px-6 border-b border-gray-200 dark:border-gray-800 flex overflow-x-auto scrollbar-hide flex-none bg-gray-50/50 dark:bg-gray-900/50 min-w-0 w-auto sticky top-[138px] z-10 shadow-xs">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                      isActive 
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Main Content Area */}
            <div data-lenis-prevent className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              {isLoadingDetails ? (
                <div className="flex justify-center items-center h-48">
                  <span className="text-gray-500">Loading requirement details...</span>
                </div>
              ) : (
                <>
                  {activeTab === 'overview' && <OverviewTab req={selectedReq} />}
                  {activeTab === 'details' && <DetailsTab req={selectedReq} />}
                  {activeTab === 'meetings' && <MeetingsTab req={selectedReq} />}
                  {activeTab === 'scope' && <ScopeTab req={selectedReq} />}
                  {activeTab === 'deliverables' && <DeliverablesTab req={selectedReq} />}
                  {activeTab === 'documents' && <DocumentsTab req={selectedReq} />}
                  {activeTab === 'activities' && <ActivitiesTab req={selectedReq} />}
                  {activeTab === 'timeline' && <TimelineTab req={selectedReq} />}
                  {activeTab === 'comments' && <CommentsTab req={selectedReq} />}
                  {activeTab === 'attachments' && <AttachmentsTab req={selectedReq} />}
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
            <Layout className="w-12 h-12 mb-3 text-gray-300" />
            <p className="text-base font-medium">Select a requirement to view details</p>
            <p className="text-xs text-gray-400 mt-1">Or create a new requirement from the top right button.</p>
          </div>
        )}
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
                <button onClick={() => setIsFilterOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
              {/* Saved Filters */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Filters</h3>
                <div className="flex flex-wrap gap-2">
                  <button 
                    type="button"
                    onClick={() => setTempFilters(prev => ({ ...prev, priority: prev.priority === 'High' ? undefined : 'High' }))} 
                    className={`px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors cursor-pointer ${tempFilters.priority === 'High' ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'}`}
                  >
                    High Priority
                  </button>
                  <button 
                    type="button"
                    onClick={() => setTempFilters(prev => ({ ...prev, status: prev.status === 'Approved' ? undefined : 'Approved' }))} 
                    className={`px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors cursor-pointer ${tempFilters.status === 'Approved' ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'}`}
                  >
                    Approved
                  </button>
                  <button 
                    type="button"
                    onClick={() => setTempFilters(prev => ({ ...prev, savedFilter: prev.savedFilter === 'Pending Estimates' ? undefined : 'Pending Estimates' }))} 
                    className={`px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors cursor-pointer ${tempFilters.savedFilter === 'Pending Estimates' ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'}`}
                  >
                    Pending Estimates
                  </button>
                </div>
              </div>

              {/* General Filters */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">General</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Customer</label>
                    <select 
                      value={tempFilters.customer || ''} 
                      onChange={e => setTempFilters(prev => ({ ...prev, customer: e.target.value || undefined }))} 
                      className="mt-1 w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none text-gray-900 dark:text-gray-100"
                    >
                      <option value="">All Customers</option>
                      {uniqueCustomers.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Status & Priority */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Status & Priority</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Status</label>
                    <div className="flex flex-wrap gap-2">
                      {['All', 'Draft', 'New', 'Review', 'Approved', 'Estimate Created', 'Proposal Sent', 'Won', 'Lost'].map(s => {
                        const isSelected = (s === 'All' && !tempFilters.status) || tempFilters.status === s;
                        return (
                          <button 
                            type="button"
                            key={s} 
                            onClick={() => setTempFilters(prev => ({ ...prev, status: s === 'All' ? undefined : s }))}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                              isSelected 
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
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Priority</label>
                    <div className="flex flex-wrap gap-2">
                      {['All', 'Low', 'Medium', 'High', 'Critical'].map(p => {
                        const isSelected = (p === 'All' && !tempFilters.priority) || tempFilters.priority === p;
                        return (
                          <button 
                            type="button"
                            key={p} 
                            onClick={() => setTempFilters(prev => ({ ...prev, priority: p === 'All' ? undefined : p }))}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-blue-600 text-white font-semibold shadow-xs' 
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-transparent'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Classification */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Classification</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Project Type</label>
                    <select 
                      value={tempFilters.projectType || ''} 
                      onChange={e => setTempFilters(prev => ({ ...prev, projectType: e.target.value || undefined }))} 
                      className="mt-1 w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none text-gray-900 dark:text-gray-100"
                    >
                      <option value="">All Types</option>
                      {uniqueProjectTypes.map(pt => (
                        <option key={pt} value={pt}>{pt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Budget */}
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

// ------------------------------------------------------------------
// TAB COMPONENTS
// ------------------------------------------------------------------

const OverviewTab = ({ req }: { req: any }) => (
  <div className="flex flex-col gap-6 min-w-0 w-auto animate-in fade-in duration-300">
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Description</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
        {req.generalNotes || 'No description provided.'}
      </p>
    </div>
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Details</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
        <div className="flex flex-col gap-1 border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-gray-800 pb-3 sm:pb-0 sm:pr-4">
          <span className="text-gray-500">Project Type</span>
          <span className="font-medium">{req.projectType || 'N/A'}</span>
        </div>
        <div className="flex flex-col gap-1 border-b sm:border-b-0 lg:border-r border-gray-100 dark:border-gray-800 pb-3 sm:pb-0 sm:pr-4">
          <span className="text-gray-500">Execution Type</span>
          <span className="font-medium">{req.executionType || 'N/A'}</span>
        </div>
        <div className="flex flex-col gap-1 border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-gray-800 pb-3 sm:pb-0 sm:pr-4">
          <span className="text-gray-500">Assigned To</span>
          <span className="font-medium text-blue-600">{req.assignedEmployee?.user?.name || req.assignedEmployee?.name || 'Unassigned'}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-gray-500">Status</span>
          <span className="font-medium">{req.status || 'Draft'}</span>
        </div>
      </div>
    </div>
  </div>
);

const DetailsTab = ({ req }: { req: any }) => (
  <div className="flex flex-col gap-6 animate-in fade-in duration-300">
    <div className="bg-white p-6 rounded-xl border shadow-sm">
      <h3 className="text-lg font-semibold mb-4 border-b pb-2">Business Information</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div><span className="text-gray-500 block text-xs uppercase mb-1">Company</span><span className="font-medium">{req.customer?.company || req.customer?.name || 'N/A'}</span></div>
        <div><span className="text-gray-500 block text-xs uppercase mb-1">Email</span><span className="font-medium truncate">{req.customer?.email || 'N/A'}</span></div>
        <div><span className="text-gray-500 block text-xs uppercase mb-1">Phone</span><span className="font-medium">{req.customer?.phone || 'N/A'}</span></div>
        <div><span className="text-gray-500 block text-xs uppercase mb-1">Created By</span><span className="font-medium">{req.createdBy || 'System'}</span></div>
      </div>
    </div>
    <div className="bg-white p-6 rounded-xl border shadow-sm">
      <h3 className="text-lg font-semibold mb-4 border-b pb-2">Commercial Details</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        <div><span className="text-gray-500 block text-xs uppercase mb-1">Est. Budget</span><span className="font-medium text-green-600">{req.budgetRange || req.estimatedBudget || 'TBD'}</span></div>
        <div><span className="text-gray-500 block text-xs uppercase mb-1">Target Date</span><span className="font-medium">{req.targetDeliveryDate ? new Date(req.targetDeliveryDate).toLocaleDateString() : 'N/A'}</span></div>
        <div><span className="text-gray-500 block text-xs uppercase mb-1">Priority</span><span className="font-medium">{req.priority || 'N/A'}</span></div>
      </div>
    </div>
  </div>
);

const MeetingsTab = ({ req }: { req: any }) => (
  <div className="flex flex-col gap-6 animate-in fade-in duration-300">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-bold">Scheduled Meetings</h3>
      <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold"><Plus className="w-4 h-4"/> Schedule Meeting</button>
    </div>
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-xl border shadow-sm flex flex-col justify-center items-center text-gray-500 py-10">
        <Calendar className="w-10 h-10 mb-2 opacity-20" />
        <p>No meetings scheduled yet for this requirement.</p>
      </div>
    </div>
  </div>
);

const ScopeTab = ({ req }: { req: any }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
    <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col h-full">
      <h3 className="text-lg font-semibold mb-4 text-green-700 flex items-center gap-2"><CheckCircle className="w-5 h-5"/> In Scope</h3>
      <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
        <li>Finance Module implementation (GL, AR, AP)</li>
        <li>HR Module (Payroll, Attendance, Leave Management)</li>
        <li>Inventory Management System</li>
        <li>Data migration from legacy systems (up to 5 years)</li>
      </ul>
    </div>
    <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col h-full">
      <h3 className="text-lg font-semibold mb-4 text-red-700 flex items-center gap-2"><AlertCircle className="w-5 h-5"/> Out of Scope</h3>
      <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
        <li>Custom mobile application development</li>
        <li>Third-party API integrations (excluding banking)</li>
        <li>Hardware procurement and setup</li>
        <li>Post-go-live support beyond 30 days</li>
      </ul>
    </div>
    <div className="bg-white p-6 rounded-xl border shadow-sm md:col-span-2">
      <h3 className="text-lg font-semibold mb-4">Key Assumptions & Dependencies</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-bold text-sm mb-2 text-gray-700">Assumptions</h4>
          <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
            <li>Client will provide data extracts in CSV format.</li>
            <li>UAT environment will be provided by the client infrastructure team.</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-sm mb-2 text-gray-700">Dependencies</h4>
          <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
            <li>Approval of BRD by project sponsor before development phase.</li>
            <li>Availability of key stakeholders for workshops.</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

const DeliverablesTab = ({ req }: { req: any }) => (
  <div className="bg-white rounded-xl border shadow-sm overflow-hidden animate-in fade-in duration-300">
    <div className="p-6 text-center text-gray-500">
      No deliverables defined yet.
    </div>
  </div>
);

const DocumentsTab = ({ req }: { req: any }) => (
  <div className="flex flex-col gap-6 animate-in fade-in duration-300">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-bold">Project Documents</h3>
      <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold"><Plus className="w-4 h-4"/> Upload Document</button>
    </div>
    <div className="bg-white p-10 rounded-xl border shadow-sm flex flex-col justify-center items-center text-gray-500">
      <FileText className="w-10 h-10 mb-2 opacity-20" />
      <p>No documents attached.</p>
    </div>
  </div>
);

const AttachmentsTab = DocumentsTab;

const ActivitiesTab = ({ req }: { req: any }) => (
  <div className="bg-white p-6 rounded-xl border shadow-sm animate-in fade-in duration-300">
    <h3 className="text-lg font-bold mb-6">Audit Log & Activities</h3>
    <div className="space-y-6">
        <div className="flex gap-4">
          <div className="mt-1"><Activity className="w-4 h-4 text-gray-400" /></div>
          <div>
            <p className="text-sm"><span className="font-bold">System</span> created requirement <span className="font-semibold text-gray-900">{req.requirementNumber}</span></p>
            <p className="text-xs text-gray-500 mt-1">{new Date(req.createdAt).toLocaleString()}</p>
          </div>
        </div>
    </div>
  </div>
);

const TimelineTab = ({ req }: { req: any }) => (
  <div className="p-6 text-center text-gray-500">Timeline not available yet.</div>
);

const CommentsTab = ({ req }: { req: any }) => (
  <div className="p-6 text-center text-gray-500">No comments yet.</div>
);

