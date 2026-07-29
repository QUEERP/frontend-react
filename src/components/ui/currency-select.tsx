import React, { useState } from 'react'
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
}

export function CurrencySelect({ value, onChange, disabled, className }: CurrencySelectProps) {
  const [open, setOpen] = useState(false)

  const selectedCurrency = CURRENCIES.find((c) => c.code === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between h-10 rounded-xl border-slate-200 shadow-sm hover:bg-slate-50 font-normal", className)}
        >
          {selectedCurrency
            ? `${selectedCurrency.flag} ${selectedCurrency.code} (${selectedCurrency.symbol}) - ${selectedCurrency.name}`
            : "Select currency..."}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0 rounded-xl border-slate-200 shadow-lg z-[100]" align="start">
        <Command>
          <CommandInput placeholder="Search currency by code, name, or symbol..." />
          <CommandEmpty>No currency found.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-auto custom-scrollbar p-1">
            {CURRENCIES.map((currency) => (
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
