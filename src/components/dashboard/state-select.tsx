'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { INDIAN_GST_STATES } from '@/lib/bank-configs'

interface StateSelectProps {
  value?: string
  onValueChange: (value: string) => void
  disabled?: boolean
  className?: string
  placeholder?: string
}

/**
 * Searchable Indian state/UT selector supporting search by state name,
 * 2-digit GST state code, or short code.
 */
export function StateSelect({
  value,
  onValueChange,
  disabled = false,
  className,
  placeholder = 'Select Indian State',
}: StateSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')

  const selectedState = React.useMemo(() => {
    const normalized = (value || '').trim().toLowerCase()
    if (!normalized) return undefined
    return INDIAN_GST_STATES.find(
      (s) =>
        s.name.toLowerCase() === normalized ||
        s.short.toLowerCase() === normalized ||
        s.code.toLowerCase() === normalized
    )
  }, [value])

  const filteredStates = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return INDIAN_GST_STATES
    return INDIAN_GST_STATES.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.short.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q)
    )
  }, [search])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setSearch('')
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between rounded-xl border-border bg-background h-11 px-3 text-sm shadow-sm font-medium hover:bg-background',
            !selectedState && !value && 'text-muted-foreground font-normal',
            className
          )}
        >
          {selectedState ? (
            <span className="truncate flex items-center text-left">
              <span className="font-mono text-xs text-blue-600 mr-2 shrink-0">[{selectedState.code}]</span>
              <span className="truncate">
                {selectedState.name} ({selectedState.short})
              </span>
            </span>
          ) : (
            <span className="truncate text-left">{value || placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[260px] p-0 rounded-xl border-border shadow-lg"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search state, short code, or GST code..."
            value={search}
            onValueChange={setSearch}
            autoFocus
            className="h-9"
          />
          <CommandList
            className="max-h-72 overflow-y-auto"
            onWheel={(e) => e.stopPropagation()}
          >
            <CommandEmpty>No state found.</CommandEmpty>
            <CommandGroup>
              {filteredStates.map((s) => {
                const isSelected = selectedState?.code === s.code
                return (
                  <CommandItem
                    key={s.code}
                    value={`${s.code} ${s.name} ${s.short}`}
                    onSelect={() => {
                      onValueChange(s.name)
                      setSearch('')
                      setOpen(false)
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4 shrink-0',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="font-mono text-xs text-blue-600 mr-2 shrink-0">[{s.code}]</span>
                    <span className="truncate">
                      {s.name} ({s.short})
                    </span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

