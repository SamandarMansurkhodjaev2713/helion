import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import type { Locale } from '../i18n/types'
import { CONTACT, FILM, NAV_SECTIONS, SECTION_ID, TELEMETRY } from '../lib/constants'
import { useActiveSection } from '../lib/hooks'
import CineButton from './primitives/CineButton'
import ScrambleText, { type ScrambleHandle } from './primitives/ScrambleText'

/** Full section order — drives the scene readout in the bottom bar. */
const ALL_SECTIONS: readonly string[] = [
  SECTION_ID.hero,
  SECTION_ID.missions,
  SECTION_ID.fleet,
  SECTION_ID.route,
  SECTION_ID.crew,
  SECTION_ID.contact,
]

/** Menu entries: the four content sections plus the contact finale. */
const MENU_SECTIONS: readonly string[] = [...NAV_SECTIONS, SECTION_ID.contact]

const pad2 = (n: number) => n.toString().padStart(2, '0')

/** Format seconds as HH:MM:SS for the mission-elapsed clock. */
function formatElapsed(totalSeconds: number): string {
  const hh = Math.floor(totalSeconds / 3600)
  const mm = Math.floor((totalSeconds % 3600) / 60)
  const ss = totalSeconds % 60
  return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`
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

/** Minimal text language switch: RU / UZ. */
function LanguageSwitch() {
  const { locale, setLocale, locales, t } = useI18n()
  return (
    <div role="group" aria-label={t.nav.languageLabel} className="flex items-center font-mono text-[11px]">
      {locales.map((code: Locale, index) => (
        <span key={code} className="flex items-center">
          {index > 0 && <span className="mx-1.5 text-bone/20">/</span>}
          <button
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={code === locale}
            data-cursor="link"
            className={`uppercase tracking-[0.2em] transition-colors duration-300 ${
              code === locale ? 'text-accent' : 'text-bone/40 hover:text-bone'
            }`}
          >
            {code}
          </button>
        </span>
      ))}
    </div>
  )
}

/** One full-screen menu entry with scramble-on-hover/focus label. */
function MenuItem({
  index,
  id,
  label,
  caption,
  active,
  open,
  onNavigate,
}: {
  index: number
  id: string
  label: string
  caption: string
  active: boolean
  open: boolean
  onNavigate: () => void
}) {
  const scrambleRef = useRef<ScrambleHandle>(null)
  const trigger = () => scrambleRef.current?.run()
  return (
    <a
      href={`#${id}`}
      onClick={onNavigate}
      onMouseEnter={trigger}
      onFocus={trigger}
      data-cursor="link"
      style={{ transitionDelay: open ? `${120 + index * 70}ms` : '0ms' }}
      className={`group flex items-baseline gap-4 border-b border-white/5 py-4 transition-all duration-600 ease-cinematic md:gap-8 md:py-6 ${
        open ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}
    >
      <span className="font-mono text-[11px] tracking-[0.2em] text-accent/70 md:text-xs">
        0{index + 1}
      </span>
      <span className="text-3xl font-extralight uppercase tracking-cine text-bone transition-colors duration-300 group-hover:text-accent md:text-6xl">
        <ScrambleText ref={scrambleRef} text={label} />
      </span>
      <span className="ml-auto hidden font-mono text-[11px] uppercase tracking-[0.18em] text-steel md:block">
        {caption}
      </span>
      <span
        className={`h-1.5 w-1.5 rounded-full md:ml-6 ${active ? 'bg-accent' : 'bg-white/10'}`}
        aria-hidden
      />
    </a>
  )
}

/**
 * The letterbox chrome that frames the whole site like a film frame:
 *
 *  - top bar: wordmark, live ground-station telemetry, language, MENU;
 *  - bottom bar: current scene caption + SMPTE-style timecode driven by the
 *    scroll position (the page is a 167-second reel at 24 fps) + REC dot;
 *  - full-screen menu overlay (same on desktop and mobile) with giant
 *    scramble-on-hover entries.
 *
 * The timecode writes straight into the DOM from a rAF-throttled scroll
 * listener, so scrolling never re-renders React. Everything cleans up.
 */
export default function CinemaChrome() {
  const { t } = useI18n()
  const active = useActiveSection(ALL_SECTIONS)
  const elapsed = useElapsedSeconds()
  const [menuOpen, setMenuOpen] = useState(false)
  const timecodeRef = useRef<HTMLSpanElement>(null)

  const sceneIndex = Math.max(0, ALL_SECTIONS.indexOf(active))
  const sceneCaptions: Record<string, string> = {
    [SECTION_ID.hero]: t.scenes.hero,
    [SECTION_ID.missions]: t.scenes.missions,
    [SECTION_ID.fleet]: t.scenes.fleet,
    [SECTION_ID.route]: t.scenes.route,
    [SECTION_ID.crew]: t.scenes.crew,
    [SECTION_ID.contact]: t.scenes.contact,
  }
  const navLabels: Record<string, string> = {
    [SECTION_ID.missions]: t.nav.missions,
    [SECTION_ID.fleet]: t.nav.fleet,
    [SECTION_ID.route]: t.nav.route,
    [SECTION_ID.crew]: t.nav.crew,
    [SECTION_ID.contact]: t.nav.contact,
  }
  const menuCaptions: Record<string, string> = {
    [SECTION_ID.missions]: t.menuCaptions.missions,
    [SECTION_ID.fleet]: t.menuCaptions.fleet,
    [SECTION_ID.route]: t.menuCaptions.route,
    [SECTION_ID.crew]: t.menuCaptions.crew,
    [SECTION_ID.contact]: t.menuCaptions.contact,
  }

  // SMPTE-style timecode from scroll progress, written straight to the DOM.
  useEffect(() => {
    let frame = 0
    const write = () => {
      frame = 0
      const node = timecodeRef.current
      if (!node) return
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      const progress = max > 0 ? window.scrollY / max : 0
      const total = progress * FILM.reelSeconds
      const mm = Math.floor(total / 60)
      const ss = Math.floor(total % 60)
      const ff = Math.floor((total - Math.floor(total)) * FILM.fps)
      node.textContent = `00:${pad2(mm)}:${pad2(ss)}:${pad2(ff)}`
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(write)
    }
    write()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  // Lock body scroll while the menu is open; Escape closes it.
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

  return (
    <>
      {/* ——— Top cinema bar ——— */}
      <header className="fixed inset-x-0 top-0 z-nav flex h-12 items-center justify-between border-b border-white/5 bg-void/95 px-5 backdrop-blur-md md:px-8">
        <a
          href={`#${SECTION_ID.hero}`}
          data-cursor="link"
          className="text-[11px] font-light uppercase tracking-cinewide text-bone transition-colors duration-300 hover:text-accent"
        >
          Helion
        </a>

        {/* Ground-station telemetry — desktop centre */}
        <div className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 items-center gap-5 font-mono text-[10px] uppercase tracking-[0.18em] text-steel/70 lg:flex">
          <span>{TELEMETRY.station}</span>
          <span>
            LAT {TELEMETRY.latitude} · LON {TELEMETRY.longitude}
          </span>
          <span className="text-accent/80">T+ {formatElapsed(elapsed)}</span>
        </div>

        <div className="flex items-center gap-5 md:gap-7">
          <div className="hidden md:block">
            <LanguageSwitch />
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={t.nav.menuLabel}
            data-cursor="link"
            className="group flex h-12 items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.25em] text-bone transition-colors duration-300 hover:text-accent"
          >
            {menuOpen ? t.chrome.close : t.chrome.menu}
            <span className="relative h-3 w-3" aria-hidden>
              <span
                className={`absolute left-0 top-1/2 h-px w-3 bg-current transition-transform duration-500 ease-cinematic ${
                  menuOpen ? 'rotate-45' : '-translate-y-[3px]'
                }`}
              />
              <span
                className={`absolute left-0 top-1/2 h-px w-3 bg-current transition-transform duration-500 ease-cinematic ${
                  menuOpen ? '-rotate-45' : 'translate-y-[3px]'
                }`}
              />
            </span>
          </button>
        </div>
      </header>

      {/* ——— Bottom cinema bar: scene caption + timecode ——— */}
      <div className="fixed inset-x-0 bottom-0 z-nav flex h-10 items-center justify-between border-t border-white/5 bg-void/95 px-5 font-mono text-[10px] uppercase tracking-[0.18em] backdrop-blur-md md:px-8">
        <span key={active} className="flex items-center gap-3 text-steel animate-[caption-in_0.5s_var(--ease-cinematic)_both]">
          <span className="text-bone/60">SC.{pad2(sceneIndex + 1)}</span>
          <span className="hidden sm:inline">{sceneCaptions[active] ?? t.scenes.hero}</span>
        </span>
        <span className="flex items-center gap-3 text-steel md:gap-5">
          <span className="hidden items-center gap-1.5 sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" aria-hidden />
            REC
          </span>
          <span className="tabular-nums text-bone/60">
            TC <span ref={timecodeRef}>00:00:00:00</span>
          </span>
          <span className="hidden md:inline">
            {pad2(sceneIndex + 1)}/{pad2(ALL_SECTIONS.length)}
          </span>
        </span>
      </div>

      {/* ——— Full-screen menu (all devices) ——— */}
      <div
        aria-hidden={!menuOpen}
        className={`fixed inset-0 z-overlay flex flex-col justify-center bg-void/[0.98] px-5 pb-16 pt-16 backdrop-blur-2xl transition-opacity duration-500 ease-cinematic md:px-16 ${
          menuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <nav aria-label={t.nav.menuLabel} className="flex flex-col">
          {MENU_SECTIONS.map((id, index) => (
            <MenuItem
              key={id}
              index={index}
              id={id}
              label={navLabels[id]}
              caption={menuCaptions[id]}
              active={active === id}
              open={menuOpen}
              onNavigate={() => setMenuOpen(false)}
            />
          ))}
        </nav>

        <div
          style={{ transitionDelay: menuOpen ? '520ms' : '0ms' }}
          className={`mt-10 flex flex-wrap items-center justify-between gap-6 transition-all duration-600 ease-cinematic md:mt-14 ${
            menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <div className="md:hidden">
            <LanguageSwitch />
          </div>
          <CineButton
            href={CONTACT.telegramUrl}
            external
            variant="solid"
            cursorLabel={CONTACT.telegramHandle}
            onClick={() => setMenuOpen(false)}
          >
            {t.nav.cta}
          </CineButton>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-steel/60 md:inline">
            {TELEMETRY.station} · T+ {formatElapsed(elapsed)}
          </span>
        </div>
      </div>
    </>
  )
}
