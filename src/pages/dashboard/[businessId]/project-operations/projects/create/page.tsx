import { toast } from 'sonner';
import React, { useState, useEffect, use } from 'react';
import { Link } from 'react-router-dom';
import {  useNavigate, useSearchParams, useParams  } from 'react-router-dom';
import { contactsAPI, Customer } from "@/lib/api/contacts";
import { usersAPI, BusinessUser } from "@/lib/api/users";
import { CreateCustomerModal } from "@/components/dashboard/create-customer-modal";
import { 
  ArrowLeft, Save, ChevronDown, CheckCircle, Info, FileText, User, 
  Target, Cpu, Calendar, DollarSign, Users, AlertTriangle, 
  Paperclip, Plus, Trash2, ShieldCheck, Box, Briefcase, Settings, 
  Layout, Activity, Clock
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { getCookie } from '@/lib/utils';
import { UserSelect } from "@/components/project-operations/UserSelect";
import { useBusinessCustomers } from "@/hooks/use-business-data";
import { useBusinessData } from "@/components/dashboard/business-data-provider";
import { ConstructionProjectForm } from "@/components/dashboard/construction-project-form";

// ------------------------------------------------------------------
// REUSABLE COMPONENTS
// ------------------------------------------------------------------

const InputField = ({ label, type = "text", value, onChange, placeholder, required = false, prefix, suffix, multiline = false, rows = 3 }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative flex items-center">
      {prefix && <div className="absolute left-3 text-gray-500">{prefix}</div>}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all outline-none resize-y`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all outline-none ${prefix ? 'pl-9' : ''} ${suffix ? 'pr-9' : ''}`}
        />
      )}
      {suffix && <div className="absolute right-3 text-gray-500">{suffix}</div>}
    </div>
  </div>
);

const SelectField = ({ label, value, onChange, options, required = false, icon: Icon }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative flex items-center">
      {Icon && <div className="absolute left-3 text-gray-500"><Icon className="w-4 h-4"/></div>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all outline-none cursor-pointer appearance-none ${Icon ? 'pl-9' : ''}`}
      >
        <option value="" disabled>Select {label}...</option>
        {options.map((opt: any, i: number) => (
          <option key={i} value={opt.value || opt}>{opt.label || opt}</option>
        ))}
      </select>
      <div className="absolute right-3 pointer-events-none text-gray-500">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  </div>
);

const SectionCard = ({ title, icon: Icon, children, defaultOpen = true, badge }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden mb-6 transition-all duration-200">
      <div 
        className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-500 rounded-lg">
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
          {badge && <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">{badge}</span>}
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div className="p-6 animate-in fade-in slide-in-from-top-4 duration-300">
          {children}
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------------
// MOCK DATA
// ------------------------------------------------------------------
const MOCK_REQS: any[] = [];

const MOCK_USERS: string[] = [];

// ------------------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------------------

export default function CreateProjectPage() {
  const { businessId } = useParams();
  const { business } = useBusinessData();

  if (business?.businessType?.toLowerCase() === 'construction') {
    return <ConstructionProjectForm businessId={businessId as string} />;
  }

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const contractId = searchParams.get('contractId');
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    projNumber: 'PRJ-' + Math.floor(10000 + Math.random() * 90000),
    projName: '',
    linkedReq: '',
    linkedEst: '',
    linkedProp: '',
    customer: '',
    execType: '',
    busType: 'Enterprise',
    category: 'Software Development',
    status: 'Draft',
    priority: 'Medium',
    projManager: '',
    projSponsor: '',

    startDate: '',
    endDate: '',
    duration: '',
    workCalendar: 'Standard 5-Day',
    timeZone: 'UTC',
    milestoneTemplate: 'Standard Implementation',

    estBudget: 0,
    appBudget: 0,
    currency: 'USD',
    billingType: 'Fixed Price',
    expRevenue: 0,
    expProfit: 0,

    objectives: '',
    inScope: '',
    outOfScope: '',
    deliverables: '',
    assumptions: '',
    dependencies: '',

    riskLevel: 'Low',
    complexity: 'Standard',
    approvalRequired: false,
    attachDocs: true,
  });

  const [team, setTeam] = useState<{id: number, role: string, member: string}[]>([]);

  const { customers, loading: loadingCustomers, error: errorCustomers, retry: retryCustomers } = useBusinessCustomers(businessId);
  const [estimations, setEstimations] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/$/, '');
        let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token || token === 'null' || token === 'undefined') {
          token = getCookie('token') || getCookie('accessToken') || '';
        }
        const headers = { 'Authorization': `Bearer ${token}`, 'x-business-id': businessId as string };

        // Load Business to determine country currency
        fetch(`${API_BASE}/api/business`, { headers })
          .then(res => res.json())
          .then(data => {
             const business = data.data || data.business;
             if (business && business.country) {
               const c = business.country.toLowerCase();
               if (c.includes('india') || c === 'in') setFormData(prev => ({ ...prev, currency: 'INR' }));
               else if (c.includes('uae') || c.includes('united arab emirates') || c === 'ae') setFormData(prev => ({ ...prev, currency: 'AED' }));
               else setFormData(prev => ({ ...prev, currency: 'USD' }));
             }
          }).catch(console.error);

        // Load Estimations
        const estRes = await fetch(`${API_BASE}/api/projects/estimations`, { headers });
        const estData = await estRes.json();
        setEstimations(estData.data || estData.estimations || []);

        // Load Proposals (Quotation API)
        const propRes = await fetch(`${API_BASE}/api/quotation`, { headers });
        const propData = await propRes.json();
        setProposals(propData.data || propData.quotations || []);

        // Auto-populate from Contract if applicable
        if (contractId) {
          const { contractsAPI } = await import('@/lib/api/contracts');
          const res = await contractsAPI.getContractById(businessId as string, contractId);
          if (res.success && res.contract) {
            const contract = res.contract;
            setFormData(prev => ({
              ...prev,
              projName: contract.title || prev.projName,
              customer: contract.customerId || prev.customer,
              appBudget: contract.value || prev.appBudget,
              estBudget: contract.value || prev.estBudget,
              currency: contract.currency || prev.currency,
              startDate: contract.startDate ? new Date(contract.startDate).toISOString().split('T')[0] : prev.startDate,
              endDate: contract.endDate ? new Date(contract.endDate).toISOString().split('T')[0] : prev.endDate,
              objectives: contract.description || prev.objectives
            }));
            toast({ title: "Auto-Populated", description: "Project fields loaded from Contract." });
          }
        }
      } catch (error) {
        console.error("Failed to load dependency data:", error);
      }
    };
    loadAllData();
  }, [businessId]);

  const handleChange = (field: string, value: any) => {
    if (field === 'customer' && value === 'CREATE_NEW_CUSTOMER') {
      setShowCreateCustomer(true);
      return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Auto-populate when Requirement is selected
  useEffect(() => {
    if (formData.linkedReq) {
      const req = MOCK_REQS.find(r => r.id === formData.linkedReq);
      if (req) {
        setFormData(prev => ({
          ...prev,
          projName: prev.projName || req.name,
          customer: req.customer,
          linkedEst: req.estId,
          linkedProp: req.propId,
          execType: req.execType,
          estBudget: req.budget,
          appBudget: req.budget,
          duration: req.duration,
          inScope: req.scope,
          deliverables: req.deliverables
        }));
      }
    }
  }, [formData.linkedReq]);

  const addTeamMember = () => {
    setTeam([...team, { id: Date.now(), role: '', member: '' }]);
  };

  const removeTeamMember = (id: number) => {
    setTeam(team.filter(t => t.id !== id));
  };

  const updateTeam = (id: number, field: string, value: string) => {
    setTeam(team.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleSubmit = async (actionType: 'start' | 'draft' | 'planning' = 'start') => {
    if (!formData.projName || !formData.customer || !formData.startDate || !formData.endDate) {
      toast({ title: "Validation Error", description: "Please fill in all required fields (Name, Customer, Start/End Date).", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/$/, '');
      const payload = {
        projectCode: formData.projNumber,
        projectName: formData.projName,
        customerId: formData.customer,
        projectManagerId: formData.projManager || undefined,
        department: formData.busType,
        priority: formData.priority.toUpperCase(),
        status: actionType === 'draft' ? 'DRAFT' : 'ACTIVE',
        budget: formData.appBudget,
        executionType: formData.execType ? formData.execType.toUpperCase() : 'SERVICE',
        startDate: formData.startDate,
        endDate: formData.endDate,
      };

      let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token || token === 'null' || token === 'undefined') {
        token = getCookie('token') || getCookie('accessToken') || '';
      }

      const res = await fetch(`${API_BASE}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-business-id': businessId as string
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create project');
      }

      toast({ title: "Success", description: `Project ${actionType === 'draft' ? 'draft saved' : 'initialized'} successfully.` });
      navigate(0);
      
      if (actionType === 'planning') {
        navigate(`/dashboard/${businessId}/project-operations/projects/${data.project?.id || data.data?.id}`);
      } else {
        navigate(`/dashboard/${businessId}/project-operations/projects`);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Header */}
      <div className="flex-none px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/dashboard/${businessId}/project-operations/projects`}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                <span>Project Operations</span>
                <span>/</span>
                <span>Execution</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                Project Initialization Workspace
                <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full uppercase tracking-widest">{formData.projNumber}</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 shadow-sm">
              Cancel
            </button>
            <button 
              onClick={() => handleSubmit('draft')}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-sm disabled:opacity-50"
            >
              Save Draft
            </button>
            <button 
              onClick={() => handleSubmit('planning')}
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
            >
              Save & Open Planning
            </button>
            <button 
              onClick={() => handleSubmit('start')} 
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Starting...</>
              ) : (
                <><CheckCircle className="w-4 h-4" /> Start Project</>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
          
          {/* Main Form Content */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            
            <SectionCard title="General Information" icon={Briefcase}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3">
                  <SelectField 
                    label="Linked Requirement (Auto-Populates Data)" 
                    value={formData.linkedReq} 
                    onChange={(val: any) => handleChange('linkedReq', val)}
                    options={MOCK_REQS.map(r => ({ value: r.id, label: `${r.id} - ${r.name} (${r.customer})` }))}
                    icon={Layout}
                  />
                </div>
                <div className="lg:col-span-2">
                  <InputField label="Project Name" value={formData.projName} onChange={(val: any) => handleChange('projName', val)} required />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Customer <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    {loadingCustomers ? (
                      <select disabled className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none animate-pulse">
                        <option>Loading customers...</option>
                      </select>
                    ) : errorCustomers ? (
                      <div className="flex w-full gap-2">
                        <select disabled className="flex-1 p-2.5 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg text-sm outline-none text-red-500">
                          <option>Unable to load customers.</option>
                        </select>
                        <button type="button" onClick={retryCustomers} className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-xs font-bold">Retry</button>
                      </div>
                    ) : customers.length === 0 ? (
                      <div className="flex w-full gap-2">
                        <select disabled className="flex-1 p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none text-gray-500">
                          <option>No customers found.</option>
                        </select>
                        <button type="button" onClick={() => setShowCreateCustomer(true)} className="px-4 py-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 rounded-lg text-xs font-bold whitespace-nowrap">+ Create First Customer</button>
                      </div>
                    ) : (
                      <>
                        <select
                          value={formData.customer}
                          onChange={(e) => handleChange('customer', e.target.value)}
                          className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all outline-none cursor-pointer appearance-none"
                        >
                          <option value="">Select Customer...</option>
                          {customers.map((c: any) => (
                            <option key={c._id || c.id} value={c._id || c.id}>
                              {c.company || c.name || 'Unknown Customer'} {c.code ? `(${c.code})` : ''}
                            </option>
                          ))}
                          <option value="CREATE_NEW_CUSTOMER" className="font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30">
                            + Create New Customer
                          </option>
                        </select>
                        <div className="absolute right-3 pointer-events-none text-gray-500">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <SelectField label="Execution Type" value={formData.execType} onChange={(val: any) => handleChange('execType', val)} options={['Service', 'Product', 'Hybrid']} />
                <SelectField label="Priority" value={formData.priority} onChange={(val: any) => handleChange('priority', val)} options={['Low', 'Medium', 'High', 'Critical']} />
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Project Manager</label>
                  <div className="relative flex items-center">
                    <UserSelect businessId={businessId as string} value={formData.projManager} onChange={(v) => handleChange('projManager', v)} placeholder="Select Project Manager..." />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Linked Estimate</label>
                  <div className="relative flex items-center">
                    <select
                      value={formData.linkedEst}
                      onChange={(e) => handleChange('linkedEst', e.target.value)}
                      disabled={!formData.customer}
                      className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all outline-none cursor-pointer appearance-none disabled:opacity-50"
                    >
                      <option value="">{formData.customer ? "Select Linked Estimate..." : "Select Customer First"}</option>
                      {estimations.filter(e => e.customerId === formData.customer || e.requirement?.customerId === formData.customer).map((e: any) => (
                        <option key={e.id} value={e.id}>{e.estimationNumber || e.id} - ${e.totalCost || 0}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 pointer-events-none text-gray-500">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Linked Proposal</label>
                  <div className="relative flex items-center">
                    <select
                      value={formData.linkedProp}
                      onChange={(e) => handleChange('linkedProp', e.target.value)}
                      disabled={!formData.customer}
                      className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all outline-none cursor-pointer appearance-none disabled:opacity-50"
                    >
                      <option value="">{formData.customer ? "Select Linked Proposal..." : "Select Customer First"}</option>
                      {proposals.filter(p => p.customerId === formData.customer).map((p: any) => (
                        <option key={p.id || p._id} value={p.id || p._id}>{p.quotationNumber || p.id} - ${p.total || 0}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 pointer-events-none text-gray-500">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Project Sponsor</label>
                  <div className="relative flex items-center">
                    <UserSelect businessId={businessId as string} value={formData.projSponsor} onChange={(v) => handleChange('projSponsor', v)} placeholder="Select Sponsor..." />
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Schedule & Milestones" icon={Calendar}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InputField label="Start Date" type="date" value={formData.startDate} onChange={(val: any) => handleChange('startDate', val)} required />
                <InputField label="End Date" type="date" value={formData.endDate} onChange={(val: any) => handleChange('endDate', val)} required />
                <InputField label="Planned Duration" value={formData.duration} onChange={(val: any) => handleChange('duration', val)} placeholder="e.g. 6 Months" />
                <SelectField label="Working Calendar" value={formData.workCalendar} onChange={(val: any) => handleChange('workCalendar', val)} options={['Standard 5-Day', 'Standard 6-Day', '24/7 Support']} />
                <SelectField label="Time Zone" value={formData.timeZone} onChange={(val: any) => handleChange('timeZone', val)} options={['UTC', 'EST', 'PST', 'IST', 'GMT']} />
                <SelectField label="Milestone Template" value={formData.milestoneTemplate} onChange={(val: any) => handleChange('milestoneTemplate', val)} options={['Standard Implementation', 'Agile Sprints', 'Custom']} />
              </div>
            </SectionCard>

            <SectionCard title="Financial details" icon={DollarSign}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <InputField label="Estimated Budget" type="number" prefix="$" value={formData.estBudget} onChange={(val: any) => handleChange('estBudget', val)} />
                <InputField label="Approved Budget" type="number" prefix="$" value={formData.appBudget} onChange={(val: any) => handleChange('appBudget', val)} required />
                <SelectField label="Currency" value={formData.currency} onChange={(val: any) => handleChange('currency', val)} options={['USD', 'EUR', 'GBP', 'INR', 'AED']} />
                <SelectField label="Billing Type" value={formData.billingType} onChange={(val: any) => handleChange('billingType', val)} options={['Fixed Price', 'Time & Material', 'Retainer']} />
              </div>
            </SectionCard>

            <SectionCard title="Team Assignment" icon={Users}>
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <div className="col-span-5">Role</div>
                  <div className="col-span-6">Assigned Member</div>
                  <div className="col-span-1 text-center">Action</div>
                </div>
                {team.map((t, idx) => (
                  <div key={t.id} className="grid grid-cols-12 gap-4 items-center bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                    <div className="col-span-5">
                      <select 
                        value={t.role} 
                        onChange={(e) => updateTeam(t.id, 'role', e.target.value)}
                        className="w-full p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-sm outline-none"
                      >
                        <option value="">Select Role...</option>
                        <option value="Project Manager">Project Manager</option>
                        <option value="Business Analyst">Business Analyst</option>
                        <option value="Technical Lead">Technical Lead</option>
                        <option value="Developer">Developer</option>
                        <option value="QA Engineer">QA Engineer</option>
                        <option value="DevOps">DevOps</option>
                      </select>
                    </div>
                    <div className="col-span-6">
                      <UserSelect 
                        businessId={businessId as string} 
                        value={t.member} 
                        onChange={(v) => updateTeam(t.id, 'member', v)} 
                        placeholder="Unassigned..." 
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button onClick={() => removeTeamMember(t.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={addTeamMember}
                  className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 px-4 py-2 rounded-lg transition-colors mt-2"
                >
                  <Plus className="w-4 h-4" /> Add Team Member
                </button>
              </div>
            </SectionCard>

            <SectionCard title="Scope & Objectives" icon={Target}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <InputField label="Project Objectives" value={formData.objectives} onChange={(val: any) => handleChange('objectives', val)} multiline rows={3} placeholder="Describe the main objectives of this project..." />
                </div>
                <InputField label="In Scope" value={formData.inScope} onChange={(val: any) => handleChange('inScope', val)} multiline rows={4} placeholder="List all items included in the scope..." />
                <InputField label="Out of Scope" value={formData.outOfScope} onChange={(val: any) => handleChange('outOfScope', val)} multiline rows={4} placeholder="List items explicitly excluded..." />
                <div className="md:col-span-2">
                  <InputField label="Key Deliverables" value={formData.deliverables} onChange={(val: any) => handleChange('deliverables', val)} multiline rows={3} placeholder="BRD, Prototypes, Source Code..." />
                </div>
                <InputField label="Assumptions" value={formData.assumptions} onChange={(val: any) => handleChange('assumptions', val)} multiline rows={3} placeholder="List key assumptions..." />
                <InputField label="Dependencies" value={formData.dependencies} onChange={(val: any) => handleChange('dependencies', val)} multiline rows={3} placeholder="List internal/external dependencies..." />
              </div>
            </SectionCard>

            <SectionCard title="Risk & Documents" icon={ShieldCheck}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <SelectField label="Risk Level" value={formData.riskLevel} onChange={(val: any) => handleChange('riskLevel', val)} options={['Low', 'Medium', 'High']} />
                <SelectField label="Complexity" value={formData.complexity} onChange={(val: any) => handleChange('complexity', val)} options={['Standard', 'Complex', 'Highly Complex']} />
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" id="approvalReq" checked={formData.approvalRequired} onChange={(e) => handleChange('approvalRequired', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                  <label htmlFor="approvalReq" className="text-sm font-medium text-gray-700 dark:text-gray-300">Requires Executive Approval</label>
                </div>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl flex items-start gap-4">
                <Paperclip className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100">Automatic Document Linking</h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">
                    By default, this project will automatically inherit and link all documents from the selected Requirement ({formData.linkedReq || 'None'}), Estimate, and Proposal. Check the box below to confirm.
                  </p>
                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input type="checkbox" checked={formData.attachDocs} onChange={(e) => handleChange('attachDocs', e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                    <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">Link source documents to this project</span>
                  </label>
                </div>
              </div>
            </SectionCard>

          </div>

          {/* Sticky Summary Panel */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="sticky top-6 flex flex-col gap-4">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
                <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
                  <h3 className="font-bold">Project Summary</h3>
                  <Layout className="w-4 h-4 text-gray-400" />
                </div>
                <div className="p-5 flex flex-col gap-4">
                  <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">Customer</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white text-right max-w-[150px] truncate">{formData.customer || '-'}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">Budget</span>
                    <span className="text-sm font-bold text-green-600">${Number(formData.appBudget).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">Duration</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{formData.duration || '-'}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">Type</span>
                    <span className="text-sm font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">{formData.execType || '-'}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">Team Size</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{team.filter(t => t.member).length} Assigned</span>
                  </div>
                  <div className="flex justify-between items-end pt-1">
                    <span className="text-xs font-bold text-gray-500 uppercase">Linked Docs</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-blue-500"/> {formData.attachDocs && formData.linkedReq ? '3 Files' : '0 Files'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 p-4">
                <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4"/> Next Automations
                </h4>
                <ul className="space-y-2">
                  {['Update Requirement Status', 'Generate Project Code', 'Create Default Stages', 'Assign Resources & Notify'].map((task, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-blue-900/70 dark:text-blue-200/70">
                      <CheckCircle className="w-3.5 h-3.5 mt-0.5 text-blue-500 flex-shrink-0" />
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      {showCreateCustomer && (
        <CreateCustomerModal 
          open={true}
          businessId={businessId as string} 
          onClose={() => setShowCreateCustomer(false)}
          onCreated={async () => {
            setShowCreateCustomer(false);
            retryCustomers();
          }} 
        />
      )}
    </div>
  );
}
