import { toast } from 'sonner';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBusinessData } from '@/components/dashboard/business-data-provider';
import { SaveIcon, ArrowLeftIcon, TrashIcon, GlobeIcon, HashIcon, PhoneIcon, MapPinIcon, AlertTriangleIcon, CopyIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CountrySelect } from '@/components/dashboard/country-select';
import { CurrencySelect } from '@/components/dashboard/currency-select';
import { 
  getBankConfigForCountry, 
  INDIAN_GST_STATES, 
  CountryBankConfig,
  getPhoneRulesForCountry,
  extractSubscriberDigits
} from '@/lib/bank-configs';
import { COUNTRY_TO_CURRENCY } from '@/lib/country_to_currency';
import { 
  DynamicBankAccountsSection, 
  BankAccountItem 
} from './DynamicBankAccountsSection';

export function CustomerEditClient({ businessId, customerId }: { businessId: string; customerId: string }) {
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();
  const { business, refresh } = useBusinessData();
  const API_BASE = import.meta.env.VITE_API_BASE || '';
  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\\^])/g, '\\$1') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : '';
  };

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [draftAccount, setDraftAccount] = useState<Record<string, string> | null>(null);

  // Fetch customer directly by ID to ensure latest bank accounts
  useEffect(() => {
    async function fetchCustomerData() {
      try {
        const token = getCookie('token');
        const res = await fetch(`${API_BASE}/api/customers/${encodeURIComponent(customerId)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-business-id': businessId,
          }
        });
        const data = await res.json();
        if (data.success && data.customer) {
          setCustomer(data.customer);
        } else {
          // Fallback to business context
          const found = (business?.customers ?? []).find((c: any) => c.id === customerId) || null;
          setCustomer(found);
        }
      } catch (err) {
        const found = (business?.customers ?? []).find((c: any) => c.id === customerId) || null;
        setCustomer(found);
      } finally {
        setLoading(false);
      }
    }
    fetchCustomerData();
  }, [customerId, businessId]);

  const [form, setForm] = useState({
    company: '',
    country: 'INDIA',
    region: 'INDIA',
    vatNumber: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    billingStreet: '',
    billingCity: '',
    billingState: '',
    billingZipCode: '',
    billingCountry: '',
    shippingStreet: '',
    shippingCity: '',
    shippingState: '',
    shippingZipCode: '',
    shippingCountry: '',
    currency: 'INR',
    industry: '',
    annualRevenue: '',
    employeeCount: '',
    linkedinUrl: '',
    tags: '',
    sameAsMainAddress: false,
    sameAsBillingAddress: false,
  });

  const [bankAccounts, setBankAccounts] = useState<BankAccountItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingCountryChange, setPendingCountryChange] = useState<string | null>(null);
  const [showCountryChangeModal, setShowCountryChangeModal] = useState(false);

  const bankConfig: CountryBankConfig = useMemo(() => {
    return getBankConfigForCountry(form.country);
  }, [form.country]);

  const phoneRules = useMemo(() => {
    return getPhoneRulesForCountry(form.country);
  }, [form.country]);

  useEffect(() => {
    if (customer) {
      const resolvedCountry = customer.country || customer.region || 'India';
      const pRules = getPhoneRulesForCountry(resolvedCountry);
      const digitsOnly = extractSubscriberDigits(customer.phone || '', pRules.phoneCode, pRules.maxDigits);

      const hasBilling = Boolean(customer.billingStreet || customer.billingCity || customer.billingState || customer.billingZipCode);
      const hasShipping = Boolean(customer.shippingStreet || customer.shippingCity || customer.shippingState || customer.shippingZipCode);

      const sameAsMain = !hasBilling || (
        customer.billingStreet === customer.address &&
        customer.billingCity === customer.city &&
        customer.billingState === customer.state &&
        (!customer.billingCountry || customer.billingCountry === resolvedCountry)
      );

      const targetBillingStreet = customer.billingStreet || customer.address || '';
      const targetBillingCity = customer.billingCity || customer.city || '';
      const targetBillingState = customer.billingState || customer.state || '';

      const sameAsBilling = !hasShipping || (
        customer.shippingStreet === targetBillingStreet &&
        customer.shippingCity === targetBillingCity &&
        customer.shippingState === targetBillingState &&
        (!customer.shippingCountry || customer.shippingCountry === (customer.billingCountry || resolvedCountry))
      );

      setForm({
        company: customer.company || '',
        country: resolvedCountry,
        region: resolvedCountry,
        vatNumber: customer.vatNumber || '',
        phone: digitsOnly,
        website: customer.website || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        zipCode: customer.zipCode || '',
        billingStreet: customer.billingStreet || customer.address || '',
        billingCity: customer.billingCity || customer.city || '',
        billingState: customer.billingState || customer.state || '',
        billingZipCode: customer.billingZipCode || customer.zipCode || '',
        billingCountry: customer.billingCountry || resolvedCountry,
        shippingStreet: customer.shippingStreet || customer.billingStreet || customer.address || '',
        shippingCity: customer.shippingCity || customer.billingCity || customer.city || '',
        shippingState: customer.shippingState || customer.billingState || customer.state || '',
        shippingZipCode: customer.shippingZipCode || customer.billingZipCode || customer.zipCode || '',
        shippingCountry: customer.shippingCountry || customer.billingCountry || resolvedCountry,
        currency: customer.currency || COUNTRY_TO_CURRENCY[resolvedCountry] || 'INR',
        industry: customer.industry || '',
        annualRevenue: customer.annualRevenue !== undefined && customer.annualRevenue !== null ? String(customer.annualRevenue) : '',
        employeeCount: customer.employeeCount !== undefined && customer.employeeCount !== null ? String(customer.employeeCount) : '',
        linkedinUrl: customer.linkedinUrl || '',
        tags: Array.isArray(customer.tags) ? customer.tags.join(', ') : '',
        sameAsMainAddress: sameAsMain,
        sameAsBillingAddress: sameAsBilling,
      });

      if (Array.isArray(customer.bankAccounts) && customer.bankAccounts.length > 0) {
        setBankAccounts(customer.bankAccounts.map((b: any) => ({
          id: b.id,
          accountHolderName: b.accountHolderName,
          bankName: b.bankName,
          accountNumberMasked: b.accountNumberMasked,
          country: b.country,
          currency: b.currency,
          ifsc: b.ifsc,
          iban: b.iban,
          swift: b.swift,
          routingNumber: b.routingNumber,
          branchName: b.branchName,
          upiId: b.upiId,
          sortCode: b.sortCode,
          transitNumber: b.transitNumber,
          institutionNumber: b.institutionNumber,
          bsb: b.bsb,
          isPrimary: b.isPrimary
        })));
      } else if (customer.bankName || customer.accountNumber) {
        // Fallback from legacy single bank fields
        setBankAccounts([{
          accountHolderName: customer.accountName || customer.company || '',
          bankName: customer.bankName || 'Primary Bank',
          accountNumber: customer.accountNumber || '',
          accountNumberMasked: customer.accountNumber ? `••••${customer.accountNumber.slice(-4)}` : '••••••••',
          country: resolvedCountry,
          currency: customer.currency || 'INR',
          iban: customer.iban || undefined,
          swift: customer.swiftCode || undefined,
          isPrimary: true
        }]);
      }
    }
  }, [customer]);

  const handleCountrySelection = (newCountry: string) => {
    if (newCountry === form.country) return;

    const hasData = Boolean(
      form.vatNumber ||
      bankAccounts.length > 0 ||
      ((form.country.toUpperCase() === 'INDIA' || form.country.toUpperCase() === 'IN') && form.state)
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

    setForm(prev => {
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
        vatNumber: ''
      };
    });
    setBankAccounts([]);
    setShowCountryChangeModal(false);
    setPendingCountryChange(null);
  };

  const handleChange = (key: string, value: any) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (prev.sameAsMainAddress && ['address', 'city', 'state', 'zipCode'].includes(key)) {
        if (key === 'address') next.billingStreet = value;
        if (key === 'city') next.billingCity = value;
        if (key === 'state') next.billingState = value;
        if (key === 'zipCode') next.billingZipCode = value;
      }
      if (prev.sameAsBillingAddress && ['billingStreet', 'billingCity', 'billingState', 'billingZipCode'].includes(key)) {
        if (key === 'billingStreet') next.shippingStreet = value;
        if (key === 'billingCity') next.shippingCity = value;
        if (key === 'billingState') next.shippingState = value;
        if (key === 'billingZipCode') next.shippingZipCode = value;
      }
      return next;
    });
  };

  const handleSameAsMainAddressChange = (checked: boolean) => {
    setForm(prev => ({
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
    setForm(prev => ({
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company) {
      uiToast({ title: 'Validation error', description: 'Company name is required', variant: 'destructive' });
      return;
    }

    if (form.country === 'INDIA' && !form.state) {
      uiToast({ title: 'Validation error', description: 'State is required for Indian customers under CBIC regulations', variant: 'destructive' });
      return;
    }

    if (form.vatNumber && bankConfig.taxValidator) {
      const taxRes = bankConfig.taxValidator(form.vatNumber);
      if (typeof taxRes === 'string') {
        uiToast({ title: 'Invalid Tax ID', description: taxRes, variant: 'destructive' });
        return;
      }
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
        accountNumber: draftAccount.accountNumber?.trim(),
        accountNumberMasked: masked,
        country: bankConfig.countryName,
        currency: form.currency || bankConfig.currency,
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

    setSaving(true);
    try {
      const token = getCookie('token') || getCookie('accessToken') || (typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('accessToken')) : '') || '';
      const res = await fetch(`${API_BASE}/api/customers/${encodeURIComponent(customerId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-business-id': businessId,
        },
        body: JSON.stringify({
          company: form.company,
          country: form.country,
          region: form.country,
          currency: form.currency,
          vatNumber: form.vatNumber || undefined,
          phone: form.phone ? `${phoneRules.phoneCode} ${form.phone}` : undefined,
          website: form.website || undefined,
          address: form.address || undefined,
          city: form.city || undefined,
          state: form.state || undefined,
          zipCode: form.zipCode || undefined,
          billingStreet: form.sameAsMainAddress ? form.address : (form.billingStreet || undefined),
          billingCity: form.sameAsMainAddress ? form.city : (form.billingCity || undefined),
          billingState: form.sameAsMainAddress ? form.state : (form.billingState || undefined),
          billingZipCode: form.sameAsMainAddress ? form.zipCode : (form.billingZipCode || undefined),
          billingCountry: form.sameAsMainAddress ? form.country : (form.billingCountry || form.country),
          shippingStreet: form.sameAsBillingAddress ? (form.sameAsMainAddress ? form.address : form.billingStreet) : (form.shippingStreet || undefined),
          shippingCity: form.sameAsBillingAddress ? (form.sameAsMainAddress ? form.city : form.billingCity) : (form.shippingCity || undefined),
          shippingState: form.sameAsBillingAddress ? (form.sameAsMainAddress ? form.state : form.billingState) : (form.shippingState || undefined),
          shippingZipCode: form.sameAsBillingAddress ? (form.sameAsMainAddress ? form.zipCode : form.billingZipCode) : (form.shippingZipCode || undefined),
          shippingCountry: form.sameAsBillingAddress ? (form.sameAsMainAddress ? form.country : form.billingCountry) : (form.shippingCountry || form.country),
          annualRevenue: form.annualRevenue ? parseFloat(form.annualRevenue) : null,
          employeeCount: form.employeeCount ? parseInt(form.employeeCount) : null,
          tags: form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
          bankAccounts: finalBankAccounts.map(acc => ({
            accountHolderName: acc.accountHolderName,
            bankName: acc.bankName,
            accountNumber: acc.accountNumber,
            country: acc.country || form.country,
            currency: acc.currency || form.currency,
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
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to update customer');
      }
      uiToast({ title: 'Customer updated', description: `${form.company} saved successfully.` });
      try {
        await refresh();
      } catch {}
      navigate(`/dashboard/${businessId}/customers/${customerId}/view`);
    } catch (err: any) {
      uiToast({ title: 'Failed to update', description: err?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = getCookie('token');
      const res = await fetch(`${API_BASE}/api/customers/${encodeURIComponent(customerId)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to delete customer');
      }
      uiToast({ title: 'Customer deleted', description: 'The customer has been removed.', variant: 'destructive' });
      try {
        await refresh();
      } catch {}
      navigate(`/dashboard/${businessId}/customers`);
    } catch (err: any) {
      uiToast({ title: 'Delete failed', description: err?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading customer profile...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-10 pt-0 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <Button variant="ghost" onClick={() => navigate(`/dashboard/${businessId}/customers`)} className="gap-2">
            <ArrowLeftIcon className="size-4" />
            Back
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Customer not found</CardTitle>
            <CardDescription>The requested customer does not exist.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-10 pt-0 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/${businessId}/customers/${customerId}/view`)} className="gap-2 cursor-pointer">
            <ArrowLeftIcon className="size-4" />
            Back to View
          </Button>
          <h1 className="text-xl font-bold text-foreground">Edit Customer: {form.company}</h1>
        </div>
        <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)} className="gap-2 cursor-pointer">
          <TrashIcon className="size-4" />
          Delete
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border border-border/80 shadow-sm bg-card rounded-2xl overflow-hidden">
          <CardHeader className="bg-muted/20 border-b border-border pb-4">
            <CardTitle className="text-base font-bold text-foreground">Customer Profile</CardTitle>
            <CardDescription className="text-xs">
              Country is the single source of truth for statutory tax rules, currency, and settlement fields.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* 1. Primary Statutory Identity */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2 flex items-center gap-2">
                <GlobeIcon className="size-4 text-blue-600" />
                Primary Statutory Identity
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-sm font-semibold text-foreground">
                    Company Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="company"
                    value={form.company}
                    onChange={(e) => handleChange('company', e.target.value)}
                    className="rounded-xl border-border bg-background h-11 text-sm shadow-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-semibold text-foreground">
                    Country (Single Source of Truth) <span className="text-destructive">*</span>
                  </Label>
                  <CountrySelect
                    value={form.country}
                    onValueChange={handleCountrySelection}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-sm font-semibold text-foreground">Settlement Currency</Label>
                  <CurrencySelect
                    value={form.currency}
                    onValueChange={(val) => handleChange('currency', val)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="vatNumber" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <HashIcon className="size-3.5 text-blue-600" />
                    {bankConfig.taxLabel} Number
                  </Label>
                  <Input
                    id="vatNumber"
                    placeholder={bankConfig.taxPlaceholder}
                    value={form.vatNumber}
                    onChange={(e) => handleChange('vatNumber', e.target.value.toUpperCase())}
                    className="rounded-xl border-border bg-background h-11 text-sm shadow-sm font-mono tracking-wide"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="phone" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <PhoneIcon className="size-3.5 text-blue-600" />
                      Phone Number
                    </Label>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {form.phone.length}/{phoneRules.maxDigits} digits
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
                      value={form.phone}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, phoneRules.maxDigits);
                        handleChange('phone', digitsOnly);
                      }}
                      maxLength={phoneRules.maxDigits}
                      className="rounded-none border-0 h-full shadow-none focus-visible:ring-0 text-sm font-mono tracking-wider w-full"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Numeric digits only. Dynamic max {phoneRules.maxDigits} digits for {form.country || 'selected country'}.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="text-sm font-semibold text-foreground">Website</Label>
                  <Input
                    id="website"
                    value={form.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    className="rounded-xl border-border bg-background h-11 text-sm shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* 2. Main Address & Place of Supply */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <MapPinIcon className="size-4 text-blue-600" />
                Place of Supply & Address ({form.country})
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-semibold text-foreground">Street Address</Label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="rounded-xl border-border bg-background h-11 text-sm shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-semibold text-foreground">City</Label>
                    <Input
                      id="city"
                      value={form.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      className="rounded-xl border-border bg-background h-11 text-sm shadow-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-sm font-semibold text-foreground">
                      State {(form.country.toUpperCase() === 'INDIA' || form.country.toUpperCase() === 'IN') && <span className="text-destructive">* (Statutory GST Code)</span>}
                    </Label>
                    {(form.country.toUpperCase() === 'INDIA' || form.country.toUpperCase() === 'IN') ? (
                      <Select value={form.state} onValueChange={(val) => handleChange('state', val)}>
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
                        value={form.state}
                        onChange={(e) => handleChange('state', e.target.value)}
                        className="rounded-xl border-border bg-background h-11 text-sm shadow-sm"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode" className="text-sm font-semibold text-foreground">Postal / Zip Code</Label>
                    <Input
                      id="zipCode"
                      value={form.zipCode}
                      onChange={(e) => handleChange('zipCode', e.target.value)}
                      className="rounded-xl border-border bg-background h-11 text-sm shadow-sm"
                    />
                  </div>
                </div>

                {/* Billing / Shipping Synchronization Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center space-x-2.5 p-3 rounded-xl border border-border bg-muted/20">
                    <Checkbox
                      id="sameAsMainAddress"
                      checked={form.sameAsMainAddress}
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
                      checked={form.sameAsBillingAddress}
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
                {!form.sameAsMainAddress && (
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
                          value={form.billingStreet}
                          onChange={(e) => handleChange('billingStreet', e.target.value)}
                          className="rounded-xl border-border bg-background h-11 text-sm shadow-sm"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="billingCity" className="text-sm font-semibold text-foreground">City</Label>
                          <Input
                            id="billingCity"
                            placeholder="e.g. Mumbai, New York"
                            value={form.billingCity}
                            onChange={(e) => handleChange('billingCity', e.target.value)}
                            className="rounded-xl border-border bg-background h-11 text-sm shadow-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="billingState" className="text-sm font-semibold text-foreground">
                            State / Province
                          </Label>
                          {(form.billingCountry.toUpperCase() === 'INDIA' || form.billingCountry.toUpperCase() === 'IN') ? (
                            <Select
                              value={form.billingState}
                              onValueChange={(val) => handleChange('billingState', val)}
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
                              value={form.billingState}
                              onChange={(e) => handleChange('billingState', e.target.value)}
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
                            value={form.billingZipCode}
                            onChange={(e) => handleChange('billingZipCode', e.target.value)}
                            className="rounded-xl border-border bg-background h-11 text-sm shadow-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="billingCountry" className="text-sm font-semibold text-foreground">
                            Billing Country
                          </Label>
                          <CountrySelect
                            value={form.billingCountry}
                            onValueChange={(val) => handleChange('billingCountry', val)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Editable Shipping Address Section when unchecked */}
                {!form.sameAsBillingAddress && (
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
                          value={form.shippingStreet}
                          onChange={(e) => handleChange('shippingStreet', e.target.value)}
                          className="rounded-xl border-border bg-background h-11 text-sm shadow-sm"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="shippingCity" className="text-sm font-semibold text-foreground">City</Label>
                          <Input
                            id="shippingCity"
                            placeholder="e.g. Delhi, London"
                            value={form.shippingCity}
                            onChange={(e) => handleChange('shippingCity', e.target.value)}
                            className="rounded-xl border-border bg-background h-11 text-sm shadow-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="shippingState" className="text-sm font-semibold text-foreground">
                            State / Province
                          </Label>
                          {(form.shippingCountry.toUpperCase() === 'INDIA' || form.shippingCountry.toUpperCase() === 'IN') ? (
                            <Select
                              value={form.shippingState}
                              onValueChange={(val) => handleChange('shippingState', val)}
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
                              value={form.shippingState}
                              onChange={(e) => handleChange('shippingState', e.target.value)}
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
                            value={form.shippingZipCode}
                            onChange={(e) => handleChange('shippingZipCode', e.target.value)}
                            className="rounded-xl border-border bg-background h-11 text-sm shadow-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="shippingCountry" className="text-sm font-semibold text-foreground">
                            Shipping Country
                          </Label>
                          <CountrySelect
                            value={form.shippingCountry}
                            onValueChange={(val) => handleChange('shippingCountry', val)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Config-Driven Dynamic Bank Accounts */}
            <DynamicBankAccountsSection
              country={form.country}
              currency={form.currency}
              accounts={bankAccounts}
              onChange={setBankAccounts}
              onDraftChange={setDraftAccount}
            />

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/dashboard/${businessId}/customers/${customerId}/view`)}
                className="rounded-xl border-border px-6 h-11 text-sm cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 h-11 gap-2 shadow-sm cursor-pointer"
              >
                <SaveIcon className="size-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

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
                Changing country from <strong>{form.country}</strong> to <strong>{pendingCountryChange}</strong> will:
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="rounded-2xl border-border bg-card">
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {form.company}? This action will archive the customer record.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-4">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} className="rounded-xl border-border cursor-pointer">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="rounded-xl cursor-pointer">
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
