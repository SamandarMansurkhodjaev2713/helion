import { type ReactNode } from 'react'
import { useDeviceTier, useReducedMotion, useViewportProgress } from '../../lib/hooks'
import { clamp01, mapRange } from '../../lib/easing'
import GhostScene from './GhostScene'

type Atmosphere = 'accent' | 'steel' | 'mars' | 'none'
/** Where the section's key light comes from — its "lighting setup". */
type Light = 'left' | 'top' | 'right' | 'bottom' | 'none'

interface SectionShellProps {
  id: string
  children: ReactNode
  className?: string
  /** Tint of the ambient glow that drifts behind the section. */
  atmosphere?: Atmosphere
  /** Direction of the section's key light. */
  light?: Light
  /** Two-digit scene number — renders the parallax ghost watermark. */
  scene?: string
}

const GLOW: Record<Atmosphere, string> = {
  // rgba values mirror --accent / --steel / --mars
  accent: 'radial-gradient(60% 50% at 50% 30%, rgba(111, 211, 242, 0.09), transparent 70%)',
  steel: 'radial-gradient(60% 50% at 50% 40%, rgba(110, 139, 166, 0.12), transparent 70%)',
  mars: 'radial-gradient(65% 55% at 50% 70%, rgba(224, 154, 106, 0.10), transparent 72%)',
  none: 'transparent',
}

/**
 * Soft directional key light — each section is lit like its own set.
 *
 * These are radial pools rather than linear ramps on purpose: a linear gradient
 * stops dead at the layer's edge, and against a dark page that straight cut
 * reads as a seam. A pool centred off-frame falls off on every side, so the
 * light has no edges at all.
 */
const KEY_LIGHT: Record<Light, string> = {
  left: 'radial-gradient(75% 85% at 0% 35%, rgba(157, 187, 214, 0.085), transparent 68%)',
  top: 'radial-gradient(95% 70% at 50% 0%, rgba(157, 187, 214, 0.095), transparent 66%)',
  right: 'radial-gradient(75% 85% at 100% 35%, rgba(157, 187, 214, 0.085), transparent 68%)',
  bottom: 'radial-gradient(95% 75% at 50% 100%, rgba(224, 154, 106, 0.10), transparent 68%)',
  none: 'transparent',
}

/**
 * The consistent wrapper for every content section. It provides the anchor id,
 * vertical rhythm, a parallaxing ambient glow and (optionally) the giant ghost
 * scene number, so no section sits on flat black. Both decorations live on
 * background layers — transforms never touch the content, so sticky/pinned
 * children keep working. Under reduced motion everything is static.
 */
export default function SectionShell({
  id,
  children,
  className = '',
  atmosphere = 'none',
  light = 'none',
  scene,
}: SectionShellProps) {
  const reduced = useReducedMotion()
  const tier = useDeviceTier()
  const decorated = atmosphere !== 'none' || light !== 'none' || Boolean(scene)
  const [ref, progress] = useViewportProgress<HTMLElement>(!reduced && decorated)

  // Glow drifts up slowly and breathes brightest while the section is centred.
  const driftY = reduced ? 0 : mapRange(progress, 0, 1, 60, -60)
  const glowOpacity = reduced ? 0.6 : mapRange(Math.abs(progress - 0.5), 0, 0.5, 1, 0.25)

  // Editing cut: the section settles back and darkens as it leaves frame, and
  // the next one enters over it crisp — a montage rather than a scroll. Kept
  // off low-tier devices, where a full-section transform is the costly bit.
  const cut = reduced || tier === 'low' ? 0 : clamp01((progress - 0.82) / 0.18)
  const cutStyle =
    cut > 0
      ? {
          transform: `scale(${(1 - cut * 0.015).toFixed(4)})`,
          filter: `brightness(${(1 - cut * 0.3).toFixed(3)})`,
          willChange: 'transform, filter',
        }
      : undefined

  return (
    <section ref={ref} id={id} className={`relative ${className}`} style={cutStyle}>
      {(atmosphere !== 'none' || light !== 'none') && (
        // Full-bleed: the section itself is width-capped, but its light must not
        // be — a lit rectangle sitting inside the column reads as a seam.
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-1/2 -z-[1] w-screen -translate-x-1/2 overflow-hidden"
        >
          {light !== 'none' && (
            <div className="absolute inset-0" style={{ background: KEY_LIGHT[light] }} />
          )}
          {atmosphere !== 'none' && (
            <div
              className="absolute inset-0"
              style={{
                background: GLOW[atmosphere],
                transform: `translate3d(0, ${driftY}px, 0)`,
                opacity: glowOpacity,
              }}
            />
          )}
        </div>
      )}
      {scene && <GhostScene scene={scene} progress={progress} />}
      {children}
    </section>
  )
}
