import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, Trash2Icon, LandmarkIcon, CheckCircle2Icon } from 'lucide-react';
import { getBankConfigForCountry, CountryBankConfig, BankFieldDef } from '@/lib/bank-configs';

export interface BankAccountItem {
  id?: string;
  accountHolderName: string;
  bankName: string;
  accountNumber?: string;
  accountNumberMasked?: string;
  country: string;
  currency: string;
  ifsc?: string;
  iban?: string;
  swift?: string;
  routingNumber?: string;
  branchName?: string;
  upiId?: string;
  sortCode?: string;
  transitNumber?: string;
  institutionNumber?: string;
  bsb?: string;
  isPrimary?: boolean;
}

interface DynamicBankAccountsSectionProps {
  country: string;
  currency: string;
  accounts: BankAccountItem[];
  onChange: (accounts: BankAccountItem[]) => void;
  onDraftChange?: (draft: Record<string, string> | null) => void;
}

export function DynamicBankAccountsSection({
  country,
  currency,
  accounts,
  onChange,
  onDraftChange
}: DynamicBankAccountsSectionProps) {
  const bankConfig: CountryBankConfig = getBankConfigForCountry(country);
  const [isAdding, setIsAdding] = useState(accounts.length === 0);
  const [newAccount, setNewAccount] = useState<Record<string, string>>({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    iban: '',
    swift: '',
    routingNumber: '',
    branchName: '',
    upiId: '',
    sortCode: '',
    transitNumber: '',
    institutionNumber: '',
    bsb: ''
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (key: string, rawValue: string) => {
    const fieldDef = bankConfig.fields.find(f => f.key === key);
    let value = rawValue;

    if (key === 'bsb') {
      // BSB must never exceed 6 digits. Format as XXX-XXX (max 7 chars)
      const digits = value.replace(/\D/g, '').slice(0, 6);
      if (digits.length > 3) {
        value = `${digits.slice(0, 3)}-${digits.slice(3)}`;
      } else {
        value = digits;
      }
    } else if (fieldDef?.digitsOnly) {
      value = value.replace(/\D/g, '');
      if (fieldDef.maxLength) {
        value = value.slice(0, fieldDef.maxLength);
      }
    } else if (fieldDef?.maxLength) {
      value = value.slice(0, fieldDef.maxLength);
    }

    setNewAccount(prev => {
      const next = { ...prev, [key]: value };
      const hasAnyValue = Object.values(next).some(v => Boolean(v && v.trim()));
      onDraftChange?.(hasAnyValue ? next : null);
      return next;
    });
    if (fieldErrors[key]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    for (const field of bankConfig.fields) {
      const val = (newAccount[field.key] || '').trim();
      if (field.required && !val) {
        errors[field.key] = `${field.label} is required`;
        continue;
      }
      if (val && field.validator) {
        const res = field.validator(val);
        if (typeof res === 'string') {
          errors[field.key] = res;
        } else if (res === false) {
          errors[field.key] = `Invalid ${field.label}`;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const rawNum = newAccount.accountNumber || newAccount.iban || '';
    const masked = rawNum.length > 4 ? `••••••••${rawNum.slice(-4)}` : (rawNum ? `••••${rawNum}` : '••••');

    const created: BankAccountItem = {
      accountHolderName: newAccount.accountHolderName,
      bankName: newAccount.bankName,
      accountNumber: newAccount.accountNumber,
      accountNumberMasked: masked,
      country: bankConfig.countryName,
      currency: currency || bankConfig.currency,
      ifsc: newAccount.ifsc,
      iban: newAccount.iban,
      swift: newAccount.swift,
      routingNumber: newAccount.routingNumber,
      branchName: newAccount.branchName,
      upiId: newAccount.upiId,
      sortCode: newAccount.sortCode,
      transitNumber: newAccount.transitNumber,
      institutionNumber: newAccount.institutionNumber,
      bsb: newAccount.bsb,
      isPrimary: accounts.length === 0
    };

    onChange([...accounts, created]);
    setNewAccount({
      accountHolderName: '',
      bankName: '',
      accountNumber: '',
      ifsc: '',
      iban: '',
      swift: '',
      routingNumber: '',
      branchName: '',
      upiId: '',
      sortCode: '',
      transitNumber: '',
      institutionNumber: '',
      bsb: ''
    });
    setFieldErrors({});
    setIsAdding(false);
    onDraftChange?.(null);
  };

  const handleDeleteAccount = (index: number) => {
    const updated = accounts.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some(a => a.isPrimary)) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
  };

  const handleSetPrimary = (index: number) => {
    const updated = accounts.map((a, i) => ({
      ...a,
      isPrimary: i === index
    }));
    onChange(updated);
  };

  return (
    <div className="space-y-4 pt-4 border-t border-border">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <LandmarkIcon className="size-4 text-blue-600" />
            Bank Accounts & Settlement ({bankConfig.countryName})
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Config-driven for {bankConfig.countryName} with encryption and masked display.
          </p>
        </div>
        {!isAdding && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="rounded-xl border-border text-foreground hover:bg-muted gap-1 text-xs font-semibold cursor-pointer"
          >
            <PlusIcon className="size-3.5" />
            Add Account
          </Button>
        )}
      </div>

      {/* List of existing bank accounts */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {accounts.map((acc, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-all ${
                acc.isPrimary
                  ? 'border-blue-500/40 bg-blue-50/20 dark:bg-blue-950/20 shadow-sm'
                  : 'border-border bg-card'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{acc.bankName}</span>
                    {acc.isPrimary && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 text-[10px] py-0 px-1.5">
                        Primary
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{acc.accountHolderName}</p>
                </div>
                <div className="flex items-center gap-1">
                  {!acc.isPrimary && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetPrimary(idx)}
                      className="text-xs text-muted-foreground hover:text-foreground h-7 px-2 cursor-pointer"
                    >
                      Set Primary
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteAccount(idx)}
                    className="h-7 w-7 text-destructive hover:bg-destructive/10 cursor-pointer"
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="font-mono text-muted-foreground tracking-wider">
                  {acc.accountNumberMasked || (acc.iban ? `••••${acc.iban.slice(-4)}` : '••••••••')}
                </span>
                <span className="text-[11px] font-medium text-foreground">
                  {acc.ifsc || acc.swift || acc.routingNumber || acc.sortCode || acc.currency}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new bank account form */}
      {isAdding && (
        <div className="p-4 rounded-xl border border-blue-500/30 bg-muted/30 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
              New {bankConfig.countryName} Bank Account
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setFieldErrors({});
                onDraftChange?.(null);
              }}
              className="text-xs h-7 cursor-pointer text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankConfig.fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={`bank_${field.key}`} className="text-xs font-semibold text-foreground">
                  {field.label} {field.required && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id={`bank_${field.key}`}
                  placeholder={field.placeholder}
                  value={newAccount[field.key] || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  maxLength={field.key === 'bsb' ? 7 : (field.maxLength || undefined)}
                  className={`rounded-xl border-border bg-background h-10 text-sm shadow-sm ${
                    fieldErrors[field.key] ? 'border-destructive focus-visible:ring-destructive' : ''
                  }`}
                />
                {fieldErrors[field.key] && (
                  <p className="text-[11px] text-destructive">{fieldErrors[field.key]}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={handleAddAccount}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-9 px-4 cursor-pointer gap-1.5"
            >
              <CheckCircle2Icon className="size-3.5" />
              Save Account
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
