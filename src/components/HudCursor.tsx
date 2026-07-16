import { useEffect, useRef, useState } from 'react'
import { usePointerFine, useReducedMotion } from '../lib/hooks'
import { lerp } from '../lib/easing'
import { MOTION } from '../lib/constants'

/**
 * A themed "targeting reticle" cursor for precise pointers. It replaces the OS
 * cursor with a HUD visor: a fast dot, an inertial ring that locks onto
 * interactive elements, and a live coordinate readout.
 *
 * Performance notes:
 *  - Position and the coordinate text are written straight to the DOM inside a
 *    single rAF loop, so pointer movement never triggers a React re-render.
 *  - The only React state is the discrete hover mode (idle vs. locked), which
 *    flips at most once per element the pointer crosses.
 *  - Everything is torn down on unmount; the `has-custom-cursor` html flag that
 *    hides the native cursor is removed too.
 *
 * It renders nothing on touch/coarse pointers or under reduced-motion, where a
 * bespoke cursor is either impossible or unwanted.
 */
export default function HudCursor() {
  const fine = usePointerFine()
  const reduced = useReducedMotion()
  const enabled = fine && !reduced

  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const readoutRef = useRef<HTMLSpanElement>(null)

  const [locked, setLocked] = useState(false)
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return

    const root = document.documentElement
    root.classList.add('has-custom-cursor')

    // Live pointer target (px) and the lerped ring position it chases.
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const ringPos = { ...target }
    let visible = false
    let raf = 0

    const onMove = (event: PointerEvent) => {
      target.x = event.clientX
      target.y = event.clientY
      if (!visible) {
        visible = true
        root.classList.add('cursor-visible')
      }
    }

    const onLeave = () => {
      visible = false
      root.classList.remove('cursor-visible')
    }

    // Event delegation: any element flagged with data-cursor locks the reticle.
    const onOver = (event: PointerEvent) => {
      const el = (event.target as Element | null)?.closest<HTMLElement>('[data-cursor]')
      if (el) {
        setLocked(true)
        setLabel(el.dataset.cursorLabel ?? null)
      }
    }
    const onOut = (event: PointerEvent) => {
      const from = (event.target as Element | null)?.closest<HTMLElement>('[data-cursor]')
      const to = (event.relatedTarget as Element | null)?.closest<HTMLElement>('[data-cursor]')
      if (from && from !== to) {
        setLocked(false)
        setLabel(null)
      }
    }

    const tick = () => {
      ringPos.x = lerp(ringPos.x, target.x, MOTION.cursorLerp)
      ringPos.y = lerp(ringPos.y, target.y, MOTION.cursorLerp)

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) translate(-50%, -50%)`
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) translate(-50%, -50%)`
      }
      if (readoutRef.current) {
        // Map the pointer to a faux orbital coordinate for flavour.
        const latitude = (0.5 - target.y / window.innerHeight) * 180
        const longitude = (target.x / window.innerWidth - 0.5) * 360
        readoutRef.current.textContent = `${latitude.toFixed(1)} · ${longitude.toFixed(1)}`
      }
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerover', onOver, { passive: true })
    window.addEventListener('pointerout', onOut, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerover', onOver)
      window.removeEventListener('pointerout', onOut)
      document.removeEventListener('pointerleave', onLeave)
      root.classList.remove('has-custom-cursor', 'cursor-visible')
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-cursor hidden [html.cursor-visible_&]:block">
      {/* Fast centre dot */}
      <div
        ref={dotRef}
        className="fixed left-0 top-0 h-1.5 w-1.5 rounded-full bg-accent-bright"
        style={{ boxShadow: '0 0 8px 1px rgba(169, 231, 255, 0.8)' /* mirrors --accent-bright */ }}
      />

      {/* Inertial targeting ring + crosshair + corner ticks + readout */}
      <div
        ref={ringRef}
        className="fixed left-0 top-0 transition-[width,height,opacity] duration-300 ease-cinematic"
        style={{ width: locked ? 64 : 34, height: locked ? 64 : 34 }}
      >
        <div className="relative h-full w-full">
          {/* Ring */}
          <div
            className="absolute inset-0 rounded-full border transition-colors duration-300"
            style={{ borderColor: locked ? 'var(--accent)' : 'rgba(157, 187, 214, 0.55)' }}
          />
          {/* Crosshair */}
          <span className="absolute left-1/2 top-1/2 h-2 w-px -translate-x-1/2 -translate-y-1/2 bg-ice/50" />
          <span className="absolute left-1/2 top-1/2 h-px w-2 -translate-x-1/2 -translate-y-1/2 bg-ice/50" />
          {/* Corner ticks appear when locked */}
          <div
            className="absolute -inset-1 transition-opacity duration-300"
            style={{ opacity: locked ? 1 : 0 }}
          >
            {['left-0 top-0', 'right-0 top-0', 'left-0 bottom-0', 'right-0 bottom-0'].map((pos) => (
              <span
                key={pos}
                className={`absolute ${pos} h-1.5 w-1.5 border-accent`}
                style={{
                  borderTopWidth: pos.includes('top') ? 1 : 0,
                  borderBottomWidth: pos.includes('bottom') ? 1 : 0,
                  borderLeftWidth: pos.includes('left') ? 1 : 0,
                  borderRightWidth: pos.includes('right') ? 1 : 0,
                }}
              />
            ))}
          </div>
        </div>

        {/* Live coordinate / label readout, offset from the ring */}
        <div className="absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.2em]">
          {label ? (
            <span className="text-accent-bright">{label}</span>
          ) : (
            <span ref={readoutRef} className="text-ice/45" />
          )}
        </div>
      </div>
    </div>
  )
}
