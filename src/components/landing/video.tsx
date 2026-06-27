import { useTranslation } from 'react-i18next'
import { useVideos, useContentValue, getLocalizedField } from '@/hooks/use-data'
import { Skeleton } from '@/components/ui/skeleton'

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/)
  return match ? match[1] : null
}

export default function VideoSection() {
  const { t, i18n } = useTranslation()
  const title = useContentValue('video_title', t('video.title'))
  const { data: videos, isLoading } = useVideos()

  return (
    <section id="video" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-12 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">{t('video.prefix')}</p>
          <h2 className="mt-2 font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h2>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="aspect-video rounded-lg" />
            ))}
          </div>
        ) : videos && videos.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {videos.map(video => {
              const videoId = getYouTubeId(video.youtube_url)
              return (
                <div key={video.id} className="group overflow-hidden rounded-lg border border-border bg-card">
                  <div className="relative aspect-video">
                    {videoId ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title={video.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="h-full w-full"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-secondary">
                        <span className="text-muted-foreground">{t('video.invalidUrl')}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-mono text-sm font-semibold text-foreground">{getLocalizedField(video, 'title', i18n.language)}</h3>
                    {(video.description || video.translations?.[i18n.language]?.description) && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{getLocalizedField(video, 'description', i18n.language)}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">{t('video.empty')}</p>
        )}
      </div>
    </section>
  )
}
