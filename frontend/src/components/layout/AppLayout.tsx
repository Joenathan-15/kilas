import React, { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { getFullImageUrl } from '../../lib/api';
import { LayoutDashboard, Layers, BookOpen, BarChart2, LogOut, User, ShoppingBag, ChevronUp } from 'lucide-react';

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard /> },
    { to: '/decks', label: 'My Decks', icon: <Layers /> },
    { to: '/library', label: 'Library', icon: <BookOpen /> },
    { to: '/stats', label: 'Stats', icon: <BarChart2 /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-surface border-r-2 border-gray-200 z-50">
        <div className="p-6">
          <h1 className="text-3xl font-black text-feather-green tracking-tight flex items-center gap-2">
            <span>Kilas</span>
            <span className="text-2xl">🪶</span>
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-2xl font-bold transition-all border-2 ${
                  isActive
                    ? 'bg-sky-100 text-sky-blue border-sky-200'
                    : 'text-gray-500 border-transparent hover:bg-gray-100'
                }`
              }
            >
              {React.cloneElement(link.icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t-2 border-gray-200 relative">
          {/* Profile Menu Popup */}
          {isProfileOpen && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border-2 border-gray-100 rounded-2xl shadow-xl p-2 animate-in slide-in-from-bottom-2 duration-200 z-50">
              <Link 
                to="/shop" 
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 text-gray-600 hover:text-orange-500 transition-colors font-bold"
              >
                <ShoppingBag className="w-5 h-5" />
                Shop
              </Link>
              <Link 
                to="/profile" 
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sky-50 text-gray-600 hover:text-sky-blue transition-colors font-bold"
              >
                <User className="w-5 h-5" />
                Edit Profile
              </Link>
              <div className="h-px bg-gray-100 my-1" />
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-gray-400 hover:text-danger-red transition-colors font-bold text-left"
              >
                <LogOut className="w-5 h-5" />
                Log Out
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
              className="w-10 h-10 rounded-full border-2 border-gray-200 object-cover" 
            />
            <div className="flex-1 min-w-0 text-left">
              <p className="font-bold text-gray-700 truncate">{user?.username}</p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-400 font-bold flex items-center gap-1">
                  <span className="text-gold">🔥</span> {user?.login_streak || 0}
                </p>
                <p className="text-xs text-gray-400 font-bold flex items-center gap-1">
                  <span className="text-yellow-500 text-sm">🪙</span> {user?.tokens || 0}
                </p>
              </div>
            </div>
            <ChevronUp className={`w-4 h-4 text-gray-300 transition-transform ${isProfileOpen ? 'rotate-0' : 'rotate-180'}`} />
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="md:hidden sticky top-0 bg-surface border-b-2 border-gray-200 z-40 px-4 py-3 flex items-center justify-between">
        <h1 className="text-2xl font-black text-feather-green tracking-tight flex items-center gap-1">
          <span>Kilas</span>
        </h1>
        <div className="relative">
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2"
          >
            <span className="text-sm font-bold text-gray-400 flex items-center gap-1">
              <span className="text-gold text-lg">🔥</span> {user?.login_streak || 0}
            </span>
            <span className="text-sm font-bold text-gray-400 flex items-center gap-1">
              <span className="text-yellow-500 text-lg">🪙</span> {user?.tokens || 0}
            </span>
            <img 
              src={getFullImageUrl(user?.avatar_url, user?.username)} 
              alt="Avatar" 
              className="w-8 h-8 rounded-full border-2 border-gray-200 object-cover" 
            />
          </button>

          {/* Mobile Profile Menu */}
          {isProfileOpen && (
            <div className="absolute top-full right-0 mt-2 bg-white border-2 border-gray-100 rounded-2xl shadow-xl p-2 animate-in slide-in-from-top-2 duration-200 z-50 w-48">
              <Link 
                to="/shop" 
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 text-gray-600 hover:text-orange-500 transition-colors font-bold"
              >
                <ShoppingBag className="w-5 h-5" />
                Shop
              </Link>
              <Link 
                to="/profile" 
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sky-50 text-gray-600 hover:text-sky-blue transition-colors font-bold"
              >
                <User className="w-5 h-5" />
                Profile
              </Link>
              <div className="h-px bg-gray-100 my-1" />
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-gray-400 hover:text-danger-red transition-colors font-bold text-left"
              >
                <LogOut className="w-5 h-5" />
                Log Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="md:ml-64 p-4 md:p-8 pb-24 md:pb-8 max-w-5xl mx-auto">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-surface border-t-2 border-gray-200 z-50 px-2 py-2 flex justify-around">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex flex-col items-center p-2 rounded-2xl transition-colors ${
                isActive ? 'text-sky-blue' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            {React.cloneElement(link.icon as React.ReactElement<any>, { className: 'w-6 h-6 mb-1' })}
            <span className="text-[10px] font-bold uppercase tracking-wider">{link.label}</span>
          </NavLink>
        ))}
      </nav>
      
    </div>
  );
}
