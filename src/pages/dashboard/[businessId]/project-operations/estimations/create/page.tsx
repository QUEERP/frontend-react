import { toast } from 'sonner';
import React, { useState, useEffect, use, useMemo, Suspense } from 'react';
import { Link } from 'react-router-dom';
import {  useNavigate, useSearchParams  } from 'react-router-dom';
import { contactsAPI, Customer } from "@/lib/api/contacts";
import { usersAPI, BusinessUser } from "@/lib/api/users";
import { CreateCustomerModal } from "@/components/dashboard/create-customer-modal";
import { 
  ArrowLeft, Save, ChevronDown, CheckCircle, Info, FileText, User, 
  Target, Cpu, Calendar, DollarSign, Users, AlertTriangle, 
  Paperclip, Plus, Trash2, ShieldCheck, Box, History, Receipt, Truck, Calculator
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { projectOperationsAPI } from "@/lib/api/project-operations";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useBusinessData } from "@/components/dashboard/business-data-provider";
import { formatCurrency } from "@/lib/utils/currency";

// ------------------------------------------------------------------
// REUSABLE UI COMPONENTS (Outside to prevent remounting)
// ------------------------------------------------------------------

const InputField = ({ label, name, value, onChange, type = "text", placeholder = "", required = false, className = "col-span-1", readOnly = false }: any) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
      {label} {required && !readOnly && <span className="text-red-500">*</span>}
    </label>
    <input 
      type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly}
      className={`w-full p-2.5 border rounded-lg text-sm outline-none transition-all ${
        readOnly 
          ? 'bg-gray-100 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed font-medium'
          : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500'
      }`}
    />
  </div>
);

const SelectField = ({ label, name, value, onChange, options, required = false, className = "col-span-1", readOnly = false, children }: any) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
      {label} {required && !readOnly && <span className="text-red-500">*</span>}
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
    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{label}</label>
    <textarea 
      name={name} value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500 resize-y"
    />
  </div>
);

const SectionCard = ({ id, title, icon: Icon, isExpanded, onToggle, children }: any) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden mb-6">
      <div 
        className="px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        onClick={() => onToggle(id)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <Icon className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{title}</h2>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
      </div>
      <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="px-6 pb-6 pt-2 border-t border-gray-100 dark:border-gray-800">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// DATA MODELS
// ------------------------------------------------------------------

type LabourRow = { id: string; role: string; employee: string; hours: number; rate: number };
type MaterialRow = { id: string; item: string; quantity: number; unitCost: number };
type CostRow = { id: string; description: string; cost: number };

type EstimateFormData = {
  // General
  estNumber: string; estName: string; linkedReq: string; customer: string; inquiry: string;
  projectType: string; executionType: string; version: string; status: string;
  preparedBy: string; preparedDate: string; currency: string;
  // Project Summary
  projPriority: string; projDuration: string; projSize: string; expStart: string; expEnd: string;
  // Cost Arrays
  labour: LabourRow[];
  material: MaterialRow[];
  software: CostRow[];
  thirdParty: CostRow[];
  expenses: CostRow[];
  // Risk & Commercial
  riskBufferPct: number;
  discountPct: number;
  markupPct: number;
  taxPct: number;
  exchangeRate: number;
  // Approval
  reviewedBy: string; approvedBy: string; approvalStatus: string; approvalNotes: string;
};

const initialFormData: EstimateFormData = {
  estNumber: `EST-${Math.floor(100000 + Math.random() * 900000)}`,
  estName: '', linkedReq: '', customer: '', inquiry: '',
  projectType: '', executionType: '', version: 'v1.0', status: 'Draft',
  preparedBy: '', preparedDate: new Date().toISOString().split('T')[0], currency: 'USD',
  
  projPriority: '', projDuration: '', projSize: '', expStart: '', expEnd: '',
  
  labour: [],
  material: [],
  software: [],
  thirdParty: [],
  expenses: [],
  
  riskBufferPct: 0,
  discountPct: 0,
  markupPct: 0,
  taxPct: 0,
  exchangeRate: 1,
  
  reviewedBy: '', approvedBy: '', approvalStatus: '', approvalNotes: ''
};

const mockInquiries: Record<string, string[]> = {
  'Global Corp': ['INQ-1001', 'INQ-1002', 'INQ-1005'],
  'TechStart': ['INQ-1042']
};

// ------------------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------------------

function CreateEstimateContent({ businessId }: { businessId: string }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requirementId = searchParams.get('requirementId');
  const { toast } = useToast();
  const { currency, currencySymbol } = useBusinessData();

  const [formData, setFormData] = useState<EstimateFormData>(initialFormData);
  const [loadingReq, setLoadingReq] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [users, setUsers] = useState<BusinessUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  
  const [customerReqs, setCustomerReqs] = useState<any[]>([]);
  const [customerInquiries, setCustomerInquiries] = useState<any[]>([]);
  const [loadingCustomerReqs, setLoadingCustomerReqs] = useState(false);
  const [loadingCustomerInquiries, setLoadingCustomerInquiries] = useState(false);
  const [reqsError, setReqsError] = useState('');
  const [inquiriesError, setInquiriesError] = useState('');
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

  useEffect(() => {
    if (!requirementId || customers.length === 0) return;
    const fetchRequirementDetails = async () => {
      try {
        setLoadingReq(true);
        const res = await projectOperationsAPI.getRequirementDetails(businessId, requirementId);
        const reqData = res.requirement || res.data;
        if (reqData) {
          const matchedCustomer = customers.find(c => c.id === reqData.customerId || c.id === reqData.customer?.id);
          const inquiryId = reqData.inquiries && reqData.inquiries.length > 0 ? reqData.inquiries[0].id : '';
          
          setFormData(prev => ({
            ...prev,
            linkedReq: reqData.id,
            estName: reqData.title || prev.estName,
            customer: matchedCustomer?.id || prev.customer,
            inquiry: inquiryId || prev.inquiry,
            projectType: reqData.projectType || prev.projectType,
            executionType: reqData.executionType || prev.executionType,
            projPriority: reqData.priority || prev.projPriority,
            currency: reqData.currency || prev.currency
          }));
        }
      } catch (error) {
        console.error("Failed to load requirement details:", error);
      } finally {
        setLoadingReq(false);
      }
    };
    fetchRequirementDetails();
  }, [requirementId, businessId, customers]);
  
  // Fetch requirements & inquiries when customer changes
  useEffect(() => {
    if (!formData.customer || formData.customer === 'CREATE_NEW_CUSTOMER') {
      setCustomerReqs([]);
      setCustomerInquiries([]);
      return;
    }
    const fetchCustomerData = async () => {
      try {
        setLoadingCustomerReqs(true);
        setLoadingCustomerInquiries(true);
        setReqsError('');
        setInquiriesError('');
        
        const [reqsRes, inqRes] = await Promise.all([
          projectOperationsAPI.getRequirements(businessId, formData.customer, 'open').catch(e => {
            setReqsError('Failed to load requirements. Retry');
            console.error(e);
            return { requirements: [] };
          }),
          // Assuming getInquiriesByCustomer exists or we can just fetch all and filter client side if it doesn't.
          // The backend getInquiries supports ?customerId=
          projectOperationsAPI.getInquiriesByCustomer ? 
            projectOperationsAPI.getInquiriesByCustomer(businessId, formData.customer).catch(e => {
              setInquiriesError('Failed to load inquiries. Retry');
              console.error(e);
              return { inquiries: [] };
            }) :
            // fallback
            projectOperationsAPI.getInquiries(businessId).catch(e => {
              setInquiriesError('Failed to load inquiries. Retry');
              return { inquiries: [] };
            })
        ]);
        
        setCustomerReqs(reqsRes.requirements || []);
        
        // If fallback was used, filter client side
        let inquiries = inqRes.inquiries || inqRes.data || [];
        if (!projectOperationsAPI.getInquiriesByCustomer) {
          inquiries = inquiries.filter((inq: any) => inq.customerId === formData.customer || inq.customer?.id === formData.customer);
        }
        setCustomerInquiries(inquiries);
        
      } finally {
        setLoadingCustomerReqs(false);
        setLoadingCustomerInquiries(false);
      }
    };
    fetchCustomerData();
  }, [formData.customer, businessId]);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    general: true, summary: true, labour: true, material: false, software: false,
    thirdParty: false, expenses: false, commercial: true, total: true, approval: false, attachments: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'customer') {
        if (value === 'CREATE_NEW_CUSTOMER') {
          setShowCreateCustomer(true);
          return prev;
        }
        updated.inquiry = '';
        updated.linkedReq = ''; // reset on customer change
      }
      if (name === 'linkedReq') {
        const reqData = customerReqs.find(r => r.id === value);
        if (reqData) {
          updated.projectType = reqData.projectType || '';
          updated.executionType = reqData.executionType || '';
          updated.projSize = reqData.projectSize || '';
          updated.projPriority = reqData.priority || '';
          updated.projDuration = reqData.estimatedDuration || '';
          updated.expStart = reqData.targetDeliveryDate ? new Date(reqData.targetDeliveryDate).toISOString().split('T')[0] : '';
          updated.expEnd = ''; // allow manual entry
        } else {
          updated.projectType = '';
          updated.executionType = '';
          updated.projSize = '';
          updated.projPriority = '';
          updated.projDuration = '';
          updated.expStart = '';
          updated.expEnd = '';
        }
      }
      return updated;
    });
  };
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  // Row Management
  const updateArrayField = (arrayName: keyof EstimateFormData, id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: (prev[arrayName] as any[]).map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const addRow = (arrayName: keyof EstimateFormData, template: any) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: [...(prev[arrayName] as any[]), { ...template, id: Date.now().toString() }]
    }));
  };

  const removeRow = (arrayName: keyof EstimateFormData, id: string) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: (prev[arrayName] as any[]).filter(item => item.id !== id)
    }));
  };

  // Auto Calculations
  const calculations = useMemo(() => {
    const labourTotal = formData.labour.reduce((acc, row) => acc + (row.hours * row.rate), 0);
    const materialTotal = formData.material.reduce((acc, row) => acc + (row.quantity * row.unitCost), 0);
    const softwareTotal = formData.software.reduce((acc, row) => acc + Number(row.cost || 0), 0);
    const thirdPartyTotal = formData.thirdParty.reduce((acc, row) => acc + Number(row.cost || 0), 0);
    const expensesTotal = formData.expenses.reduce((acc, row) => acc + Number(row.cost || 0), 0);

    const baseCost = labourTotal + materialTotal + softwareTotal + thirdPartyTotal + expensesTotal;
    const riskAmount = baseCost * (formData.riskBufferPct / 100);
    const subTotalCost = baseCost + riskAmount;

    const markupAmount = subTotalCost * (formData.markupPct / 100);
    const discountAmount = subTotalCost * (formData.discountPct / 100);
    const profit = markupAmount - discountAmount;

    const totalBeforeTax = subTotalCost + profit;
    const taxAmount = totalBeforeTax * (formData.taxPct / 100);
    const grandTotal = totalBeforeTax + taxAmount;

    return {
      labourTotal, materialTotal, softwareTotal, thirdPartyTotal, expensesTotal,
      baseCost, riskAmount, subTotalCost, markupAmount, discountAmount, profit, totalBeforeTax, taxAmount, grandTotal
    };
  }, [formData]);

  const completion = useMemo(() => {
    let score = 0;
    if (formData.estName) score += 20;
    if (formData.customer && formData.customer !== 'CREATE_NEW_CUSTOMER') score += 20;
    if (formData.linkedReq) score += 20;
    if (calculations.baseCost > 0) score += 40;
    return score;
  }, [formData, calculations]);

  const handleSave = async (action: string) => {
    console.log(`Estimate Action: ${action}`, formData);
    try {
      if (action !== 'draft') {
        if (!formData.estName || !formData.customer || !formData.linkedReq) {
          toast({ title: "Validation Error", description: "Please fill Estimate Name, Customer, and Linked Requirement.", variant: "destructive" });
          return;
        }
      }
      
      setIsSaving(true);
      const payload = {
        title: formData.estName || 'Untitled Estimate',
        requirementId: formData.linkedReq || null,
        customerId: formData.customer || null,
        materialCost: calculations.materialTotal,
        labourCost: calculations.labourTotal,
        machineCost: 0,
        subcontractCost: calculations.thirdPartyTotal,
        travelCost: calculations.expensesTotal,
        miscCost: calculations.softwareTotal,
        tax: calculations.taxAmount,
        profitMargin: calculations.markupAmount,
        totalCost: calculations.grandTotal,
        internalNotes: formData.approvalNotes,
        status: action === 'draft' ? 'Draft' : (action === 'proposal' ? 'Approved for Proposal' : 'Pending Approval')
      };
      
      const res = await projectOperationsAPI.createEstimation(businessId, payload);
      
      // Update UI state with saved status
      setFormData(prev => ({ ...prev, approvalStatus: payload.status }));
      
      if (action === 'draft') {
        toast({ title: "Success", description: "Draft saved successfully!" });
      } else if (action === 'proposal') {
        toast({ title: "Success", description: "Estimate saved. Proposal draft created." });
        navigate(`/dashboard/${businessId}/project-operations/proposals/create?estimateId=${res.estimation?.id || res.data?.id}`);
      } else {
        toast({ title: "Success", description: "Estimate saved successfully." });
        navigate(`/dashboard/${businessId}/project-operations/estimations`);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save estimate", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Enterprise Estimate", 14, 22);
      
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Estimate #: ${formData.estNumber}`, 14, 32);
      doc.text(`Date: ${formData.preparedDate}`, 14, 38);
      
      const matchedCustomer = customers.find(c => c.id === formData.customer);
      doc.text(`Customer: ${matchedCustomer ? (matchedCustomer as any).company || matchedCustomer.name : 'N/A'}`, 14, 44);
      doc.text(`Status: ${formData.status}`, 14, 50);

      const tableColumn = ["Description", "Cost"];
      const tableRows = [
        ["Labour Cost", formatCurrency(calculations.labourTotal, currency, currencySymbol)],
        ["Material Cost", formatCurrency(calculations.materialTotal, currency, currencySymbol)],
        ["Software Cost", formatCurrency(calculations.softwareTotal, currency, currencySymbol)],
        ["Third-Party Cost", formatCurrency(calculations.thirdPartyTotal, currency, currencySymbol)],
        ["Expenses", formatCurrency(calculations.expensesTotal, currency, currencySymbol)],
        ["---", "---"],
        ["Base Cost", formatCurrency(calculations.baseCost, currency, currencySymbol)],
        ["Risk Buffer", formatCurrency(calculations.riskAmount, currency, currencySymbol)],
        ["Profit Margin", formatCurrency(calculations.markupAmount, currency, currencySymbol)],
        ["Tax", formatCurrency(calculations.taxAmount, currency, currencySymbol)],
        ["GRAND TOTAL", formatCurrency(calculations.grandTotal, currency, currencySymbol)]
      ];

      (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 60,
        theme: 'grid',
      });
      
      doc.save(`${formData.estNumber}-Summary.pdf`);
      toast({ title: "Success", description: "PDF generated successfully." });
    } catch (err: any) {
      toast({ title: "Export Failed", description: err.message || "Failed to generate PDF", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-full bg-gray-100 dark:bg-gray-950">
      
      {/* LEFT PANE: Form Sections */}
      <div className="flex-1 p-4 md:p-6 lg:p-8 w-full max-w-5xl mx-auto">
        
        {/* Header Breadcrumb & Title */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <Link to={`/dashboard/${businessId}/project-operations/estimations`}
                className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </Link>
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <span>Project Operations</span>
                <span>/</span>
                <span className="text-blue-600 dark:text-blue-400">New Estimate</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={handleExportPDF}
                disabled={isSaving || isExporting}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isExporting ? <span className="animate-spin w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full"></span> : <FileText className="w-4 h-4"/>}
                Export PDF
              </button>
              <button 
                onClick={() => handleSave('draft')}
                disabled={isSaving || isExporting}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : "Save Draft"}
              </button>
              <button 
                onClick={() => handleSave('save')}
                disabled={isSaving || isExporting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> : <Save className="w-4 h-4"/>}
                Save Estimate
              </button>
              <button 
                onClick={() => handleSave('proposal')}
                disabled={isSaving || isExporting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> : <CheckCircle className="w-4 h-4"/>}
                Save & Create Proposal
              </button>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Create Enterprise Estimate</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm max-w-2xl">
            Complete the cost estimation for the project. This financial model auto-calculates totals and serves as the baseline for the final Quotation & Proposal.
          </p>
        </div>

        {/* 1. General Information */}
        <SectionCard id="general" title="1. General Information" icon={Info} isExpanded={expandedSections.general} onToggle={toggleSection}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <InputField label="Estimate Number" name="estNumber" value={formData.estNumber} readOnly />
            <InputField label="Estimate Name" name="estName" value={formData.estName} onChange={handleInputChange} required className="md:col-span-2" placeholder="e.g. ERP Phase 1 Cost Model" />
            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Linked Requirement <span className="text-red-500">*</span>
              </label>
              {loadingCustomerReqs ? (
                <div className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 flex items-center justify-between">
                  <span>Loading...</span> <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              ) : formData.customer ? (
                customerReqs.length > 0 ? (
                  <select
                    name="linkedReq"
                    value={formData.linkedReq}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">Select Requirement...</option>
                    {customerReqs.map(r => (
                      <option key={r.id} value={r.id}>{r.requirementNumber} — {r.title}</option>
                    ))}
                  </select>
                ) : (
                  <select disabled className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500">
                    <option>No requirements found for this customer</option>
                  </select>
                )
              ) : (
                <select disabled className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500">
                  <option>Select a customer first</option>
                </select>
              )}
              {reqsError && <p className="text-xs text-red-500">{reqsError} <button onClick={() => setFormData(prev => ({...prev}))} className="underline text-blue-600">Retry</button></p>}
              {formData.customer && customerReqs.length === 0 && !loadingCustomerReqs && (
                <Link to={`/dashboard/${businessId}/project-operations/requirements/create`} className="text-xs text-blue-600 hover:underline mt-1 block">
                  + Create New Requirement
                </Link>
              )}
            </div>
            <SelectField label="Customer" name="customer" value={formData.customer} onChange={handleInputChange} readOnly={customersLoading || loadingReq || !!requirementId}>
              <option value="CREATE_NEW_CUSTOMER" className="text-blue-600 font-bold bg-blue-50">+ Create New Customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{(c as any)?.company || c?.name || "Unnamed Customer"}</option>
              ))}
            </SelectField>
            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Inquiry
              </label>
              {loadingCustomerInquiries ? (
                <div className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 flex items-center justify-between">
                  <span>Loading...</span> <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              ) : formData.customer && formData.customer !== 'CREATE_NEW_CUSTOMER' ? (
                customerInquiries.length > 0 ? (
                  <select
                    name="inquiry"
                    value={formData.inquiry}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">Select Inquiry...</option>
                    {customerInquiries.map(inq => (
                      <option key={inq.id} value={inq.id}>{inq.inquiryNumber || inq.id} — {inq.title || inq.company || 'Inquiry'}</option>
                    ))}
                  </select>
                ) : (
                  <select disabled className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500">
                    <option>No inquiries found for this customer</option>
                  </select>
                )
              ) : (
                <select disabled className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500">
                  <option>Select a customer first</option>
                </select>
              )}
              {inquiriesError && <p className="text-xs text-red-500">{inquiriesError}</p>}
            </div>
            <SelectField label="Status" name="status" value={formData.status} onChange={handleInputChange} options={['Draft', 'In Review', 'Approved']} />
            <InputField label="Prepared Date" name="preparedDate" value={formData.preparedDate} type="date" onChange={handleInputChange} />
          </div>
        </SectionCard>

        {/* 2. Project Summary */}
        <SectionCard id="summary" title="2. Project Summary (Auto-Filled)" icon={Target} isExpanded={expandedSections.summary} onToggle={toggleSection}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <InputField label="Project Type" name="projectType" value={formData.projectType} onChange={handleInputChange} />
            <InputField label="Execution Type" name="executionType" value={formData.executionType} onChange={handleInputChange} />
            <InputField label="Project Size" name="projSize" value={formData.projSize} onChange={handleInputChange} />
            <InputField label="Priority" name="projPriority" value={formData.projPriority} onChange={handleInputChange} />
            <InputField label="Duration" name="projDuration" value={formData.projDuration} onChange={handleInputChange} />
            <InputField label="Expected Start" name="expStart" value={formData.expStart} type="date" onChange={handleInputChange} />
            <InputField label="Expected End" name="expEnd" value={formData.expEnd} type="date" onChange={handleInputChange} />
          </div>
        </SectionCard>

        {/* 3. Labour Cost */}
        <SectionCard id="labour" title="3. Labour & Resource Cost" icon={Users} isExpanded={expandedSections.labour} onToggle={toggleSection}>
          <div className="space-y-3">
            <div className="hidden md:grid grid-cols-12 gap-4 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">Role</div>
              <div className="col-span-3">Employee / Resource</div>
              <div className="col-span-2">Total Hours</div>
              <div className="col-span-2">Hourly Rate</div>
              <div className="col-span-1">Total</div>
              <div className="col-span-1 text-center">Action</div>
            </div>
            {formData.labour.map((row) => (
              <div key={row.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-gray-50 dark:bg-gray-800/30 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                <input type="text" value={row.role} onChange={e => updateArrayField('labour', row.id, 'role', e.target.value)} placeholder="Role" className="col-span-3 w-full p-2 border rounded-lg text-sm bg-white dark:bg-gray-900 dark:border-gray-700" />
                <select value={row.employee} onChange={e => updateArrayField('labour', row.id, 'employee', e.target.value)} disabled={usersLoading} className="col-span-3 w-full p-2 border rounded-lg text-sm bg-white dark:bg-gray-900 dark:border-gray-700 outline-none">
                  <option value="">{usersLoading ? "Loading..." : "Select Employee..."}</option>
                  {users.map(u => {
                    const name = u.user?.name || u.user?.email || "Unknown";
                    return <option key={u.id} value={name}>{name}</option>;
                  })}
                </select>
                <input type="number" value={row.hours} onChange={e => updateArrayField('labour', row.id, 'hours', parseFloat(e.target.value) || 0)} className="col-span-2 w-full p-2 border rounded-lg text-sm bg-white dark:bg-gray-900 dark:border-gray-700" />
                <input type="number" value={row.rate} onChange={e => updateArrayField('labour', row.id, 'rate', parseFloat(e.target.value) || 0)} className="col-span-2 w-full p-2 border rounded-lg text-sm bg-white dark:bg-gray-900 dark:border-gray-700" />
                <div className="col-span-1 font-bold text-sm text-gray-900 dark:text-gray-100">{formatCurrency(row.hours * row.rate, currency, currencySymbol)}</div>
                <button onClick={() => removeRow('labour', row.id)} className="col-span-1 p-2 text-red-500 hover:bg-red-50 rounded-lg mx-auto"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <div className="flex justify-between items-center mt-2">
              <button onClick={() => addRow('labour', { role: '', employee: '', hours: 0, rate: 0 })} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <Plus className="w-4 h-4" /> Add Labour
              </button>
              <div className="font-bold text-gray-900 dark:text-white">Labour Total: {formatCurrency(calculations.labourTotal, currency, currencySymbol)}</div>
            </div>
          </div>
        </SectionCard>

        {/* 4. Material Cost */}
        <SectionCard id="material" title="4. Material & Hardware Cost" icon={Box} isExpanded={expandedSections.material} onToggle={toggleSection}>
          <div className="space-y-3">
             <div className="hidden md:grid grid-cols-12 gap-4 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <div className="col-span-6">Item / Component</div>
              <div className="col-span-2">Quantity</div>
              <div className="col-span-2">Unit Cost</div>
              <div className="col-span-1">Total</div>
              <div className="col-span-1 text-center">Action</div>
            </div>
            {formData.material.map((row) => (
              <div key={row.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-gray-50 dark:bg-gray-800/30 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                <input type="text" value={row.item} onChange={e => updateArrayField('material', row.id, 'item', e.target.value)} placeholder="Material description" className="col-span-6 w-full p-2 border rounded-lg text-sm bg-white dark:bg-gray-900 dark:border-gray-700" />
                <input type="number" value={row.quantity} onChange={e => updateArrayField('material', row.id, 'quantity', parseFloat(e.target.value) || 0)} className="col-span-2 w-full p-2 border rounded-lg text-sm bg-white dark:bg-gray-900 dark:border-gray-700" />
                <input type="number" value={row.unitCost} onChange={e => updateArrayField('material', row.id, 'unitCost', parseFloat(e.target.value) || 0)} className="col-span-2 w-full p-2 border rounded-lg text-sm bg-white dark:bg-gray-900 dark:border-gray-700" />
                <div className="col-span-1 font-bold text-sm text-gray-900 dark:text-gray-100">{formatCurrency(row.quantity * row.unitCost, currency, currencySymbol)}</div>
                <button onClick={() => removeRow('material', row.id)} className="col-span-1 p-2 text-red-500 hover:bg-red-50 rounded-lg mx-auto"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <div className="flex justify-between items-center mt-2">
              <button onClick={() => addRow('material', { item: '', quantity: 1, unitCost: 0 })} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <Plus className="w-4 h-4" /> Add Material
              </button>
              <div className="font-bold text-gray-900 dark:text-white">Material Total: {formatCurrency(calculations.materialTotal, currency, currencySymbol)}</div>
            </div>
          </div>
        </SectionCard>

        {/* 5, 6, 7 Generic Cost Cards */}
        <SectionCard id="software" title="5. Software & Licensing Cost" icon={Cpu} isExpanded={expandedSections.software} onToggle={toggleSection}>
          <GenericCostTable arrayName="software" formData={formData} updateArrayField={updateArrayField} removeRow={removeRow} addRow={addRow} title="Software" total={calculations.softwareTotal} />
        </SectionCard>
        
        <SectionCard id="thirdParty" title="6. Third-Party Services" icon={User} isExpanded={expandedSections.thirdParty} onToggle={toggleSection}>
          <GenericCostTable arrayName="thirdParty" formData={formData} updateArrayField={updateArrayField} removeRow={removeRow} addRow={addRow} title="Third-Party" total={calculations.thirdPartyTotal} />
        </SectionCard>

        <SectionCard id="expenses" title="7. Travel & Misc Expenses" icon={Truck} isExpanded={expandedSections.expenses} onToggle={toggleSection}>
          <GenericCostTable arrayName="expenses" formData={formData} updateArrayField={updateArrayField} removeRow={removeRow} addRow={addRow} title="Expenses" total={calculations.expensesTotal} />
        </SectionCard>

        {/* 11. Commercial Details */}
        <SectionCard id="commercial" title="11. Risk Buffer & Commercial Details" icon={ShieldCheck} isExpanded={expandedSections.commercial} onToggle={toggleSection}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Risk Buffer (%)</label>
              <input type="number" name="riskBufferPct" value={formData.riskBufferPct} onChange={handleNumberChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Markup / Profit (%)</label>
              <input type="number" name="markupPct" value={formData.markupPct} onChange={handleNumberChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Discount (%)</label>
              <input type="number" name="discountPct" value={formData.discountPct} onChange={handleNumberChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Tax Rate (%)</label>
              <input type="number" name="taxPct" value={formData.taxPct} onChange={handleNumberChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>
        </SectionCard>

        {/* 12. Final Cost Summary */}
        <SectionCard id="total" title="12. Enterprise Cost Summary (Auto-Calculated)" icon={Calculator} isExpanded={expandedSections.total} onToggle={toggleSection}>
          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="grid grid-cols-2 text-sm">
              <span className="text-gray-500">Base Cost (Labour + Material + SW + Services + Travel):</span>
              <span className="font-semibold text-right">{formatCurrency(calculations.baseCost, currency, currencySymbol)}</span>
            </div>
            <div className="grid grid-cols-2 text-sm text-orange-600">
              <span>Risk Buffer Contingency ({formData.riskBufferPct}%):</span>
              <span className="font-semibold text-right">+ {formatCurrency(calculations.riskAmount, currency, currencySymbol)}</span>
            </div>
            <div className="grid grid-cols-2 text-sm font-bold border-t border-gray-200 pt-3">
              <span>Sub-Total (Project Cost):</span>
              <span className="text-right">{formatCurrency(calculations.subTotalCost, currency, currencySymbol)}</span>
            </div>
            
            <div className="grid grid-cols-2 text-sm text-blue-600 pt-3">
              <span>Gross Profit Markup ({formData.markupPct}%):</span>
              <span className="font-semibold text-right">+ {formatCurrency(calculations.markupAmount, currency, currencySymbol)}</span>
            </div>
            <div className="grid grid-cols-2 text-sm text-red-500">
              <span>Discount Applied ({formData.discountPct}%):</span>
              <span className="font-semibold text-right">- {formatCurrency(calculations.discountAmount, currency, currencySymbol)}</span>
            </div>
            
            <div className="grid grid-cols-2 text-sm border-t border-gray-200 pt-3">
              <span className="font-bold">Total Before Tax:</span>
              <span className="font-bold text-right">{formatCurrency(calculations.totalBeforeTax, currency, currencySymbol)}</span>
            </div>
            <div className="grid grid-cols-2 text-sm text-gray-500">
              <span>Tax ({formData.taxPct}%):</span>
              <span className="font-semibold text-right">+ {formatCurrency(calculations.taxAmount, currency, currencySymbol)}</span>
            </div>
            
            <div className="grid grid-cols-2 text-xl font-black border-t-2 border-gray-800 pt-4 text-green-600">
              <span>GRAND TOTAL:</span>
              <span className="text-right">{formatCurrency(calculations.grandTotal, currency, currencySymbol)}</span>
            </div>
            <p className="text-xs text-gray-400 text-center mt-4 uppercase tracking-wider">Values are completely auto-calculated to prevent human error.</p>
          </div>
        </SectionCard>
        
        <div className="h-24 lg:hidden"></div>
      </div>

      {/* RIGHT PANE: Sticky Summary & Actions */}
      <div className="hidden lg:flex flex-col w-[360px] xl:w-[380px] flex-shrink-0 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-xl z-10 sticky top-0 h-[calc(100vh-theme(spacing.16))]">
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Cost Model Completion</h3>
              <p className="text-[11px] text-gray-500">All cost components verified</p>
            </div>
            <span className="text-lg font-black text-green-600">{completion}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${completion}%` }}></div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-2">
            <Target className="w-3.5 h-3.5" /> Financial Snapshot
          </h3>
          
          <div className="flex flex-col gap-1 pb-3 border-b border-gray-100 border-dashed">
            <span className="text-[11px] text-gray-500 font-medium">Customer</span>
            <span className="text-sm font-bold truncate">{formData.customer}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pb-3 border-b border-gray-100 border-dashed">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-gray-500 font-medium">Base Cost</span>
              <span className="text-sm font-bold">{formatCurrency(calculations.baseCost, currency, currencySymbol)}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-gray-500 font-medium">Net Profit</span>
              <span className="text-sm font-bold text-blue-600">{formatCurrency(calculations.profit, currency, currencySymbol)}</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-0.5 pb-3 border-b border-gray-100 border-dashed">
            <span className="text-[11px] text-gray-500 font-medium">Grand Total Value</span>
            <span className="text-xl font-black text-green-600">{formatCurrency(calculations.grandTotal, currency, currencySymbol)}</span>
          </div>

          {formData.approvalStatus && (
            <div className="flex justify-between items-center pb-3">
              <span className="text-[11px] text-gray-500 font-medium">Approval Status</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-yellow-100 text-yellow-700">
                {formData.approvalStatus}
              </span>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-200 dark:border-gray-800 bg-gray-50/80 space-y-2.5">
          <button onClick={() => handleSave('proposal')} className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 shadow-md">
            <Receipt className="w-4 h-4" /> Save & Create Proposal
          </button>
          
          <button onClick={() => handleSave('save')} className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md">
            <Save className="w-4 h-4" /> Save Estimate
          </button>

          <button className="w-full flex items-center justify-center gap-2 py-2 border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-100">
            <FileText className="w-4 h-4" /> Export PDF Summary
          </button>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button className="py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold hover:bg-gray-50">Save Draft</button>
            <button onClick={() => navigate(`/dashboard/${businessId}/project-operations/estimations`)} className="py-2 bg-gray-100 rounded-lg text-sm font-bold hover:bg-gray-200">Cancel</button>
          </div>
        </div>
      </div>

      <CreateCustomerModal
        open={showCreateCustomer}
        onClose={() => setShowCreateCustomer(false)}
        businessId={businessId}
        onCreated={(newCustomer: any) => {
          setCustomers((prev) => [...prev, newCustomer]);
          setFormData((prev: any) => ({
            ...prev,
            customer: newCustomer.id,
            inquiry: ''
          }));
          setShowCreateCustomer(false);
        }}
      />
    </div>
  );
}

const GenericCostTable = ({ arrayName, formData, updateArrayField, removeRow, addRow, title, total }: any) => {
  const { currency, currencySymbol } = useBusinessData();
  return (
    <div className="space-y-3">
      <div className="hidden md:grid grid-cols-12 gap-4 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
        <div className="col-span-8">Description</div>
        <div className="col-span-3">Cost</div>
        <div className="col-span-1 text-center">Action</div>
      </div>
      {formData[arrayName].map((row: any) => (
        <div key={row.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-gray-50 dark:bg-gray-800/30 p-3 rounded-xl border border-gray-100">
          <input type="text" value={row.description} onChange={e => updateArrayField(arrayName, row.id, 'description', e.target.value)} placeholder="Description" className="col-span-8 w-full p-2 border rounded-lg text-sm bg-white" />
          <input type="number" value={row.cost} onChange={e => updateArrayField(arrayName, row.id, 'cost', parseFloat(e.target.value) || 0)} className="col-span-3 w-full p-2 border rounded-lg text-sm bg-white" />
          <button onClick={() => removeRow(arrayName, row.id)} className="col-span-1 p-2 text-red-500 hover:bg-red-50 rounded-lg mx-auto"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
      <div className="flex justify-between items-center mt-2">
        <button onClick={() => addRow(arrayName, { description: '', cost: 0 })} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
          <Plus className="w-4 h-4" /> Add {title}
        </button>
        <div className="font-bold text-gray-900">Total: {formatCurrency(total, currency, currencySymbol)}</div>
      </div>
    </div>
  );
};

export default function CreateEstimatePage() {
  const { businessId } = useParams();
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-[calc(100vh-theme(spacing.16))] bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Initializing Estimate Workspace...</p>
      </div>
    }>
      <CreateEstimateContent businessId={businessId} />
    </Suspense>
  );
}
