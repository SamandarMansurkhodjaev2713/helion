import type { CSSProperties, ReactNode } from 'react'
import { clamp01, easeOutCubic } from '../../lib/easing'

/**
 * Motion vocabulary shared by both hero builds — the desktop video scrub and
 * the mobile poster sequence. Keeping it in one place is what lets the two
 * tell the same story with the same timing feel on very different machinery.
 */

/** Scroll-mapped reveal: an element pours in across [start, start + span] of a
 *  hold-progress value. Fully reversible — scrolling back pours it out. */
export function rev(hp: number, start: number, span = 0.18, dy = 24, blur = 8): CSSProperties {
  const e = easeOutCubic(clamp01((hp - start) / span))
  return {
    opacity: e,
    transform: `translateY(${(dy * (1 - e)).toFixed(2)}px)`,
    filter: `blur(${(blur * (1 - e)).toFixed(2)}px)`,
  }
}

/** Briefing variant: deeper offset, heavy blur-to-sharp focus pull. */
export const revB = (hp: number, start: number, span = 0.18) => rev(hp, start, span, 28, 14)

/** A heading line that rises out from under a mask as its block pours in. */
export function MaskLine({
  children,
  hp,
  start,
  className = '',
}: {
  children: ReactNode
  hp: number
  start: number
  className?: string
}) {
  const e = easeOutCubic(clamp01((hp - start) / 0.2))
  return (
    <span className="block overflow-hidden [clip-path:inset(-25%_-25%_0_-25%)]">
      <span
        className={`block will-change-transform ${className}`}
        style={{
          transform: `translateY(${((1 - e) * 105).toFixed(2)}%)`,
          opacity: e,
        }}
      >
        {children}
      </span>
    </span>
  )
}

/** A figure from the mission telemetry, with its caption. */
export function Stat({
  value,
  label,
  style,
}: {
  value: string
  label: string
  style: CSSProperties
}) {
  return (
    <div style={style}>
      <div className="font-mono text-xl font-medium tracking-tight text-bone">{value}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-wide text-bone/40">{label}</div>
    </div>
  )
}

/** Corner tick of the cinema frame. */
export function FrameTick({ position }: { position: string }) {
  const edges = [
    position.includes('top') ? 'border-t' : 'border-b',
    position.includes('left') ? 'border-l' : 'border-r',
  ].join(' ')
  return <span aria-hidden className={`absolute ${position} h-3 w-3 ${edges} border-accent/60`} />
}
