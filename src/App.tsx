import { useEffect } from 'react'
import Lenis from 'lenis'
import { I18nProvider } from './i18n'
import { useReducedMotion } from './lib/hooks'
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
import Footer from './components/Footer'

/** Drives Lenis smooth scrolling; skipped entirely under reduced motion so the
 *  OS-native scroll (and any assistive tooling) stays in control. */
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
  useLenis(!reducedMotion)

  return (
    <I18nProvider>
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
        <Contact />
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </I18nProvider>
  )
}
