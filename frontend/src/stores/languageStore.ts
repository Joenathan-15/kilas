import { create } from 'zustand';

const STORAGE_KEY = 'kilas_language';
const PENDING_SYNC_KEY = 'kilas_language_pending_sync';

export type AppLanguage = 'id' | 'en';

interface LanguageState {
  language: AppLanguage;
  pendingSync: boolean;
  setLanguage: (lang: AppLanguage) => void;
  syncFromUser: (userLang: string | undefined) => void;
  markSynced: () => void;
  getPendingSync: () => boolean;
}

function getStoredLanguage(): AppLanguage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'id') return stored;
  } catch { /* noop */ }
  return 'id';
}

function getStoredPendingSync(): boolean {
  try {
    return localStorage.getItem(PENDING_SYNC_KEY) === 'true';
  } catch { /* noop */ }
  return false;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: getStoredLanguage(),
  pendingSync: getStoredPendingSync(),

  /**
   * Set the language preference.
   * Always saves to localStorage immediately (works offline).
   * Marks a pending sync so it gets pushed to the server when online + authenticated.
   */
  setLanguage: (lang: AppLanguage) => {
    localStorage.setItem(STORAGE_KEY, lang);
    localStorage.setItem(PENDING_SYNC_KEY, 'true');
    set({ language: lang, pendingSync: true });
  },

  /**
   * Called after login / fetchMe to reconcile server language with local preference.
   * If there's a pending local change, keep the local version (it will sync to server).
   * If no pending change, adopt the server's language.
   */
  syncFromUser: (userLang: string | undefined) => {
    const { pendingSync } = get();
    if (pendingSync) {
      // Local change is newer — keep it, don't overwrite from server
      return;
    }
    const lang: AppLanguage = (userLang === 'en' || userLang === 'id') ? userLang : 'id';
    localStorage.setItem(STORAGE_KEY, lang);
    set({ language: lang });
  },

  markSynced: () => {
    localStorage.removeItem(PENDING_SYNC_KEY);
    set({ pendingSync: false });
  },

  getPendingSync: () => get().pendingSync,
}));
