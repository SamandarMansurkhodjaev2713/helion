import { ArrowUpRight } from 'lucide-react'
import { useI18n } from '../i18n'
import { SECTION_ID, asset } from '../lib/constants'

/** prefers-reduced-motion fallback: no pinning, no scrub —
 *  a static final frame with all story text visible at once. */
export default function StaticHero() {
  const { t } = useI18n()

  return (
    <div
      id={SECTION_ID.hero}
      className="relative min-h-[100dvh] overflow-hidden bg-void grain vignette"
    >
      <img
        src={asset('poster_end.jpg')}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-void/55" />

      <div className="relative z-content mx-auto flex min-h-[100dvh] max-w-3xl flex-col justify-center gap-12 px-6 py-32 text-center">
        <div>
          <h1 className="text-5xl font-light leading-[1.06] tracking-[-0.03em] text-bone sm:text-7xl">
            {t.hero.titleLine1}
            <span className="my-2 block font-display text-[0.5em] font-medium uppercase leading-[1.15] tracking-[0.05em] text-accent">
              {t.hero.titleEmphasis}
            </span>
            {t.hero.titleLine3}
          </h1>
          <p className="mx-auto mt-6 max-w-md text-sm text-bone/60">{t.hero.lead}</p>
        </div>

        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-steel">
            {t.hero.missionTag}
          </p>
          <h2 className="mt-3 text-3xl font-light tracking-[-0.02em] text-bone">
            {t.hero.bLine1} {t.hero.bEmphasisA}{' '}
            <span className="font-display text-[0.62em] font-medium uppercase tracking-[0.05em] text-accent">
              {t.hero.bEmphasisB}
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-bone/70">
            {t.hero.bBody1}
          </p>
        </div>

        <div>
          <h2 className="text-3xl font-light leading-[1.06] tracking-[-0.02em] text-bone sm:text-4xl">
            {t.hero.finaleLine1}
            <span className="mt-2 block font-display text-[0.5em] font-medium uppercase leading-[1.3] tracking-[0.06em] text-accent">
              {t.hero.finaleEmphasis}
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-bone/65">{t.hero.finaleRightBody}</p>
          <a
            href={`#${SECTION_ID.contact}`}
            className="group mx-auto mt-8 flex w-fit items-center gap-3 rounded-full bg-accent py-2 pl-7 pr-2 text-sm font-semibold text-void transition-colors duration-300 hover:bg-accent-bright"
          >
            {t.hero.reserveCta}
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-void/85 transition-transform duration-300 group-hover:rotate-45">
              <ArrowUpRight size={16} className="text-accent" />
            </span>
          </a>
        </div>
      </div>
    </div>
  )
}
