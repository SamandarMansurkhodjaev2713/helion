import { type ReactNode } from 'react'
import { useReducedMotion, useViewportProgress } from '../../lib/hooks'
import { mapRange } from '../../lib/easing'
import GhostScene from './GhostScene'

type Atmosphere = 'accent' | 'steel' | 'mars' | 'none'

interface SectionShellProps {
  id: string
  children: ReactNode
  className?: string
  /** Tint of the ambient glow that drifts behind the section. */
  atmosphere?: Atmosphere
  /** Two-digit scene number — renders the ghost watermark and chapter rule. */
  scene?: string
}

/**
 * Ambient tint of a section.
 *
 * Every pool is centred and fades to transparent well inside the section's own
 * box, so it never reaches an edge to draw one. Directional key light — which
 * by definition is brightest at one side — is *not* here: it belongs to the
 * page-wide `SceneLight` layer, because a bright edge inside a width-capped
 * column is exactly what reads as a seam.
 */
const GLOW: Record<Atmosphere, string> = {
  // rgba values mirror --accent / --steel / --mars
  accent: 'radial-gradient(55% 45% at 50% 35%, rgba(111, 211, 242, 0.085), transparent 72%)',
  steel: 'radial-gradient(55% 45% at 50% 45%, rgba(110, 139, 166, 0.11), transparent 72%)',
  mars: 'radial-gradient(60% 50% at 50% 65%, rgba(224, 154, 106, 0.10), transparent 74%)',
  none: 'transparent',
}

/**
 * The consistent wrapper for every content section: anchor id, vertical
 * rhythm, the ambient tint, the ghost scene number and the chapter rule that
 * opens the section.
 *
 * Note what it deliberately does *not* do: it never transforms or filters the
 * `<section>` itself. A transparent section carries only its own backdrop, so
 * dimming or scaling it just moves that backdrop relative to its neighbours
 * and draws a hard line where the two meet. Arrival is expressed through
 * content (chapter rule, LineReveal, ghost number) instead.
 */
export default function SectionShell({
  id,
  children,
  className = '',
  atmosphere = 'none',
  scene,
}: SectionShellProps) {
  const reduced = useReducedMotion()
  const decorated = atmosphere !== 'none' || Boolean(scene)
  const [ref, progress] = useViewportProgress<HTMLElement>(!reduced && decorated)

  // The tint drifts up slowly and is brightest while the section is centred,
  // falling to nothing at its edges so neighbours cross-dissolve.
  const driftY = reduced ? 0 : mapRange(progress, 0, 1, 60, -60)
  const edgeFade = reduced ? 0.75 : mapRange(Math.abs(progress - 0.5), 0.2, 0.5, 1, 0)

  return (
    <section ref={ref} id={id} className={`relative ${className}`}>
      {atmosphere !== 'none' && (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-[1] overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: GLOW[atmosphere],
              transform: `translate3d(0, ${driftY}px, 0)`,
              opacity: edgeFade,
            }}
          />
        </div>
      )}
      {scene && <GhostScene scene={scene} progress={progress} />}
      {/* The chapter marker lives on the heading's tension gauge — see
          TensionTitle — so nothing is drawn here. */}
      {children}
    </section>
  )
}
