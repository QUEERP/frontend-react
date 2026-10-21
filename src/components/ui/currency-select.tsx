import React, { useState, useEffect, useMemo } from 'react'
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react'
import { CURRENCIES, Currency } from '@/lib/currencies'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface CurrencySelectProps {
  value: string; // currency code
  onChange: (value: string, currency: Currency) => void;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
}

let cachedMasterCurrencies: Currency[] | null = null;
let masterCurrenciesPromise: Promise<Currency[]> | null = null;

async function fetchMasterCurrencies(): Promise<Currency[]> {
  if (cachedMasterCurrencies) return cachedMasterCurrencies;
  if (masterCurrenciesPromise) return masterCurrenciesPromise;

  masterCurrenciesPromise = (async () => {
    try {
      const API_BASE = (import.meta.env.VITE_API_BASE || '').trim();
      const API_ROOT = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;
      const token = typeof document !== 'undefined'
        ? (document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] ||
           document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1] || '')
        : '';

      const res = await fetch(`${API_ROOT}/currency/master`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const map = new Map<string, Currency>();
          CURRENCIES.forEach(c => map.set(c.code.toUpperCase(), c));

          const masterList: Currency[] = json.data.map((item: any) => {
            const code = (item.code || '').toUpperCase();
            const meta = map.get(code);
            return {
              code,
              name: item.name || meta?.name || code,
              symbol: item.symbol || meta?.symbol || code,
              flag: meta?.flag || '🌐'
            };
          });

          cachedMasterCurrencies = masterList;
          return masterList;
        }
      }
    } catch (err) {
      console.warn('Failed to load master currencies, using default supported list:', err);
    }

    cachedMasterCurrencies = CURRENCIES;
    return CURRENCIES;
  })();

  return masterCurrenciesPromise;
}

export function CurrencySelect({ value, onChange, disabled, className, compact }: CurrencySelectProps) {
  const [open, setOpen] = useState(false)
  const [currencies, setCurrencies] = useState<Currency[]>(cachedMasterCurrencies || CURRENCIES)

  useEffect(() => {
    fetchMasterCurrencies().then(setCurrencies);
  }, [])

  const selectedCurrency = useMemo(() => {
    if (!value) return null;
    const upper = value.trim().toUpperCase();
    return currencies.find((c) => c.code.toUpperCase() === upper) ||
           CURRENCIES.find((c) => c.code.toUpperCase() === upper) ||
           { code: upper, name: upper, symbol: upper, flag: '🌐' };
  }, [value, currencies])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between h-10 rounded-xl border-slate-200 shadow-sm hover:bg-slate-50 font-normal min-w-0 overflow-hidden", className)}
        >
          {selectedCurrency ? (
            <span className="truncate text-left flex-1 min-w-0 text-xs sm:text-sm">
              {compact
                ? `${selectedCurrency.flag} ${selectedCurrency.code} (${selectedCurrency.symbol})`
                : `${selectedCurrency.flag} ${selectedCurrency.code} (${selectedCurrency.symbol}) - ${selectedCurrency.name}`}
            </span>
          ) : (
            <span className="text-slate-400 font-normal truncate text-xs sm:text-sm">Select currency...</span>
          )}
          <ChevronsUpDownIcon className="ml-1.5 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0 rounded-xl border-slate-200 shadow-lg z-[100]" align="start">
        <Command>
          <CommandInput placeholder="Search currency by code, name, or symbol..." />
          <CommandEmpty>No currency found.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-auto custom-scrollbar p-1">
            {currencies.map((currency) => (
              <CommandItem
                key={currency.code}
                value={`${currency.code} ${currency.name} ${currency.symbol}`}
                onSelect={() => {
                  onChange(currency.code, currency)
                  setOpen(false)
                }}
                className="cursor-pointer rounded-lg py-2"
              >
                <CheckIcon
                  className={cn(
                    "mr-2 h-4 w-4 text-blue-600",
                    value === currency.code ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="font-medium text-slate-800">{currency.flag} {currency.code} ({currency.symbol})</span>
                <span className="ml-2 text-slate-500 truncate">- {currency.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
