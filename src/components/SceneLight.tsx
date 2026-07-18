import { SECTION_ID } from '../lib/constants'
import { useActiveSection, useReducedMotion } from '../lib/hooks'

/** Where each scene's key light comes from — its lighting setup on the set. */
const SETUPS: Record<string, string> = {
  // rgba values mirror --ice / --accent / --mars
  [SECTION_ID.hero]: 'radial-gradient(80% 60% at 50% 100%, rgba(157, 187, 214, 0.07), transparent 70%)',
  [SECTION_ID.missions]: 'radial-gradient(70% 80% at 2% 40%, rgba(157, 187, 214, 0.09), transparent 68%)',
  [SECTION_ID.fleet]: 'radial-gradient(90% 65% at 50% 0%, rgba(157, 187, 214, 0.10), transparent 66%)',
  [SECTION_ID.route]: 'radial-gradient(85% 70% at 90% 30%, rgba(111, 211, 242, 0.08), transparent 68%)',
  [SECTION_ID.crew]: 'radial-gradient(70% 80% at 98% 40%, rgba(157, 187, 214, 0.09), transparent 68%)',
  [SECTION_ID.contact]: 'radial-gradient(95% 75% at 50% 100%, rgba(224, 154, 106, 0.11), transparent 68%)',
}

const ORDER = Object.keys(SETUPS)

/**
 * The page's lighting, owned by the page rather than by any section.
 *
 * Every scene is lit from its own direction, and moving between scenes
 * cross-fades one setup into the next. Because this is a single fixed layer
 * behind all content, the light can never acquire an edge: earlier builds put
 * a lit layer *inside* each section, where it stopped dead at the section's
 * boundary (or, when stretched to `100vw`, added the scrollbar's width to the
 * page and caused horizontal overflow). Neither failure is possible here.
 *
 * Renders a flat, single setup under reduced motion.
 */
export default function SceneLight() {
  const active = useActiveSection(ORDER)
  const reduced = useReducedMotion()

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      {ORDER.map((id) => (
        <div
          key={id}
          className="absolute inset-0"
          style={{
            background: SETUPS[id],
            opacity: reduced ? (id === SECTION_ID.hero ? 1 : 0) : active === id ? 1 : 0,
            transition: reduced ? undefined : 'opacity 1400ms var(--ease-cinematic)',
          }}
        />
      ))}
    </div>
  )
}
