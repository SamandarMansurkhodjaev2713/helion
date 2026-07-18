import { Send, Mail, ArrowUp } from 'lucide-react'
import { useI18n } from '../../i18n'
import { CONTACT, NAV_SECTIONS, SCENE_NO, SECTION_ID } from '../../lib/constants'
import { useReducedMotion, useViewportProgress } from '../../lib/hooks'
import LineReveal from '../primitives/LineReveal'
import CineButton from '../primitives/CineButton'
import GhostScene from '../primitives/GhostScene'
import PlanetRise from '../PlanetRise'

/** Perforation dots down the boarding pass's tear line. */
function Perforation() {
  return (
    <span aria-hidden className="flex flex-col items-center justify-between py-3">
      {Array.from({ length: 9 }, (_, index) => (
        <span key={index} className="h-1 w-1 rounded-full bg-white/15" />
      ))}
    </span>
  )
}

/** One field of the pass. */
function PassField({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <dt className="font-mono text-[9px] uppercase tracking-[0.2em] text-bone/40">{label}</dt>
      <dd
        className={`mt-1 font-mono text-base tabular-nums ${accent ? 'text-accent' : 'text-bone/90'}`}
      >
        {value}
      </dd>
    </div>
  )
}

/**
 * The finale's call to action, staged as a boarding pass: a ticket blank with a
 * perforated stub, real flight fields, and the primary CTA sitting inside it —
 * so committing feels like claiming a seat rather than clicking a button.
 */
function BoardingPass() {
  const { t } = useI18n()
  return (
    <div className="mx-auto w-full max-w-2xl border border-white/15 bg-void/70 text-left backdrop-blur-sm">
      {/* Stub header */}
      <div className="flex items-center justify-between border-b border-dashed border-white/15 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-steel">
        <span>{t.contact.passTitle}</span>
        <span className="flex items-center gap-2 text-mars">
          <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-mars" />
          {t.contact.seatsValue} / 12
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto]">
        {/* Fields */}
        <dl className="grid grid-cols-2 gap-x-8 gap-y-5 px-5 py-6 sm:grid-cols-4 md:py-7">
          <PassField label={t.contact.passSeat} value={t.contact.passSeatValue} accent />
          <PassField label={t.contact.passFlight} value={t.contact.passFlightValue} />
          <PassField label={t.contact.passDeparture} value={t.contact.passDepartureValue} />
          <PassField label={t.contact.passGate} value={t.contact.passGateValue} />
        </dl>

        <div className="hidden md:block">
          <Perforation />
        </div>

        {/* Stub with the commit action */}
        <div className="flex flex-col items-center justify-center gap-3 border-t border-dashed border-white/15 px-5 py-6 md:border-l md:border-t-0">
          <CineButton
            href={CONTACT.telegramUrl}
            external
            variant="solid"
            cursorLabel={CONTACT.telegramHandle}
          >
            <Send size={14} aria-hidden />
            {t.contact.telegramCta}
          </CineButton>
          <CineButton href={`mailto:${CONTACT.email}`} cursorLabel={CONTACT.email}>
            <Mail size={14} aria-hidden />
            {t.contact.emailCta}
          </CineButton>
        </div>
      </div>

      <p className="border-t border-white/10 px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.18em] text-bone/35">
        {t.contact.passNote}
      </p>
    </div>
  )
}

/** End credits, merged into the finale frame — the site ends as one shot. */
function Credits() {
  const { t } = useI18n()
  const labels: Record<string, string> = {
    [SECTION_ID.missions]: t.nav.missions,
    [SECTION_ID.fleet]: t.nav.fleet,
    [SECTION_ID.route]: t.nav.route,
    [SECTION_ID.crew]: t.nav.crew,
  }
  return (
    <div className="relative z-content mx-auto mt-24 w-full max-w-5xl md:mt-32">
      <div className="hairline" />
      <div className="flex flex-col gap-6 pt-7 text-center md:flex-row md:items-center md:justify-between md:text-left">
        <nav aria-label={t.nav.menuLabel} className="flex flex-wrap justify-center gap-x-7 gap-y-2 md:justify-start">
          {NAV_SECTIONS.map((id) => (
            <a
              key={id}
              href={`#${id}`}
              data-cursor="link"
              className="tap-target font-mono text-[10px] uppercase tracking-[0.18em] text-bone/45 transition-colors duration-300 hover:text-accent"
            >
              {labels[id]}
            </a>
          ))}
        </nav>

        <a
          href={`#${SECTION_ID.hero}`}
          data-cursor="link"
          data-cursor-label={t.footer.backToTop}
          className="group inline-flex items-center justify-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-bone/45 transition-colors duration-300 hover:text-bone"
        >
          {t.footer.backToTop}
          <span className="flex h-7 w-7 items-center justify-center border border-white/15 transition-transform duration-300 group-hover:-translate-y-0.5">
            <ArrowUp size={12} />
          </span>
        </a>
      </div>

      <div className="mt-6 flex flex-col gap-2 pb-4 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-bone/30 md:flex-row md:justify-between md:text-left">
        <span>{t.footer.rights}</span>
        <a
          href={CONTACT.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-cursor="link"
          className="transition-colors duration-300 hover:text-accent"
        >
          {t.footer.author}
        </a>
        <span>{t.contact.manifest}</span>
      </div>
    </div>
  )
}

export default function Contact() {
  const { t } = useI18n()
  const reduced = useReducedMotion()
  const [ref, progress] = useViewportProgress<HTMLElement>(!reduced)

  return (
    <section
      ref={ref}
      id={SECTION_ID.contact}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 pb-16 pt-32 text-center md:pt-40"
    >
      <GhostScene scene={SCENE_NO[SECTION_ID.contact]} progress={progress} />
      {/* Mars rises before a single word is said */}
      <PlanetRise progress={progress} reduced={reduced} />

      <div className="relative z-content mx-auto max-w-3xl">
        {/* The copy follows the planet, one beat later */}
        <LineReveal delay={260} stagger={110} className="w-full">
          <span className="block font-mono text-[10px] uppercase tracking-telemetry text-steel md:text-[11px]">
            {t.contact.eyebrow}
          </span>

          <h2 className="title-cine-lg mt-7 text-bone">
            {t.contact.title} <span className="text-accent">{t.contact.titleEmphasis}</span>
          </h2>

          <p className="mx-auto mt-6 block max-w-xl text-sm leading-relaxed text-bone/65 md:text-base">
            {t.contact.body}
          </p>
        </LineReveal>

        <LineReveal delay={620} className="mt-11">
          <BoardingPass />
        </LineReveal>

        <LineReveal delay={780} className="mt-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-bone/40 md:text-[11px]">
            {t.contact.channelNote}
          </p>
        </LineReveal>
      </div>

      <Credits />
    </section>
  )
}
