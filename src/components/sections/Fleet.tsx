import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useI18n } from '../../i18n'
import type { ShipItem, ShipSpec } from '../../i18n/types'
import { SECTION_ID } from '../../lib/constants'
import { clamp01, easeOutExpo } from '../../lib/easing'
import { useInView, useReducedMotion } from '../../lib/hooks'
import SectionShell from '../primitives/SectionShell'
import SectionHeading from '../primitives/SectionHeading'
import Reveal from '../primitives/Reveal'

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
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-bone/45">
          {spec.label}
        </span>
        <span className="font-mono text-xl font-medium tabular-nums tracking-tight text-bone">
          {value}
          <span className="ml-1 font-sans text-xs font-normal text-steel">{spec.unit}</span>
        </span>
      </div>
      {/* Bar sweeps in once the spec is in view */}
      <div className="mt-2 h-px w-full overflow-hidden bg-white/10">
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

/** Decorative orbital schematic that fades/scales in whenever the ship changes. */
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

function ShipDetail({ ship }: { ship: ShipItem }) {
  const [ref, inView] = useInView<HTMLDivElement>({ once: true, threshold: 0.3 })

  return (
    <div ref={ref} className="relative grid gap-10 md:grid-cols-[1fr_auto] md:items-center">
      {/* Re-key on ship change so text re-enters with a focus pull */}
      <div key={ship.id}>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-steel">{ship.klass}</p>
        <h3 className="mt-3 font-display text-2xl font-medium uppercase tracking-[0.04em] text-bone md:text-3xl">
          {ship.name}
        </h3>
        <p className="mt-2 text-sm text-accent/80">{ship.role}</p>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-bone/60">{ship.description}</p>

        <div className="mt-8 grid grid-cols-2 gap-x-10 gap-y-6">
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

      <div className="mx-auto aspect-square w-48 text-steel md:w-60">
        <ShipSchematic shipId={ship.id} />
      </div>
    </div>
  )
}

/** WAI-ARIA tablist for the fleet: roving tabindex + arrow/Home/End keyboard nav,
 *  each tab wired to its panel via aria-controls. */
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
      aria-orientation="vertical"
      onKeyDown={handleKeyDown}
      className="flex gap-3 overflow-x-auto pb-2 lg:flex-col lg:gap-2 lg:overflow-visible lg:border-l lg:border-white/10"
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
            className={`group relative shrink-0 rounded-xl px-4 py-3 text-left transition-colors duration-300 lg:rounded-none lg:border-l-2 lg:pl-5 ${
              isActive
                ? 'bg-white/5 text-bone lg:-ml-px lg:border-accent lg:bg-transparent'
                : 'text-bone/45 hover:text-bone/80 lg:border-transparent'
            }`}
          >
            <span className="block font-mono text-[10px] tracking-[0.2em] text-steel">
              0{index + 1}
            </span>
            <span className="mt-1 block text-lg font-light">{ship.name}</span>
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
      className="mx-auto max-w-7xl px-6 py-28 md:px-10 md:py-40"
    >
      <SectionHeading
        eyebrow={t.fleet.eyebrow}
        title={t.fleet.title}
        titleEmphasis={t.fleet.titleEmphasis}
        intro={t.fleet.intro}
      />

      <Reveal variant="rise" delay={120} className="mt-14">
        <div className="grid gap-10 lg:grid-cols-[260px_1fr] lg:gap-16">
          {/* Ship selector — horizontal scroll on mobile, vertical list on desktop */}
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
            className="rounded-2xl border border-white/10 bg-panel/40 p-6 backdrop-blur-sm focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent md:p-10"
          >
            <ShipDetail ship={activeShip} />
          </div>
        </div>
      </Reveal>
    </SectionShell>
  )
}
