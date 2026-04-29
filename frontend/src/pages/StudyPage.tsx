import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getFullImageUrl } from '../lib/api';
import { Loader2, ArrowLeft, CheckCircle2, Image as X, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from '../hooks/useTranslation';
import type { Card, Deck } from '../types';

import { Latex } from '../components/common/Latex';

interface StudyDueResponse {
  data: Card[];
  total_due: number;
}

export default function StudyPage() {
  const { id: deckId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const isSandbox = searchParams.get('mode') === 'sandbox';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [startTime] = useState(Date.now());
  const [studiedCount, setStudiedCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  // Fetch due cards
  const { data: dueData, isLoading, error } = useQuery<StudyDueResponse>({
    queryKey: ['study-due', deckId, isSandbox],
    queryFn: async () => {
      const endpoint = isSandbox ? `/decks/${deckId}/cards` : `/decks/${deckId}/study/due`;
      const res = await api.get(endpoint);
      return res.data;
    },
  });

  const { data: deck } = useQuery<Deck>({
    queryKey: ['deck', deckId],
    queryFn: async () => {
      const res = await api.get(`/decks/${deckId}`);
      return res.data;
    },
    enabled: !!deckId,
  });

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/study/sessions', { deck_id: Number(deckId) });
      return res.data;
    },
    onSuccess: (data) => {
      setSessionId(data.session_id);
    },
  });

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ cardId, quality }: { cardId: number; quality: number }) => {
      return api.post(`/study/sessions/${sessionId}/review`, { card_id: cardId, quality });
    },
  });

  // End session mutation
  const endSessionMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) return;
      const duration = Math.round((Date.now() - startTime) / 1000);
      return api.post(`/study/sessions/${sessionId}/end`, { duration });
    },
  });

  useEffect(() => {
    if (dueData && dueData.data.length > 0 && !sessionId && !startSessionMutation.isPending && !isSandbox) {
      startSessionMutation.mutate();
    }
  }, [dueData, sessionId, isSandbox]);

  const cards = dueData?.data || [];
  const currentCard = cards[currentIndex];

  const handleRate = useCallback(async (quality: number) => {
    if (!currentCard) return;
    if (!isSandbox && !sessionId) return;

    // Optimistic progress
    setStudiedCount(prev => prev + 1);

    if (!isSandbox) {
      reviewMutation.mutate({ cardId: currentCard.id, quality });
    }

    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      // Small delay for flip animation
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 150);
    } else {
      handleFinish();
    }
  }, [currentCard, sessionId, currentIndex, cards]);

  const handleFinish = async () => {
    try {
      if (sessionId && !isSandbox) {
        await endSessionMutation.mutateAsync();
      }
    } catch (err) {
      console.error('Failed to end session:', err);
      toast.error('Session ended with sync error.');
    } finally {
      queryClient.invalidateQueries({ queryKey: ['stats-overview'] });
      queryClient.invalidateQueries({ queryKey: ['stats-activity'] });
      setIsFinished(true);
      toast.success('Session completed! 🎯');
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      }

      if (isFlipped) {
        if (e.key === '1') handleRate(3); // Easy
        if (e.key === '2') handleRate(2); // Good
        if (e.key === '3') handleRate(1); // Hard
        if (e.key === '4') handleRate(0); // Again
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, handleRate, isFinished]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-sky-blue animate-spin mb-4" />
        <p className="font-black text-gray-400 uppercase tracking-widest">{t.study.preparing}</p>
      </div>
    );
  }

  if (error || (dueData && dueData.data.length === 0 && !isFinished)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-500 mb-6">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-black text-gray-700 uppercase tracking-tight">{t.study.allCaughtUp}</h2>
        <p className="text-gray-400 font-bold mt-2 text-center max-w-xs">
          {t.study.noCardsDue}
        </p>
        <button
          onClick={() => navigate('/decks')}
          className="mt-8 px-8 py-4 bg-sky-blue border-b-4 border-sky-700 text-white font-black rounded-2xl hover:bg-sky-500 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> {t.study.backToDecks.toUpperCase()}
        </button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="max-w-md mx-auto py-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="card-duo p-8 text-center">
          <div className="w-24 h-24 bg-sky-100 rounded-3xl flex items-center justify-center text-sky-500 mx-auto mb-6 border-b-4 border-sky-200">
            <CheckCircle2 className="w-14 h-14" />
          </div>
          <h2 className="text-3xl font-black text-gray-700 uppercase tracking-tight mb-2">
            {isSandbox ? t.study.practiceComplete : t.study.wellDone}
          </h2>
          <p className="text-gray-400 font-bold mb-8">
            {isSandbox ? t.study.practiceFinished : t.study.studyFinished}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{t.study.cardsStudied}</p>
              <p className="text-2xl font-black text-gray-700">{studiedCount} {t.decks.cardCount}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{t.study.duration}</p>
              <p className="text-2xl font-black text-gray-700">
                {Math.floor((Date.now() - startTime) / 60000)}m {Math.round(((Date.now() - startTime) % 60000) / 1000)}s
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/decks')}
            className="w-full py-4 bg-sky-blue border-b-4 border-sky-700 text-white font-black rounded-2xl hover:bg-sky-500 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2"
          >
            {t.study.goToDashboard}
          </button>
        </div>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header & Progress */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => {
            if (window.confirm(t.study.quitConfirm)) {
              handleFinish();
            }
          }}
          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors font-black text-xs uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.study.exit}
        </button>
        <div className="flex-1 mx-8 flex flex-col items-center gap-1">
          {isSandbox && (
            <div className="flex items-center gap-1 text-[10px] font-black text-sky-500 uppercase tracking-widest bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
              {t.study.sandboxMode}
            </div>
          )}
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden border-2 border-gray-200 w-full">
            <div
              className="h-full bg-sky-blue transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-sm font-black text-gray-400 min-w-[3rem] text-right">
          {currentIndex + 1} / {cards.length}
        </span>
      </div>

      {deck?.is_ai_generated && (
        <div className="flex items-center justify-center gap-2 text-purple-400">
          <Sparkles className="w-3 h-3 fill-current" />
          <p className="text-[10px] font-black uppercase tracking-widest">{t.study.aiAccuracyAlert}</p>
        </div>
      )}

      {/* Card Viewer */}
      <div
        className="relative perspective-1000 cursor-pointer h-[400px] group"
        onClick={() => setIsFlipped(prev => !prev)}
      >
        <div className={`relative w-full h-full transition-all duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

          {/* Front Side */}
          <div className="absolute inset-0 backface-hidden card-duo p-8 flex flex-col items-center justify-center text-center overflow-auto">
            {currentCard?.front_image_url && (
              <img
                src={getFullImageUrl(currentCard.front_image_url)}
                alt="Front"
                className="max-h-40 rounded-xl mb-6 shadow-sm object-contain"
              />
            )}
            <div className="text-2xl font-bold text-gray-700 whitespace-pre-wrap">
              <Latex text={currentCard?.front || ''} />
            </div>
            <div className="mt-8 text-xs font-black text-gray-300 uppercase tracking-[0.2em] group-hover:text-sky-blue transition-colors">
              {t.study.clickToReveal}
            </div>
            {currentCard?.is_ai_created && (
              <div className="mt-auto pt-4 flex items-center gap-1.5 text-[9px] font-black text-purple-400 uppercase tracking-widest border-t border-purple-50 w-full justify-center">
                <Sparkles className="w-2.5 h-2.5 fill-current" />
                {t.study.aiCardAlert}
              </div>
            )}
          </div>

          {/* Back Side */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 card-duo p-8 flex flex-col items-center justify-center text-center overflow-auto border-sky-200">
            {currentCard?.back_image_url && (
              <img
                src={getFullImageUrl(currentCard.back_image_url)}
                alt="Back"
                className="max-h-40 rounded-xl mb-6 shadow-sm object-contain"
              />
            )}
            <div className="text-2xl font-bold text-gray-700 whitespace-pre-wrap">
              <Latex text={currentCard?.back || ''} />
            </div>
            {currentCard?.is_ai_created && (
              <div className="mt-auto pt-4 flex items-center gap-1.5 text-[9px] font-black text-purple-400 uppercase tracking-widest border-t border-purple-50 w-full justify-center">
                <Sparkles className="w-2.5 h-2.5 fill-current" />
                {t.study.aiCardAlert}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Controls */}
      <div className="h-32 flex items-center justify-center">
        {!isFlipped ? (
          <button
            onClick={() => setIsFlipped(true)}
            className="w-full max-w-sm py-5 bg-gray-700 border-b-4 border-gray-900 text-white font-black rounded-2xl hover:bg-gray-800 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest text-lg"
          >
            {t.study.showAnswer}
          </button>
        ) : (
          <div className="grid grid-cols-4 gap-3 w-full">
            {[
              { label: t.study.easy, color: 'bg-green-500', border: 'border-green-700', text: 'text-white', val: 3, key: '1' },
              { label: t.study.good, color: 'bg-sky-blue', border: 'border-sky-700', text: 'text-white', val: 2, key: '2' },
              { label: t.study.hard, color: 'bg-orange-500', border: 'border-orange-700', text: 'text-white', val: 1, key: '3' },
              { label: t.study.again, color: 'bg-red-500', border: 'border-red-700', text: 'text-white', val: 0, key: '4' },
            ].map((btn) => (
              <button
                key={btn.val}
                onClick={(e) => { e.stopPropagation(); handleRate(btn.val); }}
                className={`${btn.color} ${btn.border} ${btn.text} py-4 font-black rounded-2xl border-b-4 active:border-b-0 active:translate-y-1 transition-all flex flex-col items-center justify-center group`}
              >
                <span className="text-sm uppercase tracking-tight">{btn.label}</span>
                <span className="text-[10px] opacity-50 mt-1">{t.study.press} {btn.key}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="flex items-center justify-center gap-6 text-xs font-black text-gray-400 uppercase tracking-widest opacity-50">
        <span className="flex items-center gap-2"><div className="px-1.5 py-0.5 bg-gray-200 rounded border-b border-gray-400 text-gray-600">Space</div> {t.study.flip}</span>
        <span className="flex items-center gap-2"><div className="px-1.5 py-0.5 bg-gray-200 rounded border-b border-gray-400 text-gray-600">1-4</div> {t.study.rate}</span>
      </div>
    </div>
  );
}
