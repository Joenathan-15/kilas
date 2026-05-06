import type { Deck, Card } from '../types';

const DB_NAME = 'kilas-offline';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('decks')) {
        db.createObjectStore('decks', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cards')) {
        const cardStore = db.createObjectStore('cards', { keyPath: 'id' });
        cardStore.createIndex('deckId', 'deck_id', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Full-replace user's decks in IndexedDB.
 * Clears all old decks first so deletions are reflected offline.
 */
export async function saveDecksOffline(decks: Deck[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('decks', 'readwrite');
    const store = tx.objectStore('decks');

    // Clear all existing decks first — handles deletions
    store.clear();

    // Re-add all current decks
    for (const deck of decks) {
      store.put(deck);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  } catch (err) {
    console.warn('[Offline] Failed to save decks:', err);
  }
}

/** Save a deck's cards for offline study */
export async function saveDeckCardsOffline(deckId: number, cards: Card[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('cards', 'readwrite');
    const store = tx.objectStore('cards');

    // Remove old cards for this deck first
    const index = store.index('deckId');
    const range = IDBKeyRange.only(deckId);
    const cursorReq = index.openCursor(range);

    await new Promise<void>((resolve, reject) => {
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      cursorReq.onerror = () => reject(cursorReq.error);
    });

    // Insert fresh cards
    for (const card of cards) {
      store.put(card);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  } catch (err) {
    console.warn('[Offline] Failed to save cards:', err);
  }
}

/** Get all cached decks */
export async function getOfflineDecks(): Promise<Deck[]> {
  try {
    const db = await openDB();
    const tx = db.transaction('decks', 'readonly');
    const store = tx.objectStore('decks');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => { db.close(); resolve(request.result); };
      request.onerror = () => { db.close(); reject(request.error); };
    });
  } catch (err) {
    console.warn('[Offline] Failed to get decks:', err);
    return [];
  }
}

/** Get cached cards for a specific deck */
export async function getOfflineDeckCards(deckId: number): Promise<Card[]> {
  try {
    const db = await openDB();
    const tx = db.transaction('cards', 'readonly');
    const store = tx.objectStore('cards');
    const index = store.index('deckId');
    const request = index.getAll(IDBKeyRange.only(deckId));

    return new Promise((resolve, reject) => {
      request.onsuccess = () => { db.close(); resolve(request.result); };
      request.onerror = () => { db.close(); reject(request.error); };
    });
  } catch (err) {
    console.warn('[Offline] Failed to get cards:', err);
    return [];
  }
}

/** Check if a deck has cached cards */
export async function hasOfflineCards(deckId: number): Promise<boolean> {
  const cards = await getOfflineDeckCards(deckId);
  return cards.length > 0;
}

/** Remove cards for decks that no longer exist */
export async function cleanOrphanedCards(activeDeckIds: number[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('cards', 'readwrite');
    const store = tx.objectStore('cards');
    const request = store.getAll();

    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => {
        const allCards: Card[] = request.result;
        for (const card of allCards) {
          if (!activeDeckIds.includes(card.deck_id)) {
            store.delete(card.id);
          }
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  } catch (err) {
    console.warn('[Offline] Failed to clean orphaned cards:', err);
  }
}

/** Clear all offline data (called on logout) */
export async function clearOfflineData(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(['decks', 'cards'], 'readwrite');
    tx.objectStore('decks').clear();
    tx.objectStore('cards').clear();

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  } catch (err) {
    console.warn('[Offline] Failed to clear data:', err);
  }
}
