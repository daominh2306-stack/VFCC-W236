import { describe, expect, it } from 'vitest'
import { curriculum } from '../src/data/curriculum'
import {
  getSafeExternalUrl,
  validateCurriculum,
} from '../src/lib/validateCurriculum'

describe('runtime curriculum validation', () => {
  it('accepts the authoritative curriculum', () => {
    expect(() => validateCurriculum(curriculum)).not.toThrow()
  })

  it('rejects unresolved source references', () => {
    const invalid = structuredClone(curriculum)
    invalid.weeks[0]!.topics[0]!.sourceIds.push('src-does-not-exist')

    expect(() => validateCurriculum(invalid)).toThrow(/unresolved source references/i)
  })

  it('allows only HTTP(S) source links to become anchors', () => {
    expect(getSafeExternalUrl('https://example.com/reading')).toBe(
      'https://example.com/reading',
    )
    expect(getSafeExternalUrl('javascript:alert(1)')).toBeNull()
    expect(getSafeExternalUrl('not a url')).toBeNull()
    expect(getSafeExternalUrl(undefined)).toBeNull()
  })
})
