import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePhotos, useContentValue, getLocalizedField } from '@/hooks/use-data'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'

const PhotoSection = memo(function PhotoSection() {
  const { t, i18n } = useTranslation()
  const title = useContentValue('photo_title', t('photo.title'))
  const { data: photos, isLoading } = usePhotos()
  const [selectedImg, setSelectedImg] = useState<string | null>(null)

  return (
    <section id="photo" className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background" />
      <div className="relative mx-auto max-w-7xl px-4">
        <div className="mb-12 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">{t('photo.prefix')}</p>
          <h2 className="mt-2 font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h2>
        </div>

        {isLoading ? (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-md" />
            ))}
          </div>
        ) : photos && photos.length > 0 ? (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map(photo => (
              <button
                key={photo.id}
                onClick={() => setSelectedImg(photo.image_url)}
                className="group relative aspect-square overflow-hidden rounded-md border border-border"
              >
                <img
                  src={photo.image_url}
                  alt={getLocalizedField(photo, 'title', i18n.language) || getLocalizedField(photo, 'caption', i18n.language) || ''}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    {(photo.title || photo.translations?.[i18n.language]?.title) && (
                      <p className="font-mono text-xs font-medium text-foreground">{getLocalizedField(photo, 'title', i18n.language)}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">{t('photo.empty')}</p>
        )}
      </div>

      <Dialog open={!!selectedImg} onOpenChange={() => setSelectedImg(null)}>
        <DialogContent className="max-w-4xl border-border bg-card p-2">
          {selectedImg && (
            <img src={selectedImg} alt="" className="w-full rounded-md" />
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
})

export default PhotoSection
