import { useTranslation } from 'react-i18next'
import { usePartners, useContentValue } from '@/hooks/use-data'
import { Skeleton } from '@/components/ui/skeleton'
import type { Partner } from '@/types/database'

export default function PartnersSection() {
  const { t } = useTranslation()
  const title = useContentValue('partners_title', t('partners.title'))
  const { data: partners, isLoading } = usePartners()

  const friends = partners?.filter(p => p.category === 'friend') ?? []
  const ptnrs = partners?.filter(p => p.category === 'partner') ?? []
  const sponsors = partners?.filter(p => p.category === 'sponsor') ?? []

  const renderGroup = (items: Partner[], label: string) => {
    if (items.length === 0) return null
    return (
      <div>
        <h3 className="mb-4 text-center font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </h3>
        <div className="flex flex-wrap items-center justify-center gap-6">
          {items.map(partner => (
            <a
              key={partner.id}
              href={partner.website_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-20 w-32 items-center justify-center rounded-md border border-border bg-card/50 p-3 transition-all hover:border-primary/30 hover:shadow-[0_0_10px_rgba(0,255,128,0.05)]"
            >
              {partner.logo_url ? (
                <img
                  src={partner.logo_url}
                  alt={partner.name}
                  className="max-h-full max-w-full object-contain opacity-60 transition-opacity group-hover:opacity-100"
                />
              ) : (
                <span className="font-mono text-xs text-muted-foreground group-hover:text-foreground">
                  {partner.name}
                </span>
              )}
            </a>
          ))}
        </div>
      </div>
    )
  }

  return (
    <section id="partners" className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background" />
      <div className="relative mx-auto max-w-5xl px-4">
        <div className="mb-12 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">{t('partners.prefix')}</p>
          <h2 className="mt-2 font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex flex-wrap justify-center gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-32 rounded-md" />
            ))}
          </div>
        ) : partners && partners.length > 0 ? (
          <div className="space-y-12">
            {renderGroup(sponsors, t('partners.sponsors'))}
            {renderGroup(ptnrs, t('partners.partners'))}
            {renderGroup(friends, t('partners.friends'))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">{t('partners.empty')}</p>
        )}
      </div>
    </section>
  )
}
