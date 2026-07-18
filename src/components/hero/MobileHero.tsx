import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../../i18n'
import { SCENE_NO, SECTION_ID } from '../../lib/constants'
import { clamp01, easeOutCubic } from '../../lib/easing'
import CineButton from '../primitives/CineButton'
import HeroFrames from './HeroFrames'
import { MOBILE_SCRIPT, footagePosition } from './heroScript'
import { FrameTick, MaskLine, Stat, rev, revB } from './heroMotion'

/**
 * Story beats as fractions of the pinned scroll. The phone gets the same three
 * acts as the desktop cut, but in a third of the distance: seven screens of
 * pinned scrolling is a lot to ask of a thumb.
 */
const BEATS = {
  /** Cinema frame opens from pulled-back to full bleed. */
  frameZoomEnd: 0.22,
  /** Act I — the title. */
  titleOut: 0.2,
  /** Act II — the mission briefing. */
  briefIn: 0.3,
  briefSpan: 0.12,
  briefOut: 0.56,
  briefFade: 0.07,
  /** Act III — the finale, held well before the cut. */
  finaleIn: 0.68,
  finaleSpan: 0.1,
  /** The cut into scene 02. */
  cut: 0.95,
} as const

/** Cinema frame: how far back the plate starts before the camera pushes in. */
const FRAME_SCALE_FROM = 0.85

/**
 * The hero, cut for phones.
 *
 * This is the same footage the desktop cut scrubs and the same story script
 * (`MOBILE_SCRIPT`) — the figure approached, held, then left small against a
 * world. Only the projector differs: a phone cannot seek inside the video fast
 * enough to scrub it, so the take is played back as a pre-decoded frame
 * sequence (see `HeroFrames`). Nothing about the shot is simplified; it is the
 * same film, threaded through a projector the device can actually turn.
 */
export default function MobileHero() {
  const { t } = useI18n()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [p, setP] = useState(0)

  // One rAF-throttled scroll reader; paused whenever the hero is off screen.
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    let frame = 0
    let visible = true

    const measure = () => {
      frame = 0
      const rect = wrapper.getBoundingClientRect()
      const scrollable = rect.height - window.innerHeight
      if (scrollable <= 0) return
      setP(Math.round(clamp01(-rect.top / scrollable) * 1000) / 1000)
    }
    const schedule = () => {
      if (!visible || frame) return
      frame = requestAnimationFrame(measure)
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) schedule()
    })
    observer.observe(wrapper)

    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  // — Camera —
  const frameZoom = easeOutCubic(clamp01(p / BEATS.frameZoomEnd))
  const frameScale = FRAME_SCALE_FROM + (1 - FRAME_SCALE_FROM) * frameZoom
  const frameFade = 1 - frameZoom

  // The take itself carries the push-in and the pull-back — the only camera
  // move added here is the cinema frame opening out at the very start.
  const footage = footagePosition(p, MOBILE_SCRIPT)

  // — Acts —
  const actI = p < BEATS.titleOut
  const hpB = clamp01((p - BEATS.briefIn) / BEATS.briefSpan)
  const fadeB = p < BEATS.briefOut ? 1 : 1 - clamp01((p - BEATS.briefOut) / BEATS.briefFade)
  const hpC = clamp01((p - BEATS.finaleIn) / BEATS.finaleSpan)
  const cut = clamp01((p - BEATS.cut) / (1 - BEATS.cut))

  return (
    <div ref={wrapperRef} id={SECTION_ID.hero} className="relative h-[320vh]">
      <div className="sticky top-0 h-[100dvh] overflow-hidden bg-void grain vignette">
        {/* Plate layer — the camera lives here */}
        <div
          className="absolute inset-0 will-change-transform"
          style={{ transform: `scale(${frameScale.toFixed(4)})` }}
        >
          <HeroFrames
            position={footage}
            label={t.hero.footageAlt}
            className="absolute inset-0 h-full w-full"
          />

          {/* The frame the camera pulls out of */}
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
        </div>

        {/* Cold glow under the finale figure (mirrors --accent) */}
        <div
          className="pointer-events-none absolute inset-0 z-30 bg-[radial-gradient(ellipse_60%_45%_at_50%_100%,rgba(111,211,242,0.14),transparent_70%)]"
          style={{ opacity: hpC * 0.6 }}
        />

        {/* Hand-off into the page void — no hard seam under the pinned hero */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-56 bg-gradient-to-b from-transparent via-void/55 to-void" />

        {/* Legibility: a gentle overall dim plus strong top and bottom scrims,
            so copy holds up over the brightest parts of the suit */}
        <div className="pointer-events-none absolute inset-0 z-40 bg-void/25" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-[55%] bg-gradient-to-b from-void/85 via-void/35 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-[60%] bg-gradient-to-t from-void/90 via-void/40 to-transparent" />

        {/* Production slate */}
        <div
          className="pointer-events-none absolute left-5 top-[13%] z-content font-mono text-[9px] uppercase leading-relaxed tracking-[0.22em] text-bone/40 transition-opacity duration-700"
          style={{ opacity: actI ? 1 : 0 }}
        >
          <span className="block border-l border-accent/40 pl-2.5">
            SCENE {SCENE_NO[SECTION_ID.hero]} · TAKE 01
          </span>
          <span className="mt-1 block pl-2.5 text-bone/25">HELION · 35MM · 24FPS</span>
        </div>

        {/* ——— Act I: the title ——— */}
        <div
          className="pointer-events-none absolute inset-x-0 top-[19%] z-content px-6 transition-all duration-700 ease-cinematic"
          style={{
            opacity: actI ? 1 : 0,
            transform: actI ? 'translateY(0)' : 'translateY(-2.5rem)',
            filter: actI ? 'blur(0)' : 'blur(6px)',
          }}
        >
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
          <p className="mt-6 max-w-[320px] text-sm leading-relaxed text-bone/80 [text-shadow:0_1px_14px_rgba(0,0,0,0.95),0_0_4px_rgba(0,0,0,0.8)]">
            {t.hero.lead}
          </p>
        </div>

        {/* Voyage slate */}
        <div
          className="pointer-events-none absolute bottom-[17%] right-6 z-content text-right transition-opacity duration-700"
          style={{ opacity: actI ? 1 : 0 }}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-steel">
            {t.hero.voyageLabel}
          </p>
          <p className="mt-2 font-extralight leading-none tracking-[0.14em] text-accent text-5xl tabular-nums">
            {t.hero.voyageYear}
          </p>
        </div>

        {/* Scroll hint */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-14 z-content flex flex-col items-center gap-2.5 transition-opacity duration-700"
          style={{ opacity: actI ? 1 : 0 }}
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-bone/40">
            {t.hero.scrollHint}
          </span>
          <span className="relative block h-9 w-px overflow-hidden bg-white/10">
            <span className="absolute left-0 top-0 h-3.5 w-px bg-accent animate-[hint-drip_1.8s_ease-in-out_infinite]" />
          </span>
        </div>

        {/* ——— Act II: the briefing ——— */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-[11%] z-content px-6"
          style={{ opacity: fadeB, visibility: hpB > 0 && fadeB > 0 ? 'visible' : 'hidden' }}
        >
          <div style={{ transform: `translateY(${(-20 * (1 - fadeB)).toFixed(2)}px)` }}>
            <p
              className="font-mono text-[10px] uppercase tracking-[0.3em] text-steel"
              style={revB(hpB, 0)}
            >
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

            <div className="mt-6 h-px w-12 bg-white/20" style={revB(hpB, 0.64)} />

            <div className="mt-5 flex gap-8">
              <Stat
                value={t.hero.statDistanceValue}
                label={t.hero.statDistanceLabel}
                style={revB(hpB, 0.68)}
              />
              <Stat
                value={t.hero.statOutboundValue}
                label={t.hero.statOutboundLabel}
                style={revB(hpB, 0.75)}
              />
              <Stat
                value={t.hero.statCrewValue}
                label={t.hero.statCrewLabel}
                style={revB(hpB, 0.82)}
              />
            </div>
          </div>
        </div>

        {/* ——— Act III: the finale ——— */}
        <div
          className="pointer-events-none absolute inset-0 z-content"
          style={{ visibility: hpC > 0 ? 'visible' : 'hidden' }}
        >
          <h2 className="title-cine absolute inset-x-0 top-[13%] px-6 text-center text-bone">
            <MaskLine hp={hpC} start={0}>
              {t.hero.finaleLine1}
            </MaskLine>
            <MaskLine hp={hpC} start={0.16} className="text-accent">
              {t.hero.finaleEmphasis}
            </MaskLine>
          </h2>

          <div className="absolute inset-x-0 bottom-[10%] flex flex-col gap-6 px-6">
            <div>
              <p
                className="font-mono text-[10px] uppercase tracking-[0.3em] text-steel"
                style={rev(hpC, 0.3)}
              >
                {t.hero.finaleLeftEyebrow}
              </p>
              <div className="mt-4 flex gap-10">
                <Stat
                  value={t.hero.finaleSeatsValue}
                  label={t.hero.finaleSeatsLabel}
                  style={rev(hpC, 0.44)}
                />
                <Stat
                  value={t.hero.finaleDepartureValue}
                  label={t.hero.finaleDepartureLabel}
                  style={rev(hpC, 0.52)}
                />
              </div>
            </div>

            <p className="text-sm leading-relaxed text-bone/70" style={rev(hpC, 0.4)}>
              {t.hero.finaleRightBody}
            </p>

            <div style={rev(hpC, 0.56)}>
              <CineButton
                href={`#${SECTION_ID.contact}`}
                variant="solid"
                cursorLabel={t.hero.reserveCta}
                className="pointer-events-auto"
              >
                {t.hero.reserveCta}
              </CineButton>
            </div>
          </div>
        </div>

        {/* ——— The cut into scene 02 ——— */}
        {cut > 0 && (
          <div aria-hidden className="pointer-events-none absolute inset-0 z-[70]">
            <div className="absolute inset-0 bg-void" style={{ opacity: cut * 0.92 }} />
            <span
              className="absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2 font-mono text-[34vw] font-extralight leading-none tracking-tight text-accent/50"
              style={{ clipPath: `inset(${((1 - cut) * 100).toFixed(1)}% 0 -10% 0)` }}
            >
              {SCENE_NO[SECTION_ID.missions]}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
