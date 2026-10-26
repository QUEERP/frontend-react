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
  placeholder?: string
}

let cachedMasterCurrencies: Currency[] | null = null;
let masterCurrenciesPromise: Promise<Currency[]> | null = null;

const normalizeText = (text: string) =>
  (text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

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
          // Index all 155 standard currencies
          CURRENCIES.forEach(c => map.set(c.code.toUpperCase(), c));

          // Merge any custom properties from DB
          json.data.forEach((item: any) => {
            const code = (item.code || '').toUpperCase();
            if (code) {
              const meta = map.get(code);
              map.set(code, {
                code,
                name: item.name || meta?.name || code,
                symbol: item.symbol || meta?.symbol || code,
                flag: meta?.flag || '🌐'
              });
            }
          });

          const masterList = Array.from(map.values());
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
  placeholder = "Select currency...",
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
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground font-normal hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-blue-500",
            className
          )}
        >
          {selectedCurrency ? (
            <span className="truncate font-medium text-foreground">
              {selectedCurrency.code} - {selectedCurrency.name} ({selectedCurrency.symbol})
            </span>
          ) : (
            <span className="text-muted-foreground font-normal">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[320px] p-0 z-50" align="start">
        <Command 
          filter={(itemValue, search) => {
            if (normalizeText(itemValue).includes(normalizeText(search))) return 1;
            return 0;
          }}
        >
          <CommandInput 
            placeholder="Search currency code or name..." 
            className="h-10 text-sm"
          />
          <CommandList className="max-h-[260px] overflow-y-auto p-1">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              No currency found.
            </CommandEmpty>
            <CommandGroup>
              {currencies.map((currency) => {
                const isSelected = value?.toUpperCase() === currency.code.toUpperCase();
                return (
                  <CommandItem
                    key={currency.code}
                    value={`${currency.code} ${currency.name} ${currency.symbol}`}
                    onSelect={() => {
                      onValueChange(currency.code)
                      setOpen(false)
                    }}
                    className="flex items-center justify-between cursor-pointer px-3 py-2 rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-semibold text-foreground">{currency.code}</span>
                      <span className="text-muted-foreground text-xs truncate">- {currency.name}</span>
                    </div>
                    <div className="flex items-center shrink-0 ml-2">
                      <span className="text-muted-foreground mr-3 text-sm font-mono">{currency.symbol}</span>
                      <Check
                        className={cn(
                          "h-4 w-4 text-blue-600",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
