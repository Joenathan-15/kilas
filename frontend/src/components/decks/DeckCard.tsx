import { Link } from 'react-router-dom';
import { Edit2, Trash2, Globe, Lock, Layers, Play, Sparkles, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Deck } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { hasOfflineCards } from '../../lib/offlineStorage';

interface DeckCardProps {
  deck: Deck;
  onEdit: (deck: Deck) => void;
  onDelete: (id: number) => void;
}

export default function DeckCard({ deck, onEdit, onDelete }: DeckCardProps) {
  const { t } = useTranslation();
  const { isOnline } = useOnlineStatus();
  const [isCached, setIsCached] = useState(false);
  const visibleTags = deck.tags?.slice(0, 3) || [];
  const extraTagCount = (deck.tags?.length || 0) - 3;

  useEffect(() => {
    hasOfflineCards(deck.id).then(setIsCached);
  }, [deck.id]);

  return (
    <div className="card-duo p-6 group hover:-translate-y-1 transition-all duration-200 flex flex-col h-full">
      {/* Top Row: Badges + Actions */}
      <div className="flex justify-between items-center mb-4 gap-3">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
          {deck.is_public ? (
            <span className="flex items-center gap-1 text-feather-green bg-green-50 px-2 py-1 rounded-lg shrink-0">
              <Globe className="w-3 h-3" /> {t.decks.public}
            </span>
          ) : (
            <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg shrink-0">
              <Lock className="w-3 h-3" /> {t.decks.private}
            </span>
          )}
          <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg shrink-0">
            <Layers className="w-3 h-3" /> {deck.card_count || 0}
          </span>
          {deck.due_count !== undefined && deck.due_count > 0 && (
            <span className="flex items-center gap-1 bg-orange-50 text-orange-600 border border-orange-100 px-2 py-1 rounded-lg shrink-0 font-black">
              <AlertCircle className="w-3 h-3" /> {deck.due_count}
            </span>
          )}
          {deck.is_ai_generated && (
            <span className="flex items-center gap-1 bg-purple-50 text-purple-500 px-2 py-1 rounded-lg shrink-0 border border-purple-100 animate-pulse">
              <Sparkles className="w-3 h-3 fill-current" /> AI
            </span>
          )}
          {isCached && (
            <span className="flex items-center gap-1 bg-blue-50 text-blue-500 px-2 py-1 rounded-lg shrink-0 border border-blue-100" title="Available Offline">
              <Wifi className="w-3 h-3" />
            </span>
          )}
          {!isOnline && !isCached && (
            <span className="flex items-center gap-1 bg-amber-50 text-amber-500 px-2 py-1 rounded-lg shrink-0 border border-amber-100" title="Not Available Offline">
              <WifiOff className="w-3 h-3" />
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200 shrink-0">
          <button 
            onClick={() => onEdit(deck)}
            className="p-1.5 hover:bg-green-50 rounded-lg text-gray-300 hover:text-feather-green transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(deck.id)}
            className="p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-danger-red transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Title + Description */}
      <Link to={`/decks/${deck.id}`} className="block group/title mb-3">
        <h3 className="text-lg font-black text-gray-700 line-clamp-2 leading-snug group-hover/title:text-feather-green transition-colors">
          {deck.title}
        </h3>
        <p className="text-sm font-bold text-gray-400 line-clamp-1 mt-1">
          {deck.description || t.library.noDescription}
        </p>
      </Link>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-auto pb-5">
        {visibleTags.map((tag) => (
          <span key={tag} className="px-2 py-0.5 bg-gray-100 text-[10px] font-black text-gray-500 rounded-md uppercase tracking-wider">
            #{tag}
          </span>
        ))}
        {extraTagCount > 0 && (
          <span className="px-2 py-0.5 text-[10px] font-black text-gray-400">
            +{extraTagCount}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2.5 mt-auto pt-2">
        <Link 
          to={`/decks/${deck.id}/study${(!isOnline || deck.due_count === 0) ? '?mode=sandbox' : ''}`}
          className={`btn-primary flex-3 py-4 text-xs font-black flex items-center justify-center gap-2 whitespace-nowrap shadow-md ${!isOnline && !isCached ? 'opacity-50 grayscale pointer-events-none' : ''}`}
        >
          <Play className="w-4 h-4 fill-current" />
          {!isOnline ? t.offline.offlineMode.toUpperCase() : (deck.due_count === 0 ? t.stats.reStudy.toUpperCase() : t.decks.studyNow.toUpperCase())}
        </Link>
        <Link 
          to={`/decks/${deck.id}`}
          className="btn-secondary flex-1 py-4 flex items-center justify-center shadow-md"
          title={t.decks.viewDetails}
        >
          <Layers className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
