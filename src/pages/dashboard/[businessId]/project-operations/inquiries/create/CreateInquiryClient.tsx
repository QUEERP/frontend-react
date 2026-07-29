import React, { useState, useEffect } from "react";
import {  useNavigate  } from 'react-router-dom';
import { CreateCustomerModal } from "@/components/dashboard/create-customer-modal";
import { useBusinessData } from "@/components/dashboard/business-data-provider";
import {
  ArrowLeft, User, Mail, Phone, Building2, MessageSquare, Globe, MapPin, Tag,
  UserPlus, ChevronDown, CheckCircle, AlertCircle, Loader2, RefreshCw, 
  Briefcase, Calendar, Layers, FolderHeart, Activity, Paperclip, Users,
  ListTodo, CheckSquare
} from "lucide-react";
import { leadsAPI } from "@/lib/api/leads";
import { contactsAPI, Customer } from "@/lib/api/contacts";
import { usersAPI, BusinessUser } from "@/lib/api/users";

const LEAD_STATUSES = [
  { label: "New", value: "NEW" },
  { label: "Qualified", value: "QUALIFIED" },
  { label: "Under Review", value: "UNDER_REVIEW" },
  { label: "Requirement Gathering", value: "REQUIREMENT_GATHERING" },
  { label: "Proposal Pending", value: "PROPOSAL_PENDING" },
  { label: "Proposal Sent", value: "PROPOSAL_SENT" },
  { label: "Negotiation", value: "NEGOTIATION" },
  { label: "Won", value: "WON" },
  { label: "Lost", value: "LOST" },
  { label: "Cancelled", value: "CANCELLED" },
];

const LEAD_SOURCES = [
  { label: "Website", value: "WEBSITE" },
  { label: "Referral", value: "REFERRAL" },
  { label: "Existing Customer", value: "EXISTING_CUSTOMER" },
  { label: "LinkedIn", value: "LINKEDIN" },
  { label: "Facebook", value: "FACEBOOK" },
  { label: "Google", value: "GOOGLE" },
  { label: "Cold Call", value: "COLD_CALL" },
  { label: "Walk-In", value: "WALK_IN" },
  { label: "Email", value: "EMAIL" },
  { label: "Partner", value: "PARTNER" },
  { label: "Trade Show", value: "TRADE_SHOW" },
  { label: "Tender", value: "TENDER" },
  { label: "Other", value: "OTHER" },
];

const PRIORITIES = [
  { label: "Low", value: "LOW" },
  { label: "Medium", value: "MEDIUM" },
  { label: "High", value: "HIGH" },
  { label: "Critical", value: "CRITICAL" },
];

const PROJECT_TYPES = [
  "Software", "Construction", "Manufacturing", "Consultancy", "Marketing",
  "Maintenance", "Trading", "Interior", "Architecture", "Healthcare", "Education", "Other"
];

const EXECUTION_TYPES = [
  { label: "Auto Detect", value: "AUTO_DETECT" },
  { label: "Service", value: "SERVICE" },
  { label: "Product", value: "PRODUCT" },
  { label: "Hybrid", value: "HYBRID" },
];

const INDUSTRIES = [
  "Technology", "Retail", "Manufacturing", "Healthcare", "Finance", 
  "Education", "Construction", "Real Estate", "Transportation", "Logistics", 
  "Energy", "Telecommunications", "Agriculture", "Hospitality", "Automotive", 
  "Aerospace", "Media", "Entertainment", "Other"
];

const COUNTRIES_WITH_TIMEZONES = [
  { name: "Afghanistan", timezone: "AFT (UTC+04:30)" },
  { name: "Albania", timezone: "CET (UTC+01:00)" },
  { name: "Algeria", timezone: "CET (UTC+01:00)" },
  { name: "Argentina", timezone: "ART (UTC-03:00)" },
  { name: "Australia", timezone: "AEST (UTC+10:00)" },
  { name: "Austria", timezone: "CET (UTC+01:00)" },
  { name: "Bahrain", timezone: "AST (UTC+03:00)" },
  { name: "Bangladesh", timezone: "BST (UTC+06:00)" },
  { name: "Belgium", timezone: "CET (UTC+01:00)" },
  { name: "Brazil", timezone: "BRT (UTC-03:00)" },
  { name: "Canada", timezone: "EST (UTC-05:00)" },
  { name: "Chile", timezone: "CLT (UTC-04:00)" },
  { name: "China", timezone: "CST (UTC+08:00)" },
  { name: "Colombia", timezone: "COT (UTC-05:00)" },
  { name: "Croatia", timezone: "CET (UTC+01:00)" },
  { name: "Czech Republic", timezone: "CET (UTC+01:00)" },
  { name: "Denmark", timezone: "CET (UTC+01:00)" },
  { name: "Egypt", timezone: "EET (UTC+02:00)" },
  { name: "Ethiopia", timezone: "EAT (UTC+03:00)" },
  { name: "Finland", timezone: "EET (UTC+02:00)" },
  { name: "France", timezone: "CET (UTC+01:00)" },
  { name: "Germany", timezone: "CET (UTC+01:00)" },
  { name: "Ghana", timezone: "GMT (UTC+00:00)" },
  { name: "Greece", timezone: "EET (UTC+02:00)" },
  { name: "Hong Kong", timezone: "HKT (UTC+08:00)" },
  { name: "Hungary", timezone: "CET (UTC+01:00)" },
  { name: "India", timezone: "IST (UTC+05:30)" },
  { name: "Indonesia", timezone: "WIB (UTC+07:00)" },
  { name: "Iran", timezone: "IRST (UTC+03:30)" },
  { name: "Iraq", timezone: "AST (UTC+03:00)" },
  { name: "Ireland", timezone: "GMT (UTC+00:00)" },
  { name: "Israel", timezone: "IST (UTC+02:00)" },
  { name: "Italy", timezone: "CET (UTC+01:00)" },
  { name: "Japan", timezone: "JST (UTC+09:00)" },
  { name: "Jordan", timezone: "AST (UTC+03:00)" },
  { name: "Kazakhstan", timezone: "ALMT (UTC+06:00)" },
  { name: "Kenya", timezone: "EAT (UTC+03:00)" },
  { name: "Kuwait", timezone: "AST (UTC+03:00)" },
  { name: "Lebanon", timezone: "EET (UTC+02:00)" },
  { name: "Malaysia", timezone: "MYT (UTC+08:00)" },
  { name: "Mexico", timezone: "CST (UTC-06:00)" },
  { name: "Morocco", timezone: "WET (UTC+01:00)" },
  { name: "Myanmar", timezone: "MMT (UTC+06:30)" },
  { name: "Nepal", timezone: "NPT (UTC+05:45)" },
  { name: "Netherlands", timezone: "CET (UTC+01:00)" },
  { name: "New Zealand", timezone: "NZST (UTC+12:00)" },
  { name: "Nigeria", timezone: "WAT (UTC+01:00)" },
  { name: "Norway", timezone: "CET (UTC+01:00)" },
  { name: "Oman", timezone: "GST (UTC+04:00)" },
  { name: "Pakistan", timezone: "PKT (UTC+05:00)" },
  { name: "Philippines", timezone: "PST (UTC+08:00)" },
  { name: "Poland", timezone: "CET (UTC+01:00)" },
  { name: "Portugal", timezone: "WET (UTC+00:00)" },
  { name: "Qatar", timezone: "AST (UTC+03:00)" },
  { name: "Romania", timezone: "EET (UTC+02:00)" },
  { name: "Russia", timezone: "MSK (UTC+03:00)" },
  { name: "Saudi Arabia", timezone: "AST (UTC+03:00)" },
  { name: "Singapore", timezone: "SGT (UTC+08:00)" },
  { name: "South Africa", timezone: "SAST (UTC+02:00)" },
  { name: "South Korea", timezone: "KST (UTC+09:00)" },
  { name: "Spain", timezone: "CET (UTC+01:00)" },
  { name: "Sri Lanka", timezone: "SLST (UTC+05:30)" },
  { name: "Sweden", timezone: "CET (UTC+01:00)" },
  { name: "Switzerland", timezone: "CET (UTC+01:00)" },
  { name: "Taiwan", timezone: "CST (UTC+08:00)" },
  { name: "Tanzania", timezone: "EAT (UTC+03:00)" },
  { name: "Thailand", timezone: "ICT (UTC+07:00)" },
  { name: "Tunisia", timezone: "CET (UTC+01:00)" },
  { name: "Turkey", timezone: "TRT (UTC+03:00)" },
  { name: "Ukraine", timezone: "EET (UTC+02:00)" },
  { name: "United Arab Emirates", timezone: "GST (UTC+04:00)" },
  { name: "United Kingdom", timezone: "GMT (UTC+00:00)" },
  { name: "United States", timezone: "EST (UTC-05:00)" },
  { name: "Venezuela", timezone: "VET (UTC-04:00)" },
  { name: "Vietnam", timezone: "ICT (UTC+07:00)" },
  { name: "Zimbabwe", timezone: "CAT (UTC+02:00)" },
  { name: "Other", timezone: "UTC (UTC+00:00)" },
];

interface Props {
  businessId: string;
}

export function CreateInquiryClient({ businessId }: Props) {
  const navigate = useNavigate();
  const { business, currencySymbol, currency } = useBusinessData();

  const bizCountry = String((business as any)?.country || "").toUpperCase();
  const symbol = bizCountry === "INDIA" ? "₹" : bizCountry === "UAE" ? "AED" : currencySymbol || "$";
  const currencyCode = bizCountry === "INDIA" ? "INR" : bizCountry === "UAE" ? "AED" : (currency || "USD");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customersError, setCustomersError] = useState("");
  const [users, setUsers] = useState<BusinessUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [formData, setFormData] = useState<any>({
    customerId: "", name: "", email: "", phone: "", company: "", website: "", position: "", 
    industry: "", companySize: "", preferredCommunication: "", gstVatNumber: "",
    inquiryTitle: "", inquiryType: "", source: "", priority: "", status: "", 
    assignedToId: "", department: "", businessUnit: "", 
    budgetRange: "", expectedRevenue: undefined, probability: undefined, expectedDecisionDate: "",
    projectType: "", executionType: "", expectedStartDate: "", expectedCompletionDate: "", 
    expectedDuration: "", businessRequirement: "", currentBusinessProblem: "", 
    expectedSolution: "", scopeSummary: "", deliverables: "", estimatedTeamSize: undefined,
    city: "", state: "", country: "", zipCode: "", timezone: "",
    internalNotes: "", salesStrategy: "", competitors: "", competitorName: "", 
    riskLevel: "", winProbability: undefined, expectedProfit: undefined, 
    expectedMargin: undefined, managementNotes: "", tags: "",
    nextFollowUpDate: "", reminder: false, meetingDate: "", meetingType: "", 
    meetingLocation: "", followUpNotes: "",
    attachments: [] as File[],
  });

  const fetchCustomers = async () => {
    try {
      setCustomersLoading(true); setCustomersError("");
      const res = await contactsAPI.getCustomers(businessId);
      const list = (res as any).data || (res as any).customers || [];
      setCustomers(list);
    } catch (err: any) {
      setCustomersError(err?.message || "Failed to load customers");
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
    } catch (err: any) {
      console.error("Failed to load users", err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) {
      fetchCustomers();
      fetchUsers();
    }
  }, [businessId]);

  const handleCustomerSelect = (customerId: string) => {
    const selected = customers.find((c) => c.id === customerId);
    if (selected) {
      const company = (selected as any).company || selected.name || "";
      const selectedCountry = (selected as any).country || "";
      const countryData = COUNTRIES_WITH_TIMEZONES.find(c => c.name === selectedCountry);
      setFormData((prev: any) => ({
        ...prev,
        customerId: selected.id,
        name: selected.name || company,
        company: company,
        email: selected.email || "",
        phone: selected.phone || "",
        city: (selected as any).city || prev.city,
        state: (selected as any).state || prev.state,
        country: selectedCountry || prev.country,
        timezone: countryData ? countryData.timezone : prev.timezone,
      }));
    } else {
      setFormData((prev: any) => ({
        ...prev, customerId: "", name: "", company: "", email: "", phone: "", city: "", state: "", country: "", timezone: ""
      }));
    }
  };

  const updateField = (field: string, value: any) =>
    setFormData((prev: any) => ({ ...prev, [field]: value }));

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCountry = e.target.value;
    const countryData = COUNTRIES_WITH_TIMEZONES.find(c => c.name === selectedCountry);
    setFormData((prev: any) => ({
      ...prev,
      country: selectedCountry,
      timezone: countryData ? countryData.timezone : prev.timezone
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFormData((prev: any) => ({
        ...prev,
        attachments: [...(prev.attachments || []), ...newFiles]
      }));
    }
  };

  const removeFile = (index: number) => {
    setFormData((prev: any) => {
      const newAttachments = [...(prev.attachments || [])];
      newAttachments.splice(index, 1);
      return { ...prev, attachments: newAttachments };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitError("");
    try {
      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(",").map((t: string) => t.trim()) : [],
        type: "INQUIRY", 
        assignedTo: formData.assignedToId,
      };
      await leadsAPI.createLead(businessId, payload as any);
      setSubmitSuccess(true);
      setTimeout(() => {
        navigate(`/dashboard/${businessId}/project-operations/inquiries`);
      }, 1200);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to create inquiry. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400";
  const labelClass = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5";
  const sectionClass = "bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm";
  const sectionHeaderClass = "text-base font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />
            <nav className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <span>Project Operations</span>
              <span>/</span>
              <span>Pre-Sales</span>
              <span>/</span>
              <a
                href={`/dashboard/${businessId}/project-operations/inquiries`}
                className="text-blue-500 hover:underline"
              >
                Inquiries
              </a>
              <span>/</span>
              <span className="text-gray-600 dark:text-gray-300">New Inquiry</span>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              form="create-inquiry-form"
              type="submit"
              disabled={submitLoading || submitSuccess}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              {submitLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : submitSuccess ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
              {submitLoading ? "Saving..." : submitSuccess ? "Saved!" : "Save Inquiry"}
            </button>
          </div>
        </div>
      </div>

      {/* Page Body */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Inquiry Workspace</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Capture comprehensive details for enterprise pre-sales project qualification.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
             <span className="text-blue-600 font-bold">1</span> / Inquiry
             <ArrowLeft className="w-3 h-3 mx-1 rotate-180" />
             <span className="opacity-60">Requirement</span>
             <ArrowLeft className="w-3 h-3 mx-1 rotate-180" />
             <span className="opacity-60">Project</span>
          </div>
        </div>

        {submitError && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {submitError}
          </div>
        )}

        <form id="create-inquiry-form" onSubmit={handleSubmit} className="space-y-8">

          {/* ── Section 1: Customer Information ─────────────────────────── */}
          <div className={sectionClass}>
            <h2 className={sectionHeaderClass}>
              <User className="w-5 h-5 text-blue-500" />
              1. Customer Information
            </h2>
            
            <div className="mb-6 bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-100 dark:border-gray-800">
              <label className={labelClass}>Existing Customer</label>
              <div className="flex flex-col sm:flex-row gap-3 items-start">
                <div className="relative flex-1 w-full">
                  <select
                    value={formData.customerId}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    disabled={customersLoading}
                    className={`${inputClass} pr-10 appearance-none cursor-pointer`}
                  >
                    {customersLoading ? (
                      <option value="">Loading customers…</option>
                    ) : customersError ? (
                      <option value="">⚠ Failed to load — retry below</option>
                    ) : customers.length === 0 ? (
                      <option value="">No customers found — create one →</option>
                    ) : (
                      <>
                        <option value="">— Select existing customer to auto-fill —</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {(c as any).company || c.name || "Unnamed Customer"}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                {customersError && (
                  <button type="button" onClick={fetchCustomers} className="flex items-center gap-2 px-3 py-2.5 border border-orange-400 text-orange-600 rounded-xl text-sm font-semibold hover:bg-orange-50 transition-colors">
                    <RefreshCw className="w-4 h-4" /> Retry
                  </button>
                )}
                <button type="button" onClick={() => setShowCreateCustomer(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-900 border border-blue-500 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors whitespace-nowrap shadow-sm">
                  <UserPlus className="w-4 h-4" /> Create New Customer
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className={labelClass}>Company Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input required type="text" value={formData.company} onChange={(e) => updateField("company", e.target.value)} placeholder="Acme Corp" className={`${inputClass} pl-10`} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Contact Person <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input required type="text" value={formData.name} onChange={(e) => updateField("name", e.target.value)} placeholder="John Doe" className={`${inputClass} pl-10`} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Designation</label>
                <input type="text" value={formData.position} onChange={(e) => updateField("position", e.target.value)} placeholder="CEO, Manager" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email Address <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input required type="email" value={formData.email} onChange={(e) => updateField("email", e.target.value)} placeholder="john@company.com" className={`${inputClass} pl-10`} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Phone Number <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input required type="tel" value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="+1 (555) 000-0000" className={`${inputClass} pl-10`} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Website</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="url" value={formData.website} onChange={(e) => updateField("website", e.target.value)} placeholder="https://acmecorp.com" className={`${inputClass} pl-10`} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Industry</label>
                <div className="relative">
                  <select value={formData.industry} onChange={(e) => updateField("industry", e.target.value)} className={`${inputClass} pr-10 appearance-none cursor-pointer`}>
                    <option value="">— Select Industry —</option>
                    {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Company Size</label>
                <input type="text" value={formData.companySize} onChange={(e) => updateField("companySize", e.target.value)} placeholder="1-50, 50-200" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>GST / VAT Number</label>
                <input type="text" value={formData.gstVatNumber} onChange={(e) => updateField("gstVatNumber", e.target.value)} placeholder="Tax ID" className={inputClass} />
              </div>
            </div>
          </div>

          {/* ── Section 2: Inquiry Information ──────────────────── */}
          <div className={sectionClass}>
            <h2 className={sectionHeaderClass}>
              <Tag className="w-5 h-5 text-blue-500" />
              2. Inquiry Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="md:col-span-2">
                <label className={labelClass}>Inquiry Title <span className="text-red-500">*</span></label>
                <input required type="text" value={formData.inquiryTitle} onChange={(e) => updateField("inquiryTitle", e.target.value)} placeholder="E.g. ERP Implementation Request" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <div className="relative">
                  <select value={formData.status} onChange={(e) => updateField("status", e.target.value)} className={`${inputClass} pr-10 appearance-none cursor-pointer`}>
                    <option value="">— Select Status —</option>
                    {LEAD_STATUSES.map(({ label, value }) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Priority</label>
                <div className="relative">
                  <select value={formData.priority} onChange={(e) => updateField("priority", e.target.value)} className={`${inputClass} pr-10 appearance-none cursor-pointer`}>
                    <option value="">— Select Priority —</option>
                    {PRIORITIES.map(({ label, value }) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className={labelClass}>Lead Source <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select required value={formData.source} onChange={(e) => updateField("source", e.target.value)} className={`${inputClass} pr-10 appearance-none cursor-pointer`}>
                    <option value="">— Select source —</option>
                    {LEAD_SOURCES.map(({ label, value }) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Assigned Sales Executive <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select required value={formData.assignedToId} onChange={(e) => updateField("assignedToId", e.target.value)} disabled={usersLoading} className={`${inputClass} pr-10 appearance-none cursor-pointer`}>
                    <option value="">— Select Employee —</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.user?.name || u.user?.email || "Unknown"}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Department / Unit</label>
                <input type="text" value={formData.department} onChange={(e) => updateField("department", e.target.value)} placeholder="Sales, B2B" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Expected Decision Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="date" value={formData.expectedDecisionDate} onChange={(e) => updateField("expectedDecisionDate", e.target.value)} className={`${inputClass} pl-10`} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Estimated Budget ({currencyCode})</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400 select-none">{symbol}</span>
                  <input type="number" step="0.01" value={formData.budgetRange ?? ""} onChange={(e) => updateField("budgetRange", e.target.value)} placeholder="0.00" className={`${inputClass} pl-10`} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Expected Revenue ({currencyCode})</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400 select-none">{symbol}</span>
                  <input type="number" step="0.01" value={formData.expectedRevenue ?? ""} onChange={(e) => updateField("expectedRevenue", e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="0.00" className={`${inputClass} pl-10`} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Probability (%)</label>
                <input type="number" min="0" max="100" value={formData.probability ?? ""} onChange={(e) => updateField("probability", e.target.value ? parseInt(e.target.value) : undefined)} placeholder="50" className={inputClass} />
              </div>
            </div>
          </div>

          {/* ── Section 3: Project Information ──────────────────── */}
          <div className={sectionClass}>
            <h2 className={sectionHeaderClass}>
              <Layers className="w-5 h-5 text-blue-500" />
              3. Project Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
              <div>
                <label className={labelClass}>Project Type</label>
                <div className="relative">
                  <select value={formData.projectType} onChange={(e) => updateField("projectType", e.target.value)} className={`${inputClass} pr-10 appearance-none cursor-pointer`}>
                    <option value="">— Select Type —</option>
                    {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Execution Type</label>
                <div className="relative">
                  <select value={formData.executionType} onChange={(e) => updateField("executionType", e.target.value)} className={`${inputClass} pr-10 appearance-none cursor-pointer`}>
                    <option value="">— Select Execution Type —</option>
                    {EXECUTION_TYPES.map(({ label, value }) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Expected Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="date" value={formData.expectedStartDate} onChange={(e) => updateField("expectedStartDate", e.target.value)} className={`${inputClass} pl-10`} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Expected Duration</label>
                <input type="text" value={formData.expectedDuration} onChange={(e) => updateField("expectedDuration", e.target.value)} placeholder="e.g. 6 Months" className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className={labelClass}>Business Requirement <span className="text-red-500">*</span></label>
                <textarea required rows={3} value={formData.businessRequirement} onChange={(e) => updateField("businessRequirement", e.target.value)} placeholder="Describe the core business requirement..." className={`${inputClass} resize-none`} />
              </div>
              <div>
                <label className={labelClass}>Current Business Problem</label>
                <textarea rows={3} value={formData.currentBusinessProblem} onChange={(e) => updateField("currentBusinessProblem", e.target.value)} placeholder="What pain points are they facing?" className={`${inputClass} resize-none`} />
              </div>
              <div>
                <label className={labelClass}>Expected Solution</label>
                <textarea rows={3} value={formData.expectedSolution} onChange={(e) => updateField("expectedSolution", e.target.value)} placeholder="What solution is expected?" className={`${inputClass} resize-none`} />
              </div>
              <div>
                <label className={labelClass}>Scope Summary</label>
                <textarea rows={3} value={formData.scopeSummary} onChange={(e) => updateField("scopeSummary", e.target.value)} placeholder="High level scope details..." className={`${inputClass} resize-none`} />
              </div>
            </div>
          </div>

          {/* ── Section 4: Location ─────────────────────────── */}
          <div className={sectionClass}>
            <h2 className={sectionHeaderClass}>
              <MapPin className="w-5 h-5 text-blue-500" />
              4. Location
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
              <div>
                <label className={labelClass}>Country</label>
                <div className="relative">
                  <select 
                    value={formData.country} 
                    onChange={handleCountryChange} 
                    className={`${inputClass} pr-10 appearance-none cursor-pointer`}
                  >
                    <option value="">— Select Country —</option>
                    {COUNTRIES_WITH_TIMEZONES.map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
              <div><label className={labelClass}>State</label><input type="text" value={formData.state} onChange={(e) => updateField("state", e.target.value)} placeholder="Maharashtra" className={inputClass} /></div>
              <div><label className={labelClass}>City</label><input type="text" value={formData.city} onChange={(e) => updateField("city", e.target.value)} placeholder="Mumbai" className={inputClass} /></div>
              <div><label className={labelClass}>ZIP Code</label><input type="text" value={formData.zipCode} onChange={(e) => updateField("zipCode", e.target.value)} placeholder="400001" className={inputClass} /></div>
              <div>
                <label className={labelClass}>
                  Timezone
                  {formData.timezone && COUNTRIES_WITH_TIMEZONES.some(c => c.timezone === formData.timezone) && (
                    <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      ✓ Auto-detected
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.timezone}
                  onChange={(e) => updateField("timezone", e.target.value)}
                  placeholder="Select a country to auto-fill"
                  className={`${inputClass} ${formData.timezone && COUNTRIES_WITH_TIMEZONES.some(c => c.timezone === formData.timezone) ? 'border-emerald-400 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-800 dark:text-emerald-300 font-semibold' : ''}`}
                />
              </div>
            </div>
          </div>

          {/* ── Section 5: Attachments ─────────────────────────── */}
          <div className={sectionClass}>
             <h2 className={sectionHeaderClass}>
              <Paperclip className="w-5 h-5 text-blue-500" />
              5. Attachments
            </h2>
            <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-10 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-900/50 text-center relative overflow-hidden transition-colors hover:bg-gray-100/50 dark:hover:bg-gray-800/50">
               <input 
                  type="file" 
                  multiple 
                  onChange={handleFileChange} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Click or drag files here"
               />
               <FolderHeart className="w-10 h-10 text-gray-400 mb-3" />
               <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Drag & Drop Documents Here</p>
               <p className="text-xs text-gray-500 mt-1 max-w-sm">Support for PDF, Word, Excel, Images, BOQ, Tender Docs.</p>
               <button type="button" className="mt-4 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 pointer-events-none shadow-sm">
                  Browse Files
               </button>
            </div>
            {formData.attachments && formData.attachments.length > 0 && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {formData.attachments.map((file: File, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Paperclip className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300 truncate">{file.name}</span>
                    </div>
                    <button type="button" onClick={() => removeFile(idx)} className="text-blue-400 hover:text-red-500 transition-colors ml-2 flex-shrink-0">
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Section 6: Internal Information ───────────────── */}
          <div className={sectionClass}>
            <h2 className={sectionHeaderClass}>
              <Briefcase className="w-5 h-5 text-blue-500" />
              6. Internal Information (Sales Strategy)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
              <div className="md:col-span-2">
                 <label className={labelClass}>Internal Notes / Management Notes</label>
                 <textarea rows={2} value={formData.managementNotes} onChange={(e) => updateField("managementNotes", e.target.value)} placeholder="Visible only to internal users..." className={`${inputClass} resize-none`} />
              </div>
              <div className="md:col-span-2">
                 <label className={labelClass}>Sales Strategy</label>
                 <textarea rows={2} value={formData.salesStrategy} onChange={(e) => updateField("salesStrategy", e.target.value)} placeholder="How do we win this?" className={`${inputClass} resize-none`} />
              </div>
              <div><label className={labelClass}>Competitors</label><input type="text" value={formData.competitors} onChange={(e) => updateField("competitors", e.target.value)} placeholder="Competitor A, B" className={inputClass} /></div>
              <div><label className={labelClass}>Risk Level</label><input type="text" value={formData.riskLevel} onChange={(e) => updateField("riskLevel", e.target.value)} placeholder="Low, Medium, High" className={inputClass} /></div>
              <div><label className={labelClass}>Expected Profit ({currencyCode})</label><input type="number" step="0.01" value={formData.expectedProfit ?? ""} onChange={(e) => updateField("expectedProfit", e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="0.00" className={inputClass} /></div>
              <div><label className={labelClass}>Tags (Comma Separated)</label><input type="text" value={formData.tags} onChange={(e) => updateField("tags", e.target.value)} placeholder="Enterprise, VIP, Q3" className={inputClass} /></div>
            </div>
          </div>

          {/* ── Section 7: Follow-up & Activities ─────────────── */}
          <div className={sectionClass}>
            <h2 className={sectionHeaderClass}>
              <Activity className="w-5 h-5 text-blue-500" />
              7. Follow-up & Activities
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className={labelClass}>Next Follow-up Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="date" value={formData.nextFollowUpDate} onChange={(e) => updateField("nextFollowUpDate", e.target.value)} className={`${inputClass} pl-10`} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Meeting Type</label>
                <input type="text" value={formData.meetingType} onChange={(e) => updateField("meetingType", e.target.value)} placeholder="Online, On-Site, Call" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Meeting Location</label>
                <input type="text" value={formData.meetingLocation} onChange={(e) => updateField("meetingLocation", e.target.value)} placeholder="Zoom, Office" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLoading || submitSuccess}
              className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
            >
              {submitLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : submitSuccess ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <CheckSquare className="w-4 h-4" />
              )}
              {submitLoading ? "Saving…" : submitSuccess ? "Saved! Redirecting…" : "Save Customer Inquiry"}
            </button>
          </div>
        </form>
      </div>
      
      {/* Create Customer Modal */}
      <CreateCustomerModal
        open={showCreateCustomer}
        onClose={() => setShowCreateCustomer(false)}
        businessId={businessId}
        onCreated={(newCustomer) => {
          setCustomers((prev) => [...prev, newCustomer]);
          const company = newCustomer.company || newCustomer.name || "";
          setFormData((prev: any) => ({
            ...prev,
            customerId: newCustomer.id,
            name: newCustomer.name || company,
            company,
            email: newCustomer.email || "",
            phone: newCustomer.phone || "",
            city: newCustomer.city || prev.city,
            state: newCustomer.state || prev.state,
            country: newCustomer.country || prev.country,
          }));
          setShowCreateCustomer(false);
        }}
      />
    </div>
  );
}
