import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
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
import { CURRENCIES, getCurrencySymbol } from "@/lib/currencies"

interface CurrencySelectProps {
  value?: string
  onValueChange: (value: string) => void
  disabled?: boolean
  className?: string
}

export function CurrencySelect({
  value,
  onValueChange,
  disabled = false,
  className,
}: CurrencySelectProps) {
  const [open, setOpen] = React.useState(false)

  const selectedCurrency = React.useMemo(() => 
    CURRENCIES.find((c) => c.code === value),
  [value])

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
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput 
              placeholder="Search currency code or name..." 
              className="h-10 border-0 bg-background py-3 text-sm outline-none placeholder:text-muted-foreground w-full"
            />
          </div>
          <CommandEmpty>No currency found.</CommandEmpty>
          <CommandList className="max-h-[250px] overflow-y-auto">
            <CommandGroup>
              {CURRENCIES.map((currency) => (
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
