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

/** Per-ship line-art: hull paths, optional ring ellipses, accent points and a
 *  blueprint scale note. Coordinates live in a 240×160 viewBox, hull on y=80. */
interface BlueprintSpec {
  paths: string[]
  ellipses: Array<{ cx: number; cy: number; rx: number; ry: number }>
  accents: Array<[number, number]>
  scale: string
}

const BLUEPRINTS: Record<string, BlueprintSpec> = {
  aurora: {
    paths: [
      'M24 80 H150', // spine
      'M24 80 H12 M14 74 V86', // nose probe + sensor tick
      'M150 71 H186 V89 H150 Z', // crew module
      'M156 76 V84 M162 76 V84 M168 76 V84', // window slits
      'M186 72 H202 V88 H186 Z', // engine block
      'M202 74 H212 M202 80 H214 M202 86 H212', // nozzles
      'M60 71 V54 H70 M60 89 V106 H70', // fore radiators
      'M124 71 V60 H132 M124 89 V100 H132', // aft radiators
    ],
    ellipses: [
      { cx: 95, cy: 80, rx: 17, ry: 27 }, // habitation ring
      { cx: 95, cy: 80, rx: 11, ry: 19 },
    ],
    accents: [
      [208, 80],
      [95, 53],
    ],
    scale: 'SCALE 1:400',
  },
  vesta: {
    paths: [
      'M20 80 H208', // spine
      'M30 70 H56 V90 H30 Z', // tug head
      'M30 75 L18 80 L30 85', // nose wedge
      'M38 74 V86', // cockpit slit
      'M70 66 H100 V94 H70 Z M70 66 L100 94', // cargo frame 1 + brace
      'M108 66 H138 V94 H108 Z M108 66 L138 94', // cargo frame 2 + brace
      'M146 66 H176 V94 H146 Z M146 66 L176 94', // cargo frame 3 + brace
      'M184 71 H200 V89 H184 Z', // engine block
      'M200 75 H210 M200 85 H210', // nozzles
    ],
    ellipses: [],
    accents: [
      [24, 80],
      [205, 80],
    ],
    scale: 'SCALE 1:520',
  },
  xerxes: {
    paths: [
      'M26 80 L108 68 H176 L206 80 L176 92 H108 Z', // dart fuselage
      'M116 68 L128 60 H146 L152 68', // canopy
      'M150 68 L166 50 L174 53 L162 68', // dorsal fin
      'M150 92 L166 110 L174 107 L162 92', // ventral fin
      'M26 80 H12', // pitot boom
      'M206 76 H218 M206 84 H218', // exhaust
    ],
    ellipses: [],
    accents: [[200, 80]],
    scale: 'SCALE 1:260',
  },
}

const BLUEPRINT_TEXT_STYLE = {
  font: '500 6.5px "JetBrains Mono", monospace',
  letterSpacing: '0.15em',
} as const

/** Stagger for the draw-on animation of blueprint line-work. */
const drawOn = (index: number) => ({
  animation: `blueprint-draw 800ms var(--ease-cinematic) ${120 + index * 90}ms forwards`,
})

/** A technical blueprint of the selected ship: dashed drawing frame, dash-dot
 *  centreline, hull line-work that draws itself on (re-keyed per ship), accent
 *  beacons and a dimension line with a scale note. */
function ShipBlueprint({ ship }: { ship: ShipItem }) {
  const spec = BLUEPRINTS[ship.id] ?? BLUEPRINTS.aurora
  return (
    <svg key={ship.id} viewBox="0 0 240 160" aria-hidden className="h-full w-full">
      {/* Drawing-sheet chrome */}
      <g fill="none" stroke="currentColor" className="text-steel/25">
        <rect x="6" y="6" width="228" height="124" strokeDasharray="3 5" />
      </g>
      <path
        d="M6 80 H234"
        fill="none"
        stroke="currentColor"
        strokeDasharray="8 5 1.5 5"
        className="text-steel/20"
      />

      {/* Hull line-work — draws itself on */}
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-bone/70"
      >
        {spec.paths.map((d, index) => (
          <path
            key={d}
            d={d}
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={1}
            style={drawOn(index)}
          />
        ))}
        {spec.ellipses.map((e, index) => (
          <ellipse
            key={`${e.cx}-${e.rx}`}
            cx={e.cx}
            cy={e.cy}
            rx={e.rx}
            ry={e.ry}
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={1}
            style={drawOn(spec.paths.length + index)}
          />
        ))}
      </g>

      {/* Beacon points */}
      <g className="fill-accent">
        {spec.accents.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="2" />
        ))}
      </g>

      {/* Dimension line + labels */}
      <g stroke="currentColor" className="text-steel/50">
        <path d="M24 142 H96 M144 142 H216" fill="none" />
        <path d="M24 138 V146 M216 138 V146" fill="none" />
      </g>
      <text x="120" y="144.5" textAnchor="middle" className="fill-steel" style={BLUEPRINT_TEXT_STYLE}>
        {spec.scale}
      </text>
      <text x="230" y="18" textAnchor="end" className="fill-steel" style={BLUEPRINT_TEXT_STYLE}>
        {ship.id.toUpperCase()}
      </text>
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

      {/* Technical blueprint in a ticked instrument frame */}
      <TiltCard className="mx-auto w-full max-w-[320px] md:w-80 md:max-w-none">
        <div className="relative aspect-[3/2] border border-white/10 bg-white/[0.015] p-3">
          <InstrumentTick position="-left-px -top-px" />
          <InstrumentTick position="-right-px -top-px" />
          <InstrumentTick position="-left-px -bottom-px" />
          <InstrumentTick position="-right-px -bottom-px" />
          <ShipBlueprint ship={ship} />
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
