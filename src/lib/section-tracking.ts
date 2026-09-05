export interface SectionTop {
  id: string
  /** Viewport-relative top edge, i.e. `getBoundingClientRect().top`. */
  top: number
}

/**
 * The section a reader is currently looking at: the last one whose top edge has
 * crossed a reference line partway down the viewport.
 *
 * Sections must be in document order. This is deliberately geometric rather
 * than intersection-ratio based — a section taller than a few viewports never
 * reaches a meaningful ratio, and when two are visible at once a ratio gives no
 * stable answer about which one the reader is on.
 */
export function pickActiveSection(sections: SectionTop[], line: number): string | null {
  if (sections.length === 0) return null

  let active = sections[0].id
  for (const section of sections) {
    if (section.top <= line) active = section.id
  }
  return active
}

/** Reference line: a third of the way down, so a section becomes active as it takes over the screen. */
export function referenceLine(viewportHeight: number): number {
  return viewportHeight / 3
}
