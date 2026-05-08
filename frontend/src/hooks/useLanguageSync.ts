import { useEffect, useRef } from 'react';
import { useLanguageStore } from '../stores/languageStore';
import { useAuthStore } from '../stores/authStore';
import { useOnlineStatus } from './useOnlineStatus';
import api from '../lib/api';

/**
 * Syncs the local language preference to the server when:
 * - The user is authenticated
 * - The app is online
 * - There is a pending language change
 *
 * Also reconciles server -> local language on login/fetchMe.
 *
 * Mount this once in the App root.
 */
export function useLanguageSync() {
  const { user, isAuthenticated } = useAuthStore();
  const { language, pendingSync, markSynced, syncFromUser } = useLanguageStore();
  const { isOnline } = useOnlineStatus();
  const hasSyncedFromUser = useRef(false);

  // When user data arrives (login, fetchMe), reconcile server language -> local
  useEffect(() => {
    if (user && !hasSyncedFromUser.current) {
      syncFromUser(user.language);
      hasSyncedFromUser.current = true;
    }
    if (!user) {
      hasSyncedFromUser.current = false;
    }
  }, [user, syncFromUser]);

  // When online + authenticated + pending sync, push local language to server
  useEffect(() => {
    if (!isOnline || !isAuthenticated || !pendingSync || !user) return;

    const syncLanguage = async () => {
      try {
        await api.put('/auth/profile', {
          username: user.username,
          avatar_url: user.avatar_url,
          language,
        });
        // Update the user object in auth store to reflect the new language
        useAuthStore.setState({
          user: { ...user, language },
        });
        markSynced();
        console.log('[LanguageSync] Synced language to server:', language);
      } catch (err) {
        console.warn('[LanguageSync] Failed to sync language, will retry when online:', err);
        // Keep pendingSync = true so it retries next time
      }
    };

    syncLanguage();
  }, [isOnline, isAuthenticated, pendingSync, language, user, markSynced]);
}
