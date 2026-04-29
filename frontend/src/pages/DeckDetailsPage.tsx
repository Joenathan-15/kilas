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

export default function DeckDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | undefined>();
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

  const { data: stats } = useQuery<any>({
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
      toast.success('Card added! 🗴');
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
      toast.success('Card updated! ✨');
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
      toast.success('Card removed');
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
    if (window.confirm('Remove this card?')) {
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
      toast.success('Deck updated! ✨');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to update deck');
    },
  });

  const deleteDeckMutation = useMutation({
    mutationFn: () => api.delete(`/decks/${id}`),
    onSuccess: () => {
      toast.success('Deck deleted');
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
    if (window.confirm('Delete this entire deck and all its cards? This cannot be undone!')) {
      deleteDeckMutation.mutate();
    }
  };

  const cloneMutation = useMutation({
    mutationFn: (deckId: number) => api.post(`/library/${deckId}/clone`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      toast.success('Deck copied to your collection! 📚');
      navigate('/decks');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to copy deck');
    },
  });

  const handleClone = () => {
    if (window.confirm(`Copy "${deck?.title}" to your decks? All cards will be included.`)) {
      cloneMutation.mutate(deck!.id);
    }
  };

  const handleAIGenerate = async (data: { text: string; count: number; file: File | null }) => {
    const taskId = `ai-gen-${Date.now()}`;
    addGeneration({
      id: taskId,
      title: `Generating cards for ${deck.title}`,
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

      toast.success('AI generation started in background... 🧠');
      
      await api.post('/ai/generate-cards', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      queryClient.invalidateQueries({ queryKey: ['deck', id] });
      queryClient.invalidateQueries({ queryKey: ['deck-stats', id] });
      fetchMe(); // Refresh tokens
      toast.success('AI cards added! ✨');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'AI generation failed');
    } finally {
      removeGeneration(taskId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-sky-blue animate-spin mb-4" />
        <p className="font-black text-gray-400 uppercase tracking-widest">Loading Deck Details...</p>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-black text-gray-700">Deck not found</h2>
        <Link to="/decks" className="text-sky-blue font-bold hover:underline mt-4 block">
          Back to my decks
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {deck.is_ai_generated && (
        <div className="bg-purple-50 border-2 border-purple-100 rounded-3xl p-4 flex items-center gap-4 text-purple-700 animate-in slide-in-from-top-4 duration-500">
          <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 fill-current" />
          </div>
          <div className="flex-1">
            <p className="font-black text-sm uppercase tracking-tight">AI Generated Content</p>
            <p className="text-xs font-bold opacity-80 leading-snug">This deck was generated using AI. Please review the cards carefully as AI can sometimes make mistakes or provide inaccurate information.</p>
          </div>
          <AlertCircle className="w-5 h-5 text-purple-300 hidden md:block" />
        </div>
      )}

      {/* Header */}
      <section className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => navigate('/decks')}
              className="p-3 hover:bg-gray-100 rounded-2xl transition-colors text-gray-400"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-black text-gray-700 tracking-tight uppercase leading-tight">{deck.title}</h1>
                {deck.is_public ? (
                  <span className="flex items-center gap-1 text-[10px] font-black text-sky-blue uppercase bg-sky-50 px-2 py-1 rounded-lg">
                    <Globe className="w-3 h-3" /> Public
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase bg-gray-100 px-2 py-1 rounded-lg">
                    <Lock className="w-3 h-3" /> Private
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {deck.tags?.map(tag => (
                  <span key={tag} className="text-xs font-black text-sky-blue uppercase tracking-wider">#{tag}</span>
                ))}
              </div>
            </div>
          </div>
          {isOwner && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDeckModalOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-sky-blue transition-colors"
                title="Edit Deck"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={handleDeleteDeck}
                className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-red-500 transition-colors"
                title="Delete Deck"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {deck.description && (
          <p className="text-gray-500 font-bold max-w-2xl">{deck.description}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isOwner && (
            <Link 
              to={`/decks/${deck.id}/study`}
              className="btn-primary md:col-span-2 py-4 text-lg flex items-center justify-center gap-3"
            >
              <Play className="w-6 h-6 fill-current" />
              START STUDYING
            </Link>
          )}
          {isOwner && (
            <button 
              onClick={() => setIsAIGenerateModalOpen(true)}
              className="btn-secondary py-4 text-lg flex items-center justify-center gap-3 border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              <Sparkles className="w-6 h-6" />
              AI GENERATE
            </button>
          )}
          {!isOwner && (
            <button 
              onClick={handleClone}
              disabled={cloneMutation.isPending}
              className="w-full py-4 bg-purple-600 border-b-4 border-purple-800 text-white font-black rounded-2xl hover:bg-purple-500 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-3 text-lg md:col-span-3"
            >
              {cloneMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Copy className="w-6 h-6" />}
              COPY TO MY DECKS
            </button>
          )}
        </div>
      </section>

      {/* General Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <div className="bg-white border-2 border-gray-100 rounded-[2rem] p-5 md:p-8 text-center shadow-sm hover:border-sky-blue transition-colors duration-300">
          <p className="text-[11px] md:text-sm font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
            <Users className="w-3 h-3 md:w-4 md:h-4" /> Creator
          </p>
          <p className="text-xl md:text-2xl font-black text-gray-700 leading-none truncate px-2">
            {deck.author?.username || 'You'}
          </p>
        </div>
        <div className="bg-white border-2 border-gray-100 rounded-[2rem] p-5 md:p-8 text-center shadow-sm hover:border-purple-400 transition-colors duration-300">
          <p className="text-[11px] md:text-sm font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
            <Copy className="w-3 h-3 md:w-4 md:h-4" /> Copies
          </p>
          <p className="text-3xl md:text-5xl font-black text-purple-400 leading-none">{deck.clone_count || 0}</p>
        </div>
        <div className="bg-white border-2 border-gray-100 rounded-[2rem] p-5 md:p-8 text-center shadow-sm hover:border-orange-400 transition-colors duration-300">
          <p className="text-[11px] md:text-sm font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
            <Layers className="w-3 h-3 md:w-4 md:h-4" /> Cards
          </p>
          <p className="text-3xl md:text-5xl font-black text-orange-400 leading-none">{deck.cards?.length || 0}</p>
        </div>
        <div className="bg-white border-2 border-gray-100 rounded-[2rem] p-5 md:p-8 text-center shadow-sm hover:border-feather-green transition-colors duration-300">
          <p className="text-[11px] md:text-sm font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
            <Globe className="w-3 h-3 md:w-4 md:h-4" /> Visibility
          </p>
          <p className="text-[10px] md:text-xs font-black text-feather-green leading-none uppercase tracking-widest mt-2 bg-green-50 py-1 rounded-lg border border-green-100 inline-block px-3">
            {deck.is_public ? 'Public' : 'Private'}
          </p>
        </div>
      </section>

      {/* Card Controls */}
      <section className="flex justify-between items-center border-t-2 border-gray-100 pt-8">
        <div className="hidden md:block">
          <h2 className="text-xl font-black text-gray-700 tracking-tight uppercase">Deck Content</h2>
          <p className="text-sm font-bold text-gray-400">{deck.cards?.length || 0} cards in this collection</p>
        </div>
        {isOwner && (
          <button
            onClick={openCreateModal}
            className="btn-primary w-full md:w-auto px-8 py-3 flex items-center justify-center gap-2 text-base"
          >
            <Plus className="w-6 h-6" />
            ADD NEW CARD
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
                  <div className="flex-1">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Front</p>
                    <div className="flex items-start gap-3">
                      {card.front_image_url && (
                        <img src={getFullImageUrl(card.front_image_url)} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                      )}
                      <p className="font-bold text-gray-700">{card.front}</p>
                      {card.is_ai_created && (
                        <span className="flex items-center gap-0.5 bg-purple-50 text-purple-500 text-[8px] font-black uppercase px-1.5 py-0.5 rounded border border-purple-100 shrink-0">
                          <Sparkles className="w-2 h-2 fill-current" /> AI
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="hidden md:block w-px h-8 bg-gray-200 mx-2" />

                  <div className="flex-1">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Back</p>
                    <div className="flex items-start gap-3">
                      {card.back_image_url && (
                        <img src={getFullImageUrl(card.back_image_url)} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                      )}
                      <p className="font-bold text-sky-blue">{card.back}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  {isOwner && (
                    <>
                      <button
                        onClick={() => openEditModal(card)}
                        className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-sky-blue transition-colors"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-red-500 transition-colors"
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
            <h2 className="text-xl font-black text-gray-400 uppercase">This deck is empty</h2>
            <button
              onClick={openCreateModal}
              className="mt-4 text-sky-blue font-black hover:underline underline-offset-4"
            >
              + Add your first card
            </button>
          </div>
        )}
      </section>

      <CardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveCard}
        initialData={editingCard}
        title={editingCard ? 'Edit Card' : 'Add New Card'}
      />

      <DeckModal
        isOpen={isDeckModalOpen}
        onClose={() => setIsDeckModalOpen(false)}
        onSubmit={handleUpdateDeck}
        initialData={deck}
        title="Edit Deck Details"
      />

      <AIGenerateCardsModal
        isOpen={isAIGenerateModalOpen}
        onClose={() => setIsAIGenerateModalOpen(false)}
        onSubmit={handleAIGenerate}
        title="AI Generate Cards"
      />
    </div>
  );
}
