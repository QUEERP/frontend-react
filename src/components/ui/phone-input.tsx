import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { COUNTRY_DIAL_CODES } from '@/lib/country-codes';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  defaultCountry?: string;
  id?: string;
  className?: string;
  required?: boolean;
}

export function PhoneInput({ value, onChange, defaultCountry, id, className, required }: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [number, setNumber] = useState('');

  // Handle parsing initial value
  useEffect(() => {
    if (!value) {
      setNumber('');
      return;
    }
    
    let foundCode = false;
    for (const country of COUNTRY_DIAL_CODES) {
      if (value.startsWith(country.dialCode)) {
        setSelectedCountry(country.code);
        const numPart = value.substring(country.dialCode.length).trim();
        setNumber(numPart.replace(/^[-\s]+/, ''));
        foundCode = true;
        break;
      }
    }
    
    if (!foundCode) {
      setNumber(value);
    }
  }, [value]);

  // Sync with defaultCountry prop if value is empty
  useEffect(() => {
    if (defaultCountry && !value && !number) {
      const match = COUNTRY_DIAL_CODES.find(c => c.country.toLowerCase() === defaultCountry.toLowerCase());
      if (match) {
        setSelectedCountry(match.code);
      }
    }
  }, [defaultCountry, value, number]);

  const handleCountryChange = (newCode: string) => {
    setSelectedCountry(newCode);
    const country = COUNTRY_DIAL_CODES.find(c => c.code === newCode);
    if (country && number) {
      onChange(`${country.dialCode} ${number}`);
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d\s\-]/g, '');
    setNumber(val);
    const country = COUNTRY_DIAL_CODES.find(c => c.code === selectedCountry);
    if (val && country) {
      onChange(`${country.dialCode} ${val}`);
    } else {
      onChange('');
    }
  };

  const currentCountry = COUNTRY_DIAL_CODES.find(c => c.code === selectedCountry) || COUNTRY_DIAL_CODES[0];

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
