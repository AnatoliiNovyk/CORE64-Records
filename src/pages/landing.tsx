import { useEffect, useState, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useContentValue } from '@/hooks/use-data'
import { pickActiveSection, referenceLine, type SectionTop } from '@/lib/section-tracking'
import HeroSection from '@/components/landing/hero'
import AboutSection from '@/components/landing/about'

// Hero and About are above the fold and stay in the entry chunk. Everything
// below it is split out, so the first paint no longer waits on the carousel,
// the audio player wiring or the contact form's validation stack.
const ReleasesSection = lazy(() => import('@/components/landing/releases'))
const ProducersSection = lazy(() => import('@/components/landing/producers'))
const VideoSection = lazy(() => import('@/components/landing/video'))
const PhotoSection = lazy(() => import('@/components/landing/photo'))
const EventsSection = lazy(() => import('@/components/landing/events'))
const PartnersSection = lazy(() => import('@/components/landing/partners'))
const ContactSection = lazy(() => import('@/components/landing/contact'))

const NAV_IDS = ['home', 'about', 'releases', 'producers', 'video', 'photo', 'events', 'partners', 'contact'] as const

const SECTION_MAP: Record<string, string> = {
  producers: '#producers',
  producer: '#producers',
  продюсери: '#producers',
  releases: '#releases',
  release: '#releases',
  релізи: '#releases',
  events: '#events',
  event: '#events',
  події: '#events',
  video: '#video',
  videos: '#video',
  відео: '#video',
  photo: '#photo',
  photos: '#photo',
  фото: '#photo',
  about: '#about',
  'про лейбл': '#about',
  'про нас': '#about',
  partners: '#partners',
  партнери: '#partners',
  contact: '#contact',
  контакти: '#contact',
  home: '#home',
  головна: '#home',
}

const GENRE_SET = new Set(['neurofunk', 'dnb', 'breakbeat', 'techstep'])

interface ParsedFooterLink {
  label: string
  href: string
  genreFilter?: string
}

function parseFooterLink(item: string): ParsedFooterLink {
  const trimmed = item.trim()
  
  // Format: [Label](url)
  const mdMatch = trimmed.match(/^\[(.*?)\]\((.*?)\)$/)
  if (mdMatch) {
    return { label: mdMatch[1].trim(), href: mdMatch[2].trim() }
  }

  // Format: Label (#url)
  const parenMatch = trimmed.match(/^(.*?)\s*\((\S+)\)$/)
  if (parenMatch) {
    return { label: parenMatch[1].trim(), href: parenMatch[2].trim() }
  }

  // Format: Label: #url
  const colonMatch = trimmed.match(/^(.*?)\s*[:=]\s*(\S+)$/)
  if (colonMatch) {
    return { label: colonMatch[1].trim(), href: colonMatch[2].trim() }
  }

  // Plain word matching
  const key = trimmed.toLowerCase()
  if (SECTION_MAP[key]) {
    return { label: trimmed, href: SECTION_MAP[key] }
  }

  const cleanKey = key.replace(/[^a-z0-9]/g, '')
  if (GENRE_SET.has(cleanKey)) {
    return { label: trimmed, href: '#releases', genreFilter: cleanKey }
  }

  if (trimmed.startsWith('#') || trimmed.startsWith('http') || trimmed.startsWith('/')) {
    return { label: trimmed, href: trimmed }
  }

  return { label: trimmed, href: `#${cleanKey}` }
}

export default function LandingPage() {
  const { t } = useTranslation()
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [mobileOpen, setMobileOpen] = useState(false)
  const logoText = useContentValue('site_logo_text', 'CORE64')
  const defaultCopyright = `© ${new Date().getFullYear()} ${logoText}. All rights reserved.`
  const rawFooterRights = useContentValue('footer_rights', defaultCopyright)
  const copyrightText = rawFooterRights.includes('{year}')
    ? rawFooterRights.replace('{year}', String(new Date().getFullYear()))
    : rawFooterRights
  const footerGenres = useContentValue('footer_genres', 'Producers / Releases / Events / Video')

  const navItems = NAV_IDS.map(id => ({ id, label: t(`nav.${id}`) }))

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const update = () => {
      const tops = NAV_IDS.map((id): SectionTop | null => {
        const el = document.getElementById(id)
        return el ? { id, top: el.getBoundingClientRect().top } : null
      }).filter((section): section is SectionTop => section !== null)

      if (tops.length === 0) return

      // At the very bottom the final section may be too short to reach the
      // line, so nothing would ever mark it active.
      const atBottom =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2

      const next = atBottom
        ? tops[tops.length - 1].id
        : pickActiveSection(tops, referenceLine(window.innerHeight))

      if (next) setActiveSection(next)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)

    // Sections below the fold mount asynchronously and change the geometry.
    const mutations = new MutationObserver(update)
    mutations.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      mutations.disconnect()
    }
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled ? 'glass border-b border-border shadow-lg' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#home" className="flex items-center gap-2">
            <span className="font-mono text-xl font-bold tracking-wider text-primary neon-text">
              {logoText}
            </span>
          </a>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`rounded-md px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
                  activeSection === item.id
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost" className="md:hidden">
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 bg-card pt-12">
                <nav className="flex flex-col gap-2">
                  {navItems.map(item => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={() => setMobileOpen(false)}
                      className={`rounded-md px-3 py-2 font-mono text-sm uppercase tracking-wider transition-colors ${
                        activeSection === item.id
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main>
        <HeroSection />
        <AboutSection />
        <Suspense fallback={<div className="min-h-[50vh]" />}>
          <ReleasesSection />
          <ProducersSection />
          <VideoSection />
          <PhotoSection />
          <EventsSection />
          <PartnersSection />
          <ContactSection />
        </Suspense>
      </main>

      <footer className="border-t border-border bg-card pt-8 pb-24 sm:pb-28">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p className="font-mono text-sm text-muted-foreground">
            {copyrightText}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-mono text-xs text-muted-foreground/60">
            {(footerGenres || 'Producers / Releases / Events / Video')
              .split('/')
              .map(s => s.trim())
              .filter(Boolean)
              .map(parseFooterLink)
              .map((link, idx, arr) => (
                <span key={idx} className="inline-flex items-center gap-2">
                  <a
                    href={link.href}
                    onClick={(e) => {
                      if (link.href.startsWith('#')) {
                        e.preventDefault()
                        const targetId = link.href.slice(1)
                        const el = document.getElementById(targetId)
                        if (el) el.scrollIntoView({ behavior: 'smooth' })
                        if (link.genreFilter) {
                          window.dispatchEvent(new CustomEvent('set-release-genre', { detail: link.genreFilter }))
                        }
                      }
                    }}
                    className="transition-colors hover:text-primary hover:underline underline-offset-4 cursor-pointer"
                  >
                    {link.label}
                  </a>
                  {idx < arr.length - 1 && (
                    <span className="text-muted-foreground/30 select-none">/</span>
                  )}
                </span>
              ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
