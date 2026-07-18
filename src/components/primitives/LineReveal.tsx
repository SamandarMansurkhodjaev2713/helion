import { Children, type ElementType, type ReactNode } from 'react'
import { useInView, useReducedMotion } from '../../lib/hooks'

interface LineRevealProps {
  children: ReactNode
  /** Delay before this block starts, ms. */
  delay?: number
  /** Gap between consecutive children, ms. */
  stagger?: number
  /** Travel distance as a share of the line box (1 = a full line height). */
  distance?: number
  duration?: number
  className?: string
  as?: ElementType
}

/**
 * The site's one entrance gesture: content rises out from behind an invisible
 * line, the way film titles are pulled up through a slit. Every direct child
 * gets its own mask and its own delay, so a stack of lines cascades.
 *
 * This is deliberately the *only* text entrance used across the site — a single
 * recognisable move reads as authorship, where a mix of fades and slides reads
 * as a template. Under reduced motion children render plainly, unwrapped.
 *
 * The entrance is driven by `useInView`, which resolves synchronously against
 * the element's rect on mount — so a reload or deep link that lands mid-page
 * shows its content immediately instead of waiting for an observer callback.
 */
export default function LineReveal({
  children,
  delay = 0,
  stagger = 80,
  distance = 1.1,
  duration = 900,
  className = '',
  as,
}: LineRevealProps) {
  const reduced = useReducedMotion()
  const [ref, inView] = useInView<HTMLElement>({ once: true, threshold: 0.05 })
  const Tag = (as ?? 'div') as ElementType

  if (reduced) {
    return <Tag className={className}>{children}</Tag>
  }

  return (
    <Tag ref={ref} className={className}>
      {Children.map(children, (child, index) => (
        // Mask: hides the travel of the line beneath it.
        <span className="block overflow-hidden [clip-path:inset(-25%_-25%_0_-25%)]">
          <span
            className="block will-change-transform"
            style={{
              transform: inView ? 'translateY(0)' : `translateY(${distance * 100}%)`,
              opacity: inView ? 1 : 0,
              transition: `transform ${duration}ms var(--ease-cinematic) ${
                delay + index * stagger
              }ms, opacity ${Math.round(duration * 0.6)}ms linear ${delay + index * stagger}ms`,
            }}
          >
            {child}
          </span>
        </span>
      ))}
    </Tag>
  )
}
