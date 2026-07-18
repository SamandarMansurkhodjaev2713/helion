import { useI18n } from '../../i18n'
import type { CrewMember } from '../../i18n/types'
import { SCENE_NO, SECTION_ID } from '../../lib/constants'
import SectionShell from '../primitives/SectionShell'
import SectionHeading from '../primitives/SectionHeading'
import LineReveal from '../primitives/LineReveal'

/**
 * One credit line, set as a row of a crew manifest rather than a floating
 * block: a fixed index column anchors every row to the same left edge, the
 * name and role hold the second, the bio the third and the flight record the
 * fourth. Columns keep their widths whatever the name's length, so rows of
 * different heights still read as one table instead of drifting apart.
 */
function CrewRow({ member, index }: { member: CrewMember; index: number }) {
  const { t } = useI18n()

  return (
    <LineReveal delay={index * 90} distance={0.6}>
      <div
        data-cursor="card"
        className="group grid grid-cols-[auto_1fr] items-baseline gap-x-5 gap-y-5 border-b border-white/10 py-8 md:grid-cols-[3.5rem_minmax(0,1fr)_minmax(0,1.1fr)_auto] md:gap-x-10 md:py-10"
      >
        {/* Index — the anchor every row shares */}
        <span className="font-mono text-lg font-light tabular-nums text-bone/20 transition-colors duration-500 group-hover:text-accent/60 md:text-2xl">
          0{index + 1}
        </span>

        {/* Name and role */}
        <div className="min-w-0">
          <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-accent/60">
            {member.tag}
          </span>
          <h3 className="title-cine mt-2 text-bone transition-colors duration-500 group-hover:text-accent">
            {member.name}
          </h3>
          <p className="mt-2 flex items-baseline gap-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-steel">
            {member.role}
            {/* The callsign arrives on hover, like a voice coming on channel */}
            <span
              aria-hidden
              className="hidden text-accent opacity-0 transition-opacity duration-500 group-hover:opacity-100 md:inline"
            >
              [{member.callsign}]
            </span>
          </p>
        </div>

        {/* Bio */}
        <p className="col-start-2 max-w-[46ch] text-sm leading-relaxed text-bone/60 md:col-start-3">
          {member.bio}
        </p>

        {/* Flight record — a compact stat block, aligned across all rows */}
        <dl className="col-start-2 flex gap-8 font-mono text-[10px] uppercase tracking-[0.15em] text-bone/40 transition-colors duration-500 group-hover:text-bone/60 md:col-start-4 md:gap-7 md:border-l md:border-white/10 md:pl-8">
          <div>
            <dt>{t.crew.labelHours}</dt>
            <dd className="mt-1.5 text-sm tabular-nums text-bone/85">{member.hours}</dd>
          </div>
          <div>
            <dt>{t.crew.labelMissions}</dt>
            <dd className="mt-1.5 text-sm tabular-nums text-bone/85">{member.missions}</dd>
          </div>
          <div className="md:hidden">
            <dt>{t.crew.labelCallsign}</dt>
            <dd className="mt-1.5 text-sm text-accent">{member.callsign}</dd>
          </div>
        </dl>
      </div>
    </LineReveal>
  )
}

/**
 * The crew as end-credits: editorial rows instead of cards — ultra-light names,
 * mono roles, the bio as a right-hand column, and a flight record beneath it.
 * The section closes on the commander's line, which hands the reader to the
 * finale.
 */
export default function Crew() {
  const { t } = useI18n()

  return (
    <SectionShell
      id={SECTION_ID.crew}
      atmosphere="accent"
      scene={SCENE_NO[SECTION_ID.crew]}
      className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-44"
    >
      <SectionHeading
        eyebrow={t.crew.eyebrow}
        title={t.crew.title}
        titleEmphasis={t.crew.titleEmphasis}
        intro={t.crew.intro}
        className="mb-10 md:mb-20"
      />

      <div className="border-t border-white/10">
        {t.crew.members.map((member, index) => (
          <CrewRow key={member.name} member={member} index={index} />
        ))}
      </div>

      {/* Closing line — the commander speaks last */}
      <LineReveal delay={160} className="mt-14 md:mt-20" stagger={110}>
        <p className="block max-w-[34ch] text-lg font-extralight leading-[1.6] text-bone/80 md:max-w-[46ch] md:text-2xl">
          «{t.crew.quote}»
        </p>
        <p className="mt-5 block font-mono text-[10px] uppercase tracking-[0.22em] text-steel">
          {t.crew.quoteAuthor}
        </p>
      </LineReveal>
    </SectionShell>
  )
}
