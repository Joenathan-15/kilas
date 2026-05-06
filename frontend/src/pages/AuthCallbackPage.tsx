import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { usePageTitle } from '../hooks/usePageTitle';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setTokens } = useAuthStore();
  const { t } = useTranslation();
  const processed = useRef(false);

  usePageTitle('Authenticating...');

  useEffect(() => {
    if (processed.current) return;

    // Try to get tokens from query string first, then from hash
    let accessToken = searchParams.get('access_token');
    let refreshToken = searchParams.get('refresh_token');

    // Fallback: check hash (some OAuth implementations use fragments)
    if (!accessToken || !refreshToken) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      accessToken = accessToken || params.get('access_token');
      refreshToken = refreshToken || params.get('refresh_token');
    }

    if (!accessToken || !refreshToken) {
      console.warn('Missing tokens in OAuth callback URL');
      toast.error(t.auth.loginFailed);
      navigate('/login');
      return;
    }

    const completeLogin = async () => {
      processed.current = true;
      try {
        await setTokens(accessToken!, refreshToken!);
        toast.success(t.auth.welcomeBack);
        // Use replace to prevent back navigation to the callback page
        navigate('/dashboard', { replace: true });
      } catch (err) {
        console.error('OAuth callback error:', err);
        toast.error(t.auth.loginFailed);
        navigate('/login', { replace: true });
      }
    };

    completeLogin();
  }, [searchParams, navigate, setTokens, t]);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 text-feather-green animate-spin mx-auto" />
        <h1 className="text-2xl font-black text-gray-700 tracking-tight">
          Authenticating...
        </h1>
        <p className="text-gray-500 font-medium">
          Completing your sign-in, please wait a moment.
        </p>
      </div>
    </div>
  );
}
