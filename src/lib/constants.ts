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

/** Starfield density and behaviour, split by viewport so mobile stays light. */
export const STARFIELD = {
  desktopStars: 220,
  mobileStars: 90,
  /** Devicepixelratio cap — beyond 2 the extra fill rate isn't worth it. */
  maxDpr: 2,
  /** Scroll speed (px/frame) at which stars fully stretch into warp streaks. */
  warpAtVelocity: 55,
  /** Longest a star streak may grow (px). */
  maxStreak: 42,
} as const
