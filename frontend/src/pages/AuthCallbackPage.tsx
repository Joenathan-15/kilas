import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setTokens } = useAuthStore();
  const { t } = useTranslation();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (!accessToken || !refreshToken) {
      toast.error(t.auth.loginFailed);
      navigate('/login');
      return;
    }

    const completeLogin = async () => {
      processed.current = true;
      try {
        await setTokens(accessToken, refreshToken);
        toast.success(t.auth.welcomeBack);
        navigate('/dashboard');
      } catch (err) {
        console.error('OAuth callback error:', err);
        toast.error(t.auth.loginFailed);
        navigate('/login');
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
