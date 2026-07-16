import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Dictionary, Locale } from './types'
import { ru } from './ru'
import { uz } from './uz'

const DICTIONARIES: Record<Locale, Dictionary> = { ru, uz }
const SUPPORTED_LOCALES: readonly Locale[] = ['ru', 'uz']
const DEFAULT_LOCALE: Locale = 'ru'
const STORAGE_KEY = 'helion-locale'

interface I18nValue {
  locale: Locale
  /** The active dictionary — read every string from here. */
  t: Dictionary
  setLocale: (locale: Locale) => void
  /** All locales, in display order, for building the language switch. */
  locales: readonly Locale[]
}

const I18nContext = createContext<I18nValue | null>(null)

function isLocale(value: string | null): value is Locale {
  return value !== null && SUPPORTED_LOCALES.includes(value as Locale)
}

/** Read the persisted locale, falling back to the default. Never throws. */
function readStoredLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (isLocale(stored)) return stored
  } catch {
    // Private mode / disabled storage — fall through to the default.
  }
  return DEFAULT_LOCALE
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale)

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Persisting is best-effort; the in-memory choice still applies.
    }
  }, [])

  // Keep the document in sync with the active locale for a11y and SEO.
  useEffect(() => {
    const dict = DICTIONARIES[locale]
    document.documentElement.lang = locale
    document.title = dict.meta.title
    const description = document.querySelector('meta[name="description"]')
    if (description) description.setAttribute('content', dict.meta.description)
  }, [locale])

  const value = useMemo<I18nValue>(
    () => ({ locale, t: DICTIONARIES[locale], setLocale, locales: SUPPORTED_LOCALES }),
    [locale, setLocale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

/** Access the active dictionary and locale controls. Must be inside I18nProvider. */
export function useI18n(): I18nValue {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used within <I18nProvider>')
  return value
}
