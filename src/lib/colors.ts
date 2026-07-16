/**
 * Colour helpers shared by canvas code, which cannot read Tailwind classes and
 * instead resolves the same brand tokens from CSS custom properties.
 */

/** Read a brand colour token (e.g. '--accent') as an `r, g, b` string, ready
 *  to interpolate into `rgba(${rgb}, alpha)` templates. */
export function readTokenRgb(varName: string): string {
  const hex = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  const int = parseInt(hex.replace('#', ''), 16)
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255
  return `${r}, ${g}, ${b}`
}
