import { ArrowUp } from 'lucide-react'
import { useI18n } from '../i18n'
import { CONTACT, NAV_SECTIONS, SECTION_ID } from '../lib/constants'

export default function Footer() {
  const { t } = useI18n()
  const labels: Record<string, string> = {
    [SECTION_ID.missions]: t.nav.missions,
    [SECTION_ID.fleet]: t.nav.fleet,
    [SECTION_ID.route]: t.nav.route,
    [SECTION_ID.crew]: t.nav.crew,
  }

  return (
    <footer className="relative border-t border-white/10 bg-void/80 px-6 py-16 md:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-12">
        <div className="flex flex-col justify-between gap-10 md:flex-row md:items-start">
          <div className="max-w-sm">
            <a
              href={`#${SECTION_ID.hero}`}
              data-cursor="link"
              className="font-display text-lg font-semibold uppercase tracking-[0.22em] text-bone transition-colors duration-300 hover:text-accent"
            >
              Helion
            </a>
            <p className="mt-4 text-sm leading-relaxed text-bone/50">{t.footer.tagline}</p>
          </div>

          <nav aria-label={t.nav.menuLabel} className="flex flex-wrap gap-x-8 gap-y-3">
            {NAV_SECTIONS.map((id) => (
              <a
                key={id}
                href={`#${id}`}
                data-cursor="link"
                className="text-sm text-bone/55 transition-colors duration-300 hover:text-accent"
              >
                {labels[id]}
              </a>
            ))}
          </nav>

          <a
            href={`#${SECTION_ID.hero}`}
            data-cursor="link"
            data-cursor-label={t.footer.backToTop}
            className="group inline-flex items-center gap-2 self-start text-sm text-bone/55 transition-colors duration-300 hover:text-bone"
          >
            {t.footer.backToTop}
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 transition-transform duration-300 group-hover:-translate-y-0.5">
              <ArrowUp size={14} />
            </span>
          </a>
        </div>

        <div className="hairline" />

        <div className="flex flex-col gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-bone/35 md:flex-row md:justify-between">
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
          <span>{t.footer.builtWith}</span>
        </div>
      </div>
    </footer>
  )
}
