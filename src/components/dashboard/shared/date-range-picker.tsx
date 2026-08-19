import * as React from "react"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  date: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
}

export function DateRangePicker({
  className,
  date,
  onDateChange
}: DateRangePickerProps) {
  const [localFrom, setLocalFrom] = React.useState<string>(date?.from ? format(date.from, "yyyy-MM-dd") : "");
  const [localTo, setLocalTo] = React.useState<string>(date?.to ? format(date.to, "yyyy-MM-dd") : "");

  React.useEffect(() => {
    setLocalFrom(date?.from ? format(date.from, "yyyy-MM-dd") : "");
    setLocalTo(date?.to ? format(date.to, "yyyy-MM-dd") : "");
  }, [date]);

  const handleApply = () => {
    let fromDate: Date | undefined = undefined;
    let toDate: Date | undefined = undefined;
    
    if (localFrom) {
      const parsed = new Date(localFrom);
      if (!isNaN(parsed.getTime())) fromDate = parsed;
    }
    
    if (localTo) {
      const parsed = new Date(localTo);
      if (!isNaN(parsed.getTime())) toDate = parsed;
    }
    
    onDateChange({ from: fromDate, to: toDate });
  };

  const handleClear = () => {
    setLocalFrom("");
    setLocalTo("");
    onDateChange(undefined);
  };

  return (
    <div className={cn("flex flex-nowrap items-center gap-2 shrink-0", className)}>
      <div className="flex items-center gap-2 bg-background border border-input rounded-md px-2 focus-within:ring-1 focus-within:ring-ring">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider pl-1">Start</span>
        <input 
          type="date" 
          value={localFrom}
          onChange={(e) => setLocalFrom(e.target.value)}
          className="h-9 w-[125px] sm:w-[130px] bg-transparent border-0 focus:ring-0 text-sm outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer dark:[&::-webkit-calendar-picker-indicator]:invert"
        />
      </div>
      <span className="hidden xl:inline text-muted-foreground font-medium">-</span>
      <div className="flex items-center gap-2 bg-background border border-input rounded-md px-2 focus-within:ring-1 focus-within:ring-ring">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider pl-1">End</span>
        <input 
          type="date" 
          value={localTo}
          onChange={(e) => setLocalTo(e.target.value)}
          className="h-9 w-[125px] sm:w-[130px] bg-transparent border-0 focus:ring-0 text-sm outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer dark:[&::-webkit-calendar-picker-indicator]:invert"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" onClick={handleApply} size="sm" className="h-9 px-3 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
          <RefreshCw className="h-3.5 w-3.5" /> Apply
        </Button>
        <Button type="button" onClick={handleClear} variant="outline" size="sm" className="h-9 px-3 text-muted-foreground border-input">
          Clear
        </Button>
      </div>
    </div>
  )
}
