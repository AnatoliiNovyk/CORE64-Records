import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useContentValue } from '@/hooks/use-data'

const HeroSection = memo(function HeroSection() {
  const { t } = useTranslation()
  const title = useContentValue('home_hero_title', t('hero.title'))
  const subtitle = useContentValue('home_hero_subtitle', t('hero.subtitle'))
  const tagline = useContentValue('home_hero_tagline', t('hero.tagline'))

  return (
    <section id="home" className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <img src="/hero-bg.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,128,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,128,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-0 right-0 h-px bg-primary/20 animate-scanline" />
      </div>
      <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />

      <div className="relative z-10 text-center px-4">
        <h1 className="font-mono text-5xl font-bold tracking-tighter text-primary neon-text animate-neon-flicker sm:text-7xl lg:text-8xl">
          {title}
        </h1>
        <p className="mt-4 font-mono text-lg text-foreground/80 sm:text-xl">
          {subtitle}
        </p>
        <p className="mt-2 text-sm text-muted-foreground uppercase tracking-[0.3em]">
          {tagline}
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => document.getElementById('releases')?.scrollIntoView({ behavior: 'smooth' })}
            className="neon-border rounded-md bg-primary/10 px-6 py-2.5 font-mono text-sm font-medium text-primary transition-all hover:bg-primary/20 hover:scale-105"
          >
            {t('hero.exploreBtn')}
          </button>
          <button
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="rounded-md border border-border px-6 py-2.5 font-mono text-sm font-medium text-foreground transition-all hover:border-primary/50 hover:text-primary"
          >
            {t('hero.contactBtn')}
          </button>
        </div>
      </div>
    </section>
  )
})

export default HeroSection
