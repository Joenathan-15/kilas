import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { t } = useTranslation();
  const { login, isAuthenticated, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    try {
      await login(email, password);
      toast.success(t.auth.welcomeBack);
      navigate('/dashboard');
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.details) {
        setValidationErrors(data.details);
        toast.error(t.auth.checkForm);
      } else {
        toast.error(data?.error || t.auth.loginFailed);
      }
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-surface p-8 rounded-2xl border-2 border-gray-200">

        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-feather-green tracking-tight flex items-center justify-center gap-2">
            <span>Kilas</span>
          </h1>
          <p className="text-gray-500 font-medium mt-2">{t.auth.loginSubtitle}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-2">
              {t.auth.email} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-100 border-2 border-transparent rounded-2xl focus:bg-white focus:border-sky-blue focus:ring-0 transition-colors font-semibold text-gray-700 placeholder-gray-400 outline-none"
                placeholder={t.auth.emailPlaceholder}
              />
            </div>
            {validationErrors.Email && (
              <p className="text-danger-red text-xs font-bold px-2">{validationErrors.Email}</p>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-2">
                {t.auth.password} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete='true'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-gray-100 border-2 border-transparent rounded-2xl focus:bg-white focus:border-sky-blue focus:ring-0 transition-colors font-semibold text-gray-700 placeholder-gray-400 outline-none"
                  placeholder={t.auth.passwordPlaceholder}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {validationErrors.Password && (
                <p className="text-danger-red text-xs font-bold px-2">{validationErrors.Password}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-4 text-lg mt-2"
              >
                {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : t.auth.login}
              </button>
            </div>
          </div>
        </form>

        <div className="mt-6 flex items-center justify-between">
          <span className="border-b-2 border-gray-200 w-1/5"></span>
          <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t.auth.or}</span>
          <span className="border-b-2 border-gray-200 w-1/5"></span>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="btn-ghost w-full py-3 mt-6 border-2 border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center gap-3 text-gray-600"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
            <path fill="none" d="M1 1h22v22H1z" />
          </svg>
          {t.auth.googleLogin}
        </button>

        <p className="mt-8 text-center text-gray-500 font-semibold">
          {t.auth.noAccount}{' '}
          <Link to="/register" className="text-sky-blue hover:text-sky-blue-dark">
            {t.auth.register}
          </Link>
        </p>
      </div>
    </div>
  );
}
