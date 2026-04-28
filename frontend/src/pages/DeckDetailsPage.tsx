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
  Lock
} from 'lucide-react';
import api, { getFullImageUrl } from '../lib/api';
import toast from 'react-hot-toast';
import type { Deck, Card } from '../types';
import CardModal from '../components/cards/CardModal';
import DeckModal from '../components/decks/DeckModal';

export default function DeckDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | undefined>();

  const { data: deck, isLoading } = useQuery<Deck & { cards: Card[] }>({
    queryKey: ['deck', id],
    queryFn: async () => {
      const res = await api.get(`/decks/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

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

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsDeckModalOpen(true)}
              className="p-3 hover:bg-sky-50 rounded-2xl text-gray-400 hover:text-sky-blue transition-all border-2 border-transparent hover:border-sky-100"
              title="Edit Deck"
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button 
              onClick={handleDeleteDeck}
              className="p-3 hover:bg-red-50 rounded-2xl text-gray-400 hover:text-danger-red transition-all border-2 border-transparent hover:border-red-100"
              title="Delete Deck"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {deck.description && (
          <p className="text-gray-500 font-bold max-w-2xl">{deck.description}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            to={`/decks/${deck.id}/study`}
            className="btn-primary md:col-span-2 py-4 text-lg flex items-center justify-center gap-3"
          >
            <Play className="w-6 h-6 fill-current" />
            START STUDYING
          </Link>
          <button 
            className="btn-secondary py-4 text-lg flex items-center justify-center gap-3 border-purple-200 text-purple-600 hover:bg-purple-50"
          >
            <Sparkles className="w-6 h-6" />
            AI GENERATE
          </button>
        </div>
      </section>

      {/* Quick Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <div className="bg-white border-2 border-gray-100 rounded-[2rem] p-5 md:p-8 text-center shadow-sm hover:border-sky-blue transition-colors duration-300">
          <p className="text-[11px] md:text-sm font-black text-gray-400 uppercase tracking-widest mb-2">Due Today</p>
          <p className="text-3xl md:text-5xl font-black text-sky-blue leading-none">{stats?.due_today || 0}</p>
        </div>
        <div className="bg-white border-2 border-gray-100 rounded-[2rem] p-5 md:p-8 text-center shadow-sm hover:border-feather-green transition-colors duration-300">
          <p className="text-[11px] md:text-sm font-black text-gray-400 uppercase tracking-widest mb-2">New Cards</p>
          <p className="text-3xl md:text-5xl font-black text-feather-green leading-none">{stats?.new_cards || 0}</p>
        </div>
        <div className="bg-white border-2 border-gray-100 rounded-[2rem] p-5 md:p-8 text-center shadow-sm hover:border-orange-400 transition-colors duration-300">
          <p className="text-[11px] md:text-sm font-black text-gray-400 uppercase tracking-widest mb-2">Learning</p>
          <p className="text-3xl md:text-5xl font-black text-orange-400 leading-none">{stats?.learning || 0}</p>
        </div>
        <div className="bg-white border-2 border-gray-100 rounded-[2rem] p-5 md:p-8 text-center shadow-sm hover:border-yellow-500 transition-colors duration-300">
          <p className="text-[11px] md:text-sm font-black text-gray-400 uppercase tracking-widest mb-2">Mastered</p>
          <p className="text-3xl md:text-5xl font-black text-yellow-500 leading-none">{stats?.mastered || 0}</p>
        </div>
      </section>

      {/* Card Controls */}
      <section className="flex justify-between items-center border-t-2 border-gray-100 pt-8">
        <div className="hidden md:block">
          <h2 className="text-xl font-black text-gray-700 tracking-tight uppercase">Deck Content</h2>
          <p className="text-sm font-bold text-gray-400">{deck.cards?.length || 0} cards in this collection</p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary w-full md:w-auto px-8 py-3 flex items-center justify-center gap-2 text-base"
        >
          <Plus className="w-6 h-6" />
          ADD NEW CARD
        </button>
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
                  <button
                    onClick={() => openEditModal(card)}
                    className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-sky-blue transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    className="p-2 hover:bg-red-50 rounded-xl text-gray-400 hover:text-danger-red transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
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
    </div>
  );
}
