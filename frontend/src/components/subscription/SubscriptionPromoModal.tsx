import { X, Sparkles, Zap, Shield, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SubscriptionPromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
}

export default function SubscriptionPromoModal({ isOpen, onClose, reason }: SubscriptionPromoModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <div className="bg-white w-full max-w-xl rounded-[3rem] border-b-8 border-gray-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200 shadow-2xl">
        {/* Header with Gradient */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles className="w-32 h-32" />
          </div>

          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Zap className="w-7 h-7 fill-current text-yellow-300" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight">Kilas Pro</h2>
          </div>

          <p className="text-purple-100 font-bold text-lg leading-tight max-w-md">
            {reason || "You've reached your daily AI limit. Unlock unlimited potential with Kilas Pro!"}
          </p>
        </div>

        {/* Benefits Section */}
        <div className="p-10 space-y-8">
          <div className="flex flex-col gap-6">
            <div className="flex gap-5 items-center">
              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex-shrink-0 flex items-center justify-center text-purple-600 border-2 border-purple-100">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-black text-gray-700 text-base uppercase">Unlimited AI Usage</h4>
                <p className="text-xs font-bold text-gray-400 mt-0.5">Generate unlimited decks and cards without daily caps.</p>
              </div>
            </div>

            <div className="flex gap-5 items-center">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex-shrink-0 flex items-center justify-center text-blue-600 border-2 border-blue-100">
                <Zap className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-black text-gray-700 text-base uppercase">10% Token Discount</h4>
                <p className="text-xs font-bold text-gray-400 mt-0.5">Enjoy a permanent 10% discount on all token-based actions.</p>
              </div>
            </div>

            <div className="flex gap-5 items-center">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex-shrink-0 flex items-center justify-center text-orange-600 border-2 border-orange-100">
                <Rocket className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-black text-gray-700 text-base uppercase">Early Access</h4>
                <p className="text-xs font-bold text-gray-400 mt-0.5">Be the first to try our upcoming AI study features.</p>
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-4">
            <button
              onClick={() => {
                navigate('/shop');
                onClose();
              }}
              className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black rounded-3xl border-b-8 border-indigo-900 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-3 text-xl shadow-xl shadow-purple-200"
            >
              UPGRADE NOW
            </button>
            <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
              Starting from just Rp250.000/month
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
