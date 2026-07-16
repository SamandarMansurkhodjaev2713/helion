import type { MouseEvent, ReactNode } from 'react'
import MagneticButton from './MagneticButton'

interface CineButtonProps {
  children: ReactNode
  href?: string
  /** Open in a new tab with safe rel. */
  external?: boolean
  onClick?: (event: MouseEvent<HTMLElement>) => void
  /** 'ghost' = corner-bracket outline (default), 'solid' = filled accent. */
  variant?: 'ghost' | 'solid'
  cursorLabel?: string
  className?: string
}

/** One corner tick of the ghost bracket frame. */
function Corner({ position }: { position: string }) {
  const edges = [
    position.includes('top') ? 'border-t' : 'border-b',
    position.includes('left') ? 'border-l' : 'border-r',
  ].join(' ')
  const spread = [
    position.includes('top') ? 'group-hover/btn:-top-1' : 'group-hover/btn:-bottom-1',
    position.includes('left') ? 'group-hover/btn:-left-1' : 'group-hover/btn:-right-1',
  ].join(' ')
  return (
    <span
      aria-hidden
      className={`absolute ${position} h-2 w-2 ${edges} border-bone/40 transition-all duration-500 ease-cinematic group-hover/btn:border-accent ${spread}`}
    />
  )
}

/**
 * The site-wide CTA: a sharp, mono-typography "slate" button whose corner
 * brackets spread on hover (ghost) or a filled accent block (solid). Magnetic
 * on precise pointers via MagneticButton; plain on touch/reduced-motion.
 */
export default function CineButton({
  children,
  href,
  external,
  onClick,
  variant = 'ghost',
  cursorLabel,
  className = '',
}: CineButtonProps) {
  const solid = variant === 'solid'
  return (
    <MagneticButton
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      onClick={onClick}
      cursorLabel={cursorLabel}
      className={className}
    >
      <span
        className={`group/btn relative inline-flex items-center gap-3 px-7 py-3.5 font-mono text-xs uppercase tracking-[0.2em] transition-colors duration-300 ${
          solid
            ? 'bg-accent text-void hover:bg-accent-bright'
            : 'text-bone hover:text-accent'
        }`}
      >
        {!solid && (
          <>
            <Corner position="left-0 top-0" />
            <Corner position="right-0 top-0" />
            <Corner position="left-0 bottom-0" />
            <Corner position="right-0 bottom-0" />
          </>
        )}
        {children}
      </span>
    </MagneticButton>
  )
}
