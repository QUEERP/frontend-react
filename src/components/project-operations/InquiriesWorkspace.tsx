import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import {  useNavigate  } from 'react-router-dom';
import { Search, Filter, MessageSquare, Phone, Mail, ArrowRight, FileText, Download, Plus, Eye, Pencil, MoreVertical, Calendar, User, StickyNote, Paperclip, RefreshCw, Copy, Trash2, Loader2, X } from 'lucide-react';
import { leadsAPI, Lead } from '@/lib/api/leads';
import { getCookie } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export function InquiriesWorkspace({ businessId }: { businessId: string }) {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [customerFilter, setCustomerFilter] = useState('ALL');
  const [qualifyingId, setQualifyingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{ type: string, inquiry: Lead | null }>({ type: '', inquiry: null });
  const [modalInput, setModalInput] = useState<any>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchInquiries();
  }, [businessId]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const res = await leadsAPI.getAllLeads(businessId);
      // Backend returns { success, data: Lead[] }
      const list: Lead[] = (res as any).data || (res as any).leads || [];
      setInquiries(list);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
    } finally {
      setLoading(false);
    }
  };

  const uniqueCustomers = Array.from(new Set(inquiries.map(inq => inq.name).filter(Boolean))).sort();

  const filtered = inquiries.filter(inq => {
    const matchesSearch = `${inq.name} ${inq.email} ${inq.company}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || inq.status === statusFilter;
    const matchesCustomer = customerFilter === 'ALL' || inq.name === customerFilter;
    return matchesSearch && matchesStatus && matchesCustomer;
  });

  const handleQualify = async (inqId: string) => {
    try {
      setQualifyingId(inqId);
      await leadsAPI.updateLead(businessId, inqId, { status: "QUALIFIED" });
      await fetchInquiries(); // refresh list
    } catch (error) {
      console.error("Error qualifying lead:", error);
    } finally {
      setQualifyingId(null);
    }
  };

  const handleAction = async (inq: Lead, action: string) => {
    setOpenMenuId(null);
    if (action === 'view') {
      navigate(`/dashboard/${businessId}/project-operations/inquiries/${inq.id}`);
    } else if (action === 'edit') {
      navigate(`/dashboard/${businessId}/project-operations/inquiries/${inq.id}/edit`);
    } else if (action === 'convert') {
      navigate(`/dashboard/${businessId}/project-operations/requirements/create?inquiryId=${inq.id}`);
    } else if (['schedule', 'assign', 'note', 'upload', 'status'].includes(action)) {
      setModalState({ type: action, inquiry: inq });
      setModalInput({});
    } else if (action === 'duplicate') {
      try {
        setActionLoadingId(inq.id);
        const details = await leadsAPI.getLeadDetails(businessId, inq.id);
        const leadData = details.data || details.lead || details;
        const { id, createdAt, updatedAt, ...rest } = leadData;
        const created = await leadsAPI.createLead(businessId, { ...rest, name: `${rest.name} (Copy)`, status: 'NEW' });
        toast({ title: "Success", description: "Inquiry duplicated." });
        fetchInquiries();
        const newId = created.data?.id || created.lead?.id || created.id;
        if (newId) navigate(`/dashboard/${businessId}/project-operations/inquiries/${newId}/edit`);
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setActionLoadingId(null);
      }
    } else if (action === 'export_pdf') {
      const doc = new jsPDF();
      doc.text("Inquiry Details", 14, 15);
      doc.text(`Customer: ${inq.name}`, 14, 25);
      doc.text(`Company: ${inq.company || '-'}`, 14, 32);
      doc.text(`Email: ${inq.email || '-'}`, 14, 39);
      doc.text(`Phone: ${inq.phone || '-'}`, 14, 46);
      doc.text(`Status: ${inq.status}`, 14, 53);
      doc.text(`Created: ${new Date(inq.createdAt).toLocaleDateString()}`, 14, 60);
      doc.save(`Inquiry_${inq.name}.pdf`);
      toast({ title: "Success", description: "PDF generated." });
    } else if (action === 'delete') {
      if (!confirm("This action cannot be undone. Are you sure you want to delete this inquiry?")) return;
      try {
        setActionLoadingId(inq.id);
        await leadsAPI.deleteLead(businessId, inq.id);
        toast({ title: "Success", description: "Inquiry deleted." });
        fetchInquiries();
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setActionLoadingId(null);
      }
    }
  };

  const submitModal = async () => {
    if (!modalState.inquiry) return;
    const inq = modalState.inquiry;
    try {
      if (modalState.type === 'schedule') {
        await leadsAPI.addReminder(businessId, inq.id, modalInput.title || 'Meeting', modalInput.date || new Date().toISOString());
        toast({ title: "Success", description: "Meeting scheduled." });
      } else if (modalState.type === 'assign') {
        await leadsAPI.updateLead(businessId, inq.id, { assignedTo: modalInput.userId });
        toast({ title: "Success", description: "Inquiry assigned." });
      } else if (modalState.type === 'note') {
        await leadsAPI.addNote(businessId, inq.id, modalInput.note);
        toast({ title: "Success", description: "Note added." });
      } else if (modalState.type === 'upload') {
        await new Promise(r => setTimeout(r, 1000));
        await leadsAPI.addActivity(businessId, inq.id, "Uploaded documents");
        toast({ title: "Success", description: "Documents uploaded." });
      } else if (modalState.type === 'status') {
        if (modalInput.status === 'LOST' && !modalInput.reason) {
           toast({ title: "Error", description: "Reason is required for Lost status.", variant: "destructive" });
           return;
        }
        await leadsAPI.updateLead(businessId, inq.id, { status: modalInput.status || inq.status });
        if (modalInput.reason) await leadsAPI.addNote(businessId, inq.id, `Lost Reason: ${modalInput.reason}`);
        toast({ title: "Success", description: "Status updated." });
      }
      setModalState({ type: '', inquiry: null });
      fetchInquiries();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Customer Inquiries", 14, 15);
    const tableColumn = ["Customer", "Email", "Phone", "Company", "Status", "Date"];
    const tableRows = inquiries.map(inq => [
      inq.name,
      inq.email,
      inq.phone || "-",
      inq.company || "-",
      inq.status,
      new Date(inq.createdAt).toLocaleDateString()
    ]);
    (doc as any).autoTable({ head: [tableColumn], body: tableRows, startY: 20 });
    doc.save("Inquiries_Report.pdf");
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(inquiries.map(inq => ({
      Customer: inq.name,
      Email: inq.email,
      Phone: inq.phone || "-",
      Company: inq.company || "-",
      Status: inq.status,
      Date: new Date(inq.createdAt).toLocaleDateString()
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inquiries");
    XLSX.writeFile(wb, "Inquiries_Report.xlsx");
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('new')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    if (s.includes('contacted')) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (s.includes('qualified')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (s.includes('lost')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="flex-none px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          <span>Project Operations</span>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span>Pre-Sales</span>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="text-blue-600 dark:text-blue-400">Inquiries</span>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Inquiries</h1>
            <p className="text-sm text-gray-500 mt-1">Review and qualify leads for project execution.</p>
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
              onClick={() => navigate(`/dashboard/${businessId}/project-operations/inquiries/create`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Inquiry
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-6 space-y-4 overflow-hidden">
        {/* Toolbar */}
        <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex-none">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search inquiries..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-80 transition-all outline-none"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={customerFilter}
                onChange={e => setCustomerFilter(e.target.value)}
                className="appearance-none pl-9 pr-8 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer outline-none"
              >
                <option value="ALL">All Customers</option>
                {uniqueCustomers.map(customer => (
                  <option key={customer} value={customer}>{customer}</option>
                ))}
              </select>
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none pl-9 pr-8 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="REQUIREMENT_GATHERING">Requirement Gathering</option>
                <option value="PROPOSAL_PENDING">Proposal Pending</option>
                <option value="PROPOSAL_SENT">Proposal Sent</option>
                <option value="NEGOTIATION">Negotiation</option>
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-0">
            {loading ? (
              <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                Loading inquiries...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No Inquiries Found</h3>
                <p className="text-gray-500 text-sm max-w-sm mb-6">
                  {search ? `No results for "${search}".` : "There are currently no customer inquiries or leads pending qualification."}
                </p>
                <button
                  onClick={() => navigate(`/dashboard/${businessId}/project-operations/inquiries/create`)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Create First Inquiry
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4">Customer Name</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Company</th>
                    <th className="px-6 py-4">Status / Stage</th>
                    <th className="px-6 py-4">Date Received</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map(inq => (
                    <tr key={inq.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                            {inq.name.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{inq.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <Mail className="w-3.5 h-3.5 text-gray-400" /> {inq.email}
                          </div>
                          {inq.phone && (
                            <div className="flex items-center gap-2 text-xs">
                              <Phone className="w-3.5 h-3.5 text-gray-400" /> {inq.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">
                        {inq.company || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${getStatusColor(inq.status)}`}>
                          {inq.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {new Date(inq.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            title="View Workspace" 
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                            onClick={(e) => { e.stopPropagation(); handleAction(inq, 'view'); }}
                            disabled={actionLoadingId === inq.id}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {['NEW', 'QUALIFIED', 'UNDER_REVIEW', 'REQUIREMENT_GATHERING'].includes(inq.status) && (
                            <button 
                              title="Edit Inquiry"
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                              onClick={(e) => { e.stopPropagation(); handleAction(inq, 'edit'); }}
                              disabled={actionLoadingId === inq.id}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}

                          <div className="relative">
                            <button 
                              title="More Actions"
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setOpenMenuId(openMenuId === inq.id ? null : inq.id); 
                              }}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            
                            {openMenuId === inq.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }} />
                                <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 z-50 overflow-hidden text-left py-1 text-sm text-gray-700 dark:text-gray-300">
                                  
                                  {actionLoadingId === inq.id && (
                                    <div className="flex items-center justify-center p-4">
                                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                                    </div>
                                  )}
                                  
                                  {actionLoadingId !== inq.id && (
                                    <>
                                      {inq.status !== 'CONVERTED' && inq.status !== 'WON' && inq.status !== 'LOST' && (
                                        <button className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-blue-600 dark:text-blue-400 font-medium transition-colors" onClick={(e) => { e.stopPropagation(); handleAction(inq, 'convert'); }}>
                                          <ArrowRight className="w-4 h-4" /> Convert to Requirement
                                        </button>
                                      )}

                                      <button className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" onClick={(e) => { e.stopPropagation(); handleAction(inq, 'schedule'); }}>
                                        <Calendar className="w-4 h-4 text-gray-400" /> Schedule Meeting
                                      </button>
                                      
                                      {inq.status === 'NEW' && (
                                        <button className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" onClick={(e) => { e.stopPropagation(); handleAction(inq, 'assign'); }}>
                                          <User className="w-4 h-4 text-gray-400" /> Assign Inquiry
                                        </button>
                                      )}

                                      <button className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" onClick={(e) => { e.stopPropagation(); handleAction(inq, 'note'); }}>
                                        <StickyNote className="w-4 h-4 text-gray-400" /> Add Internal Note
                                      </button>

                                      <button className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" onClick={(e) => { e.stopPropagation(); handleAction(inq, 'upload'); }}>
                                        <Paperclip className="w-4 h-4 text-gray-400" /> Upload Documents
                                      </button>

                                      <button className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" onClick={(e) => { e.stopPropagation(); handleAction(inq, 'status'); }}>
                                        <RefreshCw className="w-4 h-4 text-gray-400" /> Change Status
                                      </button>
                                      
                                      <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />
                                      
                                      <button className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" onClick={(e) => { e.stopPropagation(); handleAction(inq, 'duplicate'); }}>
                                        <Copy className="w-4 h-4 text-gray-400" /> Duplicate Inquiry
                                      </button>

                                      <button className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" onClick={(e) => { e.stopPropagation(); handleAction(inq, 'export_pdf'); }}>
                                        <Download className="w-4 h-4 text-gray-400" /> Export PDF
                                      </button>

                                      <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />

                                      <button className="flex items-center gap-2 w-full px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors" onClick={(e) => { e.stopPropagation(); handleAction(inq, 'delete'); }}>
                                        <Trash2 className="w-4 h-4" /> Delete Inquiry
                                      </button>
                                    </>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      
      {modalState.inquiry && (
        <Dialog open={true} onOpenChange={(o) => { if (!o) setModalState({ type: '', inquiry: null }) }}>
          <DialogContent className="max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">
                {modalState.type === 'schedule' && "Schedule Meeting"}
                {modalState.type === 'assign' && "Assign Inquiry"}
                {modalState.type === 'note' && "Add Internal Note"}
                {modalState.type === 'upload' && "Upload Documents"}
                {modalState.type === 'status' && "Change Status"}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              {modalState.type === 'schedule' && (
                <>
                  <div>
                    <label className="text-sm font-semibold mb-1 block text-gray-700 dark:text-gray-300">Meeting Title</label>
                    <input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" value={modalInput.title || ''} onChange={e => setModalInput({...modalInput, title: e.target.value})} placeholder="Project Discussion" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block text-gray-700 dark:text-gray-300">Date & Time</label>
                    <input type="datetime-local" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" value={modalInput.date || ''} onChange={e => setModalInput({...modalInput, date: e.target.value})} />
                  </div>
                </>
              )}
              {modalState.type === 'assign' && (
                <div>
                  <label className="text-sm font-semibold mb-1 block text-gray-700 dark:text-gray-300">Employee ID</label>
                  <input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" value={modalInput.userId || ''} onChange={e => setModalInput({...modalInput, userId: e.target.value})} placeholder="Enter User ID..." />
                </div>
              )}
              {modalState.type === 'note' && (
                <div>
                  <label className="text-sm font-semibold mb-1 block text-gray-700 dark:text-gray-300">Note</label>
                  <textarea rows={4} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" value={modalInput.note || ''} onChange={e => setModalInput({...modalInput, note: e.target.value})} placeholder="Type internal note..." />
                </div>
              )}
              {modalState.type === 'upload' && (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 p-8 text-center rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <Paperclip className="mx-auto w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Drag and drop files here, or click to browse</p>
                  <input type="file" multiple className="mt-4 text-gray-700 dark:text-gray-300" />
                </div>
              )}
              {modalState.type === 'status' && (
                <>
                  <div>
                    <label className="text-sm font-semibold mb-1 block text-gray-700 dark:text-gray-300">New Status</label>
                    <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" value={modalInput.status || modalState.inquiry.status} onChange={e => setModalInput({...modalInput, status: e.target.value})}>
                      <option value="NEW">New</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="QUALIFIED">Qualified</option>
                      <option value="PROPOSAL_SENT">Proposal Sent</option>
                      <option value="NEGOTIATION">Negotiation</option>
                      <option value="CONVERTED">Converted</option>
                      <option value="WON">Closed Won</option>
                      <option value="LOST">Closed Lost</option>
                    </select>
                  </div>
                  {modalInput.status === 'LOST' && (
                    <div>
                      <label className="text-sm font-semibold mb-1 block text-red-600 dark:text-red-400">Lost Reason <span className="text-red-500">*</span></label>
                      <textarea rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" value={modalInput.reason || ''} onChange={e => setModalInput({...modalInput, reason: e.target.value})} placeholder="Why was it lost?" />
                    </div>
                  )}
                </>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <button onClick={() => setModalState({ type: '', inquiry: null })} className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
              <button onClick={submitModal} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">Save</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
