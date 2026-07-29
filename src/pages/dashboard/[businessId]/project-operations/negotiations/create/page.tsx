import { toast } from 'sonner';
import React, { useState, useEffect, use, Suspense } from 'react';
import { Link } from 'react-router-dom';
import {  useNavigate, useSearchParams  } from 'react-router-dom';
import { contactsAPI, Customer } from "@/lib/api/contacts";
import { usersAPI, BusinessUser } from "@/lib/api/users";
import { 
  ArrowLeft, ChevronDown, CheckCircle, Info, FileText,
  Target, Calendar, Users, AlertTriangle, Paperclip, Plus, Trash2, 
  ShieldCheck, Box, History, Receipt, Calculator,
  FileSignature, Send, Download, Save, Eye, UploadCloud, FileBadge, MessageSquare, Handshake
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { UserSelect } from "@/components/project-operations/UserSelect";
import { CreateCustomerModal } from "@/components/dashboard/create-customer-modal";
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
  negNumber: `NEG-${Math.floor(100000 + Math.random() * 900000)}`,
  dealName: '', customer: '', linkedProposal: '', salesOwner: '',
  priority: '', status: 'New', probability: 0, expectedClose: '', currency: '',
  
  // 2. Commercial
  origAmount: 0, negAmount: 0, discountPct: 0, taxPct: 0, 
  finalAmount: 0, margin: 0, profitPct: 0, 
  paymentTerms: '', advancePct: 0, retentionPct: 0,
  
  // 3. Scope
  addedScope: '', removedScope: '', modifiedScope: '', changeReason: '', impact: '',
  
  // 4. Timeline
  origTimeline: '', reqTimeline: '', finalTimeline: '', delay: '',
  
  // 5. Customer Feedback
  objections: '', requirements: '', questions: '', risks: '', competitors: '',
  
  // 6. Meetings
  meetingDate: '', participants: '', agenda: '', minutes: '', nextAction: '',
  
  // 8. Internal Notes
  privNotes: '', salesNotes: '', mgmtNotes: ''
};

const mockProposals: Record<string, any> = {};

function CreateNegotiationContent({ businessId }: { businessId: string }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const propId = searchParams.get('propId');
  const { toast } = useToast();

  const [formData, setFormData] = useState(() => {
    const base = { ...initialFormData };
    return base;
  });
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [users, setUsers] = useState<BusinessUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  
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

  useEffect(() => {
    if (customers.length > 0 && propId && mockProposals[propId]) {
      const p = mockProposals[propId];
      const c = customers.find(x => ((x as any)?.company || x.name) === p.customerName);
      setFormData(prev => {
        let next = { ...prev, linkedProposal: propId, dealName: p.name, customer: c?.id || '', salesOwner: p.owner, origAmount: p.amount, negAmount: p.amount, origTimeline: p.timeline };
        return recalculateCommercials(next);
      });
    }
  }, [customers, propId]);
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    general: true, commercial: true, scope: false, timeline: false, feedback: false, meetings: false, attachments: false, notes: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const recalculateCommercials = (data: typeof formData) => {
    const next = { ...data };
    const discAmt = next.negAmount * (next.discountPct / 100);
    const taxable = next.negAmount - discAmt;
    const taxAmt = taxable * (next.taxPct / 100);
    next.finalAmount = taxable + taxAmt;
    
    // Assume rough margin logic: cost is roughly origAmount * (1 - original margin/100)
    // mock original margin is ~20%
    const estCost = next.origAmount * 0.8;
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
        const p = mockProposals[value];
        if (p) {
          const c = customers.find(x => ((x as any)?.company || x.name) === p.customerName);
          next.dealName = p.name; next.customer = c?.id || ''; next.origAmount = p.amount; next.negAmount = p.amount; next.origTimeline = p.timeline;
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

  const reqFields = ['dealName', 'customer', 'linkedProposal', 'salesOwner', 'expectedClose'];
  const filledFields = reqFields.filter(f => !!(formData as any)[f]);
  const completion = Math.round((filledFields.length / reqFields.length) * 100);

  const handleSave = (status = 'New') => {
    if (!formData.customer || !formData.dealName) {
      toast({ title: "Validation Error", description: "Customer and Deal Name are mandatory.", variant: "destructive" });
      return;
    }
    toast({
      title: editId ? "Negotiation Updated" : "Negotiation Deal Created",
      description: `The deal has been saved in ${status} stage.`
    });
    navigate(`/dashboard/${businessId}/project-operations/negotiations`);
  };

  const handleAction = (status: string) => {
    toast({ title: "Status Updated", description: `The negotiation has been moved to ${status}.`, className: status === 'Won' ? "bg-green-50" : "" });
    if (status === 'Won' || status === 'Lost') {
       navigate(`/dashboard/${businessId}/project-operations/negotiations`);
    }
  };

  const handleConvertToContract = async () => {
    // 1. Validation
    if (!formData.customer) {
      toast({ title: "Validation Error", description: "Customer must be selected.", variant: "destructive" });
      setShowConvertDialog(false);
      return;
    }
    if (!formData.linkedProposal) {
      toast({ title: "Validation Error", description: "Linked Proposal must exist to convert.", variant: "destructive" });
      setShowConvertDialog(false);
      return;
    }
    if (formData.finalAmount <= 0) {
      toast({ title: "Validation Error", description: "Final negotiated amount must be greater than zero.", variant: "destructive" });
      setShowConvertDialog(false);
      return;
    }
    if (!formData.expectedClose) {
      toast({ title: "Validation Error", description: "Expected close date is required.", variant: "destructive" });
      setShowConvertDialog(false);
      return;
    }

    try {
      setIsConverting(true);
      
      // We dynamically import contractsAPI so it doesn't break if not available globally in imports
      const { contractsAPI } = await import('@/lib/api/contracts');
      
      // 2. Create Contract record via real API
      const contractData = {
        customerId: formData.customer,
        title: `${formData.dealName} - Contract`,
        description: `Auto-generated from Negotiation: ${formData.negNumber}\nProposal: ${formData.linkedProposal}\nScope: ${formData.addedScope}\nTimeline: ${formData.finalTimeline}`,
        value: formData.finalAmount,
        startDate: formData.expectedClose || new Date().toISOString(),
      };
      
      const contractRes = await contractsAPI.createContract(businessId, contractData);
      
      if (!contractRes.success) throw new Error("Contract generation failed");
      
      // 3. Mark Negotiation as WON locally
      setFormData(prev => ({ ...prev, status: 'Won' }));
      
      toast({ 
        title: "Contract created successfully. 🎉", 
        description: `Contract ${contractRes.contract?.title} has been generated and Negotiation is locked as WON.`,
        className: "bg-green-50"
      });
      
      setShowConvertDialog(false);
      
      // Redirect to the newly created contract
      setTimeout(() => {
        navigate(`/dashboard/${businessId}/contracts`);
      }, 1500);

    } catch (error: any) {
      toast({ title: "Conversion Failed", description: error.message || "Failed to convert to contract.", variant: "destructive" });
    } finally {
      setIsConverting(false);
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
              <Link to={`/dashboard/${businessId}/project-operations/negotiations`}
                className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </Link>
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  <span>Project Operations</span><span>/</span><span>Pre-Sales</span><span>/</span><span className="text-orange-600 dark:text-orange-400">Negotiations</span>
                </div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                  {editId ? 'Edit Negotiation Deal' : 'New Negotiation Deal'}
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => toast({ title: 'Email Sent', description: 'Counter-offer emailed to client.' })} className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
                <Send className="w-4 h-4" /> Email Offer
              </button>
              <button onClick={() => handleSave('Draft')} className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
                <Save className="w-4 h-4" /> Save
              </button>
              <button onClick={() => handleAction('Lost')} className="px-5 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors shadow-sm flex items-center gap-2">
                Mark Lost
              </button>
              <button onClick={() => handleAction('Won')} className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors shadow-md flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Mark Won
              </button>
            </div>
          </div>
        </div>

        {/* 1. General Info */}
        <SectionCard id="general" title="1. Deal Information" icon={Info} isExpanded={expandedSections.general} onToggle={toggleSection}>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <InputField label="Negotiation Number" name="negNumber" value={formData.negNumber} readOnly />
            <InputField label="Deal Name" name="dealName" value={formData.dealName} onChange={handleInputChange} required className="md:col-span-2 lg:col-span-3" placeholder="e.g. ERP Phase 1 Counter Offer" />
            
            <SelectField label="Customer" name="customer" value={formData.customer} onChange={handleInputChange} readOnly={customersLoading} required className="lg:col-span-2">
              <option value="CREATE_NEW_CUSTOMER" className="text-blue-600 font-bold bg-blue-50">+ Create New Customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{(c as any)?.company || c?.name || "Unnamed Customer"}</option>
              ))}
            </SelectField>
            
            <SelectField label="Linked Proposal" name="linkedProposal" value={formData.linkedProposal} onChange={handleInputChange} required>
              {Object.keys(mockProposals)
                .filter(p => {
                  if (!formData.customer) return true;
                  const selectedCustomer = customers.find(c => c.id === formData.customer);
                  const selectedCustomerName = (selectedCustomer as any)?.company || selectedCustomer?.name;
                  return mockProposals[p].customerName === selectedCustomerName;
                })
                .map(p => (
                  <option key={p} value={p}>{p} - {mockProposals[p].customerName}</option>
              ))}
            </SelectField>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Sales Owner</label>
              <UserSelect businessId={businessId} value={formData.salesOwner} onChange={(v) => handleInputChange({ target: { name: 'salesOwner', value: v } } as any)} placeholder="Select Sales Owner" />
            </div>
            
            <SelectField label="Priority" name="priority" value={formData.priority} onChange={handleInputChange} options={['Low', 'Medium', 'High', 'Critical']} />
            <SelectField label="Current Stage" name="status" value={formData.status} onChange={handleInputChange} options={['New', 'Discussion', 'Technical Review', 'Commercial Review', 'Client Approval', 'Won', 'Lost']} />
            <InputField label="Probability (%)" name="probability" type="number" value={formData.probability} onChange={handleNumberChange} />
            <InputField label="Expected Close Date" name="expectedClose" value={formData.expectedClose} type="date" onChange={handleInputChange} required />
            <SelectField label="Currency" name="currency" value={formData.currency} onChange={handleInputChange} options={['USD', 'EUR', 'GBP', 'INR', 'AED']} />
          </div>
        </SectionCard>

        {/* 2. Commercial Details */}
        <SectionCard id="commercial" title="2. Commercial Engine" icon={Calculator} isExpanded={expandedSections.commercial} onToggle={toggleSection}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <InputField label="Original Amount" name="origAmount" value={formData.origAmount} type="number" readOnly className="bg-gray-100" />
            <InputField label="Negotiated Amount" name="negAmount" value={formData.negAmount} onChange={handleNumberChange} type="number" />
            <InputField label="Discount (%)" name="discountPct" value={formData.discountPct} onChange={handleNumberChange} type="number" />
            <InputField label="Tax (%)" name="taxPct" value={formData.taxPct} onChange={handleNumberChange} type="number" />
          </div>

          <div className="bg-gradient-to-r from-orange-900 to-orange-800 rounded-xl p-6 mb-8 shadow-inner flex flex-col md:flex-row justify-between items-center text-white">
            <div className="flex flex-col gap-1 mb-4 md:mb-0">
               <span className="text-orange-300 text-xs font-bold uppercase tracking-wider">Calculated Final Amount</span>
               <span className="text-4xl font-black text-white">{formData.currency} {formData.finalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex gap-8 text-right">
               <div className="flex flex-col">
                 <span className="text-orange-300 text-xs font-bold uppercase tracking-wider">Projected Margin</span>
                 <span className="text-xl font-bold">{formData.currency} {formData.margin.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
               </div>
               <div className="flex flex-col">
                 <span className="text-orange-300 text-xs font-bold uppercase tracking-wider">Profit %</span>
                 <span className="text-xl font-bold text-orange-200">{formData.profitPct.toFixed(2)}%</span>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SelectField label="Payment Terms" name="paymentTerms" value={formData.paymentTerms} onChange={handleInputChange} options={['Net 15', 'Net 30', 'Net 60', 'Due on Receipt', 'Custom']} />
            <InputField label="Advance (%)" name="advancePct" value={formData.advancePct} onChange={handleNumberChange} type="number" />
            <InputField label="Retention (%)" name="retentionPct" value={formData.retentionPct} onChange={handleNumberChange} type="number" />
          </div>
        </SectionCard>

        {/* 3. Scope Changes */}
        <SectionCard id="scope" title="3. Scope Adjustments" icon={Box} isExpanded={expandedSections.scope} onToggle={toggleSection}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextAreaField label="Added Scope" name="addedScope" value={formData.addedScope} onChange={handleInputChange} rows={3} />
            <TextAreaField label="Removed Scope" name="removedScope" value={formData.removedScope} onChange={handleInputChange} rows={3} />
            <TextAreaField label="Modified Scope" name="modifiedScope" value={formData.modifiedScope} onChange={handleInputChange} rows={3} className="md:col-span-2" />
            <TextAreaField label="Reason for Change" name="changeReason" value={formData.changeReason} onChange={handleInputChange} rows={2} />
            <TextAreaField label="Business Impact" name="impact" value={formData.impact} onChange={handleInputChange} rows={2} />
          </div>
        </SectionCard>

        {/* 4. Timeline Changes */}
        <SectionCard id="timeline" title="4. Timeline Adjustments" icon={Calendar} isExpanded={expandedSections.timeline} onToggle={toggleSection}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Original Timeline" name="origTimeline" value={formData.origTimeline} readOnly />
            <InputField label="Requested Timeline" name="reqTimeline" value={formData.reqTimeline} onChange={handleInputChange} />
            <InputField label="Final Agreed Timeline" name="finalTimeline" value={formData.finalTimeline} onChange={handleInputChange} />
            <InputField label="Expected Delay (Weeks)" name="delay" value={formData.delay} onChange={handleInputChange} />
          </div>
        </SectionCard>

        {/* 5. Customer Feedback */}
        <SectionCard id="feedback" title="5. Client Feedback & Intelligence" icon={Target} isExpanded={expandedSections.feedback} onToggle={toggleSection}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextAreaField label="Client Objections" name="objections" value={formData.objections} onChange={handleInputChange} rows={3} />
            <TextAreaField label="Special Requirements" name="requirements" value={formData.requirements} onChange={handleInputChange} rows={3} />
            <TextAreaField label="Open Questions" name="questions" value={formData.questions} onChange={handleInputChange} rows={2} />
            <TextAreaField label="Perceived Risks" name="risks" value={formData.risks} onChange={handleInputChange} rows={2} />
            <TextAreaField label="Competitor Information" name="competitors" value={formData.competitors} onChange={handleInputChange} rows={3} className="md:col-span-2" />
          </div>
        </SectionCard>

        {/* 6. Meetings */}
        <SectionCard id="meetings" title="6. Meeting Logs" icon={MessageSquare} isExpanded={expandedSections.meetings} onToggle={toggleSection}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Last Meeting Date" name="meetingDate" type="date" value={formData.meetingDate} onChange={handleInputChange} />
            <InputField label="Participants" name="participants" value={formData.participants} onChange={handleInputChange} />
            <TextAreaField label="Agenda" name="agenda" value={formData.agenda} onChange={handleInputChange} rows={2} />
            <TextAreaField label="Minutes of Meeting" name="minutes" value={formData.minutes} onChange={handleInputChange} rows={3} />
            <TextAreaField label="Next Actions" name="nextAction" value={formData.nextAction} onChange={handleInputChange} rows={2} className="md:col-span-2" />
          </div>
        </SectionCard>

        {/* 7. Attachments */}
        <SectionCard id="attachments" title="7. Deal Attachments" icon={Paperclip} isExpanded={expandedSections.attachments} onToggle={toggleSection}>
           <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-12 flex flex-col items-center justify-center text-center bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-50 transition-colors cursor-pointer group">
             <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
               <UploadCloud className="w-8 h-8" />
             </div>
             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Upload Revised Documents</h3>
             <p className="text-gray-500 text-sm max-w-sm">Drag and drop revised proposals, MSAs, or NDAs here.</p>
           </div>
        </SectionCard>

        {/* 8. Internal Notes */}
        <SectionCard id="notes" title="8. Internal Notes" icon={ShieldCheck} isExpanded={expandedSections.notes} onToggle={toggleSection}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextAreaField label="Private Notes" name="privNotes" value={formData.privNotes} onChange={handleInputChange} rows={3} />
            <TextAreaField label="Sales Team Notes" name="salesNotes" value={formData.salesNotes} onChange={handleInputChange} rows={3} />
            <TextAreaField label="Management Notes (Approval Justification)" name="mgmtNotes" value={formData.mgmtNotes} onChange={handleInputChange} rows={4} className="md:col-span-2" />
          </div>
        </SectionCard>

        <div className="h-24 lg:hidden"></div>
      </div>

      {/* RIGHT PANE: Sticky Live Summary Panel */}
      <div className="hidden xl:flex flex-col w-[420px] flex-shrink-0 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl z-50 sticky top-0 h-[calc(100vh-theme(spacing.16))]">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/40 backdrop-blur-sm">
          <div className="flex justify-between items-end mb-3">
            <div>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">Deal Health</h3>
              <p className="text-xs text-gray-500 font-medium">Readiness indicator</p>
            </div>
            <span className="text-3xl font-black text-orange-600 dark:text-orange-400">{completion}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 shadow-inner">
            <div className={`h-2.5 rounded-full transition-all duration-1000 ${completion === 100 ? 'bg-green-500' : 'bg-orange-600'}`} style={{ width: `${completion}%` }}></div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-3">
              <Info className="w-3.5 h-3.5" /> Deal Summary
            </h4>
            <div className="space-y-3 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-start">
                <span className="text-xs text-gray-500 font-bold uppercase">Deal Name</span>
                <span className="text-sm font-black text-gray-900 dark:text-gray-100 text-right">{formData.dealName || '-'}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-xs text-gray-500 font-bold uppercase">Customer</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 text-right">{customers.find(c => c.id === formData.customer)?.name || 'Not Selected'}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-xs text-gray-500 font-bold uppercase">Probability</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formData.probability}%</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-xs text-gray-500 font-bold uppercase">Stage</span>
                <span className="text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider bg-orange-100 text-orange-700">
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
                <span className="text-xs text-gray-500 font-bold">Original Proposal Amount</span>
                <span className="text-sm font-bold text-gray-400 line-through">{formData.origAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-start text-blue-600">
                <span className="text-xs font-bold">Negotiated Basis</span>
                <span className="text-sm font-bold">{formData.negAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-start text-red-500">
                <span className="text-xs font-bold">Client Discount</span>
                <span className="text-sm font-bold">-{formData.discountPct}%</span>
              </div>
              <div className="flex justify-between items-start text-gray-500">
                <span className="text-xs font-bold">Tax applied</span>
                <span className="text-sm font-bold">+{formData.taxPct}%</span>
              </div>
              
              <div className="flex justify-between items-end pt-3 pb-1 border-t border-gray-200 dark:border-gray-700 mt-2">
                <span className="text-xs text-gray-500 font-black uppercase">Final Amount</span>
                <span className="text-3xl font-black text-gray-900 dark:text-white leading-none">{formData.finalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>

        </div>
        
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/40 backdrop-blur-sm">
          <button 
             onClick={() => setShowConvertDialog(true)} 
             disabled={formData.status === 'Won' || isConverting}
             className={`w-full py-4 rounded-xl font-black uppercase tracking-wider text-sm shadow-lg transition-all flex justify-center items-center gap-2 mb-3 ${
               formData.status === 'Won' 
                 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                 : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-green-500/25 active:scale-[0.98]'
             }`}
          >
             <CheckCircle className="w-5 h-5" />
             {isConverting ? 'Generating...' : 'Convert to Contract'}
          </button>
        </div>
      </div>
      
      {/* Conversion Confirmation Dialog */}
      {showConvertDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                  <FileSignature className="w-5 h-5" />
               </div>
               <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">Convert Negotiation to Contract</h3>
                  <p className="text-xs font-medium text-gray-500">System workflow execution</p>
               </div>
            </div>
            <div className="p-6 space-y-4 text-sm text-gray-600 dark:text-gray-300">
               <p>This action will generate an official customer contract using the approved negotiation details. The following automations will trigger:</p>
               <ul className="space-y-2 font-medium bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-xs">
                 <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Convert Negotiation Stage to <strong className="text-green-600">WON</strong></li>
                 <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Create active Contract for <strong>{formData.dealName}</strong></li>
                 <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Lock upstream Estimation & Requirement modules</li>
                 <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Create immutable Audit Log entry</li>
               </ul>
               <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-900/50 rounded-lg flex gap-3 text-yellow-800 dark:text-yellow-400">
                 <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                 <p className="text-xs">Once converted, financial amounts and scope cannot be modified without an official Change Request workflow.</p>
               </div>
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900">
              <button 
                onClick={() => setShowConvertDialog(false)}
                disabled={isConverting}
                className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleConvertToContract}
                disabled={isConverting}
                className="px-5 py-2.5 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                {isConverting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Processing...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Confirm Conversion</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <CreateCustomerModal
        open={showCreateCustomer}
        onClose={() => setShowCreateCustomer(false)}
        businessId={businessId}
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
  const { businessId } = useParams();
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-[calc(100vh-theme(spacing.16))] bg-gray-50 dark:bg-gray-950">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Initializing Negotiation Engine...</p>
      </div>
    }>
      <CreateNegotiationContent businessId={businessId} />
    </Suspense>
  );
}
