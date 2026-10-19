import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { digitsOnly } from '@/lib/phone/kenyaPhone'

const KENYA = 'KE'

/**
 * @param {{
 *   id?: string
 *   label?: string
 *   value: string
 *   onChange: (nationalDigits: string) => void
 *   error?: string | null
 *   disabled?: boolean
 * }} props
 */
export default function KenyaPhoneInput({
  id = 'phone',
  label = 'Phone number',
  value,
  onChange,
  error,
  disabled,
}) {
  const handleNationalChange = (e) => {
    const next = digitsOnly(e.target.value).slice(0, 10)
    onChange(next)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Select value={KENYA} disabled>
          <SelectTrigger className="w-[140px] shrink-0" aria-label="Country">
            <SelectValue placeholder="Kenya (+254)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={KENYA}>Kenya (+254)</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex flex-1 items-center gap-1 rounded-md border border-input bg-card-bg px-3 focus-within:ring-2 focus-within:ring-ring">
          <span className="text-sm text-muted shrink-0">+254</span>
          <Input
            id={id}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            className="border-0 px-0 shadow-none focus-visible:ring-0"
            placeholder="712345678"
            value={value}
            onChange={handleNationalChange}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
          />
        </div>
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : (
        <p className="text-xs text-muted">Kenyan mobile numbers only (7… or 07…)</p>
      )}
    </div>
  )
}
