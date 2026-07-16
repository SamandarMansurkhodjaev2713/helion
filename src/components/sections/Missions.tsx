import { ArrowUpRight } from 'lucide-react'
import { useI18n } from '../../i18n'
import type { MissionItem, MissionStatus } from '../../i18n/types'
import { SECTION_ID } from '../../lib/constants'
import SectionShell from '../primitives/SectionShell'
import SectionHeading from '../primitives/SectionHeading'
import Reveal from '../primitives/Reveal'
import TiltCard from '../primitives/TiltCard'

/** Editorial vertical offset per column so the row reads as a composed spread. */
const COLUMN_OFFSET = ['lg:mt-16', 'lg:mt-0', 'lg:mt-24']

function StatusPill({ status, label }: { status: MissionStatus; label: string }) {
  const tone: Record<MissionStatus, string> = {
    active: 'border-accent/40 text-accent',
    returned: 'border-steel/40 text-steel',
    planned: 'border-white/15 text-bone/50',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] ${tone[status]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === 'active' ? 'animate-pulse bg-accent' : 'bg-current'
        }`}
      />
      {label}
    </span>
  )
}

function MissionCard({
  mission,
  index,
}: {
  mission: MissionItem
  index: number
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

  return (
    <Reveal variant="rise" delay={index * 120} className={COLUMN_OFFSET[index] ?? ''}>
      <TiltCard cursorLabel={t.missions.viewDossier} className="h-full">
        <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-panel/60 p-6 backdrop-blur-sm transition-colors duration-500 hover:border-accent/30">
          {/* Faint index watermark */}
          <span className="pointer-events-none absolute -right-2 -top-4 font-display text-[5.5rem] font-semibold leading-none text-white/[0.03]">
            {index + 1}
          </span>

          <header className="flex items-center justify-between">
            <span className="font-mono text-xs tracking-[0.2em] text-steel">{mission.code}</span>
            <StatusPill status={mission.status} label={statusLabel[mission.status]} />
          </header>

          <h3 className="mt-6 font-display text-xl font-medium leading-snug tracking-[0.01em] text-bone">
            {mission.name}
          </h3>

          <p className="mt-3 flex-1 text-sm leading-relaxed text-bone/60">{mission.summary}</p>

          <div className="hairline my-6" />

          <dl className="grid grid-cols-3 gap-2">
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

          <span className="mt-6 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-bone/50 transition-colors duration-300 group-hover:text-accent">
            {t.missions.viewDossier}
            <ArrowUpRight
              size={14}
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </span>
        </article>
      </TiltCard>
    </Reveal>
  )
}

export default function Missions() {
  const { t } = useI18n()
  return (
    <SectionShell
      id={SECTION_ID.missions}
      atmosphere="accent"
      className="mx-auto max-w-7xl px-6 py-28 md:px-10 md:py-40"
    >
      <SectionHeading
        eyebrow={t.missions.eyebrow}
        title={t.missions.title}
        titleEmphasis={t.missions.titleEmphasis}
        intro={t.missions.intro}
      />

      <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:items-start">
        {t.missions.items.map((mission, index) => (
          <MissionCard key={mission.code} mission={mission} index={index} />
        ))}
      </div>
    </SectionShell>
  )
}
