import { useEffect, useRef } from 'react'
import { useDeviceTier, usePointerFine, useReducedMotion } from '../lib/hooks'
import { clamp01 } from '../lib/easing'
import { STARFIELD } from '../lib/constants'
import { readTokenRgb } from '../lib/colors'

/** A pin-sharp background star (far/mid layers). */
interface Star {
  x: number
  y: number
  /** Depth 0 (far) → 1 (near): scales every parallax source and motion blur. */
  depth: number
  radius: number
  baseAlpha: number
  twinklePhase: number
  twinkleSpeed: number
  colorIndex: number
  /** Bright mid-layer stars get a 4-point diffraction cross. */
  flare: boolean
}

/** An out-of-focus foreground star rendered as a soft bokeh disc. */
interface Bokeh {
  x: number
  y: number
  depth: number
  radius: number
  baseAlpha: number
  /** Phase/speed of the slow "focus breathing" radius oscillation. */
  breathPhase: number
  breathSpeed: number
  colorIndex: number
}

/** A huge, ultra-soft nebula blob drifting on its own slow orbit. */
interface Haze {
  x: number
  y: number
  radius: number
  alpha: number
  driftPhase: number
  spriteIndex: number
}

/** A shooting star: straight run, sine-envelope brightness, then gone. */
interface Meteor {
  x: number
  y: number
  vx: number
  vy: number
  age: number
  maxAge: number
  trail: number
}

/** A satellite pass: a slow, steady dot with a blinking beacon. */
interface Satellite {
  x: number
  y: number
  vx: number
  vy: number
  blinkPhase: number
}

/** A single distant spiral galaxy, drifting at the deepest parallax layer. */
interface Galaxy {
  x: number
  y: number
  depth: number
  angle: number
}

/** Pre-render a soft radial sprite (bokeh disc / glow / haze) once, so the
 *  frame loop only ever calls drawImage — no per-frame gradient allocation. */
function makeRadialSprite(size: number, rgb: string, coreAlpha: number): HTMLCanvasElement | null {
  const sprite = document.createElement('canvas')
  sprite.width = size
  sprite.height = size
  const g = sprite.getContext('2d')
  if (!g) return null
  const half = size / 2
  const grad = g.createRadialGradient(half, half, 0, half, half, half)
  grad.addColorStop(0, `rgba(${rgb}, ${coreAlpha})`)
  grad.addColorStop(0.55, `rgba(${rgb}, ${coreAlpha * 0.32})`)
  grad.addColorStop(1, `rgba(${rgb}, 0)`)
  g.fillStyle = grad
  g.fillRect(0, 0, size, size)
  return sprite
}

/** Pre-render a small tilted spiral galaxy: elliptical halo, two blurred arm
 *  arcs and a bright core. Drawn once; the frame loop only drawImages it. */
function makeGalaxySprite(size: number, coreRgb: string, armRgb: string): HTMLCanvasElement | null {
  const sprite = document.createElement('canvas')
  sprite.width = size
  sprite.height = size
  const g = sprite.getContext('2d')
  if (!g) return null
  const half = size / 2

  g.save()
  g.translate(half, half)
  g.scale(1, 0.42)
  g.translate(-half, -half)
  const halo = g.createRadialGradient(half, half, 0, half, half, half)
  halo.addColorStop(0, `rgba(${coreRgb}, 0.5)`)
  halo.addColorStop(0.3, `rgba(${armRgb}, 0.16)`)
  halo.addColorStop(1, `rgba(${armRgb}, 0)`)
  g.fillStyle = halo
  g.fillRect(0, 0, size, size)
  g.filter = 'blur(3px)'
  g.strokeStyle = `rgba(${armRgb}, 0.28)`
  g.lineWidth = size * 0.045
  g.beginPath()
  g.arc(half, half, size * 0.28, 0.3, 2.5)
  g.stroke()
  g.beginPath()
  g.arc(half, half, size * 0.31, Math.PI + 0.3, Math.PI + 2.5)
  g.stroke()
  g.filter = 'none'
  g.restore()

  const core = g.createRadialGradient(half, half, 0, half, half, size * 0.07)
  core.addColorStop(0, `rgba(${coreRgb}, 0.9)`)
  core.addColorStop(1, `rgba(${coreRgb}, 0)`)
  g.fillStyle = core
  g.fillRect(0, 0, size, size)
  return sprite
}

/** Wrap a coordinate into [-pad, max+pad] so drifting sprites re-enter
 *  seamlessly instead of popping at the viewport edge. */
function wrap(value: number, max: number, pad: number): number {
  const range = max + pad * 2
  return ((((value + pad) % range) + range) % range) - pad
}

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min)

/**
 * Deep space through a cinema lens. Three depth layers — pin-sharp far stars,
 * focused mid stars (the brightest carry a 4-point diffraction cross), and
 * out-of-focus foreground bokeh discs that slowly "breathe" — plus drifting
 * nebula haze and a rare meteor. The whole field pans on a never-repeating
 * Lissajous camera drift; scroll adds depth-scaled parallax and motion blur;
 * on precise pointers the layers lean subtly toward the cursor.
 *
 * Resilience: one rAF loop, paused when the tab is hidden and never started
 * under reduced motion (a single static frame is drawn instead, and redrawn on
 * resize). Sprites are pre-rendered; DPR is capped; counts shrink on mobile.
 * Every listener/rAF is cleaned up on unmount.
 */
export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const pointerFine = usePointerFine()
  const tier = useDeviceTier()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // — Palette: token colours for star tints (accent kept rare) and haze —
    const ice = readTokenRgb('--ice')
    const bone = readTokenRgb('--bone')
    const steel = readTokenRgb('--steel')
    const accent = readTokenRgb('--accent')
    const starColors = [ice, ice, bone, bone, steel, accent]
    const SPRITE = 64
    const bokehSprites = starColors.map((rgb) => makeRadialSprite(SPRITE, rgb, 0.85))
    const glowSprite = makeRadialSprite(SPRITE, ice, 0.5)
    const hazeSprites = [
      makeRadialSprite(512, steel, 0.07),
      makeRadialSprite(512, ice, 0.055),
      makeRadialSprite(512, accent, 0.04),
    ]
    const galaxySprite = makeGalaxySprite(220, bone, ice)
    const warpGlow = makeRadialSprite(256, accent, 0.4)

    let dpr = 1
    let width = 0
    let height = 0
    let farStars: Star[] = []
    let midStars: Star[] = []
    let bokehs: Bokeh[] = []
    let hazes: Haze[] = []
    let meteor: Meteor | null = null
    let nextMeteorAt = 0
    let satellite: Satellite | null = null
    let nextSatelliteAt = 0
    let galaxy: Galaxy | null = null
    /** Smoothed hyper-jump intensity (0–1), fed by scroll velocity spikes. */
    let burst = 0
    let raf = 0
    let lastTime = 0
    let lastScrollY = window.scrollY
    let velocity = 0
    // Pointer parallax: target follows the cursor, pan eases after it.
    let panTargetX = 0
    let panTargetY = 0
    let panX = 0
    let panY = 0

    const makeStar = (depthMin: number, depthMax: number, flareShare: number): Star => {
      const depth = randomBetween(depthMin, depthMax)
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        depth,
        radius: 0.4 + depth * 0.9,
        baseAlpha: 0.2 + depth * 0.5,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: randomBetween(0.4, 1.1),
        colorIndex: Math.floor(Math.random() * starColors.length),
        flare: Math.random() < flareShare,
      }
    }

    const buildField = () => {
      // Weak devices get the same sky, thinned out — never a different design.
      const isMobile = window.matchMedia('(max-width: 768px)').matches || tier === 'low'
      const counts = isMobile ? STARFIELD.mobile : STARFIELD.desktop
      farStars = Array.from({ length: counts.far }, () => makeStar(0.15, 0.45, 0))
      midStars = Array.from({ length: counts.mid }, () =>
        makeStar(0.45, 0.75, STARFIELD.flareShare),
      )
      bokehs = Array.from({ length: counts.near }, () => {
        const depth = randomBetween(0.75, 1)
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          depth,
          radius: randomBetween(6, 18) * (isMobile ? 0.8 : 1),
          baseAlpha: randomBetween(0.05, 0.12),
          breathPhase: Math.random() * Math.PI * 2,
          breathSpeed: randomBetween(0.1, 0.22),
          colorIndex: Math.floor(Math.random() * starColors.length),
        }
      })
      hazes = Array.from({ length: counts.haze }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: randomBetween(0.5, 0.8) * Math.max(width, height),
        alpha: randomBetween(0.5, 0.9),
        driftPhase: Math.random() * Math.PI * 2,
        spriteIndex: i % hazeSprites.length,
      }))

      // A faint diagonal band of small puffs — the hint of a galactic plane.
      const bandCount = isMobile ? STARFIELD.bandPuffs.mobile : STARFIELD.bandPuffs.desktop
      for (let i = 0; i < bandCount; i += 1) {
        const t = (i + Math.random() * 0.6) / bandCount
        hazes.push({
          x: t * width,
          y: height * 0.18 + t * height * 0.5 + (Math.random() - 0.5) * height * 0.12,
          radius: randomBetween(0.1, 0.2) * Math.max(width, height),
          alpha: randomBetween(0.35, 0.7),
          driftPhase: Math.random() * Math.PI * 2,
          spriteIndex: i % hazeSprites.length,
        })
      }

      // One distant spiral galaxy in the upper-left field, deepest layer.
      galaxy = {
        x: width * randomBetween(0.14, 0.38),
        y: height * randomBetween(0.16, 0.4),
        depth: 0.22,
        angle: randomBetween(-0.5, 0.5),
      }
    }

    const spawnMeteor = () => {
      const angle = randomBetween(25, 45) * (Math.PI / 180)
      const direction = Math.random() < 0.5 ? 1 : -1
      const speed = randomBetween(850, 1350)
      meteor = {
        x: direction > 0 ? randomBetween(-60, width * 0.5) : randomBetween(width * 0.5, width + 60),
        y: randomBetween(-30, height * 0.4),
        vx: Math.cos(angle) * speed * direction,
        vy: Math.sin(angle) * speed,
        age: 0,
        maxAge: randomBetween(0.9, 1.4),
        trail: randomBetween(140, 220),
      }
    }

    // — Draw helpers (shared by the live loop and the static fallback) —

    const drawHaze = (time: number) => {
      for (const haze of hazes) {
        const sprite = hazeSprites[haze.spriteIndex]
        if (!sprite) continue
        const t = time * 0.001
        const dx = Math.sin(t * 0.008 + haze.driftPhase) * width * 0.04
        const dy = Math.cos(t * 0.006 + haze.driftPhase) * height * 0.05
        ctx.globalAlpha = haze.alpha
        ctx.drawImage(
          sprite,
          haze.x + dx - haze.radius,
          haze.y + dy - haze.radius,
          haze.radius * 2,
          haze.radius * 2,
        )
      }
      ctx.globalAlpha = 1
    }

    /** Screen position of a field object after every parallax source. */
    const project = (obj: { x: number; y: number; depth: number }, camX: number, camY: number, pad: number) => ({
      sx: wrap(obj.x + (camX + panX) * obj.depth, width, pad),
      sy: wrap(
        obj.y + (camY + panY * 0.6) * obj.depth + window.scrollY * STARFIELD.scrollParallax * obj.depth,
        height,
        pad,
      ),
    })

    const drawStars = (
      stars: Star[],
      time: number,
      camX: number,
      camY: number,
      blur: number,
      halo: boolean,
    ) => {
      for (const star of stars) {
        const { sx, sy } = project(star, camX, camY, 8)
        const twinkle = 0.78 + 0.22 * Math.sin(time * 0.001 * star.twinkleSpeed + star.twinklePhase)
        const alpha = clamp01(star.baseAlpha * twinkle)
        const rgb = starColors[star.colorIndex]
        const streak = blur * star.depth

        if (streak > 2) {
          // Motion blur: the star smears opposite the scroll direction.
          ctx.strokeStyle = `rgba(${rgb}, ${alpha})`
          ctx.lineWidth = star.radius * 2
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(sx, sy)
          ctx.lineTo(sx, sy - streak * Math.sign(velocity))
          ctx.stroke()
          continue
        }

        // Soft luminous halo under the focused layer — stars glow, not just dot.
        if (halo && !star.flare && glowSprite) {
          const reach = star.radius * 3.5
          ctx.globalAlpha = alpha * 0.35
          ctx.drawImage(glowSprite, sx - reach, sy - reach, reach * 2, reach * 2)
          ctx.globalAlpha = 1
        }

        ctx.fillStyle = `rgba(${rgb}, ${alpha})`
        ctx.beginPath()
        ctx.arc(sx, sy, star.radius, 0, Math.PI * 2)
        ctx.fill()

        if (star.flare) {
          // 4-point diffraction cross + a soft halo, like a lens catching light.
          const reach = star.radius * (5 + twinkle * 3)
          if (glowSprite) {
            ctx.globalAlpha = alpha * 0.55
            ctx.drawImage(glowSprite, sx - reach, sy - reach, reach * 2, reach * 2)
            ctx.globalAlpha = 1
          }
          ctx.strokeStyle = `rgba(${bone}, ${alpha * 0.5})`
          ctx.lineWidth = 0.7
          ctx.beginPath()
          ctx.moveTo(sx - reach, sy)
          ctx.lineTo(sx + reach, sy)
          ctx.moveTo(sx, sy - reach)
          ctx.lineTo(sx, sy + reach)
          ctx.stroke()
        }
      }
    }

    const drawBokehs = (time: number, camX: number, camY: number, blur: number) => {
      for (const disc of bokehs) {
        const sprite = bokehSprites[disc.colorIndex]
        if (!sprite) continue
        // Slow focus breathing: the disc swells and settles like a lens hunting.
        const breath = 1 + 0.12 * Math.sin(time * 0.001 * disc.breathSpeed + disc.breathPhase)
        const radius = disc.radius * breath
        const { sx, sy } = project(disc, camX, camY, radius + 6)
        const streak = blur * disc.depth

        ctx.globalAlpha = disc.baseAlpha
        ctx.drawImage(sprite, sx - radius, sy - radius, radius * 2, radius * 2)
        if (streak > 3) {
          // Double exposure sells the motion blur on out-of-focus discs.
          ctx.globalAlpha = disc.baseAlpha * 0.5
          const offset = streak * Math.sign(velocity)
          ctx.drawImage(sprite, sx - radius, sy - offset - radius, radius * 2, radius * 2)
        }
      }
      ctx.globalAlpha = 1
    }

    const spawnSatellite = () => {
      const speed = randomBetween(...STARFIELD.satelliteSpeed)
      const fromLeft = Math.random() < 0.5
      const angle = randomBetween(-12, 12) * (Math.PI / 180)
      satellite = {
        x: fromLeft ? -12 : width + 12,
        y: randomBetween(height * 0.08, height * 0.7),
        vx: Math.cos(angle) * speed * (fromLeft ? 1 : -1),
        vy: Math.sin(angle) * speed,
        blinkPhase: Math.random() * Math.PI * 2,
      }
    }

    const drawSatellite = (dt: number, time: number) => {
      if (!satellite) {
        if (time >= nextSatelliteAt) spawnSatellite()
        return
      }
      satellite.x += satellite.vx * dt
      satellite.y += satellite.vy * dt
      if (satellite.x < -20 || satellite.x > width + 20) {
        satellite = null
        nextSatelliteAt = time + randomBetween(...STARFIELD.satelliteDelay)
        return
      }
      // Steady body + a beacon that blinks roughly once a second.
      ctx.fillStyle = `rgba(${bone}, 0.75)`
      ctx.beginPath()
      ctx.arc(satellite.x, satellite.y, 0.9, 0, Math.PI * 2)
      ctx.fill()
      const blink = Math.sin(time * 0.006 + satellite.blinkPhase)
      if (blink > 0.82) {
        ctx.fillStyle = `rgba(${accent}, ${((blink - 0.82) / 0.18) * 0.9})`
        ctx.beginPath()
        ctx.arc(satellite.x, satellite.y, 2.2, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const drawMeteor = (dt: number, time: number) => {
      if (!meteor) {
        if (time >= nextMeteorAt) spawnMeteor()
        return
      }
      meteor.age += dt
      if (meteor.age >= meteor.maxAge) {
        meteor = null
        nextMeteorAt = time + randomBetween(...STARFIELD.meteorDelay)
        return
      }
      meteor.x += meteor.vx * dt
      meteor.y += meteor.vy * dt
      // Sine envelope: fade in, burn, fade out.
      const glow = Math.sin(Math.PI * (meteor.age / meteor.maxAge))
      const speed = Math.hypot(meteor.vx, meteor.vy)
      const tailX = meteor.x - (meteor.vx / speed) * meteor.trail
      const tailY = meteor.y - (meteor.vy / speed) * meteor.trail
      const gradient = ctx.createLinearGradient(meteor.x, meteor.y, tailX, tailY)
      gradient.addColorStop(0, `rgba(${bone}, ${0.85 * glow})`)
      gradient.addColorStop(0.25, `rgba(${accent}, ${0.4 * glow})`)
      gradient.addColorStop(1, `rgba(${accent}, 0)`)
      ctx.strokeStyle = gradient
      ctx.lineWidth = 1.4
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(meteor.x, meteor.y)
      ctx.lineTo(tailX, tailY)
      ctx.stroke()
      ctx.fillStyle = `rgba(${bone}, ${glow})`
      ctx.beginPath()
      ctx.arc(meteor.x, meteor.y, 1.3, 0, Math.PI * 2)
      ctx.fill()
    }

    /** The distant galaxy: deepest parallax layer, rotating imperceptibly. */
    const drawGalaxy = (time: number, camX: number, camY: number) => {
      if (!galaxy || !galaxySprite) return
      const { sx, sy } = project(galaxy, camX, camY, 140)
      const size = Math.max(width, height) * 0.17
      ctx.save()
      ctx.translate(sx, sy)
      ctx.rotate(galaxy.angle + time * 0.00002)
      ctx.globalAlpha = 0.6
      ctx.drawImage(galaxySprite, -size, -size, size * 2, size * 2)
      ctx.restore()
      ctx.globalAlpha = 1
    }

    const render = (time: number) => {
      const dt = Math.min(0.05, lastTime ? (time - lastTime) / 1000 : 0.016)
      lastTime = time

      // Smoothed scroll velocity → depth-scaled motion blur; sharp spikes feed
      // the hyper-jump burst, which eases in and bleeds off slowly.
      const y = window.scrollY
      velocity = velocity * 0.82 + (y - lastScrollY) * 0.18
      lastScrollY = y
      const rawBurst = clamp01((Math.abs(velocity) - STARFIELD.warpBurstAt) / 60)
      burst += (rawBurst - burst) * 0.08
      const blur =
        clamp01(Math.abs(velocity) / STARFIELD.blurAtVelocity) *
        STARFIELD.maxBlur *
        (1 + burst * 1.3)

      // Never-repeating Lissajous camera drift.
      const t = time * 0.001
      const camX = Math.sin((t * Math.PI * 2) / STARFIELD.driftPeriodX) * STARFIELD.driftAmp
      const camY = Math.sin((t * Math.PI * 2) / STARFIELD.driftPeriodY) * STARFIELD.driftAmp * 0.6

      // Pointer pan eases toward its target — a heavy, cinematic follow.
      panX += (panTargetX - panX) * STARFIELD.pointerLerp
      panY += (panTargetY - panY) * STARFIELD.pointerLerp

      ctx.clearRect(0, 0, width, height)
      drawHaze(time)
      drawGalaxy(time, camX, camY)
      drawStars(farStars, time, camX, camY, blur, false)
      drawStars(midStars, time, camX, camY, blur, true)
      drawBokehs(time, camX, camY, blur)
      drawSatellite(dt, time)
      drawMeteor(dt, time)

      // Hyper-jump wash: an additive cold glow from the frame centre.
      if (burst > 0.02 && warpGlow) {
        const reach = Math.max(width, height) * 0.85
        ctx.globalCompositeOperation = 'lighter'
        ctx.globalAlpha = burst * 0.14
        ctx.drawImage(warpGlow, width / 2 - reach, height / 2 - reach, reach * 2, reach * 2)
        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 1
      }

      raf = requestAnimationFrame(render)
    }

    /** Reduced-motion fallback: one considered still frame, no loop. */
    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height)
      drawHaze(0)
      drawGalaxy(0, 0, 0)
      for (const star of [...farStars, ...midStars]) {
        ctx.fillStyle = `rgba(${starColors[star.colorIndex]}, ${clamp01(star.baseAlpha)})`
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fill()
      }
      for (const disc of bokehs) {
        const sprite = bokehSprites[disc.colorIndex]
        if (!sprite) continue
        ctx.globalAlpha = disc.baseAlpha
        ctx.drawImage(sprite, disc.x - disc.radius, disc.y - disc.radius, disc.radius * 2, disc.radius * 2)
      }
      ctx.globalAlpha = 1
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
      buildField()
      // Resize clears the canvas; the loop repaints next frame, but the
      // reduced-motion path draws only once, so redraw it here.
      if (reduced) drawStatic()
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

    const onVisibility = () => {
      if (document.hidden) stop()
      else if (!reduced) start()
    }

    const onPointerMove = (event: PointerEvent) => {
      panTargetX = (event.clientX / width - 0.5) * 2 * STARFIELD.pointerPan
      panTargetY = (event.clientY / height - 0.5) * 2 * STARFIELD.pointerPan
    }

    resize()
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibility)
    if (!reduced && pointerFine) {
      window.addEventListener('pointermove', onPointerMove, { passive: true })
    }

    if (reduced) {
      drawStatic()
    } else {
      nextMeteorAt = performance.now() + randomBetween(...STARFIELD.meteorFirstDelay)
      nextSatelliteAt = performance.now() + randomBetween(6000, 12000)
      start()
    }

    return () => {
      stop()
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pointermove', onPointerMove)
    }
  }, [reduced, pointerFine, tier])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  )
}
