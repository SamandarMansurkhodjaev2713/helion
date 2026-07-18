import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import type { Locale } from '../i18n/types'
import {
  CONTACT,
  FILM,
  NAV_SECTIONS,
  SCENE_NO,
  SECTION_ID,
  TELEMETRY,
  asset,
} from '../lib/constants'
import { useActiveSection, useChromeVisible, usePointerFine, useReducedMotion } from '../lib/hooks'
import { useSound } from '../lib/SoundProvider'
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

/** Sections that hold the wide cinematic frame; the rest give height back. */
const WIDE_SCENES: readonly string[] = [SECTION_ID.hero, SECTION_ID.contact]

/** Preview still shown behind the menu for each destination. */
const MENU_PREVIEW: Record<string, string> = {
  [SECTION_ID.missions]: 'poster_start.jpg',
  [SECTION_ID.fleet]: 'still_aurora.jpg',
  [SECTION_ID.route]: 'still_xerxes.jpg',
  [SECTION_ID.crew]: 'poster_end.jpg',
  [SECTION_ID.contact]: 'mars_2k.jpg',
}

/** Ties the menu button to the shutter it discloses, for assistive tech. */
const MENU_PANEL_ID = 'menu-shutter'

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
  const { play } = useSound()
  return (
    <div role="group" aria-label={t.nav.languageLabel} className="flex items-center font-mono text-[11px]">
      {locales.map((code: Locale, index) => (
        <span key={code} className="flex items-center">
          {index > 0 && <span className="mx-1.5 text-bone/20">/</span>}
          <button
            type="button"
            onClick={() => {
              play('select')
              setLocale(code)
            }}
            aria-pressed={code === locale}
            data-cursor="link"
            className={`tap-target px-1.5 py-3 uppercase tracking-[0.2em] transition-colors duration-300 ${
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

/** Sound toggle: three bars that animate only while audio is on. */
function SoundToggle() {
  const { t } = useI18n()
  const { enabled, toggle } = useSound()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={`${t.sound.label}: ${enabled ? t.sound.on : t.sound.off}`}
      data-cursor="link"
      className="flex h-11 items-end gap-[3px] pb-[15px]"
    >
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={`w-[2px] transition-all duration-500 ease-cinematic ${
            enabled ? 'bg-accent' : 'bg-bone/35'
          }`}
          style={{
            height: enabled ? [7, 11, 5][index] : 3,
            animation: enabled
              ? `drift-slow ${1.1 + index * 0.35}s ease-in-out ${index * 0.12}s infinite`
              : undefined,
          }}
        />
      ))}
    </button>
  )
}

/** One full-screen menu entry: a scene slate that wipes in and, on hover,
 *  swaps the preview frame behind the menu. */
function MenuItem({
  index,
  id,
  label,
  caption,
  active,
  open,
  onNavigate,
  onPreview,
}: {
  index: number
  id: string
  label: string
  caption: string
  active: boolean
  open: boolean
  onNavigate: () => void
  onPreview: (id: string | null) => void
}) {
  const scrambleRef = useRef<ScrambleHandle>(null)
  const { play } = useSound()
  const enter = () => {
    scrambleRef.current?.run()
    onPreview(id)
    play('tick')
  }
  return (
    <a
      href={`#${id}`}
      onClick={() => {
        play('select')
        onNavigate()
      }}
      onMouseEnter={enter}
      onFocus={enter}
      onMouseLeave={() => onPreview(null)}
      onBlur={() => onPreview(null)}
      data-cursor="link"
      className="group flex flex-col gap-1.5 border-b border-white/5 py-4 md:flex-row md:items-baseline md:gap-6 md:py-5"
    >
      <span className="flex w-20 shrink-0 items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-accent/70 md:text-xs">
        SC.{SCENE_NO[id as keyof typeof SCENE_NO]}
        {/* Active destination is marked like a running take */}
        {active && (
          <span className="flex items-center gap-1 text-mars">
            <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-mars" />
            REC
          </span>
        )}
      </span>
      <span className="overflow-hidden">
        <span
          className="title-cine block text-bone transition-[clip-path,color] duration-700 ease-cinematic group-hover:text-accent"
          style={{
            clipPath: open ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
            transitionDelay: open ? `${300 + index * 90}ms` : '0ms',
          }}
        >
          <ScrambleText ref={scrambleRef} text={label} />
        </span>
      </span>
      <span aria-hidden className="mx-2 hidden flex-1 border-b border-dotted border-white/10 md:block" />
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-steel md:text-[11px]">
        {caption}
      </span>
    </a>
  )
}

/**
 * The letterbox chrome that frames the whole site like a film frame:
 *
 *  - bars that breathe with the drama — wide on the hero and the finale,
 *    slim through content, and auto-hiding on phones while scrolling down;
 *  - top bar: wordmark, live telemetry, language, sound, MENU;
 *  - bottom bar: scene caption + SMPTE timecode driven by scroll + REC;
 *  - a full-screen shutter menu whose entries preview their destination.
 *
 * The timecode writes straight into the DOM from a rAF-throttled scroll
 * listener, so scrolling never re-renders React. Everything cleans up.
 */
export default function CinemaChrome() {
  const { t } = useI18n()
  const { play } = useSound()
  const active = useActiveSection(ALL_SECTIONS)
  const elapsed = useElapsedSeconds()
  const reduced = useReducedMotion()
  const pointerFine = usePointerFine()
  const [menuOpen, setMenuOpen] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [flash, setFlash] = useState(false)
  const timecodeRef = useRef<HTMLSpanElement>(null)

  // Phones get their height back while reading; desktop keeps the frame.
  const chromeVisible = useChromeVisible(!pointerFine && !menuOpen)
  const wide = WIDE_SCENES.includes(active)
  const bars = !chromeVisible ? FILM.barHidden : wide ? FILM.barWide : FILM.barSlim

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

  // A chapter change is worth a quiet cue.
  useEffect(() => {
    play('scene')
  }, [active, play])

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
      if (event.key === 'Escape') closeMenu()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
    // closeMenu is stable for the lifetime of this component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuOpen])

  /** Closing is faster than opening, and leaves a gate flash behind. */
  const closeMenu = () => {
    setMenuOpen(false)
    setPreview(null)
    play('close')
    if (reduced) return
    setFlash(true)
    window.setTimeout(() => setFlash(false), 420)
  }

  const openMenu = () => {
    setMenuOpen(true)
    play('open')
  }

  return (
    <>
      {/* ——— Top cinema bar ——— */}
      <header
        className="fixed inset-x-0 top-0 z-nav flex items-center justify-between overflow-hidden border-b border-white/5 bg-void/95 px-5 backdrop-blur-md transition-[height] duration-700 ease-cinematic md:px-8"
        style={{ height: bars.top }}
      >
        <a
          href={`#${SECTION_ID.hero}`}
          data-cursor="link"
          className="tap-target text-[11px] font-light uppercase tracking-cinewide text-bone transition-colors duration-300 hover:text-accent"
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

        <div className="flex items-center gap-4 md:gap-6">
          <SoundToggle />
          <div className="hidden md:block">
            <LanguageSwitch />
          </div>
          <button
            type="button"
            onClick={() => (menuOpen ? closeMenu() : openMenu())}
            aria-expanded={menuOpen}
            aria-controls={MENU_PANEL_ID}
            aria-label={t.nav.menuLabel}
            data-cursor="link"
            className="group flex h-11 items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.25em] text-bone transition-colors duration-300 hover:text-accent"
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
      <div
        className="fixed inset-x-0 bottom-0 z-nav flex items-center justify-between overflow-hidden border-t border-white/5 bg-void/95 px-5 font-mono text-[10px] uppercase tracking-[0.18em] backdrop-blur-md transition-[height] duration-700 ease-cinematic md:px-8"
        style={{ height: bars.bottom }}
      >
        <span
          key={active}
          className="flex items-center gap-3 text-steel animate-[caption-in_0.5s_var(--ease-cinematic)_both]"
        >
          <span className="text-bone/60">SC.{pad2(sceneIndex + 1)}</span>
          <span className="hidden sm:inline">{sceneCaptions[active] ?? t.scenes.hero}</span>
        </span>
        <span className="flex items-center gap-3 text-steel md:gap-5">
          <span className="hidden items-center gap-1.5 sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-mars" aria-hidden />
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

      {/* Gate flash left behind by the closing shutter */}
      {flash && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-1/2 z-overlay h-[2px] -translate-y-1/2 bg-accent-bright animate-[gate-flash_0.42s_ease-out_both]"
        />
      )}

      {/* ——— Full-screen menu: film-gate shutter + scene slates ——— */}
      {/* The shutter stays mounted so it can animate, so while it is parked it
          must also leave the tab order — `aria-hidden` alone would hide it from
          screen readers while keyboard focus still fell into ten invisible
          links. `inert` takes the whole subtree out at once. */}
      <div
        id={MENU_PANEL_ID}
        aria-hidden={!menuOpen}
        inert={menuOpen ? undefined : ''}
        className={`fixed inset-0 z-overlay overflow-hidden ${
          menuOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        {/* Shutter halves — close twice as fast as they open */}
        <div
          className="absolute inset-x-0 top-0 h-1/2 bg-void ease-cinematic"
          style={{
            transform: menuOpen ? 'translateY(0)' : 'translateY(-101%)',
            transitionProperty: 'transform',
            transitionDuration: menuOpen ? '700ms' : '340ms',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-1/2 bg-void ease-cinematic"
          style={{
            transform: menuOpen ? 'translateY(0)' : 'translateY(101%)',
            transitionProperty: 'transform',
            transitionDuration: menuOpen ? '700ms' : '340ms',
          }}
        />

        {/* Preview frame of the hovered destination */}
        {MENU_SECTIONS.map((id) => (
          <div
            key={id}
            aria-hidden
            className="absolute inset-0 transition-opacity duration-700 ease-cinematic"
            style={{ opacity: menuOpen && preview === id ? 1 : 0 }}
          >
            <img
              src={asset(MENU_PREVIEW[id])}
              alt=""
              className="h-full w-full object-cover opacity-[0.22] grayscale"
              style={{
                transform: preview === id ? 'scale(1.06)' : 'scale(1)',
                transition: 'transform 4s var(--ease-cinematic)',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-void via-void/70 to-void/30" />
          </div>
        ))}

        {/* Ghost current-scene number */}
        <span
          aria-hidden
          className={`absolute -bottom-8 right-1 select-none font-mono text-[40vw] leading-none text-white/[0.04] transition-opacity duration-700 md:-bottom-16 md:text-[17vw] ${
            menuOpen ? 'opacity-100 delay-300' : 'opacity-0'
          }`}
        >
          {pad2(sceneIndex + 1)}
        </span>

        {/* Menu content */}
        <div
          className={`absolute inset-0 flex flex-col justify-center px-5 pb-14 pt-16 grain transition-opacity duration-500 md:px-16 ${
            menuOpen ? 'opacity-100 delay-200' : 'opacity-0'
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
                onNavigate={closeMenu}
                onPreview={setPreview}
              />
            ))}
          </nav>

          <div
            style={{ transitionDelay: menuOpen ? '680ms' : '0ms' }}
            className={`mt-9 flex flex-wrap items-center justify-between gap-6 transition-all duration-600 ease-cinematic md:mt-12 ${
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
              onClick={closeMenu}
            >
              {t.nav.cta}
            </CineButton>

            {/* Live telemetry + direct channels */}
            <div className="flex flex-col gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-steel/70">
              <span>
                {TELEMETRY.station} · T+ {formatElapsed(elapsed)}
              </span>
              <span className="flex flex-wrap gap-x-4 gap-y-1">
                <a
                  href={CONTACT.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="link"
                  className="tap-target transition-colors duration-300 hover:text-accent"
                >
                  {CONTACT.telegramHandle}
                </a>
                <a
                  href={`mailto:${CONTACT.email}`}
                  data-cursor="link"
                  className="tap-target transition-colors duration-300 hover:text-accent"
                >
                  {CONTACT.email}
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
