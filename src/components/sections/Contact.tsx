import { Send, Mail } from 'lucide-react'
import { useI18n } from '../../i18n'
import { CONTACT, SECTION_ID } from '../../lib/constants'
import { mapRange } from '../../lib/easing'
import { useReducedMotion, useViewportProgress } from '../../lib/hooks'
import Reveal from '../primitives/Reveal'
import MagneticButton from '../primitives/MagneticButton'

/** The rising planet limb — a large arc with a warm rim light that parallaxes
 *  up as the section enters, giving the finale a "horizon reveal". */
function PlanetHorizon({ progress, reduced }: { progress: number; reduced: boolean }) {
  const rise = reduced ? 0 : mapRange(progress, 0, 1, 220, -40)
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden">
      <div
        className="relative mx-auto aspect-square w-[180vw] max-w-[1600px] rounded-full"
        style={{
          transform: `translateY(calc(50% + ${rise}px))`,
          background:
            'radial-gradient(closest-side, var(--panel) 55%, var(--void) 100%)',
          // Cold rim values mirror --accent / --accent-bright (rgba needs a literal alpha).
          boxShadow:
            'inset 0 6px 40px rgba(111,211,242,0.16), 0 -1px 0 rgba(169,231,255,0.5), 0 -18px 90px rgba(111,211,242,0.2)',
        }}
      />
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
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-32 text-center"
    >
      <PlanetHorizon progress={progress} reduced={reduced} />

      <div className="relative z-content mx-auto max-w-3xl">
        <Reveal variant="fade" duration={700}>
          <span className="font-mono text-[11px] uppercase tracking-telemetry text-steel">
            {t.contact.eyebrow}
          </span>
        </Reveal>

        <Reveal variant="focus" delay={90} className="mt-6">
          <h2 className="text-4xl font-light leading-[1.06] tracking-[-0.02em] text-bone md:text-6xl">
            {t.contact.title}
            <span className="mt-3 block font-display text-[0.52em] font-medium uppercase leading-[1.25] tracking-[0.06em] text-accent">
              {t.contact.titleEmphasis}
            </span>
          </h2>
        </Reveal>

        <Reveal variant="rise" delay={200} className="mt-6">
          <p className="mx-auto max-w-xl text-base leading-relaxed text-bone/65 md:text-lg">
            {t.contact.body}
          </p>
        </Reveal>

        {/* Seats readout */}
        <Reveal variant="rise" delay={280} className="mt-10">
          <div className="inline-flex items-center gap-4 rounded-full border border-white/10 bg-white/[0.03] px-6 py-3">
            <span className="font-mono text-3xl font-medium tabular-nums text-accent">
              {t.contact.seatsValue}
            </span>
            <span className="text-left font-mono text-[11px] uppercase leading-tight tracking-[0.15em] text-bone/55">
              {t.contact.seatsLabel}
            </span>
          </div>
        </Reveal>

        {/* CTAs — Telegram primary, email secondary */}
        <Reveal variant="rise" delay={360} className="mt-10">
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <MagneticButton
              href={CONTACT.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              cursorLabel={CONTACT.telegramHandle}
              className="group items-center gap-3 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-void transition-colors duration-300 hover:bg-accent-bright"
            >
              <Send size={16} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              {t.contact.telegramCta}
            </MagneticButton>

            <MagneticButton
              href={`mailto:${CONTACT.email}`}
              cursorLabel={CONTACT.email}
              className="group items-center gap-3 rounded-full border border-white/15 px-7 py-3.5 text-sm font-medium text-bone transition-colors duration-300 hover:border-accent/50 hover:text-accent"
            >
              <Mail size={16} />
              {t.contact.emailCta}
            </MagneticButton>
          </div>
        </Reveal>

        <Reveal variant="fade" delay={460} className="mt-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-bone/40">
            {t.contact.channelNote}
          </p>
        </Reveal>

        <Reveal variant="fade" delay={560} className="mt-16">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-steel/60">
            {t.contact.manifest}
          </p>
        </Reveal>
      </div>
    </section>
  )
}
