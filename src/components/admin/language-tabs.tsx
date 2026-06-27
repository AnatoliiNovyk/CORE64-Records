import { useTranslation } from 'react-i18next'

const LANGS = ['en', 'uk'] as const

export type Lang = (typeof LANGS)[number]

interface LanguageTabsProps {
  active: Lang
  onChange: (lang: Lang) => void
}

export function LanguageTabs({ active, onChange }: LanguageTabsProps) {
  const { t } = useTranslation()
  return (
    <div className="flex gap-1 rounded-md border border-border bg-secondary/50 p-0.5">
      {LANGS.map(lang => (
        <button
          key={lang}
          type="button"
          onClick={() => onChange(lang)}
          className={`rounded px-3 py-1 font-mono text-xs font-medium transition-colors ${
            active === lang
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {t(`admin.langTabs.${lang}`)}
        </button>
      ))}
    </div>
  )
}
