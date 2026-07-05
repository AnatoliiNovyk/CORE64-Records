import { useTranslation } from 'react-i18next'
import { useContentValue, useAboutStats } from '@/hooks/use-data'

export default function AboutSection() {
  const { t } = useTranslation()
  const title = useContentValue('about_title', t('about.title'))
  const text = useContentValue('about_text', t('about.text'))
  const mission = useContentValue('about_mission', t('about.mission'))
  const { data: stats } = useAboutStats()

  const releasesValue = stats ? `${stats.releasesCount}` : t('about.stats.releasesValue')
  const producersValue = stats ? `${stats.producersCount}` : t('about.stats.producersValue')

  return (
    <section id="about" className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      <div className="relative mx-auto max-w-4xl px-4">
        <div className="mb-12 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">{t('about.prefix')}</p>
          <h2 className="mt-2 font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h2>
        </div>
        <div className="space-y-6">
          <p className="text-lg leading-relaxed text-foreground/80">
            {text}
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            {mission}
          </p>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { value: releasesValue, label: t('about.stats.releases') },
            { value: producersValue, label: t('about.stats.producers') },
            { value: t('about.stats.yearsValue'), label: t('about.stats.years') },
            { value: t('about.stats.playsValue'), label: t('about.stats.plays') },
          ].map(stat => (
            <div key={stat.label} className="rounded-lg border border-border bg-card/50 p-4 text-center">
              <p className="font-mono text-2xl font-bold text-primary">{stat.value}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
