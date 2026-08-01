import { describe, it, expect } from 'vitest'
import { getLocalizedField } from './use-data'

// `translations` is optional on the generic constraint, so a literal without it
// trips TypeScript's weak-type check; the annotation keeps the intent explicit.
type Translatable = { title: string; translations?: Record<string, Record<string, string>> }

describe('getLocalizedField', () => {
  const item: Translatable = {
    title: 'Base title',
    translations: {
      uk: { title: 'Заголовок' },
    },
  }

  it('returns the translation for the requested language', () => {
    expect(getLocalizedField(item, 'title', 'uk')).toBe('Заголовок')
  })

  it('falls back to the base field when the language is missing', () => {
    expect(getLocalizedField(item, 'title', 'en')).toBe('Base title')
  })

  it('falls back to the base field when the field is missing in that language', () => {
    expect(getLocalizedField(item, 'title', 'de')).toBe('Base title')
  })

  it('falls back to the base field when translations are absent entirely', () => {
    const untranslated: Translatable = { title: 'Only base' }
    expect(getLocalizedField(untranslated, 'title', 'uk')).toBe('Only base')
  })

  it('returns an empty string when neither translation nor base field exists', () => {
    const untranslated: Translatable = { title: 'x' }
    expect(getLocalizedField(untranslated, 'missing', 'uk')).toBe('')
  })

  it('treats an empty translation as absent and uses the base field', () => {
    const withEmpty = { title: 'Base', translations: { uk: { title: '' } } }
    expect(getLocalizedField(withEmpty, 'title', 'uk')).toBe('Base')
  })
})
