import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface EditableTaxSelectProps {
  value: number | string
  onChange: (val: number) => void
  options?: number[]
  className?: string
  placeholder?: string
  min?: number
  max?: number
  step?: number
  size?: 'sm' | 'default' | 'lg'
}

export function EditableTaxSelect({
  value,
  onChange,
  options = [0, 5, 12, 15, 18, 28],
  className,
  placeholder = '0',
  min = 0,
  max = 100,
  step = 0.01,
  size = 'default',
}: EditableTaxSelectProps) {
  // Local state to manage input string value
  const [inputValue, setInputValue] = React.useState(String(value ?? 0))

  React.useEffect(() => {
    setInputValue(String(value ?? 0))
  }, [value])

  const handleInputChange = (val: string) => {
    setInputValue(val)
    const num = Number(val)
    if (!isNaN(num)) {
      onChange(num)
    }
  }

  const handleSelectOption = (opt: number) => {
    setInputValue(String(opt))
    onChange(opt)
  }

  const heightClass =
    size === 'sm'
      ? 'h-8 text-xs'
      : size === 'lg'
      ? 'h-12 text-base'
      : 'h-10 text-sm'

  return (
    <div className={cn('relative flex items-center w-full min-w-[75px]', className)}>
      <Input
        type="number"
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        className={cn(
          'w-full text-right pr-6 border-border dark:border-[#23272c] bg-card dark:bg-[#181a20] focus-visible:ring-blue-500 rounded-xl',
          heightClass
        )}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'absolute right-0 text-slate-400 hover:text-muted-foreground hover:bg-background dark:hover:bg-background cursor-pointer',
              size === 'sm' ? 'h-8 w-6' : size === 'lg' ? 'h-12 w-9' : 'h-10 w-8'
            )}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-24 bg-card dark:bg-[#181a20] border-border dark:border-[#23272c]">
          {options.map((opt) => (
            <DropdownMenuItem
              key={opt}
              onClick={() => handleSelectOption(opt)}
              className="cursor-pointer"
            >
              {opt}%
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
