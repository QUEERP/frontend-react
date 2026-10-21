import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CURRENCIES, Currency } from "@/lib/currencies"

interface CurrencySelectProps {
  value?: string
  onValueChange: (value: string) => void
  disabled?: boolean
  className?: string
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
          // Index known CURRENCIES metadata for flag & rich symbol
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

export function CurrencySelect({
  value,
  onValueChange,
  disabled = false,
  className,
}: CurrencySelectProps) {
  const [open, setOpen] = React.useState(false)
  const [currencies, setCurrencies] = React.useState<Currency[]>(cachedMasterCurrencies || CURRENCIES)

  React.useEffect(() => {
    fetchMasterCurrencies().then(setCurrencies);
  }, [])

  const selectedCurrency = React.useMemo(() => {
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
          className={cn("w-full justify-between h-11 rounded-xl bg-muted/50 hover:bg-muted/50 text-foreground", className)}
        >
          {selectedCurrency ? (
            <span className="truncate">
              {selectedCurrency.code} - {selectedCurrency.name} ({selectedCurrency.symbol})
            </span>
          ) : (
            <span className="text-slate-400 font-normal">Select currency...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command 
          filter={(itemValue, search) => {
            if (itemValue.toLowerCase().includes(search.toLowerCase())) return 1;
            return 0;
          }}
        >
          <CommandInput 
            placeholder="Search currency code or name..." 
          />
          <CommandEmpty>No currency found.</CommandEmpty>
          <CommandList className="max-h-[250px] overflow-y-auto">
            <CommandGroup>
              {currencies.map((currency) => (
                <CommandItem
                  key={currency.code}
                  value={`${currency.code} ${currency.name}`}
                  onSelect={() => {
                    onValueChange(currency.code)
                    setOpen(false)
                  }}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{currency.code} - {currency.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-muted-foreground mr-3 text-sm">{currency.symbol}</span>
                    <Check
                      className={cn(
                        "h-4 w-4 text-emerald-600",
                        value === currency.code ? "opacity-100" : "opacity-0"
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
  )
}
