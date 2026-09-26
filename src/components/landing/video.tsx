import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Play } from 'lucide-react'
import { useVideos, useContentValue, getLocalizedField } from '@/hooks/use-data'
import { Skeleton } from '@/components/ui/skeleton'

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/)
  return match ? match[1] : null
}

function YouTubeFacade({
  videoId,
  title,
}: {
  videoId: string
  title: string
}) {
  const [active, setActive] = useState(false)
  const thumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

  if (active) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        className="h-full w-full"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setActive(true)}
      className="group relative h-full w-full overflow-hidden bg-secondary"
      aria-label={`Play video: ${title}`}
    >
      <img
        src={thumb}
        alt=""
        width={480}
        height={360}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <span className="absolute inset-0 bg-black/35 transition-colors group-hover:bg-black/25" />
      <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
        <Play className="h-6 w-6 translate-x-0.5" aria-hidden="true" />
      </span>
    </button>
  )
}

const VideoSection = memo(function VideoSection() {
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
                      <YouTubeFacade videoId={videoId} title={video.title} />
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
})

export default VideoSection
