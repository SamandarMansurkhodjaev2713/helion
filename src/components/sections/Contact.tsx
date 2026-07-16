import { Send, Mail } from 'lucide-react'
import { useI18n } from '../../i18n'
import { CONTACT, SECTION_ID } from '../../lib/constants'
import { mapRange } from '../../lib/easing'
import { useReducedMotion, useViewportProgress } from '../../lib/hooks'
import Reveal from '../primitives/Reveal'
import CineButton from '../primitives/CineButton'

/** The rising planet limb — a large arc with a cold rim light that parallaxes
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
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-36 text-center"
    >
      <PlanetHorizon progress={progress} reduced={reduced} />

      <div className="relative z-content mx-auto max-w-3xl">
        <Reveal variant="fade" duration={700}>
          <span className="font-mono text-[10px] uppercase tracking-telemetry text-steel md:text-[11px]">
            {t.contact.eyebrow}
          </span>
        </Reveal>

        <Reveal variant="focus" delay={90} className="mt-7">
          <h2 className="text-[26px] font-extralight uppercase leading-[1.4] tracking-cine text-bone sm:text-4xl md:text-5xl md:tracking-[0.18em]">
            {t.contact.title} <span className="text-accent">{t.contact.titleEmphasis}</span>
          </h2>
        </Reveal>

        <Reveal variant="rise" delay={200} className="mt-6">
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-bone/65 md:text-base">
            {t.contact.body}
          </p>
        </Reveal>

        {/* Seats slate */}
        <Reveal variant="rise" delay={280} className="mt-11">
          <div className="inline-flex items-center gap-4 border border-white/10 bg-white/[0.02] px-6 py-3.5">
            <span className="font-mono text-3xl font-medium tabular-nums text-accent">
              {t.contact.seatsValue}
            </span>
            <span className="text-left font-mono text-[10px] uppercase leading-tight tracking-[0.15em] text-bone/55">
              {t.contact.seatsLabel}
            </span>
          </div>
        </Reveal>

        {/* CTAs — Telegram primary, email secondary */}
        <Reveal variant="rise" delay={360} className="mt-11">
          <div className="flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-7">
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
        </Reveal>

        <Reveal variant="fade" delay={460} className="mt-9">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-bone/40 md:text-[11px]">
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
