import { memo, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink, Play, Pause } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useReleases, useContentValue, getLocalizedField } from '@/hooks/use-data'
import { usePlayer } from '@/lib/player'
import { ReleaseTypeBadge, formatTime } from '@/components/player/release-helpers'
import { cn } from '@/lib/utils'
import type { Release } from '@/types/database'

const GENRE_COLORS: Record<string, string> = {
  neurofunk: 'bg-chart-1/20 text-chart-1',
  dnb: 'bg-chart-2/20 text-chart-2',
  breakbeat: 'bg-chart-3/20 text-chart-3',
  techstep: 'bg-chart-4/20 text-chart-4',
}

const ReleasesSection = memo(function ReleasesSection() {
  const { t, i18n } = useTranslation()
  const title = useContentValue('releases_title', t('releases.title'))
  const { data: releases, isLoading } = useReleases()
  const player = usePlayer()
  const [filter, setFilter] = useState<string | null>(null)
  const [selected, setSelected] = useState<Release | null>(null)

  const genres = ['neurofunk', 'dnb', 'breakbeat', 'techstep']
  const filtered = filter ? releases?.filter(r => r.genre === filter) : releases

  useEffect(() => {
    const handleSetGenre = (e: Event) => {
      const customEvent = e as CustomEvent<string>
      const g = customEvent.detail?.toLowerCase().trim()
      if (genres.includes(g)) {
        setFilter(g)
      } else if (g === 'all') {
        setFilter(null)
      }
    }
    window.addEventListener('set-release-genre', handleSetGenre)
    return () => window.removeEventListener('set-release-genre', handleSetGenre)
  }, [genres])

  const isCurrentRelease = (r: Release) => player.release?.id === r.id
  const currentTrackId = player.currentTrack?.id

  const handlePlay = (r: Release, e: React.MouseEvent) => {
    e.stopPropagation()
    if (isCurrentRelease(r)) {
      player.toggle()
    } else if (r.tracks && r.tracks.length > 0) {
      player.playRelease(r, 0)
    }
  }

  return (
    <section id="releases" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-12 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">{t('releases.prefix')}</p>
          <h2 className="mt-2 font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h2>
        </div>

        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setFilter(null)}
            className={cn(
              'rounded-md px-3 py-1.5 font-mono text-xs uppercase transition-colors',
              filter === null ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent',
            )}
          >
            {t('releases.filterAll')}
          </button>
          {genres.map(g => (
            <button
              key={g}
              onClick={() => setFilter(g)}
              className={cn(
                'rounded-md px-3 py-1.5 font-mono text-xs uppercase transition-colors',
                filter === g ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent',
              )}
            >
              {g}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-lg" />
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(release => {
              const hasAudio = release.tracks?.some(tr => tr.audio_url)
              const isCurrent = isCurrentRelease(release)
              return (
                <Card
                  key={release.id}
                  className="group cursor-pointer overflow-hidden border-border bg-card transition-all hover:border-primary/30 hover:shadow-[0_0_15px_rgba(0,255,128,0.1)]"
                  onClick={() => setSelected(release)}
                >
                  <div className="relative aspect-square bg-secondary">
                    {release.cover_art_url ? (
                      <img src={release.cover_art_url} alt={release.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="font-mono text-4xl font-bold text-primary/20">{release.catalog_number}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    {hasAudio && (
                      <button
                        onClick={(e) => handlePlay(release, e)}
                        className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-lg transition-all group-hover:opacity-100 hover:scale-105"
                        aria-label={isCurrent && player.isPlaying ? t('player.pause') : t('player.play')}
                      >
                        {isCurrent && player.isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-0.5" />}
                      </button>
                    )}
                    <div className="absolute top-2 left-2">
                      <ReleaseTypeBadge type={release.release_type} label={t(`player.types.${release.release_type}`)} />
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <Badge className={cn('mb-2', GENRE_COLORS[release.genre] || '')}>
                      {release.genre}
                    </Badge>
                    <p className="font-mono text-xs text-muted-foreground">{release.catalog_number}</p>
                    <h3 className="mt-1 font-mono text-sm font-semibold text-foreground line-clamp-1">{getLocalizedField(release, 'title', i18n.language)}</h3>
                    <p className="text-xs text-muted-foreground">{release.artist_name}</p>
                    {getLocalizedField(release, 'description', i18n.language) && (
                      <p className="mt-1 text-xs text-muted-foreground/80 line-clamp-2">
                        {getLocalizedField(release, 'description', i18n.language)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">{t('releases.empty')}</p>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg bg-card">
          <DialogHeader>
            <DialogTitle className="font-mono">{selected && getLocalizedField(selected, 'title', i18n.language)}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {selected.cover_art_url && (
                <img src={selected.cover_art_url} alt={selected.title} className="w-full rounded-md" />
              )}
              <div className="flex flex-wrap items-center gap-2">
                <ReleaseTypeBadge type={selected.release_type} label={t(`player.types.${selected.release_type}`)} />
                <Badge className={GENRE_COLORS[selected.genre] || ''}>{selected.genre}</Badge>
                <span className="font-mono text-xs text-muted-foreground">{selected.catalog_number}</span>
              </div>
              <p className="text-sm text-foreground/80">{selected.artist_name}</p>
              {getLocalizedField(selected, 'description', i18n.language) && (
                <p className="text-sm text-muted-foreground whitespace-pre-line bg-secondary/30 p-3 rounded-md border border-border/50">
                  {getLocalizedField(selected, 'description', i18n.language)}
                </p>
              )}
              {selected.release_date && (
                <p className="text-xs text-muted-foreground">{selected.release_date}</p>
              )}

              {selected.tracks && selected.tracks.length > 0 && (
                <div className="rounded-md border border-border">
                  {selected.tracks.map((tr, i) => {
                    const isPlayingThis = player.currentTrack?.id === tr.id && player.isPlaying
                    return (
                      <button
                        key={tr.id}
                        onClick={() => {
                          if (player.currentTrack?.id === tr.id) {
                            player.toggle()
                          } else {
                            player.playRelease(selected, i)
                          }
                        }}
                        disabled={!tr.audio_url}
                        className={cn(
                          'flex w-full items-center gap-3 border-b border-border px-3 py-2 text-left text-sm transition-colors last:border-0 hover:bg-accent disabled:opacity-40 disabled:hover:bg-transparent',
                          currentTrackId === tr.id && 'bg-accent/60',
                        )}
                      >
                        <span className="flex h-6 w-6 items-center justify-center text-primary">
                          {isPlayingThis ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                        </span>
                        <span className="w-4 text-center font-mono text-xs text-muted-foreground">{i + 1}</span>
                        <span className={cn('flex-1 truncate', currentTrackId === tr.id ? 'text-primary' : 'text-foreground')}>
                          {tr.title}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {tr.duration ? formatTime(tr.duration) : (currentTrackId === tr.id && player.duration > 0 ? formatTime(player.duration) : '--:--')}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {selected.buy_link && (
                <a
                  href={selected.buy_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-sm text-primary hover:underline"
                >
                  {t('releases.buyStream')} <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
})

export default ReleasesSection
