import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../../i18n'
import type { Milestone } from '../../i18n/types'
import { SECTION_ID } from '../../lib/constants'
import { useMediaQuery, usePinProgress, useReducedMotion } from '../../lib/hooks'
import SectionHeading from '../primitives/SectionHeading'
import Reveal from '../primitives/Reveal'

function MilestonePanel({ milestone, index }: { milestone: Milestone; index: number }) {
  return (
    <article className="flex w-[58vw] shrink-0 flex-col justify-center md:w-[42vw] lg:w-[34vw]">
      {/* Node on the trajectory line */}
      <div className="flex items-center gap-4">
        <span className="relative flex h-3 w-3 items-center justify-center">
          <span className="absolute h-3 w-3 rounded-full border border-accent/50" />
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        </span>
        <span className="h-px flex-1 bg-gradient-to-r from-accent/40 to-transparent" />
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-steel">
          {milestone.date}
        </span>
      </div>

      <div className="mt-8 pl-7">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent/70">
          {milestone.phase}
        </span>
        <h3 className="mt-3 text-lg font-extralight uppercase leading-snug tracking-cine text-bone md:text-2xl">
          {milestone.title}
        </h3>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-bone/60">{milestone.body}</p>
        <span className="mt-6 block font-mono text-5xl font-light tabular-nums text-white/[0.05]">
          0{index + 1}
        </span>
      </div>
    </article>
  )
}

/** Narrow / reduced-motion variant: a plain vertical timeline, no pinning. */
function VerticalRoute({ milestones }: { milestones: Milestone[] }) {
  return (
    <ol className="mt-14 space-y-12 border-l border-white/10 pl-8">
      {milestones.map((milestone, index) => (
        <Reveal as="li" key={milestone.phase} variant="rise" delay={index * 80} className="relative">
          <span className="absolute -left-[41px] top-1.5 h-3 w-3 rounded-full border border-accent/50 bg-void">
            <span className="absolute inset-1 rounded-full bg-accent" />
          </span>
          <div className="flex flex-wrap items-baseline gap-x-4">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent/70">
              {milestone.phase}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-steel">
              {milestone.date}
            </span>
          </div>
          <h3 className="mt-2.5 text-lg font-extralight uppercase leading-snug tracking-cine text-bone">
            {milestone.title}
          </h3>
          <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-bone/60">{milestone.body}</p>
        </Reveal>
      ))}
    </ol>
  )
}

export default function Route() {
  const { t } = useI18n()
  const reduced = useReducedMotion()
  const narrow = useMediaQuery('(max-width: 767px)')
  const milestones = t.route.milestones
  const pinned = !reduced && !narrow

  const [pinRef, progress] = usePinProgress<HTMLDivElement>(pinned)
  const trackRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [maxShift, setMaxShift] = useState(0)

  // Measure the overflow distance the horizontal track must travel. Recomputed
  // on resize, font load, and whenever the content (locale) changes.
  useEffect(() => {
    if (!pinned) return
    let cancelled = false
    const measure = () => {
      if (cancelled) return
      const track = trackRef.current
      const viewport = viewportRef.current
      if (!track || !viewport) return
      setMaxShift(Math.max(0, track.scrollWidth - viewport.clientWidth))
    }
    measure()
    // Web fonts load async; re-measure once they swap in so the width is exact.
    document.fonts?.ready.then(measure).catch(() => {})
    window.addEventListener('resize', measure)
    return () => {
      cancelled = true
      window.removeEventListener('resize', measure)
    }
  }, [pinned, milestones])

  if (!pinned) {
    return (
      <section id={SECTION_ID.route} className="mx-auto max-w-4xl px-5 py-28 md:px-10">
        <SectionHeading
          eyebrow={t.route.eyebrow}
          title={t.route.title}
          titleEmphasis={t.route.titleEmphasis}
          intro={t.route.intro}
        />
        <VerticalRoute milestones={milestones} />
      </section>
    )
  }

  const shiftPct = Math.round(progress * 100)

  return (
    <section id={SECTION_ID.route} className="relative">
      {/* Tall wrapper provides the scroll distance for the pinned scene */}
      <div ref={pinRef} className="h-[380vh]">
        <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
          {/* Header + progress readout */}
          <div className="mx-auto flex w-full max-w-7xl items-end justify-between px-5 pt-28 md:px-10 md:pt-32">
            <SectionHeading
              eyebrow={t.route.eyebrow}
              title={t.route.title}
              titleEmphasis={t.route.titleEmphasis}
              intro={t.route.intro}
              className="max-w-xl"
            />
            <div className="hidden shrink-0 pb-1 text-right md:block">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-steel">
                {t.route.progressLabel}
              </span>
              <div className="mt-2 font-mono text-2xl tabular-nums text-accent">{shiftPct}%</div>
            </div>
          </div>

          {/* Horizontal track */}
          <div ref={viewportRef} className="relative flex flex-1 items-center overflow-hidden">
            <div
              ref={trackRef}
              className="flex gap-[8vw] px-5 will-change-transform md:px-10"
              style={{ transform: `translate3d(${-progress * maxShift}px, 0, 0)` }}
            >
              {milestones.map((milestone, index) => (
                <MilestonePanel key={milestone.phase} milestone={milestone} index={index} />
              ))}
            </div>
          </div>

          {/* Full-width trajectory line: a craft marker travels with progress */}
          <div className="mx-auto w-full max-w-7xl px-5 pb-16 md:px-10">
            <div className="relative h-px w-full bg-white/10">
              <div
                className="absolute left-0 top-0 h-full bg-accent/60"
                style={{ width: `${progress * 100}%` }}
              />
              <span
                aria-hidden
                className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-accent"
                style={{ left: `${progress * 100}%` }}
              />
            </div>
            <div className="mt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-bone/35">
              <span>{t.route.scrollHint} ↓</span>
              <span className="tabular-nums">
                {milestones[Math.min(milestones.length - 1, Math.floor(progress * milestones.length))]?.date}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
