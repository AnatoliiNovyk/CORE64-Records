import { cn } from '@/lib/utils'
import type { ReleaseType } from '@/types/database'

const TYPE_STYLES: Record<ReleaseType, string> = {
  single: 'bg-chart-1/20 text-chart-1 border-chart-1/30',
  ep: 'bg-chart-2/20 text-chart-2 border-chart-2/30',
  album: 'bg-chart-3/20 text-chart-3 border-chart-3/30',
}

export function ReleaseTypeBadge({
  type,
  label,
  className,
}: {
  type: ReleaseType
  label: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider',
        TYPE_STYLES[type],
        className,
      )}
    >
      {label}
    </span>
  )
}

export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
