const STORAGE_KEY = 'todo-studio-theme'

type Theme = 'light' | 'dark'

function isTheme(value: string | null | undefined): value is Theme {
  return value === 'light' || value === 'dark'
}

export function initTheme(): void {
  const root = document.documentElement
  const stored = localStorage.getItem(STORAGE_KEY)
  const media = window.matchMedia('(prefers-color-scheme: dark)')

  // If there is no explicit choice, leave data-theme unset so CSS can keep
  // following the operating-system preference.
  if (isTheme(stored)) root.dataset.theme = stored

  const current = (): Theme => {
    const explicit = root.dataset.theme
    if (isTheme(explicit)) return explicit
    return media.matches ? 'dark' : 'light'
  }

  const button = document.querySelector<HTMLButtonElement>('[data-theme-toggle]')
  if (!button) return

  button.hidden = false

  const label = button.querySelector<HTMLElement>('[data-theme-label]')

  const sync = () => {
    const dark = current() === 'dark'
    button.setAttribute('aria-pressed', String(dark))
    if (label) label.textContent = dark ? 'Light' : 'Dark'
  }

  sync()

  const onMediaChange = () => {
    if (!isTheme(root.dataset.theme)) sync()
  }

  if (media.addEventListener) {
    media.addEventListener('change', onMediaChange)
  }

  button.addEventListener('click', () => {
    const next: Theme = current() === 'dark' ? 'light' : 'dark'
    root.dataset.theme = next
    localStorage.setItem(STORAGE_KEY, next)
    sync()
  })
}
