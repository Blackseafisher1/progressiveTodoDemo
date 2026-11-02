import { describe, expect, test } from 'bun:test'
import { emptyMessage, filterApiUrl, filterHref, parseFilter } from './filter'
import { pageApiUrl, pageHref, parsePage } from './pagination'

describe('parseFilter', () => {
  test('accepts known filters', () => {
    expect(parseFilter('active')).toBe('active')
    expect(parseFilter('done')).toBe('done')
    expect(parseFilter('all')).toBe('all')
  })

  test('falls back to all for unknown or missing values', () => {
    expect(parseFilter(undefined)).toBe('all')
    expect(parseFilter(null)).toBe('all')
    expect(parseFilter('')).toBe('all')
    expect(parseFilter('nope')).toBe('all')
  })
})

describe('filter URLs', () => {
  test('builds app and fragment URLs', () => {
    expect(filterHref('all')).toBe('/app')
    expect(filterHref('active')).toBe('/app?filter=active')
    expect(filterApiUrl('done')).toBe('/todos?filter=done')
  })
})

describe('pagination', () => {
  test('parses positive pages only', () => {
    expect(parsePage('2')).toBe(2)
    expect(parsePage('0')).toBe(1)
    expect(parsePage('-1')).toBe(1)
    expect(parsePage('nope')).toBe(1)
    expect(parsePage(undefined)).toBe(1)
  })

  test('builds page URLs without losing the filter', () => {
    expect(pageHref('all', 1)).toBe('/app')
    expect(pageHref('all', 2)).toBe('/app?page=2')
    expect(pageHref('active', 2)).toBe('/app?filter=active&page=2')
    expect(pageApiUrl('done', 3)).toBe('/todos?filter=done&page=3')
  })
})

describe('emptyMessage', () => {
  test('describes the current filter', () => {
    expect(emptyMessage('all')).toContain('No todos yet')
    expect(emptyMessage('active')).toContain('No active todos')
    expect(emptyMessage('done')).toContain('Nothing is done yet')
  })
})
