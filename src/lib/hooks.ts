import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { clamp01 } from './easing'
import { HAPTICS, QUALITY } from './constants'

/**
 * Subscribe to a media query and re-render when it flips. SSR-safe default of
 * `false` (this app is client-rendered, but guarding keeps the hook portable).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches)
    setMatches(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** True when the user asked the OS to minimise motion. */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

/** True on precise pointers (mouse/trackpad) — where the custom cursor is worth it. */
export function usePointerFine(): boolean {
  return useMediaQuery('(hover: hover) and (pointer: fine)')
}

/** Device capability tier. 'high' gets the full spectacle, 'low' a lighter cut. */
export type DeviceTier = 'high' | 'low'

interface NavigatorHints extends Navigator {
  deviceMemory?: number
  getBattery?: () => Promise<{ level: number; addEventListener: EventTarget['addEventListener'] }>
}

/**
 * Decide how much visual work this device should be asked to do. A short
 * frame-rate probe on mount is combined with hardware hints (memory, cores)
 * and, where exposed, battery level. Everything degrades to 'high' when the
 * hints are unavailable, so capable browsers are never punished for privacy.
 *
 * The probe runs once and its rAF is cancelled on unmount.
 */
export function useDeviceTier(): DeviceTier {
  const [tier, setTier] = useState<DeviceTier>('high')

  useEffect(() => {
    const nav = navigator as NavigatorHints
    // Hardware hints are decisive on their own — no need to burn frames.
    if (
      (nav.deviceMemory !== undefined && nav.deviceMemory <= QUALITY.lowMemoryGb) ||
      (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= QUALITY.lowCores)
    ) {
      setTier('low')
      return
    }

    let frames = 0
    let start = 0
    let raf = 0
    const sample = (now: number) => {
      if (!start) start = now
      frames += 1
      if (frames < QUALITY.probeFrames) {
        raf = requestAnimationFrame(sample)
        return
      }
      const fps = (frames * 1000) / (now - start)
      if (fps < QUALITY.lowFpsThreshold) setTier('low')
    }
    raf = requestAnimationFrame(sample)

    // Battery, when the browser exposes it, can demote a strong device.
    let cancelled = false
    nav
      .getBattery?.()
      .then((battery) => {
        if (!cancelled && battery.level <= QUALITY.lowBattery) setTier('low')
      })
      .catch(() => {
        // Not exposed — keep the frame-rate verdict.
      })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [])

  return tier
}

/** Short, optional haptic feedback for touch interactions. */
export function useHaptics(): (strength?: keyof typeof HAPTICS) => void {
  return useCallback((strength: keyof typeof HAPTICS = 'light') => {
    // Vibration is unsupported on iOS Safari and may be blocked elsewhere;
    // it is pure enhancement, so failure is silently fine.
    try {
      navigator.vibrate?.(HAPTICS[strength])
    } catch {
      // Ignore — the visual feedback still fired.
    }
  }, [])
}

/**
 * Whether the chrome should currently be visible: hidden while the user scrolls
 * down through content, shown again on any upward scroll, near the top, or once
 * scrolling stops. Used by the mobile letterbox bars so they stop eating 11% of
 * a phone screen without ever losing the cinema frame for long.
 */
export function useChromeVisible(enabled: boolean, hideAfter = 90): boolean {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!enabled) {
      setVisible(true)
      return
    }
    let lastY = window.scrollY
    let frame = 0
    let idleTimer = 0

    const measure = () => {
      frame = 0
      const y = window.scrollY
      const delta = y - lastY
      lastY = y
      if (y < hideAfter) setVisible(true)
      else if (delta > 4) setVisible(false)
      else if (delta < -4) setVisible(true)

      // Standing still always returns the frame.
      window.clearTimeout(idleTimer)
      idleTimer = window.setTimeout(() => setVisible(true), 900)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }

    window.addEventListener('scroll', schedule, { passive: true })
    return () => {
      window.removeEventListener('scroll', schedule)
      if (frame) cancelAnimationFrame(frame)
      window.clearTimeout(idleTimer)
    }
  }, [enabled, hideAfter])

  return visible
}

interface InViewOptions {
  /** Fraction of the element that must be visible to count as "in view". */
  threshold?: number
  /** Margin around the root, CSS-style (e.g. "0px 0px -15% 0px"). */
  rootMargin?: string
  /** When true, stop observing after the first entry — reveal-once behaviour. */
  once?: boolean
}

/** True when the element's rect intersects the viewport. `bottomInset` shrinks
 *  the viewport from below so reveals start a touch before the very edge. */
function rectInViewport(el: Element, bottomInset: number): boolean {
  const rect = el.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) return false
  return rect.top < window.innerHeight * (1 - bottomInset) && rect.bottom > 0
}

/**
 * Report whether an element is inside the viewport. IntersectionObserver does
 * the primary work, but one-shot reveals are additionally guaranteed by two
 * fallbacks — an immediate rect check on mount and a rAF-throttled rect check
 * on scroll — because a missed IO callback (heavy scroll, some mobile engines)
 * would otherwise leave content permanently hidden. Everything disconnects on
 * unmount and as soon as a one-shot reveal fires.
 */
export function useInView<T extends Element>(
  options: InViewOptions = {},
): [RefObject<T>, boolean] {
  const { threshold = 0, rootMargin = '0px 0px -7% 0px', once = true } = options
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // Already on screen when we mount (fast scroll, delayed hydration).
    if (once && rectInViewport(node, 0.05)) {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setInView(false)
        }
      },
      { threshold, rootMargin },
    )
    observer.observe(node)

    if (!once) return () => observer.disconnect()

    // Safety net for one-shot reveals: verify the rect on scroll until hit.
    let frame = 0
    const check = () => {
      frame = 0
      if (!rectInViewport(node, 0.05)) return
      setInView(true)
      observer.disconnect()
      window.removeEventListener('scroll', schedule)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check)
    }
    window.addEventListener('scroll', schedule, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [threshold, rootMargin, once])

  return [ref, inView]
}

/**
 * Track how far an element has travelled through the viewport as a 0–1 value:
 * 0 when its top hits the bottom of the viewport, 1 when its bottom leaves the
 * top. Updates are throttled to animation frames and cancelled on unmount.
 *
 * `enabled` lets callers skip all work (e.g. under reduced motion) without
 * violating the rules-of-hooks ordering.
 */
export function useViewportProgress<T extends Element>(
  enabled = true,
): [RefObject<T>, number] {
  const ref = useRef<T>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const node = ref.current
    if (!node || !enabled) return

    let frame = 0
    const measure = () => {
      const rect = node.getBoundingClientRect()
      const viewport = window.innerHeight
      const total = viewport + rect.height
      const travelled = viewport - rect.top
      setProgress(clamp01(travelled / total))
      frame = 0
    }

    const schedule = () => {
      if (frame) return
      frame = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [enabled])

  return [ref, progress]
}

/**
 * Progress (0–1) of scrolling THROUGH a pinned element: 0 when its top reaches
 * the top of the viewport, 1 when its bottom reaches the bottom. This is the
 * value that drives a sticky/pinned scene (e.g. the horizontal route timeline).
 * Throttled to animation frames; listeners cleaned up on unmount.
 */
export function usePinProgress<T extends Element>(enabled = true): [RefObject<T>, number] {
  const ref = useRef<T>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const node = ref.current
    if (!node || !enabled) return

    let frame = 0
    const measure = () => {
      const rect = node.getBoundingClientRect()
      const scrollable = rect.height - window.innerHeight
      setProgress(scrollable > 0 ? clamp01(-rect.top / scrollable) : 0)
      frame = 0
    }
    const schedule = () => {
      if (frame) return
      frame = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [enabled])

  return [ref, progress]
}

/**
 * Track which of the given section ids is currently the most prominent in the
 * viewport. Used to highlight the active nav link and drive the phase readout.
 * Falls back to the first id until something intersects. Cleans up its observer.
 */
export function useActiveSection(ids: readonly string[]): string {
  const [active, setActive] = useState(ids[0] ?? '')

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
    if (elements.length === 0) return

    // A band across the vertical middle of the viewport decides the winner.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [ids])

  return active
}
