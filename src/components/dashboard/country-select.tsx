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
import { COUNTRIES } from "@/lib/countries"

interface CountrySelectProps {
  value?: string
  onValueChange: (value: string) => void
  disabled?: boolean
  className?: string
  placeholder?: string
}

const normalizeText = (text: string) =>
  (text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

export function CountrySelect({
  value,
  onValueChange,
  disabled = false,
  className,
  placeholder = "Select country..."
}: CountrySelectProps) {
  const [open, setOpen] = React.useState(false)

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
          {value ? (
            <span className="truncate font-medium text-foreground">
              {value}
            </span>
          ) : (
            <span className="text-muted-foreground font-normal">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0 z-50" align="start">
        <Command
          filter={(itemValue, search) => {
            if (normalizeText(itemValue).includes(normalizeText(search))) return 1
            return 0
          }}
        >
          <CommandInput 
            placeholder="Search country..." 
            className="h-10 text-sm"
          />
          <CommandList className="max-h-[260px] overflow-y-auto p-1">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              No country found.
            </CommandEmpty>
            <CommandGroup>
              {COUNTRIES.map((country) => (
                <CommandItem
                  key={country}
                  value={country}
                  onSelect={() => {
                    onValueChange(country)
                    setOpen(false)
                  }}
                  className="flex items-center justify-between cursor-pointer px-3 py-2 rounded-lg text-sm"
                >
                  <span className="text-foreground">{country}</span>
                  <Check
                    className={cn(
                      "h-4 w-4 text-blue-600",
                      value === country ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
