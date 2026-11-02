type DragState = {
  item: HTMLLIElement
  list: HTMLUListElement
  handle: HTMLElement
  pointerId: number
  startX: number
  startY: number
  pointerY: number
  dragging: boolean
  target: HTMLLIElement | null
  scrollDirection: -1 | 0 | 1
  scrollFrame: number | null
}

const DRAG_THRESHOLD = 6
const SCROLL_EDGE = 110
const SCROLL_STEP = 10

type HtmxApi = {
  ajax: (
    method: string,
    url: string,
    options: Record<string, unknown>,
  ) => Promise<unknown>
}

declare global {
  interface Window {
    htmx?: HtmxApi
  }
}

let drag: DragState | null = null
let started = false

function listItems(list: HTMLUListElement): HTMLLIElement[] {
  return Array.from(list.children).filter(
    (child): child is HTMLLIElement =>
      child instanceof HTMLElement &&
      child.tagName === 'LI' &&
      child.classList.contains('todo-item'),
  )
}

function announce(message: string): void {
  const status = document.getElementById('reorder-status')
  if (status) status.textContent = message
}

function itemFromHandle(handle: Element) {
  const item = handle.closest<HTMLLIElement>('li.todo-item')
  const list = handle.closest<HTMLUListElement>('ul[data-sortable]')

  if (!item || !list || !list.contains(item)) return null
  return { item, list }
}

function nearestItem(
  list: HTMLUListElement,
  dragged: HTMLLIElement,
  clientY: number,
): HTMLLIElement | null {
  let best: HTMLLIElement | null = null
  let bestDistance = Number.POSITIVE_INFINITY

  for (const item of listItems(list)) {
    if (item === dragged) continue

    const rect = item.getBoundingClientRect()
    const distance = Math.abs(clientY - (rect.top + rect.height / 2))
    if (distance < bestDistance) {
      best = item
      bestDistance = distance
    }
  }

  return best
}

function clearTarget(state: DragState): void {
  state.target?.classList.remove('is-swap-target')
  state.target = null
}

function setTargetForPointer(state: DragState, clientY: number): void {
  const target = nearestItem(state.list, state.item, clientY)

  if (state.target === target) return

  clearTarget(state)
  state.target = target
  target?.classList.add('is-swap-target')
}

function stopAutoScroll(state: DragState): void {
  state.scrollDirection = 0

  if (state.scrollFrame !== null) {
    cancelAnimationFrame(state.scrollFrame)
    state.scrollFrame = null
  }
}

function autoScrollTick(): void {
  if (!drag || !drag.dragging || drag.scrollDirection === 0) {
    if (drag) drag.scrollFrame = null
    return
  }

  const before = window.scrollY
  window.scrollBy(0, drag.scrollDirection * SCROLL_STEP)

  const canContinue =
    drag.scrollDirection < 0
      ? window.scrollY > 0
      : window.scrollY + window.innerHeight <
        document.documentElement.scrollHeight

  if (!canContinue) {
    drag.scrollDirection = 0
    drag.scrollFrame = null
    return
  }

  if (window.scrollY !== before) {
    setTargetForPointer(drag, drag.pointerY)
  }

  drag.scrollFrame = requestAnimationFrame(autoScrollTick)
}

function updateAutoScroll(state: DragState, clientY: number): void {
  const canScrollUp = window.scrollY > 0
  const canScrollDown =
    window.scrollY + window.innerHeight < document.documentElement.scrollHeight

  let direction: -1 | 0 | 1 = 0

  if (clientY < SCROLL_EDGE && canScrollUp) {
    direction = -1
  } else if (
    clientY > window.innerHeight - SCROLL_EDGE &&
    canScrollDown
  ) {
    direction = 1
  }

  state.scrollDirection = direction

  if (direction === 0) {
    if (state.scrollFrame !== null) {
      cancelAnimationFrame(state.scrollFrame)
      state.scrollFrame = null
    }
    return
  }

  if (state.scrollFrame === null) {
    state.scrollFrame = requestAnimationFrame(autoScrollTick)
  }
}

function swapOnServer(first: HTMLLIElement, second: HTMLLIElement): void {
  const firstIndex = first.dataset.index
  const secondIndex = second.dataset.index

  if (!firstIndex || !secondIndex || firstIndex === secondIndex) return

  const params = new URLSearchParams(window.location.search)
  const filter = params.get('filter') ?? 'all'
  const firstName =
    first.querySelector('.todo-title')?.textContent?.trim() ?? 'todo'
  const secondName =
    second.querySelector('.todo-title')?.textContent?.trim() ?? 'todo'

  announce(`Swapping ${firstName} with ${secondName}.`)

  const url = `/todos/swap?filter=${encodeURIComponent(filter)}`
  const notifyFailure = () => {
    document.body.dispatchEvent(
      new CustomEvent('toast', {
        detail: { message: 'Could not swap the todos.', type: 'error' },
      }),
    )
  }

  if (window.htmx?.ajax) {
    window.htmx
      .ajax('POST', url, {
        target: '#todo-app',
        swap: 'outerHTML',
        values: { a: firstIndex, b: secondIndex },
      })
      .catch(notifyFailure)
    return
  }

  // Fallback for JS-without-htmx: still server-side, then reload.
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'HX-Request': 'true',
    },
    body: new URLSearchParams({
      a: firstIndex,
      b: secondIndex,
    }).toString(),
  })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      window.location.reload()
    })
    .catch(notifyFailure)
}

function finishDrag(event: PointerEvent, commit: boolean): void {
  if (!drag || event.pointerId !== drag.pointerId) return

  const state = drag
  drag = null

  stopAutoScroll(state)

  try {
    if (state.handle.hasPointerCapture(event.pointerId)) {
      state.handle.releasePointerCapture(event.pointerId)
    }
  } catch {
    // Pointer capture can already be gone after a cancel.
  }

  state.item.classList.remove('is-dragging')
  state.item.removeAttribute('data-dragging')
  document.body.classList.remove('is-reordering')

  const target = state.target
  clearTarget(state)

  if (commit && state.dragging && target) {
    swapOnServer(state.item, target)
  }
}

export function initDragSort(): void {
  if (started) return
  started = true

  document.addEventListener(
    'pointerdown',
    (event) => {
      if (drag || !event.isPrimary) return
      if (event.pointerType === 'mouse' && event.button !== 0) return

      const target = event.target
      if (!(target instanceof Element)) return

      const handle = target.closest<HTMLElement>('[data-drag-handle]')
      if (!handle) return

      const found = itemFromHandle(handle)
      if (!found) return

      event.preventDefault()
      handle.focus({ preventScroll: true })

      try {
        handle.setPointerCapture(event.pointerId)
      } catch {
        return
      }

      drag = {
        item: found.item,
        list: found.list,
        handle,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        pointerY: event.clientY,
        dragging: false,
        target: null,
        scrollDirection: 0,
        scrollFrame: null,
      }
    },
    { passive: false },
  )

  document.addEventListener(
    'pointermove',
    (event) => {
      if (!drag || event.pointerId !== drag.pointerId) return

      const distance = Math.hypot(
        event.clientX - drag.startX,
        event.clientY - drag.startY,
      )

      if (!drag.dragging && distance < DRAG_THRESHOLD) return

      if (!drag.dragging) {
        drag.dragging = true
        drag.item.classList.add('is-dragging')
        drag.item.setAttribute('data-dragging', 'true')
        document.body.classList.add('is-reordering')
      }

      event.preventDefault()

      drag.pointerY = event.clientY
      setTargetForPointer(drag, event.clientY)
      updateAutoScroll(drag, event.clientY)
    },
    { passive: false },
  )

  document.addEventListener('pointerup', (event) => finishDrag(event, true))
  document.addEventListener('pointercancel', (event) =>
    finishDrag(event, false),
  )

  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
      return
    }

    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return

    const target = event.target
    if (!(target instanceof Element)) return

    const handle = target.closest('[data-drag-handle]')
    let found = handle ? itemFromHandle(handle) : null

    if (!found) {
      const title = target.closest('.todo-title')
      if (title) {
        const item = title.closest<HTMLLIElement>('li.todo-item')
        const list = title.closest<HTMLUListElement>('ul[data-sortable]')

        if (item && list) found = { item, list }
      }
    }

    if (!found) return

    const sibling =
      event.key === 'ArrowUp'
        ? found.item.previousElementSibling
        : found.item.nextElementSibling

    if (
      !(sibling instanceof HTMLLIElement) ||
      !sibling.classList.contains('todo-item')
    ) {
      return
    }

    event.preventDefault()
    swapOnServer(found.item, sibling)
  })
}
