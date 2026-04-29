import { Link } from 'react-router-dom';
import { Edit2, Trash2, Globe, Lock, Layers, Play, Sparkles } from 'lucide-react';
import type { Deck } from '../../types';

interface DeckCardProps {
  deck: Deck;
  onEdit: (deck: Deck) => void;
  onDelete: (id: number) => void;
}

export default function DeckCard({ deck, onEdit, onDelete }: DeckCardProps) {
  const visibleTags = deck.tags?.slice(0, 3) || [];
  const extraTagCount = (deck.tags?.length || 0) - 3;

  return (
    <div className="card-duo p-6 group hover:-translate-y-1 transition-all duration-200 flex flex-col h-full">
      {/* Top Row: Badges + Actions */}
      <div className="flex justify-between items-center mb-4 gap-3">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
          {deck.is_public ? (
            <span className="flex items-center gap-1 text-sky-blue bg-sky-50 px-2 py-1 rounded-lg shrink-0">
              <Globe className="w-3 h-3" /> Public
            </span>
          ) : (
            <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg shrink-0">
              <Lock className="w-3 h-3" /> Private
            </span>
          )}
          <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg shrink-0">
            <Layers className="w-3 h-3" /> {deck.card_count || 0}
          </span>
          {deck.is_ai_generated && (
            <span className="flex items-center gap-1 bg-purple-50 text-purple-500 px-2 py-1 rounded-lg shrink-0 border border-purple-100 animate-pulse">
              <Sparkles className="w-3 h-3 fill-current" /> AI
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200 shrink-0">
          <button 
            onClick={() => onEdit(deck)}
            className="p-1.5 hover:bg-sky-50 rounded-lg text-gray-300 hover:text-sky-blue transition-colors"
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
        <h3 className="text-lg font-black text-gray-700 line-clamp-2 leading-snug group-hover/title:text-sky-blue transition-colors">
          {deck.title}
        </h3>
        <p className="text-sm font-bold text-gray-400 line-clamp-1 mt-1">
          {deck.description || 'No description'}
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
      <div className="flex gap-3 mt-auto">
        <Link 
          to={`/decks/${deck.id}/study`}
          className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4 fill-current" />
          STUDY
        </Link>
        <Link 
          to={`/decks/${deck.id}`}
          className="btn-secondary px-4 py-3 flex items-center justify-center"
          title="View Cards"
        >
          <Layers className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
