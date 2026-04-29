import { useAuthStore } from '../stores/authStore';
import { translations } from '../lib/translations';

export function useTranslation() {
  const { user } = useAuthStore();
  const lang = (user?.language as 'id' | 'en') || 'id';

  const t = translations[lang] || translations.id;

  return { t, lang };
}
