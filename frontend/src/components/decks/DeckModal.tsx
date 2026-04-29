import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Sparkles, FileText, Plus } from 'lucide-react';
import type { Deck } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface DeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any, type: 'manual' | 'ai') => Promise<void>;
  initialData?: Deck;
  title: string;
}

export default function DeckModal({ isOpen, onClose, onSubmit, initialData, title }: DeckModalProps) {
  useEscapeKey(onClose, isOpen);
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const isSubscribed = user?.subscription_until && new Date(user.subscription_until) > new Date();
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_public: false,
    tags: '',
    count: 10,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description || '',
        is_public: initialData.is_public,
        tags: initialData.tags?.join(', ') || '',
        count: 10,
      });
      setActiveTab('manual');
    } else {
      setFormData({
        title: '',
        description: '',
        is_public: false,
        tags: '',
        count: 10,
      });
      setSelectedFile(null);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const tagsArray = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t !== '');

    if (activeTab === 'ai') {
      // Optimistic: close immediately, fire in background
      const data = { ...formData, tags: tagsArray, file: selectedFile };
      onSubmit(data, 'ai'); // no await — fire and forget
      onClose();
      return;
    }

    // Manual: wait for completion
    setIsLoading(true);
    try {
      const data = { ...formData, tags: tagsArray };
      await onSubmit(data, 'manual');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="bg-white w-full max-w-md rounded-[2.5rem] border-b-8 border-gray-200 p-8 z-10 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-gray-700 uppercase tracking-tight">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Tabs - Only show when creating new deck */}
        {!initialData && (
          <div className="flex p-1 bg-gray-100 rounded-2xl mb-8">
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'manual' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-500'
                }`}
            >
              <Plus className="w-4 h-4" /> {t.decks.manualTab}
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'ai' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-500'
                }`}
            >
              <Sparkles className="w-4 h-4 fill-current" /> {t.decks.aiTab}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {activeTab === 'manual' ? (
            <>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  {t.decks.deckTitle} <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-100 border-2 border-transparent rounded-2xl focus:bg-white focus:border-sky-blue focus:ring-0 transition-all font-bold text-gray-700 outline-none"
                  placeholder={t.decks.titlePlaceholder}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  {t.decks.description}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-100 border-2 border-transparent rounded-2xl focus:bg-white focus:border-sky-blue focus:ring-0 transition-all font-bold text-gray-700 outline-none resize-none"
                  rows={3}
                  placeholder={t.decks.descriptionPlaceholder}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  {t.decks.tagsHint}
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-100 border-2 border-transparent rounded-2xl focus:bg-white focus:border-sky-blue focus:ring-0 transition-all font-bold text-gray-700 outline-none"
                  placeholder={t.decks.tagPlaceholder}
                />
              </div>
            </>
          ) : (
            <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-4 border-dashed rounded-4xl p-8 text-center cursor-pointer transition-all ${selectedFile ? 'border-purple-200 bg-purple-50' : 'border-gray-100 hover:border-purple-200 hover:bg-gray-50'
                  }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  accept=".pdf"
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-3">
                  <div className={`p-4 rounded-2xl ${selectedFile ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <FileText className="w-8 h-8" />
                  </div>
                  {selectedFile ? (
                    <div>
                      <p className="font-black text-purple-600 truncate max-w-50">{selectedFile.name}</p>
                      <p className="text-xs font-bold text-purple-400 uppercase mt-1">Ready to generate</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-black text-gray-500">{t.decks.uploadPdf}</p>
                      <div className="flex flex-col gap-0.5 mt-1">
                        <p className="text-xs font-bold text-gray-400 uppercase">{t.decks.maxPages}</p>
                        {!isSubscribed && (
                          <p className="text-[10px] font-black text-purple-400 uppercase">{t.decks.freeUserLimit}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 flex justify-between">
                  <span>{t.decks.cardCount}</span>
                  <span className="text-purple-600">{formData.count} {t.decks.cardCount.toLowerCase()}</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="20"
                  step="5"
                  value={formData.count}
                  onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) })}
                  className="w-full accent-purple-600"
                />
                <div className="flex justify-between text-[10px] font-black text-gray-300 mt-1 uppercase tracking-tighter">
                  <span>5 {t.decks.cardCount.toLowerCase()}</span>
                  <span>10 {t.decks.cardCount.toLowerCase()}</span>
                  <span>15 {t.decks.cardCount.toLowerCase()}</span>
                  <span>20 {t.decks.cardCount.toLowerCase()}</span>
                </div>
              </div>
            </div>
          )}



          <div className="flex items-center gap-3 py-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, is_public: !formData.is_public })}
              className={`w-12 h-6 rounded-full transition-colors relative border-2 ${formData.is_public ? 'bg-feather-green border-feather-green-dark' : 'bg-gray-200 border-gray-300'
                }`}
            >
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.is_public ? 'translate-x-6' : 'translate-x-0'
                }`} />
            </button>
            <span className="font-bold text-sm text-gray-500">{t.decks.publicDeck}</span>
          </div>

          <button
            type="submit"
            disabled={isLoading || (activeTab === 'ai' && !selectedFile)}
            className={`w-full py-5 text-lg mt-4 flex items-center justify-center gap-3 font-black rounded-2xl border-b-4 active:border-b-0 active:translate-y-1 transition-all ${activeTab === 'ai'
              ? 'bg-purple-600 border-purple-800 text-white hover:bg-purple-500'
              : 'btn-primary'
              }`}
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : activeTab === 'ai' ? (
              <>
                <Sparkles className="w-6 h-6 fill-current" />
                {t.decks.generateDeck}
              </>
            ) : (
              initialData ? t.decks.saveChanges : t.decks.createDeck
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
