import LineReveal from './LineReveal'
import TensionTitle from './TensionTitle'

interface SectionHeadingProps {
  eyebrow: string
  title: string
  titleEmphasis: string
  intro: string
  /** Scene number shown on the tension gauge. */
  scene?: string
  /** Pinned headers do not travel with the scroll, so they resolve at once. */
  scrollLinked?: boolean
  /** Horizontal alignment of the block. */
  align?: 'left' | 'center'
  className?: string
}

/**
 * The shared section header, staged like a film title card: a mono slate line,
 * then the title the reader pulls into place against a tension gauge, a
 * hairline, and the lead paragraph.
 *
 * The gauge doubles as the section's chapter marker, which is why no separate
 * rule is drawn above it — one element carrying both meanings beats two
 * competing hairlines a few pixels apart.
 */
export default function SectionHeading({
  eyebrow,
  title,
  titleEmphasis,
  intro,
  scene,
  scrollLinked = true,
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
      </LineReveal>

      <TensionTitle scene={scene} scrollLinked={scrollLinked} className="mt-5 w-full md:mt-7">
        {title} <span className="text-accent">{titleEmphasis}</span>
      </TensionTitle>

      <LineReveal stagger={90} delay={120} className="w-full">
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
