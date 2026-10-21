import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { COUNTRY_DIAL_CODES, CountryDialCode } from '@/lib/country-codes';
import { validatePhoneNumberLength } from 'libphonenumber-js';
import { cn } from '@/lib/utils';

export interface PhoneInputProps {
  value?: string;
  onChange: (value: string) => void;
  defaultCountry?: string;
  id?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  onValidChange?: (isValid: boolean) => void;
}

// Sort with longest dialCode first (e.g. +1868 before +1, +971 before +9)
const SORTED_COUNTRIES: CountryDialCode[] = [...COUNTRY_DIAL_CODES].sort(
  (a, b) => b.dialCode.length - a.dialCode.length
);

function resolveCountryCode(countryNameOrCode?: string): string {
  if (!countryNameOrCode) return 'IN';
  const clean = countryNameOrCode.trim().toLowerCase();
  const match = COUNTRY_DIAL_CODES.find(
    c => c.country.toLowerCase() === clean || c.code.toLowerCase() === clean
  );
  return match ? match.code : 'IN';
}

function checkPhoneValidity(digits: string, countryCode: string, maxLength: number): { isValid: boolean; message?: string } {
  if (!digits) return { isValid: true };
  try {
    const res = validatePhoneNumberLength(digits, countryCode as any);
    if (res === undefined) {
      return { isValid: true };
    }
    if (res === 'TOO_SHORT') {
      return { isValid: false, message: `Phone number is too short (${digits.length}/${maxLength} digits)` };
    }
    if (res === 'TOO_LONG') {
      return { isValid: false, message: `Phone number is too long (max ${maxLength} digits)` };
    }
  } catch {
    // fallback
  }

  if (maxLength && digits.length !== maxLength) {
    return { isValid: false, message: `Expected ${maxLength} digits (${digits.length}/${maxLength})` };
  }
  return { isValid: true };
}

export function PhoneInput({
  value = '',
  onChange,
  defaultCountry,
  id,
  className,
  required,
  disabled,
  placeholder,
  onValidChange
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<string>(() => resolveCountryCode(defaultCountry));
  const [number, setNumber] = useState<string>('');
  const [open, setOpen] = useState(false);
  const userInteractedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!value || !value.trim()) {
      setNumber('');
      return;
    }

    const trimmedVal = value.trim();

    // Only detect dial code if value explicitly starts with '+'
    if (trimmedVal.startsWith('+')) {
      for (const country of SORTED_COUNTRIES) {
        if (trimmedVal.startsWith(country.dialCode)) {
          setSelectedCountry(country.code);
          const remainder = trimmedVal.substring(country.dialCode.length).trim().replace(/\D/g, '');
          setNumber(remainder);
          return;
        }
      }
    }

    // Otherwise, do NOT guess country from raw digits (avoids +91 vs +62 conflict).
    // Just keep current/default country and use raw digits as the number.
    const cleanDigits = trimmedVal.replace(/\D/g, '');
    setNumber(cleanDigits);
  }, [value]);

  const currentCountry = COUNTRY_DIAL_CODES.find(c => c.code === selectedCountry) || 
    COUNTRY_DIAL_CODES.find(c => c.code === 'IN') || 
    COUNTRY_DIAL_CODES[0];

  const validation = checkPhoneValidity(number, currentCountry.code, currentCountry.maxLength || 10);

  useEffect(() => {
    if (onValidChange) {
      onValidChange(validation.isValid);
    }
  }, [validation.isValid, onValidChange]);

  const handleCountrySelect = (newCode: string) => {
    userInteractedRef.current = true;
    setSelectedCountry(newCode);
    setOpen(false);
    const country = COUNTRY_DIAL_CODES.find(c => c.code === newCode);
    if (country) {
      if (number.trim()) {
        onChange(`${country.dialCode} ${number.trim()}`);
      } else {
        onChange(`${country.dialCode} `);
      }
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    userInteractedRef.current = true;
    const digits = e.target.value.replace(/\D/g, '');
    setNumber(digits);
    const country = COUNTRY_DIAL_CODES.find(c => c.code === selectedCountry) || COUNTRY_DIAL_CODES[0];
    if (digits.trim()) {
      onChange(`${country.dialCode} ${digits.trim()}`);
    } else {
      onChange('');
    }
  };

  return (
    <div className="space-y-1 w-full">
      <div className="flex w-full shadow-sm rounded-xl overflow-hidden border border-input bg-card focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className="h-10 px-3 rounded-none border-0 border-r border-input bg-muted/40 hover:bg-muted/80 text-foreground font-normal flex items-center gap-1.5 shrink-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              <span className="text-base leading-none mr-1">{currentCountry.flag}</span>
              <span className="text-xs font-semibold text-foreground">{currentCountry.dialCode}</span>
              <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 ml-0.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0 z-50 rounded-xl shadow-xl" align="start">
            <Command
              filter={(itemValue, search) => {
                const q = search.toLowerCase().trim().replace(/^\+/, '');
                const target = itemValue.toLowerCase();
                if (target.includes(q)) return 1;
                return 0;
              }}
            >
              <CommandInput placeholder="Search country or dial code..." className="h-10 text-sm" />
              <CommandList className="max-h-[260px] overflow-y-auto p-1 custom-scrollbar">
                <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                  No country found.
                </CommandEmpty>
                <CommandGroup>
                  {COUNTRY_DIAL_CODES.map((c) => (
                    <CommandItem
                      key={c.code}
                      value={`${c.country} ${c.code} ${c.dialCode}`}
                      onSelect={() => handleCountrySelect(c.code)}
                      className="flex items-center justify-between cursor-pointer px-3 py-2 rounded-lg text-sm hover:bg-muted/80 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base leading-none">{c.flag}</span>
                        <span className="text-xs font-medium text-foreground truncate">{c.country}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono text-muted-foreground font-semibold">{c.dialCode}</span>
                        <Check
                          className={cn(
                            "h-4 w-4 text-blue-600",
                            selectedCountry === c.code ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        
        <Input
          id={id}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          value={number}
          onChange={handleNumberChange}
          placeholder={placeholder || `Enter ${currentCountry.maxLength || 10} digits`}
          disabled={disabled}
          className={`border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none flex-1 h-10 text-foreground text-sm placeholder:text-muted-foreground bg-transparent px-3 ${className || ''}`}
          required={required}
          maxLength={currentCountry.maxLength || 15}
        />
      </div>
      {number && !validation.isValid && (
        <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
          <span>•</span> {validation.message}
        </p>
      )}
    </div>
  );
}
