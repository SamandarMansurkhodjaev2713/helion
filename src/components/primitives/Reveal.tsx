import { type CSSProperties, type ElementType, type ReactNode } from 'react'
import { useInView, useReducedMotion } from '../../lib/hooks'

type RevealVariant = 'rise' | 'focus' | 'clip' | 'fade'

interface RevealProps {
  children: ReactNode
  /** Motion style used on entry. */
  variant?: RevealVariant
  /** Stagger delay in ms. */
  delay?: number
  /** Entry duration in ms. */
  duration?: number
  className?: string
  /** Element to render as — defaults to a div. */
  as?: ElementType
}

/** Hidden-state transform per variant; the shown state is always the identity. */
const HIDDEN: Record<RevealVariant, CSSProperties> = {
  rise: { opacity: 0, transform: 'translateY(34px)', filter: 'blur(8px)' },
  focus: { opacity: 0, transform: 'scale(1.06)', filter: 'blur(14px)' },
  clip: { opacity: 1, clipPath: 'inset(100% 0 0 0)' },
  fade: { opacity: 0 },
}

const SHOWN: Record<RevealVariant, CSSProperties> = {
  rise: { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' },
  focus: { opacity: 1, transform: 'scale(1)', filter: 'blur(0)' },
  clip: { opacity: 1, clipPath: 'inset(0% 0 0 0)' },
  fade: { opacity: 1 },
}

/**
 * Reveals its children once, the first time they scroll into view, using one of
 * a few cinematic entrances. Under reduced motion the content is shown
 * immediately with no transform.
 */
export default function Reveal({
  children,
  variant = 'rise',
  delay = 0,
  duration = 900,
  className = '',
  as,
}: RevealProps) {
  const reduced = useReducedMotion()
  const [ref, inView] = useInView<HTMLElement>({ once: true, threshold: 0.18 })
  const Tag = (as ?? 'div') as ElementType

  const style: CSSProperties = reduced
    ? {}
    : {
        ...(inView ? SHOWN[variant] : HIDDEN[variant]),
        transition: `opacity ${duration}ms var(--ease-cinematic) ${delay}ms, transform ${duration}ms var(--ease-cinematic) ${delay}ms, filter ${duration}ms var(--ease-cinematic) ${delay}ms, clip-path ${duration}ms var(--ease-cinematic) ${delay}ms`,
        willChange: 'opacity, transform, filter, clip-path',
      }

  return (
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  )
}
