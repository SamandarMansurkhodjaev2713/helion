import { useEffect, useRef } from 'react'
import { useDeviceTier, useReducedMotion } from '../../lib/hooks'
import { readTokenRgb } from '../../lib/colors'

/** A mote of dust drifting through the key light. */
interface Mote {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  alpha: number
  phase: number
}

const MOTES = { high: 34, low: 14 } as const

/**
 * Dust suspended in the light above the figure — the detail that makes a held
 * frame feel photographed rather than paused. Motes drift slowly upward with a
 * lateral sway and twinkle as they cross the beam.
 *
 * Runs only while the hero is on screen and the tab is visible; never runs
 * under reduced motion. Sized to its parent and cleaned up on unmount.
 */
export default function HeroAtmosphere({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const tier = useDeviceTier()

  useEffect(() => {
    if (reduced) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bone = readTokenRgb('--bone')
    let width = 0
    let height = 0
    let motes: Mote[] = []
    let raf = 0
    let visible = false

    const build = () => {
      const count = MOTES[tier]
      motes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 4,
        vy: -(6 + Math.random() * 14),
        radius: 0.5 + Math.random() * 1.3,
        alpha: 0.12 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2,
      }))
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      if (width === 0 || height === 0) return
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      build()
    }

    let last = 0
    const render = (time: number) => {
      const dt = last ? Math.min(0.05, (time - last) / 1000) : 0.016
      last = time
      ctx.clearRect(0, 0, width, height)
      for (const mote of motes) {
        mote.x += (mote.vx + Math.sin(time * 0.0004 + mote.phase) * 6) * dt
        mote.y += mote.vy * dt
        if (mote.y < -10) {
          mote.y = height + 10
          mote.x = Math.random() * width
        }
        if (mote.x < -10) mote.x = width + 10
        if (mote.x > width + 10) mote.x = -10
        const twinkle = 0.65 + 0.35 * Math.sin(time * 0.0012 + mote.phase)
        ctx.fillStyle = `rgba(${bone}, ${mote.alpha * twinkle})`
        ctx.beginPath()
        ctx.arc(mote.x, mote.y, mote.radius, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(render)
    }

    const start = () => {
      if (raf) return
      last = 0
      raf = requestAnimationFrame(render)
    }
    const stop = () => {
      if (!raf) return
      cancelAnimationFrame(raf)
      raf = 0
    }
    const sync = () => {
      if (visible && !document.hidden) start()
      else stop()
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible && width === 0) resize()
      sync()
    })
    observer.observe(canvas)
    const onVisibility = () => sync()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('resize', resize)
    resize()

    return () => {
      stop()
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('resize', resize)
    }
  }, [reduced, tier])

  if (reduced) return null
  return <canvas ref={canvasRef} aria-hidden className={`pointer-events-none ${className}`} />
}
