import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getFullImageUrl } from '../lib/api';
import { Link } from 'react-router-dom';
import { Search, Loader2, BookOpen, Copy, Layers, ArrowLeft, ArrowRight, Sparkles, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from '../hooks/useTranslation';
import { usePageTitle } from '../hooks/usePageTitle';
import type { LibraryDeck } from '../types';

interface BrowseResult {
  data: LibraryDeck[];
  total: number;
  page: number;
  limit: number;
}

export default function LibraryPage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  usePageTitle(t.nav.library);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
  const [page, setPage] = useState(1);
  const limit = 12;

  // Debounce search input by 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: result, isLoading } = useQuery<BrowseResult>({
    queryKey: ['library', debouncedSearch, sortBy, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      params.set('sort', sortBy);
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      const res = await api.get(`/library?${params.toString()}`);
      return res.data;
    },
  });

  const cloneMutation = useMutation({
    mutationFn: (deckId: number) => api.post(`/library/${deckId}/clone`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      queryClient.invalidateQueries({ queryKey: ['library'] });
      toast.success(t.library.copySuccess);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to copy deck');
    },
  });

  const handleClone = (deck: LibraryDeck) => {
    if (window.confirm(t.library.copyConfirm.replace('{title}', deck.title))) {
      cloneMutation.mutate(deck.id);
    }
  };

  const totalPages = result ? Math.ceil(result.total / limit) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-gray-700 tracking-tight flex items-center gap-3">
          <Globe className="w-8 h-8 text-feather-green" />
          {t.library.title}
        </h1>
        <p className="text-gray-400 font-bold">{t.library.subtitle}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-11 pr-4 py-4 bg-surface border-2 border-gray-200 rounded-3xl focus:border-feather-green focus:ring-0 transition-all font-bold text-gray-700 placeholder-gray-400 outline-none shadow-sm"
            placeholder={t.library.searchPlaceholder}
          />
        </div>

        <div className="flex bg-gray-100 p-1 rounded-2xl w-full md:w-auto">
          <button
            onClick={() => { setSortBy('newest'); setPage(1); }}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${sortBy === 'newest'
              ? 'bg-white text-feather-green shadow-sm'
              : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            {t.library.newest}
          </button>
          <button
            onClick={() => { setSortBy('popular'); setPage(1); }}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${sortBy === 'popular'
              ? 'bg-white text-feather-green shadow-sm'
              : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            {t.library.popular}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-feather-green animate-spin mb-4" />
          <p className="font-black text-gray-400 uppercase tracking-widest">{t.library.browsing}</p>
        </div>
      ) : result && result.data.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {result.data.map((deck) => (
              <div
                key={deck.id}
                className="card-duo p-6 flex flex-col h-full hover:-translate-y-1 transition-all duration-200 group relative"
              >
                <Link to={`/decks/${deck.id}`} className="flex flex-col h-full">
                  {/* Top badges */}
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                    <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg">
                      <Layers className="w-3 h-3" /> {deck.card_count}
                    </span>
                    <span className="flex items-center gap-1 bg-sky-50 text-sky-blue px-2 py-1 rounded-lg">
                      <Copy className="w-3 h-3" /> {deck.clone_count} {t.library.copies}
                    </span>
                    {deck.tags?.some(t => t.toLowerCase().includes('ai')) && (
                      <span className="flex items-center gap-1 bg-purple-100 text-purple-600 px-2 py-1 rounded-lg">
                        <Sparkles className="w-3 h-3 fill-current" /> AI
                      </span>
                    )}
                  </div>

                  {/* Title + Description */}
                  <h3 className="text-lg font-black text-gray-700 line-clamp-2 leading-snug mb-1 group-hover:text-feather-green transition-colors">
                    {deck.title}
                  </h3>
                  <p className="text-sm font-bold text-gray-400 line-clamp-2 mb-3">
                    {deck.description || t.library.noDescription}
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-2 mb-3">
                    <img
                      src={getFullImageUrl(undefined, deck.author.username)}
                      alt={deck.author.username}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-xs font-bold text-gray-400">{deck.author.username}</span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-auto pb-5">
                    {deck.tags?.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-gray-100 text-[10px] font-black text-gray-500 rounded-md uppercase tracking-wider">
                        #{tag}
                      </span>
                    ))}
                    {(deck.tags?.length || 0) > 3 && (
                      <span className="px-2 py-0.5 text-[10px] font-black text-gray-400">
                        +{deck.tags.length - 3}
                      </span>
                    )}
                  </div>
                </Link>

                {/* Clone Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleClone(deck);
                  }}
                  disabled={cloneMutation.isPending}
                  className="btn-primary mt-auto w-full py-3 text-sm flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {t.library.copyToDecks}
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-3 hover:bg-gray-100 rounded-2xl text-gray-400 disabled:opacity-30 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-black text-gray-400 uppercase tracking-widest">
                {t.library.pageOf.replace('{page}', page.toString()).replace('{total}', totalPages.toString())}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-3 hover:bg-gray-100 rounded-2xl text-gray-400 disabled:opacity-30 transition-colors"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border-4 border-dashed border-gray-200">
          <BookOpen className="w-20 h-20 text-gray-200 mb-6" />
          <h2 className="text-2xl font-black text-gray-400 uppercase">{t.library.noLibraryFound}</h2>
          <p className="text-gray-400 font-bold mt-2">{t.library.trySearch}</p>
        </div>
      )}
    </div>
  );
}
