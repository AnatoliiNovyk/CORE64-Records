import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useProducers, useContentValue, getLocalizedField } from '@/hooks/use-data'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Globe, Mail, Phone, Headphones } from 'lucide-react'
import {
  InstagramIcon,
  FacebookIcon,
  YouTubeIcon,
  TwitterIcon,
  TikTokIcon,
  SoundCloudIcon,
  SpotifyIcon,
  AppleMusicIcon,
  AmazonMusicIcon,
  BeatportIcon,
  TidalIcon,
  DeezerIcon,
  BandcampIcon,
} from '@/components/icons/brand-icons'

const SOCIAL_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  website: Globe,
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  youtube: YouTubeIcon,
  twitter: TwitterIcon,
  tiktok: TikTokIcon,
  soundcloud: SoundCloudIcon,
  email: Mail,
  phone: Phone,
}

const MUSIC_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  spotify: SpotifyIcon,
  apple_music: AppleMusicIcon,
  amazon_music: AmazonMusicIcon,
  soundcloud: SoundCloudIcon,
  beatport: BeatportIcon,
  youtube_music: YouTubeIcon,
  tidal: TidalIcon,
  deezer: DeezerIcon,
  bandcamp: BandcampIcon,
}

function SocialIcon({ platform }: { platform: string }) {
  const Icon = SOCIAL_ICON_MAP[platform]
  if (Icon) return <Icon className="h-5 w-5" />
  return <Globe className="h-5 w-5" />
}

function MusicIcon({ platform }: { platform: string }) {
  const Icon = MUSIC_ICON_MAP[platform]
  if (Icon) return <Icon className="h-5 w-5" />
  return <Headphones className="h-5 w-5" />
}

const ProducersSection = memo(function ProducersSection() {
  const { t, i18n } = useTranslation()
  const title = useContentValue('producers_title', t('producers.title'))
  const { data: producers, isLoading } = useProducers()

  return (
    <section id="producers" className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background" />
      <div className="relative mx-auto max-w-7xl px-4">
        <div className="mb-12 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">{t('producers.prefix')}</p>
          <h2 className="mt-2 font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h2>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-lg" />
            ))}
          </div>
        ) : producers && producers.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {producers.map(producer => (
              <Card key={producer.id} className="border-border bg-card/50 transition-all hover:border-primary/30">
                <CardContent className="flex flex-col items-center gap-4 py-8 px-6 text-center">
                  <Avatar className="h-48 w-48 border-2 border-border">
                    <AvatarImage src={producer.avatar_url || undefined} alt={producer.name} className="object-cover" />
                    <AvatarFallback className="bg-secondary font-mono text-4xl">
                      {producer.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-mono text-xl font-semibold text-foreground">{producer.name}</h3>
                  {producer.genres && producer.genres.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {producer.genres.map((genre: string) => (
                        <Badge key={genre} variant="secondary" className="text-xs">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {(producer.bio || producer.translations?.[i18n.language]?.bio) && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{getLocalizedField(producer, 'bio', i18n.language)}</p>
                  )}
                  {producer.social_links && Object.keys(producer.social_links).length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2">
                      {Object.entries(producer.social_links).map(([platform, url]) => {
                        const href = platform === 'email'
                          ? `mailto:${url}`
                          : platform === 'phone'
                            ? `tel:${url}`
                            : url
                        return (
                          <a
                            key={platform}
                            href={href}
                            target={platform !== 'email' && platform !== 'phone' ? '_blank' : undefined}
                            rel={platform !== 'email' && platform !== 'phone' ? 'noopener noreferrer' : undefined}
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary/50 text-muted-foreground transition-all duration-200 hover:scale-110 hover:border-primary/50 hover:bg-secondary hover:text-primary"
                            title={platform}
                          >
                            <SocialIcon platform={platform} />
                          </a>
                        )
                      })}
                    </div>
                  )}
                  {producer.music_links && Object.keys(producer.music_links).length > 0 && (
                    <>
                      <div className="flex w-full items-center gap-3">
                        <div className="h-px flex-1 bg-border" />
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          {t('producers.listenOn')}
                        </span>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                      <div className="flex flex-wrap justify-center gap-2">
                        {Object.entries(producer.music_links).map(([platform, url]) => (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-primary/5 text-muted-foreground transition-all duration-200 hover:scale-110 hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                            title={platform.replace('_', ' ')}
                          >
                            <MusicIcon platform={platform} />
                          </a>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">{t('producers.empty')}</p>
        )}
      </div>
    </section>
  )
})

export default ProducersSection
