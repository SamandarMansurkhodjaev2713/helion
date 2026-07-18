import { useI18n } from '../i18n'
import { SECTION_ID, asset } from '../lib/constants'
import CineButton from './primitives/CineButton'

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

      <div className="relative z-content mx-auto flex min-h-[100dvh] max-w-3xl flex-col justify-center gap-14 px-6 py-32 text-center">
        <div>
          <h1 className="title-cine-lg text-bone">
            {t.hero.titleLine1}
            <span className="block text-accent">{t.hero.titleEmphasis}</span>
            {t.hero.titleLine3}
          </h1>
          <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-bone/60">
            {t.hero.lead}
          </p>
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-steel">
            {t.hero.missionTag}
          </p>
          <h2 className="title-cine mt-4 text-bone">
            {t.hero.bLine1} {t.hero.bEmphasisA}{' '}
            <span className="text-accent">{t.hero.bEmphasisB}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-bone/70">
            {t.hero.bBody1}
          </p>
        </div>

        <div>
          <h2 className="title-cine text-bone">
            {t.hero.finaleLine1} <span className="text-accent">{t.hero.finaleEmphasis}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-bone/65">{t.hero.finaleRightBody}</p>
          <div className="mt-9 flex justify-center">
            <CineButton
              href={`#${SECTION_ID.contact}`}
              variant="solid"
              cursorLabel={t.hero.reserveCta}
            >
              {t.hero.reserveCta}
            </CineButton>
          </div>
        </div>
      </div>
    </div>
  )
}
