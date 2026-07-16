import { useInView, useReducedMotion } from '../../lib/hooks'
import Reveal from './Reveal'

interface SectionHeadingProps {
  eyebrow: string
  title: string
  titleEmphasis: string
  intro: string
  /** Horizontal alignment of the block. */
  align?: 'left' | 'center'
  className?: string
}

/**
 * The shared section header, staged like a film title card: a mono slate line,
 * then the title rises from under a mask while its letter-spacing "lands" from
 * extra-wide into place (a classic cinema-titles move), a hairline wipes in,
 * and the lead paragraph follows. Instant under reduced motion.
 */
export default function SectionHeading({
  eyebrow,
  title,
  titleEmphasis,
  intro,
  align = 'left',
  className = '',
}: SectionHeadingProps) {
  const centered = align === 'center'
  const reduced = useReducedMotion()
  const [titleRef, titleIn] = useInView<HTMLHeadingElement>({ once: true, threshold: 0.05 })
  const shown = titleIn || reduced

  return (
    <div
      className={`flex flex-col ${centered ? 'items-center text-center' : 'items-start text-left'} ${className}`}
    >
      <Reveal variant="fade" duration={700}>
        <span className="font-mono text-[10px] uppercase tracking-telemetry text-steel md:text-[11px]">
          {eyebrow}
        </span>
      </Reveal>

      {/* Masked title: rises from below the line while the tracking settles */}
      <h2
        ref={titleRef}
        className="mt-5 max-w-[26ch] overflow-hidden text-[26px] font-extralight uppercase leading-[1.4] tracking-cine text-bone sm:text-4xl md:mt-7 md:text-5xl md:tracking-[0.18em]"
      >
        <span
          className="block will-change-transform"
          style={{
            transform: shown ? 'translateY(0)' : 'translateY(112%)',
            opacity: shown ? 1 : 0,
            // While hidden the line is tracked extra-wide; removing the inline
            // value lets it transition back to the class tracking — "landing".
            letterSpacing: shown ? undefined : '0.34em',
            transition:
              'transform 950ms var(--ease-cinematic) 80ms, letter-spacing 1250ms var(--ease-cinematic) 80ms, opacity 500ms linear 80ms',
          }}
        >
          {title} <span className="text-accent">{titleEmphasis}</span>
        </span>
      </h2>

      <Reveal variant="clip" delay={260} duration={800} className="mt-7 w-full max-w-md">
        <div className="hairline" />
      </Reveal>

      <Reveal variant="rise" delay={330} className="mt-6">
        <p
          className={`max-w-[52ch] text-sm leading-relaxed text-bone/60 md:text-base ${
            centered ? 'mx-auto' : ''
          }`}
        >
          {intro}
        </p>
      </Reveal>
    </div>
  )
}
