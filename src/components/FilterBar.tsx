import { FILTERS, filterApiUrl, filterHref, type Filter } from '../lib/filter'
import type { TodoStats } from '../db/todos'

type Props = {
  filter: Filter
  stats: TodoStats
}

export function FilterBar({ filter, stats }: Props) {
  const counts: Record<Filter, number> = {
    all: stats.total,
    active: stats.active,
    done: stats.done,
  }

  return (
    <nav class="filters" aria-label="Filter todos">
      {FILTERS.map((item) => {
        const active = item.value === filter

        return (
          <a
            class={active ? 'filter is-active' : 'filter'}
            href={filterHref(item.value)}
            hx-get={filterApiUrl(item.value)}
            hx-target="#todo-app"
            hx-swap="outerHTML"
            hx-push-url={filterHref(item.value)}
            aria-current={active ? 'page' : undefined}
          >
            {item.label}
            <span class="filter-count">{counts[item.value]}</span>
          </a>
        )
      })}
    </nav>
  )
}
