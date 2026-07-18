import { useEffect } from 'react'
import Lenis from 'lenis'
import { I18nProvider } from './i18n'
import { SoundProvider } from './lib/SoundProvider'
import { useMediaQuery, usePointerFine, useReducedMotion } from './lib/hooks'
import FilmLeader from './components/FilmLeader'
import HudCursor from './components/HudCursor'
import StarField from './components/StarField'
import SceneLight from './components/SceneLight'
import CinemaChrome from './components/CinemaChrome'
import ScrollyHero from './components/ScrollyHero'
import MobileHero from './components/hero/MobileHero'
import StaticHero from './components/StaticHero'
import Missions from './components/sections/Missions'
import Fleet from './components/sections/Fleet'
import Route from './components/sections/Route'
import Crew from './components/sections/Crew'
import Contact from './components/sections/Contact'

/** Drives Lenis smooth scrolling on precise pointers only. Touch devices keep
 *  their native inertia — smoothing a finger scroll feels "wet" and fights the
 *  OS. Skipped entirely under reduced motion too. */
function useLenis(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const lenis = new Lenis()
    let raf = 0
    const loop = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [enabled])
}

/**
 * Which cut of the hero this device gets.
 *
 * Video scrubbing means writing `currentTime` every frame; a phone cannot seek
 * inside a 26 MB file at that rate and the picture simply stalls, so handsets
 * get a plate sequence that tells the same story with no seeking at all.
 */
function useHeroCut(): 'static' | 'mobile' | 'scrub' {
  const reduced = useReducedMotion()
  const narrow = useMediaQuery('(max-width: 767px)')
  const coarse = useMediaQuery('(pointer: coarse)')
  if (reduced) return 'static'
  return narrow || coarse ? 'mobile' : 'scrub'
}

export default function App() {
  const reducedMotion = useReducedMotion()
  const pointerFine = usePointerFine()
  const heroCut = useHeroCut()
  useLenis(!reducedMotion && pointerFine)

  return (
    <I18nProvider>
      <SoundProvider>
        <FilmLeader />
        <HudCursor />
        <StarField />
        {/* Lighting belongs to the page, not to any section — see SceneLight */}
        <SceneLight />
        <CinemaChrome />

        <main className="relative z-10">
          {heroCut === 'static' && <StaticHero />}
          {heroCut === 'mobile' && <MobileHero />}
          {heroCut === 'scrub' && <ScrollyHero />}
          <Missions />
          <Fleet />
          <Route />
          <Crew />
          {/* The finale carries the end credits — the site closes on one shot */}
          <Contact />
        </main>
      </SoundProvider>
    </I18nProvider>
  )
}
