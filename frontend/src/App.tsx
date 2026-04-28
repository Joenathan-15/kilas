import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import DecksPage from './pages/DecksPage';
import DeckDetailsPage from './pages/DeckDetailsPage';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

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
          <Route path="/library" element={
            <div className="flex flex-col items-center justify-center h-64 border-4 border-dashed border-gray-200 rounded-3xl mt-12">
              <span className="text-4xl mb-4">📚</span>
              <h2 className="text-xl font-bold text-gray-500">Library screen under construction</h2>
            </div>
          } />
          <Route path="/stats" element={
            <div className="flex flex-col items-center justify-center h-64 border-4 border-dashed border-gray-200 rounded-3xl mt-12">
              <span className="text-4xl mb-4">📈</span>
              <h2 className="text-xl font-bold text-gray-500">Stats screen under construction</h2>
            </div>
          } />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
