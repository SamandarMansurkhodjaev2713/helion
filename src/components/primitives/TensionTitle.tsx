import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { mapRange } from '../../lib/easing'
import { useReducedMotion } from '../../lib/hooks'

interface TensionTitleProps {
  /** Scene number shown at the head of the gauge. */
  scene?: string
  children: ReactNode
  /** When false the title is simply rendered in place (pinned headers). */
  scrollLinked?: boolean
  className?: string
}

/** Share of its own height the title starts pushed below the mask. Leaving a
 *  visible sliver is the whole point — a title that starts fully hidden gives
 *  the reader nothing to pull towards. */
const START_OFFSET = 0.86

/**
 * Report how far this block has been "pulled up" by scrolling, 0 → 1.
 *
 * The window is deliberately short: tension starts the moment the block peeks
 * over the bottom edge and completes once it has risen to the middle of the
 * viewport, so the gesture resolves within about half a screen of scrolling
 * and never leaves the reader stuck pulling at a title that will not come.
 */
function useScrollTension(enabled: boolean): [React.RefObject<HTMLDivElement>, number] {
  const ref = useRef<HTMLDivElement>(null)
  const [tension, setTension] = useState(enabled ? 0 : 1)

  useEffect(() => {
    if (!enabled) {
      setTension(1)
      return
    }
    let frame = 0
    const measure = () => {
      frame = 0
      const node = ref.current
      if (!node) return
      const { top } = node.getBoundingClientRect()
      const vh = window.innerHeight
      setTension(mapRange(top, vh * 0.9, vh * 0.42, 0, 1))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [enabled])

  return [ref, tension]
}

/**
 * A section title that the reader pulls into place.
 *
 * Instead of playing a timed reveal the moment the heading enters view, the
 * whole gesture is bound to scroll position: the words rise out from under a
 * mask and their letter-spacing is drawn open — the type is literally put under
 * tension — in direct response to the wheel. Three things make the invitation
 * legible rather than mysterious:
 *
 *  - the title never starts fully hidden; the tops of the letters sit above the
 *    mask line from the first frame, so there is visibly something to pull;
 *  - a gauge above it fills as the tension is applied, so the reader can see
 *    the gesture has a completion state and what completes it;
 *  - a scroll chevron sits at the end of the gauge and fades out precisely as
 *    the title locks, so the prompt disappears the instant it stops being true.
 *
 * Under reduced motion, and for pinned headers where scroll does not move the
 * element, the title is simply rendered resolved.
 */
export default function TensionTitle({
  scene,
  children,
  scrollLinked = true,
  className = '',
}: TensionTitleProps) {
  const reduced = useReducedMotion()
  const [ref, tension] = useScrollTension(scrollLinked && !reduced)
  const locked = tension > 0.995

  return (
    <div ref={ref} className={className}>
      {/* Tension gauge — the affordance: it fills as the title is drawn up */}
      <div aria-hidden className="mb-4 flex items-center gap-3 md:mb-5">
        {scene && (
          <span className="font-mono text-[10px] tabular-nums tracking-[0.2em] text-accent/50">
            {scene}
          </span>
        )}
        <span className="relative h-px flex-1 bg-white/[0.07]">
          <span
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent/40 to-accent/70"
            style={{ width: `${tension * 100}%` }}
          />
          {/* Travelling tick — the head of the pull */}
          <span
            className="absolute -top-[3px] h-[7px] w-px bg-accent transition-opacity duration-500"
            style={{ left: `${tension * 100}%`, opacity: locked ? 0 : 1 }}
          />
        </span>
        {/* Prompt, true only while there is still tension to apply */}
        <span
          className="font-mono text-[10px] leading-none text-accent transition-opacity duration-500"
          style={{ opacity: locked ? 0 : 1 - tension * 0.4 }}
        >
          ↓
        </span>
      </div>

      {/* The title itself, rising out from under the mask as it is stretched.
          Vertical padding is added and cancelled again so descenders are never
          clipped once the line has settled. */}
      <h2 className="-mb-[0.14em] overflow-hidden pb-[0.14em]">
        <span
          className="title-cine-lg title-tension block max-w-[22ch] text-bone will-change-transform"
          style={
            {
              transform: `translateY(${((1 - tension) * START_OFFSET * 100).toFixed(2)}%)`,
              '--tension': tension.toFixed(3),
            } as CSSProperties
          }
        >
          {children}
        </span>
      </h2>
    </div>
  )
}
