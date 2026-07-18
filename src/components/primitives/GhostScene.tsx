import { useInView, useReducedMotion } from '../../lib/hooks'
import { mapRange } from '../../lib/easing'

interface GhostSceneProps {
  /** Two-digit scene number ("02" … "06"). */
  scene: string
  /** Section viewport progress 0–1 — drives the parallax drift. */
  progress: number
  className?: string
}

/**
 * The section's ghost watermark: a giant scene number that wipes in from below
 * — as if struck onto the frame — then drifts on scroll as the deepest content
 * layer.
 *
 * The reveal is a clip-path wipe rather than an SVG stroke-dash: `pathLength`
 * is not reliably honoured on `<text>`, and where it is ignored the dash
 * pattern shreds the glyphs into a dotted mess. A wipe renders identically
 * everywhere.
 *
 * The drift lives on an outer layer with no transition (so scroll tracks 1:1)
 * while the one-shot wipe animates inside. Decorative only; static under
 * reduced motion.
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
      {/* Drift layer — follows scroll instantly.
          The number sits fully inside the frame: bleeding it off the edge read
          as a rendering fault rather than a deliberate crop, so it is now a
          composed element with its own margin. */}
      <span
        className="absolute right-[3vw] top-1/2 block -translate-y-1/2 will-change-transform md:right-[4vw]"
        style={{ transform: `translateY(calc(-50% + ${drift.toFixed(1)}px))` }}
      >
        {/* Wipe layer — one-shot reveal from the baseline up */}
        <span
          className="block font-mono text-[26vw] font-extralight leading-[0.78] tracking-tight text-white/[0.05] md:text-[15vw]"
          style={{
            clipPath: shown ? 'inset(-12% 0 -12% 0)' : 'inset(100% 0 -12% 0)',
            transition: reduced ? undefined : 'clip-path 1100ms var(--ease-cinematic)',
          }}
        >
          {scene}
        </span>
      </span>
    </div>
  )
}
