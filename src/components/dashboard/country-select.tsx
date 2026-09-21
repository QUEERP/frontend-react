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
import { COUNTRIES } from "@/lib/countries"

interface CountrySelectProps {
  value?: string
  onValueChange: (value: string) => void
  disabled?: boolean
  className?: string
  placeholder?: string
}

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
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between h-11 rounded-xl bg-muted/50 hover:bg-muted/50 text-foreground font-normal", className)}
        >
          {value ? (
            <span className="truncate">
              {value}
            </span>
          ) : (
            <span className="text-slate-500 font-normal">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <CommandInput 
              placeholder="Search country..." 
              className="h-10 border-0 bg-background py-3 text-sm outline-none placeholder:text-muted-foreground w-full"
            />
          </div>
          <CommandEmpty>No country found.</CommandEmpty>
          <CommandList className="max-h-[250px] overflow-y-auto">
            <CommandGroup>
              {COUNTRIES.map((country) => (
                <CommandItem
                  key={country}
                  value={country}
                  onSelect={() => {
                    onValueChange(country)
                    setOpen(false)
                  }}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span className="font-medium text-foreground">{country}</span>
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
