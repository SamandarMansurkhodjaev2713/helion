import { useCallback, useEffect, useRef, type CSSProperties } from 'react'
import { asset } from '../../lib/constants'
import { useDeviceTier } from '../../lib/hooks'

/** Frames exported from the footage into `public/hero` (see docs/animations.md). */
const FRAME_COUNT = 72

/** Backing-store cap. Beyond 2× the extra pixels cost memory and buy nothing. */
const MAX_DPR = 2

/**
 * Load order, expressed as strides. Every eighth frame arrives first, so the
 * sequence can be scrubbed — coarsely — while the rest is still in flight; each
 * later pass halves the gap. A phone on a slow connection gets a usable hero in
 * a few hundred kilobytes instead of waiting for all of it.
 */
const REFINEMENT_PASSES: readonly number[] = [8, 4, 2, 1]

/** Weak devices stop one pass early: 36 frames, half the bytes and memory. */
const LOW_TIER_PASSES: readonly number[] = [8, 4, 2]

/** Concurrent image requests. Enough to saturate a link, few enough that the
 *  coarse pass is never stuck behind the fine one. */
const MAX_PARALLEL_LOADS = 6

const frameUrl = (index: number) => asset(`hero/f_${String(index + 1).padStart(2, '0')}.webp`)

/** Indices in the order they should be fetched, coarsest pass first. */
function loadOrder(count: number, passes: readonly number[]): number[] {
  const order: number[] = []
  const queued = new Set<number>()
  for (const stride of passes) {
    for (let index = 0; index < count; index += stride) {
      if (queued.has(index)) continue
      queued.add(index)
      order.push(index)
    }
  }
  // The closing frame ends the shot; a stride that skips it would lose the beat.
  const last = count - 1
  if (!queued.has(last)) order.push(last)
  return order
}

/**
 * The nearest frame that has actually arrived, preferring the one just before
 * the target: during the coarse pass, holding the last frame the camera reached
 * reads as a slow shutter, while jumping ahead reads as a glitch.
 */
function nearestLoaded(
  frames: readonly (HTMLImageElement | null)[],
  index: number,
): HTMLImageElement | null {
  const exact = frames[index]
  if (exact) return exact
  for (let distance = 1; distance < frames.length; distance += 1) {
    const before = frames[index - distance]
    if (before) return before
    const after = frames[index + distance]
    if (after) return after
  }
  return null
}

/** Paint the frame the way `object-fit: cover` would: fill, crop, stay centred. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
): void {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
  const drawWidth = image.naturalWidth * scale
  const drawHeight = image.naturalHeight * scale
  ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight)
}

interface HeroFramesProps {
  /** Position in the footage, 0–1, already mapped through the story script. */
  position: number
  className?: string
  style?: CSSProperties
  /** Described by the hero copy around it, so the canvas itself stays silent. */
  label: string
}

/**
 * The hero footage as a scrubbed frame sequence.
 *
 * Phones cannot scrub video: seeking means writing `currentTime` every frame,
 * and no handset can seek inside a multi-megabyte H.264 file at that rate — the
 * decoder stalls and the hero reads as a page that never loaded. Drawing
 * pre-decoded frames removes the decoder from the scroll path entirely, so the
 * picture answers the thumb immediately on any device, at about a fourteenth of
 * the bytes the video cost.
 */
export default function HeroFrames({ position, className = '', style, label }: HeroFramesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const framesRef = useRef<(HTMLImageElement | null)[]>(Array(FRAME_COUNT).fill(null))
  const positionRef = useRef(position)
  const tier = useDeviceTier()

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const index = Math.round(positionRef.current * (FRAME_COUNT - 1))
    const image = nearestLoaded(framesRef.current, index)
    if (!image) return
    drawCover(ctx, image, canvas.width, canvas.height)
  }, [])

  // Keep the backing store matched to the box, capped so a 3× phone screen
  // does not allocate a canvas it cannot afford to repaint.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      const { width, height } = canvas.getBoundingClientRect()
      if (width === 0 || height === 0) return
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      draw()
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [draw])

  // Fetch the sequence, coarsest pass first, and repaint whenever a frame that
  // improves the current position arrives.
  useEffect(() => {
    const frames = framesRef.current
    let cancelled = false

    const loadFrame = (index: number) =>
      new Promise<void>((resolve) => {
        const image = new Image()
        if (index === 0) image.setAttribute('fetchpriority', 'high')
        image.onload = () => {
          if (cancelled) return resolve()
          frames[index] = image
          draw()
          resolve()
        }
        // A frame that fails to arrive is covered by its neighbour rather than
        // stalling the queue behind it — the sequence degrades, never blocks.
        image.onerror = () => resolve()
        image.src = frameUrl(index)
      })

    const order = loadOrder(FRAME_COUNT, tier === 'low' ? LOW_TIER_PASSES : REFINEMENT_PASSES)
    let cursor = 0
    const worker = async (): Promise<void> => {
      while (cursor < order.length && !cancelled) {
        await loadFrame(order[cursor++])
      }
    }
    void Promise.all(Array.from({ length: MAX_PARALLEL_LOADS }, worker))

    return () => {
      cancelled = true
    }
  }, [draw, tier])

  useEffect(() => {
    positionRef.current = position
    draw()
  }, [draw, position])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={style}
      role="img"
      aria-label={label}
    />
  )
}
