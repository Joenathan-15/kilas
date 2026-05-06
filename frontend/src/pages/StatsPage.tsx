import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart2,
  Calendar,
  Clock,
  BookOpen,
  Flame,
  Trophy,
  Activity,
  History,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { usePageTitle } from '../hooks/usePageTitle';
import { useTranslation } from '../hooks/useTranslation';
import type { AIGenerationHistory } from '../types';

interface OverviewStats {
  total_decks: number;
  total_cards: number;
  cards_due_today: number;
  cards_mastered: number;
  total_sessions: number;
  total_study_time: number;
}

interface ActivityData {
  date: string;
  count: number;
}

interface SessionSummary {
  id: number;
  deck_id: number;
  deck_title: string;
  cards_studied: number;
  duration: number;
  started_at: string;
}

export default function StatsPage() {
  const [activeDayIdx, setActiveDayIdx] = useState<number | null>(null);
  const [historyTab, setHistoryTab] = useState<'study' | 'ai'>('study');
  const { t, lang } = useTranslation();

  usePageTitle(t.nav.stats);

  const { data: overview, isLoading: overviewLoading } = useQuery<OverviewStats>({
    queryKey: ['stats-overview'],
    queryFn: async () => {
      const res = await api.get('/stats/overview');
      return res.data;
    },
  });

  const { data: activity, isLoading: activityLoading } = useQuery<ActivityData[]>({
    queryKey: ['stats-activity'],
    queryFn: async () => {
      const res = await api.get('/stats/activity');
      return res.data.data;
    },
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery<SessionSummary[]>({
    queryKey: ['stats-sessions'],
    queryFn: async () => {
      const res = await api.get('/stats/sessions');
      return res.data.data;
    },
  });

  const { data: aiHistory, isLoading: aiHistoryLoading } = useQuery<AIGenerationHistory[]>({
    queryKey: ['ai-history'],
    queryFn: async () => {
      const res = await api.get('/ai/history');
      return res.data.data;
    },
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const formatTotalTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  if (overviewLoading || activityLoading || sessionsLoading || aiHistoryLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Activity className="w-12 h-12 text-sky-blue animate-pulse mb-4" />
        <p className="font-black text-gray-400 uppercase tracking-widest">{t.stats.calculating}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500" onClick={() => setActiveDayIdx(null)}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-700 flex items-center gap-3">
            <BarChart2 className="w-8 h-8 text-feather-green" />
            {t.stats.title}
          </h1>
          <p className="text-gray-400 font-bold mt-1">{t.stats.subtitle}</p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Study Time Card */}
        <div className="card-duo p-6 bg-gradient-to-br from-sky-50 to-white border-sky-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-sky-100 rounded-2xl flex items-center justify-center text-sky-500 border-b-4 border-sky-200">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.stats.totalStudyTime}</p>
              <p className="text-3xl font-black text-gray-700">{formatTotalTime(overview?.total_study_time || 0)}</p>
            </div>
          </div>
          <div className="h-2 bg-sky-100 rounded-full overflow-hidden">
            <div className="h-full bg-sky-blue w-2/3" />
          </div>
        </div>

        {/* Cards Mastered Card */}
        <div className="card-duo p-6 bg-gradient-to-br from-green-50 to-white border-green-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-500 border-b-4 border-green-200">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.stats.cardsMastered}</p>
              <p className="text-3xl font-black text-gray-700">{overview?.cards_mastered || 0}</p>
            </div>
          </div>
          <div className="h-2 bg-green-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-feather-green"
              style={{ width: `${(overview?.cards_mastered || 0) / (overview?.total_cards || 1) * 100}%` }}
            />
          </div>
        </div>

        {/* Sessions Card */}
        <div className="card-duo p-6 bg-gradient-to-br from-orange-50 to-white border-orange-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-500 border-b-4 border-orange-200">
              <Flame className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.stats.totalSessions}</p>
              <p className="text-3xl font-black text-gray-700">{overview?.total_sessions || 0}</p>
            </div>
          </div>
          <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
            <div className="h-full bg-orange-400 w-1/2" />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Activity Breakdown */}
        <section className="lg:col-span-2 space-y-6">
          <div className="card-duo p-6">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-gray-700 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-feather-green" />
                {t.stats.learningActivity}
              </h3>
              <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                <span>{t.stats.last30Days}</span>
              </div>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-x-2 gap-y-8">
              {activity?.map((day, i) => {
                const colors = [
                  'bg-gray-100 border-gray-200',
                  'bg-green-200 border-green-300',
                  'bg-green-400 border-green-500',
                  'bg-feather-green border-feather-green-dark',
                ];
                let colorIdx = 0;
                if (day.count > 0) colorIdx = 1;
                if (day.count > 2) colorIdx = 2;
                if (day.count > 9) colorIdx = 3;

                const dateObj = new Date(day.date);
                const isActive = activeDayIdx === i;

                return (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-2 relative"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDayIdx(isActive ? null : i);
                    }}
                  >
                    {/* Premium Tooltip */}
                    {isActive && (
                      <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-50 animate-in zoom-in-95 duration-200">
                        <div className="bg-gray-800 text-white p-3 rounded-2xl shadow-xl border-2 border-gray-700 w-32 text-center pointer-events-none">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                            {new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(dateObj)}
                          </p>
                          <p className="text-sm font-black whitespace-nowrap">
                            {day.count} {t.stats.reviews}
                          </p>
                          {/* Arrow */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-800" />
                        </div>
                      </div>
                    )}

                    <div
                      className={`w-full aspect-square max-w-[40px] rounded-xl border-2 transition-all hover:scale-110 cursor-pointer ${colors[colorIdx]} ${isActive ? 'ring-4 ring-sky-blue/20 scale-110 border-sky-blue' : ''}`}
                    />
                    <span className={`text-[10px] font-black uppercase whitespace-nowrap w-full text-center h-5 leading-tight transition-colors ${isActive ? 'text-sky-blue' : 'text-gray-300'}`}>
                      {i % 5 === 0 ? new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric' }).format(dateObj) : ''}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 pt-6 border-t-2 border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.stats.totalCards}</p>
                  <p className="text-xl font-black text-gray-700">{overview?.total_cards || 0}</p>
                </div>
                <div className="w-px h-8 bg-gray-100" />
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.stats.dueCards}</p>
                  <p className="text-xl font-black text-orange-500">{overview?.cards_due_today || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <span>{t.stats.less}</span>
                <div className="w-3 h-3 bg-gray-100 rounded-sm border border-gray-200" />
                <div className="w-3 h-3 bg-green-100 rounded-sm border border-green-200" />
                <div className="w-3 h-3 bg-green-300 rounded-sm border border-green-400" />
                <div className="w-3 h-3 bg-feather-green rounded-sm border border-feather-green-dark" />
                <span>{t.stats.more}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Recent History */}
        <section className="space-y-6">
          <div className="card-duo p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-gray-700 flex items-center gap-2">
                <History className="w-6 h-6 text-sky-blue" />
                {t.stats.recentHistory}
              </h3>
            </div>

            {/* Tab Switcher */}
            <div className="flex p-1 bg-gray-100 rounded-2xl mb-6">
              <button
                onClick={() => setHistoryTab('study')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${historyTab === 'study' ? 'bg-white text-sky-blue shadow-sm' : 'text-gray-400 hover:text-gray-500'}`}
              >
                {t.stats.studySessions}
              </button>
              <button
                onClick={() => setHistoryTab('ai')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${historyTab === 'ai' ? 'bg-white text-purple-500 shadow-sm' : 'text-gray-400 hover:text-gray-500'}`}
              >
                {t.stats.aiHistory}
              </button>
            </div>

            <div className="space-y-4 flex-1 overflow-auto max-h-[500px] pr-2 custom-scrollbar">
              {historyTab === 'study' ? (
                (!sessions || sessions.length === 0) ? (
                  <div className="text-center py-10 opacity-50">
                    <p className="font-bold text-gray-400">{t.stats.noSessions}</p>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div key={session.id} className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 hover:border-sky-100 transition-colors group flex flex-col gap-3">
                      <div className="flex justify-between items-center gap-2">
                        <p className="font-black text-gray-700 truncate flex-1">{session.deck_title}</p>
                        <span className="shrink-0 text-[10px] font-black text-gray-400 uppercase tracking-wider bg-white px-2.5 py-1.5 rounded-xl border border-gray-100 shadow-sm">
                          {new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric' }).format(new Date(session.started_at))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-xs font-bold text-gray-500">
                            <BookOpen className="w-3 h-3" />
                            {session.cards_studied}
                          </div>
                          <div className="flex items-center gap-1 text-xs font-bold text-gray-500">
                            <Clock className="w-3 h-3" />
                            {formatDuration(session.duration)}
                          </div>
                        </div>
                        <Link
                          to={`/decks/${session.deck_id}/study?mode=sandbox`}
                          className="text-[10px] font-black text-sky-blue uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-white px-3 py-1.5 rounded-lg border border-sky-100 shadow-sm hover:bg-sky-50"
                        >
                          {t.stats.reStudy}
                        </Link>
                      </div>
                    </div>
                  ))
                )
              ) : (
                (!aiHistory || aiHistory.length === 0) ? (
                  <div className="text-center py-10 opacity-50">
                    <p className="font-bold text-gray-400">{t.stats.noAiHistory}</p>
                  </div>
                ) : (
                  aiHistory.map((item) => (
                    <Link
                      key={item.id}
                      to={`/decks/${item.deck_id}`}
                      className="p-4 bg-purple-50/30 rounded-2xl border-2 border-purple-100 hover:border-purple-300 transition-colors group block"
                    >
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-3 h-3 text-purple-500" />
                            <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{t.stats.aiHistory}</span>
                          </div>
                          <p className="font-black text-gray-700 truncate">{item.deck_title || t.stats.aiDeckTitle}</p>
                        </div>
                        <span className="shrink-0 text-[10px] font-black text-gray-400 uppercase tracking-wider bg-white px-2.5 py-1.5 rounded-xl border border-gray-100 shadow-sm">
                          {new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric' }).format(new Date(item.created_at))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                          <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                          <span>{item.card_count} {t.stats.aiCardCount}</span>
                        </div>
                        <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                          {t.stats.viewDetails}
                        </span>
                      </div>
                    </Link>
                  ))
                )
              )}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
