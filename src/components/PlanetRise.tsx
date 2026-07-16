import { useEffect, useRef } from 'react'
import { mapRange } from '../lib/easing'
import { readTokenRgb } from '../lib/colors'

/** Off-screen band texture size; height maps onto the planet's diameter. */
const TEX_W = 1024
const TEX_H = 512
/** Texture scroll speed (screen px/s) — one revolution takes minutes. */
const SPIN_SPEED = 5
/** Ring set: radius factor, stroke width (at R = 600 px), alpha, tint. */
const RINGS = [
  { f: 1.42, w: 5, a: 0.2, ice: false },
  { f: 1.52, w: 2, a: 0.13, ice: false },
  { f: 1.57, w: 1, a: 0.16, ice: true },
  { f: 1.63, w: 7, a: 0.24, ice: false },
  { f: 1.72, w: 2.5, a: 0.1, ice: false },
] as const
const RING_TILT = (-14 * Math.PI) / 180
/** Flattening of the ring ellipses (ry = rx * this). */
const RING_FLATTEN = 0.21
const MAX_DPR = 2

interface PlanetRiseProps {
  /** Section viewport progress 0–1 — drives the parallax rise. */
  progress: number
  reduced: boolean
}

/**
 * The finale's ringed gas giant, painted on canvas from palette tokens: a
 * banded, noise-speckled texture wrapped into the sphere, a lit top limb with
 * a cold atmosphere rim, and Saturn-like rings behind the body. The band
 * texture is pre-rendered once per resize; the visible frame is a handful of
 * drawImage/gradient fills, spun imperceptibly slowly while the section is on
 * screen. The parallax rise is a CSS transform on the canvas element.
 *
 * Reduced motion: a single still frame, redrawn only on resize. The rAF loop
 * runs only while the canvas is intersecting and the tab is visible.
 */
export default function PlanetRise({ progress, reduced }: PlanetRiseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const voidRgb = readTokenRgb('--void')
    const deep = readTokenRgb('--deep')
    const panel = readTokenRgb('--panel')
    const steel = readTokenRgb('--steel')
    const ice = readTokenRgb('--ice')
    const accent = readTokenRgb('--accent')
    const accentBright = readTokenRgb('--accent-bright')
    const bone = readTokenRgb('--bone')

    let width = 0
    let height = 0
    let radius = 0
    let cx = 0
    let cy = 0
    let texture: HTMLCanvasElement | null = null
    let bodyShade: CanvasGradient | null = null
    let limbShade: CanvasGradient | null = null
    let atmosphere: CanvasGradient | null = null
    let raf = 0
    let visible = false
    let offset = 0
    let lastTime = 0

    /** Paint the banded gas-giant surface once into an offscreen canvas. */
    const buildTexture = () => {
      const tex = document.createElement('canvas')
      tex.width = TEX_W
      tex.height = TEX_H
      const g = tex.getContext('2d')
      if (!g) return

      const base = g.createLinearGradient(0, 0, 0, TEX_H)
      base.addColorStop(0, `rgb(${deep})`)
      base.addColorStop(0.5, `rgb(${panel})`)
      base.addColorStop(1, `rgb(${deep})`)
      g.fillStyle = base
      g.fillRect(0, 0, TEX_W, TEX_H)

      // Soft latitude bands in muted palette tints.
      const bandTints = [
        `rgba(${steel}, 0.15)`,
        `rgba(${deep}, 0.55)`,
        `rgba(${ice}, 0.09)`,
        `rgba(${panel}, 0.6)`,
        `rgba(${steel}, 0.09)`,
        `rgba(${accent}, 0.05)`,
      ]
      g.filter = 'blur(7px)'
      let y = 0
      while (y < TEX_H) {
        const bandHeight = 14 + Math.random() * 46
        g.fillStyle = bandTints[Math.floor(Math.random() * bandTints.length)]
        g.fillRect(-8, y, TEX_W + 16, bandHeight)
        y += bandHeight * (0.6 + Math.random() * 0.8)
      }

      // A few elliptical storms drifting in the bands.
      g.filter = 'blur(10px)'
      for (let i = 0; i < 3; i += 1) {
        g.fillStyle = `rgba(${i === 0 ? ice : steel}, 0.08)`
        g.beginPath()
        g.ellipse(
          Math.random() * TEX_W,
          TEX_H * (0.25 + Math.random() * 0.5),
          40 + Math.random() * 70,
          10 + Math.random() * 16,
          0,
          0,
          Math.PI * 2,
        )
        g.fill()
      }

      // Fine horizontal streaks + speckle so the surface reads as detail in 4K.
      g.filter = 'blur(1px)'
      for (let i = 0; i < 240; i += 1) {
        const alpha = 0.015 + Math.random() * 0.04
        g.fillStyle =
          Math.random() < 0.5 ? `rgba(${bone}, ${alpha})` : `rgba(${voidRgb}, ${alpha * 1.6})`
        g.fillRect(Math.random() * TEX_W, Math.random() * TEX_H, 60 + Math.random() * 300, 1 + Math.random() * 1.6)
      }
      g.filter = 'none'
      for (let i = 0; i < 700; i += 1) {
        g.fillStyle = `rgba(${bone}, ${0.01 + Math.random() * 0.025})`
        g.fillRect(Math.random() * TEX_W, Math.random() * TEX_H, 1.2, 1.2)
      }
      texture = tex
    }

    const draw = () => {
      // Guard the degenerate 0×0 layout (hidden pane, display:none ancestor):
      // radius 0 would make the rim arcs' radius negative, which throws.
      if (!texture || width === 0 || height === 0 || radius <= 2) return
      ctx.clearRect(0, 0, width, height)

      // Rings — drawn first, the body then hides their far middle.
      for (const ring of RINGS) {
        ctx.strokeStyle = `rgba(${ring.ice ? ice : steel}, ${ring.a})`
        ctx.lineWidth = Math.max(0.8, (ring.w * radius) / 600)
        ctx.beginPath()
        ctx.ellipse(cx, cy, radius * ring.f, radius * ring.f * RING_FLATTEN, RING_TILT, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Body: wrapped band texture inside the sphere clip, then lighting.
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.clip()
      const scale = (2 * radius) / TEX_H
      const tileWidth = TEX_W * scale
      let x = -(((offset % tileWidth) + tileWidth) % tileWidth) + (cx - radius) - tileWidth
      for (; x < cx + radius; x += tileWidth) {
        ctx.drawImage(texture, x, cy - radius, tileWidth, 2 * radius)
      }
      if (bodyShade) {
        ctx.fillStyle = bodyShade
        ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)
      }
      if (limbShade) {
        ctx.fillStyle = limbShade
        ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)
      }
      ctx.restore()

      // Cold atmosphere rim (annulus) + a lit arc along the top limb.
      if (atmosphere) {
        ctx.fillStyle = atmosphere
        ctx.beginPath()
        ctx.arc(cx, cy, radius * 1.09, 0, Math.PI * 2)
        ctx.arc(cx, cy, radius * 0.94, 0, Math.PI * 2, true)
        ctx.fill()
      }
      ctx.strokeStyle = `rgba(${accentBright}, 0.5)`
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.arc(cx, cy, radius - 0.7, Math.PI * 1.12, Math.PI * 1.88)
      ctx.stroke()
      ctx.strokeStyle = `rgba(${bone}, 0.2)`
      ctx.lineWidth = 0.6
      ctx.beginPath()
      ctx.arc(cx, cy, radius - 1.8, Math.PI * 1.2, Math.PI * 1.8)
      ctx.stroke()
    }

    const render = (time: number) => {
      const dt = lastTime ? Math.min(0.05, (time - lastTime) / 1000) : 0.016
      lastTime = time
      offset += SPIN_SPEED * dt
      draw()
      raf = requestAnimationFrame(render)
    }

    const start = () => {
      if (raf) return
      lastTime = 0
      raf = requestAnimationFrame(render)
    }
    const stop = () => {
      if (!raf) return
      cancelAnimationFrame(raf)
      raf = 0
    }
    const sync = () => {
      if (reduced) return
      if (visible && !document.hidden) start()
      else stop()
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      width = canvas.clientWidth
      height = canvas.clientHeight
      // Zero layout (pane hidden / not laid out yet) — try again on the next
      // resize or when the observer reports the canvas visible.
      if (width === 0 || height === 0) return
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      radius = Math.min(width * 0.44, height * 1.35)
      cx = width / 2
      cy = height + radius * 0.32

      buildTexture()
      bodyShade = ctx.createLinearGradient(0, cy - radius, 0, cy + radius * 0.25)
      bodyShade.addColorStop(0, `rgba(${voidRgb}, 0)`)
      bodyShade.addColorStop(0.5, `rgba(${voidRgb}, 0.22)`)
      bodyShade.addColorStop(1, `rgba(${voidRgb}, 0.85)`)
      limbShade = ctx.createRadialGradient(cx, cy, radius * 0.6, cx, cy, radius)
      limbShade.addColorStop(0, `rgba(${voidRgb}, 0)`)
      limbShade.addColorStop(0.86, `rgba(${voidRgb}, 0.12)`)
      limbShade.addColorStop(1, `rgba(${voidRgb}, 0.6)`)
      atmosphere = ctx.createRadialGradient(cx, cy, radius * 0.94, cx, cy, radius * 1.09)
      atmosphere.addColorStop(0, `rgba(${accent}, 0)`)
      atmosphere.addColorStop(0.42, `rgba(${accent}, 0.26)`)
      atmosphere.addColorStop(0.7, `rgba(${accentBright}, 0.1)`)
      atmosphere.addColorStop(1, `rgba(${accent}, 0)`)

      draw()
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      // If we mounted while collapsed, take the first real layout now.
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
  }, [reduced])

  const rise = reduced ? 0 : mapRange(progress, 0, 1, 150, -40)

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[46vh] overflow-hidden md:h-[60vh]"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full will-change-transform"
        style={{ transform: `translateY(${rise.toFixed(1)}px)` }}
      />
    </div>
  )
}
