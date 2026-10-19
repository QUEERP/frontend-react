import React, { useState, useEffect, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { COUNTRY_DIAL_CODES, CountryDialCode } from '@/lib/country-codes';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  defaultCountry?: string;
  id?: string;
  className?: string;
  required?: boolean;
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

export function PhoneInput({ value, onChange, defaultCountry, id, className, required }: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<string>(() => resolveCountryCode(defaultCountry));
  const [number, setNumber] = useState<string>('');
  const userInteractedRef = useRef<boolean>(false);

  useEffect(() => {
    let parsedCode = '';
    let parsedNumber = '';
    let hasDialCode = false;

    if (value && value.trim()) {
      const trimmedVal = value.trim();

      // 1. Direct match with '+' against sorted dial codes
      if (trimmedVal.startsWith('+')) {
        for (const country of SORTED_COUNTRIES) {
          if (trimmedVal.startsWith(country.dialCode)) {
            parsedCode = country.code;
            parsedNumber = trimmedVal.substring(country.dialCode.length).trim().replace(/^[-\s]+/, '');
            hasDialCode = true;
            break;
          }
        }
      }

      // 2. Starts with dial code digits without '+' (e.g. 917945612300 or 91 7945612300)
      if (!hasDialCode) {
        const digitsOnly = trimmedVal.replace(/\D/g, '');
        for (const country of SORTED_COUNTRIES) {
          const rawDial = country.dialCode.replace('+', '');
          if (digitsOnly.startsWith(rawDial) && digitsOnly.length > rawDial.length) {
            const remainder = digitsOnly.substring(rawDial.length);
            if (remainder.length >= 7 && remainder.length <= (country.maxLength || 15)) {
              parsedCode = country.code;
              parsedNumber = remainder;
              hasDialCode = true;
              break;
            }
          }
        }
      }

      // 3. 10-digit number (e.g. 7945612300) - in India standard mobile numbers start with 6, 7, 8, 9
      if (!hasDialCode) {
        const digitsOnly = trimmedVal.replace(/\D/g, '');
        if (/^[6-9]\d{9}$/.test(digitsOnly)) {
          parsedCode = 'IN';
          parsedNumber = digitsOnly;
          hasDialCode = true;
        }
      }
    }

    if (hasDialCode) {
      setSelectedCountry(parsedCode);
      setNumber(parsedNumber);
    } else {
      // Determine fallback country code: defaultCountry first, or retain user's selection, else 'IN'
      let fallbackCode = 'IN';
      if (defaultCountry) {
        fallbackCode = resolveCountryCode(defaultCountry);
      } else if (userInteractedRef.current && selectedCountry) {
        fallbackCode = selectedCountry;
      }

      setSelectedCountry(fallbackCode);

      if (value && value.trim()) {
        const cleanVal = value.trim().replace(/^[-\s]+/, '');
        setNumber(cleanVal);
      } else {
        setNumber('');
      }
    }
  }, [value, defaultCountry]);

  const handleCountryChange = (newCode: string) => {
    userInteractedRef.current = true;
    setSelectedCountry(newCode);
    const country = COUNTRY_DIAL_CODES.find(c => c.code === newCode);
    if (country) {
      if (number.trim()) {
        onChange(`${country.dialCode} ${number.trim()}`);
      } else {
        // Retain dial code so parent captures choice
        onChange(`${country.dialCode} `);
      }
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    userInteractedRef.current = true;
    const val = e.target.value.replace(/[^\d\s\-]/g, '');
    setNumber(val);
    const country = COUNTRY_DIAL_CODES.find(c => c.code === selectedCountry) || COUNTRY_DIAL_CODES[0];
    if (val.trim()) {
      onChange(`${country.dialCode} ${val.trim()}`);
    } else {
      onChange('');
    }
  };

  const currentCountry = COUNTRY_DIAL_CODES.find(c => c.code === selectedCountry) || 
    COUNTRY_DIAL_CODES.find(c => c.code === 'IN') || 
    COUNTRY_DIAL_CODES[0];

  return (
    <div className="flex w-full shadow-sm rounded-lg">
      <Select value={selectedCountry} onValueChange={handleCountryChange}>
        <SelectTrigger className="w-auto min-w-[90px] shrink-0 border-slate-200 border-r-0 rounded-r-none focus:ring-0 focus:ring-offset-0 bg-slate-50 shadow-none hover:bg-slate-100 transition-colors">
          <div className="flex items-center gap-2">
            <img 
              src={`https://flagcdn.com/w20/${currentCountry.code.toLowerCase()}.png`} 
              alt={currentCountry.country}
              className="w-5 h-auto object-contain rounded-sm"
            />
            <span className="text-slate-700 font-medium">{currentCountry.dialCode}</span>
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-xl border-slate-200 shadow-lg max-h-[300px]">
          {COUNTRY_DIAL_CODES.map((c) => (
            <SelectItem key={c.code} value={c.code} textValue={`${c.country} ${c.dialCode}`}>
              <div className="flex items-center gap-2">
                <img 
                  src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`} 
                  alt={c.country}
                  className="w-5 h-auto object-contain rounded-sm"
                />
                <span className="text-slate-700">{c.country}</span>
                <span className="text-slate-400">{c.dialCode}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Input
        id={id}
        type="tel"
        value={number}
        onChange={handleNumberChange}
        placeholder="Phone number"
        className={`rounded-l-none border-l-slate-200 focus-visible:ring-blue-500 shadow-none flex-1 ${className || ''}`}
        required={required}
        maxLength={currentCountry.maxLength || 15}
      />
    </div>
  );
}
