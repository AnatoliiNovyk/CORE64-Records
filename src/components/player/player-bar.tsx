import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  ChevronUp,
  ChevronDown,
  Share2,
  Music2,
} from 'lucide-react'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { usePlayer } from '@/lib/player'
import { AudioVisualizer } from '@/components/player/audio-visualizer'
import { ReleaseTypeBadge, formatTime } from '@/components/player/release-helpers'
import { toast } from 'sonner'

export function PlayerBar() {
  const { t } = useTranslation()
  const player = usePlayer()
  const [prevVolume, setPrevVolume] = useState(0.8)
  const track = player.currentTrack
  const release = player.release

  if (!track || !release) return null

  const progress = player.duration > 0 ? (player.currentTime / player.duration) * 100 : 0

  const handleShare = async () => {
    const url = `${window.location.origin}/#releases`
    try {
      await navigator.clipboard.writeText(url)
      toast.success(t('player.shareCopied'))
    } catch {
      toast.error(t('player.shareFailed'))
    }
  }

  const toggleMute = () => {
    if (player.volume > 0) {
      setPrevVolume(player.volume)
      player.setVolume(0)
    } else {
      player.setVolume(prevVolume || 0.8)
    }
  }

  return (
    <>
      {/* Collapsed mini bar */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 border-t border-border glass',
          'transition-transform duration-300',
          player.expanded ? 'translate-y-full' : 'translate-y-0',
        )}
      >
        <div
          className="flex items-center gap-3 px-3 py-2.5 sm:px-4 cursor-pointer"
          onClick={() => player.setExpanded(true)}
        >
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md border border-border bg-secondary">
            {release.cover_art_url ? (
              <img src={release.cover_art_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Music2 className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="hidden min-w-0 flex-1 sm:block">
            <p className="truncate font-mono text-sm font-semibold text-foreground">{track.title}</p>
            <p className="truncate text-xs text-muted-foreground">{release.artist_name}</p>
          </div>

          <div className="flex flex-1 items-center justify-center gap-1 sm:flex-none">
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9"
              onClick={(e) => { e.stopPropagation(); player.prev() }}
              aria-label={t('player.previous')}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9"
              onClick={(e) => { e.stopPropagation(); player.toggle() }}
              aria-label={player.isPlaying ? t('player.pause') : t('player.play')}
            >
              {player.isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9"
              onClick={(e) => { e.stopPropagation(); player.next() }}
              aria-label={t('player.next')}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <div className="hidden w-40 items-center gap-2 lg:flex">
            <span className="w-10 text-right font-mono text-[10px] text-muted-foreground">
              {formatTime(player.currentTime)}
            </span>
            <Slider
              value={[progress]}
              max={100}
              step={0.1}
              onValueChange={(v) => {
                if (player.duration > 0) player.seek((v[0] / 100) * player.duration)
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1"
            />
            <span className="w-10 font-mono text-[10px] text-muted-foreground">
              {formatTime(player.duration)}
            </span>
          </div>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            onClick={(e) => { e.stopPropagation(); player.setExpanded(true) }}
            aria-label={t('player.expand')}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Expanded drawer */}
      <Drawer open={player.expanded} onOpenChange={player.setExpanded}>
        <DrawerContent className="bg-card/95 backdrop-blur-xl border-border max-h-[92vh]">
          <div className="mx-auto w-full max-w-3xl px-4 pb-6 pt-2">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {t('player.nowPlaying')}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => player.setExpanded(false)}
                aria-label={t('player.collapse')}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              {/* Cover + info */}
              <div className="flex flex-col items-center md:items-start md:w-1/2">
                <div className="relative aspect-square w-full max-w-[240px] overflow-hidden rounded-lg border border-border bg-secondary shadow-2xl shadow-primary/10">
                  {release.cover_art_url ? (
                    <img src={release.cover_art_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Music2 className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="mt-4 text-center md:text-left">
                  <ReleaseTypeBadge
                    type={release.release_type}
                    label={t(`player.types.${release.release_type}`)}
                    className="mb-2"
                  />
                  <h3 className="font-mono text-lg font-bold text-foreground">{track.title}</h3>
                  <p className="text-sm text-muted-foreground">{release.artist_name}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {release.title} · {release.catalog_number}
                  </p>
                </div>
              </div>

              {/* Controls + visualizer */}
              <div className="flex flex-1 flex-col gap-4">
                <div className="h-24 rounded-lg border border-border/50 bg-background/40">
                  <AudioVisualizer audioRef={player.audioRef} isPlaying={player.isPlaying} />
                </div>

                {/* Progress */}
                <div className="space-y-1.5">
                  <Slider
                    value={[progress]}
                    max={100}
                    step={0.1}
                    onValueChange={(v) => {
                      if (player.duration > 0) player.seek((v[0] / 100) * player.duration)
                    }}
                  />
                  <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
                    <span>{formatTime(player.currentTime)}</span>
                    <span>{formatTime(player.duration)}</span>
                  </div>
                </div>

                {/* Transport controls */}
                <div className="flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn('h-9 w-9', player.shuffle && 'text-primary')}
                    onClick={player.toggleShuffle}
                    aria-label={t('player.shuffle')}
                  >
                    <Shuffle className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10"
                    onClick={player.prev}
                    aria-label={t('player.previous')}
                  >
                    <SkipBack className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    className="h-12 w-12 rounded-full"
                    onClick={player.toggle}
                    aria-label={player.isPlaying ? t('player.pause') : t('player.play')}
                  >
                    {player.isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10"
                    onClick={player.next}
                    aria-label={t('player.next')}
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn('h-9 w-9', player.repeat !== 'off' && 'text-primary')}
                    onClick={player.toggleRepeat}
                    aria-label={t('player.repeat')}
                  >
                    {player.repeat === 'one' ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Volume + share */}
                <div className="flex items-center gap-3">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0"
                    onClick={toggleMute}
                    aria-label={t('player.mute')}
                  >
                    {player.volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  <Slider
                    value={[player.volume * 100]}
                    max={100}
                    step={1}
                    onValueChange={(v) => player.setVolume(v[0] / 100)}
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0"
                    onClick={handleShare}
                    aria-label={t('player.share')}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Track list */}
                {player.tracks.length > 0 && (
                  <div className="mt-2">
                    <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                      {t('player.tracklist')}
                    </p>
                    <ScrollArea className="h-40 rounded-md border border-border/50">
                      <div className="p-1">
                        {player.tracks.map((tr, i) => (
                          <button
                            key={tr.id}
                            onClick={() => player.setTrack(i)}
                            className={cn(
                              'flex w-full items-center gap-3 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent',
                              i === player.currentIndex && 'bg-accent/60',
                            )}
                          >
                            <span className="w-5 text-right font-mono text-xs text-muted-foreground">
                              {i + 1}
                            </span>
                            <span className={cn('flex-1 truncate', i === player.currentIndex ? 'text-primary font-medium' : 'text-foreground')}>
                              {tr.title}
                            </span>
                            <span className="font-mono text-xs text-muted-foreground">
                              {tr.duration ? formatTime(tr.duration) : (i === player.currentIndex && player.duration > 0 ? formatTime(player.duration) : '--:--')}
                            </span>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
