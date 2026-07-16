import { useI18n } from '../../i18n'
import { SECTION_ID } from '../../lib/constants'
import SectionShell from '../primitives/SectionShell'
import SectionHeading from '../primitives/SectionHeading'
import Reveal from '../primitives/Reveal'

/**
 * The crew as end-credits: editorial rows instead of cards — huge ultra-light
 * names, mono roles, the bio set as a right-hand column. Hovering a row pulls
 * the name into the accent like a credit being read.
 */
export default function Crew() {
  const { t } = useI18n()

  return (
    <SectionShell
      id={SECTION_ID.crew}
      atmosphere="accent"
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
          <Reveal key={member.name} variant="clip" delay={index * 90}>
            <div className="group grid gap-4 border-b border-white/10 py-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-center md:gap-12 md:py-11">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent/60">
                  {member.tag}
                </span>
                <h3 className="mt-2.5 text-2xl font-extralight uppercase leading-snug tracking-cine text-bone transition-colors duration-500 group-hover:text-accent md:text-4xl">
                  {member.name}
                </h3>
                <p className="mt-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-steel">
                  {member.role}
                </p>
              </div>
              <p className="max-w-[46ch] text-sm leading-relaxed text-bone/60">{member.bio}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </SectionShell>
  )
}
