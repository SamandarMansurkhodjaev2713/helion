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
 * The shared section header, styled as a film title card: a mono slate line,
 * one ultra-light uppercase tracked title with the key phrase in the cold
 * accent, a hairline rule that wipes in, then the lead paragraph. Each part
 * enters with a staggered cinematic reveal.
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

  return (
    <div
      className={`flex flex-col ${centered ? 'items-center text-center' : 'items-start text-left'} ${className}`}
    >
      <Reveal variant="fade" duration={700}>
        <span className="font-mono text-[10px] uppercase tracking-telemetry text-steel md:text-[11px]">
          {eyebrow}
        </span>
      </Reveal>

      <Reveal variant="focus" delay={90} className="mt-5 md:mt-7">
        <h2 className="max-w-[26ch] text-[26px] font-extralight uppercase leading-[1.4] tracking-cine text-bone sm:text-4xl md:text-5xl md:tracking-[0.18em]">
          {title} <span className="text-accent">{titleEmphasis}</span>
        </h2>
      </Reveal>

      <Reveal variant="clip" delay={190} duration={800} className="mt-7 w-full max-w-md">
        <div className="hairline" />
      </Reveal>

      <Reveal variant="rise" delay={260} className="mt-6">
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
