import { toast } from 'sonner';
import React, { useState, useEffect, use, Suspense } from 'react';
import {  Link , useParams } from 'react-router-dom';
import {  useNavigate, useSearchParams  } from 'react-router-dom';
import { contactsAPI, Customer } from "@/lib/api/contacts";
import { usersAPI, BusinessUser } from "@/lib/api/users";
import { CreateCustomerModal } from "@/components/dashboard/create-customer-modal";
import { 
  ArrowLeft, ChevronDown, CheckCircle, Info, FileText, User, 
  Target, Calendar, Users, AlertTriangle, Paperclip, Plus, Trash2, 
  ShieldCheck, Box, History, Receipt, Truck, Calculator,
  FileSignature, Send, Download, Save, Eye, UploadCloud, FileBadge
} from 'lucide-react';
import { UserSelect } from "@/components/project-operations/UserSelect";
import { useToast } from "@/components/ui/use-toast";
import { projectOperationsAPI } from "@/lib/api/project-operations";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- UI Components ---
const InputField = ({ label, name, value, onChange, type = "text", placeholder = "", required = false, className = "col-span-1", readOnly = false, icon: Icon }: any) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
      {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />} {label} {required && !readOnly && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {type === "number" && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>}
      <input 
        type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly}
        className={`w-full p-2.5 ${type === 'number' ? 'pl-7' : ''} border rounded-lg text-sm outline-none transition-all ${
          readOnly 
            ? 'bg-gray-100 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed font-medium'
            : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500'
        }`}
      />
    </div>
  </div>
);

const SelectField = ({ label, name, value, onChange, options, required = false, className = "col-span-1", readOnly = false, children, icon: Icon }: any) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
      {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />} {label} {required && !readOnly && <span className="text-red-500">*</span>}
    </label>
    <select 
      name={name} value={value} onChange={onChange} disabled={readOnly}
      className={`w-full p-2.5 border rounded-lg text-sm outline-none transition-all ${
        readOnly 
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
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] overflow-hidden mb-8 transition-all hover:shadow-[0_4px_20px_-5px_rgba(6,81,237,0.15)]">
      <div 
        className="px-6 py-4 flex justify-between items-center cursor-pointer bg-gradient-to-r from-gray-50/50 to-white dark:from-gray-800/20 dark:to-gray-900 border-b border-gray-100 dark:border-gray-800"
        onClick={() => onToggle(id)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-lg shadow-sm">
            <Icon className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">{title}</h2>
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
  propNumber: `PRP-${Math.floor(100000 + Math.random() * 900000)}`,
  version: 'v1.0', propName: '', customer: '', customerContact: '', linkedInquiry: '',
  linkedReq: '', linkedEst: '', salesOpp: '', salesOwner: '', businessUnit: '',
  department: '', currency: '', exchangeRate: 1.0, priority: '', status: 'Draft',
  propDate: new Date().toISOString().split('T')[0],
  validFrom: new Date().toISOString().split('T')[0],
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  estProjectValue: 0, executionType: '', projectType: '', businessType: '',
  
  // 2. Exec Summary
  clientBg: '', businessProb: '', challenges: '', objectives: '',
  proposedSol: '', benefits: '', whyDL: '', approach: '', outcomes: '',
  
  // 3. Scope
  includedScope: '', excludedScope: '', assumptions: '', dependencies: '',
  deliverables: '', acceptanceCriteria: '', outOfScope: '', custResp: '', vendorResp: '',
  
  // 4. Commercials
  matCost: 0, labCost: 0, eqCost: 0, trvCost: 0, subCost: 0, ovhCost: 0, riskCost: 0, contCost: 0,
  markupPct: 0, discountType: '%', discountPct: 0, taxType: '%', taxPct: 0,
  finalPrice: 0, expectedProfit: 0, profitPct: 0, retentionPct: 0, advancePct: 0,
  paymentTerms: '', milestoneBilling: '', warranty: '', amc: '', penalty: '',
  
  // 5. Timeline
  estStart: '', estEnd: '', duration: '', kickoff: '', planning: '',
  execution: '', testing: '', training: '', goLive: '', support: '',
  milestones: '', depTimeline: '',
  
  // 6. Team
  teamSales: '', teamAm: '', teamBa: '', teamArch: '', teamPm: '', teamTech: '',
  teamDev: '', teamQa: '', teamCons: '', teamSup: '', teamSpoc: '',
  
  // 8. Approvals
  prepBy: '', revBy: '', appBy: '', appStatus: 'Pending', appNotes: '', sigData: '', appHistory: '',
  
  // 9. Terms
  termValidity: '', termPayment: '', termDelivery: '', termTaxes: '', termWarranty: '',
  termSupport: '', termConf: '', termCancel: '', termLegal: '', termSpecial: ''
};

// Removed mocks

function CreateProposalContent({ businessId }: { businessId: string }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reqId = searchParams.get('reqId');
  const estId = searchParams.get('estId');
  const editId = searchParams.get('edit');
  const { toast } = useToast();

  const [formData, setFormData] = useState(() => {
    const base = { ...initialFormData };
    // We will run initialization logic inside a useEffect once customers are loaded, or we can just seed IDs if available.
    return base;
  });
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [users, setUsers] = useState<BusinessUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  
  const [customerReqs, setCustomerReqs] = useState<any[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [reqsError, setReqsError] = useState('');
  
  const [reqEstimations, setReqEstimations] = useState<any[]>([]);
  const [loadingEsts, setLoadingEsts] = useState(false);
  const [estsError, setEstsError] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
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
        const res = await usersAPI.getBusinessUsers(businessId);
        const list = (res as any).data || (res as any).users || [];
        setUsers(list);
      } catch (error) {
        console.error("Failed to load users:", error);
      } finally {
        setUsersLoading(false);
      }
    };
    fetchCustomers();
    fetchUsers();
  }, [businessId]);

  // Initialization logic removed, relying on dynamic cascading now
  useEffect(() => {
    // We can seed based on estId or reqId if needed in the future
  }, [customers, estId, reqId]);

  // Fetch requirements when customer changes
  useEffect(() => {
    if (!formData.customer || formData.customer === 'CREATE_NEW_CUSTOMER') {
      setCustomerReqs([]);
      return;
    }
    const fetchReqs = async () => {
      try {
        setLoadingReqs(true);
        setReqsError('');
        const res = await projectOperationsAPI.getRequirements(businessId, formData.customer, 'open');
        setCustomerReqs(res.requirements || []);
      } catch (err: any) {
        setReqsError('Failed to load requirements. Retry');
      } finally {
        setLoadingReqs(false);
      }
    };
    fetchReqs();
  }, [formData.customer, businessId]);

  // Fetch estimations when requirement changes
  useEffect(() => {
    if (!formData.linkedReq || !formData.customer) {
      setReqEstimations([]);
      return;
    }
    const fetchEsts = async () => {
      try {
        setLoadingEsts(true);
        setEstsError('');
        const res = await projectOperationsAPI.getEstimations(businessId, formData.linkedReq, formData.customer, 'Saved');
        setReqEstimations(res.estimations || []);
      } catch (err: any) {
        setEstsError('Failed to load estimations. Retry');
      } finally {
        setLoadingEsts(false);
      }
    };
    fetchEsts();
  }, [formData.linkedReq, formData.customer, businessId]);
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    general: true, summary: true, scope: false, commercial: true, timeline: false, team: false, attachments: false, approval: false, terms: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const recalculateCommercials = (data: any) => {
    const next = { ...data };
    const totalEstCost = (next.matCost||0) + (next.labCost||0) + (next.eqCost||0) + (next.trvCost||0) + (next.subCost||0) + (next.ovhCost||0) + (next.riskCost||0) + (next.contCost||0);
    const markupAmt = totalEstCost * ((next.markupPct||0) / 100);
    const subtotal = totalEstCost + markupAmt;
    
    let discAmt = 0;
    if (next.discountType === '%') discAmt = subtotal * ((next.discountPct||0)/100);
    else discAmt = next.discountPct||0; // absolute
    
    const taxable = subtotal - discAmt;
    let taxAmt = 0;
    if (next.taxType === '%') taxAmt = taxable * ((next.taxPct||0)/100);
    else taxAmt = next.taxPct||0;
    
    next.finalPrice = taxable + taxAmt;
    next.expectedProfit = next.finalPrice - totalEstCost - taxAmt;
    next.profitPct = totalEstCost > 0 ? (next.expectedProfit / totalEstCost) * 100 : 0;
    return next;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      let next = { ...prev, [name]: value };
      
      if (name === 'customer') {
        if (value === 'CREATE_NEW_CUSTOMER') {
          setShowCreateCustomer(true);
          return prev;
        }
        next.linkedReq = '';
        next.linkedEst = '';
        const cust = customers.find(c => c.id === value);
        next.customerContact = (cust as any)?.email || (cust as any)?.phone || '';
      }
      
      if (name === 'linkedReq') {
        next.linkedEst = '';
      }
      
      if (name === 'linkedEst') {
        const eData = reqEstimations.find(e => e.id === value);
        if (eData) {
          next.matCost = eData.materialCost||0; next.labCost = eData.labCost||0; next.eqCost = eData.machineCost||0;
          next.trvCost = eData.travelCost||0; next.subCost = eData.subcontractCost||0; next.ovhCost = eData.miscCost||0;
          next.markupPct = 20; // Default or from logic
          const rData = eData.requirement;
          if(rData) {
             next.propName = rData.title || next.propName; 
             next.executionType = rData.executionType || ''; 
             next.projectType = rData.projectType || '';
             next.businessType = 'Enterprise';
             next.priority = rData.priority || next.priority;
          }
          next.estProjectValue = eData.totalCost || 0;
          next = recalculateCommercials(next);
        }
      }
      return next;
    });
  };
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => recalculateCommercials({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  // Completion Calc
  const reqFields = ['propName', 'customer', 'linkedReq', 'salesOwner', 'validUntil', 'finalPrice'];
  const filledFields = reqFields.filter(f => !!(formData as any)[f] || (formData as any)[f] > 0);
  const completion = Math.round((filledFields.length / reqFields.length) * 100);

  const handleSave = async (actionStatus = 'Draft') => {
    if (actionStatus !== 'Draft') {
      if (!formData.customer || !formData.propName || !formData.linkedReq || !formData.linkedEst) {
        toast({ title: "Validation Error", description: "Please fill all mandatory fields (*).", variant: "destructive" });
        return;
      }
    }
    setIsSaving(true);
    try {
      if (actionStatus === 'Submit For Approval') {
        await projectOperationsAPI.submitProposalApproval(businessId, formData.propNumber);
        setFormData(prev => ({...prev, status: 'Pending Approval', appStatus: 'Under Review'}));
        toast({ title: "Submitted", description: "Submitted for approval successfully." });
      } else {
        const res = await projectOperationsAPI.createProposal(businessId, { ...formData, status: actionStatus });
        if (res.proposal && res.proposal.id) {
          setFormData(prev => ({...prev, propNumber: res.proposal.id, status: actionStatus}));
        } else {
          setFormData(prev => ({...prev, status: actionStatus}));
        }
        toast({ title: "Success", description: `${actionStatus} saved successfully.` });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to process request.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGeneratePDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(41, 128, 185);
      doc.text('ENTERPRISE PROPOSAL', 14, 25);
      doc.setFontSize(12);
      doc.setTextColor(50, 50, 50);
      doc.text(`Proposal No: ${formData.propNumber} (${formData.version})`, 14, 40);
      doc.text(`Project Name: ${formData.propName}`, 14, 48);
      const custName = customers.find(c => c.id === formData.customer);
      doc.text(`Customer: ${(custName as any)?.company || custName?.name || 'N/A'}`, 14, 56);
      doc.text(`Proposal Date: ${formData.propDate}`, 14, 64);
      doc.text(`Valid: ${formData.validFrom} to ${formData.validUntil}`, 14, 72);
      
      doc.text(`Final Value: ${formData.currency} ${formData.finalPrice.toLocaleString()}`, 14, 84);
      
      doc.save(`${formData.propNumber}-v${formData.version}.pdf`);
      toast({ title: "Success", description: "PDF generated successfully." });
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleSend = async () => {
    if (!formData.customer || formData.status === 'Draft') {
      toast({ title: "Validation Error", description: "Proposal must be saved and valid before sending.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      await projectOperationsAPI.sendProposal(businessId, formData.propNumber, { recipients: formData.customerContact, attachPdf: true });
      setFormData(prev => ({...prev, status: 'Sent'}));
      toast({ title: "Success", description: `Proposal sent to ${formData.customerContact}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to send proposal", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-full bg-gray-100/50 dark:bg-gray-950">
      
      {/* LEFT PANE: Form Sections */}
      <div className="flex-1 p-4 md:p-6 lg:p-10 w-full max-w-[1700px] mx-auto overflow-y-auto">
        
        {/* Header */}
        <div className="mb-10 sticky top-0 bg-gray-100/90 dark:bg-gray-950/90 backdrop-blur-md z-40 py-4 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-10 lg:px-10 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-4">
              <Link to={`/dashboard/${businessId}/project-operations/proposals`}
                className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </Link>
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  <span>Project Operations</span><span>/</span><span>Pre-Sales</span><span>/</span><span className="text-blue-600 dark:text-blue-400">Proposals</span>
                </div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                  {editId ? 'Edit Enterprise Proposal' : 'Create Enterprise Proposal'}
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => toast({ title: 'Preview', description: 'Preview modal opened (read-only).' })} disabled={isSaving || isExporting} className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50">
                <Eye className="w-4 h-4" /> Preview
              </button>
              <button onClick={handleGeneratePDF} disabled={isSaving || isExporting} className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-lg text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50">
                {isExporting ? <span className="animate-spin w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full"></span> : <FileBadge className="w-4 h-4" />} PDF
              </button>
              <button onClick={handleSend} disabled={isSaving || isExporting} className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50">
                <Send className="w-4 h-4" /> Send
              </button>
              <button onClick={() => handleSave('Draft')} disabled={isSaving || isExporting} className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50">
                {isSaving && formData.status === 'Draft' ? "Saving..." : <><Save className="w-4 h-4" /> Save Draft</>}
              </button>
              <button onClick={() => handleSave('Submit For Approval')} disabled={isSaving || isExporting} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-md flex items-center gap-2 disabled:opacity-50">
                {isSaving && formData.status !== 'Draft' ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> : <CheckCircle className="w-4 h-4" />} Submit For Approval
              </button>
            </div>
          </div>
        </div>

        {/* 1. General Information */}
        <SectionCard id="general" title="1. General Information" icon={Info} isExpanded={expandedSections.general} onToggle={toggleSection}>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <InputField label="Proposal Number" name="propNumber" value={formData.propNumber} readOnly />
            <InputField label="Version" name="version" value={formData.version} readOnly />
            <InputField label="Proposal Name" name="propName" value={formData.propName} onChange={handleInputChange} required className="md:col-span-2 lg:col-span-3" placeholder="e.g. ERP Phase 1 Final Proposal" />
            
            <SelectField label="Customer" name="customer" value={formData.customer} onChange={handleInputChange} readOnly={customersLoading} required className="lg:col-span-2">
              <option value="CREATE_NEW_CUSTOMER" className="text-blue-600 font-bold bg-blue-50">+ Create New Customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{(c as any)?.company || c?.name || "Unnamed Customer"}</option>
              ))}
            </SelectField>
            
            <InputField label="Customer Contact" name="customerContact" value={formData.customerContact} onChange={handleInputChange} />
            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Linked Requirement <span className="text-red-500">*</span>
              </label>
              {loadingReqs ? (
                <div className="w-full p-2.5 bg-gray-100 border rounded-lg text-sm text-gray-500 flex justify-between">Loading... <span className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></span></div>
              ) : formData.customer ? (
                customerReqs.length > 0 ? (
                  <select name="linkedReq" value={formData.linkedReq} onChange={handleInputChange} disabled={isSaving} className="w-full p-2.5 bg-gray-50 border rounded-lg text-sm outline-none">
                    <option value="">Select Requirement...</option>
                    {customerReqs.map(r => <option key={r.id} value={r.id}>{r.requirementNumber} — {r.title}</option>)}
                  </select>
                ) : (
                  <select disabled className="w-full p-2.5 bg-gray-100 border rounded-lg text-sm text-gray-500">
                    <option>No requirements found</option>
                  </select>
                )
              ) : (
                <select disabled className="w-full p-2.5 bg-gray-100 border rounded-lg text-sm text-gray-500"><option>Select Customer First</option></select>
              )}
              {reqsError && <p className="text-xs text-red-500">{reqsError}</p>}
            </div>

            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Linked Estimation <span className="text-red-500">*</span>
              </label>
              {loadingEsts ? (
                <div className="w-full p-2.5 bg-gray-100 border rounded-lg text-sm text-gray-500 flex justify-between">Loading... <span className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></span></div>
              ) : formData.linkedReq ? (
                reqEstimations.length > 0 ? (
                  <select name="linkedEst" value={formData.linkedEst} onChange={handleInputChange} disabled={isSaving} className="w-full p-2.5 bg-gray-50 border rounded-lg text-sm outline-none">
                    <option value="">Select Estimation...</option>
                    {reqEstimations.map(e => <option key={e.id} value={e.id}>{e.id} — Grand Total ${e.totalCost}</option>)}
                  </select>
                ) : (
                  <select disabled className="w-full p-2.5 bg-gray-100 border rounded-lg text-sm text-gray-500">
                    <option>No saved estimation found</option>
                  </select>
                )
              ) : (
                <select disabled className="w-full p-2.5 bg-gray-100 border rounded-lg text-sm text-gray-500"><option>Select Requirement First</option></select>
              )}
              {estsError && <p className="text-xs text-red-500">{estsError}</p>}
            </div>

            <InputField label="Sales Opportunity" name="salesOpp" value={formData.salesOpp} onChange={handleInputChange} />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Sales Owner</label>
              <UserSelect businessId={businessId as string} value={formData.salesOwner} onChange={(v) => handleInputChange({ target: { name: 'salesOwner', value: v } } as any)} placeholder="Select Sales Owner" />
            </div>
            
            <SelectField label="Business Unit" name="businessUnit" value={formData.businessUnit} onChange={handleInputChange} options={['Software', 'Hardware', 'Consulting', 'Managed Services']} />
            <SelectField label="Department" name="department" value={formData.department} onChange={handleInputChange} options={['Enterprise', 'SMB', 'Government', 'Retail']} />
            
            <SelectField label="Currency" name="currency" value={formData.currency} onChange={handleInputChange} options={['USD', 'EUR', 'GBP', 'INR', 'AED']} />
            <InputField label="Exchange Rate" name="exchangeRate" type="number" value={formData.exchangeRate} onChange={handleNumberChange} />
            
            <SelectField label="Priority" name="priority" value={formData.priority} onChange={handleInputChange} options={['Low', 'Medium', 'High', 'Critical']} />
            <SelectField label="Status" name="status" value={formData.status} onChange={handleInputChange} options={['Draft', 'Internal Review', 'Approved', 'Sent', 'Negotiation', 'Accepted', 'Rejected']} />
            <InputField label="Estimated Proj Value" name="estProjectValue" type="number" value={formData.estProjectValue} onChange={handleNumberChange} readOnly />

            <InputField label="Proposal Date" name="propDate" value={formData.propDate} type="date" onChange={handleInputChange} />
            <InputField label="Valid From" name="validFrom" value={formData.validFrom} type="date" onChange={handleInputChange} />
            <InputField label="Valid Until" name="validUntil" value={formData.validUntil} type="date" onChange={handleInputChange} />
            
            <InputField label="Execution Type" name="executionType" value={formData.executionType} onChange={handleInputChange} />
            <InputField label="Project Type" name="projectType" value={formData.projectType} onChange={handleInputChange} />
            <InputField label="Business Type" name="businessType" value={formData.businessType} onChange={handleInputChange} />
          </div>
        </SectionCard>

        {/* 2. Executive Summary */}
        <SectionCard id="summary" title="2. Executive Summary" icon={FileText} isExpanded={expandedSections.summary} onToggle={toggleSection}>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-6 text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Rich Text Enabled:</strong> These fields will automatically format into paragraphs on the final PDF proposal.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextAreaField label="Client Background" name="clientBg" value={formData.clientBg} onChange={handleInputChange} rows={3} />
            <TextAreaField label="Business Problem" name="businessProb" value={formData.businessProb} onChange={handleInputChange} rows={3} />
            <TextAreaField label="Current Challenges" name="challenges" value={formData.challenges} onChange={handleInputChange} rows={3} />
            <TextAreaField label="Objectives" name="objectives" value={formData.objectives} onChange={handleInputChange} rows={3} />
            <TextAreaField label="Proposed Solution" name="proposedSol" value={formData.proposedSol} onChange={handleInputChange} rows={4} className="md:col-span-2" />
            <TextAreaField label="Business Benefits" name="benefits" value={formData.benefits} onChange={handleInputChange} rows={3} />
            <TextAreaField label="Why DeltaLedger" name="whyDL" value={formData.whyDL} onChange={handleInputChange} rows={3} />
            <TextAreaField label="Implementation Approach" name="approach" value={formData.approach} onChange={handleInputChange} rows={3} />
            <TextAreaField label="Expected Outcomes" name="outcomes" value={formData.outcomes} onChange={handleInputChange} rows={3} />
          </div>
        </SectionCard>
        
        {/* 3. Scope */}
        <SectionCard id="scope" title="3. Project Scope" icon={Target} isExpanded={expandedSections.scope} onToggle={toggleSection}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextAreaField label="Included Scope" name="includedScope" value={formData.includedScope} onChange={handleInputChange} rows={4} className="md:col-span-2" />
            <TextAreaField label="Deliverables" name="deliverables" value={formData.deliverables} onChange={handleInputChange} rows={4} className="md:col-span-2" />
            <TextAreaField label="Acceptance Criteria" name="acceptanceCriteria" value={formData.acceptanceCriteria} onChange={handleInputChange} rows={3} />
            <TextAreaField label="Out Of Scope (Excluded)" name="outOfScope" value={formData.outOfScope} onChange={handleInputChange} rows={3} />
            <TextAreaField label="Assumptions" name="assumptions" value={formData.assumptions} onChange={handleInputChange} rows={3} />
            <TextAreaField label="Dependencies" name="dependencies" value={formData.dependencies} onChange={handleInputChange} rows={3} />
            <TextAreaField label="Customer Responsibilities" name="custResp" value={formData.custResp} onChange={handleInputChange} rows={3} />
            <TextAreaField label="Vendor Responsibilities" name="vendorResp" value={formData.vendorResp} onChange={handleInputChange} rows={3} />
          </div>
        </SectionCard>

        {/* 4. Commercial Details */}
        <SectionCard id="commercial" title="4. Commercial Engine" icon={Calculator} isExpanded={expandedSections.commercial} onToggle={toggleSection}>
          
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-800">A. Cost Basis (From Estimations)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
            <InputField label="Materials" name="matCost" value={formData.matCost} onChange={handleNumberChange} type="number" />
            <InputField label="Labour" name="labCost" value={formData.labCost} onChange={handleNumberChange} type="number" />
            <InputField label="Equipment" name="eqCost" value={formData.eqCost} onChange={handleNumberChange} type="number" />
            <InputField label="Travel" name="trvCost" value={formData.trvCost} onChange={handleNumberChange} type="number" />
            <InputField label="Subcontract" name="subCost" value={formData.subCost} onChange={handleNumberChange} type="number" />
            <InputField label="Overhead" name="ovhCost" value={formData.ovhCost} onChange={handleNumberChange} type="number" />
            <InputField label="Risk Res." name="riskCost" value={formData.riskCost} onChange={handleNumberChange} type="number" />
            <InputField label="Contingency" name="contCost" value={formData.contCost} onChange={handleNumberChange} type="number" />
          </div>

          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-800">B. Pricing & Margins</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <InputField label="Markup (%)" name="markupPct" value={formData.markupPct} onChange={handleNumberChange} type="number" />
            <SelectField label="Disc. Type" name="discountType" value={formData.discountType} onChange={handleInputChange} options={['%', 'Fixed Amount']} />
            <InputField label="Discount" name="discountPct" value={formData.discountPct} onChange={handleNumberChange} type="number" />
            <SelectField label="Tax Type" name="taxType" value={formData.taxType} onChange={handleInputChange} options={['%', 'Fixed Amount']} />
            <InputField label="Tax" name="taxPct" value={formData.taxPct} onChange={handleNumberChange} type="number" />
          </div>

          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 mb-8 shadow-inner flex flex-col md:flex-row justify-between items-center text-white">
            <div className="flex flex-col gap-1 mb-4 md:mb-0">
               <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Live Calculated Final Price</span>
               <span className="text-4xl font-black text-green-400">{formData.currency} {formData.finalPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex gap-8 text-right">
               <div className="flex flex-col">
                 <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Expected Profit</span>
                 <span className="text-xl font-bold">{formData.currency} {formData.expectedProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
               </div>
               <div className="flex flex-col">
                 <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Margin %</span>
                 <span className="text-xl font-bold text-blue-400">{formData.profitPct.toFixed(2)}%</span>
               </div>
            </div>
          </div>

          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-800">C. Payment Terms & Clauses</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SelectField label="Payment Terms" name="paymentTerms" value={formData.paymentTerms} onChange={handleInputChange} options={['Net 15', 'Net 30', 'Net 60', 'Due on Receipt', 'Custom']} />
            <InputField label="Advance (%)" name="advancePct" value={formData.advancePct} onChange={handleNumberChange} type="number" />
            <InputField label="Retention (%)" name="retentionPct" value={formData.retentionPct} onChange={handleNumberChange} type="number" />
            <TextAreaField label="Milestone Billing" name="milestoneBilling" value={formData.milestoneBilling} onChange={handleInputChange} className="md:col-span-3" />
            <TextAreaField label="Warranty Terms" name="warranty" value={formData.warranty} onChange={handleInputChange} />
            <TextAreaField label="AMC Terms" name="amc" value={formData.amc} onChange={handleInputChange} />
            <TextAreaField label="Penalty Clause" name="penalty" value={formData.penalty} onChange={handleInputChange} />
          </div>
        </SectionCard>

        {/* 5. Timeline */}
        <SectionCard id="timeline" title="5. Project Timeline" icon={Calendar} isExpanded={expandedSections.timeline} onToggle={toggleSection}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <InputField label="Expected Start" name="estStart" value={formData.estStart} type="date" onChange={handleInputChange} />
            <InputField label="Expected End" name="estEnd" value={formData.estEnd} type="date" onChange={handleInputChange} />
            <InputField label="Duration" name="duration" value={formData.duration} onChange={handleInputChange} placeholder="e.g. 6 Months" className="md:col-span-2" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
             <InputField label="Kickoff (Weeks)" name="kickoff" value={formData.kickoff} onChange={handleInputChange} />
             <InputField label="Planning (Weeks)" name="planning" value={formData.planning} onChange={handleInputChange} />
             <InputField label="Execution (Weeks)" name="execution" value={formData.execution} onChange={handleInputChange} />
             <InputField label="Testing (Weeks)" name="testing" value={formData.testing} onChange={handleInputChange} />
             <InputField label="Training (Weeks)" name="training" value={formData.training} onChange={handleInputChange} />
             <InputField label="Go Live (Weeks)" name="goLive" value={formData.goLive} onChange={handleInputChange} />
             <InputField label="Support (Weeks)" name="support" value={formData.support} onChange={handleInputChange} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextAreaField label="Key Milestones" name="milestones" value={formData.milestones} onChange={handleInputChange} />
            <TextAreaField label="Dependency Timeline" name="depTimeline" value={formData.depTimeline} onChange={handleInputChange} />
          </div>
        </SectionCard>

        {/* 6. Proposed Team */}
        <SectionCard id="team" title="6. Proposed Team" icon={Users} isExpanded={expandedSections.team} onToggle={toggleSection}>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">

            <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Business Analyst</label>
            <UserSelect businessId={businessId as string} value={formData.teamBa} onChange={(v) => handleInputChange({ target: { name: 'teamBa', value: v } } as any)} placeholder="Select BA" /></div>
            
            <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Solution Architect</label>
            <UserSelect businessId={businessId as string} value={formData.teamArch} onChange={(v) => handleInputChange({ target: { name: 'teamArch', value: v } } as any)} placeholder="Select Architect" /></div>
            
            <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Sales Representative</label>
            <UserSelect businessId={businessId as string} value={formData.teamSales} onChange={(v) => handleInputChange({ target: { name: 'teamSales', value: v } } as any)} placeholder="Select Sales Rep" /></div>

            <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Account Manager</label>
            <UserSelect businessId={businessId as string} value={formData.teamAm} onChange={(v) => handleInputChange({ target: { name: 'teamAm', value: v } } as any)} placeholder="Select AM" /></div>

            <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Proposal Manager</label>
            <UserSelect businessId={businessId as string} value={formData.teamPm} onChange={(v) => handleInputChange({ target: { name: 'teamPm', value: v } } as any)} placeholder="Select PM" /></div>

            <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Technical Lead</label>
            <UserSelect businessId={businessId as string} value={formData.teamTech} onChange={(v) => handleInputChange({ target: { name: 'teamTech', value: v } } as any)} placeholder="Select Tech Lead" /></div>

            <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">QA Lead</label>
            <UserSelect businessId={businessId as string} value={formData.teamQa} onChange={(v) => handleInputChange({ target: { name: 'teamQa', value: v } } as any)} placeholder="Select QA Lead" /></div>
            <InputField label="Developers Count/Names" name="teamDev" value={formData.teamDev} onChange={handleInputChange} />
            <InputField label="Consultants" name="teamCons" value={formData.teamCons} onChange={handleInputChange} />
            <InputField label="Support Manager" name="teamSup" value={formData.teamSup} onChange={handleInputChange} />
            <InputField label="Customer SPOC" name="teamSpoc" value={formData.teamSpoc} onChange={handleInputChange} />
          </div>
        </SectionCard>
        
        {/* 7. Attachments */}
        <SectionCard id="attachments" title="7. Attachments" icon={Paperclip} isExpanded={expandedSections.attachments} onToggle={toggleSection}>
           <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-12 flex flex-col items-center justify-center text-center bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group">
             <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
               <UploadCloud className="w-8 h-8" />
             </div>
             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Upload Supporting Documents</h3>
             <p className="text-gray-500 text-sm max-w-sm">Drag and drop Word, PDF, Excel, or ZIP files here to attach them to the proposal version.</p>
             <button className="mt-6 px-6 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
               Browse Files
             </button>
           </div>
        </SectionCard>
        
        {/* 8. Approval Workflow */}
        <SectionCard id="approval" title="8. Approval Workflow" icon={ShieldCheck} isExpanded={expandedSections.approval} onToggle={toggleSection}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <SelectField label="Prepared By" name="prepBy" value={formData.prepBy} onChange={handleInputChange} disabled={usersLoading}>
              <option value="">Select...</option>
              {users.map(u => <option key={`p-${u.id}`} value={u.user?.name}>{u.user?.name}</option>)}
            </SelectField>
            <SelectField label="Reviewed By" name="revBy" value={formData.revBy} onChange={handleInputChange} disabled={usersLoading}>
              <option value="">Select...</option>
              {users.map(u => <option key={`r-${u.id}`} value={u.user?.name}>{u.user?.name}</option>)}
            </SelectField>
            <SelectField label="Approved By" name="appBy" value={formData.appBy} onChange={handleInputChange} disabled={usersLoading}>
              <option value="">Select...</option>
              {users.map(u => <option key={`a-${u.id}`} value={u.user?.name}>{u.user?.name}</option>)}
            </SelectField>
            <SelectField label="Approval Status" name="appStatus" value={formData.appStatus} onChange={handleInputChange} options={['Pending', 'Under Review', 'Approved', 'Rejected']} />
          </div>
          <TextAreaField label="Approval Notes / Conditions" name="appNotes" value={formData.appNotes} onChange={handleInputChange} rows={3} />
        </SectionCard>

        {/* 9. Terms & Conditions */}
        <SectionCard id="terms" title="9. Terms & Conditions" icon={FileText} isExpanded={expandedSections.terms} onToggle={toggleSection}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextAreaField label="Validity of Proposal" name="termValidity" value={formData.termValidity} onChange={handleInputChange} />
            <TextAreaField label="Payment Terms" name="termPayment" value={formData.termPayment} onChange={handleInputChange} />
            <TextAreaField label="Delivery Terms" name="termDelivery" value={formData.termDelivery} onChange={handleInputChange} />
            <TextAreaField label="Taxes & Duties" name="termTaxes" value={formData.termTaxes} onChange={handleInputChange} />
            <TextAreaField label="Warranty Terms" name="termWarranty" value={formData.termWarranty} onChange={handleInputChange} />
            <TextAreaField label="Support Terms" name="termSupport" value={formData.termSupport} onChange={handleInputChange} />
            <TextAreaField label="Confidentiality" name="termConf" value={formData.termConf} onChange={handleInputChange} />
            <TextAreaField label="Cancellation Policy" name="termCancel" value={formData.termCancel} onChange={handleInputChange} />
            <TextAreaField label="Special Legal Notes" name="termLegal" value={formData.termLegal} onChange={handleInputChange} className="md:col-span-2" />
          </div>
        </SectionCard>

        <div className="h-24 lg:hidden"></div>
      </div>

      {/* RIGHT PANE: Sticky Live Summary Panel */}
      <div className="hidden xl:flex flex-col w-[420px] flex-shrink-0 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl z-50 sticky top-0 h-[calc(100vh-theme(spacing.16))]">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/40 backdrop-blur-sm">
          <div className="flex justify-between items-end mb-3">
            <div>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">Proposal Health</h3>
              <p className="text-xs text-gray-500 font-medium">Real-time completion tracking</p>
            </div>
            <span className="text-3xl font-black text-blue-600 dark:text-blue-400">{completion}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 shadow-inner">
            <div className={`h-2.5 rounded-full transition-all duration-1000 ${completion === 100 ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${completion}%` }}></div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-3">
              <Info className="w-3.5 h-3.5" /> General Summary
            </h4>
            <div className="space-y-3 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-start">
                <span className="text-xs text-gray-500 font-bold uppercase">Proposal No</span>
                <span className="text-sm font-black text-gray-900 dark:text-gray-100">{formData.propNumber} <span className="text-gray-400 font-normal">({formData.version})</span></span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-xs text-gray-500 font-bold uppercase">Customer</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 text-right">
                  {formData.customer 
                    ? (() => { const c = customers.find(x => x.id === formData.customer); return (c as any)?.company || c?.name || 'Unknown'; })() 
                    : 'Not Selected'}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-xs text-gray-500 font-bold uppercase">Owner</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formData.salesOwner || '-'}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-xs text-gray-500 font-bold uppercase">Status</span>
                <span className="text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {formData.status}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-3">
              <Calculator className="w-3.5 h-3.5" /> Live Financials ({formData.currency})
            </h4>
            <div className="space-y-2.5 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-start">
                <span className="text-xs text-gray-500 font-bold">Estimated Cost Basis</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{((formData.matCost||0)+(formData.labCost||0)+(formData.eqCost||0)+(formData.trvCost||0)+(formData.subCost||0)+(formData.ovhCost||0)+(formData.riskCost||0)+(formData.contCost||0)).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-start text-green-600 dark:text-green-400">
                <span className="text-xs font-bold">Markup / Profit applied</span>
                <span className="text-sm font-bold">+{formData.markupPct}%</span>
              </div>
              <div className="flex justify-between items-start text-red-500">
                <span className="text-xs font-bold">Discount applied</span>
                <span className="text-sm font-bold">-{formData.discountPct}{formData.discountType}</span>
              </div>
              <div className="flex justify-between items-start text-gray-500">
                <span className="text-xs font-bold">Tax applied</span>
                <span className="text-sm font-bold">+{formData.taxPct}{formData.taxType}</span>
              </div>
              
              <div className="flex justify-between items-end pt-3 pb-1 border-t border-gray-200 dark:border-gray-700 mt-2">
                <span className="text-xs text-gray-500 font-black uppercase">Final Price</span>
                <span className="text-3xl font-black text-gray-900 dark:text-white leading-none">{formData.finalPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                 <span className="text-xs text-gray-500 font-bold uppercase">Expected Profit</span>
                 <span className="text-sm font-black text-green-600">{formData.expectedProfit.toLocaleString(undefined, {minimumFractionDigits: 2})} <span className="text-gray-400">({formData.profitPct.toFixed(1)}%)</span></span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-3">
              <Target className="w-3.5 h-3.5" /> Project Parameters
            </h4>
            <div className="space-y-3 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-start">
                <span className="text-xs text-gray-500 font-bold uppercase">Duration</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formData.duration || '-'}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-xs text-gray-500 font-bold uppercase">Validity</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formData.validUntil || '-'}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-xs text-gray-500 font-bold uppercase">Execution</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formData.executionType || '-'}</span>
              </div>
            </div>
          </div>

        </div>
        
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/40 backdrop-blur-sm">
          <button onClick={() => handleSave('Draft')} className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-wider text-sm shadow-lg hover:bg-blue-700 hover:shadow-blue-500/25 transition-all active:scale-[0.98] flex justify-center items-center gap-2 mb-3">
             <Save className="w-5 h-5" />
             Save Proposal
          </button>
          <button onClick={() => handleSave('Internal Review')} className="w-full py-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex justify-center items-center gap-2">
             <CheckCircle className="w-4 h-4" />
             Submit for Internal Review
          </button>
        </div>
      </div>
      
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

export default function CreateProposalPage() {
  const routerParams = useParams() as any;
  const { businessId } = routerParams;

  
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-[calc(100vh-theme(spacing.16))] bg-gray-50 dark:bg-gray-950">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Initializing Enterprise Proposal Engine...</p>
      </div>
    }>
      <CreateProposalContent businessId={businessId as string} />
    </Suspense>
  );
}
