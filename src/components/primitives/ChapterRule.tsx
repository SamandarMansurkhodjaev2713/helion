import { useInView, useReducedMotion } from '../../lib/hooks'

interface ChapterRuleProps {
  /** Two-digit scene number shown at the head of the rule. */
  scene: string
  className?: string
}

/**
 * The arrival beat of a section: a hairline draws itself across the top of the
 * column, left to right, with the scene number and a tick sitting on it — the
 * way a chapter is struck onto a reel.
 *
 * It is deliberately a *content* element, not a treatment of the section
 * container. Anything that filters or transforms a whole transparent section
 * only darkens or shifts its own backdrop layer, which draws a hard line where
 * that section ends — the seam this replaces. A 1px rule over nothing cannot
 * produce an edge, and it still gives the eye a clear "new chapter" moment.
 */
export default function ChapterRule({ scene, className = '' }: ChapterRuleProps) {
  const reduced = useReducedMotion()
  const [ref, inView] = useInView<HTMLDivElement>({ once: true, threshold: 0 })
  const shown = inView || reduced

  return (
    <div ref={ref} aria-hidden className={`flex items-center gap-4 ${className}`}>
      <span className="font-mono text-[10px] tabular-nums tracking-[0.2em] text-accent/50">
        {scene}
      </span>

      {/* The rule itself, drawn from the number outwards */}
      <span className="relative h-px flex-1 overflow-hidden bg-white/[0.06]">
        <span
          className="absolute inset-y-0 left-0 w-full origin-left bg-gradient-to-r from-accent/50 via-accent/20 to-transparent"
          style={{
            transform: shown ? 'scaleX(1)' : 'scaleX(0)',
            transition: reduced ? undefined : 'transform 1200ms var(--ease-cinematic)',
          }}
        />
      </span>

      {/* Frame tick closing the rule */}
      <span
        className="h-1.5 w-1.5 border-r border-t border-accent/40"
        style={{
          opacity: shown ? 1 : 0,
          transition: reduced ? undefined : 'opacity 500ms ease-out 900ms',
        }}
      />
    </div>
  )
}
