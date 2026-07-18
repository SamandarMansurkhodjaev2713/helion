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
  /** Origin and destination captions on the mini trajectory. */
  origin: string
  target: string
  /** Two ship's-log lines that type out when the dossier opens. */
  log: [string, string]
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
  /** Radio callsign shown on hover. */
  callsign: string
  /** Flight record: logged hours and completed missions. */
  hours: string
  missions: string
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
    contact: string
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
  /** Labels of the fixed letterbox chrome (top/bottom cinema bars). */
  chrome: {
    menu: string
    close: string
  }
  /** Scene captions shown in the bottom cinema bar per active section. */
  scenes: {
    hero: string
    missions: string
    fleet: string
    route: string
    crew: string
    contact: string
  }
  /** One-line descriptions under the full-screen menu items. */
  menuCaptions: {
    missions: string
    fleet: string
    route: string
    crew: string
    contact: string
  }
  /** Opening film-leader countdown overlay. */
  leader: {
    program: string
    skip: string
  }
  /** Action verbs the HUD cursor shows when it locks onto a target. */
  cursor: {
    open: string
    view: string
    select: string
    contact: string
  }
  /** Sound toggle in the top bar. */
  sound: {
    label: string
    on: string
    off: string
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
    /** Describes the hero footage for readers who cannot see it. */
    footageAlt: string
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
    /** Heading of the trajectory diagram inside an open dossier. */
    trajectoryLabel: string
    /** Origin / destination captions on the trajectory. */
    originLabel: string
    targetLabel: string
    /** Heading of the ship's-log strip. */
    logLabel: string
    items: MissionItem[]
  }
  fleet: {
    eyebrow: string
    title: string
    titleEmphasis: string
    intro: string
    selectHint: string
    /** Caption tag on the archive still of the selected ship. */
    stillLabel: string
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
    /** Column captions of the flight-record strip. */
    labelHours: string
    labelMissions: string
    labelCallsign: string
    /** Closing commander's line under the crew list. */
    quote: string
    quoteAuthor: string
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
    /** Boarding-pass field captions and values. */
    passTitle: string
    passSeat: string
    passSeatValue: string
    passFlight: string
    passFlightValue: string
    passDeparture: string
    passDepartureValue: string
    passGate: string
    passGateValue: string
    passNote: string
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
