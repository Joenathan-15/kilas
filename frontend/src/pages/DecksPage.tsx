import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Plus, Search, Loader2, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Deck } from '../types';
import DeckCard from '../components/decks/DeckCard';
import DeckModal from '../components/decks/DeckModal';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';

export default function DecksPage() {
  const queryClient = useQueryClient();
  const { fetchMe } = useAuthStore();
  const { addGeneration, removeGeneration } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | undefined>();

  const { data: decksData, isLoading } = useQuery<{ data: Deck[] }>({
    queryKey: ['decks'],
    queryFn: async () => {
      const res = await api.get('/decks');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (newDeck: any) => api.post('/decks', newDeck),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      toast.success('Deck created! 🗂️');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to create deck');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.put(`/decks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      toast.success('Deck updated! ✨');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to update deck');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/decks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      toast.success('Deck deleted');
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
      }).finally(() => {
        removeGeneration(generationId);
      });

      toast.promise(aiPromise, {
        loading: '🤖 AI is generating your deck...',
        success: 'Deck generated! Check your collection ✨',
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
    if (window.confirm('Are you sure you want to delete this deck? All cards inside will be lost forever!')) {
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

  const filteredDecks = decksData?.data?.filter((deck) =>
    deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deck.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-700 tracking-tight">MY DECKS</h1>
          <p className="text-gray-400 font-bold">Manage your flashcard collections</p>
        </div>
        
        <button 
          onClick={openCreateModal}
          className="btn-primary py-3 px-6 flex items-center justify-center gap-2"
        >
          <Plus className="w-6 h-6" />
          CREATE NEW DECK
        </button>
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
          placeholder="Search by title or tags..."
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-sky-blue animate-spin mb-4" />
          <p className="font-black text-gray-400 uppercase tracking-widest">Loading Decks...</p>
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
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border-4 border-dashed border-gray-200">
          <Layers className="w-20 h-20 text-gray-200 mb-6" />
          <h2 className="text-2xl font-black text-gray-400 uppercase">No decks found</h2>
          <p className="text-gray-400 font-bold mt-2">Try a different search or create your first deck!</p>
          <button 
            onClick={openCreateModal}
            className="mt-8 text-sky-blue font-black hover:underline underline-offset-4"
          >
            + Create New Deck
          </button>
        </div>
      )}

      <DeckModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={editingDeck ? handleUpdateDeck : handleCreateDeck}
        initialData={editingDeck}
        title={editingDeck ? 'Edit Deck' : 'Create New Deck'}
      />
    </div>
  );
}
