import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  Loader2,
  Play,
  Sparkles,
  Edit2,
  Trash2,
  Globe,
  Lock,
  AlertCircle,
  Copy,
  Users,
  Layers
} from 'lucide-react';
import api, { getFullImageUrl } from '../lib/api';
import toast from 'react-hot-toast';
import type { Deck, Card } from '../types';
import CardModal from '../components/cards/CardModal';
import DeckModal from '../components/decks/DeckModal';
import AIGenerateCardsModal from '../components/cards/AIGenerateCardsModal';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { Latex } from '../components/common/Latex';
import SubscriptionPromoModal from '../components/subscription/SubscriptionPromoModal';
import { useTranslation } from '../hooks/useTranslation';

export default function DeckDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | undefined>();
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [isAIGenerateModalOpen, setIsAIGenerateModalOpen] = useState(false);
  const { addGeneration, removeGeneration } = useUIStore();
  const { user, fetchMe } = useAuthStore();
  const { data: deck, isLoading } = useQuery<Deck & { cards: Card[] }>({
    queryKey: ['deck', id],
    queryFn: async () => {
      const res = await api.get(`/decks/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const isOwner = user?.id === deck?.user_id;

  useQuery<any>({
    queryKey: ['deck-stats', id],
    queryFn: async () => {
      const res = await api.get(`/stats/deck/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const createCardMutation = useMutation({
    mutationFn: (newCard: any) => api.post(`/decks/${id}/cards`, newCard),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deck', id] });
      queryClient.invalidateQueries({ queryKey: ['deck-stats', id] });
      toast.success(t.deckDetails.cardAdded);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to add card');
    },
  });

  const updateCardMutation = useMutation({
    mutationFn: ({ cardId, data }: { cardId: number; data: any }) => api.put(`/cards/${cardId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deck', id] });
      queryClient.invalidateQueries({ queryKey: ['deck-stats', id] });
      toast.success(t.deckDetails.cardUpdated);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to update card');
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: (cardId: number) => api.delete(`/cards/${cardId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deck', id] });
      queryClient.invalidateQueries({ queryKey: ['deck-stats', id] });
      toast.success(t.deckDetails.cardRemoved);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to remove card');
    },
  });

  const handleSaveCard = async (data: any) => {
    if (editingCard) {
      await updateCardMutation.mutateAsync({ cardId: editingCard.id, data });
    } else {
      await createCardMutation.mutateAsync(data);
    }
  };

  const handleDeleteCard = (cardId: number) => {
    if (window.confirm(t.deckDetails.removeCardConfirm)) {
      deleteCardMutation.mutate(cardId);
    }
  };

  const openEditModal = (card: Card) => {
    setEditingCard(card);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingCard(undefined);
    setIsModalOpen(true);
  };

  const updateDeckMutation = useMutation({
    mutationFn: (data: any) => api.put(`/decks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deck', id] });
      toast.success(t.decks.deckUpdated);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to update deck');
    },
  });

  const deleteDeckMutation = useMutation({
    mutationFn: () => api.delete(`/decks/${id}`),
    onSuccess: () => {
      toast.success(t.decks.deckDeleted);
      navigate('/decks');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to delete deck');
    },
  });

  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);

  const handleUpdateDeck = async (data: any) => {
    await updateDeckMutation.mutateAsync(data);
  };

  const handleDeleteDeck = () => {
    if (window.confirm(t.deckDetails.deleteConfirm)) {
      deleteDeckMutation.mutate();
    }
  };

  const cloneMutation = useMutation({
    mutationFn: (deckId: number) => api.post(`/library/${deckId}/clone`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      toast.success(t.library.copySuccess);
      navigate('/decks');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to copy deck');
    },
  });

  const handleClone = () => {
    if (window.confirm(t.library.copyConfirm.replace('{title}', deck?.title || ''))) {
      cloneMutation.mutate(deck!.id);
    }
  };

  const handleAIGenerate = async (data: { text: string; count: number; file: File | null; language: string }) => {
    const taskId = `ai-gen-${Date.now()}`;
    addGeneration({
      id: taskId,
      title: `Generating cards for ${deck?.title}`,
      status: 'loading'
    });

    try {
      const formData = new FormData();
      if (data.file) {
        formData.append('file', data.file);
      } else {
        formData.append('text', data.text);
      }
      formData.append('count', data.count.toString());
      formData.append('deck_id', id!);
      formData.append('language', data.language);

      toast.success(t.decks.aiStarted);

      await api.post('/ai/generate-cards', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      queryClient.invalidateQueries({ queryKey: ['deck', id] });
      queryClient.invalidateQueries({ queryKey: ['deck-stats', id] });
      fetchMe(); // Refresh tokens
      toast.success(t.decks.aiCardsAdded);
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setIsPromoModalOpen(true);
      } else {
        toast.error(err?.response?.data?.error || t.decks.aiFailed);
      }
    } finally {
      removeGeneration(taskId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-feather-green animate-spin mb-4" />
        <p className="font-black text-gray-400 uppercase tracking-widest">{t.deckDetails.loading}</p>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-black text-gray-700">{t.deckDetails.notFound}</h2>
        <Link to="/decks" className="text-feather-green font-bold hover:underline mt-4 block">
          {t.deckDetails.backToDecks}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-20">

      {deck.is_ai_generated && (
        <div className="bg-purple-50 border-2 border-purple-100 rounded-3xl p-4 flex items-center gap-4 text-purple-700 animate-in slide-in-from-top-4 duration-500">
          <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 fill-current" />
          </div>
          <div className="flex-1">
            <p className="font-black text-sm uppercase tracking-tight">{t.deckDetails.aiContent}</p>
            <p className="text-xs font-bold opacity-80 leading-snug">{t.deckDetails.aiAlert}</p>
          </div>
          <AlertCircle className="w-5 h-5 text-purple-300 hidden md:block" />
        </div>
      )}

      {/* Header */}
      <section className="flex flex-col gap-4 md:gap-6">
        {/* Row 1: Back Button + Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/decks')}
            className="p-2.5 md:p-3 hover:bg-gray-100 rounded-2xl transition-colors text-gray-400 shrink-0"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          {isOwner && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDeckModalOpen(true)}
                className="p-2.5 md:p-3 bg-white border-2 border-gray-100 rounded-2xl text-gold hover:bg-amber-50 hover:border-gold transition-all shadow-sm"
                title={t.common.edit}
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={handleDeleteDeck}
                className="p-2.5 md:p-3 bg-white border-2 border-gray-100 rounded-2xl text-danger-red hover:bg-red-50 hover:border-danger-red transition-all shadow-sm"
                title={t.common.delete}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Row 2 & 3: Title & Metadata */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-black text-gray-700 tracking-tight uppercase leading-tight">
            {deck.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            {deck.tags?.map(tag => (
              <span key={tag} className="text-[10px] md:text-xs font-black text-feather-green uppercase tracking-wider">#{tag}</span>
            ))}
            <div className="flex shrink-0">
              {deck.is_public ? (
                <span className="flex items-center gap-1 text-[10px] font-black text-feather-green uppercase bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                  <Globe className="w-3 h-3" /> {t.deckDetails.public}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase bg-gray-100 px-2 py-1 rounded-lg border border-gray-200">
                  <Lock className="w-3 h-3" /> {t.deckDetails.private}
                </span>
              )}
            </div>
          </div>
        </div>

        {deck.description && (
          <p className="text-gray-500 font-bold max-w-2xl">{deck.description}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isOwner && (
            <Link
              to={`/decks/${deck.id}/study${deck.due_count === 0 ? '?mode=sandbox' : ''}`}
              className="btn-primary md:col-span-2 py-4 text-lg flex items-center justify-center gap-3"
            >
              <Play className="w-6 h-6 fill-current" />
              {deck.due_count === 0 ? t.stats.reStudy : t.deckDetails.startStudying}
            </Link>
          )}
          {isOwner && (
            <button
              onClick={() => setIsAIGenerateModalOpen(true)}
              className="btn-chunky py-4 text-lg flex items-center justify-center gap-3 bg-purple-600 border-purple-800 text-white hover:bg-purple-500 border-b-4 active:border-b-0"
            >
              <Sparkles className="w-6 h-6 fill-current" />
              {t.deckDetails.aiGenerate}
            </button>
          )}
          {!isOwner && (
            <button
              onClick={handleClone}
              disabled={cloneMutation.isPending}
              className="btn-primary w-full py-4 text-lg md:col-span-3 flex items-center justify-center gap-3"
            >
              {cloneMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Copy className="w-6 h-6" />}
              {t.deckDetails.copyToDecks}
            </button>
          )}
        </div>
      </section>

      {/* General Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mt-2 md:mt-4">
        <div className="bg-white border-2 border-gray-100 rounded-4xl p-5 md:p-8 text-center shadow-sm hover:border-feather-green transition-colors duration-300">
          <p className="text-[11px] md:text-sm font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
            <Users className="w-3 h-3 md:w-4 md:h-4" /> {t.deckDetails.creator}
          </p>
          <p className="text-xl md:text-2xl font-black text-gray-700 leading-none truncate px-2">
            {deck.author?.username || t.common.all.replace('All', 'You')}
          </p>
        </div>
        <div className="bg-white border-2 border-gray-100 rounded-4xl p-5 md:p-8 text-center shadow-sm hover:border-purple-400 transition-colors duration-300">
          <p className="text-[11px] md:text-sm font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
            <Copy className="w-3 h-3 md:w-4 md:h-4" /> {t.deckDetails.copies}
          </p>
          <p className="text-3xl md:text-5xl font-black text-purple-400 leading-none">{deck.clone_count || 0}</p>
        </div>
        <div className="bg-white border-2 border-gray-100 rounded-4xl p-5 md:p-8 text-center shadow-sm hover:border-orange-400 transition-colors duration-300">
          <p className="text-[11px] md:text-sm font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
            <Layers className="w-3 h-3 md:w-4 md:h-4" /> {t.deckDetails.cards}
          </p>
          <p className="text-3xl md:text-5xl font-black text-orange-400 leading-none">{deck.cards?.length || 0}</p>
        </div>
        <div className="bg-white border-2 border-gray-100 rounded-4xl p-5 md:p-8 text-center shadow-sm hover:border-feather-green transition-colors duration-300">
          <p className="text-[11px] md:text-sm font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
            <Globe className="w-3 h-3 md:w-4 md:h-4" /> {t.deckDetails.visibility}
          </p>
          <p className="text-[10px] md:text-xs font-black text-feather-green leading-none uppercase tracking-widest mt-2 bg-green-50 py-1 rounded-lg border border-green-100 inline-block px-3">
            {deck.is_public ? t.deckDetails.public : t.deckDetails.private}
          </p>
        </div>
      </section>

      {/* Card Controls */}
      <section className={`flex justify-between items-center ${isOwner ? 'border-t-2 border-gray-100 pt-6' : 'pt-2'}`}>
        {(isOwner || (deck.cards && deck.cards.length > 0)) && (
          <div className="hidden md:block">
            <h2 className="text-xl font-black text-gray-700 tracking-tight uppercase">{t.deckDetails.deckContent}</h2>
            <p className="text-sm font-bold text-gray-400">{t.deckDetails.cardsInCollection.replace('{count}', (deck.cards?.length || 0).toString())}</p>
          </div>
        )}
        {isOwner && (
          <button
            onClick={openCreateModal}
            className="btn-primary w-full md:w-auto px-8 py-3 flex items-center justify-center gap-2 text-base"
          >
            <Plus className="w-6 h-6" />
            {t.deckDetails.addNewCard}
          </button>
        )}
      </section>

      {/* Card List */}
      <section className="space-y-4">
        {deck.cards && deck.cards.length > 0 ? (
          <div className="space-y-3">
            {deck.cards.map((card) => (
              <div
                key={card.id}
                className="card-duo p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
              >
                <div className="flex-1 flex flex-col md:flex-row gap-6 md:items-center w-full">
                  {/* Front Side */}
                  <div className="flex-1 select-text">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{t.deckDetails.front}</p>
                    <div className="flex items-start gap-3">
                      {card.front_image_url && (
                        <img src={getFullImageUrl(card.front_image_url)} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0" />
                      )}
                      <div className="font-bold text-gray-700">
                        <Latex text={card.front} />
                      </div>
                      {card.is_ai_created && (
                        <span className="flex items-center gap-0.5 bg-purple-50 text-purple-500 text-[8px] font-black uppercase px-1.5 py-0.5 rounded border border-purple-100 shrink-0">
                          <Sparkles className="w-2 h-2 fill-current" /> AI
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="hidden md:block w-px h-8 bg-gray-200 mx-2" />

                  {/* Back Side */}
                  <div className="flex-1 select-text">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{t.deckDetails.back}</p>
                    <div className="flex items-start gap-3">
                      {card.back_image_url && (
                        <img src={getFullImageUrl(card.back_image_url)} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0" />
                      )}
                      <div className="font-bold text-feather-green">
                        <Latex text={card.back} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-auto">
                  {isOwner && (
                    <>
                      <button
                        onClick={() => openEditModal(card)}
                        className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-feather-green transition-colors"
                        title={t.common.edit}
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-red-500 transition-colors"
                        title={t.common.delete}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-3xl border-4 border-dashed border-gray-200">
            <h2 className="text-xl font-black text-gray-400 uppercase">{t.deckDetails.emptyDeck}</h2>
            <button
              onClick={openCreateModal}
              className="mt-4 text-feather-green font-black hover:underline underline-offset-4"
            >
              {t.deckDetails.addFirstCard}
            </button>
          </div>
        )}
      </section>

      <CardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveCard}
        initialData={editingCard}
        title={editingCard ? t.deckDetails.editCard : t.deckDetails.addCard}
      />

      <DeckModal
        isOpen={isDeckModalOpen}
        onClose={() => setIsDeckModalOpen(false)}
        onSubmit={handleUpdateDeck}
        initialData={deck}
        title={t.deckDetails.editDeckDetails}
      />

      <AIGenerateCardsModal
        isOpen={isAIGenerateModalOpen}
        onClose={() => setIsAIGenerateModalOpen(false)}
        onSubmit={handleAIGenerate}
        title={t.deckDetails.aiGenerateCards}
      />

      <SubscriptionPromoModal
        isOpen={isPromoModalOpen}
        onClose={() => setIsPromoModalOpen(false)}
        reason={t.deckDetails.dailyAiLimit}
      />
    </div>
  );
}
