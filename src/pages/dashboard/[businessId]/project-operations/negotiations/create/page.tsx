import { toast } from 'sonner';
import React, { useState, useEffect, Suspense } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { contactsAPI, Customer } from "@/lib/api/contacts";
import { usersAPI, BusinessUser } from "@/lib/api/users";
import { negotiationsAPI } from "@/lib/api/negotiations";
import { proposalsAPI } from "@/lib/api/proposals";
import { contractsAPI } from "@/lib/api/contracts";
import {
  ArrowLeft, ChevronDown, CheckCircle, Info, FileText,
  Target, Calendar, Users, AlertTriangle, Paperclip, Plus, Trash2,
  ShieldCheck, Box, History, Receipt, Calculator,
  FileSignature, Send, Download, Save, Printer, Eye, UploadCloud, FileBadge, MessageSquare, Handshake, Mail, X, Copy
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { CreateCustomerModal } from "@/components/dashboard/create-customer-modal";
import { useBusinessData } from "@/components/dashboard/business-data-provider";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- UI Components ---
const InputField = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
  className = "col-span-1",
  readOnly = false,
  icon: Icon,
  prefix,
  suffix,
  step,
  min,
  max
}: any) => {
  const plClass = prefix ? (String(prefix).length > 2 ? 'pl-12' : String(prefix).length > 1 ? 'pl-9' : 'pl-7') : '';
  const prClass = suffix ? (String(suffix).length > 2 ? 'pr-12' : String(suffix).length > 1 ? 'pr-9' : 'pr-8') : '';

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1 select-none whitespace-nowrap">
        {Icon && <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
        <span className="truncate">{label}</span>
        {required && !readOnly && <span className="text-red-500 font-bold shrink-0">*</span>}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold pointer-events-none select-none">
            {prefix}
          </span>
        )}
        <input
          type={type}
          name={name}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          step={step}
          min={min}
          max={max}
          onFocus={(e) => {
            if (e.target.value === '0') {
              e.target.select();
            }
          }}
          className={`w-full p-2.5 ${plClass} ${prClass} border rounded-lg text-sm outline-none transition-all ${readOnly
            ? 'bg-gray-100 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed font-medium'
            : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500'
            }`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold pointer-events-none select-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};

const SelectField = ({ label, name, value, onChange, options, required = false, className = "col-span-1", readOnly = false, children, icon: Icon }: any) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1 select-none whitespace-nowrap">
      {Icon && <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
      <span className="truncate">{label}</span>
      {required && !readOnly && <span className="text-red-500 font-bold shrink-0">*</span>}
    </label>
    <select
      name={name} value={value} onChange={onChange} disabled={readOnly}
      className={`w-full p-2.5 border rounded-lg text-sm outline-none transition-all ${readOnly
        ? 'bg-gray-100 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed font-medium'
        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer'
        }`}
    >
      <option value="">Select...</option>
      {options ? options.map((opt: any) => (
        typeof opt === 'string'
          ? <option key={opt} value={opt}>{opt}</option>
          : <option key={opt.value} value={opt.value}>{opt.label}</option>
      )) : children}
    </select>
  </div>
);

const TextAreaField = ({ label, name, value, onChange, placeholder = "", rows = 3, className = "col-span-1" }: any) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{label}</label>
    <textarea
      name={name} value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500 resize-y"
    />
  </div>
);

const SectionCard = ({ id, title, icon: Icon, isExpanded, onToggle, children }: any) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden mb-6 transition-all hover:shadow-md">
      <div
        className="px-6 py-4 flex justify-between items-center cursor-pointer bg-gradient-to-r from-gray-50/50 to-white dark:from-gray-800/20 dark:to-gray-900 border-b border-gray-100 dark:border-gray-800"
        onClick={() => onToggle(id)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-lg shadow-sm">
            <Icon className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{title}</h2>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
      </div>
      <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="p-6 bg-white dark:bg-gray-900">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Data Models ---
const initialFormData = {
  // 1. General
  negNumber: `NEG-${Math.floor(100000 + Math.random() * 900000)}`,
  dealName: '',
  customer: '',
  linkedProposal: '',
  salesOwner: '',
  priority: 'Medium',
  status: 'New',
  probability: '' as any,
  expectedClose: '',
  currency: 'USD',

  // 2. Commercial
  origAmount: '' as any,
  negAmount: '' as any,
  discountPct: '' as any,
  taxPct: '' as any,
  finalAmount: 0,
  margin: 0,
  profitPct: 0,
  paymentTerms: '',
  advancePct: '' as any,
  retentionPct: '' as any,

  // 3. Scope
  addedScope: '',
  removedScope: '',
  modifiedScope: '',
  changeReason: '',
  impact: '',

  // 4. Timeline
  origTimeline: '',
  reqTimeline: '',
  finalTimeline: '',
  delay: '',

  // 5. Customer Feedback
  objections: '',
  requirements: '',
  questions: '',
  risks: '',
  competitors: '',

  // 6. Meetings
  meetingDate: '',
  participants: '',
  agenda: '',
  minutes: '',
  nextAction: '',

  // 8. Internal Notes
  privNotes: '',
  salesNotes: '',
  mgmtNotes: ''
};

function CreateNegotiationContent({ businessId }: { businessId: string }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit') || searchParams.get('editId') || searchParams.get('id');
  const propId = searchParams.get('propId') || searchParams.get('proposalId') || searchParams.get('quotationId');
  const { toast: uiToast } = useToast();

  const [formData, setFormData] = useState(() => ({ ...initialFormData }));

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [users, setUsers] = useState<BusinessUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [proposals, setProposals] = useState<any[]>([]);

  // Email state
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  const { business } = useBusinessData();

  const handleDownloadNegotiationPdf = () => {
    const doc = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const bizName = business?.name || 'QueERP Solutions';
    const cust = customers.find(c => c.id === formData.customer);
    const custName = (cust as any)?.company || cust?.name || 'Valued Client';
    const curr = (formData.currency || 'USD').toUpperCase();

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setFillColor(249, 115, 22);
    doc.rect(0, 28, pageWidth, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('COMMERCIAL NEGOTIATION SUMMARY', 14, 18);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`Ref: ${formData.negNumber || 'DRAFT'}`, pageWidth - 14, 14, { align: 'right' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 14, 20, { align: 'right' });

    autoTable(doc, {
      startY: 38,
      head: [['COMPANY / ISSUER', 'PROSPECT / CLIENT']],
      body: [
        [
          `${bizName}\n${business?.address || [business?.city, business?.country].filter(Boolean).join(', ') || 'Corporate Headquarters'}\nEmail: ${business?.email || 'N/A'}\nPhone: ${business?.phone || 'N/A'}`,
          `${custName}\nEmail: ${(cust as any)?.email || 'N/A'}\nPhone: ${(cust as any)?.phone || 'N/A'}`
        ]
      ],
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      styles: { fontSize: 8.5, cellPadding: 4, lineColor: [203, 213, 225] },
    });

    const afterPartiesY = (doc as any).lastAutoTable?.finalY || 70;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('1. NEGOTIATION PARAMETERS & VALUATION', 14, afterPartiesY + 8);

    const val = Number(formData.finalAmount) || Number(formData.negAmount) || 0;
    autoTable(doc, {
      startY: afterPartiesY + 11,
      head: [['Parameter', 'Details']],
      body: [
        ['Negotiation Title', formData.dealName || 'Negotiation'],
        ['Current Pipeline Stage', formData.status || 'New'],
        ['Final Negotiated Value', `${curr} ${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
        ['Win Probability', `${formData.probability || 0}%`],
        ['Target Close Date', formData.expectedClose ? new Date(formData.expectedClose).toLocaleDateString() : 'TBD'],
        ['Linked Proposal Reference', formData.linkedProposal || 'N/A'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      styles: { fontSize: 8, cellPadding: 3, lineColor: [226, 232, 240] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 65 } }
    });

    const afterTermsY = (doc as any).lastAutoTable?.finalY || 135;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('2. AGREED SCOPE & COMMERCIAL COVENANTS', 14, afterTermsY + 8);

    autoTable(doc, {
      startY: afterTermsY + 11,
      body: [
        ['Scope Adjustments', formData.addedScope || 'Standard Scope as outlined in baseline proposal.'],
        ['Agreed Timeline', formData.finalTimeline || 'Standard Project Milestones.'],
        ['Payment Terms', formData.paymentTerms || 'Standard Invoice Cycles.']
      ],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3.5, lineColor: [226, 232, 240] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45, fillColor: [248, 250, 252] } }
    });

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

    doc.save(`${(formData.dealName || 'Negotiation').replace(/[^a-zA-Z0-9]/g, '_')}_Summary.pdf`);
    toast.success('Negotiation summary PDF exported successfully.');
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setCustomersLoading(true);
        const res = await contactsAPI.getCustomers(businessId);
        const list = (res as any).data || (res as any).customers || [];
        setCustomers(list);
      } catch (error) {
        console.error("Failed to load customers:", error);
      } finally {
        setCustomersLoading(false);
      }
    };
    const fetchUsers = async () => {
      try {
        setUsersLoading(true);
        let list: any[] = [];
        try {
          const res = await usersAPI.getBusinessUsers(businessId);
          list = (res as any).data || (res as any).users || (Array.isArray(res) ? res : []);
        } catch {
          const data = await usersAPI.fetchBusinessUsers(businessId);
          list = Array.isArray(data) ? data : ((data as any).data || (data as any).users || []);
        }
        setUsers(list);
      } catch (error) {
        console.error("Failed to load users:", error);
      } finally {
        setUsersLoading(false);
      }
    };
    fetchCustomers();
    fetchUsers();
    const fetchProposals = async () => {
      try {
        const res = await proposalsAPI.getProposals(businessId);
        setProposals(res.proposals || res.data || []);
      } catch (error) {
        console.error("Failed to load proposals:", error);
      }
    };
    fetchProposals();
  }, [businessId]);

  useEffect(() => {
    if (!propId) return;
    const fetchProposal = async () => {
      try {
        const res = await proposalsAPI.getProposalById(businessId, propId);
        const q = res.proposal || res.quotation || res.data;
        if (q) {
          setFormData(prev => {
            let next = {
              ...prev,
              linkedProposal: propId,
              dealName: q.title || `Negotiation - ${q.quoteNumber || propId}`,
              customer: q.customerId || prev.customer,
              origAmount: Number((q as any).grandTotal || q.totalAmount || 0),
              negAmount: Number((q as any).grandTotal || q.totalAmount || 0),
              origTimeline: q.expiryDate ? new Date(q.expiryDate).toISOString().split('T')[0] : prev.origTimeline,
              currency: q.currency || prev.currency
            };
            return recalculateCommercials(next);
          });
        }
      } catch (e) {
        console.error("Failed to load linked proposal:", e);
      }
    };
    fetchProposal();
  }, [customers, propId, businessId]);

  useEffect(() => {
    if (!editId) return;
    const fetchDeal = async () => {
      try {
        const res = await negotiationsAPI.getNegotiationById(businessId, editId);
        const d = res.negotiation || res.data;
        if (d) {
          setFormData(prev => {
            const cfg = (d.config && typeof d.config === 'object') ? d.config : {};
            let next = {
              ...prev,
              ...cfg,
              negNumber: d.negNumber || cfg.negNumber || prev.negNumber,
              dealName: d.name || d.dealName || cfg.dealName || '',
              customer: d.customerId || cfg.customer || '',
              salesOwner: d.salesOwner || d.assignedToId || cfg.salesOwner || '',
              status: d.stage || cfg.status || 'New',
              priority: d.priority || cfg.priority || 'Medium',
              probability: d.probability !== undefined && d.probability !== null ? d.probability : (cfg.probability ?? ''),
              expectedClose: d.expectedCloseDate ? new Date(d.expectedCloseDate).toISOString().split('T')[0] : (cfg.expectedClose || ''),
              currency: d.currency || cfg.currency || 'USD',
              origAmount: d.origAmount !== undefined ? d.origAmount : (cfg.origAmount ?? d.amount ?? ''),
              negAmount: d.negAmount !== undefined ? d.negAmount : (cfg.negAmount ?? d.amount ?? ''),
              discountPct: d.discountPct !== undefined ? d.discountPct : (cfg.discountPct ?? ''),
              taxPct: d.taxPct !== undefined ? d.taxPct : (cfg.taxPct ?? ''),
              finalAmount: d.finalAmount !== undefined ? d.finalAmount : (cfg.finalAmount ?? d.amount ?? 0),
              paymentTerms: d.paymentTerms || cfg.paymentTerms || '',
              advancePct: cfg.advancePct !== undefined ? cfg.advancePct : '',
              retentionPct: cfg.retentionPct !== undefined ? cfg.retentionPct : '',
              addedScope: d.addedScope || cfg.addedScope || '',
              removedScope: d.removedScope || cfg.removedScope || '',
              modifiedScope: d.modifiedScope || cfg.modifiedScope || '',
              finalTimeline: d.finalTimeline || cfg.finalTimeline || '',
              linkedProposal: d.linkedProposal || cfg.linkedProposal || '',
            };
            return recalculateCommercials(next);
          });
        }
      } catch (e) {
        console.error("Failed to load negotiation:", e);
      }
    };
    fetchDeal();
  }, [editId, businessId]);

  // Sync customer email when customer changes
  useEffect(() => {
    if (formData.customer) {
      const cust = customers.find(c => c.id === formData.customer);
      if (cust?.email) {
        setEmailTo(cust.email);
      }
    }
  }, [formData.customer, customers]);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    general: true, commercial: true, scope: false, timeline: false, feedback: false, meetings: false, attachments: false, notes: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const recalculateCommercials = (data: typeof formData) => {
    const next = { ...data };
    const origAmt = Number(next.origAmount) || 0;
    const negAmt = Number(next.negAmount) || 0;
    const discPct = Number(next.discountPct) || 0;
    const taxPct = Number(next.taxPct) || 0;

    const discAmt = negAmt * (discPct / 100);
    const taxable = negAmt - discAmt;
    const taxAmt = taxable * (taxPct / 100);
    next.finalAmount = taxable + taxAmt;

    const estCost = origAmt * 0.8;
    next.margin = next.finalAmount - estCost - taxAmt;
    next.profitPct = estCost > 0 ? (next.margin / estCost) * 100 : 0;

    return next;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      let next = { ...prev, [name]: value };

      if (name === 'customer' && value === 'CREATE_NEW_CUSTOMER') {
        setShowCreateCustomer(true);
        return prev;
      }

      if (name === 'linkedProposal') {
        const p = proposals.find(x => x.id === value || x.quoteNumber === value);
        if (p) {
          next.dealName = `Negotiation - ${p.title || p.quoteNumber}`;
          next.customer = p.customerId || next.customer;
          next.origAmount = Number(p.totalAmount || p.grandTotal || 0);
          next.negAmount = Number(p.totalAmount || p.grandTotal || 0);
          next.currency = p.currency || next.currency;
          next.origTimeline = p.expiryDate ? new Date(p.expiryDate).toISOString().split('T')[0] : next.origTimeline;
          next = recalculateCommercials(next);
        }
      }
      return next;
    });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (value === '') {
      setFormData(prev => recalculateCommercials({ ...prev, [name]: '' as any }));
      return;
    }
    const num = parseFloat(value);
    setFormData(prev => recalculateCommercials({ ...prev, [name]: isNaN(num) ? '' : num }));
  };

  const reqFields = ['dealName', 'customer', 'expectedClose'];
  const filledFields = reqFields.filter(f => !!(formData as any)[f]);
  const completion = Math.round((filledFields.length / reqFields.length) * 100);

  const getCurrencySymbol = (curr: string) => {
    switch (curr) {
      case 'INR': return '₹';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'AED': return 'AED';
      default: return '$';
    }
  };
  const currencySymbol = getCurrencySymbol(formData.currency);

  const handleSave = async (statusOverride?: string) => {
    const targetStatus = statusOverride || formData.status || 'New';
    if (!formData.customer || !formData.dealName) {
      toast.error("Customer and Negotiation Name are mandatory.");
      return;
    }
    try {
      setIsSaving(true);
      const payload = {
        ...formData,
        name: formData.dealName,
        dealName: formData.dealName,
        customerId: formData.customer,
        customer: formData.customer,
        amount: Number(formData.finalAmount) || Number(formData.negAmount) || 0,
        stage: targetStatus,
        status: targetStatus,
        currency: formData.currency || 'USD',
        expectedCloseDate: formData.expectedClose ? new Date(formData.expectedClose).toISOString() : undefined,
        probability: Number(formData.probability) || 0,
        origAmount: Number(formData.origAmount) || 0,
        negAmount: Number(formData.negAmount) || 0,
        discountPct: Number(formData.discountPct) || 0,
        taxPct: Number(formData.taxPct) || 0,
        finalAmount: Number(formData.finalAmount) || 0,
        margin: Number(formData.margin) || 0,
        profitPct: Number(formData.profitPct) || 0,
        advancePct: Number(formData.advancePct) || 0,
        retentionPct: Number(formData.retentionPct) || 0,
        assignedToId: formData.salesOwner || undefined,
        salesOwner: formData.salesOwner || undefined,
        description: `Negotiation No: ${formData.negNumber}${formData.linkedProposal ? ` | Proposal: ${formData.linkedProposal}` : ''}`,
      };

      if (editId) {
        await negotiationsAPI.updateNegotiation(businessId, editId, payload);
        toast.success(targetStatus === 'Won' ? "Negotiation Won! 🎉" : (targetStatus === 'Lost' ? "Negotiation Marked Lost" : "Negotiation Updated Successfully"));
      } else {
        await negotiationsAPI.createNegotiation(businessId, payload);
        toast.success(targetStatus === 'Won' ? "Negotiation Created as Won! 🎉" : (targetStatus === 'Lost' ? "Negotiation Created as Lost" : "Negotiation Created Successfully"));
      }
      navigate(`/dashboard/${businessId}/project-operations/negotiations`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save negotiation.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAction = async (status: string) => {
    await handleSave(status);
  };

  const openEmailModal = () => {
    const cust = customers.find(c => c.id === formData.customer);
    const cName = (cust as any)?.company || cust?.name || 'Valued Client';
    setEmailTo(cust?.email || '');
    setEmailSubject(`Commercial Offer: ${formData.dealName || formData.negNumber}`);
    setEmailMessage(
      `Dear ${cName},\n\nWe have updated the commercial terms for your negotiation (${formData.negNumber}):\n\n` +
      `- Negotiated Base Amount: ${formData.currency} ${Number(formData.negAmount || 0).toLocaleString()}\n` +
      (formData.discountPct ? `- Discount Applied: ${formData.discountPct}%\n` : '') +
      (formData.taxPct ? `- Tax Rate: ${formData.taxPct}%\n` : '') +
      `- Final Amount: ${formData.currency} ${Number(formData.finalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}\n` +
      `- Payment Terms: ${formData.paymentTerms || 'Standard'}\n` +
      (formData.advancePct ? `- Advance Required: ${formData.advancePct}%\n` : '') +
      (formData.retentionPct ? `- Retention: ${formData.retentionPct}%\n` : '') +
      `\nPlease review and let us know your confirmation.\n\nBest regards,\nSales Team`
    );
    setShowEmailModal(true);
  };

  const handleSendEmailOffer = () => {
    if (!emailTo) {
      toast.error("Please enter a recipient email address.");
      return;
    }
    const mailtoUrl = `mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailMessage)}`;
    window.open(mailtoUrl, '_blank');
    toast.success(`Counter-offer prepared and opened for ${emailTo}`);
    setShowEmailModal(false);
  };

  const handleConvertToContract = async () => {
    if (!formData.customer) {
      toast.error("Customer must be selected.");
      setShowConvertDialog(false);
      return;
    }
    if (Number(formData.finalAmount) <= 0 && Number(formData.negAmount) <= 0) {
      toast.error("Final negotiated amount must be greater than zero.");
      setShowConvertDialog(false);
      return;
    }

    try {
      setIsConverting(true);

      // Save negotiation as Won
      await handleSave('Won');

      setShowConvertDialog(false);
      toast.success("Negotiation marked WON! Opening contract agreement form...");

      // Redirect directly to the contract form with negotiation info pre-filled
      const negParam = editId || formData.negNumber;
      navigate(`/dashboard/${businessId}/project-operations/contracts/add?fromNegotiation=${negParam}`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to convert to contract.");
    } finally {
      setIsConverting(false);
    }
  };

  const selectedCustomer = customers.find(c => c.id === formData.customer);
  const selectedCustomerName = (selectedCustomer as any)?.company || selectedCustomer?.name || 'Not Selected';

  return (
    <div className="min-h-full bg-gray-50/60 dark:bg-gray-950 p-4 md:p-6 lg:p-8 w-full min-w-0">
      <div className="max-w-[1550px] mx-auto space-y-6">

        {/* Top Header Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 md:p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                to={`/dashboard/${businessId}/project-operations/negotiations`}
                className="p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors shadow-sm text-gray-600 dark:text-gray-300"
                title="Back to Negotiations"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  <span>Project Operations</span>
                  <span>/</span>
                  <span>Pre-Sales</span>
                  <span>/</span>
                  <span className="text-orange-600 dark:text-orange-400">Negotiations</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                  {editId ? 'Edit Negotiation' : 'New Negotiation'}
                </h1>
              </div>
            </div>

            {/* Action Buttons Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openEmailModal}
                className="px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5 text-blue-600" /> Email Offer
              </button>
              <button
                type="button"
                onClick={handleDownloadNegotiationPdf}
                className="px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" /> Print / PDF
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSave(formData.status || 'New')}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5 text-orange-600" /> {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleAction('Lost')}
                className="px-4 py-2 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-lg text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <AlertTriangle className="w-3.5 h-3.5" /> Mark Lost
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleAction('Won')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Mark Won
              </button>
            </div>
          </div>
        </div>

        {/* Responsive Grid Layout: Left (Form Sections) + Right (Sidebar Summary) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN: Accordion Form Sections (8 of 12 cols on desktop) */}
          <div className="xl:col-span-8 space-y-6 min-w-0">

            {/* 1. General Info */}
            <SectionCard id="general" title="1. Negotiation Information" icon={Info} isExpanded={expandedSections.general} onToggle={toggleSection}>
              <div className="grid grid-cols-12 gap-5">
                {/* Row 1: Code (3 cols) + Name (9 cols) */}
                <InputField
                  label="Negotiation Number"
                  name="negNumber"
                  value={formData.negNumber}
                  readOnly
                  className="col-span-12 sm:col-span-4 lg:col-span-3"
                />
                <InputField
                  label="Negotiation Name"
                  name="dealName"
                  value={formData.dealName}
                  onChange={handleInputChange}
                  required
                  className="col-span-12 sm:col-span-8 lg:col-span-9"
                  placeholder="e.g. ERP Phase 1 Negotiation Scope"
                />

                {/* Row 2: Customer (6 cols) + Linked Proposal (6 cols) */}
                <SelectField
                  label="Customer"
                  name="customer"
                  value={formData.customer}
                  onChange={handleInputChange}
                  readOnly={customersLoading}
                  required
                  className="col-span-12 sm:col-span-6 lg:col-span-6"
                >
                  <option value="CREATE_NEW_CUSTOMER" className="text-blue-600 font-bold bg-blue-50">+ Create New Customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{(c as any)?.company || c?.name || "Unnamed Customer"}</option>
                  ))}
                </SelectField>

                <SelectField
                  label="Linked Proposal"
                  name="linkedProposal"
                  value={formData.linkedProposal}
                  onChange={handleInputChange}
                  className="col-span-12 sm:col-span-6 lg:col-span-6"
                >
                  <option value="">Select Linked Proposal (Optional)...</option>
                  {proposals.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.quoteNumber} - {p.title || (p.customer?.company || 'Proposal')} (${(p.totalAmount || 0).toLocaleString()})
                    </option>
                  ))}
                </SelectField>

                {/* Row 3: Sales Owner (4 cols) + Priority (4 cols) + Current Stage (4 cols) */}
                <SelectField
                  label="Sales Owner"
                  name="salesOwner"
                  value={formData.salesOwner}
                  onChange={handleInputChange}
                  readOnly={usersLoading}
                  className="col-span-12 sm:col-span-6 lg:col-span-4"
                >
                  <option value="">Select Sales Owner...</option>
                  {formData.salesOwner && !users.some((u: any) => (u.id === formData.salesOwner || u.userId === formData.salesOwner)) && (
                    <option value={formData.salesOwner}>{formData.salesOwner}</option>
                  )}
                  {users.map((u: any) => {
                    const userName = u.user?.name || u.name || 'Member';
                    const userRole = u.role?.name || u.role || 'Sales';
                    return (
                      <option key={u.id || u.userId} value={u.id || u.userId}>
                        {userName} ({userRole})
                      </option>
                    );
                  })}
                </SelectField>

                <SelectField
                  label="Priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  options={['Low', 'Medium', 'High', 'Critical']}
                  className="col-span-12 sm:col-span-6 lg:col-span-4"
                />

                <SelectField
                  label="Current Stage"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  options={['New', 'Discussion', 'Technical Review', 'Commercial Review', 'Client Approval', 'Won', 'Lost']}
                  className="col-span-12 sm:col-span-6 lg:col-span-4"
                />

                {/* Row 4: Probability (4 cols) + Expected Close Date (4 cols) + Currency (4 cols) */}
                <InputField
                  label="Probability (%)"
                  name="probability"
                  type="number"
                  value={formData.probability}
                  onChange={handleNumberChange}
                  suffix="%"
                  placeholder="0"
                  min="0"
                  max="100"
                  className="col-span-12 sm:col-span-4 lg:col-span-4"
                />

                <InputField
                  label="Expected Close Date"
                  name="expectedClose"
                  value={formData.expectedClose}
                  type="date"
                  onChange={handleInputChange}
                  required
                  className="col-span-12 sm:col-span-4 lg:col-span-4"
                />

                <SelectField
                  label="Currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  options={['USD', 'EUR', 'GBP', 'INR', 'AED']}
                  className="col-span-12 sm:col-span-4 lg:col-span-4"
                />
              </div>
            </SectionCard>

            {/* 2. Commercial Details */}
            <SectionCard id="commercial" title="2. Commercial Engine" icon={Calculator} isExpanded={expandedSections.commercial} onToggle={toggleSection}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
                <InputField
                  label="Original Amount"
                  name="origAmount"
                  value={formData.origAmount}
                  type="number"
                  readOnly
                  prefix={currencySymbol}
                />
                <InputField
                  label="Negotiated Amount"
                  name="negAmount"
                  value={formData.negAmount}
                  onChange={handleNumberChange}
                  type="number"
                  prefix={currencySymbol}
                  placeholder="0"
                />
                <InputField
                  label="Discount (%)"
                  name="discountPct"
                  value={formData.discountPct}
                  onChange={handleNumberChange}
                  type="number"
                  suffix="%"
                  placeholder="0"
                  min="0"
                  max="100"
                />
                <InputField
                  label="Tax (%)"
                  name="taxPct"
                  value={formData.taxPct}
                  onChange={handleNumberChange}
                  type="number"
                  suffix="%"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="bg-gradient-to-r from-orange-900 to-orange-800 rounded-xl p-6 mb-6 shadow-sm flex flex-col md:flex-row justify-between items-center text-white">
                <div className="flex flex-col gap-1 mb-4 md:mb-0">
                  <span className="text-orange-300 text-xs font-bold uppercase tracking-wider">Calculated Final Amount</span>
                  <span className="text-3xl md:text-4xl font-black text-white">
                    {formData.currency} {Number(formData.finalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex gap-8 text-right">
                  <div className="flex flex-col">
                    <span className="text-orange-300 text-xs font-bold uppercase tracking-wider">Projected Margin</span>
                    <span className="text-lg md:text-xl font-bold">
                      {formData.currency} {Number(formData.margin || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-orange-300 text-xs font-bold uppercase tracking-wider">Profit %</span>
                    <span className="text-lg md:text-xl font-bold text-orange-200">
                      {Number(formData.profitPct || 0).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <InputField label="Payment Terms" name="paymentTerms" value={formData.paymentTerms} onChange={handleInputChange} placeholder="e.g. Net 30, Due on Receipt" />
                <InputField
                  label="Advance (%)"
                  name="advancePct"
                  value={formData.advancePct}
                  onChange={handleNumberChange}
                  type="number"
                  suffix="%"
                  placeholder="0"
                  min="0"
                  max="100"
                />
                <InputField
                  label="Retention (%)"
                  name="retentionPct"
                  value={formData.retentionPct}
                  onChange={handleNumberChange}
                  type="number"
                  suffix="%"
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </div>
            </SectionCard>

            {/* 3. Scope Changes */}
            <SectionCard id="scope" title="3. Scope Adjustments" icon={Box} isExpanded={expandedSections.scope} onToggle={toggleSection}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <TextAreaField label="Added Scope" name="addedScope" value={formData.addedScope} onChange={handleInputChange} rows={3} />
                <TextAreaField label="Removed Scope" name="removedScope" value={formData.removedScope} onChange={handleInputChange} rows={3} />
                <TextAreaField label="Modified Scope" name="modifiedScope" value={formData.modifiedScope} onChange={handleInputChange} rows={3} className="md:col-span-2" />
                <TextAreaField label="Reason for Change" name="changeReason" value={formData.changeReason} onChange={handleInputChange} rows={2} />
                <TextAreaField label="Business Impact" name="impact" value={formData.impact} onChange={handleInputChange} rows={2} />
              </div>
            </SectionCard>

            {/* 4. Timeline Changes */}
            <SectionCard id="timeline" title="4. Timeline Adjustments" icon={Calendar} isExpanded={expandedSections.timeline} onToggle={toggleSection}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField label="Original Timeline" name="origTimeline" value={formData.origTimeline} readOnly />
                <InputField label="Requested Timeline" name="reqTimeline" value={formData.reqTimeline} onChange={handleInputChange} />
                <InputField label="Final Agreed Timeline" name="finalTimeline" value={formData.finalTimeline} onChange={handleInputChange} />
                <InputField label="Expected Delay (Weeks)" name="delay" value={formData.delay} onChange={handleInputChange} />
              </div>
            </SectionCard>

            {/* 5. Customer Feedback */}
            <SectionCard id="feedback" title="5. Client Feedback & Intelligence" icon={Target} isExpanded={expandedSections.feedback} onToggle={toggleSection}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <TextAreaField label="Client Objections" name="objections" value={formData.objections} onChange={handleInputChange} rows={3} />
                <TextAreaField label="Special Requirements" name="requirements" value={formData.requirements} onChange={handleInputChange} rows={3} />
                <TextAreaField label="Open Questions" name="questions" value={formData.questions} onChange={handleInputChange} rows={2} />
                <TextAreaField label="Perceived Risks" name="risks" value={formData.risks} onChange={handleInputChange} rows={2} />
                <TextAreaField label="Competitor Information" name="competitors" value={formData.competitors} onChange={handleInputChange} rows={3} className="md:col-span-2" />
              </div>
            </SectionCard>

            {/* 6. Meetings */}
            <SectionCard id="meetings" title="6. Meeting Logs" icon={MessageSquare} isExpanded={expandedSections.meetings} onToggle={toggleSection}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField label="Last Meeting Date" name="meetingDate" type="date" value={formData.meetingDate} onChange={handleInputChange} />
                <InputField label="Participants" name="participants" value={formData.participants} onChange={handleInputChange} />
                <TextAreaField label="Agenda" name="agenda" value={formData.agenda} onChange={handleInputChange} rows={2} />
                <TextAreaField label="Minutes of Meeting" name="minutes" value={formData.minutes} onChange={handleInputChange} rows={3} />
                <TextAreaField label="Next Actions" name="nextAction" value={formData.nextAction} onChange={handleInputChange} rows={2} className="md:col-span-2" />
              </div>
            </SectionCard>

            {/* 7. Attachments */}
            <SectionCard id="attachments" title="7. Negotiation Attachments" icon={Paperclip} isExpanded={expandedSections.attachments} onToggle={toggleSection}>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-10 flex flex-col items-center justify-center text-center bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-50 transition-colors cursor-pointer group">
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Upload Revised Documents</h3>
                <p className="text-gray-500 text-xs max-w-sm">Drag and drop revised proposals, MSAs, or NDAs here.</p>
              </div>
            </SectionCard>

            {/* 8. Internal Notes */}
            <SectionCard id="notes" title="8. Internal Notes" icon={ShieldCheck} isExpanded={expandedSections.notes} onToggle={toggleSection}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <TextAreaField label="Private Notes" name="privNotes" value={formData.privNotes} onChange={handleInputChange} rows={3} />
                <TextAreaField label="Sales Team Notes" name="salesNotes" value={formData.salesNotes} onChange={handleInputChange} rows={3} />
                <TextAreaField label="Management Notes (Approval Justification)" name="mgmtNotes" value={formData.mgmtNotes} onChange={handleInputChange} rows={4} className="md:col-span-2" />
              </div>
            </SectionCard>

          </div>

          {/* RIGHT COLUMN: Live Summary & Contract Conversion (4 of 12 cols on desktop) */}
          <div className="xl:col-span-4 xl:sticky xl:top-6 space-y-6">

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">

              {/* Header / Health indicator */}
              <div className="p-5 border-b border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40">
                <div className="flex justify-between items-end mb-2.5">
                  <div>
                    <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Negotiation Health</h3>
                    <p className="text-[11px] text-gray-500 font-medium">Readiness indicator</p>
                  </div>
                  <span className="text-2xl font-black text-orange-600 dark:text-orange-400">{completion}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden shadow-inner">
                  <div
                    className={`h-2 rounded-full transition-all duration-700 ${completion === 100 ? 'bg-green-500' : 'bg-orange-600'}`}
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </div>

              {/* Summary Details */}
              <div className="p-5 space-y-5">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5 mb-2.5">
                    <Info className="w-3.5 h-3.5" /> Negotiation Summary
                  </h4>
                  <div className="space-y-2.5 bg-gray-50 dark:bg-gray-800/50 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs text-gray-500 font-bold uppercase shrink-0">Name</span>
                      <span className="text-xs font-black text-gray-900 dark:text-gray-100 text-right truncate">
                        {formData.dealName || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs text-gray-500 font-bold uppercase shrink-0">Customer</span>
                      <span className="text-xs font-bold text-gray-900 dark:text-gray-100 text-right truncate">
                        {selectedCustomerName}
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-gray-500 font-bold uppercase">Probability</span>
                      <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                        {formData.probability ? `${formData.probability}%` : '0%'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-xs text-gray-500 font-bold uppercase">Stage</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                        {formData.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5 mb-2.5">
                    <Calculator className="w-3.5 h-3.5" /> Live Financials ({formData.currency || 'USD'})
                  </h4>
                  <div className="space-y-2 bg-gray-50 dark:bg-gray-800/50 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-gray-500 font-medium">Original Proposal Amount</span>
                      <span className="text-xs font-bold text-gray-400 line-through">
                        {Number(formData.origAmount || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-start text-blue-600">
                      <span className="text-xs font-semibold">Negotiated Basis</span>
                      <span className="text-xs font-bold">
                        {Number(formData.negAmount || 0).toLocaleString()}
                      </span>
                    </div>
                    {Boolean(formData.discountPct) && (
                      <div className="flex justify-between items-start text-red-500">
                        <span className="text-xs font-semibold">Client Discount</span>
                        <span className="text-xs font-bold">-{formData.discountPct}%</span>
                      </div>
                    )}
                    {Boolean(formData.taxPct) && (
                      <div className="flex justify-between items-start text-gray-500">
                        <span className="text-xs font-semibold">Tax applied</span>
                        <span className="text-xs font-bold">+{formData.taxPct}%</span>
                      </div>
                    )}

                    <div className="flex justify-between items-end pt-2.5 pb-1 border-t border-gray-200 dark:border-gray-700 mt-2">
                      <span className="text-xs text-gray-500 font-black uppercase">Final Amount</span>
                      <span className="text-2xl font-black text-gray-900 dark:text-white leading-none">
                        {currencySymbol} {Number(formData.finalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Convert to Contract Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConvertDialog(true)}
                    disabled={isConverting}
                    className={`w-full py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md transition-all flex justify-center items-center gap-2 ${isConverting
                      ? 'bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-emerald-500/20 active:scale-[0.98]'
                      }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {isConverting ? 'Generating Contract...' : (formData.status === 'Won' ? 'Generate / View Contract' : 'Convert to Contract')}
                  </button>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Convert Negotiation Dialog */}
      {showConvertDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                <FileSignature className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Convert Negotiation to Contract</h3>
                <p className="text-xs text-gray-500">System workflow execution</p>
              </div>
            </div>
            <div className="p-5 space-y-4 text-xs text-gray-600 dark:text-gray-300">
              <p>This action will mark the Negotiation as <strong>WON</strong> and redirect you directly to the <strong>Contract Agreement Form</strong> with all details pre-filled from Negotiation and Proposal:</p>
              <ul className="space-y-2 font-medium bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Set Negotiation Stage to <strong className="text-green-600">WON</strong></li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Pre-fill Contract Title: <strong>{formData.dealName || 'Negotiation'} - Contract</strong></li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Pre-fill Contract Value: <strong>{currencySymbol} {Number(formData.finalAmount || formData.negAmount || 0).toLocaleString()}</strong></li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Auto-populate Scope of Work, Milestones, and Payment Terms</li>
              </ul>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-lg flex gap-2.5 text-blue-800 dark:text-blue-300">
                <FileSignature className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>You can review, adjust legal clauses, and finalize the agreement on the contract form before saving.</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2.5 bg-gray-50 dark:bg-gray-900">
              <button
                type="button"
                onClick={() => setShowConvertDialog(false)}
                disabled={isConverting}
                className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConvertToContract}
                disabled={isConverting}
                className="px-4 py-2 text-xs font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {isConverting ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Opening Contract Form...</>
                ) : (
                  <><CheckCircle className="w-3.5 h-3.5" /> Proceed to Contract Form</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Offer Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Email Commercial Offer</h3>
                  <p className="text-xs text-gray-500">Send updated negotiation terms directly to client</p>
                </div>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block mb-1">
                  Message Preview
                </label>
                <textarea
                  rows={6}
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-mono bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500 resize-y"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2.5 bg-gray-50 dark:bg-gray-900">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(emailMessage);
                  toast.success("Offer text copied to clipboard!");
                }}
                className="px-3.5 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Text
              </button>
              <button
                type="button"
                onClick={handleSendEmailOffer}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" /> Open in Mail App
              </button>
            </div>
          </div>
        </div>
      )}

      <CreateCustomerModal
        open={showCreateCustomer}
        onClose={() => setShowCreateCustomer(false)}
        businessId={businessId as string}
        onCreated={(newCustomer: any) => {
          setCustomers((prev) => [...prev, newCustomer]);
          setFormData((prev: any) => ({
            ...prev,
            customer: newCustomer.id
          }));
          setShowCreateCustomer(false);
        }}
      />
    </div>
  );
}

export default function CreateNegotiationPage() {
  const routerParams = useParams() as any;
  const { businessId } = routerParams;

  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-4rem)] bg-gray-50 dark:bg-gray-950">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Initializing Negotiation Engine...</p>
      </div>
    }>
      <CreateNegotiationContent businessId={businessId as string} />
    </Suspense>
  );
}
