import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { GripVertical, Trash2, Plus, Music, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Track } from '@/types/database'

export interface TrackFormValue {
  id?: string
  title: string
  duration: number | null
  audio_url: string | null
  audio_file?: File | null
  track_number: number
}

interface TrackListFieldProps {
  value: TrackFormValue[]
  onChange: (tracks: TrackFormValue[]) => void
  errors?: Record<number, { title?: string; audio_url?: string }>
  minTracks: number
  maxTracks: number | null
}

export function TrackListField({ value, onChange, errors, minTracks, maxTracks }: TrackListFieldProps) {
  const { t } = useTranslation()

  const update = (index: number, patch: Partial<TrackFormValue>) => {
    const next = value.map((tr, i) => (i === index ? { ...tr, ...patch } : tr))
    onChange(next)
  }

  const add = () => {
    onChange([
      ...value,
      { title: '', duration: null, audio_url: null, audio_file: null, track_number: value.length + 1 },
    ])
  }

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= value.length) return
    const next = [...value]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div className="space-y-2">
      {value.map((tr, i) => {
        const err = errors?.[i]
        return (
          <div
            key={tr.id ?? `new-${i}`}
            className={cn(
              'rounded-md border bg-secondary/30 p-2.5',
              err?.title || err?.audio_url ? 'border-destructive/50' : 'border-border',
            )}
          >
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              <span className="w-5 shrink-0 text-center font-mono text-xs text-muted-foreground">
                {i + 1}
              </span>
              <Input
                placeholder={t('admin.releases.fields.trackTitle')}
                value={tr.title}
                onChange={(e) => update(i, { title: e.target.value })}
                className="flex-1"
              />
              <Input
                type="text"
                placeholder="0:00"
                value={tr.duration ? formatDur(tr.duration) : ''}
                onChange={(e) => update(i, { duration: parseDur(e.target.value) })}
                className="w-16 text-center font-mono text-xs"
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label={t('admin.releases.moveUp')}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0"
                onClick={() => move(i, 1)}
                disabled={i === value.length - 1}
                aria-label={t('admin.releases.moveDown')}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0"
                onClick={() => remove(i)}
                disabled={value.length <= minTracks}
                aria-label={t('admin.common.delete')}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
            <AudioInput
              track={tr}
              onChange={(file) => update(i, { audio_file: file })}
              error={err?.audio_url}
            />
            {err?.title && <p className="mt-1 text-xs text-destructive">{err.title}</p>}
          </div>
        )
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={add}
        disabled={maxTracks !== null && value.length >= maxTracks}
        className="w-full font-mono"
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        {t('admin.releases.addTrack')}
      </Button>
      {(maxTracks !== null || minTracks > 1) && (
        <p className="text-center font-mono text-[10px] text-muted-foreground">
          {minTracks}-{maxTracks ?? '∞'} {t('admin.releases.tracksRange')}
        </p>
      )}
    </div>
  )
}

function AudioInput({
  track,
  onChange,
  error,
}: {
  track: TrackFormValue
  onChange: (file: File | null) => void
  error?: string
}) {
  const { t } = useTranslation()
  const ref = useRef<HTMLInputElement>(null)
  const hasAudio = Boolean(track.audio_url || track.audio_file)

  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        ref={ref}
        type="file"
        accept="audio/*"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="hidden"
      />
      <Button
        type="button"
        variant={hasAudio ? 'secondary' : 'outline'}
        size="sm"
        className="h-7 font-mono text-xs"
        onClick={() => ref.current?.click()}
      >
        <Music className="mr-1.5 h-3 w-3" />
        {hasAudio
          ? (track.audio_file?.name ?? t('admin.releases.audioUploaded'))
          : t('admin.releases.uploadAudio')}
      </Button>
      {track.audio_file && (
        <span className="truncate font-mono text-[10px] text-muted-foreground">
          {track.audio_file.name}
        </span>
      )}
      {track.audio_url && !track.audio_file && (
        <span className="truncate font-mono text-[10px] text-primary/70">
          {t('admin.releases.audioExists')}
        </span>
      )}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}

function formatDur(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function parseDur(str: string): number | null {
  const match = str.match(/^(\d+):(\d{2})$/)
  if (!match) return null
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10)
}

export function tracksToFormValues(tracks: Track[] | undefined): TrackFormValue[] {
  if (!tracks || tracks.length === 0) return []
  return [...tracks]
    .sort((a, b) => a.track_number - b.track_number)
    .map((t) => ({
      id: t.id,
      title: t.title,
      duration: t.duration,
      audio_url: t.audio_url,
      audio_file: null,
      track_number: t.track_number,
    }))
}
