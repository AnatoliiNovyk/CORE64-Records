import { useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { usePartners, useContentValue, getLocalizedField } from '@/hooks/use-data'
import { Skeleton } from '@/components/ui/skeleton'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel'
import { useState } from 'react'

const SCROLL_SPEED = 0.6

export default function PartnersSection() {
  const { t, i18n } = useTranslation()
  const title = useContentValue('partners_title', t('partners.title'))
  const { data: partners, isLoading } = usePartners()
  const [api, setApi] = useState<CarouselApi>()
  const rafRef = useRef<number>(0)

  const startAutoScroll = useCallback(() => {
    if (!api) return

    const engine = api.internalEngine()
    const animate = () => {
      engine.location.add(-SCROLL_SPEED)
      engine.target.set(engine.location)
      engine.scrollLooper.loop(-1)
      engine.slideLooper.loop()
      engine.translate.to(engine.location.get())
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
  }, [api])

  useEffect(() => {
    if (!api) return
    startAutoScroll()
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [api, startAutoScroll])

  const allPartners = partners ?? []
  const duplicated = allPartners.length > 0 ? [...allPartners, ...allPartners, ...allPartners] : []

  return (
    <section id="partners" className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background" />
      <div className="relative mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">{t('partners.prefix')}</p>
          <h2 className="mt-2 font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-32 shrink-0 rounded-md" />
            ))}
          </div>
        ) : allPartners.length > 0 ? (
          <Carousel
            opts={{ loop: true, align: 'start', dragFree: true }}
            setApi={setApi}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {duplicated.map((partner, idx) => (
                <CarouselItem
                  key={`${partner.id}-${idx}`}
                  className="basis-1/2 pl-4 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
                >
                  <a
                    href={partner.website_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex h-20 w-full items-center justify-center rounded-md border border-border bg-card/50 p-3 transition-all hover:border-primary/30 hover:shadow-[0_0_10px_rgba(0,255,128,0.05)]"
                  >
                    {partner.logo_url ? (
                      <img
                        src={partner.logo_url}
                        alt={partner.name}
                        className="max-h-full max-w-full object-contain opacity-60 transition-opacity group-hover:opacity-100"
                      />
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                        {getLocalizedField(partner, 'name', i18n.language)}
                      </span>
                    )}
                  </a>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : (
          <p className="text-center text-muted-foreground">{t('partners.empty')}</p>
        )}
      </div>
    </section>
  )
}
