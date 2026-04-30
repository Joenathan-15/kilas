import React, { useState, useRef } from 'react';
import { X, Sparkles, FileText, Type } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useTranslation } from '../../hooks/useTranslation';

interface AIGenerateCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { text: string; count: number; file: File | null }) => void;
  title: string;
}

export default function AIGenerateCardsModal({ isOpen, onClose, onSubmit, title }: AIGenerateCardsModalProps) {
  useEscapeKey(onClose, isOpen);
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const isSubscribed = user?.subscription_until && new Date(user.subscription_until) > new Date();
  const [activeTab, setActiveTab] = useState<'text' | 'pdf'>('text');
  const [text, setText] = useState('');
  const [count, setCount] = useState(10);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ text, count, file: activeTab === 'pdf' ? selectedFile : null });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="bg-white w-full max-w-lg rounded-[2.5rem] border-b-8 border-gray-200 p-8 z-10 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
              <Sparkles className="w-6 h-6 fill-current" />
            </div>
            <h2 className="text-2xl font-black text-gray-700 uppercase tracking-tight">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex p-1 bg-gray-100 rounded-2xl mb-6">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'text' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-500'
              }`}
          >
            <Type className="w-4 h-4" /> {t.decks.textTab}
          </button>
          <button
            onClick={() => setActiveTab('pdf')}
            className={`flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'pdf' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-500'
              }`}
          >
            <FileText className="w-4 h-4" /> {t.decks.pdfTab}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {activeTab === 'text' ? (
            <div className="space-y-2">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">
                {t.decks.studyMaterial} <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <textarea
                  required
                  value={text}
                  maxLength={255}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-purple-300 focus:ring-0 transition-all font-bold text-gray-700 outline-none resize-none"
                  rows={6}
                  placeholder={t.decks.textPlaceholder}
                />
                <div className="absolute bottom-4 right-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {text.length} / 255
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-4 border-dashed rounded-[2.5rem] p-10 text-center cursor-pointer transition-all ${selectedFile ? 'border-purple-200 bg-purple-50' : 'border-gray-100 hover:border-purple-200 hover:bg-gray-50'
                }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                accept=".pdf"
                className="hidden"
              />
              <div className="flex flex-col items-center gap-4">
                <div className={`p-5 rounded-2xl ${selectedFile ? 'bg-purple-500 text-white shadow-lg shadow-purple-200' : 'bg-gray-100 text-gray-400'}`}>
                  <FileText className="w-10 h-10" />
                </div>
                {selectedFile ? (
                  <div>
                    <p className="font-black text-purple-600 truncate max-w-62.5">{selectedFile.name}</p>
                    <p className="text-xs font-bold text-purple-400 uppercase mt-1">{t.decks.readyToGenerate}</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-black text-gray-500">{t.decks.uploadPdf}</p>
                    <p className="text-xs font-bold text-gray-400 uppercase mt-1 tracking-wider">{t.decks.maxPages}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex justify-between">
              <span>{t.decks.targetCards}</span>
              <span className="text-purple-600">{count} {t.decks.cardsUnit}</span>
            </label>
            <input
              type="range"
              min="5"
              max="20"
              step="5"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="w-full accent-purple-600 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-black text-gray-300 mt-2 uppercase tracking-tighter">
              <span>5</span>
              <span>10</span>
              <span>15</span>
              <span>20</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={activeTab === 'text' ? !text.trim() : !selectedFile}
            className="w-full py-5 text-lg flex items-center justify-center gap-3 font-black rounded-2xl border-b-4 bg-purple-600 border-purple-800 text-white hover:bg-purple-500 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:border-b-4"
          >
            <Sparkles className="w-6 h-6 fill-current" />
            {t.decks.generateCardsBtn}
          </button>

          <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest flex flex-col gap-1">
            <span>{activeTab === 'pdf' ? t.decks.costsPerPage : t.decks.costsTokens.replace('{amount}', (count * 10).toString())}</span>
            {!isSubscribed && <span className="text-purple-400 font-black">{t.decks.freeUserLimit}</span>}
          </p>
        </form>
      </div>
    </div>
  );
}
