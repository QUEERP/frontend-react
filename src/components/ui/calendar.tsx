import * as React from 'react'
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react'
import { DayButton, DayPicker, getDefaultClassNames } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  buttonVariant = 'ghost',
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>['variant']
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        'bg-background group/calendar p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent',
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString('default', { month: 'short' }),
        ...formatters,
      }}
      classNames={{
        root: cn('w-fit', defaultClassNames.root),
        months: cn(
          'flex gap-4 flex-col md:flex-row relative',
          defaultClassNames.months,
        ),
        month: cn('flex flex-col w-full gap-4', defaultClassNames.month),
        nav: cn(
          'flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between',
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          'size-(--cell-size) aria-disabled:opacity-50 p-0 select-none text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors',
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          'size-(--cell-size) aria-disabled:opacity-50 p-0 select-none text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors',
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          'flex items-center justify-center h-(--cell-size) w-full px-(--cell-size)',
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          'w-full flex items-center text-sm font-medium justify-center h-(--cell-size) gap-1.5',
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          'relative has-focus:border-ring border border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] rounded-md',
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn(
          'absolute bg-popover inset-0 opacity-0',
          defaultClassNames.dropdown,
        ),
        caption_label: cn(
          'select-none font-semibold text-slate-900 dark:text-slate-100 tracking-tight',
          captionLayout === 'label'
            ? 'text-sm'
            : 'rounded-md pl-2 pr-1 flex items-center gap-1 text-sm h-8 [&>svg]:text-muted-foreground [&>svg]:size-3.5',
          defaultClassNames.caption_label,
        ),
        table: 'w-full border-collapse',
        weekdays: cn('flex', defaultClassNames.weekdays),
        weekday: cn(
          'text-slate-500 dark:text-slate-400 rounded-md flex-1 font-semibold text-[0.8rem] select-none text-center',
          defaultClassNames.weekday,
        ),
        week: cn('flex w-full mt-2', defaultClassNames.week),
        week_number_header: cn(
          'select-none w-(--cell-size)',
          defaultClassNames.week_number_header,
        ),
        week_number: cn(
          'text-[0.8rem] select-none text-muted-foreground',
          defaultClassNames.week_number,
        ),
        day: cn(
          'relative w-full h-full p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-lg [&:last-child[data-selected=true]_button]:rounded-r-lg group/day aspect-square select-none text-slate-800 dark:text-slate-100 font-medium',
          defaultClassNames.day,
        ),
        range_start: cn(
          'rounded-l-lg bg-blue-100/70 dark:bg-blue-950/60',
          defaultClassNames.range_start,
        ),
        range_middle: cn(
          'rounded-none bg-blue-100/70 dark:bg-blue-950/60',
          defaultClassNames.range_middle,
        ),
        range_end: cn(
          'rounded-r-lg bg-blue-100/70 dark:bg-blue-950/60',
          defaultClassNames.range_end,
        ),
        today: cn(
          'border border-blue-500/40 dark:border-blue-400/50 rounded-lg text-slate-900 dark:text-slate-50 font-bold',
          defaultClassNames.today,
        ),
        outside: cn(
          'text-slate-400 dark:text-slate-600 opacity-40 aria-selected:text-slate-400 dark:aria-selected:text-slate-500',
          defaultClassNames.outside,
        ),
        disabled: cn(
          'text-slate-300 dark:text-slate-600 opacity-40',
          defaultClassNames.disabled,
        ),
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === 'left') {
            return (
              <ChevronLeftIcon className={cn('size-4', className)} {...props} />
            )
          }

          if (orientation === 'right') {
            return (
              <ChevronRightIcon
                className={cn('size-4', className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn('size-4', className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        'flex aspect-square size-auto w-full min-w-(--cell-size) flex-col items-center justify-center gap-1 leading-none font-medium transition-all select-none',
        'text-slate-800 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white',
        'data-[range-start=true]:bg-blue-600 data-[range-start=true]:text-white! data-[range-start=true]:font-bold data-[range-start=true]:shadow-sm data-[range-start=true]:rounded-l-lg data-[range-start=true]:rounded-r-none hover:data-[range-start=true]:bg-blue-700 dark:data-[range-start=true]:bg-blue-600 dark:data-[range-start=true]:text-white!',
        'data-[range-end=true]:bg-blue-600 data-[range-end=true]:text-white! data-[range-end=true]:font-bold data-[range-end=true]:shadow-sm data-[range-end=true]:rounded-r-lg data-[range-end=true]:rounded-l-none hover:data-[range-end=true]:bg-blue-700 dark:data-[range-end=true]:bg-blue-600 dark:data-[range-end=true]:text-white!',
        'data-[range-middle=true]:bg-blue-100/90 data-[range-middle=true]:text-blue-950! data-[range-middle=true]:font-semibold data-[range-middle=true]:rounded-none hover:data-[range-middle=true]:bg-blue-200/90 dark:data-[range-middle=true]:bg-blue-950/80 dark:data-[range-middle=true]:text-blue-200! dark:hover:data-[range-middle=true]:bg-blue-900/70',
        'data-[selected-single=true]:bg-blue-600 data-[selected-single=true]:text-white! data-[selected-single=true]:font-bold data-[selected-single=true]:rounded-lg hover:data-[selected-single=true]:bg-blue-700 dark:data-[selected-single=true]:bg-blue-600 dark:data-[selected-single=true]:text-white!',
        'group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-2 group-data-[focused=true]/day:ring-blue-500/50',
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
