import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../../i18n'
import type { Milestone } from '../../i18n/types'
import { SCENE_NO, SECTION_ID } from '../../lib/constants'
import { clamp01 } from '../../lib/easing'
import {
  useMediaQuery,
  usePinProgress,
  useReducedMotion,
  useViewportProgress,
} from '../../lib/hooks'
import SectionHeading from '../primitives/SectionHeading'
import LineReveal from '../primitives/LineReveal'
import GhostScene from '../primitives/GhostScene'

/** Total expedition days the progress readout counts through. */
const MISSION_DAYS = 1460

/** The trajectory arc, in the 1000×220 viewBox both timelines share. */
const ARC_PATH = 'M 24 190 C 240 190, 300 40, 500 40 S 760 150, 976 46'

/** Format the running expedition clock as T+000d. */
const formatDays = (progress: number) =>
  `T+${Math.round(progress * MISSION_DAYS).toString().padStart(3, '0')}d`

/** Sample a point (and heading) along an SVG path at 0–1 of its length. */
function samplePath(path: SVGPathElement | null, t: number) {
  if (!path) return { x: 0, y: 0, angle: 0 }
  const length = path.getTotalLength()
  const point = path.getPointAtLength(length * t)
  const ahead = path.getPointAtLength(Math.min(length, length * t + 1))
  return {
    x: point.x,
    y: point.y,
    angle: (Math.atan2(ahead.y - point.y, ahead.x - point.x) * 180) / Math.PI,
  }
}

/**
 * The desktop trajectory: a ballistic arc that draws itself as the section is
 * scrolled, with the craft riding *along* the curve (banked to its tangent),
 * a fading dotted wake behind it, and milestone nodes that ignite as it passes.
 */
function TrajectoryArc({
  milestones,
  progress,
  activeIndex,
}: {
  milestones: Milestone[]
  progress: number
  activeIndex: number
}) {
  const pathRef = useRef<SVGPathElement>(null)
  const [, force] = useState(0)

  // Path geometry is only measurable after mount; one nudge is enough.
  useEffect(() => force((n) => n + 1), [])

  const craft = samplePath(pathRef.current, progress)
  const nodes = milestones.map((_, index) =>
    samplePath(pathRef.current, milestones.length > 1 ? index / (milestones.length - 1) : 0),
  )

  return (
    <svg viewBox="0 0 1000 220" aria-hidden className="w-full">
      {/* Reference: the whole route, faint */}
      <path ref={pathRef} d={ARC_PATH} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 7" className="text-white/12" />
      {/* Flown portion */}
      <path
        d={ARC_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        pathLength={1}
        className="text-accent/70"
        style={{ strokeDasharray: 1, strokeDashoffset: 1 - progress }}
      />

      {/* Milestone nodes — ignite as the craft passes */}
      {nodes.map((node, index) => {
        const passed = index <= activeIndex
        return (
          <g key={milestones[index].phase}>
            {passed && (
              <circle
                cx={node.x}
                cy={node.y}
                r="6"
                fill="none"
                stroke="currentColor"
                className="text-accent/60"
                style={{ animation: 'node-ignite 1.2s var(--ease-cinematic) both' }}
              />
            )}
            <circle
              cx={node.x}
              cy={node.y}
              r="4"
              fill="none"
              stroke="currentColor"
              className={passed ? 'text-accent' : 'text-steel/40'}
            />
            <circle
              cx={node.x}
              cy={node.y}
              r="1.8"
              className={passed ? 'fill-accent' : 'fill-steel/40'}
            />
          </g>
        )
      })}

      {/* The craft, banked along the curve */}
      <g transform={`translate(${craft.x} ${craft.y}) rotate(${craft.angle})`}>
        <path d="M -9 0 L 6 -4 L 12 0 L 6 4 Z" className="fill-bone" />
        <path d="M -22 0 L -9 0" stroke="currentColor" strokeWidth="1" className="text-accent/50" />
      </g>
    </svg>
  )
}

/** Narrow / reduced-motion variant: a vertical line that draws itself in as the
 *  reader descends, with nodes igniting on the way past. */
function VerticalRoute({ milestones }: { milestones: Milestone[] }) {
  const reduced = useReducedMotion()
  const [ref, progress] = useViewportProgress<HTMLOListElement>(!reduced)
  // The list occupies the middle of the travel; remap so the line completes
  // by the time the last item is read rather than when the section exits.
  const drawn = reduced ? 1 : clamp01((progress - 0.1) / 0.6)
  const activeIndex = Math.floor(drawn * milestones.length) - 1

  return (
    <ol ref={ref} className="relative mt-14 space-y-12 pl-8">
      {/* Track + drawn progress */}
      <span aria-hidden className="absolute left-0 top-0 h-full w-px bg-white/10" />
      <span
        aria-hidden
        className="absolute left-0 top-0 w-px origin-top bg-accent/70"
        style={{ height: `${drawn * 100}%` }}
      />

      {milestones.map((milestone, index) => {
        const passed = index <= activeIndex
        return (
          <LineReveal as="li" key={milestone.phase} delay={index * 70} className="relative" distance={0.5}>
            <span
              aria-hidden
              className={`absolute -left-[37px] top-1.5 flex h-3 w-3 items-center justify-center rounded-full border bg-void transition-colors duration-500 ${
                passed ? 'border-accent' : 'border-steel/40'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${
                  passed ? 'bg-accent' : 'bg-steel/40'
                }`}
              />
            </span>
            <span className="block">
              <span className="flex flex-wrap items-baseline gap-x-4">
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent/70">
                  {milestone.phase}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-steel">
                  {milestone.date}
                </span>
              </span>
              <span className="title-cine mt-2.5 block text-bone">{milestone.title}</span>
              <span className="mt-2.5 block max-w-lg text-sm leading-relaxed text-bone/60">
                {milestone.body}
              </span>
            </span>
          </LineReveal>
        )
      })}
    </ol>
  )
}

function MilestonePanel({
  milestone,
  index,
  active,
}: {
  milestone: Milestone
  index: number
  active: boolean
}) {
  return (
    <article
      className="flex w-[58vw] shrink-0 flex-col justify-center transition-all duration-700 ease-cinematic md:w-[42vw] lg:w-[34vw]"
      style={{
        opacity: active ? 1 : 0.32,
        filter: active ? 'blur(0px)' : 'blur(1.5px)',
        transform: active ? 'scale(1)' : 'scale(0.97)',
      }}
    >
      <div className="flex items-center gap-4">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent/70">
          {milestone.phase}
        </span>
        <span className="h-px flex-1 bg-gradient-to-r from-accent/40 to-transparent" />
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-steel">
          {milestone.date}
        </span>
      </div>

      <div className="mt-7">
        <h3 className="title-cine text-bone">{milestone.title}</h3>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-bone/60">{milestone.body}</p>
        <span className="mt-6 block font-mono text-5xl font-light tabular-nums text-white/[0.05]">
          0{index + 1}
        </span>
      </div>
    </article>
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
      <section id={SECTION_ID.route} className="relative mx-auto max-w-4xl px-5 py-24 md:px-10">
        <GhostScene scene={SCENE_NO[SECTION_ID.route]} progress={0.5} />
        <SectionHeading
          eyebrow={t.route.eyebrow}
          title={t.route.title}
          titleEmphasis={t.route.titleEmphasis}
          intro={t.route.intro}
          scene={SCENE_NO[SECTION_ID.route]}
        />
        <VerticalRoute milestones={milestones} />
      </section>
    )
  }

  const activeIndex = Math.min(
    milestones.length - 1,
    Math.floor(progress * milestones.length + 0.15),
  )

  return (
    <section id={SECTION_ID.route} className="relative">
      {/* Tall wrapper provides the scroll distance for the pinned scene */}
      <div ref={pinRef} className="h-[380vh]">
        <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
          <GhostScene scene={SCENE_NO[SECTION_ID.route]} progress={progress} />

          {/* Header + running expedition clock */}
          <div className="mx-auto flex w-full max-w-7xl items-end justify-between px-5 pt-24 md:px-10 md:pt-28">
            <SectionHeading
              eyebrow={t.route.eyebrow}
              title={t.route.title}
              titleEmphasis={t.route.titleEmphasis}
              intro={t.route.intro}
              scene={SCENE_NO[SECTION_ID.route]}
              // Pinned: the header holds still while the scene scrolls past it,
              // so there is no travel to bind the tension to.
              scrollLinked={false}
              className="max-w-xl"
            />
            <div className="hidden shrink-0 pb-1 text-right md:block">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-steel">
                {t.route.progressLabel}
              </span>
              <div className="mt-2 font-mono text-3xl tabular-nums text-accent">
                {formatDays(progress)}
              </div>
              <div className="mt-1 font-mono text-[10px] tabular-nums text-bone/35">
                {Math.round(progress * 100)}%
              </div>
            </div>
          </div>

          {/* Horizontal track of milestone panels */}
          <div ref={viewportRef} className="relative flex flex-1 items-center overflow-hidden">
            <div
              ref={trackRef}
              className="flex gap-[8vw] px-5 will-change-transform md:px-10"
              style={{ transform: `translate3d(${-progress * maxShift}px, 0, 0)` }}
            >
              {milestones.map((milestone, index) => (
                <MilestonePanel
                  key={milestone.phase}
                  milestone={milestone}
                  index={index}
                  active={index === activeIndex}
                />
              ))}
            </div>
          </div>

          {/* The trajectory itself */}
          <div className="mx-auto w-full max-w-7xl px-5 pb-14 md:px-10">
            <TrajectoryArc
              milestones={milestones}
              progress={progress}
              activeIndex={activeIndex}
            />
            <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-bone/35">
              <span>{t.route.scrollHint} ↓</span>
              <span className="tabular-nums">{milestones[activeIndex]?.date}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
