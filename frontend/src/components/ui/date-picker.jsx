import { useState } from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDisplayDate, formatISODateLocal, parseISODateLocal } from '@/lib/pathway/planDates'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  disabled = false,
  id,
  className,
  disabledMatchers,
  'aria-label': ariaLabel,
}) {
  const [open, setOpen] = useState(false)
  const selected = value ? parseISODateLocal(value) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          id={id}
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel}
          aria-expanded={open}
          className={cn(
            'h-10 w-full justify-between px-3 font-normal',
            !value && 'text-muted',
            className
          )}
        >
          <span className="truncate text-left">
            {value ? formatDisplayDate(value) : placeholder}
          </span>
          <CalendarIcon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit max-w-[calc(100vw-1.5rem)] p-0" align="start">
        <Calendar
          mode="single"
          selected={selected ?? undefined}
          defaultMonth={selected ?? undefined}
          disabled={disabledMatchers}
          onSelect={(date) => {
            if (!date) return
            onChange(formatISODateLocal(date))
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
