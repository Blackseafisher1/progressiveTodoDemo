export type Filter = 'all' | 'active' | 'done'

export const FILTERS: ReadonlyArray<{ value: Filter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'done', label: 'Done' },
]

export function parseFilter(value: string | null | undefined): Filter {
  return value === 'active' || value === 'done' ? value : 'all'
}

/** The real, no-JS page URL. */
export function filterHref(filter: Filter): string {
  return filter === 'all' ? '/app' : `/app?filter=${filter}`
}

/** The htmx fragment URL. Page 1 is implied. */
export function filterApiUrl(filter: Filter): string {
  return `/todos?filter=${filter}`
}

export function emptyMessage(filter: Filter): string {
  if (filter === 'active') return 'No active todos. Nice work.'
  if (filter === 'done') return 'Nothing is done yet.'
  return 'No todos yet. Add the first one above.'
}
