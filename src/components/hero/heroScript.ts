import { mapRange } from '../../lib/easing'

/**
 * The hero's story script, shared by every cut.
 *
 * The footage is one continuous take in two movements: the camera pushes in on
 * the figure until it rests on the helmet, holds there while the mission
 * briefing is read, then pulls back to leave the figure small against a world.
 * Desktop plays it by seeking a video, phones by drawing a frame sequence — but
 * both read the beats from here, so the two cuts can never drift apart.
 */

/** Timestamp (s) where the push-in ends and the held frame begins. */
export const CLIP1_END_SECONDS = 8.0417

/** Full length of the footage (s); the video's own metadata wins once loaded. */
export const FOOTAGE_SECONDS = 18.0839

/** Where the held frame sits as a fraction of the whole take. */
export const HOLD_POSITION = CLIP1_END_SECONDS / FOOTAGE_SECONDS

/**
 * Where each movement falls within a cut's pinned scroll, as fractions of it.
 * A cut declares its own windows because the two have very different lengths:
 * seven screens of pinned scrolling reads as luxurious on a trackpad and as
 * work on a thumb.
 */
export interface FootageScript {
  /** Scroll at which the push-in leaves the first frame. */
  moveInStart: number
  /** Scroll at which the camera settles on the helmet. */
  moveInEnd: number
  /** Scroll at which the held frame breaks and the pull-back starts. */
  moveOutStart: number
  /** Scroll at which the last frame is reached. */
  moveOutEnd: number
}

/** Desktop: 720vh of pinned scroll, so every movement can take its time. */
export const DESKTOP_SCRIPT: FootageScript = {
  moveInStart: 0.01,
  moveInEnd: 0.4,
  moveOutStart: 0.63,
  moveOutEnd: 0.92,
}

/**
 * Phones: 320vh. The hold is timed to the briefing copy (which lands earlier
 * than on desktop), so the frame is still while there is something to read.
 */
export const MOBILE_SCRIPT: FootageScript = {
  moveInStart: 0.01,
  moveInEnd: 0.28,
  moveOutStart: 0.63,
  moveOutEnd: 0.88,
}

/**
 * Map a cut's pinned-scroll progress to a position in the footage, 0–1.
 * Multiply by a duration for a video, by a frame count for a sequence.
 */
export function footagePosition(progress: number, script: FootageScript): number {
  if (progress <= script.moveInStart) return 0
  if (progress < script.moveInEnd) {
    return mapRange(progress, script.moveInStart, script.moveInEnd, 0, HOLD_POSITION)
  }
  if (progress < script.moveOutStart) return HOLD_POSITION
  if (progress < script.moveOutEnd) {
    return mapRange(progress, script.moveOutStart, script.moveOutEnd, HOLD_POSITION, 1)
  }
  return 1
}
