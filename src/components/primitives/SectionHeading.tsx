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
 * The shared section header: a mono eyebrow, a two-line title — a light sans
 * line followed by the wide display line in the cold accent — and a lead
 * paragraph. Each part enters with a staggered cinematic focus-pull.
 */
export default function SectionHeading({
  eyebrow,
  title,
  titleEmphasis,
  intro,
  align = 'left',
  className = '',
}: SectionHeadingProps) {
  const alignment =
    align === 'center' ? 'items-center text-center' : 'items-start text-left'

  return (
    <div className={`flex flex-col ${alignment} ${className}`}>
      <Reveal variant="fade" duration={700}>
        <span className="font-mono text-[11px] uppercase tracking-telemetry text-steel md:text-xs">
          {eyebrow}
        </span>
      </Reveal>

      <Reveal variant="focus" delay={90} className="mt-5">
        <h2 className="max-w-[18ch] text-4xl font-light leading-[1.05] tracking-[-0.02em] text-bone sm:text-5xl md:text-6xl">
          {title}
          <span className="mt-3 block font-display text-[0.52em] font-medium uppercase leading-[1.2] tracking-[0.06em] text-accent">
            {titleEmphasis}
          </span>
        </h2>
      </Reveal>

      <Reveal variant="rise" delay={200} className="mt-6">
        <p
          className={`max-w-[46ch] text-base leading-relaxed text-bone/60 md:text-lg ${
            align === 'center' ? 'mx-auto' : ''
          }`}
        >
          {intro}
        </p>
      </Reveal>
    </div>
  )
}
