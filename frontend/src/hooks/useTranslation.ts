import { useLanguageStore } from '../stores/languageStore';
import { translations } from '../lib/translations';

export function useTranslation() {
  const lang = useLanguageStore((s) => s.language);

  const t = translations[lang] || translations.id;

  return { t, lang };
}
