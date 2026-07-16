import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { useReducedMotion } from '../../lib/hooks'
import { clamp01 } from '../../lib/easing'

const GLYPHS = '01<>/[]{}=+*#%$§'
const DEFAULT_DURATION = 620

interface ScrambleTextProps {
  text: string
  className?: string
  /** Total decode duration in ms. */
  duration?: number
}

/** Imperative handle so a focusable/hoverable parent can trigger the decode —
 *  the span itself is not focusable, so keyboard focus must come from above. */
export interface ScrambleHandle {
  run: () => void
}

/**
 * Renders text that "decodes" from random glyphs to the final string when its
 * parent calls `run()` (typically on hover/focus of a link). The real text is
 * always exposed to assistive tech via aria-label; the animated glyphs are
 * aria-hidden and settle in well under a second.
 *
 * Under reduced motion `run()` is a no-op and the final text shows immediately.
 * The in-flight loop is cancelled whenever `text` changes (e.g. locale switch)
 * so a decode from the previous language can't overwrite the new label.
 */
const ScrambleText = forwardRef<ScrambleHandle, ScrambleTextProps>(function ScrambleText(
  { text, className = '', duration = DEFAULT_DURATION },
  ref,
) {
  const reduced = useReducedMotion()
  const [display, setDisplay] = useState(text)
  const rafRef = useRef(0)

  const run = useCallback(() => {
    if (reduced) return
    cancelAnimationFrame(rafRef.current)
    const length = text.length
    let startTime = 0

    const step = (now: number) => {
      if (!startTime) startTime = now
      const progress = clamp01((now - startTime) / duration)
      let next = ''
      for (let i = 0; i < length; i += 1) {
        const char = text[i]
        if (char === ' ') {
          next += ' '
          continue
        }
        const revealPoint = (i + 1) / length
        next += progress >= revealPoint ? char : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
      }
      setDisplay(next)
      if (progress < 1) rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
  }, [text, duration, reduced])

  useImperativeHandle(ref, () => ({ run }), [run])

  // Cancel any running decode and snap to the new label when text changes.
  useEffect(() => {
    cancelAnimationFrame(rafRef.current)
    setDisplay(text)
  }, [text])

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden>{display}</span>
    </span>
  )
})

export default ScrambleText
