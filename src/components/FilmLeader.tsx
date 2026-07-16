import { useCallback, useEffect, useState } from 'react'
import { useI18n } from '../i18n'
import { FILM, TELEMETRY } from '../lib/constants'
import { useReducedMotion } from '../lib/hooks'

const SEEN_KEY = 'helion-leader-done'

function hasSeen(): boolean {
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}

function markSeen(): void {
  try {
    window.sessionStorage.setItem(SEEN_KEY, '1')
  } catch {
    // Best effort — the leader simply plays again next visit.
  }
}

type Phase = 'count' | 'fade' | 'done'

/**
 * The opening "film leader": a 3-2-1 countdown styled after an old film-reel
 * head, shown once per session before the site. Any click, key press, wheel or
 * touch skips it instantly. Never rendered under reduced motion or on repeat
 * visits within the same session, so it costs regular visitors nothing.
 */
export default function FilmLeader() {
  const { t } = useI18n()
  const reduced = useReducedMotion()
  const [phase, setPhase] = useState<Phase>(() => (reduced || hasSeen() ? 'done' : 'count'))
  const [count, setCount] = useState<number>(FILM.leaderFrom)

  const skip = useCallback(() => {
    setPhase((current) => (current === 'count' ? 'fade' : current))
  }, [])

  // Countdown chain: step every leaderStepMs, then hand over to the fade.
  useEffect(() => {
    if (phase !== 'count') return
    const timer = window.setTimeout(() => {
      if (count <= 1) setPhase('fade')
      else setCount((c) => c - 1)
    }, FILM.leaderStepMs)
    return () => window.clearTimeout(timer)
  }, [phase, count])

  // Fade out, remember, unmount.
  useEffect(() => {
    if (phase !== 'fade') return
    markSeen()
    const timer = window.setTimeout(() => setPhase('done'), 550)
    return () => window.clearTimeout(timer)
  }, [phase])

  // Lock scrolling and listen for skip inputs while the leader is up.
  useEffect(() => {
    if (phase === 'done') return
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', skip)
    window.addEventListener('wheel', skip, { passive: true })
    window.addEventListener('touchstart', skip, { passive: true })
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', skip)
      window.removeEventListener('wheel', skip)
      window.removeEventListener('touchstart', skip)
    }
  }, [phase, skip])

  if (phase === 'done') return null

  return (
    <div
      role="presentation"
      onClick={skip}
      className={`fixed inset-0 z-[200] flex items-center justify-center bg-void grain transition-opacity duration-500 ease-cinematic ${
        phase === 'fade' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Full-frame crosshair */}
      <span aria-hidden className="absolute left-0 top-1/2 h-px w-full bg-white/5" />
      <span aria-hidden className="absolute left-1/2 top-0 h-full w-px bg-white/5" />

      {/* Reel rings + rotating radius */}
      <div aria-hidden className="absolute h-[300px] w-[300px] rounded-full border border-steel/25" />
      <div aria-hidden className="absolute h-[210px] w-[210px] rounded-full border border-white/10" />
      <span
        aria-hidden
        className="absolute left-1/2 top-1/2 h-px w-[150px] origin-left bg-accent/50 animate-spin"
        style={{ animationDuration: `${FILM.leaderStepMs}ms`, animationTimingFunction: 'linear' }}
      />

      {/* Countdown number — re-keyed per step for the pop-in */}
      <span
        key={count}
        className="relative font-extralight leading-none tabular-nums text-bone animate-[leader-num_0.65s_var(--ease-cinematic)_both] text-[120px] md:text-[180px]"
      >
        {count}
      </span>

      {/* Corner slates */}
      <span className="absolute left-5 top-5 font-mono text-[10px] uppercase tracking-[0.25em] text-steel/80 md:left-8 md:top-7">
        Helion — {t.leader.program}
      </span>
      <span className="absolute right-5 top-5 font-mono text-[10px] uppercase tracking-[0.25em] text-steel/60 md:right-8 md:top-7">
        35mm · {FILM.fps}fps
      </span>
      <span className="absolute bottom-5 left-5 font-mono text-[10px] uppercase tracking-[0.25em] text-steel/60 md:bottom-7 md:left-8">
        LAT {TELEMETRY.latitude} · LON {TELEMETRY.longitude}
      </span>
      <span className="absolute bottom-5 right-5 font-mono text-[10px] uppercase tracking-[0.2em] text-bone/50 md:bottom-7 md:right-8">
        {t.leader.skip}
      </span>
    </div>
  )
}
