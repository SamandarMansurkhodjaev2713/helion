/**
 * The shape of a full site translation. `ru.ts` and `uz.ts` both implement this
 * interface, so TypeScript guarantees neither locale is missing a key and that
 * every structured item (mission, ship, milestone…) carries the same fields.
 */

export type Locale = 'ru' | 'uz'

/** Lifecycle state of a mission — drives the status pill styling. */
export type MissionStatus = 'active' | 'returned' | 'planned'

export interface MissionItem {
  code: string
  name: string
  distance: string
  duration: string
  crew: string
  status: MissionStatus
  summary: string
}

export interface ShipSpec {
  label: string
  value: string
  unit: string
}

export interface ShipItem {
  id: string
  name: string
  klass: string
  role: string
  description: string
  specs: ShipSpec[]
}

export interface Milestone {
  phase: string
  date: string
  title: string
  body: string
}

export interface CrewMember {
  name: string
  role: string
  tag: string
  bio: string
}

export interface Dictionary {
  meta: {
    title: string
    description: string
  }
  nav: {
    missions: string
    fleet: string
    route: string
    crew: string
    cta: string
    /** Accessible label for the language switch. */
    languageLabel: string
    /** Accessible label for the primary navigation landmark. */
    menuLabel: string
  }
  telemetry: {
    status: string
    phaseLabel: string
  }
  hero: {
    titleLine1: string
    titleEmphasis: string
    titleLine3: string
    lead: string
    asideTitle: string
    asideEmphasis: string
    asideBody: string
    voyageLabel: string
    voyageYear: string
    scrollHint: string
    missionTag: string
    bLine1: string
    bEmphasisA: string
    bEmphasisB: string
    bBody1: string
    bBody2: string
    statDistanceValue: string
    statDistanceLabel: string
    statOutboundValue: string
    statOutboundLabel: string
    statCrewValue: string
    statCrewLabel: string
    finaleLine1: string
    finaleEmphasis: string
    finaleLeftEyebrow: string
    finaleLeftBody: string
    finaleSeatsValue: string
    finaleSeatsLabel: string
    finaleDepartureValue: string
    finaleDepartureLabel: string
    finaleRightBody: string
    reserveCta: string
    routeLink: string
  }
  missions: {
    eyebrow: string
    title: string
    titleEmphasis: string
    intro: string
    statusActive: string
    statusReturned: string
    statusPlanned: string
    viewDossier: string
    labelDistance: string
    labelDuration: string
    labelCrew: string
    items: MissionItem[]
  }
  fleet: {
    eyebrow: string
    title: string
    titleEmphasis: string
    intro: string
    selectHint: string
    ships: ShipItem[]
  }
  route: {
    eyebrow: string
    title: string
    titleEmphasis: string
    intro: string
    scrollHint: string
    progressLabel: string
    milestones: Milestone[]
  }
  crew: {
    eyebrow: string
    title: string
    titleEmphasis: string
    intro: string
    members: CrewMember[]
  }
  contact: {
    eyebrow: string
    title: string
    titleEmphasis: string
    body: string
    telegramCta: string
    emailCta: string
    channelNote: string
    seatsValue: string
    seatsLabel: string
    manifest: string
  }
  footer: {
    tagline: string
    rights: string
    builtWith: string
    /** Author credit line; rendered as a link to the GitHub profile. */
    author: string
    backToTop: string
  }
}
