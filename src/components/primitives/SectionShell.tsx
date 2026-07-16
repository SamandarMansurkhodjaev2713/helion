import { type ReactNode } from 'react'
import { useReducedMotion, useViewportProgress } from '../../lib/hooks'
import { mapRange } from '../../lib/easing'

type Atmosphere = 'accent' | 'steel' | 'none'

interface SectionShellProps {
  id: string
  children: ReactNode
  className?: string
  /** Tint of the ambient glow that drifts behind the section. */
  atmosphere?: Atmosphere
}

const GLOW: Record<Atmosphere, string> = {
  // rgba values mirror --accent / --steel
  accent:
    'radial-gradient(60% 50% at 50% 30%, rgba(111, 211, 242, 0.09), transparent 70%)',
  steel:
    'radial-gradient(60% 50% at 50% 40%, rgba(110, 139, 166, 0.12), transparent 70%)',
  none: 'transparent',
}

/**
 * The consistent wrapper for every content section. It provides the anchor id,
 * vertical rhythm, and a parallaxing ambient glow so no section sits on flat
 * black. The glow lives on its own background layer — the transform never
 * touches the content, so sticky/pinned children (the route timeline) keep
 * working. Under reduced motion the glow is static.
 */
export default function SectionShell({
  id,
  children,
  className = '',
  atmosphere = 'none',
}: SectionShellProps) {
  const reduced = useReducedMotion()
  const [ref, progress] = useViewportProgress<HTMLElement>(!reduced && atmosphere !== 'none')

  // Glow drifts up slowly and breathes brightest while the section is centred.
  const driftY = reduced ? 0 : mapRange(progress, 0, 1, 60, -60)
  const glowOpacity = reduced ? 0.6 : mapRange(Math.abs(progress - 0.5), 0, 0.5, 1, 0.25)

  return (
    <section ref={ref} id={id} className={`relative ${className}`}>
      {atmosphere !== 'none' && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-[1] overflow-hidden"
        >
          <div
            className="absolute inset-0"
            style={{
              background: GLOW[atmosphere],
              transform: `translate3d(0, ${driftY}px, 0)`,
              opacity: glowOpacity,
            }}
          />
        </div>
      )}
      {children}
    </section>
  )
}
