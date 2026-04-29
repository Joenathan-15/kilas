import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getFullImageUrl } from '../lib/api';
import { Loader2, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from '../hooks/useTranslation';
import type { Card, Deck } from '../types';
import confetti from 'canvas-confetti';

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

  useEffect(() => {
    if (isFinished) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // since particles fall down, start a bit higher than random
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isFinished]);

  // Reset state when mode or deck changes
  useEffect(() => {
    setIsFinished(false);
    setCurrentIndex(0);
    setStudiedCount(0);
    setIsFlipped(false);
  }, [deckId, isSandbox]);

  useEffect(() => {
    if (isSandbox && dueData) {
      toast(t.study.sandboxNotification, {
        icon: 'ℹ️',
        duration: 4000,
        id: 'sandbox-toast'
      });
    }
  }, [isSandbox, dueData]);

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
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-300 w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-500 mb-6">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-black text-gray-700 uppercase tracking-tight text-center">{t.study.allCaughtUp}</h2>
        <p className="text-gray-400 font-bold mt-2 text-center max-w-xs mx-auto">
          {t.study.noCardsDue}
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-8 w-full max-w-2xl mx-auto px-4">
          <button
            onClick={() => {
              navigate(`/decks/${deckId}/study?mode=sandbox`);
            }}
            className="w-full md:w-auto md:min-w-[200px] px-10 py-5 bg-feather-green border-b-4 border-green-700 text-white font-black rounded-2xl hover:bg-emerald-500 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-3 shadow-lg text-lg"
          >
            <Sparkles className="w-6 h-6 fill-current" /> {t.stats.reStudy.toUpperCase()}
          </button>
          <button
            onClick={() => navigate('/decks')}
            className="w-full md:w-auto md:min-w-[200px] px-10 py-5 bg-white border-b-4 border-gray-200 text-gray-400 font-black rounded-2xl hover:bg-gray-50 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 shadow-md text-lg"
          >
            <ArrowLeft className="w-6 h-6" /> {t.study.backToDecks.toUpperCase()}
          </button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="max-w-2xl mx-auto py-10 animate-in fade-in slide-in-from-bottom-8 duration-500 w-full px-4">
        <div className="card-duo p-8 text-center flex flex-col items-center">
          <div className="w-24 h-24 bg-sky-100 rounded-3xl flex items-center justify-center text-sky-500 mx-auto mb-6 border-b-4 border-sky-200 shadow-sm">
            <CheckCircle2 className="w-14 h-14" />
          </div>
          <h2 className="text-3xl font-black text-gray-700 uppercase tracking-tight mb-2 text-center">
            {isSandbox ? t.study.practiceComplete : t.study.wellDone}
          </h2>
          <p className="text-gray-400 font-bold mb-8 text-center">
            {isSandbox ? t.study.practiceFinished : t.study.studyFinished}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 w-full max-w-lg">
            <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100 shadow-inner">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{t.study.cardsStudied}</p>
              <p className="text-2xl font-black text-gray-700">{studiedCount} {t.decks.cardCount}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100 shadow-inner">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{t.study.duration}</p>
              <p className="text-2xl font-black text-gray-700">
                {Math.floor((Date.now() - startTime) / 60000)}m {Math.round(((Date.now() - startTime) % 60000) / 1000)}s
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full max-w-lg justify-center">
            <button
              onClick={() => {
                if (!isSandbox) {
                  navigate(`/decks/${deckId}/study?mode=sandbox`);
                } else {
                  setIsFinished(false);
                  setCurrentIndex(0);
                  setStudiedCount(0);
                  setIsFlipped(false);
                }
              }}
              className="w-full md:flex-1 px-10 py-5 bg-feather-green border-b-4 border-green-700 text-white font-black rounded-2xl hover:bg-emerald-500 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-3 shadow-lg text-lg"
            >
              <Sparkles className="w-6 h-6 fill-current" />
              {t.stats.reStudy.toUpperCase()}
            </button>
            <button
              onClick={() => navigate('/decks')}
              className="w-full md:flex-1 px-10 py-5 bg-white border-b-4 border-gray-200 text-gray-400 font-black rounded-2xl hover:bg-gray-50 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 shadow-md text-lg"
            >
              {t.study.goToDashboard}
            </button>
          </div>
        </div>
      </div>
    );
  }



  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header & Progress */}
      <div className="flex items-center justify-between gap-2 md:gap-4 px-2">
        <button
          onClick={() => {
            if (window.confirm(t.study.quitConfirm)) {
              handleFinish();
            }
          }}
          className="flex items-center gap-1.5 px-3 py-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors font-black text-[10px] md:text-xs uppercase tracking-widest shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span className="hidden sm:inline">{t.study.exit}</span>
        </button>
        
        <div className="flex-1 flex flex-col items-center gap-1.5">
          <div className="h-2.5 md:h-4 bg-gray-100 rounded-full overflow-hidden border-2 border-gray-200 w-full shadow-inner">
            <div
              className="h-full bg-sky-blue shadow-[inset_0_-2px_0_rgba(0,0,0,0.1)] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="text-xs md:text-sm font-black text-gray-400 min-w-[3rem] text-right shrink-0 tabular-nums">
          {currentIndex + 1} / {cards.length}
        </div>
      </div>

      {deck?.is_ai_generated && (
        <div className="flex items-center justify-center gap-2 text-purple-400 px-4">
          <Sparkles className="w-3 h-3 fill-current shrink-0" />
          <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-center">{t.study.aiAccuracyAlert}</p>
        </div>
      )}

      {/* Card Viewer */}
      <div
        className="relative perspective-1000 cursor-pointer h-[350px] md:h-[450px] group px-2 md:px-0"
        onClick={() => setIsFlipped(prev => !prev)}
      >
        <div className={`relative w-full h-full transition-all duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

          {/* Front Side */}
          <div className="absolute inset-0 backface-hidden card-duo p-6 md:p-8 flex flex-col items-center justify-center text-center overflow-auto select-text shadow-xl">
            {currentCard?.front_image_url && (
              <img
                src={getFullImageUrl(currentCard.front_image_url)}
                alt="Front"
                className="max-h-32 md:max-h-48 rounded-xl mb-6 shadow-sm object-contain"
              />
            )}
            <div className="text-xl md:text-3xl font-bold text-gray-700 whitespace-pre-wrap leading-relaxed">
              <Latex text={currentCard?.front || ''} />
            </div>
            <div className="mt-8 text-[10px] md:text-xs font-black text-gray-300 uppercase tracking-[0.2em] group-hover:text-sky-blue transition-colors select-none">
              {t.study.clickToReveal}
            </div>
            {currentCard?.is_ai_created && (
              <div className="mt-auto pt-4 flex items-center gap-1.5 text-[8px] md:text-[9px] font-black text-purple-400 uppercase tracking-widest border-t border-purple-50 w-full justify-center">
                <Sparkles className="w-2.5 h-2.5 fill-current" />
                {t.study.aiCardAlert}
              </div>
            )}
          </div>

          {/* Back Side */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 card-duo p-6 md:p-8 flex flex-col items-center justify-center text-center overflow-auto border-sky-200 select-text shadow-xl">
            {currentCard?.back_image_url && (
              <img
                src={getFullImageUrl(currentCard.back_image_url)}
                alt="Back"
                className="max-h-32 md:max-h-48 rounded-xl mb-6 shadow-sm object-contain"
              />
            )}
            <div className="text-xl md:text-3xl font-bold text-gray-700 whitespace-pre-wrap leading-relaxed">
              <Latex text={currentCard?.back || ''} />
            </div>
            {currentCard?.is_ai_created && (
              <div className="mt-auto pt-4 flex items-center gap-1.5 text-[8px] md:text-[9px] font-black text-purple-400 uppercase tracking-widest border-t border-purple-50 w-full justify-center">
                <Sparkles className="w-2.5 h-2.5 fill-current" />
                {t.study.aiCardAlert}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Controls */}
      <div className="min-h-32 flex items-center justify-center px-2">
        {!isFlipped ? (
          <button
            onClick={() => setIsFlipped(true)}
            className="w-full max-w-sm py-5 bg-gray-700 border-b-4 border-gray-900 text-white font-black rounded-2xl hover:bg-gray-800 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-[0.2em] text-lg shadow-lg"
          >
            {t.study.showAnswer}
          </button>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 w-full max-w-2xl">
            {[
              { label: t.study.easy, color: 'bg-green-500', border: 'border-green-700', text: 'text-white', val: 3, key: '1' },
              { label: t.study.good, color: 'bg-sky-blue', border: 'border-sky-700', text: 'text-white', val: 2, key: '2' },
              { label: t.study.hard, color: 'bg-orange-500', border: 'border-orange-700', text: 'text-white', val: 1, key: '3' },
              { label: t.study.again, color: 'bg-red-500', border: 'border-red-700', text: 'text-white', val: 0, key: '4' },
            ].map((btn) => (
              <button
                key={btn.val}
                onClick={(e) => { e.stopPropagation(); handleRate(btn.val); }}
                className={`${btn.color} ${btn.border} ${btn.text} py-3 md:py-4 px-2 font-black rounded-2xl border-b-4 active:border-b-0 active:translate-y-1 transition-all flex flex-col items-center justify-center group`}
              >
                <span className="text-xs md:text-sm uppercase tracking-tight">{btn.label}</span>
                <span className="hidden sm:inline-block text-[10px] opacity-50 mt-1">{t.study.press} {btn.key}</span>
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
