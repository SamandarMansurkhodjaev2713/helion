import { useRef, type ReactNode, type MouseEvent } from 'react'
import { MOTION } from '../../lib/constants'
import { clamp } from '../../lib/easing'
import { usePointerFine, useReducedMotion } from '../../lib/hooks'

interface TiltCardProps {
  children: ReactNode
  className?: string
  cursorLabel?: string
}

/**
 * A card that tilts in 3D toward the pointer with a moving specular glare. The
 * rotation is written straight to the node (smoothed by a CSS transition) and a
 * CSS custom property drives the glare position, so there is no per-frame React
 * state. Tilt is disabled on coarse pointers and under reduced motion.
 */
export default function TiltCard({ children, className = '', cursorLabel }: TiltCardProps) {
  const innerRef = useRef<HTMLDivElement>(null)
  const fine = usePointerFine()
  const reduced = useReducedMotion()
  const active = fine && !reduced

  const handleMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!active) return
    const node = innerRef.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width // 0–1
    const py = (event.clientY - rect.top) / rect.height // 0–1
    const rotateY = clamp((px - 0.5) * 2, -1, 1) * MOTION.tiltMaxDeg
    const rotateX = clamp((0.5 - py) * 2, -1, 1) * MOTION.tiltMaxDeg
    node.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
    node.style.setProperty('--glare-x', `${px * 100}%`)
    node.style.setProperty('--glare-y', `${py * 100}%`)
    node.style.setProperty('--glare-o', '0.14')
  }

  const reset = () => {
    const node = innerRef.current
    if (!node) return
    node.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)'
    node.style.setProperty('--glare-o', '0')
  }

  return (
    <div
      ref={innerRef}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      data-cursor="card"
      data-cursor-label={cursorLabel}
      className={`relative will-change-transform transition-transform duration-500 ease-cinematic ${className}`}
    >
      {children}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          opacity: 'var(--glare-o, 0)',
          background:
            // mirrors --accent-bright
            'radial-gradient(340px circle at var(--glare-x, 50%) var(--glare-y, 50%), rgba(169, 231, 255, 0.5), transparent 60%)',
          transition: 'opacity 400ms var(--ease-cinematic)',
          mixBlendMode: 'soft-light',
        }}
      />
    </div>
  )
}
