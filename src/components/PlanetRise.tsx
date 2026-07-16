import { useEffect, useRef } from 'react'
import { asset } from '../lib/constants'
import { mapRange } from '../lib/easing'
import { readTokenRgb } from '../lib/colors'

/** Internal texture size the source map is downsampled to. */
const TEX_W = 1024
const TEX_H = 512
/** Texture scroll speed (screen px/s) — one revolution takes minutes. */
const SPIN_SPEED = 4
const MAX_DPR = 2
/** Mars dust colours for the rim/atmosphere — literal warm rgba values on
 *  purpose: this is imagery colour (like the footage), not a UI token. */
const DUST = '224, 154, 106'
const DUST_BRIGHT = '255, 216, 178'

interface PlanetRiseProps {
  /** Section viewport progress 0–1 — drives the parallax rise. */
  progress: number
  reduced: boolean
}

/**
 * The finale's horizon: the real Mars. A NASA-derived equirectangular colour
 * map (2K, © Solar System Scope, CC BY 4.0 — credited in the README) is
 * downsampled once into an offscreen texture, wrapped into the sphere clip,
 * lit from above with a terminator, and finished with a thin dusty-orange
 * atmosphere rim. The globe spins imperceptibly slowly while the section is
 * on screen; the parallax rise is a CSS transform on the canvas element.
 *
 * Reduced motion: one still frame, redrawn only on resize. Zero-size layouts
 * are guarded (a 0 radius would make the rim-arc radius negative and throw).
 */
export default function PlanetRise({ progress, reduced }: PlanetRiseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const voidRgb = readTokenRgb('--void')

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
    let disposed = false
    let offset = 0
    let lastTime = 0

    // The source map loads once; every resize re-derives the working texture.
    const source = new Image()
    source.src = asset('mars_2k.jpg')

    /** Downsample the source map and give it a subtle cinematic grade. */
    const buildTexture = () => {
      if (!source.complete || source.naturalWidth === 0) return
      const tex = document.createElement('canvas')
      tex.width = TEX_W
      tex.height = TEX_H
      const g = tex.getContext('2d')
      if (!g) return
      g.drawImage(source, 0, 0, TEX_W, TEX_H)
      // Deepen shadows slightly so the surface sits into the page's dark frame.
      g.fillStyle = `rgba(${voidRgb}, 0.16)`
      g.fillRect(0, 0, TEX_W, TEX_H)
      texture = tex
    }

    const draw = () => {
      // Guard the degenerate 0×0 layout (hidden pane, display:none ancestor):
      // radius 0 would make the rim arcs' radius negative, which throws.
      if (!texture || width === 0 || height === 0 || radius <= 2) return
      ctx.clearRect(0, 0, width, height)

      // Body: wrapped texture inside the sphere clip, then lighting.
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

      // Thin dusty atmosphere (Mars' is faint) + a lit arc on the top limb.
      if (atmosphere) {
        ctx.fillStyle = atmosphere
        ctx.beginPath()
        ctx.arc(cx, cy, radius * 1.06, 0, Math.PI * 2)
        ctx.arc(cx, cy, radius * 0.95, 0, Math.PI * 2, true)
        ctx.fill()
      }
      ctx.strokeStyle = `rgba(${DUST_BRIGHT}, 0.45)`
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.arc(cx, cy, radius - 0.7, Math.PI * 1.12, Math.PI * 1.88)
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
      bodyShade.addColorStop(0.5, `rgba(${voidRgb}, 0.3)`)
      bodyShade.addColorStop(1, `rgba(${voidRgb}, 0.9)`)
      limbShade = ctx.createRadialGradient(cx, cy, radius * 0.6, cx, cy, radius)
      limbShade.addColorStop(0, `rgba(${voidRgb}, 0)`)
      limbShade.addColorStop(0.86, `rgba(${voidRgb}, 0.14)`)
      limbShade.addColorStop(1, `rgba(${voidRgb}, 0.6)`)
      atmosphere = ctx.createRadialGradient(cx, cy, radius * 0.95, cx, cy, radius * 1.06)
      atmosphere.addColorStop(0, `rgba(${DUST}, 0)`)
      atmosphere.addColorStop(0.45, `rgba(${DUST}, 0.2)`)
      atmosphere.addColorStop(0.72, `rgba(${DUST_BRIGHT}, 0.08)`)
      atmosphere.addColorStop(1, `rgba(${DUST}, 0)`)

      draw()
    }

    // First frame as soon as the map arrives (decode() keeps the draw off the
    // main thread's critical path); resize handles every subsequent rebuild.
    source
      .decode()
      .then(() => {
        if (disposed) return
        buildTexture()
        draw()
      })
      .catch(() => {
        // Image failed (offline?) — the finale simply keeps its starfield.
      })

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
      disposed = true
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
