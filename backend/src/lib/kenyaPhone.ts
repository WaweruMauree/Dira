const NATIONAL_NINE = /^7\d{8}$/
const NATIONAL_TEN = /^07\d{8}$/

export function digitsOnly(raw: string): string {
  return String(raw ?? '').replace(/\D/g, '')
}

export function validateKenyaNational(nationalDigits: string): { ok: true } | { ok: false; message: string } {
  const d = digitsOnly(nationalDigits)
  if (!d) {
    return { ok: false, message: 'Enter your phone number' }
  }
  if (NATIONAL_NINE.test(d) || NATIONAL_TEN.test(d)) {
    return { ok: true }
  }
  return {
    ok: false,
    message: 'Use 9 digits starting with 7 or 10 digits starting with 07',
  }
}

/** Accept national digits or already-normalized +254… */
export function normalizeKenyaPhone(input: string): string | null {
  const trimmed = input.trim()
  if (trimmed.startsWith('+254')) {
    const national = trimmed.slice(4)
    return validateKenyaNational(national).ok ? trimmed : null
  }
  const validation = validateKenyaNational(trimmed)
  if (!validation.ok) return null
  const d = digitsOnly(trimmed)
  const withoutLeadingZero = d.startsWith('0') ? d.slice(1) : d
  return `+254${withoutLeadingZero}`
}

export function kenyaPhoneLookupVariants(input: string): string[] {
  const e164 = normalizeKenyaPhone(input)
  if (!e164) return []
  const national = e164.slice(4)
  return [...new Set([e164, `0${national}`, national])]
}
