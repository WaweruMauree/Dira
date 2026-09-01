const STORAGE_KEY = 'dira-theme'

export function getStoredTheme() {
  if (typeof window === 'undefined') return 'system'
  return localStorage.getItem(STORAGE_KEY) || 'system'
}

export function getResolvedTheme(theme) {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

export function applyTheme(theme) {
  const resolved = getResolvedTheme(theme)
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

export { STORAGE_KEY }
