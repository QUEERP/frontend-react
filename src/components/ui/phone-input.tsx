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
  containerClassName?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  onValidChange?: (isValid: boolean) => void;
}

// Sort with longest dialCode first (e.g. +1868 before +1, +971 before +9)
const SORTED_COUNTRIES: CountryDialCode[] = [...COUNTRY_DIAL_CODES].sort(
  (a, b) => b.dialCode.length - a.dialCode.length
);

const COUNTRY_ALIASES: Record<string, string> = {
  uae: 'AE',
  'united arab emirates': 'AE',
  ae: 'AE',
  usa: 'US',
  'united states': 'US',
  'united states of america': 'US',
  us: 'US',
  uk: 'GB',
  'united kingdom': 'GB',
  gb: 'GB',
  in: 'IN',
  india: 'IN',
};

function resolveCountryCode(countryNameOrCode?: string): string {
  if (!countryNameOrCode) return 'IN';
  const clean = countryNameOrCode.trim().toLowerCase();
  if (COUNTRY_ALIASES[clean]) {
    return COUNTRY_ALIASES[clean];
  }
  const match = COUNTRY_DIAL_CODES.find(
    c => c.country.toLowerCase() === clean || c.code.toLowerCase() === clean
  );
  return match ? match.code : 'IN';
}

function checkPhoneValidity(digits: string, countryCode: string, maxLength: number): { isValid: boolean; message?: string } {
  if (!digits) return { isValid: true };

  if (digits.length < maxLength) {
    return {
      isValid: false,
      message: `Phone number is too short (${digits.length}/${maxLength} digits)`,
    };
  }

  if (digits.length > maxLength) {
    return {
      isValid: false,
      message: `Phone number exceeds max length (${digits.length}/${maxLength} digits)`,
    };
  }

  try {
    const res = validatePhoneNumberLength(digits, countryCode as any);
    if (res === 'TOO_SHORT') {
      return { isValid: false, message: `Phone number is too short (${digits.length}/${maxLength} digits)` };
    }
    if (res === 'TOO_LONG') {
      return { isValid: false, message: `Phone number is too long (${digits.length}/${maxLength} digits)` };
    }
  } catch {
    // fallback to maxLength check above
  }

  return { isValid: true };
}

export function PhoneInput({
  value = '',
  onChange,
  defaultCountry,
  id,
  className,
  containerClassName,
  required,
  disabled,
  placeholder,
  onValidChange,
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<string>(() => resolveCountryCode(defaultCountry));
  const [number, setNumber] = useState<string>('');
  const [open, setOpen] = useState(false);
  const userInteractedRef = useRef<boolean>(false);

  // Sync defaultCountry if changed and user has not manually picked a country
  useEffect(() => {
    if (!userInteractedRef.current && defaultCountry && (!value || !value.trim().startsWith('+'))) {
      setSelectedCountry(resolveCountryCode(defaultCountry));
    }
  }, [defaultCountry]);

  // Sync incoming value
  useEffect(() => {
    if (!value || !value.trim()) {
      setNumber('');
      return;
    }

    const trimmedVal = value.trim();

    // If value explicitly starts with '+', detect the country dial code
    if (trimmedVal.startsWith('+')) {
      for (const country of SORTED_COUNTRIES) {
        if (trimmedVal.startsWith(country.dialCode)) {
          setSelectedCountry(country.code);
          const remainder = trimmedVal.substring(country.dialCode.length).trim().replace(/\D/g, '');
          const maxDigits = country.maxLength || 15;
          const capped = remainder.slice(0, maxDigits);
          if (capped !== number) {
            setNumber(capped);
          }
          return;
        }
      }
    }

    // Otherwise use digits with current selected country
    const cleanDigits = trimmedVal.replace(/\D/g, '');
    const current = COUNTRY_DIAL_CODES.find(c => c.code === selectedCountry) || COUNTRY_DIAL_CODES[0];
    const maxDigits = current.maxLength || 15;
    const capped = cleanDigits.slice(0, maxDigits);
    if (capped !== number) {
      setNumber(capped);
    }
  }, [value, selectedCountry]);

  const currentCountry =
    COUNTRY_DIAL_CODES.find(c => c.code === selectedCountry) ||
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
      const maxDigits = country.maxLength || 15;
      // Immediately enforce new country digit limit on any typed number
      const trimmedNumber = number.slice(0, maxDigits);
      setNumber(trimmedNumber);
      if (trimmedNumber.trim()) {
        onChange(`${country.dialCode} ${trimmedNumber.trim()}`);
      } else {
        onChange('');
      }
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    userInteractedRef.current = true;
    const raw = e.target.value;

    // Handle pasting a full international number with +dialCode
    if (raw.trim().startsWith('+')) {
      const clean = raw.trim();
      for (const country of SORTED_COUNTRIES) {
        if (clean.startsWith(country.dialCode)) {
          setSelectedCountry(country.code);
          const remainder = clean.substring(country.dialCode.length).trim().replace(/\D/g, '');
          const maxDigits = country.maxLength || 15;
          const capped = remainder.slice(0, maxDigits);
          setNumber(capped);
          onChange(capped ? `${country.dialCode} ${capped}` : '');
          return;
        }
      }
    }

    // Strip non-digits and cap strictly at country's maxLength (e.g. 10 for India)
    const digits = raw.replace(/\D/g, '');
    const maxDigits = currentCountry.maxLength || 15;
    const capped = digits.slice(0, maxDigits);
    setNumber(capped);

    if (capped.trim()) {
      onChange(`${currentCountry.dialCode} ${capped.trim()}`);
    } else {
      onChange('');
    }
  };

  return (
    <div className="space-y-1 w-full">
      <div
        className={cn(
          "flex items-center w-full shadow-sm rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all",
          number && !validation.isValid ? "border-amber-400 dark:border-amber-600 focus-within:ring-amber-500" : "",
          containerClassName
        )}
      >
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className="h-10 px-3 rounded-none border-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50/80 hover:bg-gray-100 dark:bg-gray-800/80 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 font-normal flex items-center gap-1.5 shrink-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              title={`${currentCountry.country} (${currentCountry.dialCode}) - Limit: ${currentCountry.maxLength || 10} digits`}
            >
              <span className="text-base leading-none mr-1">{currentCountry.flag}</span>
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{currentCountry.dialCode}</span>
              <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 ml-0.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-0 z-50 rounded-xl shadow-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800" align="start">
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
                      onClick={() => handleCountrySelect(c.code)}
                      className="flex items-center justify-between cursor-pointer px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base leading-none">{c.flag}</span>
                        <span className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{c.country}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-gray-400 font-mono">({c.maxLength || 10} digits)</span>
                        <span className="text-xs font-mono text-gray-600 dark:text-gray-300 font-semibold">{c.dialCode}</span>
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
          className={`border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none flex-1 h-10 text-gray-900 dark:text-gray-100 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 bg-transparent px-3 ${className || ''}`}
          required={required}
          minLength={required ? (currentCountry.maxLength || 10) : undefined}
          maxLength={currentCountry.maxLength || 15}
        />

        {number.length > 0 && (
          <div className="flex items-center pr-3 shrink-0">
            <span
              className={cn(
                "text-[11px] font-mono font-medium px-2 py-0.5 rounded select-none flex items-center gap-1",
                number.length === (currentCountry.maxLength || 10)
                  ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800"
                  : "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800"
              )}
            >
              {number.length === (currentCountry.maxLength || 10) && (
                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              )}
              {number.length}/{currentCountry.maxLength || 10}
            </span>
          </div>
        )}
      </div>

      {number && !validation.isValid && (
        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
          <span>•</span> {validation.message}
        </p>
      )}
    </div>
  );
}
