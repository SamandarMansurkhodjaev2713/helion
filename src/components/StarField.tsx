import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../lib/hooks'
import { clamp, clamp01 } from '../lib/easing'
import { STARFIELD } from '../lib/constants'

interface Star {
  x: number
  y: number
  /** Depth 0 (far) → 1 (near); scales parallax drift and warp streak length. */
  depth: number
  radius: number
  baseAlpha: number
  twinklePhase: number
  color: string
}

/** Read a brand colour token from CSS custom properties as an `r, g, b` string. */
function readRgb(varName: string): string {
  const hex = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  const int = parseInt(hex.replace('#', ''), 16)
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255
  return `${r}, ${g}, ${b}`
}

/**
 * A fixed, full-viewport canvas of drifting stars behind the whole page. It is
 * the connective tissue between sections: as the user scrolls, stars stretch
 * into warp streaks proportional to scroll velocity, so every section sits in
 * living space rather than on a flat black.
 *
 * Resilience:
 *  - One rAF loop, paused when the tab is hidden and never started under
 *    reduced-motion (a single static frame is drawn instead).
 *  - DPR is capped and star count scales with viewport, so mobile stays light.
 *  - Canvas size and star field rebuild on resize; all listeners are removed on
 *    unmount.
 */
export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const accentRgb = readRgb('--accent')
    const iceRgb = readRgb('--ice')
    const boneRgb = readRgb('--bone')
    const steelRgb = readRgb('--steel')
    const colorRamp = [iceRgb, iceRgb, boneRgb, steelRgb, accentRgb]

    let dpr = 1
    let width = 0
    let height = 0
    let stars: Star[] = []
    let raf = 0
    let lastScrollY = window.scrollY
    let velocity = 0

    const buildStars = () => {
      const isMobile = window.matchMedia('(max-width: 768px)').matches
      const count = isMobile ? STARFIELD.mobileStars : STARFIELD.desktopStars
      stars = Array.from({ length: count }, () => {
        const depth = Math.random()
        const rgb = colorRamp[Math.floor(Math.random() * colorRamp.length)]
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          depth,
          radius: 0.4 + depth * 1.3,
          baseAlpha: 0.15 + depth * 0.55,
          twinklePhase: Math.random() * Math.PI * 2,
          color: rgb,
        }
      })
    }

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, STARFIELD.maxDpr)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      buildStars()
      // Resize clears the canvas; the animation loop repaints next frame, but the
      // reduced-motion path draws only once, so redraw it here.
      if (reduced) drawStatic()
    }

    const drawStar = (star: Star, streak: number, time: number) => {
      const twinkle = 0.75 + 0.25 * Math.sin(time * 0.001 + star.twinklePhase)
      const alpha = clamp01(star.baseAlpha * twinkle)
      const paint = star.color

      if (streak > 1) {
        // Warp streak: draw a fading line opposite the scroll direction.
        const len = streak * (0.35 + star.depth)
        const dir = Math.sign(velocity)
        ctx.strokeStyle = `rgba(${paint}, ${alpha})`
        ctx.lineWidth = star.radius
        ctx.beginPath()
        ctx.moveTo(star.x, star.y)
        ctx.lineTo(star.x, star.y - len * dir)
        ctx.stroke()
      } else {
        ctx.fillStyle = `rgba(${paint}, ${alpha})`
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const render = (time: number) => {
      // Smoothed scroll velocity → warp intensity.
      const y = window.scrollY
      velocity = velocity * 0.82 + (y - lastScrollY) * 0.18
      lastScrollY = y
      const warp = clamp(Math.abs(velocity) / STARFIELD.warpAtVelocity, 0, 1) * STARFIELD.maxStreak

      ctx.clearRect(0, 0, width, height)
      for (const star of stars) {
        // Gentle ambient parallax drift — nearer stars drift a touch faster.
        star.y += 0.02 + star.depth * 0.04
        if (star.y > height) star.y = 0
        drawStar(star, warp * star.depth, time)
      }
      raf = requestAnimationFrame(render)
    }

    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height)
      for (const star of stars) {
        ctx.fillStyle = `rgba(${star.color}, ${clamp01(star.baseAlpha)})`
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const start = () => {
      if (raf) return
      raf = requestAnimationFrame(render)
    }
    const stop = () => {
      if (!raf) return
      cancelAnimationFrame(raf)
      raf = 0
    }

    const onVisibility = () => {
      if (document.hidden) stop()
      else if (!reduced) start()
    }

    resize()
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibility)

    if (reduced) {
      drawStatic()
    } else {
      start()
    }

    return () => {
      stop()
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [reduced])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  )
}
