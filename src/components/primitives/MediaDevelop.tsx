import { useEffect, useState, type ReactNode } from 'react'
import { useDeviceTier, useInView, useReducedMotion } from '../../lib/hooks'

interface MediaDevelopProps {
  children: ReactNode
  /** Change this to re-run the develop (e.g. the selected ship id). */
  developKey?: string
  delay?: number
  duration?: number
  className?: string
}

/**
 * Imagery never simply fades in: it *develops*, the way a photograph surfaces
 * in a tray — blown-out and unfocused first, then contrast and sharpness
 * arrive. Used for the fleet stills and the finale.
 *
 * The blur is the expensive part, so low-tier devices get the same choreography
 * with brightness/contrast only. Reduced motion shows the final frame at once.
 */
export default function MediaDevelop({
  children,
  developKey,
  delay = 0,
  duration = 1100,
  className = '',
}: MediaDevelopProps) {
  const reduced = useReducedMotion()
  const tier = useDeviceTier()
  const [ref, inView] = useInView<HTMLDivElement>({ once: true, threshold: 0.15 })
  const [developed, setDeveloped] = useState(false)

  // Re-run the develop whenever the source changes (ship switch).
  useEffect(() => {
    if (reduced || !inView) return
    setDeveloped(false)
    const raf = requestAnimationFrame(() => setDeveloped(true))
    return () => cancelAnimationFrame(raf)
  }, [developKey, inView, reduced])

  if (reduced) {
    return <div className={className}>{children}</div>
  }

  const blur = tier === 'high' ? 'blur(14px) ' : ''
  return (
    <div
      ref={ref}
      className={className}
      style={{
        filter: developed
          ? 'blur(0px) brightness(1) contrast(1) saturate(1)'
          : `${blur}brightness(2.1) contrast(0.35) saturate(0.4)`,
        opacity: developed ? 1 : 0.2,
        transition: `filter ${duration}ms var(--ease-cinematic) ${delay}ms, opacity ${Math.round(
          duration * 0.55,
        )}ms ease-out ${delay}ms`,
        willChange: 'filter, opacity',
      }}
    >
      {children}
    </div>
  )
}
