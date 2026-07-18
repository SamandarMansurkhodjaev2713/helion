import { useEffect } from 'react'
import Lenis from 'lenis'
import { I18nProvider } from './i18n'
import { SoundProvider } from './lib/SoundProvider'
import { usePointerFine, useReducedMotion } from './lib/hooks'
import FilmLeader from './components/FilmLeader'
import HudCursor from './components/HudCursor'
import StarField from './components/StarField'
import CinemaChrome from './components/CinemaChrome'
import ScrollyHero from './components/ScrollyHero'
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

export default function App() {
  const reducedMotion = useReducedMotion()
  const pointerFine = usePointerFine()
  useLenis(!reducedMotion && pointerFine)

  return (
    <I18nProvider>
      <SoundProvider>
        <FilmLeader />
        <HudCursor />
        <StarField />
        <CinemaChrome />

        <main className="relative z-10">
          {reducedMotion ? <StaticHero /> : <ScrollyHero />}
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
