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
 * The section's ghost watermark: a giant mono scene number behind the content.
 * On first entry it "stamps" in (scales down from 112% while fading up), then
 * drifts on scroll at its own speed — a depth layer between the starfield and
 * the content. The drift lives on an outer layer with no transition (so scroll
 * tracks 1:1) while the one-shot stamp animates an inner layer. Decorative
 * only; static under reduced motion.
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
        className="absolute right-[-3vw] top-1/2 will-change-transform"
        style={{ transform: `translateY(calc(-50% + ${drift.toFixed(1)}px))` }}
      >
        {/* Stamp layer — one-shot entrance */}
        <span
          className="block font-mono text-[44vw] font-light leading-none text-white/[0.04] md:text-[24vw]"
          style={{
            transform: `scale(${shown ? 1 : 1.12})`,
            opacity: shown ? 1 : 0,
            transition:
              'opacity 1000ms var(--ease-cinematic), transform 1000ms var(--ease-cinematic)',
          }}
        >
          {scene}
        </span>
      </span>
    </div>
  )
}
