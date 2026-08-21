import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useContentValue } from '@/hooks/use-data'
import HeroSection from '@/components/landing/hero'
import AboutSection from '@/components/landing/about'
import ReleasesSection from '@/components/landing/releases'
import ProducersSection from '@/components/landing/producers'
import VideoSection from '@/components/landing/video'
import PhotoSection from '@/components/landing/photo'
import EventsSection from '@/components/landing/events'
import PartnersSection from '@/components/landing/partners'
import ContactSection from '@/components/landing/contact'

const NAV_IDS = ['home', 'about', 'releases', 'producers', 'video', 'photo', 'events', 'partners', 'contact'] as const

export default function LandingPage() {
  const { t } = useTranslation()
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [mobileOpen, setMobileOpen] = useState(false)
  const logoText = useContentValue('site_logo_text', 'CORE64')
  const footerRights = useContentValue('footer_rights', t('footer.rights'))
  const footerGenres = useContentValue('footer_genres', t('footer.genre'))
  const footerLinkUrl = useContentValue('footer_link_url', '#releases')

  const navItems = NAV_IDS.map(id => ({ id, label: t(`nav.${id}`) }))

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { threshold: 0.3, rootMargin: '-80px 0px 0px 0px' }
    )

    NAV_IDS.forEach(id => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
      setMobileOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'glass border-b border-border' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <button
            onClick={() => scrollTo('home')}
            className="font-mono text-xl font-bold text-primary animate-neon-flicker neon-text"
          >
            {logoText}
          </button>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`rounded-md px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
                  activeSection === id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
            <LanguageSwitcher />
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <LanguageSwitcher />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 bg-card">
                <nav className="mt-8 flex flex-col gap-2">
                  {navItems.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => scrollTo(id)}
                      className={`rounded-md px-4 py-2 text-left font-mono text-sm uppercase tracking-wider transition-colors ${
                        activeSection === id
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {label}
                    </button>
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
        <ReleasesSection />
        <ProducersSection />
        <VideoSection />
        <PhotoSection />
        <EventsSection />
        <PartnersSection />
        <ContactSection />
      </main>

      <footer className="border-t border-border bg-card pt-8 pb-24 sm:pb-28">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p className="font-mono text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {logoText}. {footerRights}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-mono text-xs text-muted-foreground/60">
            {(footerGenres || 'Neurofunk / DnB / Breakbeat / Techstep')
              .split('/')
              .map(g => g.trim())
              .filter(Boolean)
              .map((genre, idx, arr) => (
                <span key={genre} className="inline-flex items-center gap-2">
                  <a
                    href={footerLinkUrl || '#releases'}
                    onClick={(e) => {
                      const norm = genre.toLowerCase().replace(/[^a-z0-9]/g, '')
                      const targetGenre = norm === 'dnb' ? 'dnb' : norm
                      const el = document.getElementById('releases')
                      if (el) {
                        e.preventDefault()
                        el.scrollIntoView({ behavior: 'smooth' })
                        window.dispatchEvent(new CustomEvent('set-release-genre', { detail: targetGenre }))
                      }
                    }}
                    className="transition-colors hover:text-primary hover:underline underline-offset-4 cursor-pointer"
                  >
                    {genre}
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
