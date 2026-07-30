import { toast } from 'sonner';
import React, { useState, useEffect, useRef } from 'react';
import {  useNavigate  } from 'react-router-dom';
import { 
  Search, Filter, Handshake, TrendingUp, AlertCircle, CalendarClock, 
  ArrowRight, Download, FileText, CheckCircle2, SlidersHorizontal, 
  Save as SaveIcon, X, MoreVertical, LayoutGrid, List, Eye, Edit, Copy, 
  Mail, Calendar, ArrowUpRight, CheckCircle, Ban, Archive, Trash2 
} from 'lucide-react';
import { dealsAPI, Deal } from '@/lib/api/deals';
import { useToast } from "@/components/ui/use-toast";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export function NegotiationsWorkspace({ businessId }: { businessId: string }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Kanban Stage Columns
  const KANBAN_STAGES = ['New', 'Discussion', 'Technical Review', 'Commercial Review', 'Client Approval', 'Won', 'Lost'];

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeMenuId && !(event.target as Element).closest('.actions-menu')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId]);

  useEffect(() => {
    fetchDeals();
  }, [businessId]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const data = await dealsAPI.getDeals(businessId);
      // Ensure all deals have a valid Kanban stage mapping, default to 'New'
      const mapped = (data.deals || []).map(d => {
        let stage = d.stage || 'New';
        if (stage === 'Proposal') stage = 'Technical Review';
        if (stage === 'Negotiation') stage = 'Commercial Review';
        if (stage === 'Closed Won') stage = 'Won';
        if (stage === 'Closed Lost') stage = 'Lost';
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
    
    if (searchLower && !dealName.includes(searchLower) && !custName.includes(searchLower)) return false;
    if (filters['Stage'] && deal.stage !== filters['Stage']) return false;
    
    return true;
  });

  // KPI Calculations
  const activeNeg = deals.filter(d => !['Won', 'Lost'].includes(d.stage || ''));
  const activeValue = activeNeg.reduce((sum, d) => sum + (d.amount || 0), 0);
  const wonDeals = deals.filter(d => d.stage === 'Won');
  const lostDeals = deals.filter(d => d.stage === 'Lost');
  const totalClosed = wonDeals.length + lostDeals.length;
  const winRate = totalClosed > 0 ? Math.round((wonDeals.length / totalClosed) * 100) : 0;
  
  // Calculate expected revenue (Probability * Amount)
  // Assuming probability is mapped or default to 50% for active deals, 100% for won.
  const expectedRev = activeNeg.reduce((sum, d) => sum + ((d.amount || 0) * 0.5), 0) + wonDeals.reduce((sum, d) => sum + (d.amount || 0), 0);

  const getStageColor = (stage: string) => {
    const s = stage?.toLowerCase() || '';
    if (s === 'new') return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    if (s === 'discussion') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    if (s.includes('review')) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    if (s.includes('approval')) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (s === 'won') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (s === 'lost') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  };

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('dealId', dealId);
  };

  const handleDrop = (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('dealId');
    if (dealId) {
      setDeals(prev => prev.map(d => {
        if (d.id === dealId && d.stage !== newStage) {
          toast({ title: "Stage Updated", description: `${d.name} moved to ${newStage}` });
          return { ...d, stage: newStage };
        }
        return d;
      }));
    }
  };

  const handleAction = (action: string, deal: Deal) => {
    setActiveMenuId(null);
    if (action === 'won') {
       setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, stage: 'Won' } : d));
       toast({ title: "Deal Won! 🎉", description: "Negotiation successfully closed.", className: "bg-green-50" });
    } else if (action === 'lost') {
       setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, stage: 'Lost' } : d));
       toast({ title: "Deal Lost", description: "Negotiation marked as lost.", variant: "destructive" });
    }
  };

  const handleExportExcel = () => {
    const data = filteredDeals.map(d => ({
      "Deal Name": d.name,
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
      head: [['Deal Name', 'Customer', 'Stage', 'Value']],
      body: filteredDeals.map(d => [d.name, d.customer?.name || '-', d.stage || '-', `$${(d.amount || 0).toLocaleString()}`]),
      startY: 30, theme: 'grid'
    });
    doc.save(`Negotiations_Pipeline_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative bg-gray-50 dark:bg-gray-950">
      
      {/* Header */}
      <div className="flex-none px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm z-10">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          <span>Project Operations</span><span>/</span><span>Pre-Sales</span><span>/</span><span className="text-blue-600 dark:text-blue-400">Negotiations</span>
        </div>
        <div className="flex justify-between items-center">
          <div>
             <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Deal Negotiations</h1>
             <p className="text-sm text-gray-500 mt-1">Track and close active deals through the CPQ pipeline.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-lg text-sm font-semibold hover:bg-green-100 transition-colors">
              <Download className="w-4 h-4" /> Excel
            </button>
            <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors">
              <FileText className="w-4 h-4" /> PDF
            </button>
            <button 
              onClick={() => navigate(`/dashboard/${businessId}/project-operations/negotiations/create`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm ml-2"
            >
              + New Deal
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-6 space-y-4 overflow-hidden">
        {/* Dashboards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-2 flex-none">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 rounded-lg"><Handshake className="w-5 h-5" /></div>
            <div>
               <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Active Deals</p>
               <h3 className="text-lg font-black">{activeNeg.length}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 text-orange-600 dark:bg-orange-900/30 rounded-lg"><TrendingUp className="w-5 h-5" /></div>
            <div>
               <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Pipeline Value</p>
               <h3 className="text-lg font-black">${(activeValue/1000).toFixed(1)}k</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-3">
            <div className="p-2.5 bg-green-50 text-green-600 dark:bg-green-900/30 rounded-lg"><CheckCircle2 className="w-5 h-5" /></div>
            <div>
               <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Won / Win Rate</p>
               <h3 className="text-lg font-black">{wonDeals.length} <span className="text-sm font-bold text-gray-400">({winRate}%)</span></h3>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 dark:bg-red-900/30 rounded-lg"><AlertCircle className="w-5 h-5" /></div>
            <div>
               <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Lost Deals</p>
               <h3 className="text-lg font-black">{lostDeals.length}</h3>
            </div>
          </div>
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-4 rounded-xl flex items-center gap-3 text-white shadow-md">
            <div>
               <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Expected Revenue</p>
               <h3 className="text-xl font-black text-green-400">${(expectedRev/1000).toFixed(1)}k</h3>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex-none z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search negotiations..."
              className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm w-80 outline-none"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md flex items-center gap-1 text-xs font-bold ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500'}`}>
                <List className="w-4 h-4" /> Table
              </button>
              <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded-md flex items-center gap-1 text-xs font-bold ${viewMode === 'kanban' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500'}`}>
                <LayoutGrid className="w-4 h-4" /> Kanban
              </button>
            </div>
            <button onClick={() => setIsFilterOpen(true)} className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium ${Object.keys(filters).length > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700'}`}>
              <Filter className="w-4 h-4" /> Filter {Object.keys(filters).length > 0 && `(${Object.keys(filters).length})`}
            </button>
          </div>
        </div>

        {/* Workspace Area */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          {loading ? (
             <div className="flex-1 flex flex-col items-center justify-center">
               <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
               <p className="text-gray-500 font-bold uppercase text-xs">Loading Pipeline...</p>
             </div>
          ) : viewMode === 'table' ? (
             <div className="flex-1 overflow-y-auto pb-20">
               <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                 <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
                   <tr>
                     <th className="px-6 py-4">Deal Name</th>
                     <th className="px-6 py-4">Customer</th>
                     <th className="px-6 py-4">Current Stage</th>
                     <th className="px-6 py-4">Expected Close</th>
                     <th className="px-6 py-4 font-bold">Negotiated Value</th>
                     <th className="px-6 py-4 text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                   {filteredDeals.map(deal => (
                     <tr key={deal.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                       <td className="px-6 py-4">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center">
                              <Handshake className="w-4 h-4" />
                           </div>
                           <span className="font-bold text-gray-900 dark:text-gray-100">{deal.name}</span>
                         </div>
                       </td>
                       <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">
                          {deal.customer?.name || deal.customer?.company || '-'}
                       </td>
                       <td className="px-6 py-4">
                         <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${getStageColor(deal.stage || 'New')}`}>
                           {deal.stage}
                         </span>
                       </td>
                       <td className="px-6 py-4 text-xs font-bold text-gray-500">
                         {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : 'TBD'}
                       </td>
                       <td className="px-6 py-4 font-black text-gray-900 dark:text-gray-100">
                         ${(deal.amount || 0).toLocaleString()}
                       </td>
                       <td className="px-6 py-4 text-right relative actions-menu">
                          <button onClick={() => setActiveMenuId(activeMenuId === deal.id ? null : deal.id)} className="p-2 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {activeMenuId === deal.id && (
                            <div className="absolute right-8 top-10 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-2xl z-50 overflow-hidden text-xs font-bold animate-in fade-in slide-in-from-top-2">
                              <div className="p-1">
                                <button className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 flex items-center gap-2"><Eye className="w-3.5 h-3.5" /> View</button>
                                <button onClick={() => navigate(`/dashboard/${businessId}/project-operations/negotiations/create?edit=${deal.id}`)} className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 flex items-center gap-2"><Edit className="w-3.5 h-3.5" /> Edit</button>
                                <button className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> Send Email</button>
                                <div className="h-px bg-gray-100 my-1 mx-2"></div>
                                <button onClick={() => handleAction('won', deal)} className="w-full text-left px-3 py-2 rounded-md hover:bg-green-50 text-green-700 flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5" /> Mark Won</button>
                                <button onClick={() => handleAction('lost', deal)} className="w-full text-left px-3 py-2 rounded-md hover:bg-red-50 text-red-700 flex items-center gap-2"><Ban className="w-3.5 h-3.5" /> Mark Lost</button>
                              </div>
                            </div>
                          )}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          ) : (
             <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 bg-gray-100/50 dark:bg-gray-950/50">
               <div className="flex gap-4 h-full min-w-max pb-2">
                 {KANBAN_STAGES.map(stage => (
                   <div 
                     key={stage} 
                     className="w-80 flex flex-col bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex-shrink-0"
                     onDragOver={(e) => e.preventDefault()}
                     onDrop={(e) => handleDrop(e, stage)}
                   >
                     <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-950 rounded-t-xl">
                       <h3 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">{stage}</h3>
                       <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] font-bold rounded-full">
                         {filteredDeals.filter(d => d.stage === stage).length}
                       </span>
                     </div>
                     <div className="flex-1 p-3 overflow-y-auto space-y-3 scrollbar-thin">
                       {filteredDeals.filter(d => d.stage === stage).map(deal => (
                         <div 
                           key={deal.id}
                           draggable
                           onDragStart={(e) => handleDragStart(e, deal.id)}
                           className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                         >
                           <div className="flex justify-between items-start mb-2">
                             <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">{deal.name}</h4>
                           </div>
                           <p className="text-xs text-gray-500 mb-3">{deal.customer?.name || deal.customer?.company || 'N/A'}</p>
                           <div className="flex justify-between items-end pt-2 border-t border-gray-100 dark:border-gray-700">
                             <div className="text-xs font-bold text-gray-400 flex items-center gap-1">
                               <Calendar className="w-3 h-3" />
                               {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : 'TBD'}
                             </div>
                             <span className="font-black text-green-600 text-sm">${(deal.amount || 0).toLocaleString()}</span>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 ))}
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
            <div className="flex-none p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h2 className="text-lg font-bold flex items-center gap-2"><SlidersHorizontal className="w-5 h-5 text-blue-600" /> Advanced Filters</h2>
              <button onClick={() => setIsFilterOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 bg-white rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 p-4 space-y-6 overflow-y-auto">
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-3">Stage</h3>
                <div className="flex flex-wrap gap-2">
                  {KANBAN_STAGES.map(s => (
                    <button key={s} onClick={() => setFilters({...filters, 'Stage': s})} className={`px-3 py-1 rounded-full text-xs font-bold border ${filters['Stage'] === s ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-none p-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setFilters({})} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold">Clear</button>
              <button onClick={() => setIsFilterOpen(false)} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold">Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
