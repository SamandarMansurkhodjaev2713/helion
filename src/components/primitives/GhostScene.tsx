import { useInView, useReducedMotion } from '../../lib/hooks'
import { mapRange } from '../../lib/easing'

interface GhostSceneProps {
  /** Two-digit scene number ("02" … "06"). */
  scene: string
  /** Section viewport progress 0–1 — drives the parallax drift. */
  progress: number
  className?: string
}

/** Duration of the chalk stroke drawing itself across the digits. */
const DRAW_MS = 900

/**
 * The section's ghost watermark: a giant scene number that draws itself in
 * outline — like chalk on a clapperboard — then settles into a faint fill and
 * drifts on scroll as the deepest content layer.
 *
 * The drift lives on an outer layer with no transition (so scroll tracks 1:1)
 * while the one-shot draw animates the SVG stroke inside. Decorative only, and
 * static under reduced motion.
 */
export default function GhostScene({ scene, progress, className = '' }: GhostSceneProps) {
  const reduced = useReducedMotion()
  const [ref, inView] = useInView<HTMLDivElement>({ once: true, threshold: 0 })
  const shown = inView || reduced
  const drift = reduced ? 0 : mapRange(progress, 0, 1, 90, -90)

  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute inset-0 -z-[1] overflow-hidden ${className}`}
    >
      {/* Drift layer — follows scroll instantly */}
      <span
        className="absolute right-[-4vw] top-1/2 block w-[92vw] -translate-y-1/2 will-change-transform md:w-[46vw]"
        style={{ transform: `translateY(calc(-50% + ${drift.toFixed(1)}px))` }}
      >
        <svg viewBox="0 0 200 130" className="h-auto w-full">
          {/* Chalk outline draws itself, then the fill fades up behind it */}
          <text
            x="100"
            y="104"
            textAnchor="middle"
            fill="currentColor"
            className="text-white/[0.035]"
            style={{
              font: '300 130px "JetBrains Mono", monospace',
              opacity: shown ? 1 : 0,
              transition: `opacity 900ms var(--ease-cinematic) ${DRAW_MS * 0.55}ms`,
            }}
          >
            {scene}
          </text>
          <text
            x="100"
            y="104"
            textAnchor="middle"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.6"
            pathLength={1}
            className="text-accent/25"
            style={{
              font: '300 130px "JetBrains Mono", monospace',
              strokeDasharray: 1,
              strokeDashoffset: shown ? 0 : 1,
              transition: reduced
                ? undefined
                : `stroke-dashoffset ${DRAW_MS}ms var(--ease-cinematic)`,
            }}
          >
            {scene}
          </text>
        </svg>
      </span>
    </div>
  )
}
