import type { Filter } from '../lib/filter'
import { pageApiUrl, pageHref } from '../lib/pagination'

type Props = {
  filter: Filter
  page: number
  pageCount: number
}

export function Pagination({ filter, page, pageCount }: Props) {
  if (pageCount <= 1) return null

  const previous = Math.max(1, page - 1)
  const next = Math.min(pageCount, page + 1)

  return (
    <nav class="pagination" aria-label="Todo pages">
      {page > 1 ? (
        <a
          class="button button-ghost button-small"
          href={pageHref(filter, previous)}
          hx-get={pageApiUrl(filter, previous)}
          hx-target="#todo-app"
          hx-swap="outerHTML"
          hx-push-url={pageHref(filter, previous)}
        >
          ← Prev
        </a>
      ) : (
        <span class="button button-ghost button-small is-disabled" aria-disabled="true">
          ← Prev
        </span>
      )}

      <span class="pagination-status">
        Page {page} of {pageCount}
      </span>

      {page < pageCount ? (
        <a
          class="button button-ghost button-small"
          href={pageHref(filter, next)}
          hx-get={pageApiUrl(filter, next)}
          hx-target="#todo-app"
          hx-swap="outerHTML"
          hx-push-url={pageHref(filter, next)}
        >
          Next →
        </a>
      ) : (
        <span class="button button-ghost button-small is-disabled" aria-disabled="true">
          Next →
        </span>
      )}
    </nav>
  )
}
