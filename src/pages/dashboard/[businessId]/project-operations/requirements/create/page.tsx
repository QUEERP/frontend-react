import { toast } from 'sonner';
import React, { useState, useEffect, use, Suspense } from 'react';
import {  Link , useParams } from 'react-router-dom';
import {  useNavigate, useSearchParams  } from 'react-router-dom';
import { contactsAPI, Customer } from "@/lib/api/contacts";
import { usersAPI, BusinessUser } from "@/lib/api/users";
import { leadsAPI } from "@/lib/api/leads";
import { projectOperationsAPI } from "@/lib/api/project-operations";
import { CreateCustomerModal } from "@/components/dashboard/create-customer-modal";
import { UserSelect } from "@/components/project-operations/UserSelect";
import { useToast } from "@/components/ui/use-toast";
import { 
  ArrowLeft, Save, ChevronDown, CheckCircle, Info, Briefcase, User, 
  Target, Cpu, ListChecks, Calendar, DollarSign, Users, AlertTriangle, 
  Paperclip, FileText, Trash2, Plus, Upload
} from 'lucide-react';

// Form Data Type definition for autocomplete and type safety
type Deliverable = { id: string; name: string; description: string; owner: string; dueDate: string; status: string };
type TeamMemberAssignment = { id: string; role: string; member: string };

type RequirementFormData = {
  // 1. General
  reqNumber: string; title: string; linkedInquiry: string; customer: string; 
  projectType: string; businessType: string; executionType: string; 
  status: string; priority: string; category: string; businessUnit: string; currency: string;
  // 2. Customer
  contactPerson: string; designation: string; email: string; phone: string;
  company: string; industry: string; country: string; timezone: string;
  // 3. Project
  projectSize: string; estimatedBudget: string; expectedRevenue: string; 
  expectedProfit: string; expectedMargin: string;
  // 4. Business
  businessObjective: string; currentProblem: string; businessRequirement: string;
  expectedSolution: string; scope: string; outOfScope: string;
  successCriteria: string; assumptions: string; dependencies: string;
  // 5. Technical
  technologyStack: string; integrations: string; apiRequirements: string;
  database: string; security: string; performance: string; hosting: string; compliance: string;
  // 6. Deliverables
  deliverables: Deliverable[];
  // 7. Timeline
  requirementDate: string; expectedStartDate: string; expectedEndDate: string;
  estimatedDuration: string; decisionDeadline: string; goLiveTarget: string;
  // 8. Commercial
  budgetRange: string; billingModel: string; paymentTerms: string;
  // 9. Team
  team: TeamMemberAssignment[];
  // 10. Risk
  riskLevel: string; complexity: string; technicalRisk: string; businessRisk: string; approvalRequired: string;
  // 11. Attachments
  attachments: File[];
  // 12. Notes
  salesNotes: string; baNotes: string; managementNotes: string;
};

const initialFormData: RequirementFormData = {
  reqNumber: `REQ-${Math.floor(10000 + Math.random() * 90000)}`,
  title: '', linkedInquiry: '', customer: '', projectType: '', businessType: '', executionType: '', status: 'Draft', priority: '', category: '', businessUnit: '', currency: '',
  contactPerson: '', designation: '', email: '', phone: '', company: '', industry: '', country: '', timezone: '',
  projectSize: '', estimatedBudget: '', expectedRevenue: '', expectedProfit: '', expectedMargin: '',
  businessObjective: '', currentProblem: '', businessRequirement: '', expectedSolution: '', scope: '', outOfScope: '', successCriteria: '', assumptions: '', dependencies: '',
  technologyStack: '', integrations: '', apiRequirements: '', database: '', security: '', performance: '', hosting: '', compliance: '',
  deliverables: [],
  requirementDate: new Date().toISOString().split('T')[0], expectedStartDate: '', expectedEndDate: '', estimatedDuration: '', decisionDeadline: '', goLiveTarget: '',
  budgetRange: '', billingModel: '', paymentTerms: '',
  team: [],
  riskLevel: '', complexity: '', technicalRisk: '', businessRisk: '', approvalRequired: 'No',
  attachments: [],
  salesNotes: '', baNotes: '', managementNotes: ''
};

// ------------------------------------------------------------------
// MOCK DATA FOR DEPENDENCIES
// ------------------------------------------------------------------
// Inquiries are kept mock for now since we focus on real customers
const mockInquiries: Record<string, string[]> = {
  'Global Corp': ['INQ-1001', 'INQ-1002', 'INQ-1005'],
  'TechStart': ['INQ-1042']
};

const countryTimezoneMap: Record<string, string> = {
  'United States': 'UTC-5 (EST)',
  'United Kingdom': 'UTC+0 (GMT)',
  'United Arab Emirates': 'UTC+4 (GST)',
  'India': 'UTC+5:30 (IST)',
  'Singapore': 'UTC+8 (SGT)',
  'Australia': 'UTC+10 (AEST)'
};

const teamRoles = ['Sales Executive', 'Business Analyst', 'Project Manager', 'Solution Architect', 'Technical Lead', 'Developer', 'Designer'];

// ------------------------------------------------------------------
// REUSABLE UI COMPONENTS (Defined outside to prevent remounting)
// ------------------------------------------------------------------

const InputField = ({ label, name, value, onChange, type = "text", placeholder = "", required = false, className = "col-span-1" }: any) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{label} {required && <span className="text-red-500">*</span>}</label>
    <input 
      type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
      className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
    />
  </div>
);

const SelectField = ({ label, name, value, onChange, options, required = false, action, className = "col-span-1", children, disabled = false, placeholder = "Select..." }: any) => (
  <div className={`space-y-1.5 ${className}`}>
    <div className="flex justify-between items-center">
      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{label} {required && <span className="text-red-500">*</span>}</label>
      {action && <div>{action}</div>}
    </div>
    <select 
      name={name} value={value} onChange={onChange} disabled={disabled}
      className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all cursor-pointer disabled:opacity-50"
    >
      {placeholder && <option value="">{placeholder}</option>}
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
      
      {/* CSS Grid for smooth accordion expand/collapse without re-mounting */}
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
// MAIN PAGE COMPONENT
// ------------------------------------------------------------------

function RequirementFormContent({ businessId }: { businessId: string }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inquiryId = searchParams.get('inquiryId');

  const [formData, setFormData] = useState<RequirementFormData>(initialFormData);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [users, setUsers] = useState<BusinessUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(true);
  
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

  // Pre-fill data if inquiryId is provided
  useEffect(() => {
    if (!inquiryId || customers.length === 0) return;
    const prefillInquiry = async () => {
      try {
        const res = await leadsAPI.getLeadDetails(businessId, inquiryId);
        const inq = (res as any).data || (res as any).lead || res;
        if (inq) {
          const matchedCustomer = customers.find(c => c.id === inq.customerId || c.company === inq.company || c.name === inq.name);
          setFormData(prev => ({
            ...prev,
            title: inq.inquiryTitle || inq.name || prev.title,
            customer: matchedCustomer?.id || prev.customer,
            linkedInquiry: inq.id,
            contactPerson: inq.name || prev.contactPerson,
            email: inq.email || prev.email,
            phone: inq.phone || prev.phone,
            company: inq.company || prev.company,
            businessObjective: inq.description || inq.businessRequirement || prev.businessObjective,
            estimatedBudget: inq.expectedRevenue || inq.budgetRange || prev.estimatedBudget,
            priority: inq.priority || prev.priority,
            projectType: inq.projectType || prev.projectType,
            executionType: inq.executionType || prev.executionType,
            country: matchedCustomer?.country || prev.country
          }));
        }
      } catch (err) {
        console.error("Failed to fetch inquiry details:", err);
      }
    };
    prefillInquiry();
  }, [inquiryId, businessId, customers]);

  useEffect(() => {
    if (!formData.customer || formData.customer === 'CREATE_NEW_CUSTOMER') {
      setInquiries([]);
      setInquiriesLoading(false);
      return;
    }
    const fetchInquiries = async () => {
      try {
        setInquiriesLoading(true);
        console.log(`[LinkedInquiry] Fetching for customerId=${formData.customer}, businessId=${businessId}`);
        const res = await projectOperationsAPI.getInquiriesByCustomer(businessId, formData.customer);
        console.log(`[LinkedInquiry] Raw API response:`, res);
        const list = Array.isArray(res) ? res : (res?.inquiries || res?.data || []);
        console.log(`[LinkedInquiry] Parsed list length: ${list.length}`);
        setInquiries(list);
        if (list.length === 0) {
          toast.error(`API returned 0 inquiries for this customer. Check browser console.`);
        }
      } catch (error: any) {
        console.error("[LinkedInquiry] Fetch error:", error);
        toast.error(error.message || "Failed to load inquiries");
      } finally {
        setInquiriesLoading(false);
      }
    };
    fetchInquiries();
  }, [formData.customer, businessId]);
  
  // Expanded by default: General, Customer, Business
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    general: true, customer: true, project: false, business: true, technical: false,
    deliverables: false, timeline: false, commercial: false, team: false, risk: false,
    attachments: false, notes: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto-update linked inquiry if customer changes
      if (name === 'customer') {
        if (value === 'CREATE_NEW_CUSTOMER') {
          setShowCreateCustomer(true);
          return prev; // Do not update state with the dummy value
        }
        updated.linkedInquiry = '';
        
        // Clear auto-filled values
        updated.title = '';
        updated.contactPerson = '';
        updated.email = '';
        updated.phone = '';
        updated.company = '';
        updated.businessRequirement = '';
        updated.estimatedBudget = '';
        updated.priority = 'Medium';
        updated.projectType = '';
        updated.estimatedDuration = '';
        // source could also be cleared if it was in the state
        
        // Optionally update other details like contact person if a real customer is selected
        const selectedCust = customers.find(c => c.id === value);
        if (selectedCust) {
          updated.contactPerson = selectedCust.name || '';
          updated.email = selectedCust.email || '';
          updated.phone = selectedCust.phone || '';
          updated.company = (selectedCust as any).company || selectedCust.name || '';
          updated.country = (selectedCust as any).country || prev.country;
        }
      }
      
      // Auto-update timezone if country changes
      if (name === 'country' && countryTimezoneMap[value]) {
        updated.timezone = countryTimezoneMap[value];
      }
      
      // Auto-fill from selected inquiry
      if (name === 'linkedInquiry' && value) {
        const inq = inquiries.find(i => i.id === value || i.inquiryNo === value);
        if (inq) {
          updated.title = inq.title || updated.title;
          updated.contactPerson = inq.contactPerson || updated.contactPerson;
          updated.phone = inq.contactNumber || updated.phone;
          updated.email = inq.email || updated.email;
          updated.company = inq.company || updated.company;
          updated.businessRequirement = inq.description || updated.businessRequirement;
          updated.estimatedBudget = inq.estimatedBudget || updated.estimatedBudget;
          if (inq.priority) {
            updated.priority = inq.priority.charAt(0).toUpperCase() + inq.priority.slice(1).toLowerCase();
          }
          if (inq.projectCategory) {
            updated.projectType = inq.projectCategory;
          }
          updated.estimatedDuration = inq.expectedTimeline || updated.estimatedDuration;
        }
      }
      
      return updated;
    });
  };

  const handleDeliverableChange = (id: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.map(d => d.id === id ? { ...d, [field]: value } : d)
    }));
  };

  const addDeliverable = () => {
    setFormData(prev => ({
      ...prev,
      deliverables: [...prev.deliverables, { id: Date.now().toString(), name: '', description: '', owner: '', dueDate: '', status: 'Pending' }]
    }));
  };

  const removeDeliverable = (id: string) => {
    if (formData.deliverables.length === 1) return;
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter(d => d.id !== id)
    }));
  };

  const handleTeamChange = (id: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      team: prev.team.map(t => t.id === id ? { ...t, [field]: value } : t)
    }));
  };

  const addTeamMember = () => {
    setFormData(prev => ({
      ...prev,
      team: [...prev.team, { id: Date.now().toString(), role: '', member: '' }]
    }));
  };

  const removeTeamMember = (id: string) => {
    setFormData(prev => ({
      ...prev,
      team: prev.team.filter(t => t.id !== id)
    }));
  };

  const calculateCompletion = () => {
    const keyFields = [
      'title', 'customer', 'projectType', 'executionType', 'priority', 
      'contactPerson', 'email', 'estimatedBudget', 'businessObjective', 
      'scope', 'expectedStartDate', 'riskLevel'
    ];
    let filledCount = keyFields.filter(field => !!formData[field as keyof RequirementFormData]).length;
    
    // Check if at least one team member is assigned
    const hasTeamMember = formData.team.some(t => t.member && t.role);
    if (hasTeamMember) filledCount++;
    
    // keyFields.length + 1 for team member check
    return Math.round((filledCount / (keyFields.length + 1)) * 100);
  };

  const completion = calculateCompletion();
  
  // Extract key roles for summary
  const summarySalesExec = formData.team.find(t => t.role === 'Sales Executive')?.member || '-';
  const summaryPM = formData.team.find(t => t.role === 'Project Manager')?.member || '-';

  const handleSave = async (action: string) => {
    console.log(`Action: ${action}`, formData);
    console.log("Save button clicked");
    
    // Step 2 - Form Validation
    const requiredFields = ['title', 'customer', 'projectType', 'executionType', 'priority', 'contactPerson', 'email'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof RequirementFormData]);
    
    if (missingFields.length > 0) {
      toast.error(`Please fill all required fields: ${missingFields.join(', ')}`);
      return;
    }

    try {
      // Step 3 & 4 - Network Request
      const payload = {
        title: formData.title,
        customerId: formData.customer,
        linkedInquiry: formData.linkedInquiry,
        businessType: formData.businessType,
        categoryId: formData.category,
        priority: formData.priority,
        status: formData.status,
        expectedBudget: Number(formData.estimatedBudget) || null,
        expectedTimeline: formData.expectedStartDate && formData.expectedEndDate ? `${formData.expectedStartDate} to ${formData.expectedEndDate}` : null,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        description: formData.businessObjective,
        projectType: formData.projectType,
        executionType: formData.executionType,
        currency: formData.currency,
        country: formData.country,
        timezone: formData.timezone,
        deliverables: formData.deliverables,
        team: formData.team
      };

      const res = await projectOperationsAPI.createRequirement(businessId, payload);
      
      // Step 8 - UI Success
      toast.success("Requirement created successfully!");
      
      if (action === 'estimate') {
        navigate(`/dashboard/${businessId}/project-operations/estimations/create?requirementId=${res.requirement?.id}`);
      } else if (action === 'meeting') {
        navigate(`/dashboard/${businessId}/project-operations/meetings/create?requirementId=${res.requirement?.id}`);
      } else {
        navigate(`/dashboard/${businessId}/project-operations/requirements/${res.requirement?.id}`);
      }
    } catch (err: any) {
      // Step 9 - Error Handling
      console.error(err);
      toast.error(err.message || "Failed to save requirement");
    }
  };

  return (
    // Replaced nested h-[calc...] overflow-y-auto with standard flex-row layout that allows native scrolling
    <div className="flex flex-col lg:flex-row min-h-full bg-gray-100 dark:bg-gray-950">
      
      {/* LEFT PANE: Form Sections */}
      <div className="flex-1 p-4 md:p-6 lg:p-8 w-full max-w-5xl mx-auto">
        
        {/* Header Breadcrumb & Title */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <Link to={`/dashboard/${businessId}/project-operations/requirements`}
              className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </Link>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <span>Project Operations</span>
              <span>/</span>
              <span className="text-blue-600 dark:text-blue-400">New Requirement</span>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Create Requirement (BRS)</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm max-w-2xl">
            Complete the Business Requirement Specification form. The information provided here forms the baseline for proposals, estimates, and project execution.
          </p>
        </div>

        {/* 1. General Information */}
        <SectionCard id="general" title="1. General Information" icon={Info} isExpanded={expandedSections.general} onToggle={toggleSection}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Requirement Number</label>
              <div className="w-full p-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-500 dark:text-gray-400 font-mono font-medium cursor-not-allowed">
                {formData.reqNumber} (Auto-generated)
              </div>
            </div>
            <InputField label="Requirement Title" name="title" value={formData.title} onChange={handleInputChange} required className="lg:col-span-2" placeholder="e.g. Enterprise ERP Migration Phase 1" />
            
            <SelectField 
              label="Customer" 
              name="customer" 
              value={formData.customer} 
              onChange={handleInputChange} 
              required 
              disabled={customersLoading}
            >
              <option value="CREATE_NEW_CUSTOMER" className="text-blue-600 font-bold bg-blue-50">+ Create New Customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {(c as any).company || c.name || "Unnamed Customer"}
                </option>
              ))}
            </SelectField>
            
            <SelectField 
              label="Linked Inquiry" 
              name="linkedInquiry" 
              value={formData.linkedInquiry} 
              onChange={handleInputChange} 
              disabled={inquiriesLoading || !formData.customer}
              placeholder={!formData.customer ? "Select Customer First" : inquiriesLoading ? "Loading inquiries..." : inquiries.length === 0 ? "No inquiries found for this customer" : "Select..."}
              options={inquiries.length > 0 ? inquiries.map(inq => {
                const dateObj = inq.createdAt ? new Date(inq.createdAt) : new Date();
                const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
                const customerName = inq.customerName || customers.find(c => c.id === formData.customer)?.company || customers.find(c => c.id === formData.customer)?.name || 'Unknown';
                return {
                  value: inq.id,
                  label: `${inq.inquiryNo || inq.id} | ${customerName} | ${inq.status || 'NEW'} | ${formattedDate}`
                };
              }) : undefined} 
            />
            
            <SelectField label="Execution Type" name="executionType" value={formData.executionType} onChange={handleInputChange} required options={['Service', 'Product', 'Hybrid', 'Consulting']} />
            
            <SelectField label="Project Type" name="projectType" value={formData.projectType} onChange={handleInputChange} required options={['Implementation', 'Support', 'Migration', 'Development', 'Audit']} />
            <SelectField label="Business Type" name="businessType" value={formData.businessType} onChange={handleInputChange} options={['B2B', 'B2C', 'B2B2C', 'Government', 'Non-Profit']} />
            <SelectField label="Category" name="category" value={formData.category} onChange={handleInputChange} options={['Software', 'Infrastructure', 'Hardware', 'Strategy', 'Operations']} />
            
            <SelectField label="Priority" name="priority" value={formData.priority} onChange={handleInputChange} required options={['Low', 'Medium', 'High', 'Critical']} />
            <SelectField label="Status" name="status" value={formData.status} onChange={handleInputChange} options={['Draft', 'Under Review', 'Approved', 'On Hold', 'Cancelled']} />
            <SelectField label="Currency" name="currency" value={formData.currency} onChange={handleInputChange} options={['USD', 'EUR', 'GBP', 'AED', 'INR']} />
          </div>
        </SectionCard>

        {/* 2. Customer Information */}
        <SectionCard id="customer" title="2. Customer Contact Information" icon={User} isExpanded={expandedSections.customer} onToggle={toggleSection}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <InputField label="Contact Person" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} required placeholder="John Doe" />
            <InputField label="Designation" name="designation" value={formData.designation} onChange={handleInputChange} placeholder="e.g. Chief Technical Officer" />
            <InputField label="Email Address" name="email" value={formData.email} onChange={handleInputChange} type="email" required placeholder="john@example.com" />
            
            <InputField label="Phone Number" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+1 (555) 000-0000" />
            <InputField label="Company Name" name="company" value={formData.company} onChange={handleInputChange} placeholder="e.g. Global Corp" />
            <InputField label="Industry" name="industry" value={formData.industry} onChange={handleInputChange} placeholder="e.g. Manufacturing, Finance" />
            
            <SelectField label="Country" name="country" value={formData.country} onChange={handleInputChange} options={Object.keys(countryTimezoneMap)} />
            <SelectField label="Timezone" name="timezone" value={formData.timezone} onChange={handleInputChange} options={Object.values(countryTimezoneMap)} />
          </div>
        </SectionCard>

        {/* 3. Project Information */}
        <SectionCard id="project" title="3. Project Economics & Scope" icon={Target} isExpanded={expandedSections.project} onToggle={toggleSection}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <SelectField label="Project Size" name="projectSize" value={formData.projectSize} onChange={handleInputChange} options={['Small (<$50k)', 'Medium ($50k-$200k)', 'Large ($200k-$1M)', 'Enterprise (>$1M)']} />
            <InputField label="Estimated Budget" name="estimatedBudget" value={formData.estimatedBudget} onChange={handleInputChange} type="number" required placeholder="0.00" />
            <InputField label="Expected Revenue" name="expectedRevenue" value={formData.expectedRevenue} onChange={handleInputChange} type="number" placeholder="0.00" />
            <InputField label="Expected Profit" name="expectedProfit" value={formData.expectedProfit} onChange={handleInputChange} type="number" placeholder="0.00" />
            <InputField label="Expected Margin (%)" name="expectedMargin" value={formData.expectedMargin} onChange={handleInputChange} type="number" placeholder="e.g. 25" />
          </div>
        </SectionCard>

        {/* 4. Business Requirements */}
        <SectionCard id="business" title="4. Business Requirements (BRS)" icon={Briefcase} isExpanded={expandedSections.business} onToggle={toggleSection}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <TextAreaField label="Business Objective" name="businessObjective" value={formData.businessObjective} onChange={handleInputChange} rows={3} placeholder="What is the primary business goal of this project?" className="col-span-1" />
            <TextAreaField label="Current Problem / Pain Points" name="currentProblem" value={formData.currentProblem} onChange={handleInputChange} rows={3} placeholder="Describe the current issues the customer is facing." className="col-span-1" />
            
            <TextAreaField label="Core Business Requirement" name="businessRequirement" value={formData.businessRequirement} onChange={handleInputChange} rows={4} className="md:col-span-2" placeholder="Detailed description of what the business needs." />
            <TextAreaField label="Expected Solution" name="expectedSolution" value={formData.expectedSolution} onChange={handleInputChange} rows={3} className="md:col-span-2" placeholder="Proposed solution architecture or approach to solve the problem." />
            
            <TextAreaField label="In Scope" name="scope" value={formData.scope} onChange={handleInputChange} rows={3} placeholder="List explicit inclusions in the project scope." />
            <TextAreaField label="Out of Scope" name="outOfScope" value={formData.outOfScope} onChange={handleInputChange} rows={3} placeholder="List explicit exclusions to manage expectations." />
            
            <TextAreaField label="Success Criteria" name="successCriteria" value={formData.successCriteria} onChange={handleInputChange} rows={2} placeholder="How will project success be measured? (KPIs)" />
            <TextAreaField label="Assumptions & Dependencies" name="dependencies" value={formData.dependencies} onChange={handleInputChange} rows={2} placeholder="What assumptions are made? What external factors does this depend on?" />
          </div>
        </SectionCard>

        {/* 5. Technical Requirements */}
        <SectionCard id="technical" title="5. Technical Requirements" icon={Cpu} isExpanded={expandedSections.technical} onToggle={toggleSection}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <TextAreaField label="Technology Stack" name="technologyStack" value={formData.technologyStack} onChange={handleInputChange} rows={2} placeholder="e.g. React, Node.js, PostgreSQL, AWS" />
            <TextAreaField label="Third-Party Integrations" name="integrations" value={formData.integrations} onChange={handleInputChange} rows={2} placeholder="e.g. Salesforce, SAP, Stripe" />
            <TextAreaField label="API & Data Requirements" name="apiRequirements" value={formData.apiRequirements} onChange={handleInputChange} rows={2} placeholder="REST/GraphQL requirements, data migration needs." />
            <TextAreaField label="Security & Compliance" name="security" value={formData.security} onChange={handleInputChange} rows={2} placeholder="e.g. GDPR, HIPAA, SOC2 compliance requirements." />
            <SelectField label="Hosting Preference" name="hosting" value={formData.hosting} onChange={handleInputChange} options={['Cloud (AWS/Azure/GCP)', 'On-Premise', 'Hybrid', 'SaaS', 'Not Applicable']} />
            <InputField label="Performance SLAs" name="performance" value={formData.performance} onChange={handleInputChange} placeholder="e.g. 99.9% uptime, <200ms latency" />
          </div>
        </SectionCard>

        {/* 6. Deliverables */}
        <SectionCard id="deliverables" title="6. Key Deliverables" icon={ListChecks} isExpanded={expandedSections.deliverables} onToggle={toggleSection}>
          <div className="space-y-3">
            <div className="hidden md:grid grid-cols-12 gap-4 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">Deliverable Name</div>
              <div className="col-span-4">Description</div>
              <div className="col-span-2">Owner</div>
              <div className="col-span-2">Due Date</div>
              <div className="col-span-1 text-center">Action</div>
            </div>
            
            {formData.deliverables.map((del) => (
              <div key={del.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start bg-gray-50 dark:bg-gray-800/30 p-3 md:p-0 rounded-xl md:bg-transparent md:rounded-none border border-gray-100 dark:border-gray-800 md:border-transparent">
                <div className="md:col-span-3 space-y-1 md:space-y-0">
                  <label className="md:hidden text-xs font-semibold text-gray-500 uppercase">Name</label>
                  <input type="text" value={del.name} onChange={(e) => handleDeliverableChange(del.id, 'name', e.target.value)} placeholder="e.g. BRD Document" className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500" />
                </div>
                <div className="md:col-span-4 space-y-1 md:space-y-0">
                  <label className="md:hidden text-xs font-semibold text-gray-500 uppercase">Description</label>
                  <input type="text" value={del.description} onChange={(e) => handleDeliverableChange(del.id, 'description', e.target.value)} placeholder="Brief description..." className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500" />
                </div>
                <div className="md:col-span-2 space-y-1 md:space-y-0">
                  <label className="md:hidden text-xs font-semibold text-gray-500 uppercase">Owner</label>
                  <input type="text" value={del.owner} onChange={(e) => handleDeliverableChange(del.id, 'owner', e.target.value)} placeholder="e.g. BA Team" className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500" />
                </div>
                <div className="md:col-span-2 space-y-1 md:space-y-0">
                  <label className="md:hidden text-xs font-semibold text-gray-500 uppercase">Due Date</label>
                  <input type="date" value={del.dueDate} onChange={(e) => handleDeliverableChange(del.id, 'dueDate', e.target.value)} className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500" />
                </div>
                <div className="md:col-span-1 flex items-end md:items-center justify-end md:justify-center h-full">
                  <button onClick={() => removeDeliverable(del.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Remove row">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            <button onClick={addDeliverable} className="mt-2 flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors w-full justify-center border border-blue-100 dark:border-blue-800/50 border-dashed">
              <Plus className="w-4 h-4" /> Add Another Deliverable
            </button>
          </div>
        </SectionCard>

        {/* 7. Timeline */}
        <SectionCard id="timeline" title="7. Timeline & Schedule" icon={Calendar} isExpanded={expandedSections.timeline} onToggle={toggleSection}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <InputField label="Requirement Date" name="requirementDate" value={formData.requirementDate} onChange={handleInputChange} type="date" />
            <InputField label="Expected Start Date" name="expectedStartDate" value={formData.expectedStartDate} onChange={handleInputChange} type="date" required />
            <InputField label="Expected End Date" name="expectedEndDate" value={formData.expectedEndDate} onChange={handleInputChange} type="date" />
            <InputField label="Estimated Duration (Weeks)" name="estimatedDuration" value={formData.estimatedDuration} onChange={handleInputChange} type="number" />
            <InputField label="Decision Deadline" name="decisionDeadline" value={formData.decisionDeadline} onChange={handleInputChange} type="date" />
            <InputField label="Target Go-Live Date" name="goLiveTarget" value={formData.goLiveTarget} onChange={handleInputChange} type="date" />
          </div>
        </SectionCard>

        {/* 8. Commercial */}
        <SectionCard id="commercial" title="8. Commercial Details" icon={DollarSign} isExpanded={expandedSections.commercial} onToggle={toggleSection}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <SelectField label="Budget Range" name="budgetRange" value={formData.budgetRange} onChange={handleInputChange} options={['Under $10k', '$10k - $50k', '$50k - $100k', '$100k - $500k', 'Over $500k']} />
            <SelectField label="Billing Model" name="billingModel" value={formData.billingModel} onChange={handleInputChange} options={['Fixed Price', 'Time & Material (T&M)', 'Retainer', 'Milestone Based']} />
            <SelectField label="Payment Terms" name="paymentTerms" value={formData.paymentTerms} onChange={handleInputChange} options={['100% Advance', '50% Advance, 50% Delivery', 'Net 30', 'Net 60', 'Custom Milestones']} />
          </div>
        </SectionCard>

        {/* 9. Team Assignment */}
        <SectionCard id="team" title="9. Internal Team Assignment" icon={Users} isExpanded={expandedSections.team} onToggle={toggleSection}>
          <div className="space-y-3">
            <div className="hidden md:grid grid-cols-12 gap-4 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <div className="col-span-5">Role</div>
              <div className="col-span-6">Team Member</div>
              <div className="col-span-1 text-center">Action</div>
            </div>
            
            {formData.team.map((t) => (
              <div key={t.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start bg-gray-50 dark:bg-gray-800/30 p-3 md:p-0 rounded-xl md:bg-transparent md:rounded-none border border-gray-100 dark:border-gray-800 md:border-transparent">
                <div className="md:col-span-5 space-y-1 md:space-y-0">
                  <label className="md:hidden text-xs font-semibold text-gray-500 uppercase">Role</label>
                  <select 
                    value={t.role} 
                    onChange={(e) => handleTeamChange(t.id, 'role', e.target.value)} 
                    className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">Select Role...</option>
                    {teamRoles.map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
                </div>
                <div className="md:col-span-6 space-y-1 md:space-y-0">
                  <label className="md:hidden text-xs font-semibold text-gray-500 uppercase">Team Member</label>
                  <UserSelect businessId={businessId as string} value={t.member} onChange={(v) => handleTeamChange(t.id, 'member', v)} placeholder="Select Member..." />
                </div>
                <div className="md:col-span-1 flex items-end md:items-center justify-end md:justify-center h-full">
                  <button type="button" onClick={() => removeTeamMember(t.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Remove assignment">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            <button type="button" onClick={addTeamMember} className="mt-2 flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors w-full justify-center border border-blue-100 dark:border-blue-800/50 border-dashed">
              <Plus className="w-4 h-4" /> Add Team Member
            </button>
          </div>
        </SectionCard>

        {/* 10. Risk Assessment */}
        <SectionCard id="risk" title="10. Risk Assessment" icon={AlertTriangle} isExpanded={expandedSections.risk} onToggle={toggleSection}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <SelectField label="Overall Risk Level" name="riskLevel" value={formData.riskLevel} onChange={handleInputChange} required options={['Low', 'Medium', 'High', 'Critical']} />
            <SelectField label="Project Complexity" name="complexity" value={formData.complexity} onChange={handleInputChange} options={['Standard', 'Moderate', 'Complex', 'Highly Complex']} />
            <SelectField label="Management Approval Required" name="approvalRequired" value={formData.approvalRequired} onChange={handleInputChange} options={['No', 'Yes - Commercial', 'Yes - Technical', 'Yes - Executive']} />
            <TextAreaField label="Technical Risks" name="technicalRisk" value={formData.technicalRisk} onChange={handleInputChange} rows={2} className="lg:col-span-3" placeholder="Identify potential technical roadblocks..." />
            <TextAreaField label="Business Risks" name="businessRisk" value={formData.businessRisk} onChange={handleInputChange} rows={2} className="lg:col-span-3" placeholder="Identify potential business/market roadblocks..." />
          </div>
        </SectionCard>

        {/* 11. Attachments */}
        <SectionCard id="attachments" title="11. Documents & Attachments" icon={Paperclip} isExpanded={expandedSections.attachments} onToggle={toggleSection}>
          <div className="space-y-4">
            <label className="block border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center bg-gray-50/50 dark:bg-gray-800/20 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group">
              <input 
                type="file" 
                multiple 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files) {
                    const newFiles = Array.from(e.target.files);
                    setFormData(prev => ({ ...prev, attachments: [...prev.attachments, ...newFiles] }));
                  }
                  // Reset the input value so the same file can be selected again if removed
                  e.target.value = '';
                }} 
              />
              <div className="w-12 h-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-sm">
                <Upload className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Upload requirement documents</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Drag and drop files here, or click to browse. Supports PDF, Word, Excel, BOQ, Drawings, and Tender Docs. (Max 25MB)
              </p>
            </label>

            {formData.attachments.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">Attached Files ({formData.attachments.length})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formData.attachments.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={file.name}>{file.name}</span>
                          <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData(prev => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== index) }));
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* 12. Internal Notes */}
        <SectionCard id="notes" title="12. Internal Notes (Private)" icon={FileText} isExpanded={expandedSections.notes} onToggle={toggleSection}>
          <div className="grid grid-cols-1 gap-5">
            <TextAreaField label="Sales Notes" name="salesNotes" value={formData.salesNotes} onChange={handleInputChange} rows={2} placeholder="Insights from sales conversations..." />
            <TextAreaField label="Business Analyst Notes" name="baNotes" value={formData.baNotes} onChange={handleInputChange} rows={2} placeholder="Initial BA assessment and thoughts..." />
            <TextAreaField label="Management Notes" name="managementNotes" value={formData.managementNotes} onChange={handleInputChange} rows={2} placeholder="Approvals, constraints, strategic notes..." />
          </div>
        </SectionCard>
        
        <div className="h-24 lg:hidden"></div> {/* Spacer for mobile sticky footer */}
      </div>

      {/* RIGHT PANE: Sticky Summary & Actions */}
      <div className="hidden lg:flex flex-col w-[360px] xl:w-[380px] flex-shrink-0 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-xl z-10 sticky top-0 h-[calc(100vh-theme(spacing.16))]">
        
        {/* Progress Bar Header */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Form Completion</h3>
              <p className="text-[11px] text-gray-500">Based on required fields</p>
            </div>
            <span className={`text-lg font-black ${completion === 100 ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
              {completion}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ease-out ${completion === 100 ? 'bg-green-500' : 'bg-blue-600'}`} 
              style={{ width: `${completion}%` }}
            ></div>
          </div>
          {completion === 100 && (
            <p className="text-[11px] text-green-600 dark:text-green-400 mt-2 font-medium flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Ready for processing
            </p>
          )}
        </div>

        {/* Concise Live Summary Panel */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-5">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-5 flex items-center gap-2">
            <Target className="w-3.5 h-3.5" /> Live Summary
          </h3>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-0.5 pb-3 border-b border-gray-100 dark:border-gray-800 border-dashed">
              <span className="text-[11px] text-gray-500 font-medium">Customer</span>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                {customers.find(c => c.id === formData.customer)?.name || customers.find(c => c.id === formData.customer)?.company || <span className="text-gray-300 dark:text-gray-600 font-normal italic">Not selected</span>}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-gray-100 dark:border-gray-800 border-dashed">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-gray-500 font-medium">Inquiry</span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 truncate">{formData.linkedInquiry || <span className="text-gray-300 dark:text-gray-600 font-normal italic">None</span>}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-gray-500 font-medium">Execution</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{formData.executionType || <span className="text-gray-300 dark:text-gray-600 font-normal italic">TBD</span>}</span>
              </div>
            </div>

            <div className="flex flex-col gap-0.5 pb-3 border-b border-gray-100 dark:border-gray-800 border-dashed">
              <span className="text-[11px] text-gray-500 font-medium">Est. Budget</span>
              <span className="text-sm font-bold text-green-600 dark:text-green-400 truncate">{formData.estimatedBudget ? `${formData.currency} ${Number(formData.estimatedBudget).toLocaleString()}` : <span className="text-gray-300 dark:text-gray-600 font-normal italic">TBD</span>}</span>
            </div>

            <div className="flex flex-col gap-0.5 pb-3 border-b border-gray-100 dark:border-gray-800 border-dashed">
              <span className="text-[11px] text-gray-500 font-medium">Timeline (Start - End)</span>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                {formData.expectedStartDate ? formData.expectedStartDate : 'TBD'} 
                {' '} - {' '} 
                {formData.expectedEndDate ? formData.expectedEndDate : 'TBD'}
              </span>
            </div>

            <div className="flex flex-col gap-1 pb-3 border-b border-gray-100 dark:border-gray-800 border-dashed">
              <span className="text-[11px] text-gray-500 font-medium">Key Team</span>
              <div className="text-sm space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-gray-500">Sales:</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[120px] text-right">{summarySalesExec}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-gray-500">PM:</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[120px] text-right">{summaryPM}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[11px] text-gray-500 font-medium">Risk Level</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                formData.riskLevel === 'Low' ? 'bg-green-100 text-green-700' :
                formData.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                formData.riskLevel === 'High' ? 'bg-orange-100 text-orange-700' :
                formData.riskLevel === 'Critical' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {formData.riskLevel || 'TBD'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons Container */}
        <div className="p-5 border-t border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 space-y-2.5 backdrop-blur-sm">
          <button onClick={() => handleSave('estimate')} className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-all shadow-md hover:shadow-green-600/20">
            <DollarSign className="w-4 h-4" /> Save & Create Estimate
          </button>
          
          <button onClick={() => handleSave('save')} className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-blue-600/20">
            <Save className="w-4 h-4" /> Save Requirement
          </button>

          <button onClick={() => handleSave('meeting')} className="w-full flex items-center justify-center gap-2 py-2 border-2 border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 rounded-lg text-sm font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
            <Calendar className="w-4 h-4" /> Save & Schedule Meeting
          </button>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button onClick={() => handleSave('draft')} className="flex items-center justify-center gap-2 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
              Save Draft
            </button>
            <button onClick={() => navigate(`/dashboard/${businessId}/project-operations/requirements`)} className="flex items-center justify-center gap-2 py-2 bg-gray-100 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-all">
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE FIXED BOTTOM ACTIONS */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 flex gap-3">
        <button onClick={() => handleSave('save')} className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg">
          <Save className="w-4 h-4" /> Save
        </button>
        <button onClick={() => handleSave('estimate')} className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all shadow-lg">
          <DollarSign className="w-4 h-4" /> + Estimate
        </button>
      </div>

      <CreateCustomerModal
        open={showCreateCustomer}
        onClose={() => setShowCreateCustomer(false)}
        businessId={businessId as string}
        onCreated={(newCustomer: any) => {
          setCustomers((prev) => [...prev, newCustomer]);
          setFormData((prev: any) => ({
            ...prev,
            customer: newCustomer.id,
            contactPerson: newCustomer.name || '',
            email: newCustomer.email || '',
            phone: newCustomer.phone || '',
            company: newCustomer.company || newCustomer.name || '',
            country: newCustomer.country || prev.country
          }));
          setShowCreateCustomer(false);
        }}
      />
    </div>
  );
}

export default function CreateRequirementPage() {
  const routerParams = useParams() as any;
  const { businessId } = routerParams;

  
  
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading form...</div>}>
      <RequirementFormContent businessId={businessId as string} />
    </Suspense>
  );
}
