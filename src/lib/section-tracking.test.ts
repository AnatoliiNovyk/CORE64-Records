import { describe, it, expect } from 'vitest'
import { pickActiveSection, referenceLine, type SectionTop } from './section-tracking'

// Three sections, in document order, as the page scrolls past them.
const at = (home: number, about: number, releases: number): SectionTop[] => [
  { id: 'home', top: home },
  { id: 'about', top: about },
  { id: 'releases', top: releases },
]

describe('pickActiveSection', () => {
  const line = referenceLine(900) // 300

  it('returns the first section at the very top of the page', () => {
    expect(pickActiveSection(at(0, 900, 1800), line)).toBe('home')
  })

  it('keeps the first section while the next one is still below the line', () => {
    expect(pickActiveSection(at(-200, 700, 1600), line)).toBe('home')
  })

  it('switches once the next section crosses the line', () => {
    expect(pickActiveSection(at(-700, 200, 1100), line)).toBe('about')
  })

  it('picks the last section that crossed, not the first', () => {
    expect(pickActiveSection(at(-1800, -900, 100), line)).toBe('releases')
  })

  it('stays on the last section once everything is above the line', () => {
    expect(pickActiveSection(at(-3000, -2100, -1200), line)).toBe('releases')
  })

  it('handles a section taller than several viewports', () => {
    // The ratio-based approach fails here: a 5000px section in a 900px viewport
    // never reaches 30% visibility, so it could never become active.
    expect(pickActiveSection([{ id: 'home', top: -4000 }, { id: 'tall', top: 100 }], line)).toBe('tall')
  })

  it('returns the first section before anything has scrolled', () => {
    expect(pickActiveSection(at(300, 1200, 2100), line)).toBe('home')
  })

  it('returns null for an empty list', () => {
    expect(pickActiveSection([], line)).toBeNull()
  })
})

describe('referenceLine', () => {
  it('sits a third of the way down the viewport', () => {
    expect(referenceLine(900)).toBe(300)
    expect(referenceLine(1200)).toBe(400)
  })
})
