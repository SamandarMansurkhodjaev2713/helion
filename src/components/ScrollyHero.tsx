import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useI18n } from '../i18n'
import { MOTION, SCENE_NO, SECTION_ID, asset } from '../lib/constants'
import { clamp01, easeOutCubic } from '../lib/easing'
import { useMediaQuery, useReducedMotion } from '../lib/hooks'
import CineButton from './primitives/CineButton'
import HeroAtmosphere from './hero/HeroAtmosphere'

/** Timestamp (s) where clip 1 (push-in to helmet) ends inside scrub.mp4. */
export const CLIP1_END = 8.0417
/** Full duration of scrub.mp4 — fallback until metadata loads. */
const FALLBACK_DURATION = 18.0833

/** Mobile cinema frame: the footage starts pulled back to this scale and the
 *  "camera" pushes in to full frame across the first stretch of scroll. */
const FRAME_SCALE_FROM = 0.85
/** Scroll progress at which the mobile push-in reaches full frame. */
const FRAME_ZOOM_END = 0.3
/** Progress at which the closing cut to the next scene begins. */
const CUT_START = 0.96

/** Map pinned-section progress (0–1) to video time per the story script. */
function progressToTime(p: number, duration: number): number {
  if (p <= 0.01) return 0
  if (p < 0.4) return ((p - 0.01) / 0.39) * CLIP1_END
  if (p < 0.63) return CLIP1_END
  if (p < 0.92) return CLIP1_END + ((p - 0.63) / 0.29) * (duration - CLIP1_END)
  return duration
}

/** Scroll-mapped reveal: element pours in across [start, start+span] of a
 *  hold-progress value. Fully reversible — scrolling back pours it out. */
function rev(hp: number, start: number, span = 0.18, dy = 24, blur = 8): CSSProperties {
  const e = easeOutCubic(clamp01((hp - start) / span))
  return {
    opacity: e,
    transform: `translateY(${(dy * (1 - e)).toFixed(2)}px)`,
    filter: `blur(${(blur * (1 - e)).toFixed(2)}px)`,
  }
}

/** Block B focus-pull variant: deeper offset, heavy blur-to-sharp. */
const revB = (hp: number, start: number, span = 0.18) => rev(hp, start, span, 28, 14)

/** A heading line that rises out from under a mask as the block pours in. */
function MaskLine({
  children,
  hp,
  start,
  className = '',
}: {
  children: React.ReactNode
  hp: number
  start: number
  className?: string
}) {
  const e = easeOutCubic(clamp01((hp - start) / 0.2))
  return (
    <span className="block overflow-hidden [clip-path:inset(-25%_-25%_0_-25%)]">
      <span
        className={`block will-change-transform ${className}`}
        style={{
          transform: `translateY(${((1 - e) * 105).toFixed(2)}%)`,
          opacity: e,
        }}
      >
        {children}
      </span>
    </span>
  )
}

function Stat({ value, label, style }: { value: string; label: string; style: CSSProperties }) {
  return (
    <div style={style}>
      <div className="font-mono text-xl font-medium tracking-tight text-bone">{value}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-wide text-bone/40">{label}</div>
    </div>
  )
}

/** Corner tick of the mobile cinema frame. */
function FrameTick({ position }: { position: string }) {
  const edges = [
    position.includes('top') ? 'border-t' : 'border-b',
    position.includes('left') ? 'border-l' : 'border-r',
  ].join(' ')
  return <span aria-hidden className={`absolute ${position} h-3 w-3 ${edges} border-accent/60`} />
}

/** Optical-sight scale down the right edge; the runner tracks hero progress. */
function SightScale({ progress }: { progress: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-4 top-1/2 hidden h-[38vh] -translate-y-1/2 md:block"
    >
      <div className="relative h-full w-8">
        <span className="absolute right-0 top-0 h-full w-px bg-white/10" />
        {Array.from({ length: 11 }, (_, index) => (
          <span
            key={index}
            className={`absolute right-0 h-px ${index % 5 === 0 ? 'w-3 bg-white/25' : 'w-1.5 bg-white/12'}`}
            style={{ top: `${index * 10}%` }}
          />
        ))}
        {/* Runner */}
        <span
          className="absolute right-0 flex items-center gap-1.5 transition-[top] duration-200 ease-out"
          style={{ top: `${progress * 100}%` }}
        >
          <span className="font-mono text-[9px] tabular-nums text-accent/80">
            {Math.round(progress * 100)}
          </span>
          <span className="h-px w-4 bg-accent" />
        </span>
      </div>
    </div>
  )
}

export default function ScrollyHero() {
  const { t } = useI18n()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const reduced = useReducedMotion()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const introRef = useRef<HTMLVideoElement>(null)
  const currentTimeRef = useRef(0)

  const [loaded, setLoaded] = useState(false)
  const [p, setP] = useState(0)

  // Idle intro layer: ambient loop over the frozen first frame. Fades out fast
  // on first scroll input; fades back in only after the lerped scrub time has
  // settled at the start, always restarting from frame 0 (pixel-identical to
  // scrub frame 0) so the handoff never jumps.
  const [introOn, setIntroOn] = useState(true)
  useEffect(() => {
    const intro = introRef.current
    if (!intro) return
    if (introOn) {
      intro.currentTime = 0
      intro.play().catch(() => {})
      return
    }
    // let the 0.4s crossfade finish before freezing the loop
    const timeout = window.setTimeout(() => intro.pause(), 450)
    return () => window.clearTimeout(timeout)
  }, [introOn])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onReady = () => setLoaded(true)
    if (video.readyState >= 4) onReady()
    video.addEventListener('canplaythrough', onReady, { once: true })
    // Never leave a visitor staring at a loader: if the scrub has not buffered
    // in time (slow network, throttled mobile), reveal the poster frame and let
    // the story play out over it.
    const failsafe = window.setTimeout(() => setLoaded(true), 3000)

    let raf = 0
    let running = false
    const tick = () => {
      const wrapper = wrapperRef.current
      if (wrapper) {
        const rect = wrapper.getBoundingClientRect()
        const scrollable = rect.height - window.innerHeight
        const progress = clamp01(-rect.top / scrollable)

        // quantized so React only re-renders when progress visibly moves
        setP(Math.round(progress * 1000) / 1000)

        // intro re-entry waits for the scrub lerp to settle at the start
        setIntroOn(progress < 0.003 && currentTimeRef.current < 0.05)

        // Scrub with inertia: lerp currentTime toward the mapped target
        const duration = video.duration || FALLBACK_DURATION
        const target = progressToTime(progress, duration)
        const cur = currentTimeRef.current
        const next = cur + (target - cur) * MOTION.scrubLerp
        if (Math.abs(next - cur) > 0.0005) {
          currentTimeRef.current = next
          video.currentTime = next
        } else if (cur !== target) {
          currentTimeRef.current = target
          video.currentTime = target
        }
      }
      raf = requestAnimationFrame(tick)
    }

    const start = () => {
      if (running) return
      running = true
      raf = requestAnimationFrame(tick)
    }
    const stop = () => {
      if (!running) return
      running = false
      cancelAnimationFrame(raf)
    }

    // Only run the scrub loop while the pinned hero is on screen.
    const wrapper = wrapperRef.current
    const observer = wrapper
      ? new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()))
      : null
    if (observer && wrapper) observer.observe(wrapper)
    else start()

    return () => {
      stop()
      observer?.disconnect()
      window.clearTimeout(failsafe)
      video.removeEventListener('canplaythrough', onReady)
    }
  }, [])

  const blockA = p < 0.01

  // Block B: cascade pours in across p 0.40→0.52, reading window to 0.59,
  // then a long gentle exit (fade + 20px upward drift) across 0.59→0.65
  const hpB = clamp01((p - 0.4) / 0.12)
  const fadeB = p < 0.59 ? 1 : 1 - clamp01((p - 0.59) / 0.06)

  // Block C: cascade pours in across p 0.92→1.0
  const hpC = clamp01((p - 0.92) / 0.08)

  // Mobile cinema frame: footage starts pulled back inside a ticked frame, the
  // camera pushes in to full bleed across the first scroll stretch.
  const frameZoom = easeOutCubic(clamp01(p / FRAME_ZOOM_END))
  const frameScale = isMobile ? FRAME_SCALE_FROM + (1 - FRAME_SCALE_FROM) * frameZoom : 1
  const frameFade = isMobile ? 1 - frameZoom : 0

  // The closing cut: the frame darkens away as scene 02 is struck through it.
  const cut = clamp01((p - CUT_START) / (1 - CUT_START))

  return (
    <div ref={wrapperRef} id={SECTION_ID.hero} className="relative h-[600vh]">
      <div className="sticky top-0 h-[100dvh] overflow-hidden bg-void grain vignette">
        {/* Footage layer — breathes at rest, scaled back into a frame on mobile */}
        <div
          className="absolute inset-0 will-change-transform"
          style={{
            transform: `scale(${frameScale.toFixed(4)})`,
            // The idle frame never sits perfectly still: a slow, shallow push.
            animation: reduced || p > 0.02 ? undefined : 'hero-breathe 11s ease-in-out infinite',
          }}
        >
          <video
            ref={videoRef}
            src={asset('scrub.mp4')}
            poster={asset('poster_start.jpg')}
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />

          {/* Idle intro: ambient loop of the first frame, above scrub, below text */}
          <video
            ref={introRef}
            src={asset('intro_loop.mp4')}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="absolute inset-0 z-20 h-full w-full object-cover object-center"
            style={{
              opacity: introOn ? 1 : 0,
              transition: introOn ? 'opacity 0.6s ease-in-out' : 'opacity 0.4s ease-out',
            }}
          />

          {/* Frame border + corner ticks, visible while the camera is pulled back */}
          {isMobile && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-30 border border-white/15"
              style={{ opacity: frameFade }}
            >
              <FrameTick position="-left-px -top-px" />
              <FrameTick position="-right-px -top-px" />
              <FrameTick position="-left-px -bottom-px" />
              <FrameTick position="-right-px -bottom-px" />
            </div>
          )}
        </div>

        {/* Dust in the key light — only while the frame is held at rest */}
        <HeroAtmosphere className="absolute inset-0 z-20 h-full w-full transition-opacity duration-700" />

        {/* Cold glow behind the finale figure (mirrors --accent) */}
        <div
          className="pointer-events-none absolute inset-0 z-30 bg-[radial-gradient(ellipse_55%_45%_at_50%_100%,rgba(111,211,242,0.12),transparent_70%)]"
          style={{ opacity: hpC * 0.5 }}
        />

        {/* Bottom fade: the video frame dissolves into the page void — no hard seam
            where the pinned hero hands over to the sections below */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-64 bg-gradient-to-b from-transparent via-void/55 to-void md:h-80" />

        {/* Mobile readability: gentle full dim + strong top/bottom scrims, so copy
            stays legible even over the brightest parts of the suit */}
        <div className="pointer-events-none absolute inset-0 z-40 bg-void/25 md:hidden" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-[55%] bg-gradient-to-b from-void/85 via-void/35 to-transparent md:hidden" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-[60%] bg-gradient-to-t from-void/90 via-void/40 to-transparent md:hidden" />

        {/* Loading state until the video can play through */}
        <div
          className={`absolute inset-0 z-[60] flex items-center justify-center bg-void transition-opacity duration-700 ${
            loaded ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="h-px w-24 overflow-hidden bg-white/20">
              <div className="h-full w-1/2 animate-pulse bg-white/80" />
            </div>
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-bone/40">
              Helion
            </span>
          </div>
        </div>

        {/* Production slate — the frame is a take on a reel */}
        <div
          className={`pointer-events-none absolute left-5 top-[13%] z-content font-mono text-[9px] uppercase leading-relaxed tracking-[0.22em] text-bone/40 transition-opacity duration-700 md:left-[7%] md:top-[15%] ${
            blockA ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span className="block border-l border-accent/40 pl-2.5">
            SCENE {SCENE_NO[SECTION_ID.hero]} · TAKE 01
          </span>
          <span className="mt-1 block pl-2.5 text-bone/25">HELION · 35MM · 24FPS</span>
        </div>

        <SightScale progress={p} />

        {/* ——— Block A: split hero — figure centred, film titles at the sides ——— */}
        <div
          style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
          className={`pointer-events-none absolute inset-0 z-content transition-all duration-700 ${
            blockA ? 'opacity-100 blur-0 translate-y-0' : 'opacity-0 blur-[6px] -translate-y-10'
          }`}
        >
          {/* Left: main title */}
          <div className="absolute text-left max-md:inset-x-0 max-md:top-[19%] max-md:px-6 md:left-[7%] md:top-[25%] md:max-w-[620px]">
            <h1 className="title-cine-lg text-bone">
              <MaskLine hp={1} start={0}>
                {t.hero.titleLine1}
              </MaskLine>
              <MaskLine hp={1} start={0} className="text-accent">
                {t.hero.titleEmphasis}
              </MaskLine>
              <MaskLine hp={1} start={0}>
                {t.hero.titleLine3}
              </MaskLine>
            </h1>
            <p className="mt-6 max-w-[320px] text-sm leading-relaxed text-bone/60 max-md:text-bone/80 max-md:[text-shadow:0_1px_14px_rgba(0,0,0,0.95),0_0_4px_rgba(0,0,0,0.8)]">
              {t.hero.lead}
            </p>
          </div>

          {/* Right: tagline */}
          <div className="absolute right-[7%] top-[25%] hidden max-w-[280px] text-left lg:block">
            <h3 className="text-lg font-extralight uppercase leading-[1.5] tracking-[0.18em] text-bone">
              {t.hero.asideTitle} <span className="text-ice">{t.hero.asideEmphasis}</span>
            </h3>
            <p className="mt-4 font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-bone/45">
              {t.hero.asideBody}
            </p>
          </div>

          {/* Bottom-right: voyage slate */}
          <div className="absolute bottom-[14%] right-[7%] text-right max-md:bottom-[17%] max-md:right-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-steel">
              {t.hero.voyageLabel}
            </p>
            <p className="mt-2 font-extralight leading-none tracking-[0.14em] text-accent text-5xl tabular-nums md:text-6xl">
              {t.hero.voyageYear}
            </p>
          </div>
        </div>

        {/* Scroll hint: label + running droplet on a thin line */}
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-14 z-content flex flex-col items-center gap-2.5 transition-opacity duration-700 ${
            blockA ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-bone/40">
            {t.hero.scrollHint}
          </span>
          <span className="relative block h-9 w-px overflow-hidden bg-white/10">
            <span className="absolute left-0 top-0 h-3.5 w-px bg-accent animate-[hint-drip_1.8s_ease-in-out_infinite]" />
          </span>
        </div>

        {/* ——— Block B: helmet close-up hold — mission briefing on the right ——— */}
        <div
          className="pointer-events-none absolute z-content max-md:inset-x-0 max-md:bottom-[11%] max-md:px-6 md:right-[8%] md:top-1/2 md:max-w-[480px] md:-translate-y-1/2"
          style={{ opacity: fadeB, visibility: hpB > 0 && fadeB > 0 ? 'visible' : 'hidden' }}
        >
          <div style={{ transform: `translateY(${(-20 * (1 - fadeB)).toFixed(2)}px)` }}>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-steel" style={revB(hpB, 0)}>
              {t.hero.missionTag}
            </p>

            <h2 className="title-cine mt-5 text-bone">
              <MaskLine hp={hpB} start={0.1}>
                {t.hero.bLine1}
              </MaskLine>
              <MaskLine hp={hpB} start={0.26}>
                {t.hero.bEmphasisA} <span className="text-accent">{t.hero.bEmphasisB}</span>
              </MaskLine>
            </h2>

            <p className="mt-6 text-[15px] leading-relaxed text-bone/85" style={revB(hpB, 0.44)}>
              {t.hero.bBody1}
            </p>

            {/* Secondary paragraph is desktop-only: on a phone the block must stay
                short enough to breathe over the footage */}
            <p
              className="mt-4 hidden text-sm leading-relaxed text-bone/55 md:block"
              style={revB(hpB, 0.54)}
            >
              {t.hero.bBody2}
            </p>

            <div className="mt-6 h-px w-12 bg-white/20" style={revB(hpB, 0.64)} />

            <div className="mt-5 flex gap-10">
              <Stat value={t.hero.statDistanceValue} label={t.hero.statDistanceLabel} style={revB(hpB, 0.68)} />
              <Stat value={t.hero.statOutboundValue} label={t.hero.statOutboundLabel} style={revB(hpB, 0.75)} />
              <Stat value={t.hero.statCrewValue} label={t.hero.statCrewLabel} style={revB(hpB, 0.82)} />
            </div>
          </div>
        </div>

        {/* ——— Block C: finale — editorial layout around the small figure ——— */}
        <div
          className="pointer-events-none absolute inset-0 z-content"
          style={{ visibility: hpC > 0 ? 'visible' : 'hidden' }}
        >
          <h2 className="title-cine absolute inset-x-0 top-[13%] px-6 text-center text-bone md:top-[12%]">
            <MaskLine hp={hpC} start={0}>
              {t.hero.finaleLine1}
            </MaskLine>
            <MaskLine hp={hpC} start={0.16} className="text-accent">
              {t.hero.finaleEmphasis}
            </MaskLine>
          </h2>

          <div className="max-md:absolute max-md:inset-x-0 max-md:bottom-[10%] max-md:flex max-md:flex-col max-md:gap-7 max-md:px-6 md:contents">
            {/* Left column */}
            <div className="md:absolute md:bottom-[16%] md:left-[7%] md:max-w-[300px]">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-steel" style={rev(hpC, 0.3)}>
                {t.hero.finaleLeftEyebrow}
              </p>
              <p className="mt-3 text-sm text-bone/65" style={rev(hpC, 0.38)}>
                {t.hero.finaleLeftBody}
              </p>
              <div className="mt-5 h-px w-12 bg-white/20" style={rev(hpC, 0.46)} />
              <div className="mt-4 flex gap-10">
                <Stat value={t.hero.finaleSeatsValue} label={t.hero.finaleSeatsLabel} style={rev(hpC, 0.52)} />
                <Stat value={t.hero.finaleDepartureValue} label={t.hero.finaleDepartureLabel} style={rev(hpC, 0.6)} />
              </div>
            </div>

            {/* Right column */}
            <div className="md:absolute md:bottom-[16%] md:right-[7%] md:max-w-[320px]">
              <p className="text-sm text-bone/65" style={rev(hpC, 0.4)}>
                {t.hero.finaleRightBody}
              </p>
              <div style={rev(hpC, 0.52)}>
                <CineButton
                  href={`#${SECTION_ID.contact}`}
                  variant="solid"
                  cursorLabel={t.hero.reserveCta}
                  className="pointer-events-auto mt-6"
                >
                  {t.hero.reserveCta}
                </CineButton>
              </div>
              <div style={rev(hpC, 0.62)}>
                <a
                  href={`#${SECTION_ID.route}`}
                  data-cursor="link"
                  className="tap-target pointer-events-auto mt-5 inline-block font-mono text-[11px] uppercase tracking-[0.18em] text-bone/50 transition-colors hover:text-accent"
                >
                  {t.hero.routeLink}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ——— The cut into scene 02: the frame goes down and the next scene
                number wipes up through it ——— */}
        {cut > 0 && (
          <div aria-hidden className="pointer-events-none absolute inset-0 z-[70]">
            <div className="absolute inset-0 bg-void" style={{ opacity: cut * 0.92 }} />
            <span
              className="absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2 font-mono text-[34vw] font-extralight leading-none tracking-tight text-accent/50 md:text-[15vw]"
              style={{
                // A wipe, not a stroke-dash: `pathLength` is unreliable on text
                // and shreds the glyphs into dots where it is ignored.
                clipPath: `inset(${((1 - cut) * 100).toFixed(1)}% 0 -10% 0)`,
              }}
            >
              {SCENE_NO[SECTION_ID.missions]}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
