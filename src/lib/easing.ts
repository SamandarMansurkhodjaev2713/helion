/**
 * Pure math helpers for animation. No side effects, no DOM — safe to unit test
 * and to call inside a requestAnimationFrame loop without allocation surprises.
 */

/** Clamp a number to the inclusive [min, max] range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Clamp to the 0–1 range — the most common case for progress values. */
export function clamp01(value: number): number {
  return clamp(value, 0, 1)
}

/** Linear interpolation from `a` to `b` by fraction `t`. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Re-map a value from one range to another and clamp to the output range.
 * Used to turn scroll progress into opacity, offset, blur, etc.
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  if (inMax === inMin) return outMin
  const t = clamp01((value - inMin) / (inMax - inMin))
  return outMin + (outMax - outMin) * t
}

/** Cubic ease-out — fast start, long gentle settle. Mirrors our CSS easing. */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/** Expo ease-out — even longer, more cinematic tail. */
export function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

/** Smoothstep — symmetric ease-in-out, good for parallax and looping motion. */
export function smoothstep(t: number): number {
  const x = clamp01(t)
  return x * x * (3 - 2 * x)
}
