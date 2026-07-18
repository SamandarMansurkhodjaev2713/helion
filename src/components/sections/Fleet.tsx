import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useI18n } from '../../i18n'
import type { ShipItem, ShipSpec } from '../../i18n/types'
import { SCENE_NO, SECTION_ID, asset } from '../../lib/constants'
import { clamp01, easeOutExpo, mapRange } from '../../lib/easing'
import {
  useHaptics,
  useInView,
  useReducedMotion,
  useViewportProgress,
} from '../../lib/hooks'
import { useSound } from '../../lib/SoundProvider'
import SectionShell from '../primitives/SectionShell'
import SectionHeading from '../primitives/SectionHeading'
import LineReveal from '../primitives/LineReveal'
import MediaDevelop from '../primitives/MediaDevelop'

const COUNT_DURATION = 850
/** One reused tabpanel is swapped between ships, so every tab points at this
 *  stable id (an id per-ship would dangle for the inactive, unrendered panels). */
const PANEL_ID = 'fleet-panel'

/** Archive stills of the fleet — real NASA photography (public domain, IDs in
 *  the README) graded into the site's cold duotone at render time. */
const STILLS: Record<string, string> = {
  aurora: 'still_aurora.jpg',
  vesta: 'still_vesta.jpg',
  xerxes: 'still_xerxes.jpg',
}

/** Catalogue captions stamped on each archive frame. */
const FRAME_META: Record<string, { orbit: string; date: string; exposure: string }> = {
  aurora: { orbit: 'ORB 402 KM', date: '2027.03.14', exposure: 'f/8 · 1/250' },
  vesta: { orbit: 'ORB 388 KM', date: '2026.11.02', exposure: 'f/5.6 · 1/400' },
  xerxes: { orbit: 'ORB 411 KM', date: '2027.01.28', exposure: 'f/11 · 1/125' },
}

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

/**
 * One specification row. The bar fills to this ship's share of the fleet's
 * best figure for that row, and the other two ships leave ghost ticks behind —
 * so the numbers carry comparison, not just decoration.
 */
function SpecRow({
  spec,
  index,
  ships,
  activeId,
  play,
  delay,
}: {
  spec: ShipSpec
  index: number
  ships: ShipItem[]
  activeId: string
  play: boolean
  delay: number
}) {
  const reduced = useReducedMotion()
  const value = useCountUp(spec.value, play, reduced)

  // Compare like with like: the same row position across the fleet.
  const peers = ships.map((ship) => ({
    id: ship.id,
    value: parseFloat(ship.specs[index]?.value ?? '0'),
  }))
  const max = Math.max(...peers.map((peer) => peer.value), 0.0001)
  const share = clamp01(parseFloat(spec.value) / max)

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

      <div className="relative mt-2.5 h-px w-full bg-white/10">
        {/* Ghost ticks: where the other ships sit on this scale */}
        {peers
          .filter((peer) => peer.id !== activeId)
          .map((peer) => (
            <span
              key={peer.id}
              aria-hidden
              className="absolute -top-1 h-[7px] w-px bg-bone/25"
              style={{ left: `${clamp01(peer.value / max) * 100}%` }}
            />
          ))}
        {/* This ship's fill */}
        <span
          className="absolute left-0 top-0 h-px origin-left bg-gradient-to-r from-accent to-accent/25 transition-transform duration-1000 ease-cinematic"
          style={{
            width: `${share * 100}%`,
            transform: play ? 'scaleX(1)' : 'scaleX(0)',
            transitionDelay: `${delay}ms`,
          }}
        />
      </div>
    </div>
  )
}

/** Corner tick of the archive frame. */
function FrameTick({ position }: { position: string }) {
  const edges = [
    position.includes('top') ? 'border-t' : 'border-b',
    position.includes('left') ? 'border-l' : 'border-r',
  ].join(' ')
  return <span aria-hidden className={`absolute ${position} h-3 w-3 ${edges} border-accent/50`} />
}

/**
 * The hero frame: a full-height archive still that parallaxes inside its
 * window, develops like a photograph on entry, and changes with a projector's
 * vertical snap when another ship is selected.
 */
function ShipStill({ ship, label, switching }: { ship: ShipItem; label: string; switching: boolean }) {
  const reduced = useReducedMotion()
  const [ref, progress] = useViewportProgress<HTMLDivElement>(!reduced)
  const meta = FRAME_META[ship.id] ?? FRAME_META.aurora
  // The photo drifts slower than the frame — the window breathes.
  const shift = reduced ? 0 : mapRange(progress, 0, 1, -6, 6)

  return (
    <div
      ref={ref}
      className="relative h-[52vh] overflow-hidden border border-white/10 bg-void grain md:h-[68vh]"
    >
      <FrameTick position="-left-px -top-px" />
      <FrameTick position="-right-px -top-px" />
      <FrameTick position="-left-px -bottom-px" />
      <FrameTick position="-right-px -bottom-px" />

      <MediaDevelop developKey={ship.id} className="absolute inset-0">
        <figure
          className="m-0 h-full w-full"
          style={{
            // Projector snap: the outgoing frame slides up out of the gate.
            transform: `translateY(${switching ? -3 : shift}%) scale(1.08)`,
            opacity: switching ? 0.25 : 1,
            transition: 'transform 420ms var(--ease-cinematic), opacity 320ms ease-out',
          }}
        >
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
        </figure>
      </MediaDevelop>

      {/* Frame shading + catalogue captions */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-void/80 via-transparent to-void/30" />
      <div className="absolute inset-x-0 top-0 flex justify-between px-4 pt-3.5 font-mono text-[9px] uppercase tracking-[0.18em] text-bone/45">
        <span>{meta.orbit}</span>
        <span>{meta.date}</span>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-baseline justify-between px-4 pb-3.5 font-mono text-[9px] uppercase tracking-[0.18em] text-bone/55">
        <span>
          {ship.id.toUpperCase()} · {label}
        </span>
        <span className="text-accent/70">{meta.exposure}</span>
      </div>
    </div>
  )
}

function ShipDetail({
  ship,
  ships,
  stillLabel,
  switching,
}: {
  ship: ShipItem
  ships: ShipItem[]
  stillLabel: string
  switching: boolean
}) {
  const [ref, inView] = useInView<HTMLDivElement>({ once: true, threshold: 0.2 })

  return (
    <div ref={ref} className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
      {/* Re-key on ship change so the text re-enters with the frame */}
      <div key={ship.id}>
        <LineReveal stagger={70} distance={0.8}>
          <p className="block font-mono text-xs uppercase tracking-[0.2em] text-steel">
            {ship.klass}
          </p>
          <h3 className="title-cine mt-3 block text-bone">{ship.name}</h3>
          <p className="mt-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-accent/80">
            {ship.role}
          </p>
          <p className="mt-5 block max-w-md text-sm leading-relaxed text-bone/60">
            {ship.description}
          </p>
        </LineReveal>

        <div className="mt-9 grid grid-cols-1 gap-x-12 gap-y-5 sm:grid-cols-2">
          {ship.specs.map((spec, index) => (
            <SpecRow
              key={`${ship.id}-${spec.label}`}
              spec={spec}
              index={index}
              ships={ships}
              activeId={ship.id}
              play={inView}
              delay={index * 90}
            />
          ))}
        </div>
      </div>

      <ShipStill ship={ship} label={stillLabel} switching={switching} />
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
            data-cursor="tab"
            className={`group relative min-w-[132px] shrink-0 border px-4 py-3 text-left transition-colors duration-300 active:scale-[0.98] md:min-w-[170px] ${
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
  const { play } = useSound()
  const haptic = useHaptics()
  const ships = t.fleet.ships
  const [activeId, setActiveId] = useState(ships[0].id)
  const [switching, setSwitching] = useState(false)
  const activeShip = ships.find((ship) => ship.id === activeId) ?? ships[0]

  /** Selecting runs the projector snap before the new frame develops. */
  const select = (id: string) => {
    if (id === activeId) return
    play('select')
    haptic('medium')
    setSwitching(true)
    window.setTimeout(() => {
      setActiveId(id)
      setSwitching(false)
    }, 200)
  }

  return (
    <SectionShell
      id={SECTION_ID.fleet}
      atmosphere="steel"
      light="top"
      scene={SCENE_NO[SECTION_ID.fleet]}
      className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-44"
    >
      <SectionHeading
        eyebrow={t.fleet.eyebrow}
        title={t.fleet.title}
        titleEmphasis={t.fleet.titleEmphasis}
        intro={t.fleet.intro}
        className="mb-10 md:mb-16"
      />

      {/* Visible affordance: tell people the slates below switch the sheet */}
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-steel/80">
        {t.fleet.selectHint} ↓
      </p>
      <ShipTabs ships={ships} activeId={activeId} onSelect={select} label={t.fleet.selectHint} />

      <div
        id={PANEL_ID}
        role="tabpanel"
        aria-labelledby={`fleet-tab-${activeShip.id}`}
        tabIndex={0}
        className="pt-10 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent md:pt-14"
      >
        <ShipDetail
          ship={activeShip}
          ships={ships}
          stillLabel={t.fleet.stillLabel}
          switching={switching}
        />
      </div>
    </SectionShell>
  )
}
