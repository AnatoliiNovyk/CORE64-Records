import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const KYIV_TZ = 'Europe/Kyiv'

/**
 * Convert a naive datetime-local string (e.g. "2026-09-01T12:00") entered
 * in Kyiv local time into an ISO-8601 UTC string for storage in the database.
 * Without this, Postgres interprets the naive string as UTC, causing a 3-hour
 * offset when displayed back in the Kyiv timezone.
 */
export function localToUtcIso(localString: string): string {
  if (!localString) return ''
  const date = new Date(localString)
  if (isNaN(date.getTime())) return ''
  return date.toISOString()
}

/**
 * Convert an ISO-8601 UTC timestamp from the database back into a
 * datetime-local string (YYYY-MM-DDTHH:mm) in Kyiv local time, so the
 * admin form shows the time the admin originally intended.
 */
export function utcToLocalInput(isoString: string): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return ''
  const kyiv = new Intl.DateTimeFormat('en-CA', {
    timeZone: KYIV_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = kyiv.formatToParts(date)
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? ''
  const y = get('year')
  const m = get('month')
  const d = get('day')
  let h = get('hour')
  if (h === '24') h = '00'
  const min = get('minute')
  return `${y}-${m}-${d}T${h}:${min}`
}
