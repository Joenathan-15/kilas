import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Plus, Search, Loader2, Layers, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Deck } from '../types';
import DeckCard from '../components/decks/DeckCard';
import DeckModal from '../components/decks/DeckModal';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { useTranslation } from '../hooks/useTranslation';
import { usePageTitle } from '../hooks/usePageTitle';
import SubscriptionPromoModal from '../components/subscription/SubscriptionPromoModal';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { saveDecksOffline, getOfflineDecks, saveDeckCardsOffline, cleanOrphanedCards } from '../lib/offlineStorage';

export default function DecksPage() {
  const queryClient = useQueryClient();
  const { fetchMe } = useAuthStore();
  const { t } = useTranslation();
  const { addGeneration, removeGeneration } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | undefined>();
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [offlineDecks, setOfflineDecks] = useState<Deck[]>([]);
  const { isOnline } = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);

  usePageTitle(t.nav.myDecks);

  const { data: decksData, isLoading } = useQuery<{ data: Deck[] }>({
    queryKey: ['decks'],
    queryFn: async () => {
      const res = await api.get('/decks');
      return res.data;
    },
    enabled: isOnline,
  });

  // Auto-sync decks + cards to IndexedDB when fetched online
  useEffect(() => {
    if (decksData?.data && isOnline) {
      const decks = decksData.data;
      // Save decks (full-replace, handles deletions)
      saveDecksOffline(decks);
      // Clean up cards from deleted decks
      cleanOrphanedCards(decks.map(d => d.id));
      
      // Pre-cache cards for ALL decks in the background
      const syncCards = async () => {
        setIsSyncing(true);
        let successCount = 0;
        
        for (const deck of decks) {
          try {
            const res = await api.get(`/decks/${deck.id}/cards`);
            const cards = res.data?.data || res.data || [];
            if (Array.isArray(cards) && cards.length > 0) {
              await saveDeckCardsOffline(deck.id, cards);
              successCount++;
            }
          } catch {
            // Silently skip
          }
        }
        
        setIsSyncing(false);
        if (successCount > 0) {
          // Optional: toast or status indicator
        }
      };
      
      syncCards();
    }
  }, [decksData, isOnline]);

  // Load offline decks when offline
  useEffect(() => {
    if (!isOnline) {
      getOfflineDecks().then(setOfflineDecks);
    }
  }, [isOnline]);

  const createMutation = useMutation({
    mutationFn: (newDeck: any) => api.post('/decks', newDeck),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      toast.success(t.decks.deckCreated);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to create deck');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.put(`/decks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      toast.success(t.decks.deckUpdated);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to update deck');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/decks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      toast.success(t.decks.deckDeleted);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to delete deck');
    },
  });

  const handleCreateDeck = async (data: any, type: 'manual' | 'ai') => {
    if (type === 'ai') {
      // Fire-and-forget: modal already closed, run in background
      const formData = new FormData();
      if (data.title) formData.append('title', data.title);
      formData.append('count', data.count.toString());
      if (data.file) {
        formData.append('file', data.file);
      }

      const generationId = Math.random().toString(36).substring(7);
      const generationTitle = data.title || 'Untitled Deck';
      addGeneration({ id: generationId, title: generationTitle });

      const aiPromise = api.post('/ai/generate-cards', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['decks'] });
        fetchMe(); // Refresh user data to update token count
      }).catch((err) => {
        if (err?.response?.status === 429) {
          setIsPromoModalOpen(true);
        }
        throw err;
      }).finally(() => {
        removeGeneration(generationId);
      });

      toast.promise(aiPromise, {
        loading: t.decks.aiGenerating,
        success: t.decks.aiSuccess,
        error: (err) => err?.response?.data?.error || 'AI generation failed. Please try again.',
      });
      // Don't await — let it run in the background
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleUpdateDeck = async (data: any) => {
    if (editingDeck) {
      await updateMutation.mutateAsync({ id: editingDeck.id, data });
    }
  };

  const handleDeleteDeck = (id: number) => {
    if (window.confirm(t.decks.deleteConfirm)) {
      deleteMutation.mutate(id);
    }
  };

  const openEditModal = (deck: Deck) => {
    setEditingDeck(deck);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingDeck(undefined);
    setIsModalOpen(true);
  };

  const activeDeckList = isOnline ? decksData?.data : offlineDecks;
  const filteredDecks = activeDeckList?.filter((deck) =>
    deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deck.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-700 tracking-tight flex items-center gap-3">
            <Layers className="w-8 h-8 text-feather-green" />
            {t.decks.title}
            {!isOnline && (
              <span className="ml-2 text-xs font-black bg-amber-100 text-amber-600 px-3 py-1 rounded-full flex items-center gap-1.5">
                <WifiOff className="w-3 h-3" />
                {t.offline.offlineMode}
              </span>
            )}
          </h1>
          <p className="text-gray-400 font-bold">{t.decks.subtitle}</p>
          {isOnline && isSyncing && (
            <div className="flex items-center gap-2 mt-1 text-blue-500 animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-widest">{t.offline.syncingOffline}</span>
            </div>
          )}
        </div>

        {isOnline && (
          <button
            onClick={openCreateModal}
            className="btn-primary py-3 px-6 flex items-center justify-center gap-2"
          >
            <Plus className="w-6 h-6" />
            {t.decks.createNew}
          </button>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-4 bg-surface border-2 border-gray-200 rounded-3xl focus:border-sky-blue focus:ring-0 transition-all font-bold text-gray-700 placeholder-gray-400 outline-none shadow-sm"
          placeholder={t.decks.searchPlaceholder}
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-sky-blue animate-spin mb-4" />
          <p className="font-black text-gray-400 uppercase tracking-widest">{t.decks.loadingDecks}</p>
        </div>
      ) : filteredDecks && filteredDecks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDecks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onEdit={openEditModal}
              onDelete={handleDeleteDeck}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border-4 border-dashed border-gray-200 text-center px-4">
          <Layers className="w-20 h-20 text-gray-200 mb-6" />
          <h2 className="text-2xl font-black text-gray-400 uppercase tracking-tight">{t.decks.noDecksFound}</h2>
          <p className="text-gray-400 font-bold mt-2">{t.decks.trySearch}</p>
          <button
            onClick={openCreateModal}
            className="mt-8 text-sky-blue font-black hover:underline underline-offset-4"
          >
            + {t.decks.createNew}
          </button>
        </div>
      )}

      <DeckModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={editingDeck ? handleUpdateDeck : handleCreateDeck}
        initialData={editingDeck}
        title={editingDeck ? t.decks.editDeck : t.decks.createDeck}
      />

      <SubscriptionPromoModal
        isOpen={isPromoModalOpen}
        onClose={() => setIsPromoModalOpen(false)}
        reason="Daily AI Limit Reached! 🚀"
      />
    </div>
  );
}
