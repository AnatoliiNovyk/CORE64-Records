import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>
  isPlaying: boolean
  className?: string
  barCount?: number
}

export function AudioVisualizer({
  audioRef,
  isPlaying,
  className,
  barCount = 48,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const idlePhaseRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const audio = audioRef.current
    if (!canvas || !audio) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let freqData: Uint8Array | null = null

    const ensureGraph = () => {
      if (analyserRef.current || !audio) return
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const audioCtx = new AudioCtx()
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.8
        const source = audioCtx.createMediaElementSource(audio)
        source.connect(analyser)
        analyser.connect(audioCtx.destination)
        audioCtxRef.current = audioCtx
        analyserRef.current = analyser
        sourceRef.current = source
        freqData = new Uint8Array(analyser.frequencyBinCount)
      } catch {
        // AudioContext creation can fail if already connected or unsupported
      }
    }

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
      const drawW = barW - gap

      const values: number[] = []

      if (isPlaying && analyserRef.current && freqData) {
        const data = freqData as Uint8Array<ArrayBuffer>
        analyserRef.current.getByteFrequencyData(data)
        const usable = Math.min(data.length, half)
        for (let i = 0; i < half; i++) {
          const idx = Math.floor((i / half) * usable)
          values.push(data[idx] / 255)
        }
      } else {
        idlePhaseRef.current += 0.04
        for (let i = 0; i < half; i++) {
          const phase = idlePhaseRef.current + i * 0.25
          const wave = (Math.sin(phase) + 1) / 2
          values.push(0.06 + wave * 0.06)
        }
      }

      const cy = h / 2
      const maxBarH = h * 0.42

      for (let i = 0; i < barCount; i++) {
        const mirrored = i < half ? half - 1 - i : i - half
        const v = values[mirrored] ?? 0
        const barH = Math.max(2, v * maxBarH)
        const x = i * barW + gap / 2
        const yTop = cy - barH
        const yBot = cy + barH

        const hue = 280 - (i / barCount) * 100
        const grad = ctx.createLinearGradient(0, yTop, 0, yBot)
        grad.addColorStop(0, `hsl(${hue}, 95%, 70%)`)
        grad.addColorStop(0.5, `hsl(${hue - 30}, 95%, 60%)`)
        grad.addColorStop(1, `hsl(${hue - 60}, 95%, 55%)`)

        ctx.shadowBlur = 12
        ctx.shadowColor = `hsl(${hue}, 95%, 65%)`
        ctx.fillStyle = grad
        ctx.beginPath()
        const r = drawW / 2
        ctx.roundRect(x, yTop, drawW, barH * 2, r)
        ctx.fill()
      }

      ctx.shadowBlur = 0
      rafRef.current = requestAnimationFrame(draw)
    }

    if (isPlaying) ensureGraph()
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {})
    }
    draw()

    return () => {
      window.removeEventListener('resize', resize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [audioRef, isPlaying, barCount])

  useEffect(() => {
    return () => {
      sourceRef.current?.disconnect()
      analyserRef.current?.disconnect()
      audioCtxRef.current?.close().catch(() => {})
      analyserRef.current = null
      audioCtxRef.current = null
      sourceRef.current = null
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={cn('w-full h-full', className)}
      aria-hidden="true"
    />
  )
}
