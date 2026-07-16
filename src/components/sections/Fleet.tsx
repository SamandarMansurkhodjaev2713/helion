import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useI18n } from '../../i18n'
import type { ShipItem, ShipSpec } from '../../i18n/types'
import { SECTION_ID } from '../../lib/constants'
import { clamp01, easeOutExpo } from '../../lib/easing'
import { useInView, useReducedMotion } from '../../lib/hooks'
import SectionShell from '../primitives/SectionShell'
import SectionHeading from '../primitives/SectionHeading'
import Reveal from '../primitives/Reveal'
import TiltCard from '../primitives/TiltCard'

const COUNT_DURATION = 850
/** One reused tabpanel is swapped between ships, so every tab points at this
 *  stable id (an id per-ship would dangle for the inactive, unrendered panels). */
const PANEL_ID = 'fleet-panel'

/** Count a numeric string up from zero once `play` is true, re-running when the
 *  target changes (i.e. when a different ship is selected). */
function useCountUp(target: string, play: boolean, reduced: boolean): string {
  const decimals = target.includes('.') ? target.split('.')[1].length : 0
  const [value, setValue] = useState(reduced ? target : (0).toFixed(decimals))
  const rafRef = useRef(0)

  useEffect(() => {
    if (reduced) {
      setValue(target)
      return
    }
    if (!play) {
      setValue((0).toFixed(decimals))
      return
    }
    const to = parseFloat(target)
    let startTime = 0
    const step = (now: number) => {
      if (!startTime) startTime = now
      const progress = clamp01((now - startTime) / COUNT_DURATION)
      setValue((to * easeOutExpo(progress)).toFixed(decimals))
      if (progress < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, play, reduced, decimals])

  return value
}

function SpecRow({ spec, play, delay }: { spec: ShipSpec; play: boolean; delay: number }) {
  const reduced = useReducedMotion()
  const value = useCountUp(spec.value, play, reduced)

  return (
    <div className="border-b border-white/10 pb-3">
      <div className="flex items-baseline justify-between gap-6">
        <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-bone/45">
          {spec.label}
        </span>
        <span className="font-mono text-xl font-medium tabular-nums tracking-tight text-bone">
          {value}
          <span className="ml-1.5 font-sans text-xs font-normal text-steel">{spec.unit}</span>
        </span>
      </div>
      {/* Bar sweeps in once the spec is in view */}
      <div className="mt-2.5 h-px w-full overflow-hidden bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-accent to-accent/20 transition-transform duration-1000 ease-cinematic"
          style={{
            transform: play ? 'translateX(0)' : 'translateX(-100%)',
            transitionDelay: `${delay}ms`,
          }}
        />
      </div>
    </div>
  )
}

/** Decorative orbital schematic that drifts slowly; re-keyed per ship change. */
function ShipSchematic({ shipId }: { shipId: string }) {
  const reduced = useReducedMotion()
  return (
    <svg
      key={shipId}
      viewBox="0 0 200 200"
      aria-hidden
      className={`h-full w-full ${reduced ? '' : 'animate-drift-slow'}`}
    >
      <g fill="none" stroke="currentColor" className="text-steel/30">
        <circle cx="100" cy="100" r="78" strokeDasharray="2 6" />
        <circle cx="100" cy="100" r="56" strokeDasharray="1 5" />
        <ellipse cx="100" cy="100" rx="90" ry="34" />
        <ellipse cx="100" cy="100" rx="90" ry="34" transform="rotate(60 100 100)" />
        <ellipse cx="100" cy="100" rx="90" ry="34" transform="rotate(-60 100 100)" />
      </g>
      <g className="text-accent">
        <circle cx="100" cy="100" r="4" fill="currentColor" />
        <circle cx="190" cy="100" r="2.5" fill="currentColor" />
        <circle cx="44" cy="56" r="2" fill="currentColor" />
      </g>
    </svg>
  )
}

/** Corner tick of the schematic instrument frame. */
function InstrumentTick({ position }: { position: string }) {
  const edges = [
    position.includes('top') ? 'border-t' : 'border-b',
    position.includes('left') ? 'border-l' : 'border-r',
  ].join(' ')
  return <span aria-hidden className={`absolute ${position} h-2.5 w-2.5 ${edges} border-accent/50`} />
}

function ShipDetail({ ship }: { ship: ShipItem }) {
  const [ref, inView] = useInView<HTMLDivElement>({ once: true, threshold: 0.3 })

  return (
    <div ref={ref} className="relative grid gap-10 md:grid-cols-[1fr_auto] md:items-center md:gap-16">
      {/* Re-key on ship change so text re-enters with a focus pull */}
      <div key={ship.id}>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-steel">{ship.klass}</p>
        <h3 className="mt-3 text-2xl font-extralight uppercase tracking-cine text-bone md:text-4xl">
          {ship.name}
        </h3>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-accent/80">
          {ship.role}
        </p>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-bone/60">{ship.description}</p>

        <div className="mt-9 grid grid-cols-1 gap-x-12 gap-y-5 sm:grid-cols-2">
          {ship.specs.map((spec, index) => (
            <SpecRow
              key={`${ship.id}-${spec.label}`}
              spec={spec}
              play={inView}
              delay={index * 90}
            />
          ))}
        </div>
      </div>

      {/* Orbital schematic in a ticked instrument frame */}
      <TiltCard className="mx-auto w-52 md:w-64">
        <div className="relative aspect-square border border-white/10 p-5 text-steel">
          <InstrumentTick position="-left-px -top-px" />
          <InstrumentTick position="-right-px -top-px" />
          <InstrumentTick position="-left-px -bottom-px" />
          <InstrumentTick position="-right-px -bottom-px" />
          <ShipSchematic shipId={ship.id} />
        </div>
      </TiltCard>
    </div>
  )
}

/** WAI-ARIA tablist for the fleet: roving tabindex + arrow/Home/End keyboard nav,
 *  each tab wired to the shared panel via aria-controls. */
function ShipTabs({
  ships,
  activeId,
  onSelect,
  label,
}: {
  ships: ShipItem[]
  activeId: string
  onSelect: (id: string) => void
  label: string
}) {
  const btnRefs = useRef<Array<HTMLButtonElement | null>>([])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = ships.findIndex((ship) => ship.id === activeId)
    let next = current
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = (current + 1) % ships.length
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        next = (current - 1 + ships.length) % ships.length
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = ships.length - 1
        break
      default:
        return
    }
    event.preventDefault()
    onSelect(ships[next].id)
    btnRefs.current[next]?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      aria-orientation="horizontal"
      onKeyDown={handleKeyDown}
      className="flex gap-8 overflow-x-auto border-b border-white/10 md:gap-12"
    >
      {ships.map((ship, index) => {
        const isActive = ship.id === activeId
        return (
          <button
            key={ship.id}
            ref={(el) => {
              btnRefs.current[index] = el
            }}
            role="tab"
            id={`fleet-tab-${ship.id}`}
            aria-selected={isActive}
            aria-controls={PANEL_ID}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSelect(ship.id)}
            data-cursor="link"
            className={`group relative shrink-0 pb-4 text-left transition-colors duration-300 ${
              isActive ? 'text-bone' : 'text-bone/40 hover:text-bone/75'
            }`}
          >
            <span className="block font-mono text-[10px] tracking-[0.2em] text-steel">
              0{index + 1}
            </span>
            <span className="mt-1 block text-base font-extralight uppercase tracking-cine md:text-lg">
              {ship.name}
            </span>
            <span
              aria-hidden
              className={`absolute -bottom-px left-0 h-px w-full origin-left bg-accent transition-transform duration-500 ease-cinematic ${
                isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-50'
              }`}
            />
          </button>
        )
      })}
    </div>
  )
}

export default function Fleet() {
  const { t } = useI18n()
  const ships = t.fleet.ships
  const [activeId, setActiveId] = useState(ships[0].id)
  const activeShip = ships.find((ship) => ship.id === activeId) ?? ships[0]

  return (
    <SectionShell
      id={SECTION_ID.fleet}
      atmosphere="steel"
      className="mx-auto max-w-7xl px-5 py-28 md:px-10 md:py-44"
    >
      <SectionHeading
        eyebrow={t.fleet.eyebrow}
        title={t.fleet.title}
        titleEmphasis={t.fleet.titleEmphasis}
        intro={t.fleet.intro}
        className="mb-14 md:mb-20"
      />

      <Reveal variant="rise" delay={120}>
        <ShipTabs
          ships={ships}
          activeId={activeId}
          onSelect={setActiveId}
          label={t.fleet.selectHint}
        />

        <div
          id={PANEL_ID}
          role="tabpanel"
          aria-labelledby={`fleet-tab-${activeShip.id}`}
          tabIndex={0}
          className="pt-10 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent md:pt-14"
        >
          <ShipDetail ship={activeShip} />
        </div>
      </Reveal>
    </SectionShell>
  )
}
