import React, { useState, useRef, useEffect } from 'react';
import {  useNavigate, useParams  } from 'react-router-dom';
import { 
  Search, Filter, MoreVertical, Layout, AlignLeft, 
  Calendar, CheckCircle, Clock, FileText, MessageSquare, 
  Paperclip, Activity, Users, Settings2, AlertCircle, DollarSign, Download, Plus,
  Edit3, Copy, Trash2, Archive, Mail, Send, Printer,
  X, ChevronDown, ChevronRight, ArrowDownUp, Save as SaveIcon, SlidersHorizontal, Tag
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { projectOperationsAPI } from '@/lib/api/project-operations';
import { toast } from '@/components/ui/use-toast';

export default function RequirementsWorkspace({ businessId: propBusinessId }: { businessId?: string }) {
  const navigate = useNavigate();
  const params = useParams();
  const businessId = (propBusinessId || params?.businessId) as string;
  const [requirements, setRequirements] = useState<any[]>([]);
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isLoadingRequirements, setIsLoadingRequirements] = useState(true);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [activeSort, setActiveSort] = useState('Newest First');
  
  const menuRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

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
        setRequirements(res.requirements);
        if (res.requirements.length > 0 && !selectedReq) {
          setSelectedReq(res.requirements[0]);
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportPDF = () => {
    try {
      if (!requirements || requirements.length === 0) {
        toast({ title: 'Export Failed', description: 'No requirements data available to export.', variant: 'destructive' });
        return;
      }
      const doc = new jsPDF();
      doc.text("Requirements Report", 14, 15);
      const tableColumn = ["ID", "Title", "Customer", "Status", "Priority", "Budget", "Date"];
      const tableRows = requirements.map(req => [
        req.requirementNumber || 'N/A',
        req.title || 'N/A',
        req.customer?.company || req.customer?.name || 'N/A',
        req.status || 'N/A',
        req.priority || 'N/A',
        req.budgetRange || req.estimatedBudget || 'TBD',
        req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'N/A'
      ]);
      autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
      doc.save("Requirements_Report.pdf");
      toast({ title: 'Success', description: 'PDF exported successfully.' });
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Export Failed', description: err.message || 'An error occurred during PDF generation', variant: 'destructive' });
    }
  };

  const handleExportExcel = () => {
    try {
      if (!requirements || requirements.length === 0) {
        toast({ title: 'Export Failed', description: 'No requirements data available to export.', variant: 'destructive' });
        return;
      }
      const ws = XLSX.utils.json_to_sheet(requirements.map(req => ({
        ID: req.requirementNumber || 'N/A',
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
    // Simulate API fetch delay
    setTimeout(() => {
      setIsLoadingDetails(false);
    }, 500);
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
    <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Header */}
      <div className="flex-none px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          <span>Project Operations</span>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span>Pre-Sales</span>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="text-blue-600 dark:text-blue-400">Requirements</span>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Requirements Workspace</h1>
            <p className="text-sm text-gray-500 mt-1">Manage all your project requirements in one place.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 border border-green-600 text-green-600 dark:border-green-500 dark:text-green-500 bg-white dark:bg-gray-900 rounded-lg text-sm font-medium hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" /> Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 border border-red-600 text-red-600 dark:border-red-500 dark:text-red-500 bg-white dark:bg-gray-900 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm"
            >
              <FileText className="w-4 h-4" /> PDF
            </button>
            <button
              onClick={() => { if(businessId) navigate(`/dashboard/${businessId}/project-operations/requirements/create`) }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Requirement
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* LEFT PANE: Fixed Width Sidebar */}
      <div className="w-[360px] flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col h-full">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex-none space-y-3">
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
          
          {/* Active Chips */}
          {Object.keys(filters).length > 0 && (
            <div className="flex flex-wrap gap-1.5 pb-1">
              {Object.entries(filters).map(([k, v]) => (
                <div key={k} className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-[10px] font-semibold border border-blue-100 dark:border-blue-800">
                  <span>{k}: {v}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-blue-900" onClick={() => {
                    const newF = {...filters}; delete newF[k]; setFilters(newF);
                  }}/>
                </div>
              ))}
              <button onClick={() => setFilters({})} className="text-[10px] text-gray-500 hover:text-gray-800 px-1 font-medium">Clear All</button>
            </div>
          )}

          <div className="flex gap-2 relative">
            <button 
              onClick={() => setIsFilterOpen(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium border rounded-md transition-colors ${Object.keys(filters).length > 0 ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              <Filter className="w-3 h-3" /> Filters {Object.keys(filters).length > 0 && `(${Object.keys(filters).length})`}
            </button>
            <div className="flex-1" ref={sortRef}>
              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <ArrowDownUp className="w-3 h-3" /> Sort
              </button>
              {isSortOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl z-20 overflow-hidden text-xs animate-in fade-in slide-in-from-top-2">
                  <div className="p-1">
                    {['Newest First', 'Oldest First', 'Recently Updated', 'Requirement Number', 'Budget High → Low', 'Budget Low → High', 'Alphabetical A-Z'].map(s => (
                      <button key={s} onClick={() => { setActiveSort(s); setIsSortOpen(false); }} className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 ${activeSort === s ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                        {s} {activeSort === s && <CheckCircle className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="text-xs text-gray-400 font-medium">Showing 48 of 352 Requirements</div>
        </div>
        
        {/* Independent Vertical Scroll for Left Sidebar */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
          {isLoadingRequirements ? (
            <div className="flex justify-center items-center h-32">
              <span className="text-gray-500">Loading requirements...</span>
            </div>
          ) : requirements.length === 0 ? (
            <div className="flex justify-center items-center h-32">
              <span className="text-gray-500">No requirements found.</span>
            </div>
          ) : (
            requirements.map((req: any) => (
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
          )))}
        </div>
      </div>

      {/* RIGHT PANE: Expanding Content Area */}
      <div className="flex-1 min-w-0 w-auto flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden">
        {selectedReq ? (
          <>
            {/* Header Area - Fixed at top */}
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex flex-col gap-4 flex-none bg-white dark:bg-gray-900 min-w-0 w-auto">
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
              <div className="flex flex-wrap gap-2 flex-shrink-0">
                <button 
                  onClick={() => { if(businessId) navigate(`/dashboard/${businessId}/project-operations/estimations/create`) }}
                  className="px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors whitespace-nowrap"
                >
                  Create Estimate
                </button>
                <button 
                  onClick={() => { if(businessId) navigate(`/dashboard/${businessId}/project-operations/projects/create`) }}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-sm transition-colors whitespace-nowrap"
                >
                  Convert to Project
                </button>
                <div className="relative" ref={menuRef}>
                  <button 
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className={`p-2 border rounded-lg transition-colors flex-shrink-0 ${showMoreMenu ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <MoreVertical className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                  </button>
                  
                  {showMoreMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden text-sm animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                        <p className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">General</p>
                        <button className="w-full text-left px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-300"><Edit3 className="w-3.5 h-3.5 text-gray-400"/> Edit Requirement</button>
                        <button className="w-full text-left px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-300"><Layout className="w-3.5 h-3.5 text-gray-400"/> View Requirement</button>
                        <button className="w-full text-left px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-300"><Copy className="w-3.5 h-3.5 text-gray-400"/> Duplicate</button>
                        <button className="w-full text-left px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-300"><CheckCircle className="w-3.5 h-3.5 text-gray-400"/> Copy Requirement ID</button>
                      </div>
                      <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                        <p className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Workflow</p>
                        <button className="w-full text-left px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-300"><DollarSign className="w-3.5 h-3.5 text-gray-400"/> Create Estimate</button>
                        <button className="w-full text-left px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-300"><FileText className="w-3.5 h-3.5 text-gray-400"/> Create Proposal</button>
                        <button className="w-full text-left px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-300"><Calendar className="w-3.5 h-3.5 text-gray-400"/> Schedule Meeting</button>
                        <button className="w-full text-left px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-300"><Users className="w-3.5 h-3.5 text-gray-400"/> Assign BA / PM</button>
                      </div>
                      <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                        <p className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Communication & Export</p>
                        <button className="w-full text-left px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-300"><Mail className="w-3.5 h-3.5 text-gray-400"/> Email Customer</button>
                        <button className="w-full text-left px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-300"><Send className="w-3.5 h-3.5 text-gray-400"/> Request Approval</button>
                        <button className="w-full text-left px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-300"><Printer className="w-3.5 h-3.5 text-gray-400"/> Print / PDF</button>
                      </div>
                      <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                        <p className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Management</p>
                        <button className="w-full text-left px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-300"><AlertCircle className="w-3.5 h-3.5 text-gray-400"/> Change Status</button>
                        <button className="w-full text-left px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg flex items-center gap-2 text-orange-600 dark:text-orange-500"><Archive className="w-3.5 h-3.5 text-orange-500"/> Archive</button>
                        <button className="w-full text-left px-2 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-500"><Trash2 className="w-3.5 h-3.5 text-red-500"/> Delete</button>
                      </div>
                      <div className="p-2 bg-gray-50 dark:bg-gray-800/50">
                        <p className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">History</p>
                        <button className="w-full text-left px-2 py-1.5 hover:bg-white dark:hover:bg-gray-900 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-300"><Activity className="w-3.5 h-3.5 text-gray-400"/> Activity Log</button>
                        <button className="w-full text-left px-2 py-1.5 hover:bg-white dark:hover:bg-gray-900 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-300"><Clock className="w-3.5 h-3.5 text-gray-400"/> Audit Log</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs Navigation - Fixed below header */}
            <div className="px-6 border-b border-gray-200 dark:border-gray-800 flex overflow-x-auto scrollbar-hide flex-none bg-gray-50/50 dark:bg-gray-900/50 min-w-0 w-auto">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                      isActive 
                        ? 'border-blue-600 text-blue-700 dark:text-blue-400 bg-white dark:bg-gray-900 shadow-[0_-2px_0_0_inset_#2563eb]' 
                        : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Independent Vertical Scroll for Right Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 bg-gray-50/30 dark:bg-gray-950/50 min-w-0 w-auto">
              <div className="max-w-6xl mx-auto min-w-0 w-auto">
                {isLoadingDetails ? (
                  <div className="animate-pulse space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 space-y-6">
                        <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                        <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                      </div>
                      <div className="space-y-6">
                        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                      </div>
                    </div>
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
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Layout className="w-12 h-12 mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Requirement Selected</h3>
            <p className="text-sm">Select a requirement from the list to view its workspace.</p>
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
                  <button className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">My Requirements</button>
                  <button className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors">High Priority</button>
                  <button className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors">Pending Estimates</button>
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
                      <option>Global Corp</option>
                      <option>TechStart</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Project Manager</label>
                    <select className="mt-1 w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none">
                      <option>All Managers</option>
                      <option>Sarah Jenkins</option>
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
                      {['New', 'Review', 'Approved', 'Estimate Created', 'Proposal Sent', 'Won', 'Lost'].map(s => (
                        <button key={s} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 border border-transparent focus:border-blue-500 focus:bg-blue-50 focus:text-blue-700 transition-all">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Priority</label>
                    <div className="flex flex-wrap gap-2">
                      {['Low', 'Medium', 'High', 'Critical'].map(p => (
                        <button key={p} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 border border-transparent focus:border-blue-500 focus:bg-blue-50 focus:text-blue-700 transition-all">
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
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
                      <option>Construction</option>
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

              {/* Budget */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Budget Range</h3>
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

              {/* Dates */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Dates</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Quick Filters</label>
                    <select className="mt-1 w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none">
                      <option>Any Time</option>
                      <option>Today</option>
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
                  {['Has Attachments', 'Has Deliverables', 'Has Estimate', 'Pending Approval'].map(t => (
                    <label key={t} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>
            
            <div className="flex-none p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex gap-3">
              <button onClick={() => setFilters({})} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Clear All
              </button>
              <button onClick={() => { setFilters({'Status': 'Review', 'Priority': 'High', 'Budget': '> $50k'}); setIsFilterOpen(false); }} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
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

