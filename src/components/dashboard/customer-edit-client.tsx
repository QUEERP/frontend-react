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
import { SaveIcon, ArrowLeftIcon, TrashIcon, GlobeIcon, HashIcon, PhoneIcon, MapPinIcon, AlertTriangleIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  getBankConfigForCountry, 
  INDIAN_GST_STATES, 
  CountryBankConfig 
} from '@/lib/bank-configs';
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

  useEffect(() => {
    if (customer) {
      const resolvedCountry = customer.country || customer.region || 'INDIA';
      setForm({
        company: customer.company || '',
        country: resolvedCountry,
        region: resolvedCountry,
        vatNumber: customer.vatNumber || '',
        phone: customer.phone || '',
        website: customer.website || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        zipCode: customer.zipCode || '',
        billingStreet: customer.billingStreet || customer.address || '',
        billingCity: customer.billingCity || customer.city || '',
        billingState: customer.billingState || customer.state || '',
        billingZipCode: customer.billingZipCode || customer.zipCode || '',
        billingCountry: resolvedCountry,
        shippingStreet: customer.shippingStreet || customer.address || '',
        shippingCity: customer.shippingCity || customer.city || '',
        shippingState: customer.shippingState || customer.state || '',
        shippingZipCode: customer.shippingZipCode || customer.zipCode || '',
        shippingCountry: resolvedCountry,
        currency: customer.currency || 'INR',
        industry: customer.industry || '',
        annualRevenue: customer.annualRevenue !== undefined && customer.annualRevenue !== null ? String(customer.annualRevenue) : '',
        employeeCount: customer.employeeCount !== undefined && customer.employeeCount !== null ? String(customer.employeeCount) : '',
        linkedinUrl: customer.linkedinUrl || '',
        tags: Array.isArray(customer.tags) ? customer.tags.join(', ') : '',
        sameAsMainAddress: customer.billingStreet === customer.address,
        sameAsBillingAddress: customer.shippingStreet === customer.billingStreet,
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
      (form.country === 'INDIA' && form.state)
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
    setForm(prev => {
      const defaultState = newCountry === 'INDIA' ? 'Gujarat' : '';
      return {
        ...prev,
        country: newCountry,
        region: newCountry,
        currency: config.currency,
        phone: prev.phone ? `${config.phoneCode} ${prev.phone.replace(/^\+\d+\s*/, '')}` : '',
        state: defaultState,
        billingState: prev.sameAsMainAddress ? defaultState : prev.billingState,
        shippingState: prev.sameAsBillingAddress ? defaultState : prev.shippingState,
        billingCountry: newCountry,
        shippingCountry: newCountry,
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

    setSaving(true);
    try {
      const token = getCookie('token');
      const res = await fetch(`${API_BASE}/api/customers/${encodeURIComponent(customerId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId,
        },
        body: JSON.stringify({
          company: form.company,
          country: form.country,
          region: form.country,
          currency: form.currency,
          vatNumber: form.vatNumber || undefined,
          phone: form.phone || undefined,
          website: form.website || undefined,
          address: form.address || undefined,
          city: form.city || undefined,
          state: form.state || undefined,
          zipCode: form.zipCode || undefined,
          billingStreet: form.billingStreet || undefined,
          billingCity: form.billingCity || undefined,
          billingState: form.billingState || undefined,
          billingZipCode: form.billingZipCode || undefined,
          billingCountry: form.country,
          shippingStreet: form.shippingStreet || undefined,
          shippingCity: form.shippingCity || undefined,
          shippingState: form.shippingState || undefined,
          shippingZipCode: form.shippingZipCode || undefined,
          shippingCountry: form.country,
          annualRevenue: form.annualRevenue ? parseFloat(form.annualRevenue) : null,
          employeeCount: form.employeeCount ? parseInt(form.employeeCount) : null,
          tags: form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
          bankAccounts: bankAccounts.map(acc => ({
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
                  <Select value={form.country} onValueChange={handleCountrySelection}>
                    <SelectTrigger className="w-full rounded-xl border-border bg-background h-11 text-sm shadow-sm font-medium">
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border shadow-lg">
                      <SelectItem value="INDIA" className="cursor-pointer">🇮🇳 India (GSTIN, INR)</SelectItem>
                      <SelectItem value="UAE" className="cursor-pointer">🇦🇪 United Arab Emirates (TRN, AED)</SelectItem>
                      <SelectItem value="USA" className="cursor-pointer">🇺🇸 United States (EIN, USD)</SelectItem>
                      <SelectItem value="UK" className="cursor-pointer">🇬🇧 United Kingdom (VAT, GBP)</SelectItem>
                      <SelectItem value="CANADA" className="cursor-pointer">🇨🇦 Canada (BN, CAD)</SelectItem>
                      <SelectItem value="AUSTRALIA" className="cursor-pointer">🇦🇺 Australia (ABN, AUD)</SelectItem>
                      <SelectItem value="EU" className="cursor-pointer">🇪🇺 European Union (VAT, EUR)</SelectItem>
                      <SelectItem value="OTHER" className="cursor-pointer">🌐 Other / International</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-sm font-semibold text-foreground">Settlement Currency</Label>
                  <Input
                    id="currency"
                    value={form.currency}
                    onChange={(e) => handleChange('currency', e.target.value.toUpperCase())}
                    className="rounded-xl border-border bg-background h-11 text-sm shadow-sm uppercase font-mono"
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
                  <Label htmlFor="phone" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <PhoneIcon className="size-3.5 text-blue-600" />
                    Phone ({bankConfig.phoneCode})
                  </Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="rounded-xl border-border bg-background h-11 text-sm shadow-sm"
                  />
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
                      State {form.country === 'INDIA' && <span className="text-destructive">* (Statutory GST Code)</span>}
                    </Label>
                    {form.country === 'INDIA' ? (
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
              </div>
            </div>

            {/* 3. Config-Driven Dynamic Bank Accounts */}
            <DynamicBankAccountsSection
              country={form.country}
              currency={form.currency}
              accounts={bankAccounts}
              onChange={setBankAccounts}
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
            <DialogDescription className="text-sm text-muted-foreground pt-2">
              Changing country from <strong>{form.country}</strong> to <strong>{pendingCountryChange}</strong> will:
              <ul className="list-disc pl-5 mt-2 space-y-1 text-xs text-foreground">
                <li>Reset statutory tax ID ({bankConfig.taxLabel}) as validation rules differ.</li>
                <li>Clear entered bank accounts to match {pendingCountryChange}&apos;s settlement format.</li>
                <li>Update state and Place of Supply options.</li>
              </ul>
              Do you want to proceed?
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
