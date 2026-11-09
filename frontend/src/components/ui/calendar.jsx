import { useEffect, useRef } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker, getDefaultClassNames } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import './calendar-layout.css'
import './calendar-theme.css'

function CalendarDayButton({ className, day, modifiers, ...props }) {
  const defaultClassNames = getDefaultClassNames()
  const ref = useRef(null)
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  const selectedSingle =
    modifiers.selected &&
    !modifiers.range_start &&
    !modifiers.range_end &&
    !modifiers.range_middle
  const todayNotSelected = modifiers.today && !modifiers.selected

  return (
    <Button
      ref={ref}
      type="button"
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={selectedSingle}
      data-today-unselected={todayNotSelected}
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        'h-[var(--rdp-day_button-height)] w-[var(--rdp-day_button-height)] rounded-full p-0 text-[0.8125rem] font-normal leading-none',
        'data-[selected-single=true]:bg-accent data-[selected-single=true]:text-accent-foreground data-[selected-single=true]:font-medium',
        'data-[today-unselected=true]:border data-[today-unselected=true]:border-hairline data-[today-unselected=true]:bg-transparent',
        'data-[range-middle=true]:bg-accent/50 data-[range-middle=true]:text-accent-foreground data-[range-middle=true]:rounded-none',
        'data-[range-start=true]:bg-accent data-[range-start=true]:text-accent-foreground',
        'data-[range-end=true]:bg-accent data-[range-end=true]:text-accent-foreground',
        'group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-2 group-data-[focused=true]/day:ring-ring/40',
        defaultClassNames.day_button,
        className
      )}
      {...props}
    />
  )
}

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  buttonVariant = 'outline',
  formatters,
  components,
  ...props
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        'group/calendar w-fit max-w-full bg-card-bg p-2',
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString('default', { month: 'short' }),
        ...formatters,
      }}
      classNames={{
        root: cn('w-fit max-w-full', defaultClassNames.root),
        months: cn('relative flex w-fit max-w-full flex-col gap-2', defaultClassNames.months),
        month: cn('flex w-fit max-w-full flex-col gap-2', defaultClassNames.month),
        nav: cn(
          'absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1',
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          'h-[var(--cal-nav)] w-[var(--cal-nav)] select-none border-hairline bg-card-bg p-0 hover:bg-secondary/50 aria-disabled:opacity-50',
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          'h-[var(--cal-nav)] w-[var(--cal-nav)] select-none border-hairline bg-card-bg p-0 hover:bg-secondary/50 aria-disabled:opacity-50',
          defaultClassNames.button_next
        ),
        month_caption: cn(
          'flex h-[var(--cal-nav)] w-full items-center justify-center px-[var(--cal-nav)]',
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          'flex h-[var(--cal-nav)] w-full items-center justify-center gap-1.5 text-sm font-medium',
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          'has-focus:border-ring border-input has-focus:ring-ring/50 has-focus:ring-[3px] relative rounded-md border',
          defaultClassNames.dropdown_root
        ),
        dropdown: cn('bg-card-bg absolute inset-0 opacity-0', defaultClassNames.dropdown),
        caption_label: cn(
          'select-none font-medium text-ink whitespace-nowrap',
          captionLayout === 'label'
            ? 'text-xs'
            : '[&>svg]:text-muted flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-xs [&>svg]:size-3.5',
          defaultClassNames.caption_label
        ),
        month_grid: cn('table-fixed border-collapse', defaultClassNames.month_grid),
        weekdays: cn(defaultClassNames.weekdays),
        weekday: cn('text-muted select-none text-center font-medium', defaultClassNames.weekday),
        week: cn(defaultClassNames.week),
        week_number_header: cn('select-none', defaultClassNames.week_number_header),
        week_number: cn('text-muted select-none text-center text-[0.8rem]', defaultClassNames.week_number),
        day: cn('group/day select-none p-0 text-center align-middle', defaultClassNames.day),
        range_start: cn('bg-accent/30', defaultClassNames.range_start),
        range_middle: cn('bg-accent/20', defaultClassNames.range_middle),
        range_end: cn('bg-accent/30', defaultClassNames.range_end),
        selected: cn('font-medium', defaultClassNames.selected),
        today: cn('text-ink', defaultClassNames.today),
        outside: cn('text-muted', defaultClassNames.outside),
        disabled: cn('text-muted opacity-50', defaultClassNames.disabled),
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className: rootClass, rootRef, ...rootProps }) => (
          <div data-slot="calendar" ref={rootRef} className={cn(rootClass)} {...rootProps} />
        ),
        Chevron: ({ className: chevronClass, orientation, ...chevronProps }) => {
          if (orientation === 'left') {
            return <ChevronLeft className={cn('size-4', chevronClass)} {...chevronProps} />
          }
          if (orientation === 'right') {
            return <ChevronRight className={cn('size-4', chevronClass)} {...chevronProps} />
          }
          return <ChevronDown className={cn('size-4', chevronClass)} {...chevronProps} />
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...weekProps }) => (
          <td {...weekProps}>
            <div className="text-center">{children}</div>
          </td>
        ),
        ...components,
      }}
      {...props}
    />
  )
}
