import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from '../hooks/useTranslation';
import { BrainCircuit, Sparkles, Library, Search, CalendarCheck, Trophy, Calculator, Microscope, Landmark, Globe, Code, Scale, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollBanner = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = window.innerWidth > 768 ? 400 : 250;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Header */}
      <header className="w-full bg-surface border-b-2 border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-feather-green tracking-tight flex items-center gap-2">
              <img src="/logo.png" alt="Kilas Logo" className="h-10 w-auto" />
              Kilas
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 px-4 flex justify-center">
          <div className="max-w-5xl w-full mx-auto flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24">
            {/* Mascot Image */}
            <div className="w-full md:w-1/2 flex justify-center">
              <img
                src="/learning_crow.png"
                alt="Learning Mascot"
                className="max-w-[280px] md:max-w-[400px] w-full object-contain animate-float"
              />
            </div>

            {/* Text & Action Buttons */}
            <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-700 mb-10 leading-tight tracking-tight">
                {t.landing.tagline}
              </h2>

              <div className="flex flex-col w-full max-w-[320px] gap-4">
                <Link
                  to="/register"
                  className="btn-primary w-full py-4 text-lg"
                >
                  {t.landing.getStarted}
                </Link>

                <Link
                  to="/login"
                  className="btn-ghost w-full py-4 text-lg border-2 border-gray-200 bg-white hover:bg-gray-50 text-sky-blue hover:text-sky-blue-dark shadow-sm"
                >
                  {t.landing.haveAccount}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Subjects Bar */}
        <section className="w-full border-t-2 border-b-2 border-gray-200 bg-surface overflow-hidden relative flex items-center h-16">
          <button 
            onClick={() => scrollBanner('left')}
            className="flex absolute left-0 top-0 bottom-0 w-12 md:w-16 bg-gradient-to-r from-surface to-transparent z-10 items-center justify-start pl-1 md:pl-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 drop-shadow-sm" />
          </button>
          <button 
            onClick={() => scrollBanner('right')}
            className="flex absolute right-0 top-0 bottom-0 w-12 md:w-16 bg-gradient-to-l from-surface to-transparent z-10 items-center justify-end pr-1 md:pr-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6 drop-shadow-sm" />
          </button>
          <div 
            ref={scrollContainerRef}
            className="w-full overflow-x-auto flex items-center scroll-smooth" 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex gap-12 md:gap-24 items-center mx-auto px-12 py-4 w-max">
              {[
                { name: t.landing.subjMath, icon: Calculator, color: 'text-blue-500' },
                { name: t.landing.subjScience, icon: Microscope, color: 'text-emerald-500' },
                { name: t.landing.subjHistory, icon: Landmark, color: 'text-amber-600' },
                { name: t.landing.subjGeography, icon: Globe, color: 'text-sky-500' },
                { name: t.landing.subjLanguages, icon: MessageCircle, color: 'text-rose-500' },
                { name: t.landing.subjProgramming, icon: Code, color: 'text-indigo-500' },
                { name: t.landing.subjLaw, icon: Scale, color: 'text-slate-700' },
              ].map((subject, idx) => {
                const Icon = subject.icon;
                return (
                  <div key={idx} className="flex items-center gap-2 flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity cursor-default">
                    <Icon className={`w-7 h-7 ${subject.color}`} />
                    <span className="font-bold text-gray-500 text-sm tracking-widest uppercase mt-0.5">{subject.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-16 px-4 bg-surface border-t-2 border-gray-200 flex justify-center">
          <div className="max-w-5xl w-full mx-auto">
            <h3 className="text-2xl md:text-3xl font-black text-center text-gray-800 mb-12 tracking-tight">
              {t.landing.featuresTitle}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6 border-2 border-gray-200 rounded-3xl bg-white shadow-sm hover:-translate-y-1 transition-transform">
                <div className="w-16 h-16 bg-blue-100 text-sky-blue rounded-2xl flex items-center justify-center mb-6">
                  <BrainCircuit className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-3">{t.landing.feature1Title}</h4>
                <p className="text-gray-500 font-medium">{t.landing.feature1Desc}</p>
              </div>

              <div className="flex flex-col items-center text-center p-6 border-2 border-gray-200 rounded-3xl bg-white shadow-sm hover:-translate-y-1 transition-transform">
                <div className="w-16 h-16 bg-emerald-100 text-feather-green rounded-2xl flex items-center justify-center mb-6">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-3">{t.landing.feature2Title}</h4>
                <p className="text-gray-500 font-medium">{t.landing.feature2Desc}</p>
              </div>

              <div className="flex flex-col items-center text-center p-6 border-2 border-gray-200 rounded-3xl bg-white shadow-sm hover:-translate-y-1 transition-transform">
                <div className="w-16 h-16 bg-amber-100 text-gold rounded-2xl flex items-center justify-center mb-6">
                  <Library className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-3">{t.landing.feature3Title}</h4>
                <p className="text-gray-500 font-medium">{t.landing.feature3Desc}</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="w-full py-16 px-4 flex justify-center">
          <div className="max-w-5xl w-full mx-auto">
            <h3 className="text-2xl md:text-3xl font-black text-center text-gray-800 mb-12 tracking-tight">
              {t.landing.howItWorksTitle}
            </h3>

            <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch">
              <div className="flex-1 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full border-4 border-gray-200 bg-white flex items-center justify-center mb-4 z-10 text-gray-400">
                  <Search className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-gray-800 mb-2">{t.landing.step1Title}</h4>
                <p className="text-gray-500 font-medium max-w-xs">{t.landing.step1Desc}</p>
              </div>

              <div className="hidden md:block w-16 h-1 bg-gray-200 mt-10 self-start"></div>

              <div className="flex-1 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full border-4 border-gray-200 bg-white flex items-center justify-center mb-4 z-10 text-gray-400">
                  <CalendarCheck className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-gray-800 mb-2">{t.landing.step2Title}</h4>
                <p className="text-gray-500 font-medium max-w-xs">{t.landing.step2Desc}</p>
              </div>

              <div className="hidden md:block w-16 h-1 bg-gray-200 mt-10 self-start"></div>

              <div className="flex-1 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full border-4 border-gray-200 bg-white flex items-center justify-center mb-4 z-10 text-gray-400">
                  <Trophy className="w-8 h-8 text-gold" />
                </div>
                <h4 className="text-lg font-bold text-gray-800 mb-2">{t.landing.step3Title}</h4>
                <p className="text-gray-500 font-medium max-w-xs">{t.landing.step3Desc}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="w-full py-16 px-4 bg-surface border-t-2 border-gray-200 flex justify-center text-center">
          <div className="max-w-xl mx-auto flex flex-col items-center">
            <img
              src="/grauate_crow.png"
              alt="Graduate Mascot"
              className="max-w-[200px] w-full object-contain mb-8 animate-float"
              style={{ animationDelay: '1s' }}
            />
            <h3 className="text-2xl md:text-3xl font-black text-gray-800 mb-8 tracking-tight">
              {t.landing.bottomCTA}
            </h3>
            <Link
              to="/register"
              className="btn-primary w-full max-w-[320px] py-4 text-lg"
            >
              {t.landing.getStarted}
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-background border-t-2 border-gray-200 py-8 text-center text-gray-400 font-bold text-sm uppercase tracking-widest">
        <p>© {new Date().getFullYear()} Kilas. All rights reserved.</p>
      </footer>
    </div>
  );
}
