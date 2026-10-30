import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, Handshake, TrendingUp, AlertCircle, CalendarClock,
  ArrowRight, Download, FileText, CheckCircle2, SlidersHorizontal,
  Save as SaveIcon, X, MoreVertical, LayoutGrid, List, Eye, Edit, Copy,
  Mail, Calendar, ArrowUpRight, CheckCircle, Ban, Archive, Trash2,
  Printer, FileSignature, Building2, ShieldCheck, DollarSign,
  ChevronLeft, ChevronRight, GripVertical, Sparkles
} from 'lucide-react';
import { negotiationsAPI, Negotiation as Deal } from '@/lib/api/negotiations';
import { useToast } from "@/components/ui/use-toast";
import { useBusinessData } from '@/components/dashboard/business-data-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export function NegotiationsWorkspace({ businessId }: { businessId: string }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { business } = useBusinessData();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const kanbanContainerRef = React.useRef<HTMLDivElement>(null);

  // Kanban Stage Columns
  const KANBAN_STAGES = ['New', 'Discussion', 'Technical Review', 'Commercial Review', 'Client Approval', 'Won', 'Lost'];

  const scrollKanban = (direction: 'left' | 'right') => {
    if (kanbanContainerRef.current) {
      const scrollAmount = 300 * 2;
      kanbanContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollToStage = (stageName: string) => {
    const el = document.getElementById(`kanban-col-${stageName.replace(/\s+/g, '-').toLowerCase()}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  const formatCurrency = (val: number, curr: string = 'USD') => {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: curr, maximumFractionDigits: 0 }).format(val);
    } catch {
      return `${curr} ${(val || 0).toLocaleString()}`;
    }
  };

  const isStageMatch = (dealStage?: string, colStage?: string) => {
    if (!dealStage || !colStage) return false;
    const ds = dealStage.trim().toLowerCase();
    const cs = colStage.trim().toLowerCase();
    if (ds === cs) return true;
    if ((ds === 'closed won' || ds === 'won') && cs === 'won') return true;
    if ((ds === 'closed lost' || ds === 'lost') && cs === 'lost') return true;
    if (ds === 'proposal' && cs === 'technical review') return true;
    if (ds === 'negotiation' && cs === 'commercial review') return true;
    return false;
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchDeals();
  }, [businessId]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const data = await negotiationsAPI.getNegotiations(businessId);
      // Ensure all deals have a valid Kanban stage mapping, default to 'New'
      const mapped = (data.negotiations || data.data || []).map(d => {
        let stage = d.stage || d.status || 'New';
        const sLower = (stage || '').toLowerCase().trim();
        if (sLower === 'proposal') stage = 'Technical Review';
        else if (sLower === 'negotiation') stage = 'Commercial Review';
        else if (sLower === 'closed won' || sLower === 'won') stage = 'Won';
        else if (sLower === 'closed lost' || sLower === 'lost') stage = 'Lost';
        else if (sLower === 'new') stage = 'New';
        else if (sLower === 'discussion') stage = 'Discussion';
        else if (sLower === 'technical review') stage = 'Technical Review';
        else if (sLower === 'commercial review') stage = 'Commercial Review';
        else if (sLower === 'client approval') stage = 'Client Approval';
        return { ...d, stage };
      });
      setDeals(mapped.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error("Error fetching deals:", error);
      toast({ title: "Error", description: "Failed to load negotiations pipeline.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredDeals = deals.filter(deal => {
    const searchLower = debouncedSearch.toLowerCase();
    const dealName = (deal.name || '').toLowerCase();
    const custName = (deal.customer?.name || deal.customer?.company || '').toLowerCase();
    const negNo = (deal.negNumber || '').toLowerCase();

    if (searchLower && !dealName.includes(searchLower) && !custName.includes(searchLower) && !negNo.includes(searchLower)) return false;
    if (filters['Stage'] && !isStageMatch(deal.stage, filters['Stage'])) return false;

    return true;
  });

  const getDealsForStage = (stage: string) => {
    return filteredDeals.filter(d => isStageMatch(d.stage, stage));
  };

  const getStageTotal = (stage: string) => {
    const stageDeals = getDealsForStage(stage);
    return stageDeals.reduce((sum, d) => sum + (d.amount || d.finalAmount || 0), 0);
  };

  const getStageHeaderColor = (stage: string) => {
    const s = stage?.toLowerCase() || '';
    if (s === 'new') return {
      borderTop: 'border-t-4 border-t-purple-500',
      dot: 'bg-purple-500',
      badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
    };
    if (s === 'discussion') return {
      borderTop: 'border-t-4 border-t-blue-500',
      dot: 'bg-blue-500',
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
    };
    if (s.includes('technical')) return {
      borderTop: 'border-t-4 border-t-indigo-500',
      dot: 'bg-indigo-500',
      badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
    };
    if (s.includes('commercial')) return {
      borderTop: 'border-t-4 border-t-amber-500',
      dot: 'bg-amber-500',
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
    };
    if (s.includes('approval')) return {
      borderTop: 'border-t-4 border-t-orange-500',
      dot: 'bg-orange-500',
      badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
    };
    if (s === 'won') return {
      borderTop: 'border-t-4 border-t-emerald-500',
      dot: 'bg-emerald-500',
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
    };
    if (s === 'lost') return {
      borderTop: 'border-t-4 border-t-rose-500',
      dot: 'bg-rose-500',
      badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
    };
    return {
      borderTop: 'border-t-4 border-t-gray-400',
      dot: 'bg-gray-400',
      badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    };
  };

  // KPI Calculations
  const activeNeg = deals.filter(d => !['won', 'lost'].includes((d.stage || '').toLowerCase()));
  const activeValue = activeNeg.reduce((sum, d) => sum + (d.amount || d.finalAmount || 0), 0);
  const wonDeals = deals.filter(d => (d.stage || '').toLowerCase() === 'won');
  const lostDeals = deals.filter(d => (d.stage || '').toLowerCase() === 'lost');
  const totalClosed = wonDeals.length + lostDeals.length;
  const winRate = totalClosed > 0 ? Math.round((wonDeals.length / totalClosed) * 100) : 0;

  // Calculate expected revenue (Probability * Amount)
  const expectedRev = activeNeg.reduce((sum, d) => sum + ((d.amount || d.finalAmount || 0) * 0.5), 0) + wonDeals.reduce((sum, d) => sum + (d.amount || d.finalAmount || 0), 0);

  const getStageColor = (stage: string) => {
    const s = stage?.toLowerCase() || '';
    if (s === 'new') return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    if (s === 'discussion') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    if (s.includes('technical')) return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
    if (s.includes('commercial')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    if (s.includes('review') || s.includes('approval')) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    if (s === 'won') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (s === 'lost') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  };

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('dealId', dealId);
  };

  const handleDrop = (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    setDragOverStage(null);
    const dealId = e.dataTransfer.getData('dealId');
    if (dealId) {
      negotiationsAPI.updateNegotiation(businessId, dealId, { stage: newStage, status: newStage }).catch(console.error);
      setDeals(prev => prev.map(d => {
        if (d.id === dealId && d.stage !== newStage) {
          toast({ title: "Stage Updated", description: `${d.name} moved to ${newStage}` });
          return { ...d, stage: newStage, status: newStage };
        }
        return d;
      }));
    }
  };

  const handleAction = (action: string, deal: Deal) => {
    if (action === 'won') {
      negotiationsAPI.updateNegotiation(businessId, deal.id, { stage: 'Won', status: 'Won' }).catch(console.error);
      setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, stage: 'Won', status: 'Won' } : d));
      toast({ title: "Negotiation Won! 🎉", description: "Negotiation successfully closed.", className: "bg-green-50" });
    } else if (action === 'lost') {
      negotiationsAPI.updateNegotiation(businessId, deal.id, { stage: 'Lost', status: 'Lost' }).catch(console.error);
      setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, stage: 'Lost', status: 'Lost' } : d));
      toast({ title: "Negotiation Lost", description: "Negotiation marked as lost.", variant: "destructive" });
    }
  };

  const handleExportExcel = () => {
    const data = filteredDeals.map(d => ({
      "Negotiation Name": d.name,
      "Customer": d.customer?.name || d.customer?.company || 'N/A',
      "Stage": d.stage,
      "Expected Close": d.expectedCloseDate ? new Date(d.expectedCloseDate).toLocaleDateString() : 'TBD',
      "Value": d.amount || 0
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Negotiations");
    XLSX.writeFile(workbook, `Negotiations_Pipeline_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16); doc.text('Negotiations Pipeline Report', 14, 20);
    autoTable(doc, {
      head: [['Negotiation Name', 'Customer', 'Stage', 'Value']],
      body: filteredDeals.map(d => [d.name, d.customer?.name || '-', d.stage || '-', `$${(d.amount || 0).toLocaleString()}`]),
      startY: 30, theme: 'grid'
    });
    doc.save(`Negotiations_Pipeline_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExportSingleDealPDF = (deal: Deal) => {
    const doc = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const bizName = business?.name || 'QueERP Solutions';
    const custName = deal.customer?.company || deal.customer?.name || 'Valued Client';
    const curr = (deal.currency || 'USD').toUpperCase();

    // Top Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setFillColor(249, 115, 22); // orange-500
    doc.rect(0, 28, pageWidth, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('COMMERCIAL NEGOTIATION SUMMARY', 14, 18);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`Ref: ${deal.negNumber || deal.id.slice(0, 8).toUpperCase()}`, pageWidth - 14, 14, { align: 'right' });
    doc.text(`Date: ${new Date(deal.createdAt).toLocaleDateString()}`, pageWidth - 14, 20, { align: 'right' });

    // Parties Box
    autoTable(doc, {
      startY: 38,
      head: [['ISSUING ENTITY', 'CLIENT / COUNTERPARTY']],
      body: [
        [
          `${bizName}\n${business?.address || [business?.city, business?.country].filter(Boolean).join(', ') || 'Corporate Headquarters'}\nEmail: ${business?.email || 'N/A'}\nPhone: ${business?.phone || 'N/A'}`,
          `${custName}\nEmail: ${deal.customer?.email || 'N/A'}\nPhone: ${deal.customer?.phone || 'N/A'}`
        ]
      ],
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      styles: { fontSize: 8.5, cellPadding: 4, lineColor: [203, 213, 225] },
    });

    // Negotiation Terms
    const afterPartiesY = (doc as any).lastAutoTable?.finalY || 70;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('1. NEGOTIATION PARAMETERS & VALUATION', 14, afterPartiesY + 8);

    const formatVal = (v: number) => {
      try {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: curr }).format(v || 0);
      } catch {
        return `${curr} ${(v || 0).toLocaleString()}`;
      }
    };

    autoTable(doc, {
      startY: afterPartiesY + 11,
      head: [['Parameter', 'Details']],
      body: [
        ['Negotiation Title', deal.name],
        ['Current Pipeline Stage', deal.stage || 'New'],
        ['Negotiated Contract Value', `${formatVal(deal.amount || deal.finalAmount || 0)} (${curr})`],
        ['Win Probability', `${deal.probability ?? 0}%`],
        ['Target Close Date', deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : 'TBD'],
        ['Linked Proposal Reference', deal.linkedProposal || 'N/A'],
        ['Sales Account Owner', deal.salesOwner || 'Unassigned'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      styles: { fontSize: 8, cellPadding: 3, lineColor: [226, 232, 240] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 65 } }
    });

    // Scope & Operational Conditions
    const afterTermsY = (doc as any).lastAutoTable?.finalY || 135;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('2. AGREED SCOPE & COMMERCIAL COVENANTS', 14, afterTermsY + 8);

    autoTable(doc, {
      startY: afterTermsY + 11,
      body: [
        ['Scope Adjustments', deal.addedScope || 'Standard Scope as outlined in baseline proposal.'],
        ['Agreed Timeline', deal.finalTimeline || 'Standard Project Milestones.'],
        ['Payment Terms', deal.paymentTerms || 'Standard Invoice Cycles.']
      ],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3.5, lineColor: [226, 232, 240] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45, fillColor: [248, 250, 252] } }
    });

    // Signatures
    const afterScopeY = (doc as any).lastAutoTable?.finalY || 180;
    autoTable(doc, {
      startY: afterScopeY + 10,
      head: [['ISSUED BY (SALES / MANAGEMENT)', 'ACKNOWLEDGED BY (CLIENT REPRESENTATIVE)']],
      body: [
        [
          `\n\n_____________________________________\nFor: ${bizName}\nTitle: Account Manager\nDate: _______________________________`,
          `\n\n_____________________________________\nFor: ${custName}\nTitle: Authorized Buyer\nDate: _______________________________`
        ]
      ],
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 4, lineColor: [203, 213, 225] },
    });

    doc.save(`${(deal.name || 'Negotiation').replace(/[^a-zA-Z0-9]/g, '_')}_Summary.pdf`);
    toast({ title: "PDF Exported", description: "Negotiation summary downloaded successfully." });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative bg-gray-50 dark:bg-gray-950">

      {/* Header */}
      <div className="flex-none px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm z-10 print:hidden">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          <span>Project Operations</span><span>/</span><span>Pre-Sales</span><span>/</span><span className="text-blue-600 dark:text-blue-400">Negotiations</span>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Negotiations</h1>
            <p className="text-xs text-gray-500 mt-1">Track, negotiate, and close active project deals through the CPQ pipeline.</p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button
              onClick={handleExportExcel}
              variant="outline"
              size="sm"
              className="gap-1.5 font-bold text-xs bg-green-50 text-green-700 hover:bg-green-100 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50"
            >
              <Download className="w-3.5 h-3.5" /> Excel
            </Button>
            <Button
              onClick={handleExportPDF}
              variant="outline"
              size="sm"
              className="gap-1.5 font-bold text-xs bg-red-50 text-red-700 hover:bg-red-100 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"
            >
              <FileText className="w-3.5 h-3.5" /> PDF Report
            </Button>
            <Button
              onClick={() => navigate(`/dashboard/${businessId}/project-operations/negotiations/create`)}
              size="sm"
              className="gap-1.5 font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm ml-1"
            >
              + New Negotiation
            </Button>
          </div>
        </div>
      </div>

      <div data-lenis-prevent className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 pb-16 print:p-0">
        {/* Dashboards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 flex-none print:hidden">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-3 shadow-xs">
            <div className="p-2.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 rounded-lg shrink-0"><Handshake className="w-5 h-5" /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Active Negotiations</p>
              <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{activeNeg.length}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-3 shadow-xs">
            <div className="p-2.5 bg-orange-50 text-orange-600 dark:bg-orange-900/30 rounded-lg shrink-0"><TrendingUp className="w-5 h-5" /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pipeline Value</p>
              <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">${(activeValue / 1000).toFixed(1)}k</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-3 shadow-xs">
            <div className="p-2.5 bg-green-50 text-green-600 dark:bg-green-900/30 rounded-lg shrink-0"><CheckCircle2 className="w-5 h-5" /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Won / Win Rate</p>
              <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{wonDeals.length} <span className="text-xs font-bold text-gray-400 font-normal">({winRate}%)</span></h3>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-3 shadow-xs">
            <div className="p-2.5 bg-red-50 text-red-600 dark:bg-red-900/30 rounded-lg shrink-0"><AlertCircle className="w-5 h-5" /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Lost Negotiations</p>
              <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{lostDeals.length}</h3>
            </div>
          </div>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 rounded-xl flex items-center gap-3 text-white shadow-md">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Expected Revenue</p>
              <h3 className="text-xl font-black text-emerald-400 leading-tight">${(expectedRev / 1000).toFixed(1)}k</h3>
            </div>
          </div>
        </div>

        {/* Search & Mode Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white dark:bg-gray-900 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs flex-none z-10 print:hidden">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search negotiations by name or client..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 shadow-xs text-blue-600 dark:text-white' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <List className="w-3.5 h-3.5" /> Table
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-bold transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-gray-700 shadow-xs text-blue-600 dark:text-white' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Kanban
              </button>
            </div>
            <Button
              onClick={() => setIsFilterOpen(true)}
              variant="outline"
              size="sm"
              className={`gap-1.5 text-xs font-bold ${Object.keys(filters).length > 0 ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40' : ''}`}
            >
              <Filter className="w-3.5 h-3.5" /> Filter {Object.keys(filters).length > 0 && `(${Object.keys(filters).length})`}
            </Button>
          </div>
        </div>

        {/* Workspace Card Container */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col min-h-[420px]">
          {loading ? (
            <div className="py-28 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 font-bold uppercase text-[11px] tracking-wider">Loading Negotiations...</p>
            </div>
          ) : viewMode === 'table' ? (
            filteredDeals.length === 0 ? (
              <div className="py-24 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                  <Handshake className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">No Negotiations Found</h3>
                <p className="text-xs text-gray-500 max-w-xs">
                  {searchTerm ? `No negotiations match "${searchTerm}".` : "There are no active negotiations in this business pipeline."}
                </p>
                <Button
                  onClick={() => navigate(`/dashboard/${businessId}/project-operations/negotiations/create`)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs mt-2"
                >
                  + New Negotiation
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                  <thead className="bg-gray-50/80 dark:bg-gray-800/40 text-[11px] uppercase font-bold text-gray-500 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3.5">Negotiation Name</th>
                      <th className="px-6 py-3.5">Customer</th>
                      <th className="px-6 py-3.5">Current Stage</th>
                      <th className="px-6 py-3.5">Expected Close</th>
                      <th className="px-6 py-3.5 font-bold">Negotiated Value</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredDeals.map(deal => (
                      <tr key={deal.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center shrink-0">
                              <Handshake className="w-4 h-4" />
                            </div>
                            <button
                              onClick={() => setSelectedDeal(deal)}
                              className="font-bold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left cursor-pointer"
                            >
                              {deal.name}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">
                          {deal.customer?.name || deal.customer?.company || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${getStageColor(deal.stage || 'New')}`}>
                            {deal.stage}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-gray-500">
                          {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : 'TBD'}
                        </td>
                        <td className="px-6 py-4 font-black text-gray-900 dark:text-gray-100">
                          ${(deal.amount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 p-0 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 p-1 font-sans z-50">
                              <DropdownMenuItem
                                onClick={() => setSelectedDeal(deal)}
                                className="cursor-pointer text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-2"
                              >
                                <Eye className="w-3.5 h-3.5 text-indigo-500" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleExportSingleDealPDF(deal)}
                                className="cursor-pointer text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-2"
                              >
                                <Download className="w-3.5 h-3.5 text-blue-500" /> Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => navigate(`/dashboard/${businessId}/project-operations/negotiations/create?edit=${deal.id}`)}
                                className="cursor-pointer text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-2"
                              >
                                <Edit className="w-3.5 h-3.5 text-emerald-500" /> Edit Negotiation
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => navigate(`/dashboard/${businessId}/project-operations/contracts/add?fromNegotiation=${deal.id || deal.negNumber}`)}
                                className="cursor-pointer text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-2 text-blue-600 focus:text-blue-600 focus:bg-blue-50 dark:focus:bg-blue-950/20"
                              >
                                <FileSignature className="w-3.5 h-3.5 text-blue-600" /> Convert to Contract
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  const emailTo = deal.customer?.email || '';
                                  const mailto = `mailto:${emailTo}?subject=${encodeURIComponent(`Negotiation Update - ${deal.name}`)}`;
                                  window.open(mailto, '_blank');
                                }}
                                className="cursor-pointer text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-2"
                              >
                                <Mail className="w-3.5 h-3.5 text-gray-500" /> Send Email
                              </DropdownMenuItem>
                              <div className="h-px bg-gray-100 dark:bg-gray-800 my-1"></div>
                              <DropdownMenuItem
                                onClick={() => handleAction('won', deal)}
                                className="cursor-pointer text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-2 text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 dark:focus:bg-emerald-950/20"
                              >
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Mark Won
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleAction('lost', deal)}
                                className="cursor-pointer text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/20"
                              >
                                <Ban className="w-3.5 h-3.5 text-rose-600" /> Mark Lost
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="flex flex-col flex-1 min-h-0 bg-gray-100/50 dark:bg-gray-950/50">
              {/* Kanban Jump Navigation Bar */}
              <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-xs flex-none">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1 shrink-0">Stage Jump:</span>
                  {KANBAN_STAGES.map(stage => {
                    const count = getDealsForStage(stage).length;
                    return (
                      <button
                        key={stage}
                        onClick={() => scrollToStage(stage)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all ${count > 0
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold shadow-2xs'
                            : 'bg-gray-50 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700'
                          }`}
                      >
                        <span>{stage}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${count > 0 ? 'bg-blue-600 text-white font-bold' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                          }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 text-gray-500 hover:text-gray-900 border-gray-200 dark:border-gray-700"
                    onClick={() => scrollKanban('left')}
                    title="Scroll board left"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 text-gray-500 hover:text-gray-900 border-gray-200 dark:border-gray-700"
                    onClick={() => scrollKanban('right')}
                    title="Scroll board right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Kanban Columns Horizontal Board */}
              <div
                ref={kanbanContainerRef}
                className="overflow-x-auto p-4 flex-1 scrollbar-thin"
              >
                <div className="flex gap-4 min-w-max pb-4">
                  {KANBAN_STAGES.map(stage => {
                    const stageDeals = getDealsForStage(stage);
                    const stageTotal = getStageTotal(stage);
                    const isOver = dragOverStage === stage;
                    const colColor = getStageHeaderColor(stage);

                    return (
                      <div
                        key={stage}
                        id={`kanban-col-${stage.replace(/\s+/g, '-').toLowerCase()}`}
                        className={`w-72 flex flex-col rounded-xl border transition-all shrink-0 ${isOver
                            ? 'bg-blue-50/70 border-blue-400 dark:bg-blue-950/30 dark:border-blue-500 ring-2 ring-blue-400/20 shadow-md'
                            : 'bg-gray-50/90 dark:bg-gray-900/90 border-gray-200 dark:border-gray-800 shadow-xs'
                          }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (dragOverStage !== stage) setDragOverStage(stage);
                        }}
                        onDragLeave={() => {
                          if (dragOverStage === stage) setDragOverStage(null);
                        }}
                        onDrop={(e) => handleDrop(e, stage)}
                      >
                        {/* Column Header */}
                        <div className={`p-3 border-b border-gray-200 dark:border-gray-800 rounded-t-xl bg-white dark:bg-gray-950 ${colColor.borderTop}`}>
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${colColor.dot}`}></span>
                              <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">{stage}</h3>
                            </div>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${stageDeals.length > 0 ? colColor.badge : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                              }`}>
                              {stageDeals.length}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[11px] text-gray-400">
                            <span>Pipeline Value:</span>
                            <span className="font-bold text-gray-700 dark:text-gray-300">
                              {formatCurrency(stageTotal)}
                            </span>
                          </div>
                        </div>

                        {/* Deals in Column */}
                        <div data-lenis-prevent className="flex-1 p-3 overflow-y-auto space-y-3 min-h-[320px] max-h-[640px] scrollbar-thin">
                          {stageDeals.length === 0 ? (
                            <div className="h-40 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl flex flex-col items-center justify-center text-center p-4 text-gray-400 bg-white/40 dark:bg-gray-900/40">
                              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">No deals in {stage}</p>
                              <p className="text-[10px] text-gray-400 mt-1">Drag deals here to update stage</p>
                            </div>
                          ) : (
                            stageDeals.map(deal => (
                              <div
                                key={deal.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, deal.id)}
                                onClick={() => setSelectedDeal(deal)}
                                className="group bg-white dark:bg-gray-800 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 shadow-xs hover:shadow-md cursor-grab active:cursor-grabbing transition-all relative"
                              >
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <div className="space-y-0.5 flex-1 min-w-0">
                                    {deal.negNumber && (
                                      <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                                        {deal.negNumber}
                                      </span>
                                    )}
                                    <h4 className="font-bold text-xs text-gray-900 dark:text-white leading-tight line-clamp-2 mt-1">
                                      {deal.name}
                                    </h4>
                                  </div>
                                  <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0 mt-0.5" />
                                </div>

                                <p className="text-[11px] text-gray-500 truncate mb-2.5">
                                  {deal.customer?.company || deal.customer?.name || 'Customer Not Specified'}
                                </p>

                                {/* Progress & probability */}
                                <div className="mb-2.5">
                                  <div className="flex justify-between items-center text-[10px] text-gray-400 mb-1">
                                    <span>Probability</span>
                                    <span className="font-bold text-gray-700 dark:text-gray-300">{deal.probability ?? 0}%</span>
                                  </div>
                                  <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full transition-all duration-300 ${(deal.probability ?? 0) >= 80 ? 'bg-emerald-500' :
                                          (deal.probability ?? 0) >= 50 ? 'bg-blue-500' :
                                            (deal.probability ?? 0) >= 20 ? 'bg-amber-500' : 'bg-gray-400'
                                        }`}
                                      style={{ width: `${Math.min(100, Math.max(0, deal.probability ?? 0))}%` }}
                                    />
                                  </div>
                                </div>

                                <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700 text-xs">
                                  <div className="text-[10px] font-semibold text-gray-400 flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-gray-400" />
                                    {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'TBD'}
                                  </div>
                                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">
                                    {formatCurrency(deal.amount || deal.finalAmount || 0, deal.currency || 'USD')}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Panel Slide-over */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right border-l border-gray-200">
            <div className="flex-none p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
              <h2 className="text-lg font-bold flex items-center gap-2"><SlidersHorizontal className="w-5 h-5 text-blue-600" /> Advanced Filters</h2>
              <button onClick={() => setIsFilterOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 bg-white dark:bg-gray-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 p-4 space-y-6 overflow-y-auto">
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-3">Stage</h3>
                <div className="flex flex-wrap gap-2">
                  {KANBAN_STAGES.map(s => (
                    <button key={s} onClick={() => setFilters({ ...filters, 'Stage': s })} className={`px-3 py-1 rounded-full text-xs font-bold border ${filters['Stage'] === s ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-900/60' : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700'}`}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-none p-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
              <Button onClick={() => setFilters({})} variant="outline" className="flex-1 text-xs font-bold">Clear</Button>
              <Button onClick={() => setIsFilterOpen(false)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">Apply</Button>
            </div>
          </div>
        </div>
      )}

      {/* Negotiation Details View Modal */}
      {selectedDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start bg-gray-50/50 dark:bg-gray-800/40">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${getStageColor(selectedDeal.stage || 'New')}`}>
                    {selectedDeal.stage}
                  </span>
                  {selectedDeal.negNumber && (
                    <span className="text-xs font-mono font-bold text-gray-500">{selectedDeal.negNumber}</span>
                  )}
                </div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
                  {selectedDeal.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedDeal(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Financial Highlight */}
              <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl text-white flex justify-between items-center shadow-sm">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Negotiated Value</span>
                  <span className="text-2xl font-black text-emerald-400">
                    ${(selectedDeal.amount || selectedDeal.finalAmount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Probability</span>
                  <span className="text-lg font-bold text-white">{selectedDeal.probability ?? 0}%</span>
                </div>
              </div>

              {/* Grid Information */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                  <span className="text-gray-400 font-bold uppercase block mb-1">Customer / Client</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {selectedDeal.customer?.company || selectedDeal.customer?.name || 'Not Specified'}
                  </span>
                  {selectedDeal.customer?.email && (
                    <span className="text-gray-500 block mt-0.5">{selectedDeal.customer.email}</span>
                  )}
                </div>

                <div className="p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                  <span className="text-gray-400 font-bold uppercase block mb-1">Expected Close</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {selectedDeal.expectedCloseDate ? new Date(selectedDeal.expectedCloseDate).toLocaleDateString() : 'TBD'}
                  </span>
                  <span className="text-gray-500 block mt-0.5">Currency: {selectedDeal.currency || 'USD'}</span>
                </div>

                {selectedDeal.linkedProposal && (
                  <div className="p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 col-span-2">
                    <span className="text-gray-400 font-bold uppercase block mb-1">Linked Proposal</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{selectedDeal.linkedProposal}</span>
                  </div>
                )}

                {selectedDeal.addedScope && (
                  <div className="p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 col-span-2">
                    <span className="text-gray-400 font-bold uppercase block mb-1">Agreed Scope</span>
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{selectedDeal.addedScope}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800 flex flex-wrap justify-between items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportSingleDealPDF(selectedDeal)}
                className="gap-1.5 text-xs font-bold"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" /> Download PDF Summary
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    navigate(`/dashboard/${businessId}/project-operations/contracts/add?fromNegotiation=${selectedDeal.id || selectedDeal.negNumber}`);
                  }}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  <FileSignature className="w-3.5 h-3.5" /> Convert to Contract
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    navigate(`/dashboard/${businessId}/project-operations/negotiations/create?edit=${selectedDeal.id}`);
                  }}
                  className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit Negotiation
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDeal(null)}
                  className="text-xs font-bold"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
