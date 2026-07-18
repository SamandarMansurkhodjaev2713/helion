import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n'
import type { MissionItem, MissionStatus } from '../../i18n/types'
import { SCENE_NO, SECTION_ID } from '../../lib/constants'
import { useHaptics, useReducedMotion } from '../../lib/hooks'
import { useSound } from '../../lib/SoundProvider'
import SectionShell from '../primitives/SectionShell'
import SectionHeading from '../primitives/SectionHeading'
import LineReveal from '../primitives/LineReveal'

/** Speed of the ship's-log teletype, ms per character. */
const LOG_SPEED = 14

/** Types a line out character by character once `run` is true. */
function useTeletype(text: string, run: boolean, delay = 0): string {
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(reduced ? text : '')

  useEffect(() => {
    if (reduced) {
      setShown(text)
      return
    }
    if (!run) {
      setShown('')
      return
    }
    let index = 0
    let timer = 0
    const start = window.setTimeout(() => {
      timer = window.setInterval(() => {
        index += 1
        setShown(text.slice(0, index))
        if (index >= text.length) window.clearInterval(timer)
      }, LOG_SPEED)
    }, delay)
    return () => {
      window.clearTimeout(start)
      window.clearInterval(timer)
    }
  }, [text, run, delay, reduced])

  return shown
}

function StatusMark({
  status,
  label,
  duration,
}: {
  status: MissionStatus
  label: string
  duration: string
}) {
  // The live mission carries the warm accent — it is the one thing on the page
  // that is happening *now*; finished and planned runs stay cold and quiet.
  const tone: Record<MissionStatus, string> = {
    active: 'text-mars',
    returned: 'text-steel',
    planned: 'text-bone/40',
  }
  return (
    <span
      className={`inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] ${tone[status]}`}
    >
      {status === 'planned' ? (
        <span aria-hidden className="h-1.5 w-1.5 rounded-full border border-current" />
      ) : (
        <span
          aria-hidden
          className={`h-1.5 w-1.5 rounded-full bg-current ${status === 'active' ? 'animate-pulse' : ''}`}
        />
      )}
      {label}
      {status === 'active' && (
        <span className="hidden text-mars/70 sm:inline">· {duration}</span>
      )}
    </span>
  )
}

/** The dossier's mini trajectory: a drawn arc from origin to target. */
function Trajectory({ mission, open }: { mission: MissionItem; open: boolean }) {
  const { t } = useI18n()
  const reduced = useReducedMotion()
  const drawn = open || reduced
  return (
    <figure className="m-0">
      <figcaption className="font-mono text-[10px] uppercase tracking-[0.2em] text-steel">
        {t.missions.trajectoryLabel}
      </figcaption>
      <svg viewBox="0 0 260 96" aria-hidden className="mt-3 w-full">
        {/* Reference baseline */}
        <path d="M14 78 H246" fill="none" stroke="currentColor" strokeDasharray="2 6" className="text-white/10" />
        {/* Flight arc */}
        <path
          d="M14 78 C 78 6, 182 6, 246 46"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          pathLength={1}
          className="text-accent/70"
          style={{
            strokeDasharray: 1,
            strokeDashoffset: drawn ? 0 : 1,
            transition: reduced ? undefined : 'stroke-dashoffset 1100ms var(--ease-cinematic) 120ms',
          }}
        />
        {/* Endpoints */}
        <circle cx="14" cy="78" r="3" className="fill-bone/70" />
        <circle
          cx="246"
          cy="46"
          r="3.5"
          className="fill-mars"
          style={{
            opacity: drawn ? 1 : 0,
            transition: reduced ? undefined : 'opacity 400ms ease-out 1100ms',
          }}
        />
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[9px] uppercase tracking-[0.15em] text-bone/40">
        <span>
          {t.missions.originLabel} · {mission.origin}
        </span>
        <span>
          {t.missions.targetLabel} · {mission.target}
        </span>
      </div>
    </figure>
  )
}

/** Two teletyped log lines from the ship's journal. */
function ShipLog({ mission, open }: { mission: MissionItem; open: boolean }) {
  const { t } = useI18n()
  const first = useTeletype(mission.log[0], open, 350)
  const second = useTeletype(mission.log[1], open, 1100)
  return (
    <div className="border-l border-white/10 pl-4">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-steel">
        {t.missions.logLabel}
      </span>
      <p className="mt-3 min-h-[2.6em] font-mono text-[10px] leading-relaxed tracking-[0.1em] text-accent/70">
        {first}
        {open && first.length < mission.log[0].length && (
          <span className="animate-pulse text-accent">▌</span>
        )}
      </p>
      <p className="mt-1.5 min-h-[2.6em] font-mono text-[10px] leading-relaxed tracking-[0.1em] text-bone/45">
        {second}
        {open && second.length > 0 && second.length < mission.log[1].length && (
          <span className="animate-pulse text-accent">▌</span>
        )}
      </p>
    </div>
  )
}

function MissionRow({
  mission,
  index,
  open,
  onToggle,
}: {
  mission: MissionItem
  index: number
  open: boolean
  onToggle: () => void
}) {
  const { t } = useI18n()
  const { play } = useSound()
  const haptic = useHaptics()
  const statusLabel: Record<MissionStatus, string> = {
    active: t.missions.statusActive,
    returned: t.missions.statusReturned,
    planned: t.missions.statusPlanned,
  }
  const stats: Array<{ value: string; label: string }> = [
    { value: mission.distance, label: t.missions.labelDistance },
    { value: mission.duration, label: t.missions.labelDuration },
    { value: mission.crew, label: t.missions.labelCrew },
  ]
  const panelId = `mission-panel-${mission.code}`

  return (
    <LineReveal delay={index * 90} distance={0.6}>
      <div className="relative border-b border-white/10">
        {/* Ghost mission code that surfaces on hover */}
        <span
          aria-hidden
          className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 select-none font-mono text-6xl font-light tracking-tight text-transparent opacity-0 transition-opacity duration-700 [-webkit-text-stroke:1px_rgba(111,211,242,0.16)] group-hover/row:opacity-100 md:block"
        >
          {mission.code}
        </span>

        {/* Ledger row — the whole line is the toggle */}
        <button
          type="button"
          onClick={() => {
            play('select')
            haptic('medium')
            onToggle()
          }}
          aria-expanded={open}
          aria-controls={panelId}
          data-cursor="expand"
          data-cursor-label={t.missions.viewDossier}
          className="group/row grid w-full grid-cols-[auto_1fr_auto_18px] items-center gap-x-4 py-6 text-left transition-[background-color,padding] duration-500 ease-cinematic hover:bg-white/[0.02] hover:md:pl-3 md:grid-cols-[90px_1fr_auto_36px] md:gap-x-8 md:py-9"
        >
          <span
            className={`font-mono text-2xl font-light tabular-nums transition-colors duration-500 md:text-4xl ${
              open ? 'text-accent' : 'text-bone/25 group-hover/row:text-accent/70'
            }`}
          >
            0{index + 1}
          </span>

          <span className="min-w-0">
            <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-steel">
              {mission.code}
            </span>
            <span className="title-cine mt-1.5 block text-bone transition-colors duration-300 group-hover/row:text-accent">
              {mission.name}
            </span>
          </span>

          <StatusMark
            status={mission.status}
            label={statusLabel[mission.status]}
            duration={mission.duration}
          />

          {/* Plus → minus indicator (always visible — it is the tap affordance) */}
          <span className="relative block h-3 w-3 justify-self-end" aria-hidden>
            <span
              className={`absolute left-0 top-1/2 h-px w-3 transition-colors duration-300 group-hover/row:bg-accent ${
                open ? 'bg-accent' : 'bg-bone/50'
              }`}
            />
            <span
              className={`absolute left-1/2 top-0 h-3 w-px transition-all duration-500 ease-cinematic group-hover/row:bg-accent ${
                open ? 'rotate-90 bg-accent opacity-0' : 'bg-bone/50'
              }`}
            />
          </span>
        </button>

        {/* Expanding dossier */}
        <div
          id={panelId}
          className="grid transition-[grid-template-rows] duration-700 ease-cinematic"
          style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="grid gap-8 pb-9 md:grid-cols-[90px_minmax(0,1fr)_minmax(0,1fr)] md:gap-x-8 md:pb-12">
              <span aria-hidden className="hidden md:block" />

              <div className="flex flex-col gap-6">
                <p className="max-w-[52ch] text-sm leading-relaxed text-bone/60">
                  {mission.summary}
                </p>
                <dl className="flex gap-8 md:gap-10">
                  {stats.map((stat) => (
                    <div key={stat.label}>
                      <dt className="font-mono text-[10px] uppercase tracking-wide text-bone/40">
                        {stat.label}
                      </dt>
                      <dd className="mt-1 font-mono text-base font-medium tracking-tight text-bone">
                        {stat.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="flex flex-col gap-6">
                <Trajectory mission={mission} open={open} />
                <ShipLog mission={mission} open={open} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </LineReveal>
  )
}

export default function Missions() {
  const { t } = useI18n()
  // The flagship mission starts unfolded so the section never reads empty.
  const [openCode, setOpenCode] = useState<string | null>(t.missions.items[0]?.code ?? null)

  return (
    <SectionShell
      id={SECTION_ID.missions}
      atmosphere="accent"
      light="left"
      scene={SCENE_NO[SECTION_ID.missions]}
      className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-44"
    >
      <SectionHeading
        eyebrow={t.missions.eyebrow}
        title={t.missions.title}
        titleEmphasis={t.missions.titleEmphasis}
        intro={t.missions.intro}
        className="mb-10 md:mb-20"
      />

      <div className="border-t border-white/10">
        {t.missions.items.map((mission, index) => (
          <MissionRow
            key={mission.code}
            mission={mission}
            index={index}
            open={openCode === mission.code}
            onToggle={() => setOpenCode(openCode === mission.code ? null : mission.code)}
          />
        ))}
      </div>
    </SectionShell>
  )
}
