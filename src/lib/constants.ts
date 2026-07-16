/**
 * Central, typed configuration for the Helion site.
 *
 * Every value a human might want to change — contact handles, section anchors,
 * motion tuning, telemetry seed — lives here as a named constant so there are no
 * magic numbers scattered through components and no duplicated strings.
 */

/**
 * Resolve a path in /public against Vite's base URL. Using this instead of a
 * hardcoded leading slash keeps media working when the site is served from a
 * sub-path (e.g. GitHub Pages project sites at username.github.io/repo/).
 */
export function asset(path: string): string {
  const base = import.meta.env.BASE_URL // always ends with '/'
  return `${base}${path.replace(/^\//, '')}`
}

/** Public contact channels. */
export const CONTACT = {
  /** Primary channel — Telegram deep link. */
  telegramHandle: '@Killallofthem13',
  telegramUrl: 'https://t.me/Killallofthem13',
  /** Secondary channel. */
  email: 'samsam27132713@gmail.com',
  /** Author profile shown in the footer credit. */
  githubUrl: 'https://github.com/SamandarMansurkhodjaev2713',
} as const

/** Stable anchor ids used by nav links and section elements. */
export const SECTION_ID = {
  hero: 'hero',
  missions: 'missions',
  fleet: 'fleet',
  route: 'route',
  crew: 'crew',
  contact: 'contact',
} as const

export type SectionId = (typeof SECTION_ID)[keyof typeof SECTION_ID]

/** Order the nav renders section links in. */
export const NAV_SECTIONS: readonly SectionId[] = [
  SECTION_ID.missions,
  SECTION_ID.fleet,
  SECTION_ID.route,
  SECTION_ID.crew,
] as const

/** Ground-station telemetry seed (Tashkent) shown in the mission strip. */
export const TELEMETRY = {
  latitude: 41.31,
  longitude: 69.24,
  station: 'TASHKENT · GROUND CONTROL',
} as const

/**
 * Motion tuning shared across imperative animations. Kept together so the whole
 * site can be re-timed from one place and so no component invents its own feel.
 */
export const MOTION = {
  /** Lerp factor for cursor follow — lower = heavier, more inertia. */
  cursorLerp: 0.18,
  /** Lerp factor for the hero video scrub. */
  scrubLerp: 0.1,
  /** Max magnetic pull distance (px) for interactive elements. */
  magneticRadius: 90,
  /** Fraction of the offset a magnetic element travels toward the pointer. */
  magneticStrength: 0.35,
  /** Max 3D tilt (deg) for interactive cards. */
  tiltMaxDeg: 8,
} as const

/**
 * Cinema-frame chrome: the fake film reel the page pretends to be. The scroll
 * position maps onto this reel to produce the SMPTE-style timecode readout.
 */
export const FILM = {
  /** Frames per second shown in the timecode readout. */
  fps: 24,
  /** Length (s) of the imaginary reel the full page scroll maps onto. */
  reelSeconds: 167,
  /** How long each number of the opening countdown stays on screen (ms). */
  leaderStepMs: 650,
  /** Countdown start value for the opening film leader. */
  leaderFrom: 3,
} as const

/**
 * Deep-space background ("cinematic optics"): layer counts and motion tuning.
 * Counts are split by viewport so phones stay light; every other value is the
 * single knob for its effect — retime the whole sky from here.
 */
export const STARFIELD = {
  /** Devicepixelratio cap — beyond 2 the extra fill rate isn't worth it. */
  maxDpr: 2,
  /** Layer populations: sharp far points, focused mid stars, bokeh discs, haze blobs. */
  desktop: { far: 150, mid: 60, near: 14, haze: 3 },
  mobile: { far: 70, mid: 30, near: 8, haze: 2 },
  /** Share of mid stars that get a diffraction cross-flare. */
  flareShare: 0.22,
  /** Satellite pass: speed range (px/s) and pause between passes (ms). */
  satelliteSpeed: [16, 30] as const,
  satelliteDelay: [14000, 26000] as const,
  /** Camera drift amplitude (px at depth 1) and its two periods (s) — co-prime
   *  periods keep the Lissajous pan from ever visibly repeating. */
  driftAmp: 46,
  driftPeriodX: 147,
  driftPeriodY: 181,
  /** Pointer parallax: max pan (px at depth 1) and per-frame lerp toward it. */
  pointerPan: 18,
  pointerLerp: 0.035,
  /** Page-scroll parallax factor at depth 1. */
  scrollParallax: 0.06,
  /** Scroll speed (px/frame) at which motion blur saturates + max streak px. */
  blurAtVelocity: 60,
  maxBlur: 34,
  /** Meteor cadence (ms): first appearance window, then steady-state window. */
  meteorFirstDelay: [5000, 9000] as const,
  meteorDelay: [15000, 25000] as const,
} as const
