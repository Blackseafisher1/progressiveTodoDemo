type ToastKind = 'success' | 'error' | 'info'

type ToastDetail = {
  message?: string
  type?: ToastKind
}

export function initToasts(): void {
  const host = document.getElementById('toast-host')
  if (!host) return

  const show = (detail: ToastDetail) => {
    const toast = document.createElement('div')
    const kind = detail.type ?? 'info'

    toast.className = `toast toast--${kind}`
    toast.textContent = detail.message ?? 'Done'
    host.appendChild(toast)

    window.setTimeout(() => {
      toast.classList.add('is-leaving')
      window.setTimeout(() => toast.remove(), 220)
    }, 3200)
  }

  document.body.addEventListener('toast', (event) => {
    show((event as CustomEvent<ToastDetail>).detail ?? {})
  })

  document.body.addEventListener('htmx:responseError', () => {
    show({ message: 'Something went wrong. Please try again.', type: 'error' })
  })
}
