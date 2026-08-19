import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface AudioVisualizerProps {
  audioRef?: React.RefObject<HTMLAudioElement | null>
  isPlaying: boolean
  className?: string
  barCount?: number
}

export function AudioVisualizer({
  isPlaying,
  className,
  barCount = 48,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const phaseRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const rect = canvas.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      ctx.clearRect(0, 0, w, h)

      const half = Math.floor(barCount / 2)
      const barW = w / barCount
      const gap = barW * 0.25
      const drawW = Math.max(1, barW - gap)

      phaseRef.current += isPlaying ? 0.08 : 0.03

      const values: number[] = []
      for (let i = 0; i < half; i++) {
        const phase = phaseRef.current + i * 0.22
        const sinWave = (Math.sin(phase) + 1) / 2
        const cosWave = (Math.cos(phase * 0.7) + 1) / 2
        const combined = sinWave * 0.6 + cosWave * 0.4

        if (isPlaying) {
          // Dynamic energy modulation for active playback
          const energy = 0.25 + combined * 0.7 + Math.sin(phaseRef.current * 1.5 + i) * 0.15
          values.push(Math.min(1, Math.max(0.1, energy)))
        } else {
          // Soft ambient wave when idle
          values.push(0.08 + sinWave * 0.08)
        }
      }

      const cy = h / 2
      const maxBarH = h * 0.42

      for (let i = 0; i < barCount; i++) {
        const mirrored = i < half ? half - 1 - i : i - half
        const v = values[mirrored] ?? 0.1
        const barH = Math.max(2, v * maxBarH)
        const x = i * barW + gap / 2
        const yTop = cy - barH
        const yBot = cy + barH

        const hue = 280 - (i / barCount) * 110
        const grad = ctx.createLinearGradient(0, yTop, 0, yBot)
        grad.addColorStop(0, `hsl(${hue}, 95%, 70%)`)
        grad.addColorStop(0.5, `hsl(${hue - 30}, 95%, 60%)`)
        grad.addColorStop(1, `hsl(${hue - 60}, 95%, 55%)`)

        ctx.shadowBlur = isPlaying ? 12 : 4
        ctx.shadowColor = `hsl(${hue}, 95%, 65%)`
        ctx.fillStyle = grad
        ctx.beginPath()
        const r = Math.min(drawW / 2, 4)
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(x, yTop, drawW, barH * 2, r)
        } else {
          ctx.rect(x, yTop, drawW, barH * 2)
        }
        ctx.fill()
      }

      ctx.shadowBlur = 0
      rafRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isPlaying, barCount])

  return (
    <canvas
      ref={canvasRef}
      className={cn('w-full h-full', className)}
      aria-hidden="true"
    />
  )
}
