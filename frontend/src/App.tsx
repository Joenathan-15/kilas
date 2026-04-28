import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import DecksPage from './pages/DecksPage';
import DeckDetailsPage from './pages/DeckDetailsPage';
import LibraryPage from './pages/LibraryPage';
import StudyPage from './pages/StudyPage';
import StatsPage from './pages/StatsPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import { ShoppingBag } from 'lucide-react';

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Protected Routes inside AppLayout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/decks" element={<DecksPage />} />
          <Route path="/decks/:id" element={<DeckDetailsPage />} />
          <Route path="/decks/:id/study" element={<StudyPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/shop" element={
            <div className="flex flex-col items-center justify-center h-64 border-4 border-dashed border-gray-200 rounded-3xl mt-12">
              <ShoppingBag className="w-12 h-12 text-orange-500 mb-4" />
              <h2 className="text-xl font-bold text-gray-500 text-center px-6">The Kilas Shop is opening soon!<br/><span className="text-sm font-normal">Spend your 🪙 tokens on exclusive themes and power-ups.</span></h2>
            </div>
          } />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
