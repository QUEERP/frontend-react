import { toast } from 'sonner';
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  Building2Icon,
  SaveIcon,
  CopyIcon,
  GlobeIcon,
  HashIcon,
  PhoneIcon,
  MapPinIcon,
  AlertTriangleIcon,
  Sparkles,
} from 'lucide-react';
import { leadsAPI, Lead } from '@/lib/api/leads';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DashboardModeToggle } from '@/components/dashboard/mode-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { useBusinessData } from '@/components/dashboard/business-data-provider';
import { UserMenu } from './user-menu';
import { CurrencySelect } from '@/components/dashboard/currency-select';
import { CountrySelect } from '@/components/dashboard/country-select';
import { 
  getBankConfigForCountry, 
  INDIAN_GST_STATES, 
  CountryBankConfig,
  getPhoneRulesForCountry
} from '@/lib/bank-configs';
import { COUNTRY_TO_CURRENCY } from '@/lib/country_to_currency';
import { 
  DynamicBankAccountsSection, 
  BankAccountItem 
} from './DynamicBankAccountsSection';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function AddCustomerClient({ businessId }: { businessId: string }) {
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [draftAccount, setDraftAccount] = useState<Record<string, string> | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get('leadId');
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [loadingLead, setLoadingLead] = useState(false);
  const { toast: uiToast } = useToast();
  const { business, refresh } = useBusinessData();

  const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');
  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\\^])/g, '\\$1') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : '';
  };

  const getToken = () => {
    const fromCookie = getCookie('token') || getCookie('accessToken');
    if (fromCookie) return fromCookie;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
    }
    return '';
  };

  const getActiveBusinessId = () => {
    if (businessId && String(businessId).trim()) return businessId;
    if (business?.id) return business.id;
    const cookieBiz = getCookie('activeBusinessId') || getCookie('businessId');
    if (cookieBiz) return cookieBiz;
    if (typeof window !== 'undefined') {
      const match = window.location.pathname.match(/\/dashboard\/([^/]+)/);
      if (match && match[1]) return decodeURIComponent(match[1]);
      const stored = localStorage.getItem('businessId') || localStorage.getItem('activeBusinessId') || localStorage.getItem('last_business_id');
      if (stored) return stored;
    }
    return '';
  };

  // Country is the single source of truth (Default: Business country or India)
  const defaultCountry = business?.country || 'India';
  const initialConfig = getBankConfigForCountry(defaultCountry);
  const initialCurrency = COUNTRY_TO_CURRENCY[defaultCountry] || initialConfig.currency || 'INR';

  const [formData, setFormData] = useState({
    company: '',
    country: defaultCountry,
    region: defaultCountry,
    vatNumber: '',
    phone: '',
    website: '',
    group: '',
    currency: initialCurrency,
    defaultLanguage: 'SYSTEM',

    // Upgraded CRM Fields
    industry: '',
    annualRevenue: '',
    employeeCount: '',
    linkedinUrl: '',
    tags: '',

    // Main Address
    address: '',
    city: '',
    state: (defaultCountry.toUpperCase() === 'INDIA' || defaultCountry.toUpperCase() === 'IN') ? 'Gujarat' : '',
    zipCode: '',

    // Billing Address
    billingStreet: '',
    billingCity: '',
    billingState: (defaultCountry.toUpperCase() === 'INDIA' || defaultCountry.toUpperCase() === 'IN') ? 'Gujarat' : '',
    billingZipCode: '',
    billingCountry: defaultCountry,
    sameAsMainAddress: true,

    // Shipping Address
    shippingStreet: '',
    shippingCity: '',
    shippingState: (defaultCountry.toUpperCase() === 'INDIA' || defaultCountry.toUpperCase() === 'IN') ? 'Gujarat' : '',
    shippingZipCode: '',
    shippingCountry: defaultCountry,
    sameAsBillingAddress: true,
  });

  const [bankAccounts, setBankAccounts] = useState<BankAccountItem[]>([]);
  const [pendingCountryChange, setPendingCountryChange] = useState<string | null>(null);
  const [showCountryChangeModal, setShowCountryChangeModal] = useState(false);

  const bankConfig: CountryBankConfig = useMemo(() => {
    return getBankConfigForCountry(formData.country);
  }, [formData.country]);

  const phoneRules = useMemo(() => {
    return getPhoneRulesForCountry(formData.country);
  }, [formData.country]);

  useEffect(() => {
    const storedName = window.localStorage.getItem('businessName');
    if (storedName) {
      setBusinessName(storedName);
    }
  }, []);

  useEffect(() => {
    if (!leadId) return;
    const fetchLeadForCustomer = async () => {
      try {
        setLoadingLead(true);
        const activeBiz = getActiveBusinessId();
        if (!activeBiz) return;
        const res = await leadsAPI.getLeadDetails(activeBiz, leadId);
        if (res.success && res.data) {
          const l = res.data;
          setConvertingLead(l);

          let targetCountry = defaultCountry;
          if (l.country) {
            const cleanC = l.country.trim().toUpperCase();
            if (['IN', 'IND', 'INDIA'].includes(cleanC)) targetCountry = 'India';
            else if (['AE', 'ARE', 'UAE', 'UNITED ARAB EMIRATES'].includes(cleanC) || cleanC.includes('EMIRATES')) targetCountry = 'United Arab Emirates';
            else if (['US', 'USA', 'UNITED STATES'].includes(cleanC) || cleanC.includes('STATES')) targetCountry = 'United States';
            else if (['GB', 'GBR', 'UK', 'UNITED KINGDOM'].includes(cleanC) || cleanC.includes('KINGDOM')) targetCountry = 'United Kingdom';
            else if (['CA', 'CAN', 'CANADA'].includes(cleanC)) targetCountry = 'Canada';
            else if (['AU', 'AUS', 'AUSTRALIA'].includes(cleanC)) targetCountry = 'Australia';
            else if (['SA', 'SAU', 'SAUDI ARABIA'].includes(cleanC)) targetCountry = 'Saudi Arabia';
            else targetCountry = l.country;
          }

          const targetConfig = getBankConfigForCountry(targetCountry);
          const targetCurrency = l.currency || COUNTRY_TO_CURRENCY[targetCountry] || targetConfig.currency || 'INR';
          const targetPhoneRules = getPhoneRulesForCountry(targetCountry);

          let nationalPhone = l.phone || '';
          if (targetPhoneRules.phoneCode && nationalPhone.startsWith(targetPhoneRules.phoneCode)) {
            nationalPhone = nationalPhone.replace(targetPhoneRules.phoneCode, '').trim();
          } else if (nationalPhone.startsWith('+')) {
            nationalPhone = nationalPhone.replace(/^\+\d+\s*/, '').trim();
          }
          nationalPhone = nationalPhone.replace(/\D/g, '').slice(0, targetPhoneRules.maxDigits);

          const isIndia = targetCountry.toUpperCase() === 'INDIA' || targetCountry.toUpperCase() === 'IN';
          const resolvedState = l.state || (isIndia ? 'Gujarat' : '');

          setFormData(prev => ({
            ...prev,
            company: l.company || l.name || '',
            country: targetCountry,
            region: targetCountry,
            currency: targetCurrency,
            phone: nationalPhone,
            website: l.website || '',
            vatNumber: l.gstVatNumber || '',
            industry: l.industry || '',
            tags: Array.isArray(l.tags) ? l.tags.join(', ') : (l.tags || ''),
            address: l.address || '',
            city: l.city || '',
            state: resolvedState,
            zipCode: l.zipCode || '',
            billingStreet: l.address || '',
            billingCity: l.city || '',
            billingState: resolvedState,
            billingZipCode: l.zipCode || '',
            billingCountry: targetCountry,
            shippingStreet: l.address || '',
            shippingCity: l.city || '',
            shippingState: resolvedState,
            shippingZipCode: l.zipCode || '',
            shippingCountry: targetCountry,
          }));
        }
      } catch (err: any) {
        console.error('Failed to load lead details for customer creation:', err);
        toast.error('Could not load lead information');
      } finally {
        setLoadingLead(false);
      }
    };

    fetchLeadForCustomer();
  }, [leadId]);

  const handleCountrySelection = (newCountry: string) => {
    if (newCountry === formData.country) return;

    // Check if user has entered data that would be invalidated
    const hasData = Boolean(
      formData.vatNumber ||
      bankAccounts.length > 0 ||
      ((formData.country.toUpperCase() === 'INDIA' || formData.country.toUpperCase() === 'IN') && formData.state)
    );

    if (hasData) {
      setPendingCountryChange(newCountry);
      setShowCountryChangeModal(true);
    } else {
      applyCountryChange(newCountry);
    }
  };

  const applyCountryChange = (newCountry: string) => {
    const config = getBankConfigForCountry(newCountry);
    const newCurrency = COUNTRY_TO_CURRENCY[newCountry] || config.currency || 'USD';
    const newPhoneRules = getPhoneRulesForCountry(newCountry);
    const isIndia = newCountry.toUpperCase() === 'INDIA' || newCountry.toUpperCase() === 'IN';
    const defaultState = isIndia ? 'Gujarat' : '';

    setFormData(prev => {
      return {
        ...prev,
        country: newCountry,
        region: newCountry,
        currency: newCurrency,
        phone: prev.phone.slice(0, newPhoneRules.maxDigits),
        state: defaultState,
        billingState: prev.sameAsMainAddress ? defaultState : prev.billingState,
        shippingState: prev.sameAsBillingAddress ? defaultState : prev.shippingState,
        billingCountry: prev.sameAsMainAddress ? newCountry : prev.billingCountry,
        shippingCountry: prev.sameAsBillingAddress ? newCountry : prev.shippingCountry,
        vatNumber: '' // Clear tax number since format changes
      };
    });
    // Reset bank accounts since format changes
    setBankAccounts([]);
    setShowCountryChangeModal(false);
    setPendingCountryChange(null);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (prev.sameAsMainAddress && ['address', 'city', 'state', 'zipCode'].includes(field)) {
        if (field === 'address') next.billingStreet = value;
        if (field === 'city') next.billingCity = value;
        if (field === 'state') next.billingState = value;
        if (field === 'zipCode') next.billingZipCode = value;
      }
      if (prev.sameAsBillingAddress && ['billingStreet', 'billingCity', 'billingState', 'billingZipCode'].includes(field)) {
        if (field === 'billingStreet') next.shippingStreet = value;
        if (field === 'billingCity') next.shippingCity = value;
        if (field === 'billingState') next.shippingState = value;
        if (field === 'billingZipCode') next.shippingZipCode = value;
      }
      return next;
    });
  };

  const handleSameAsMainAddressChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      sameAsMainAddress: checked,
      ...(checked && {
        billingStreet: prev.address,
        billingCity: prev.city,
        billingState: prev.state,
        billingZipCode: prev.zipCode,
        billingCountry: prev.country
      })
    }));
  };

  const handleSameAsBillingAddressChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      sameAsBillingAddress: checked,
      ...(checked && {
        shippingStreet: prev.billingStreet,
        shippingCity: prev.billingCity,
        shippingState: prev.billingState,
        shippingZipCode: prev.billingZipCode,
        shippingCountry: prev.billingCountry
      })
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.company || !formData.company.trim()) {
      toast.error("Company / Customer name is required.");
      uiToast({
        title: "Validation Error",
        description: "Company name is required.",
        variant: "destructive",
      });
      return;
    }

    if (formData.country === 'INDIA' && !formData.state) {
      toast.error("State is required for Indian customers under CBIC regulations.");
      uiToast({
        title: "Validation Error",
        description: "State is required for Indian customers under CBIC regulations.",
        variant: "destructive",
      });
      return;
    }

    if (formData.vatNumber && bankConfig.taxValidator) {
      const taxRes = bankConfig.taxValidator(formData.vatNumber);
      if (typeof taxRes === 'string') {
        toast.error(taxRes);
        uiToast({
          title: "Invalid Tax ID",
          description: taxRes,
          variant: "destructive",
        });
        return;
      }
    }

    const activeBusinessId = getActiveBusinessId();
    if (!activeBusinessId) {
      toast.error("Active business identifier not found. Please refresh or select a business.");
      uiToast({
        title: "Configuration Error",
        description: "Active business identifier not found. Please refresh or select a business.",
        variant: "destructive",
      });
      return;
    }

    // Auto-save pending bank account if user entered details in the subform without clicking "Save Account"
    let finalBankAccounts = [...bankAccounts];
    if (draftAccount && (draftAccount.bankName?.trim() || draftAccount.accountHolderName?.trim() || draftAccount.accountNumber?.trim() || draftAccount.bsb?.trim() || draftAccount.iban?.trim())) {
      let draftError: string | null = null;
      for (const field of bankConfig.fields) {
        const val = (draftAccount[field.key] || '').trim();
        if (field.required && !val) {
          draftError = `${field.label} is required for the pending ${bankConfig.countryName} bank account.`;
          break;
        }
        if (val && field.validator) {
          const res = field.validator(val);
          if (typeof res === 'string') {
            draftError = res;
            break;
          } else if (res === false) {
            draftError = `Invalid ${field.label} in bank account.`;
            break;
          }
        }
      }

      if (draftError) {
        toast.error(draftError);
        uiToast({
          title: "Incomplete Bank Account",
          description: draftError,
          variant: "destructive",
        });
        return;
      }

      const rawNum = draftAccount.accountNumber || draftAccount.iban || '';
      const masked = rawNum.length > 4 ? `••••••••${rawNum.slice(-4)}` : (rawNum ? `••••${rawNum}` : '••••');
      finalBankAccounts.push({
        accountHolderName: (draftAccount.accountHolderName || '').trim(),
        bankName: (draftAccount.bankName || '').trim(),
        accountNumber: (draftAccount.accountNumber || draftAccount.iban || '').trim(),
        accountNumberMasked: masked,
        country: bankConfig.countryName,
        currency: formData.currency || bankConfig.currency,
        ifsc: draftAccount.ifsc?.trim(),
        iban: draftAccount.iban?.trim(),
        swift: draftAccount.swift?.trim(),
        routingNumber: draftAccount.routingNumber?.trim(),
        branchName: draftAccount.branchName?.trim(),
        upiId: draftAccount.upiId?.trim(),
        sortCode: draftAccount.sortCode?.trim(),
        transitNumber: draftAccount.transitNumber?.trim(),
        institutionNumber: draftAccount.institutionNumber?.trim(),
        bsb: draftAccount.bsb?.trim(),
        isPrimary: finalBankAccounts.length === 0
      });
    }

    setIsSubmitting(true);
    setSaveStatus('saving');

    try {
      const token = getToken();
      const payload = {
        businessId: activeBusinessId,
        leadId: leadId || undefined,
        company: formData.company.trim(),
        country: formData.country,
        region: formData.country,
        currency: formData.currency,
        vatNumber: formData.vatNumber || undefined,
        phone: formData.phone ? `${phoneRules.phoneCode} ${formData.phone}` : undefined,
        website: formData.website || undefined,
        group: formData.group || undefined,
        defaultLanguage: formData.defaultLanguage,

        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zipCode: formData.zipCode || undefined,

        billingStreet: formData.sameAsMainAddress ? formData.address : formData.billingStreet,
        billingCity: formData.sameAsMainAddress ? formData.city : formData.billingCity,
        billingState: formData.sameAsMainAddress ? formData.state : formData.billingState,
        billingZipCode: formData.sameAsMainAddress ? formData.zipCode : formData.billingZipCode,
        billingCountry: formData.sameAsMainAddress ? formData.country : (formData.billingCountry || formData.country),

        shippingStreet: formData.sameAsBillingAddress ? (formData.sameAsMainAddress ? formData.address : formData.billingStreet) : formData.shippingStreet,
        shippingCity: formData.sameAsBillingAddress ? (formData.sameAsMainAddress ? formData.city : formData.billingCity) : formData.shippingCity,
        shippingState: formData.sameAsBillingAddress ? (formData.sameAsMainAddress ? formData.state : formData.billingState) : formData.shippingState,
        shippingZipCode: formData.sameAsBillingAddress ? (formData.sameAsMainAddress ? formData.zipCode : formData.billingZipCode) : formData.shippingZipCode,
        shippingCountry: formData.sameAsBillingAddress ? (formData.sameAsMainAddress ? formData.country : (formData.billingCountry || formData.country)) : (formData.shippingCountry || formData.country),

        industry: formData.industry || undefined,
        annualRevenue: formData.annualRevenue || undefined,
        employeeCount: formData.employeeCount || undefined,
        linkedinUrl: formData.linkedinUrl || undefined,
        tags: formData.tags || undefined,

        bankAccounts: finalBankAccounts.map(acc => ({
          accountHolderName: acc.accountHolderName,
          bankName: acc.bankName,
          accountNumber: acc.accountNumber || acc.iban || '',
          country: acc.country || formData.country,
          currency: acc.currency || formData.currency,
          ifsc: acc.ifsc || undefined,
          iban: acc.iban || undefined,
          swift: acc.swift || undefined,
          routingNumber: acc.routingNumber || undefined,
          branchName: acc.branchName || undefined,
          upiId: acc.upiId || undefined,
          sortCode: acc.sortCode || undefined,
          transitNumber: acc.transitNumber || undefined,
          institutionNumber: acc.institutionNumber || undefined,
          bsb: acc.bsb || undefined,
          isPrimary: acc.isPrimary
        }))
      };

      const response = await fetch(`${API_BASE}/api/customers?businessId=${encodeURIComponent(activeBusinessId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-business-id': activeBusinessId,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create customer');
      }

      setSaveStatus('saved');
      const successMsg = convertingLead 
        ? `Lead "${convertingLead.company || convertingLead.name}" converted to Customer "${formData.company}" successfully!` 
        : `Customer "${formData.company}" created successfully!`;
      toast.success(successMsg);
      uiToast({
        title: "Success",
        description: successMsg,
      });
      try {
        if (refresh) await refresh();
      } catch {}
      navigate(`/dashboard/${activeBusinessId}/customers`);
    } catch (err: any) {
      console.error('Error creating customer:', err);
      toast.error(err.message || "Failed to create customer");
      uiToast({
        title: "Error",
        description: err.message || "Failed to create customer",
        variant: "destructive"
      });
      setSaveStatus('idle');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <div className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to={`/dashboard/${businessId}/customers`}
              className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              <ArrowLeftIcon className="size-4" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Building2Icon className="size-5 text-blue-600" />
                Add New Customer
              </h1>
              <p className="text-xs text-muted-foreground">
                GST (India), statutory multi-currency, and dynamic bank accounts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DashboardModeToggle />
            <UserMenu />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {convertingLead && (
          <div className="mb-6 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/30 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                <Sparkles className="size-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                  Converting Lead: {convertingLead.company || convertingLead.name}
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Information pre-filled from lead details. Creating this customer profile will mark the lead as Converted.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-emerald-200/80 dark:bg-emerald-800/80 text-emerald-900 dark:text-emerald-100 rounded-full">
              Lead Conversion
            </span>
          </div>
        )}
        <Card className="border border-border/80 shadow-sm bg-card rounded-2xl overflow-hidden">
          <CardHeader className="bg-muted/20 border-b border-border pb-6">
            <CardTitle className="text-base font-bold text-foreground">Customer Profile</CardTitle>
            <CardDescription className="text-xs">
              Country is the single source of truth for statutory tax rules, currency, phone code, and settlement fields.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} noValidate className="space-y-8">
              {/* 1. Primary Statutory Identity */}
              <div className="space-y-6">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2 flex items-center gap-2">
                  <GlobeIcon className="size-4 text-blue-600" />
                  Primary Statutory Identity
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Company Name */}
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-sm font-semibold text-foreground">
                      Company / Customer Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="company"
                      placeholder="e.g. Acme Corporation"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      className="rounded-xl border-border bg-background h-11 text-sm shadow-sm"
                      required
                    />
                  </div>

                  {/* Country - Single Source of Truth */}
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-sm font-semibold text-foreground">
                      Country (Single Source of Truth) <span className="text-destructive">*</span>
                    </Label>
                    <CountrySelect
                      value={formData.country}
                      onValueChange={handleCountrySelection}
                    />
                  </div>

                  {/* Settlement Currency */}
                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-sm font-semibold text-foreground">Settlement Currency</Label>
                    <CurrencySelect
                      value={formData.currency}
                      onValueChange={(val) => handleInputChange('currency', val)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Tax Number (GSTIN / TRN / VAT) */}
                  <div className="space-y-2">
                    <Label htmlFor="vatNumber" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <HashIcon className="size-3.5 text-blue-600" />
                      {bankConfig.taxLabel} Number
                    </Label>
                    <Input
                      id="vatNumber"
                      placeholder={bankConfig.taxPlaceholder}
                      value={formData.vatNumber}
                      onChange={(e) => handleInputChange('vatNumber', e.target.value.toUpperCase())}
                      className="rounded-xl border-border bg-background h-11 text-sm shadow-sm font-mono tracking-wide"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="phone" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <PhoneIcon className="size-3.5 text-blue-600" />
                        Phone Number
                      </Label>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {formData.phone.length}/{phoneRules.maxDigits} digits
                      </span>
                    </div>
                    <div className="flex rounded-xl border border-border overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:border-primary bg-background shadow-sm h-11">
                      <div className="inline-flex items-center px-3.5 bg-muted/50 text-muted-foreground text-xs font-mono font-medium border-r border-border select-none shrink-0">
                        {phoneRules.phoneCode}
                      </div>
                      <Input
                        id="phone"
                        type="tel"
                        inputMode="numeric"
                        placeholder={`Up to ${phoneRules.maxDigits} digits`}
                        value={formData.phone}
                        onChange={(e) => {
                          const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, phoneRules.maxDigits);
                          handleInputChange('phone', digitsOnly);
                        }}
                        maxLength={phoneRules.maxDigits}
                        className="rounded-none border-0 h-full shadow-none focus-visible:ring-0 text-sm font-mono tracking-wider w-full"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Numeric digits only. Dynamic max {phoneRules.maxDigits} digits for {formData.country || 'selected country'}.
                    </p>
                  </div>

                  {/* Website */}
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-sm font-semibold text-foreground">Website</Label>
                    <Input
                      id="website"
                      placeholder="https://example.com"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="rounded-xl border-border bg-background h-11 text-sm shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Main Address & Place of Supply */}
              <div className="space-y-6 pt-4 border-t border-border">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <MapPinIcon className="size-4 text-blue-600" />
                  Place of Supply & Address ({formData.country})
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-semibold text-foreground">Street Address</Label>
                    <Input
                      id="address"
                      placeholder="Enter street address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="rounded-xl border-border bg-background h-11 text-sm shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-semibold text-foreground">City</Label>
                      <Input
                        id="city"
                        placeholder="e.g. Ahmedabad, Dubai"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="rounded-xl border-border bg-background h-11 text-sm shadow-sm"
                      />
                    </div>

                    {/* State - Dropdown with GST Codes for India, Text for Others */}
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-sm font-semibold text-foreground">
                        State {(formData.country.toUpperCase() === 'INDIA' || formData.country.toUpperCase() === 'IN') && <span className="text-destructive">* (Statutory GST Code)</span>}
                      </Label>
                      {(formData.country.toUpperCase() === 'INDIA' || formData.country.toUpperCase() === 'IN') ? (
                        <Select value={formData.state} onValueChange={(val) => handleInputChange('state', val)}>
                          <SelectTrigger className="w-full rounded-xl border-border bg-background h-11 text-sm shadow-sm font-medium">
                            <SelectValue placeholder="Select Indian State" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border shadow-lg max-h-72">
                            {INDIAN_GST_STATES.map((s) => (
                              <SelectItem key={s.code} value={s.name} className="cursor-pointer">
                                <span className="font-mono text-xs text-blue-600 mr-2">[{s.code}]</span>
                                {s.name} ({s.short})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id="state"
                          placeholder="e.g. California, Dubai"
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          className="rounded-xl border-border bg-background h-11 text-sm shadow-sm"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zipCode" className="text-sm font-semibold text-foreground">Postal / Zip Code</Label>
                      <Input
                        id="zipCode"
                        placeholder="e.g. 380001, 10001"
                        value={formData.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                        className="rounded-xl border-border bg-background h-11 text-sm shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Billing / Shipping Synchronization Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center space-x-2.5 p-3 rounded-xl border border-border bg-muted/20">
                    <Checkbox
                      id="sameAsMainAddress"
                      checked={formData.sameAsMainAddress}
                      onCheckedChange={handleSameAsMainAddressChange}
                      className="rounded"
                    />
                    <Label htmlFor="sameAsMainAddress" className="text-xs font-medium cursor-pointer text-foreground flex items-center gap-1.5">
                      <CopyIcon className="size-3.5" />
                      Billing Address same as Main Address
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2.5 p-3 rounded-xl border border-border bg-muted/20">
                    <Checkbox
                      id="sameAsBillingAddress"
                      checked={formData.sameAsBillingAddress}
                      onCheckedChange={handleSameAsBillingAddressChange}
                      className="rounded"
                    />
                    <Label htmlFor="sameAsBillingAddress" className="text-xs font-medium cursor-pointer text-foreground flex items-center gap-1.5">
                      <CopyIcon className="size-3.5" />
                      Shipping Address same as Billing Address
                    </Label>
                  </div>
                </div>

                {/* Editable Billing Address Section when unchecked */}
                {!formData.sameAsMainAddress && (
                  <div className="p-5 rounded-2xl border border-blue-500/20 bg-blue-500/5 dark:bg-blue-950/10 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="size-4 text-blue-600" />
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                          Billing Address
                        </h4>
                      </div>
                      <span className="text-xs text-muted-foreground">Custom billing destination</span>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="billingStreet" className="text-sm font-semibold text-foreground">
                          Billing Street Address
                        </Label>
                        <Input
                          id="billingStreet"
                          placeholder="Enter billing street address"
                          value={formData.billingStreet}
                          onChange={(e) => handleInputChange('billingStreet', e.target.value)}
                          className="rounded-xl border-border bg-background h-11 text-sm shadow-sm"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="billingCity" className="text-sm font-semibold text-foreground">City</Label>
                          <Input
                            id="billingCity"
                            placeholder="e.g. Mumbai, New York"
                            value={formData.billingCity}
                            onChange={(e) => handleInputChange('billingCity', e.target.value)}
                            className="rounded-xl border-border bg-background h-11 text-sm shadow-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="billingState" className="text-sm font-semibold text-foreground">
                            State / Province
                          </Label>
                          {(formData.billingCountry.toUpperCase() === 'INDIA' || formData.billingCountry.toUpperCase() === 'IN') ? (
                            <Select
                              value={formData.billingState}
                              onValueChange={(val) => handleInputChange('billingState', val)}
                            >
                              <SelectTrigger className="w-full rounded-xl border-border bg-background h-11 text-sm shadow-sm font-medium">
                                <SelectValue placeholder="Select State" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-border shadow-lg max-h-72">
                                {INDIAN_GST_STATES.map((s) => (
                                  <SelectItem key={s.code} value={s.name} className="cursor-pointer">
                                    <span className="font-mono text-xs text-blue-600 mr-2">[{s.code}]</span>
                                    {s.name} ({s.short})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              id="billingState"
                              placeholder="e.g. California, Ontario"
                              value={formData.billingState}
                              onChange={(e) => handleInputChange('billingState', e.target.value)}
                              className="rounded-xl border-border bg-background h-11 text-sm shadow-sm"
                            />
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="billingZipCode" className="text-sm font-semibold text-foreground">
                            Postal / Zip Code
                          </Label>
                          <Input
                            id="billingZipCode"
                            placeholder="e.g. 400001, 10001"
                            value={formData.billingZipCode}
                            onChange={(e) => handleInputChange('billingZipCode', e.target.value)}
                            className="rounded-xl border-border bg-background h-11 text-sm shadow-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="billingCountry" className="text-sm font-semibold text-foreground">
                            Billing Country
                          </Label>
                          <CountrySelect
                            value={formData.billingCountry}
                            onValueChange={(val) => handleInputChange('billingCountry', val)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Editable Shipping Address Section when unchecked */}
                {!formData.sameAsBillingAddress && (
                  <div className="p-5 rounded-2xl border border-blue-500/20 bg-blue-500/5 dark:bg-blue-950/10 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="size-4 text-blue-600" />
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                          Shipping Address
                        </h4>
                      </div>
                      <span className="text-xs text-muted-foreground">Custom shipping destination</span>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="shippingStreet" className="text-sm font-semibold text-foreground">
                          Shipping Street Address
                        </Label>
                        <Input
                          id="shippingStreet"
                          placeholder="Enter shipping street address"
                          value={formData.shippingStreet}
                          onChange={(e) => handleInputChange('shippingStreet', e.target.value)}
                          className="rounded-xl border-border bg-background h-11 text-sm shadow-sm"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="shippingCity" className="text-sm font-semibold text-foreground">City</Label>
                          <Input
                            id="shippingCity"
                            placeholder="e.g. Delhi, London"
                            value={formData.shippingCity}
                            onChange={(e) => handleInputChange('shippingCity', e.target.value)}
                            className="rounded-xl border-border bg-background h-11 text-sm shadow-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="shippingState" className="text-sm font-semibold text-foreground">
                            State / Province
                          </Label>
                          {(formData.shippingCountry.toUpperCase() === 'INDIA' || formData.shippingCountry.toUpperCase() === 'IN') ? (
                            <Select
                              value={formData.shippingState}
                              onValueChange={(val) => handleInputChange('shippingState', val)}
                            >
                              <SelectTrigger className="w-full rounded-xl border-border bg-background h-11 text-sm shadow-sm font-medium">
                                <SelectValue placeholder="Select State" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-border shadow-lg max-h-72">
                                {INDIAN_GST_STATES.map((s) => (
                                  <SelectItem key={s.code} value={s.name} className="cursor-pointer">
                                    <span className="font-mono text-xs text-blue-600 mr-2">[{s.code}]</span>
                                    {s.name} ({s.short})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              id="shippingState"
                              placeholder="e.g. Victoria, Dubai"
                              value={formData.shippingState}
                              onChange={(e) => handleInputChange('shippingState', e.target.value)}
                              className="rounded-xl border-border bg-background h-11 text-sm shadow-sm"
                            />
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="shippingZipCode" className="text-sm font-semibold text-foreground">
                            Postal / Zip Code
                          </Label>
                          <Input
                            id="shippingZipCode"
                            placeholder="e.g. 110001, SW1A 1AA"
                            value={formData.shippingZipCode}
                            onChange={(e) => handleInputChange('shippingZipCode', e.target.value)}
                            className="rounded-xl border-border bg-background h-11 text-sm shadow-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="shippingCountry" className="text-sm font-semibold text-foreground">
                            Shipping Country
                          </Label>
                          <CountrySelect
                            value={formData.shippingCountry}
                            onValueChange={(val) => handleInputChange('shippingCountry', val)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Config-Driven Dynamic Bank Accounts */}
              <DynamicBankAccountsSection
                country={formData.country}
                currency={formData.currency}
                accounts={bankAccounts}
                onChange={setBankAccounts}
                onDraftChange={setDraftAccount}
              />

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/dashboard/${businessId}/customers`)}
                  className="rounded-xl border-border px-6 h-11 text-sm cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.company}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 h-11 gap-2 shadow-sm cursor-pointer"
                >
                  <SaveIcon className="size-4" />
                  {isSubmitting ? (convertingLead ? 'Converting...' : 'Creating...') : saveStatus === 'saved' ? 'Saved!' : convertingLead ? 'Convert Lead to Customer' : 'Create Customer'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Warning Modal when Country Changes */}
      <Dialog open={showCountryChangeModal} onOpenChange={setShowCountryChangeModal}>
        <DialogContent className="rounded-2xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangleIcon className="size-5" />
              Country Change Warning
            </DialogTitle>
            <DialogDescription asChild className="text-sm text-muted-foreground pt-2">
              <div>
                Changing country from <strong>{formData.country}</strong> to <strong>{pendingCountryChange}</strong> will:
                <ul className="list-disc pl-5 mt-2 space-y-1 text-xs text-foreground">
                  <li>Reset statutory tax ID ({bankConfig.taxLabel}) as validation rules differ.</li>
                  <li>Clear entered bank accounts to match {pendingCountryChange}&apos;s settlement format.</li>
                  <li>Update state and Place of Supply options.</li>
                </ul>
                <p className="mt-2">Do you want to proceed?</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setShowCountryChangeModal(false); setPendingCountryChange(null); }}
              className="rounded-xl border-border cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => pendingCountryChange && applyCountryChange(pendingCountryChange)}
              className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold cursor-pointer"
            >
              Proceed & Reset Formats
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
