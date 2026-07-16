import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useI18n } from '../../i18n'
import type { ShipItem, ShipSpec } from '../../i18n/types'
import { SCENE_NO, SECTION_ID, asset } from '../../lib/constants'
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

/** Archive stills of the fleet — real NASA photography (public domain, IDs in
 *  the README) graded into the site's cold duotone at render time. */
const STILLS: Record<string, string> = {
  aurora: 'still_aurora.jpg',
  vesta: 'still_vesta.jpg',
  xerxes: 'still_xerxes.jpg',
}

/** A cinematic "archive frame" of the selected ship: the photo is desaturated
 *  and re-tinted cold via blend layers, framed with ticks, grain and a mono
 *  caption. Re-keyed per ship so the frame re-enters with the focus pull. */
function ShipStill({ ship, label }: { ship: ShipItem; label: string }) {
  return (
    <figure key={ship.id} className="relative m-0 h-full overflow-hidden border border-white/10 bg-void grain">
      <img
        src={asset(STILLS[ship.id] ?? STILLS.aurora)}
        alt={`${ship.name} — ${ship.role}`}
        loading="lazy"
        className="h-full w-full object-cover grayscale contrast-[1.08] brightness-[0.82]"
      />
      {/* Cold duotone: colorize pass (mirrors --deep) + a cyan lift (mirrors --accent) */}
      <div aria-hidden className="absolute inset-0 mix-blend-color" style={{ background: 'rgb(30, 52, 76)' }} />
      <div
        aria-hidden
        className="absolute inset-0 mix-blend-soft-light"
        style={{ background: 'linear-gradient(135deg, rgba(111,211,242,0.38), transparent 62%)' }}
      />
      {/* Frame shading + caption */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-void/75 via-transparent to-void/25" />
      <figcaption className="absolute inset-x-0 bottom-0 flex items-baseline justify-between px-3.5 pb-2.5 font-mono text-[9px] uppercase tracking-[0.18em] text-bone/60">
        <span>{ship.id.toUpperCase()} · {label}</span>
        <span className="text-accent/70">{ship.klass}</span>
      </figcaption>
    </figure>
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

function ShipDetail({ ship, stillLabel }: { ship: ShipItem; stillLabel: string }) {
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

      {/* Archive still in a ticked frame */}
      <TiltCard className="mx-auto w-full max-w-[360px] md:w-96 md:max-w-none">
        <div className="relative aspect-[4/3]">
          <InstrumentTick position="-left-px -top-px" />
          <InstrumentTick position="-right-px -top-px" />
          <InstrumentTick position="-left-px -bottom-px" />
          <InstrumentTick position="-right-px -bottom-px" />
          <div className="absolute inset-0">
            <ShipStill ship={ship} label={stillLabel} />
          </div>
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
      className="flex gap-3 overflow-x-auto pb-1 md:gap-4"
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
            className={`group relative min-w-[130px] shrink-0 border px-4 py-3 text-left transition-colors duration-300 md:min-w-[170px] ${
              isActive
                ? 'border-accent/60 bg-accent/[0.07] text-bone'
                : 'border-white/15 text-bone/45 hover:border-accent/35 hover:bg-white/[0.02] hover:text-bone/85'
            }`}
          >
            <span className="flex items-center justify-between font-mono text-[10px] tracking-[0.2em]">
              <span className={isActive ? 'text-accent' : 'text-steel'}>0{index + 1}</span>
              <span
                aria-hidden
                className={`transition-transform duration-300 ${
                  isActive ? 'text-accent' : 'text-bone/30 group-hover:translate-x-0.5'
                }`}
              >
                ▸
              </span>
            </span>
            <span className="mt-1.5 block text-base font-extralight uppercase tracking-cine md:text-lg">
              {ship.name}
            </span>
            <span
              aria-hidden
              className={`absolute inset-x-0 -bottom-px h-px origin-left bg-accent transition-transform duration-500 ease-cinematic ${
                isActive ? 'scale-x-100' : 'scale-x-0'
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
      scene={SCENE_NO[SECTION_ID.fleet]}
      className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-44"
    >
      <SectionHeading
        eyebrow={t.fleet.eyebrow}
        title={t.fleet.title}
        titleEmphasis={t.fleet.titleEmphasis}
        intro={t.fleet.intro}
        className="mb-10 md:mb-20"
      />

      <Reveal variant="rise" delay={120}>
        {/* Visible affordance: tell people the slates below switch the sheet */}
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-steel/80">
          {t.fleet.selectHint} ↓
        </p>
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
          className="pt-10 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent md:pt-12"
        >
          <ShipDetail ship={activeShip} stillLabel={t.fleet.stillLabel} />
        </div>
      </Reveal>
    </SectionShell>
  )
}
