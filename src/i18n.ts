import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en/translation.json'
import uk from './locales/uk/translation.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      uk: { translation: uk },
    },
    fallbackLng: 'uk',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage'],
      lookupLocalStorage: 'core64-lang',
      caches: ['localStorage'],
    },
  })

function normalizeLang(lng: string): 'uk' | 'en' {
  return lng.toLowerCase().startsWith('uk') ? 'uk' : 'en'
}

function setMetaContent(selector: string, content: string) {
  const el = document.querySelector(selector)
  if (el) el.setAttribute('content', content)
}

/** Keep <html lang>, document.title, and social/meta descriptions in sync with i18n. */
export function syncDocumentMeta(lng?: string) {
  const lang = normalizeLang(lng ?? i18n.language ?? 'uk')
  document.documentElement.lang = lang

  const title = i18n.t('meta.title', { lng: lang })
  const description = i18n.t('meta.description', { lng: lang })

  if (title) document.title = title
  if (description) {
    setMetaContent('meta[name="description"]', description)
    setMetaContent('meta[property="og:description"]', description)
    setMetaContent('meta[name="twitter:description"]', description)
  }
  if (title) {
    setMetaContent('meta[property="og:title"]', title)
    setMetaContent('meta[name="twitter:title"]', title)
  }
  setMetaContent('meta[property="og:locale"]', lang === 'uk' ? 'uk_UA' : 'en_US')
}

i18n.on('languageChanged', (lng) => {
  syncDocumentMeta(lng)
})

syncDocumentMeta(i18n.language)

export default i18n
