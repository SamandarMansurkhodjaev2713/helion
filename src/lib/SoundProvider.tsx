import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { SOUND } from './constants'
import { soundEngine, type SoundCue } from './sound'
import { useReducedMotion } from './hooks'

interface SoundValue {
  enabled: boolean
  toggle: () => void
  /** Fire an interface cue. Safe to call even when sound is off. */
  play: (cue: SoundCue) => void
}

const SoundContext = createContext<SoundValue | null>(null)

function readStored(): boolean {
  try {
    return window.localStorage.getItem(SOUND.storageKey) === 'on'
  } catch {
    return false
  }
}

/**
 * Owns the synthesised sound bed. Sound is OFF by default — it only ever starts
 * from an explicit user toggle, which doubles as the gesture the browser needs
 * to unlock audio. The choice persists across visits, but is ignored under
 * reduced motion, where the site stays silent.
 */
export function SoundProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion()
  const [enabled, setEnabled] = useState(false)

  // Restore a previous "on" choice once, after mount.
  useEffect(() => {
    if (reduced) return
    if (readStored()) setEnabled(true)
  }, [reduced])

  useEffect(() => {
    if (reduced || !enabled) {
      soundEngine.mute()
      return
    }
    void soundEngine.enable()
  }, [enabled, reduced])

  // Release the audio graph when the app unmounts.
  useEffect(() => () => soundEngine.dispose(), [])

  const toggle = useCallback(() => {
    setEnabled((on) => {
      const next = !on
      try {
        window.localStorage.setItem(SOUND.storageKey, next ? 'on' : 'off')
      } catch {
        // Persisting is best-effort.
      }
      if (next) void soundEngine.enable()
      else soundEngine.mute()
      return next
    })
  }, [])

  const play = useCallback(
    (cue: SoundCue) => {
      if (!enabled || reduced) return
      soundEngine.play(cue)
    },
    [enabled, reduced],
  )

  const value = useMemo<SoundValue>(() => ({ enabled, toggle, play }), [enabled, toggle, play])
  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
}

/** Access the sound toggle and cue player. Must be inside SoundProvider. */
export function useSound(): SoundValue {
  const value = useContext(SoundContext)
  if (!value) throw new Error('useSound must be used within <SoundProvider>')
  return value
}
