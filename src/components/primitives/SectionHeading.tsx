import LineReveal from './LineReveal'

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
 * the title in the site's one entrance gesture (lines rising from under a
 * mask), a hairline, then the lead paragraph — each beat a step behind the
 * last. The title uses the fluid `.title-cine-lg` scale, so it reads as a
 * poster on a monitor and still fits a 375px phone.
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
      <LineReveal stagger={90} className="w-full">
        <span className="block font-mono text-[10px] uppercase tracking-telemetry text-steel md:text-[11px]">
          {eyebrow}
        </span>

        <h2 className="title-cine-lg mt-5 max-w-[22ch] text-bone md:mt-7">
          {title} <span className="text-accent">{titleEmphasis}</span>
        </h2>

        <span className={`mt-7 block h-px w-full max-w-md ${centered ? 'mx-auto' : ''}`}>
          <span className="hairline block" />
        </span>

        <p
          className={`mt-6 block max-w-[52ch] text-sm leading-relaxed text-bone/60 md:text-base ${
            centered ? 'mx-auto' : ''
          }`}
        >
          {intro}
        </p>
      </LineReveal>
    </div>
  )
}
