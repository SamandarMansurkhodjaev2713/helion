import { useI18n } from '../../i18n'
import type { CrewMember } from '../../i18n/types'
import { SECTION_ID } from '../../lib/constants'
import SectionShell from '../primitives/SectionShell'
import SectionHeading from '../primitives/SectionHeading'
import Reveal from '../primitives/Reveal'

/** Two-letter monogram from the first two words of a name. */
function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
}

function CrewCard({ member, index }: { member: CrewMember; index: number }) {
  return (
    <Reveal variant="rise" delay={index * 110}>
      <article className="group flex flex-col">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-panel to-void grain">
          {/* Faint monogram portrait */}
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-7xl font-semibold text-white/[0.06] transition-transform duration-700 ease-cinematic group-hover:scale-110">
            {initials(member.name)}
          </span>

          {/* Tag pill */}
          <span className="absolute left-4 top-4 rounded-full border border-white/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-bone/60">
            {member.tag}
          </span>

          {/* Default label — hidden on hover (desktop) */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-void/90 to-transparent p-5 transition-opacity duration-500 md:group-hover:opacity-0">
            <h3 className="font-display text-base font-medium text-bone">{member.name}</h3>
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-accent/80">
              {member.role}
            </p>
          </div>

          {/* Hover overlay with bio — desktop only */}
          <div className="absolute inset-0 hidden flex-col justify-end bg-void/85 p-5 opacity-0 backdrop-blur-sm transition-opacity duration-500 ease-cinematic group-hover:opacity-100 md:flex">
            <h3 className="font-display text-base font-medium text-bone">{member.name}</h3>
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-accent/80">
              {member.role}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-bone/70">{member.bio}</p>
          </div>
        </div>

        {/* Mobile bio — always visible below the portrait */}
        <p className="mt-3 text-sm leading-relaxed text-bone/60 md:hidden">{member.bio}</p>
      </article>
    </Reveal>
  )
}

export default function Crew() {
  const { t } = useI18n()
  return (
    <SectionShell
      id={SECTION_ID.crew}
      atmosphere="accent"
      className="mx-auto max-w-7xl px-6 py-28 md:px-10 md:py-40"
    >
      <SectionHeading
        eyebrow={t.crew.eyebrow}
        title={t.crew.title}
        titleEmphasis={t.crew.titleEmphasis}
        intro={t.crew.intro}
      />

      <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {t.crew.members.map((member, index) => (
          <CrewCard key={member.name} member={member} index={index} />
        ))}
      </div>
    </SectionShell>
  )
}
