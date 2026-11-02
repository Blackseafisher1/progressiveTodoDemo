const STORAGE_KEY = 'todo-studio-theme'

type Theme = 'light' | 'dark'

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark'
}

export function initTheme(): void {
  const root = document.documentElement
  const stored = localStorage.getItem(STORAGE_KEY)
  const initial: Theme = isTheme(stored)
    ? stored
    : window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'

  root.dataset.theme = initial

  const button = document.querySelector<HTMLButtonElement>('[data-theme-toggle]')
  if (!button) return

  button.hidden = false

  const label = button.querySelector<HTMLElement>('[data-theme-label]')

  const sync = () => {
    const dark = root.dataset.theme === 'dark'
    button.setAttribute('aria-pressed', String(dark))
    if (label) label.textContent = dark ? 'Light' : 'Dark'
  }

  sync()

  button.addEventListener('click', () => {
    const next: Theme = root.dataset.theme === 'dark' ? 'light' : 'dark'
    root.dataset.theme = next
    localStorage.setItem(STORAGE_KEY, next)
    sync()
  })
}
