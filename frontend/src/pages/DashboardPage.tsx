import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import {
  Flame,
  Coins,
  Calendar,
  BookOpen,
  Plus,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { usePageTitle } from '../hooks/usePageTitle';
import type { OverviewStats, ActivityData, Deck } from '../types';

export default function DashboardPage() {
  const { user, fetchMe } = useAuthStore();
  const { t, lang } = useTranslation();
  const [isClaiming, setIsClaiming] = React.useState(false);
  const [activeDayIdx, setActiveDayIdx] = React.useState<number | null>(null);

  usePageTitle(t.nav.dashboard);

  const { data: stats, refetch: refetchStats } = useQuery<OverviewStats>({
    queryKey: ['stats-overview'],
    queryFn: async () => {
      const res = await api.get('/stats/overview');
      return res.data;
    },
  });

  const handleClaimReward = async () => {
    setIsClaiming(true);
    try {
      const res = await api.post('/auth/daily-login');
      toast.success(t.common.claimedTokens.replace('{amount}', res.data.reward.toString()), {
        icon: <Coins className="w-5 h-5 text-gold" />,
        duration: 5000,
      });
      await fetchMe();
      refetchStats();
    } catch (err: any) {
      console.error('Claim error:', err);
      toast.error(t.common.claimError);
    } finally {
      setIsClaiming(false);
    }
  };

  const { data: activityData } = useQuery<ActivityData[]>({
    queryKey: ['stats-activity'],
    queryFn: async () => {
      const res = await api.get('/stats/activity');
      return res.data.data;
    },
  });

  const { data: decks } = useQuery<{ data: Deck[] }>({
    queryKey: ['decks'],
    queryFn: async () => {
      const res = await api.get('/decks');
      return res.data;
    },
  });

  const bestDeck = decks?.data?.find(d => d.card_count > 0);

  const isClaimedToday = user?.last_login_date ? (
    new Date(user.last_login_date).toDateString() === new Date().toDateString()
  ) : false;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" onClick={() => setActiveDayIdx(null)}>

      {/* Header: Streak & Goal */}
      <section className="card-duo p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 z-10">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-500 border-b-4 border-orange-200">
            <Flame className="w-10 h-10 fill-current" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-700">{user?.login_streak || 0} {t.dashboard.dayStreak}</h2>
            <button
              onClick={handleClaimReward}
              disabled={isClaiming || isClaimedToday}
              className={`mt-2 px-4 py-2 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border-b-4 active:border-b-0 active:translate-y-1 ${isClaimedToday
                ? 'bg-green-50 text-feather-green border-green-200 cursor-default'
                : 'bg-orange-500 text-white border-orange-700 hover:bg-orange-600 animate-pulse'
                } disabled:opacity-70 disabled:translate-y-0 disabled:border-b-4`}
            >
              {isClaiming ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isClaimedToday ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Coins className="w-4 h-4" />
              )}
              <span className="text-[10px]">
                {isClaiming ? t.dashboard.claiming : isClaimedToday ? t.dashboard.claimedToday : t.dashboard.claimReward}
              </span>
            </button>
          </div>
        </div>

        <div className="hidden md:block">
          <p className="text-gray-400 font-bold text-right italic">"The expert in anything was once a beginner."</p>
        </div>
      </section>

      {/* Primary CTA */}
      <section>
        {bestDeck ? (
          <Link
            to={`/decks/${bestDeck.id}/study`}
            className="card-duo p-5 flex items-center gap-4 group hover:-translate-y-0.5 transition-all bg-linear-to-r from-feather-green/5 to-transparent border-feather-green/20"
          >
            <div className="w-14 h-14 bg-feather-green rounded-2xl flex items-center justify-center text-white shrink-0 border-b-4 border-feather-green-dark group-hover:scale-105 transition-transform">
              <BookOpen className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.dashboard.continueStudying}</p>
              <p className="text-lg font-black text-gray-700 truncate">{bestDeck.title}</p>
            </div>
            <ArrowRight className="w-6 h-6 text-feather-green shrink-0 group-hover:translate-x-1 transition-transform" />
          </Link>
        ) : (
          <Link
            to="/decks"
            className="card-duo p-5 flex items-center gap-4 group hover:-translate-y-0.5 transition-all"
          >
            <div className="w-14 h-14 bg-sky-blue rounded-2xl flex items-center justify-center text-white shrink-0 border-b-4 border-sky-700 group-hover:scale-105 transition-transform">
              <Plus className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.dashboard.getStarted}</p>
              <p className="text-lg font-black text-gray-700">{t.dashboard.createFirstDeck}</p>
            </div>
            <ArrowRight className="w-6 h-6 text-sky-blue shrink-0 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Clock className="text-sky-blue" />}
          label={t.dashboard.dueToday}
          value={stats?.cards_due_today || 0}
          color="bg-sky-50"
          borderColor="border-sky-100"
        />
        <StatCard
          icon={<CheckCircle2 className="text-feather-green" />}
          label={t.dashboard.mastered}
          value={stats?.cards_mastered || 0}
          color="bg-green-50"
          borderColor="border-green-100"
        />
        <StatCard
          icon={<BookOpen className="text-purple-500" />}
          label={t.dashboard.totalCards}
          value={stats?.total_cards || 0}
          color="bg-purple-50"
          borderColor="border-purple-100"
        />
        <StatCard
          icon={<Coins className="text-gold" />}
          label={t.dashboard.tokensLeft}
          value={user?.tokens || 0}
          color="bg-yellow-50"
          borderColor="border-yellow-100"
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Activity Heatmap */}
        <section className="lg:col-span-2 card-duo p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-gray-700 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-feather-green" />
              {t.dashboard.activity}
            </h3>
            <span className="text-sm font-bold text-gray-400">{t.dashboard.last30Days}</span>
          </div>

          <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
            {activityData ? (
              activityData.map((day, i) => {
                const colors = [
                  'bg-gray-100 border-gray-200', // 0
                  'bg-green-200 border-green-300', // 1-2
                  'bg-green-400 border-green-500', // 3-9
                  'bg-feather-green border-feather-green-dark', // 10+
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
                    className="relative"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDayIdx(isActive ? null : i);
                    }}
                  >
                    {/* Tooltip */}
                    {isActive && (
                      <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-50 animate-in zoom-in-95 duration-200">
                        <div className="bg-gray-800 text-white p-3 rounded-2xl shadow-xl border-2 border-gray-700 w-32 text-center pointer-events-none">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                            {new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(dateObj)}
                          </p>
                          <p className="text-sm font-black whitespace-nowrap">
                            {day.count} {t.dashboard.reviews}
                          </p>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-800" />
                        </div>
                      </div>
                    )}

                    <div
                      className={`w-7 h-7 md:w-9 md:h-9 rounded-lg border-2 transition-all hover:scale-110 cursor-pointer ${colors[colorIdx]} ${isActive ? 'ring-4 ring-sky-blue/20 scale-110 border-sky-blue' : ''}`}
                    />
                  </div>
                );
              })
            ) : (
              Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="w-7 h-7 md:w-9 md:h-9 rounded-lg bg-gray-50 border-2 border-gray-100 animate-pulse" />
              ))
            )}
          </div>

          <div className="mt-6 flex items-center justify-end gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <span>Less</span>
            <div className="w-3 h-3 bg-gray-100 rounded-sm border border-gray-200" />
            <div className="w-3 h-3 bg-green-100 rounded-sm border border-green-200" />
            <div className="w-3 h-3 bg-green-300 rounded-sm border border-green-400" />
            <div className="w-3 h-3 bg-feather-green rounded-sm border border-feather-green-dark" />
            <span>More</span>
          </div>
        </section>

        {/* AI Suggestion */}
        <section className="card-duo p-6 bg-linear-to-br from-purple-50 to-white border-purple-100 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-500 mb-4 border-b-4 border-purple-200">
              <Sparkles className="w-7 h-7 fill-current" />
            </div>
            <h3 className="text-xl font-black text-gray-700 mb-2">{t.dashboard.aiMagic}</h3>
            <p className="text-gray-500 font-bold text-sm leading-relaxed">
              {t.dashboard.aiDescription}
            </p>
          </div>
          <Link to="/decks" className="btn-chunky bg-purple-500 text-white border-b-4 border-purple-700 hover:bg-purple-600 py-3 mt-6 text-sm">
            {t.dashboard.generateCards}
          </Link>
        </section>

      </div>

    </div>
  );
}

function StatCard({ icon, label, value, color, borderColor }: { icon: React.ReactNode, label: string, value: number | string, color: string, borderColor: string }) {
  return (
    <div className={`card-duo p-3 flex flex-col items-center text-center group hover:-translate-y-1 transition-transform`}>
      <div className={`w-10 h-10 ${color} ${borderColor} border-2 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
        {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
      </div>
      <p className="text-2xl font-black text-gray-700">{value}</p>
      <p className="text-xs font-black text-gray-400 uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}
