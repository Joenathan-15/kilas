import React, { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { getFullImageUrl } from '../../lib/api';
import { useUIStore } from '../../stores/uiStore';
import { useTranslation } from '../../hooks/useTranslation';
import { LayoutDashboard, Layers, BookOpen, BarChart2, LogOut, User, ShoppingBag, ChevronUp, Loader2, Sparkles, MessageSquare, Coins, WifiOff } from 'lucide-react';
import ReportIssueModal from '../common/ReportIssueModal';
import GuidedTour from '../onboarding/GuidedTour';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import toast from 'react-hot-toast';

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const { activeGenerations } = useUIStore();
  const { t } = useTranslation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const isSubscribed = user?.subscription_until && new Date(user.subscription_until) > new Date();
  const { isOnline } = useOnlineStatus();
  const [wasOffline, setWasOffline] = useState(false);

  // Show toast when coming back online
  React.useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setWasOffline(false);
      toast.success(t.offline.backOnline, { icon: '🌐', id: 'online-toast' });
    }
  }, [isOnline]);

  const navLinks = [
    { to: '/dashboard', label: t.nav.dashboard, icon: <LayoutDashboard /> },
    { to: '/decks', label: t.nav.myDecks, icon: <Layers /> },
    { to: '/library', label: t.nav.library, icon: <BookOpen /> },
    { to: '/stats', label: t.nav.stats, icon: <BarChart2 /> },
    { to: '/shop', label: t.nav.shop, icon: <ShoppingBag /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <GuidedTour />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-surface border-r-2 border-gray-200 z-50">
        <div className="p-6">
          <h1 className="text-3xl font-black text-feather-green tracking-tight flex items-center gap-2">
            <img src="/logo.png" alt="Kilas Logo" className="h-8 w-auto" />
            <span>Kilas</span>
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-2xl font-bold transition-all border-2 ${isActive
                  ? 'bg-emerald-50 text-feather-green border-emerald-100'
                  : 'text-gray-500 border-transparent hover:bg-gray-100'
                }`
              }
            >
              {React.cloneElement(link.icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* AI Generation Queue */}
        {activeGenerations.length > 0 && (
          <div className="px-6 py-4 mt-4 space-y-3">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">AI Queue</h3>
            {activeGenerations.map((gen) => (
              <div key={gen.id} className="bg-purple-50 border-2 border-purple-100 rounded-2xl p-3 flex items-center gap-3 animate-pulse">
                <div className="bg-purple-100 p-2 rounded-xl text-purple-500">
                  <Sparkles className="w-4 h-4 fill-current" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-gray-700 truncate">{gen.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Loader2 className="w-2.5 h-2.5 text-purple-400 animate-spin" />
                    <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wider">Generating...</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-4 border-t-2 border-gray-200 relative">
          {/* Profile Menu Popup */}
          {isProfileOpen && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border-2 border-gray-100 rounded-2xl shadow-xl p-2 animate-in slide-in-from-bottom-2 duration-200 z-50">

              <Link
                to="/profile"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-emerald-50 text-gray-600 hover:text-feather-green transition-colors font-bold"
              >
                <User className="w-5 h-5" />
                {t.nav.profile}
              </Link>
              <button
                onClick={() => {
                  setIsReportModalOpen(true);
                  setIsProfileOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-emerald-50 text-gray-600 hover:text-feather-green transition-colors font-bold text-left"
              >
                <MessageSquare className="w-5 h-5" />
                {t.common.reportIssue}
              </button>
              <div className="h-px bg-gray-100 my-1" />
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-gray-400 hover:text-danger-red transition-colors font-bold text-left"
              >
                <LogOut className="w-5 h-5" />
                {t.nav.logout}
              </button>
            </div>
          )}

          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`w-full flex items-center gap-3 px-2 py-3 rounded-2xl transition-all ${isProfileOpen ? 'bg-gray-50 ring-2 ring-gray-100' : 'hover:bg-gray-50'}`}
          >
            <img
              src={getFullImageUrl(user?.avatar_url, user?.username)}
              alt="Avatar"
              className={`w-10 h-10 rounded-full border-2 object-cover ${isSubscribed ? 'border-yellow-400' : 'border-gray-200'}`}
            />
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2">
                <p className="font-bold text-gray-700 truncate">{user?.username}</p>
                {isSubscribed && (
                  <span className="bg-yellow-400 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none tracking-tighter">SUPER</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-400 font-bold flex items-center gap-1">
                  <span className="text-gold">🔥</span> {user?.login_streak || 0}
                </p>
                <p className="text-xs text-gray-400 font-bold flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-gold" /> {user?.tokens || 0}
                </p>
              </div>
            </div>
            <ChevronUp className={`w-4 h-4 text-gray-300 transition-transform ${isProfileOpen ? 'rotate-0' : 'rotate-180'}`} />
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="md:hidden sticky top-0 bg-surface border-b-2 border-gray-200 z-40 px-4 py-3 flex items-center justify-between">
        <h1 className="text-2xl font-black text-feather-green tracking-tight flex items-center gap-2">
          <img src="/logo.png" alt="Kilas Logo" className="h-7 w-auto" />
          <span>Kilas</span>
        </h1>
        <Link to="/shop" className="flex items-center gap-3 hover:bg-gray-50 p-1.5 -mr-1.5 rounded-xl transition-colors">
          <span className="text-sm font-bold text-gray-400 flex items-center gap-1">
            <span className="text-gold text-lg">🔥</span> {user?.login_streak || 0}
          </span>
          <span className="text-sm font-bold text-gray-400 flex items-center gap-1">
            <Coins className="w-4 h-4 text-gold" /> {user?.tokens || 0}
          </span>
        </Link>

        {/* Mobile top bar content remains clean */}
      </header>

      {/* Offline Banner */}
      {!isOnline && (
        <div className="md:ml-64 bg-amber-50 border-b-2 border-amber-200 px-4 py-2.5 flex items-center justify-center gap-2 text-amber-700">
          <WifiOff className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-widest">{t.offline.banner}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="md:ml-64 p-4 md:p-8 pb-24 md:pb-8 max-w-5xl mx-auto">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation (Icon Only, 5 Tabs) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-[80] px-6 py-2 flex justify-between items-center pb-safe shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        {[
          { to: '/dashboard', icon: <LayoutDashboard /> },
          { to: '/decks', icon: <Layers /> },
          { to: '/library', icon: <BookOpen /> },
          { to: '/stats', icon: <BarChart2 /> },
          { to: '/profile', isAvatar: true },
        ].map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `tour-step-${link.to.substring(1)} p-3.5 rounded-2xl transition-all duration-200 ${isActive ? 'bg-emerald-50 text-feather-green scale-110 shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`
            }
          >
            {link.isAvatar ? (
              <div className={`relative rounded-full p-[2px] transition-colors ${isSubscribed ? 'bg-gradient-to-tr from-yellow-300 to-yellow-500' : 'bg-transparent'}`}>
                <img
                  src={getFullImageUrl(user?.avatar_url, user?.username)}
                  alt="Profile"
                  className="w-6 h-6 rounded-full object-cover bg-white"
                />
                {isSubscribed && (
                  <div className="absolute -top-1 -right-1 bg-yellow-400 text-white text-[7px] font-black px-1 py-0.5 rounded-full border border-white shadow-sm">
                    S
                  </div>
                )}
              </div>
            ) : (
              React.cloneElement(link.icon as React.ReactElement<any>, { className: 'w-6 h-6' })
            )}
          </NavLink>
        ))}
      </nav>

      <ReportIssueModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
}
