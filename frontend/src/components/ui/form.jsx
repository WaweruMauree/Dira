import { Slot } from '@radix-ui/react-slot'
import { Controller, FormProvider } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

export function Form(props) {
  return <FormProvider {...props} />
}

export function FormField({ ...props }) {
  return <Controller {...props} />
}

export function FormItem({ className, ...props }) {
  return <div className={cn('space-y-2', className)} {...props} />
}

export function FormLabel({ className, ...props }) {
  return <Label className={cn(className)} {...props} />
}

export function FormControl({ ...props }) {
  return <Slot {...props} />
}

export function FormMessage({ className, children, ...props }) {
  if (!children) return null
  return (
    <p className={cn('text-sm font-medium text-destructive', className)} {...props}>
      {children}
    </p>
  )
}

export function FormDescription({ className, ...props }) {
  return <p className={cn('text-sm text-muted', className)} {...props} />
}
