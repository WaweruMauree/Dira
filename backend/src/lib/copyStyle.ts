export const MISSING_LEVEL_LABEL = 'Not present'

export const EMPTY_FIELD = '-'

export const PUNCTUATION_STYLE_RULE =
  'Use only ASCII hyphen-minus (-) for dashes and commas for pauses. Do not use em dashes or en dashes.'

/** Normalize long dashes from model output to ASCII hyphen. */
export function sanitizeAiPunctuation(text: string): string {
  if (!text) return text
  return text.replace(/\u2014/g, '-').replace(/\u2013/g, '-')
}
