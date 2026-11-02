import { filterHref, type Filter } from './filter'

export const PAGE_SIZE = 5

export function parsePage(value: string | null | undefined): number {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

export function pageHref(filter: Filter, page: number): string {
  const base = filterHref(filter)
  if (page <= 1) return base
  return `${base}${base.includes('?') ? '&' : '?'}page=${page}`
}

export function pageApiUrl(filter: Filter, page: number): string {
  return `/todos?filter=${filter}&page=${page}`
}
