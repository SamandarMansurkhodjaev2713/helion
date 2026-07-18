import { useI18n } from '../../i18n'
import type { CrewMember } from '../../i18n/types'
import { SCENE_NO, SECTION_ID } from '../../lib/constants'
import SectionShell from '../primitives/SectionShell'
import SectionHeading from '../primitives/SectionHeading'
import LineReveal from '../primitives/LineReveal'

/** One credit line: name, role, bio and the flight record that opens on hover. */
function CrewRow({ member, index }: { member: CrewMember; index: number }) {
  const { t } = useI18n()

  return (
    <LineReveal delay={index * 90} distance={0.6}>
      <div
        data-cursor="card"
        className="group grid gap-4 border-b border-white/10 py-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-start md:gap-12 md:py-11"
      >
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent/60">
            {member.tag}
          </span>

          {/* Name slides aside to make room for the radio callsign */}
          <h3 className="mt-2.5 flex items-baseline gap-3">
            <span
              aria-hidden
              className="hidden shrink-0 font-mono text-[11px] uppercase tracking-[0.2em] text-accent opacity-0 transition-all duration-500 ease-cinematic group-hover:opacity-100 md:inline"
            >
              [{member.callsign}]
            </span>
            <span className="title-cine text-bone transition-colors duration-500 group-hover:text-accent">
              {member.name}
            </span>
          </h3>

          <p className="mt-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-steel">
            {member.role}
          </p>
        </div>

        <div>
          <p className="max-w-[46ch] text-sm leading-relaxed text-bone/60">{member.bio}</p>

          {/* Flight record — always present for touch, emphasised on hover */}
          <dl className="mt-5 flex gap-8 border-t border-white/5 pt-4 font-mono text-[10px] uppercase tracking-[0.15em] text-bone/40 transition-colors duration-500 group-hover:text-bone/60">
            <div>
              <dt>{t.crew.labelHours}</dt>
              <dd className="mt-1 text-sm tabular-nums text-bone/85">{member.hours}</dd>
            </div>
            <div>
              <dt>{t.crew.labelMissions}</dt>
              <dd className="mt-1 text-sm tabular-nums text-bone/85">{member.missions}</dd>
            </div>
            <div className="md:hidden">
              <dt>{t.crew.labelCallsign}</dt>
              <dd className="mt-1 text-sm text-accent">{member.callsign}</dd>
            </div>
          </dl>
        </div>
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
      light="right"
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
