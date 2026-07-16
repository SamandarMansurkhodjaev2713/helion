import { useState } from 'react'
import { useI18n } from '../../i18n'
import type { MissionItem, MissionStatus } from '../../i18n/types'
import { SCENE_NO, SECTION_ID } from '../../lib/constants'
import SectionShell from '../primitives/SectionShell'
import SectionHeading from '../primitives/SectionHeading'
import Reveal from '../primitives/Reveal'

function StatusMark({ status, label }: { status: MissionStatus; label: string }) {
  const tone: Record<MissionStatus, string> = {
    active: 'text-accent',
    returned: 'text-steel',
    planned: 'text-bone/45',
  }
  return (
    <span
      className={`inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] ${tone[status]}`}
    >
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full ${status === 'active' ? 'animate-pulse bg-accent' : 'bg-current'}`}
      />
      {label}
    </span>
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
    <Reveal variant="clip" delay={index * 100}>
      <div className="border-b border-white/10">
        {/* Ledger row — the whole line is the toggle */}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          data-cursor="link"
          data-cursor-label={t.missions.viewDossier}
          className="group grid w-full grid-cols-[auto_1fr_auto_18px] items-center gap-x-4 py-6 text-left transition-colors duration-300 hover:bg-white/[0.02] md:grid-cols-[90px_1fr_auto_36px] md:gap-x-8 md:py-9"
        >
          <span
            className={`font-mono text-2xl font-light tabular-nums transition-colors duration-500 md:text-4xl ${
              open ? 'text-accent' : 'text-bone/25 group-hover:text-accent/70'
            }`}
          >
            0{index + 1}
          </span>

          <span className="min-w-0">
            <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-steel">
              {mission.code}
            </span>
            <span className="mt-1.5 block text-lg font-extralight uppercase leading-snug tracking-cine text-bone transition-colors duration-300 group-hover:text-accent md:text-3xl">
              {mission.name}
            </span>
          </span>

          <StatusMark status={mission.status} label={statusLabel[mission.status]} />

          {/* Plus → minus indicator (always visible — it is the tap affordance) */}
          <span className="relative block h-3 w-3 justify-self-end" aria-hidden>
            <span
              className={`absolute left-0 top-1/2 h-px w-3 transition-colors duration-300 group-hover:bg-accent ${
                open ? 'bg-accent' : 'bg-bone/50'
              }`}
            />
            <span
              className={`absolute left-1/2 top-0 h-3 w-px transition-all duration-500 ease-cinematic group-hover:bg-accent ${
                open ? 'rotate-90 opacity-0 bg-accent' : 'bg-bone/50'
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
            <div className="grid gap-6 pb-8 md:grid-cols-[90px_1fr_auto] md:gap-x-8 md:pb-11">
              <span aria-hidden className="hidden md:block" />
              <p className="max-w-[52ch] text-sm leading-relaxed text-bone/60">
                {mission.summary}
              </p>
              <dl className="flex gap-8 md:gap-10 md:self-end">
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
          </div>
        </div>
      </div>
    </Reveal>
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
