import { useRef, type ReactNode, type MouseEvent } from 'react'
import { MOTION } from '../../lib/constants'
import { usePointerFine, useReducedMotion } from '../../lib/hooks'

interface MagneticButtonProps {
  children: ReactNode
  /** When set, renders an anchor; otherwise a button. */
  href?: string
  /** Anchor target — used for external links. */
  target?: string
  rel?: string
  onClick?: (event: MouseEvent<HTMLElement>) => void
  className?: string
  /** Label surfaced by the HUD cursor while hovering. */
  cursorLabel?: string
  ariaLabel?: string
}

/**
 * An element that leans toward the pointer within a small radius, giving CTAs a
 * tactile, premium "pull". The translate is applied directly to the node and
 * smoothed by a CSS transition — no per-frame React state.
 *
 * The magnetic behaviour is disabled on coarse pointers and under reduced
 * motion, where the element behaves like an ordinary link/button.
 */
export default function MagneticButton({
  children,
  href,
  target,
  rel,
  onClick,
  className = '',
  cursorLabel,
  ariaLabel,
}: MagneticButtonProps) {
  const ref = useRef<HTMLElement>(null)
  const fine = usePointerFine()
  const reduced = useReducedMotion()
  const magnetic = fine && !reduced

  const handleMove = (event: MouseEvent<HTMLElement>) => {
    if (!magnetic) return
    const node = ref.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    const relX = event.clientX - (rect.left + rect.width / 2)
    const relY = event.clientY - (rect.top + rect.height / 2)
    const distance = Math.hypot(relX, relY)
    if (distance > MOTION.magneticRadius) return
    node.style.transform = `translate3d(${relX * MOTION.magneticStrength}px, ${
      relY * MOTION.magneticStrength
    }px, 0)`
  }

  const reset = () => {
    const node = ref.current
    if (node) node.style.transform = 'translate3d(0, 0, 0)'
  }

  const shared = {
    ref: ref as never,
    className: `inline-flex will-change-transform transition-transform duration-500 ease-cinematic ${className}`,
    onMouseMove: handleMove,
    onMouseLeave: reset,
    onClick,
    'data-cursor': 'cta',
    'data-cursor-label': cursorLabel,
    'aria-label': ariaLabel,
  }

  if (href) {
    return (
      <a href={href} target={target} rel={rel} {...shared}>
        {children}
      </a>
    )
  }
  return (
    <button type="button" {...shared}>
      {children}
    </button>
  )
}
