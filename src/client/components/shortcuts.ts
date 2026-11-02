function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.matches('input, textarea, select') || target.isContentEditable)
  )
}

let openingEdit = false

function openHelpDialog(): void {
  const dialog = document.getElementById('help-dialog')

  if (dialog instanceof HTMLDialogElement && !dialog.open) {
    dialog.showModal()
  }
}

function syncEditLock(): void {
  const editing = Boolean(document.querySelector('.todo-edit-form'))

  for (const title of document.querySelectorAll<HTMLAnchorElement>(
    '.todo-title',
  )) {
    title.classList.toggle('is-disabled', editing)

    if (editing) {
      title.setAttribute('aria-disabled', 'true')
      title.setAttribute('title', 'Finish or cancel the current edit first')
      title.tabIndex = -1
    } else {
      title.removeAttribute('aria-disabled')
      title.removeAttribute('title')
      title.removeAttribute('tabindex')
    }
  }

  if (!editing) openingEdit = false
}

export function initShortcuts(): void {
  syncEditLock()

  // Invoker API handles the no-JS open; this covers older script-capable browsers.
  if (!('commandForElement' in HTMLButtonElement.prototype)) {
    for (const button of document.querySelectorAll<HTMLButtonElement>(
      '[data-help-open]',
    )) {
      button.addEventListener('click', openHelpDialog)
    }
  }

  // Capture the click before htmx does, so a second edit cannot open.
  document.addEventListener(
    'click',
    (event) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const title = target.closest('.todo-title')
      if (!title) return

      if (document.querySelector('.todo-edit-form') || openingEdit) {
        event.preventDefault()
        event.stopImmediatePropagation()
        return
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      openingEdit = true
    },
    true,
  )

  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
      return
    }

    if (event.key === '?' && !isTyping(event.target)) {
      event.preventDefault()
      openHelpDialog()
      return
    }

    if (event.key === '/' && !isTyping(event.target)) {
      const input = document.getElementById('new-todo-title')
      if (input instanceof HTMLInputElement) {
        event.preventDefault()
        input.focus()
        input.select()
      }
      return
    }

    if (event.key === 'Escape') {
      const target = event.target
      const form =
        target instanceof Element ? target.closest('.todo-edit-form') : null
      const cancel = form?.querySelector<HTMLButtonElement>('[data-cancel-edit]')
      cancel?.click()
    }
  })

  document.body.addEventListener('htmx:afterSwap', syncEditLock)

  document.body.addEventListener('htmx:afterSettle', () => {
    openingEdit = false
    syncEditLock()

    const input = document.querySelector<HTMLInputElement>(
      '.todo-edit-form input[name="title"]',
    )

    if (input) {
      input.focus()
      input.select()
    }
  })

  document.body.addEventListener('htmx:responseError', () => {
    openingEdit = false
    syncEditLock()
  })

  document.body.addEventListener('htmx:sendError', () => {
    openingEdit = false
    syncEditLock()
  })
}
