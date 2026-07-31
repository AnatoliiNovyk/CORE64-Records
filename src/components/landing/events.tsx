import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, MapPin, Ticket } from 'lucide-react'
import { useEvents, useContentValue, getLocalizedField } from '@/hooks/use-data'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale/uk'
import { enUS } from 'date-fns/locale/en-US'

const EventsSection = memo(function EventsSection() {
  const { t, i18n } = useTranslation()
  const title = useContentValue('events_title', t('events.title'))
  const { data: events, isLoading } = useEvents()
  const dateLocale = i18n.language === 'uk' ? uk : enUS

  return (
    <section id="events" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-12 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">{t('events.prefix')}</p>
          <h2 className="mt-2 font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h2>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : events && events.length > 0 ? (
          <div className="space-y-4">
            {events.map(event => (
              <Card key={event.id} className="border-border bg-card/50 transition-all hover:border-primary/30">
                <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
                  <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-md border border-primary/30 bg-primary/5">
                    <span className="font-mono text-lg font-bold text-primary">
                      {format(new Date(event.date), 'dd', { locale: dateLocale })}
                    </span>
                    <span className="font-mono text-[10px] uppercase text-primary/70">
                      {format(new Date(event.date), 'MMM', { locale: dateLocale })}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-mono text-base font-semibold text-foreground">{getLocalizedField(event, 'title', i18n.language)}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(event.date), 'dd MMM yyyy, HH:mm', { locale: dateLocale })}
                      </span>
                      {(event.venue || event.city) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {[event.venue, event.city].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                    {event.lineup && event.lineup.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {event.lineup.map((artist: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">
                            {artist}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {event.ticket_link && (
                    <a
                      href={event.ticket_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-primary/50 px-4 py-2 font-mono text-xs text-primary transition-all hover:bg-primary/10"
                    >
                      <Ticket className="h-3 w-3" /> {t('events.tickets')}
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">{t('events.empty')}</p>
        )}
      </div>
    </section>
  )
})

export default EventsSection
