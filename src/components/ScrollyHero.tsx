import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useI18n } from '../i18n'
import { SECTION_ID, MOTION, asset } from '../lib/constants'
import { clamp01, easeOutCubic } from '../lib/easing'
import { useMediaQuery } from '../lib/hooks'
import CineButton from './primitives/CineButton'

/** Timestamp (s) where clip 1 (push-in to helmet) ends inside scrub.mp4. */
export const CLIP1_END = 8.0417
/** Full duration of scrub.mp4 — fallback until metadata loads. */
const FALLBACK_DURATION = 18.0833

/** Mobile cinema frame: the footage starts pulled back to this scale and the
 *  "camera" pushes in to full frame across the first stretch of scroll. */
const FRAME_SCALE_FROM = 0.85
/** Scroll progress at which the mobile push-in reaches full frame. */
const FRAME_ZOOM_END = 0.3

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

/** Per-word scroll-mapped cascade for headings. */
function Words({
  text,
  hp,
  start,
  step = 0.08,
  span = 0.18,
  dy = 24,
  blur = 8,
}: {
  text: string
  hp: number
  start: number
  step?: number
  span?: number
  dy?: number
  blur?: number
}) {
  const words = text.split(' ')
  return (
    <>
      {words.map((word, i) => (
        <span key={i}>
          <span className="inline-block" style={rev(hp, start + i * step, span, dy, blur)}>
            {word}
          </span>
          {i < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </>
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

export default function ScrollyHero() {
  const { t } = useI18n()
  const isMobile = useMediaQuery('(max-width: 767px)')
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

  return (
    <div ref={wrapperRef} id={SECTION_ID.hero} className="relative h-[600vh]">
      <div className="sticky top-0 h-[100dvh] overflow-hidden bg-void grain vignette">
        {/* Footage layer — scaled back into a ticked cinema frame on mobile */}
        <div
          className="absolute inset-0 will-change-transform"
          style={frameScale < 1 ? { transform: `scale(${frameScale.toFixed(4)})` } : undefined}
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

        {/* ——— Block A: split hero — figure centred, film titles at the sides ——— */}
        <div
          style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
          className={`pointer-events-none absolute inset-0 z-content transition-all duration-700 ${
            blockA ? 'opacity-100 blur-0 translate-y-0' : 'opacity-0 blur-[6px] -translate-y-10'
          }`}
        >
          {/* Left: main title */}
          <div className="absolute text-left max-md:inset-x-0 max-md:top-[15%] max-md:px-7 md:left-[7%] md:top-[24%] md:max-w-[560px]">
            <h1 className="text-2xl font-extralight uppercase leading-[1.5] tracking-[0.2em] text-bone md:text-[40px] md:leading-[1.4]">
              {t.hero.titleLine1}
              <span className="block text-accent">{t.hero.titleEmphasis}</span>
              {t.hero.titleLine3}
            </h1>
            <p className="mt-5 max-w-[300px] text-sm leading-relaxed text-bone/60 max-md:text-bone/80 max-md:[text-shadow:0_1px_14px_rgba(0,0,0,0.95),0_0_4px_rgba(0,0,0,0.8)]">
              {t.hero.lead}
            </p>
          </div>

          {/* Right: tagline */}
          <div className="absolute right-[7%] top-[24%] hidden max-w-[280px] text-left md:block">
            <h3 className="text-lg font-extralight uppercase leading-[1.5] tracking-[0.18em] text-bone">
              {t.hero.asideTitle} <span className="text-ice">{t.hero.asideEmphasis}</span>
            </h3>
            <p className="mt-4 font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-bone/45">
              {t.hero.asideBody}
            </p>
          </div>

          {/* Bottom-right: voyage slate */}
          <div className="absolute bottom-[13%] right-[7%] text-right max-md:bottom-[16%]">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-steel">
              {t.hero.voyageLabel}
            </p>
            <p className="mt-2 font-extralight leading-none tracking-[0.14em] text-accent text-4xl tabular-nums md:text-5xl">
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
          className="pointer-events-none absolute z-content max-md:inset-x-0 max-md:bottom-[10%] max-md:px-7 md:right-[8%] md:top-1/2 md:max-w-[460px] md:-translate-y-1/2"
          style={{ opacity: fadeB, visibility: hpB > 0 && fadeB > 0 ? 'visible' : 'hidden' }}
        >
          <div style={{ transform: `translateY(${(-20 * (1 - fadeB)).toFixed(2)}px)` }}>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-steel" style={revB(hpB, 0)}>
              {t.hero.missionTag}
            </p>

            <h2 className="mt-5 text-[26px] font-extralight uppercase leading-[1.4] tracking-[0.16em] text-bone md:text-4xl">
              <Words text={t.hero.bLine1} hp={hpB} start={0.1} dy={28} blur={14} />
              <br />
              <span>
                <span className="inline-block" style={revB(hpB, 0.26)}>
                  {t.hero.bEmphasisA}
                </span>{' '}
                <span className="inline-block text-accent" style={revB(hpB, 0.34)}>
                  {t.hero.bEmphasisB}
                </span>
              </span>
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
          <h2 className="absolute inset-x-0 top-[12%] px-7 text-center text-[22px] font-extralight uppercase leading-[1.5] tracking-[0.16em] text-bone md:top-[11%] md:text-4xl md:leading-[1.45]">
            <Words text={t.hero.finaleLine1} hp={hpC} start={0} step={0.06} />
            <span className="mt-1 block text-accent">
              <Words text={t.hero.finaleEmphasis} hp={hpC} start={0.18} step={0.04} />
            </span>
          </h2>

          <div className="max-md:absolute max-md:inset-x-0 max-md:bottom-[9%] max-md:flex max-md:flex-col max-md:gap-7 max-md:px-7 md:contents">
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
                  className="pointer-events-auto mt-5 inline-block font-mono text-[11px] uppercase tracking-[0.18em] text-bone/50 transition-colors hover:text-accent"
                >
                  {t.hero.routeLink}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
