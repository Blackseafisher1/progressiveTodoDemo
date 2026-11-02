import { describe, expect, test } from 'bun:test'
import { emptyMessage, filterApiUrl, filterHref, parseFilter } from './filter'

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

describe('emptyMessage', () => {
  test('describes the current filter', () => {
    expect(emptyMessage('all')).toContain('No todos yet')
    expect(emptyMessage('active')).toContain('No active todos')
    expect(emptyMessage('done')).toContain('Nothing is done yet')
  })
})
