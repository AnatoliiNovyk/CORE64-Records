import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useReleases, useContentValue, getLocalizedField } from '@/hooks/use-data'
import type { Release } from '@/types/database'

const GENRE_COLORS: Record<string, string> = {
  neurofunk: 'bg-chart-1/20 text-chart-1',
  dnb: 'bg-chart-2/20 text-chart-2',
  breakbeat: 'bg-chart-3/20 text-chart-3',
  techstep: 'bg-chart-4/20 text-chart-4',
}

export default function ReleasesSection() {
  const { t, i18n } = useTranslation()
  const title = useContentValue('releases_title', t('releases.title'))
  const { data: releases, isLoading } = useReleases()
  const [filter, setFilter] = useState<string | null>(null)
  const [selected, setSelected] = useState<Release | null>(null)

  const genres = ['neurofunk', 'dnb', 'breakbeat', 'techstep']
  const filtered = filter ? releases?.filter(r => r.genre === filter) : releases

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
            className={`rounded-md px-3 py-1.5 font-mono text-xs uppercase transition-colors ${
              filter === null ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            {t('releases.filterAll')}
          </button>
          {genres.map(g => (
            <button
              key={g}
              onClick={() => setFilter(g)}
              className={`rounded-md px-3 py-1.5 font-mono text-xs uppercase transition-colors ${
                filter === g ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
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
            {filtered.map(release => (
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
                </div>
                <CardContent className="p-4">
                  <Badge className={`mb-2 ${GENRE_COLORS[release.genre] || ''}`}>
                    {release.genre}
                  </Badge>
                  <p className="font-mono text-xs text-muted-foreground">{release.catalog_number}</p>
                  <h3 className="mt-1 font-mono text-sm font-semibold text-foreground line-clamp-1">{getLocalizedField(release, 'title', i18n.language)}</h3>
                  <p className="text-xs text-muted-foreground">{release.artist_name}</p>
                </CardContent>
              </Card>
            ))}
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
              <div className="flex items-center gap-2">
                <Badge className={GENRE_COLORS[selected.genre] || ''}>{selected.genre}</Badge>
                <span className="font-mono text-xs text-muted-foreground">{selected.catalog_number}</span>
              </div>
              <p className="text-sm text-foreground/80">{selected.artist_name}</p>
              {selected.description && (
                <p className="text-sm text-muted-foreground">{getLocalizedField(selected, 'description', i18n.language)}</p>
              )}
              {selected.release_date && (
                <p className="text-xs text-muted-foreground">{selected.release_date}</p>
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
}
