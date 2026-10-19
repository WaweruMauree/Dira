const NATIONAL_NINE = /^7\d{8}$/
const NATIONAL_TEN = /^07\d{8}$/

/** @param {string} raw */
export function digitsOnly(raw) {
  return String(raw ?? '').replace(/\D/g, '')
}

/**
 * @param {string} nationalDigits digits only (no country code)
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
export function validateKenyaNational(nationalDigits) {
  const d = digitsOnly(nationalDigits)
  if (!d) {
    return { ok: false, message: 'Enter your phone number' }
  }
  if (NATIONAL_NINE.test(d) || NATIONAL_TEN.test(d)) {
    return { ok: true }
  }
  return {
    ok: false,
    message: 'Use 9 digits starting with 7 (e.g. 712345678) or 10 digits starting with 07',
  }
}

/**
 * @param {string} nationalDigits
 * @returns {string | null} E.164 +2547XXXXXXXX
 */
export function normalizeKenyaPhone(nationalDigits) {
  const validation = validateKenyaNational(nationalDigits)
  if (!validation.ok) return null
  const d = digitsOnly(nationalDigits)
  const withoutLeadingZero = d.startsWith('0') ? d.slice(1) : d
  return `+254${withoutLeadingZero}`
}

/** @param {string} e164 */
export function kenyaPhoneLookupVariantsFromE164(e164) {
  const national = e164.startsWith('+254') ? e164.slice(4) : e164
  if (!national.startsWith('7') || national.length !== 9) return [e164]
  return [e164, `0${national}`, national]
}
