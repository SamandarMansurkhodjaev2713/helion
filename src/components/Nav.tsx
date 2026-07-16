import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import type { Locale } from '../i18n/types'
import { NAV_SECTIONS, SECTION_ID, TELEMETRY, CONTACT } from '../lib/constants'
import { useActiveSection } from '../lib/hooks'
import MagneticButton from './primitives/MagneticButton'
import ScrambleText, { type ScrambleHandle } from './primitives/ScrambleText'

/** Full section order, used for the active-link highlight and phase readout. */
const ALL_SECTIONS: readonly string[] = [
  SECTION_ID.hero,
  SECTION_ID.missions,
  SECTION_ID.fleet,
  SECTION_ID.route,
  SECTION_ID.crew,
  SECTION_ID.contact,
]

/** Format seconds as HH:MM:SS for the mission-elapsed clock. */
function formatElapsed(totalSeconds: number): string {
  const hh = Math.floor(totalSeconds / 3600)
  const mm = Math.floor((totalSeconds % 3600) / 60)
  const ss = totalSeconds % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}`
}

/** Live "T+" clock counting real seconds spent on the page. */
function useElapsedSeconds(): number {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [])
  return seconds
}

/** True once the user has scrolled past the given offset. */
function useScrolledPast(offset: number): boolean {
  const [past, setPast] = useState(false)
  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > offset)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [offset])
  return past
}

/** A desktop pill link whose label decodes on hover or keyboard focus. */
function NavLink({ id, label, isActive }: { id: string; label: string; isActive: boolean }) {
  const scrambleRef = useRef<ScrambleHandle>(null)
  const trigger = () => scrambleRef.current?.run()
  return (
    <a
      href={`#${id}`}
      data-cursor="link"
      onMouseEnter={trigger}
      onFocus={trigger}
      className={`group relative rounded-full px-4 py-1.5 text-sm transition-colors duration-300 ${
        isActive ? 'text-bone' : 'text-bone/55 hover:text-bone'
      }`}
    >
      <ScrambleText ref={scrambleRef} text={label} />
      <span
        className={`absolute inset-x-3 -bottom-0.5 h-px origin-center bg-accent transition-transform duration-500 ease-cinematic ${
          isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
        }`}
      />
    </a>
  )
}

/** Segmented RU / UZ language control. */
function LanguageSwitch() {
  const { locale, setLocale, locales, t } = useI18n()
  return (
    <div
      role="group"
      aria-label={t.nav.languageLabel}
      className="flex items-center rounded-full border border-white/10 bg-white/[0.03] p-0.5 font-mono text-[11px]"
    >
      {locales.map((code: Locale) => {
        const isActive = code === locale
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={isActive}
            data-cursor="link"
            className={`rounded-full px-2.5 py-1 uppercase tracking-[0.15em] transition-colors duration-300 ${
              isActive ? 'bg-accent text-void' : 'text-bone/50 hover:text-bone'
            }`}
          >
            {code}
          </button>
        )
      })}
    </div>
  )
}

export default function Nav() {
  const { t } = useI18n()
  const active = useActiveSection(ALL_SECTIONS)
  const scrolled = useScrolledPast(40)
  const elapsed = useElapsedSeconds()
  const [menuOpen, setMenuOpen] = useState(false)

  const phaseIndex = Math.max(0, ALL_SECTIONS.indexOf(active)) + 1
  const phaseTotal = ALL_SECTIONS.length.toString().padStart(2, '0')
  const phaseCurrent = phaseIndex.toString().padStart(2, '0')

  // Lock body scroll while the mobile menu is open; Escape closes it.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    if (!menuOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const navLabels: Record<string, string> = {
    [SECTION_ID.missions]: t.nav.missions,
    [SECTION_ID.fleet]: t.nav.fleet,
    [SECTION_ID.route]: t.nav.route,
    [SECTION_ID.crew]: t.nav.crew,
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-nav transition-colors duration-500 ${
        scrolled && !menuOpen ? 'bg-void/70 backdrop-blur-xl' : 'bg-transparent'
      }`}
    >
      {/* Telemetry micro-line — HUD flavour, desktop only */}
      <div className="hidden items-center justify-between px-6 pt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-steel/70 md:flex md:px-10">
        <span>{TELEMETRY.station}</span>
        <span className="flex items-center gap-4">
          <span>
            LAT {TELEMETRY.latitude} · LON {TELEMETRY.longitude}
          </span>
          <span className="text-accent/80">T+ {formatElapsed(elapsed)}</span>
          <span>
            {t.telemetry.phaseLabel} {phaseCurrent}/{phaseTotal}
          </span>
        </span>
      </div>

      {/* Main navigation row */}
      <div className="flex items-center justify-between px-6 py-4 md:px-10">
        <a
          href={`#${SECTION_ID.hero}`}
          data-cursor="link"
          className="font-display text-sm font-semibold uppercase tracking-[0.22em] text-bone transition-colors duration-300 hover:text-accent"
        >
          Helion
        </a>

        {/* Center pill — desktop */}
        <nav
          aria-label={t.nav.menuLabel}
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1.5 backdrop-blur-md lg:flex"
        >
          {NAV_SECTIONS.map((id) => (
            <NavLink key={id} id={id} label={navLabels[id]} isActive={active === id} />
          ))}
        </nav>

        {/* Right controls — desktop */}
        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitch />
          <MagneticButton
            href={CONTACT.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            cursorLabel={t.nav.cta}
            className="rounded-full bg-bone px-5 py-2.5 text-sm font-semibold text-void transition-colors duration-300 hover:bg-accent-bright"
          >
            {t.nav.cta}
          </MagneticButton>
        </div>

        {/* Mobile trigger — circled morphing burger */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={t.nav.menuLabel}
          className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] backdrop-blur-sm transition-colors duration-300 active:bg-white/10 md:hidden"
        >
          <span
            className={`absolute h-px w-[18px] bg-bone transition-transform duration-500 ease-cinematic ${
              menuOpen ? 'rotate-45' : '-translate-y-[3.5px]'
            }`}
          />
          <span
            className={`absolute h-px w-[18px] bg-bone transition-transform duration-500 ease-cinematic ${
              menuOpen ? '-rotate-45' : 'translate-y-[3.5px]'
            }`}
          />
        </button>
      </div>

      {/* Mobile menu overlay — sits under the header row so the burger stays usable */}
      <div
        className={`fixed inset-0 -z-[1] flex flex-col bg-void/95 px-6 pb-8 pt-28 backdrop-blur-2xl transition-opacity duration-500 ease-cinematic md:hidden ${
          menuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <nav aria-label={t.nav.menuLabel} className="flex flex-1 flex-col justify-center gap-1">
          {NAV_SECTIONS.map((id, index) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={() => setMenuOpen(false)}
              style={{ transitionDelay: menuOpen ? `${140 + index * 70}ms` : '0ms' }}
              className={`group flex items-baseline gap-5 border-b border-white/5 py-5 transition-all duration-600 ease-cinematic ${
                menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-7 opacity-0'
              }`}
            >
              <span className="font-mono text-[11px] tracking-[0.2em] text-accent/70">
                0{index + 1}
              </span>
              <span className="text-3xl font-light tracking-[-0.01em] text-bone transition-colors duration-300 group-active:text-accent">
                {navLabels[id]}
              </span>
              <span
                className={`ml-auto h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                  active === id ? 'bg-accent' : 'bg-white/10'
                }`}
              />
            </a>
          ))}
        </nav>

        <div
          style={{ transitionDelay: menuOpen ? '460ms' : '0ms' }}
          className={`flex flex-col gap-6 transition-all duration-600 ease-cinematic ${
            menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <div className="flex items-center justify-between">
            <LanguageSwitch />
            <a
              href={CONTACT.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-void transition-colors duration-300 active:bg-accent-deep"
            >
              {t.nav.cta}
            </a>
          </div>

          {/* Telemetry footer inside the overlay */}
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-steel/60">
            <span>{TELEMETRY.station}</span>
            <span className="text-accent/70">T+ {formatElapsed(elapsed)}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
