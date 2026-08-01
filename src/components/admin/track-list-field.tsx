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
  track_number: number
}

interface TrackListFieldProps {
  fields: Array<TrackFormValue & { id: string }>
  onUpdate: (index: number, value: TrackFormValue) => void
  onAppend: (value: TrackFormValue) => void
  onRemove: (index: number) => void
  onSwap: (indexA: number, indexB: number) => void
  onAudioSelect: (index: number, file: File | null) => void
  audioFiles: Map<number, File>
  errors?: Record<number, { title?: { message?: string }; audio_url?: { message?: string } }>
  minTracks: number
  maxTracks: number | null
}

export function TrackListField({
  fields,
  onUpdate,
  onAppend,
  onRemove,
  onSwap,
  onAudioSelect,
  audioFiles,
  errors,
  minTracks,
  maxTracks,
}: TrackListFieldProps) {
  const { t } = useTranslation()

  const add = () => {
    onAppend({
      title: '',
      duration: null,
      audio_url: null,
      track_number: fields.length + 1,
    })
  }

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= fields.length) return
    onSwap(index, target)
  }

  return (
    <div className="space-y-2">
      {fields.map((tr, i) => {
        const err = errors?.[i]
        const hasAudio = Boolean(tr.audio_url || audioFiles.get(i))
        const fieldId = tr.id
        return (
          <div
            key={fieldId}
            className={cn(
              'rounded-md border bg-secondary/30 p-2.5',
              err?.title?.message || err?.audio_url?.message ? 'border-destructive/50' : 'border-border',
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
                onChange={(e) => onUpdate(i, { ...tr, title: e.target.value })}
                className="flex-1"
              />
              <Input
                type="text"
                placeholder="0:00"
                value={tr.duration ? formatDur(tr.duration) : ''}
                onChange={(e) => onUpdate(i, { ...tr, duration: parseDur(e.target.value) })}
                className="w-16 text-center font-mono text-xs"
              />
              <Button
                type="button"
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
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0"
                onClick={() => move(i, 1)}
                disabled={i === fields.length - 1}
                aria-label={t('admin.releases.moveDown')}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0"
                onClick={() => onRemove(i)}
                disabled={fields.length <= minTracks}
                aria-label={t('admin.common.delete')}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <input
                id={`audio-${fieldId}`}
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null
                  const nameFromFile = file ? file.name.replace(/\.[^.]+$/, '') : undefined
                  onAudioSelect(i, file)
                  onUpdate(i, {
                    ...tr,
                    title: tr.title || nameFromFile || tr.title,
                  })
                }}
                className="hidden"
              />
              <label
                htmlFor={`audio-${fieldId}`}
                className={cn(
                  'inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-3 font-mono text-xs transition-colors',
                  hasAudio
                    ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    : 'border border-input bg-background hover:bg-accent',
                )}
              >
                <Music className="h-3 w-3" />
                {hasAudio
                  ? (audioFiles.get(i)?.name ?? t('admin.releases.audioUploaded'))
                  : t('admin.releases.uploadAudio')}
              </label>
              {audioFiles.get(i) && (
                <span className="truncate font-mono text-[10px] text-muted-foreground">
                  {audioFiles.get(i)!.name}
                </span>
              )}
              {tr.audio_url && !audioFiles.get(i) && (
                <span className="truncate font-mono text-[10px] text-primary/70">
                  {t('admin.releases.audioExists')}
                </span>
              )}
              {err?.audio_url?.message && <span className="text-xs text-destructive">{err.audio_url.message}</span>}
            </div>

            {err?.title?.message && <p className="mt-1 text-xs text-destructive">{err.title.message}</p>}
          </div>
        )
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={add}
        disabled={maxTracks !== null && fields.length >= maxTracks}
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
      track_number: t.track_number,
    }))
}
