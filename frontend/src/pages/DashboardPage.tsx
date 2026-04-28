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
import type { OverviewStats, ActivityData, Deck } from '../types';

export default function DashboardPage() {
  const { user, fetchMe } = useAuthStore();
  const [isClaiming, setIsClaiming] = React.useState(false);

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
      toast.success(`Claimed ${res.data.reward} tokens! 🔥`, {
        icon: '🪙',
        duration: 5000,
      });
      await fetchMe();
      refetchStats();
    } catch (err: any) {
      console.error('Claim error:', err);
      const message = err?.response?.data?.error || err?.response?.data?.message || 'Failed to claim reward';
      toast.error(message);
    } finally {
      setIsClaiming(false);
    }
  };

  const { data: activity } = useQuery<{ data: ActivityData[] }>({
    queryKey: ['stats-activity'],
    queryFn: async () => {
      const res = await api.get('/stats/activity');
      return res.data;
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header: Streak & Goal */}
      <section className="card-duo p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 z-10">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-500 border-b-4 border-orange-200">
            <Flame className="w-10 h-10 fill-current" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-700">{user?.login_streak || 0} Day Streak!</h2>
            <button 
              onClick={handleClaimReward}
              disabled={isClaiming}
              className="mt-1 text-xs font-black text-orange-500 uppercase tracking-widest hover:text-orange-600 flex items-center gap-1 disabled:opacity-50"
            >
              {isClaiming ? 'Claiming...' : 'Claim Daily Reward 🪙'}
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
            className="card-duo p-5 flex items-center gap-4 group hover:-translate-y-0.5 transition-all bg-gradient-to-r from-feather-green/5 to-transparent border-feather-green/20"
          >
            <div className="w-14 h-14 bg-feather-green rounded-2xl flex items-center justify-center text-white shrink-0 border-b-4 border-feather-green-dark group-hover:scale-105 transition-transform">
              <BookOpen className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Continue Studying</p>
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
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Get Started</p>
              <p className="text-lg font-black text-gray-700">Create Your First Deck</p>
            </div>
            <ArrowRight className="w-6 h-6 text-sky-blue shrink-0 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<Clock className="text-sky-blue" />} 
          label="Due Today" 
          value={stats?.cards_due_today || 0} 
          color="bg-sky-50"
          borderColor="border-sky-100"
        />
        <StatCard 
          icon={<CheckCircle2 className="text-feather-green" />} 
          label="Mastered" 
          value={stats?.cards_mastered || 0} 
          color="bg-green-50"
          borderColor="border-green-100"
        />
        <StatCard 
          icon={<BookOpen className="text-purple-500" />} 
          label="Total Cards" 
          value={stats?.total_cards || 0} 
          color="bg-purple-50"
          borderColor="border-purple-100"
        />
        <StatCard 
          icon={<Coins className="text-gold" />} 
          label="Tokens Left" 
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
              Activity
            </h3>
            <span className="text-sm font-bold text-gray-400">Last 30 Days</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {activity?.data ? (
              activity.data.map((day, i) => (
                <div 
                  key={i}
                  title={`${day.date}: ${day.count} reviews`}
                  className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 cursor-pointer ${
                    day.count === 0 
                      ? 'bg-gray-50 border-gray-100' 
                      : day.count < 5 
                        ? 'bg-green-200 border-green-300' 
                        : 'bg-feather-green border-feather-green-dark'
                  }`}
                />
              ))
            ) : (
              Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-lg bg-gray-50 border-2 border-gray-100 animate-pulse" />
              ))
            )}
          </div>
        </section>

        {/* AI Suggestion */}
        <section className="card-duo p-6 bg-gradient-to-br from-purple-50 to-white border-purple-100 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-500 mb-4 border-b-4 border-purple-200">
              <Sparkles className="w-7 h-7 fill-current" />
            </div>
            <h3 className="text-xl font-black text-gray-700 mb-2">AI Magic</h3>
            <p className="text-gray-500 font-bold text-sm leading-relaxed">
              Stuck on what to learn next? Paste some text and let our AI generate a perfect flashcard deck for you!
            </p>
          </div>
          <Link to="/decks" className="btn-chunky bg-purple-500 text-white border-b-4 border-purple-700 hover:bg-purple-600 py-3 mt-6 text-sm">
            GENERATE CARDS
          </Link>
        </section>

      </div>

    </div>
  );
}

function StatCard({ icon, label, value, color, borderColor }: { icon: React.ReactNode, label: string, value: number | string, color: string, borderColor: string }) {
  return (
    <div className={`card-duo p-4 flex flex-col items-center text-center group hover:-translate-y-1 transition-transform`}>
      <div className={`w-12 h-12 ${color} ${borderColor} border-2 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
        {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
      </div>
      <p className="text-2xl font-black text-gray-700">{value}</p>
      <p className="text-xs font-black text-gray-400 uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}
