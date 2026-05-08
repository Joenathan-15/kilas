import { useState, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import type { EventData, Step } from 'react-joyride';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuthStore } from '../../stores/authStore';

export default function GuidedTour() {
  const { t } = useTranslation();
  const { user, completeOnboarding } = useAuthStore();
  const [run, setRun] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Only run if user is logged in and hasn't seen the tour
  useEffect(() => {
    if (user && !user.onboarding_completed) {
      // Small delay to ensure the DOM is fully rendered
      const timer = setTimeout(() => setRun(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div className="text-left">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">{t.onboarding.welcomeTitle}</h2>
          <p className="text-slate-600 font-medium leading-relaxed">{t.onboarding.welcomeDesc}</p>
        </div>
      ),
      placement: 'center',
      skipBeacon: true,
    },
    {
      target: isMobile ? '.tour-mobile-dashboard' : '.tour-sidebar-dashboard',
      content: (
        <div className="text-left">
          <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">{t.onboarding.dashboardTitle}</h3>
          <p className="text-slate-600 font-medium leading-relaxed">{t.onboarding.dashboardDesc}</p>
        </div>
      ),
      placement: isMobile ? 'top' : 'right',
      skipBeacon: true,
    },
    {
      target: isMobile ? '.tour-mobile-decks' : '.tour-sidebar-decks',
      content: (
        <div className="text-left">
          <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">{t.onboarding.decksTitle}</h3>
          <p className="text-slate-600 font-medium leading-relaxed">{t.onboarding.decksDesc}</p>
        </div>
      ),
      placement: isMobile ? 'top' : 'right',
      skipBeacon: true,
    },
    {
      target: isMobile ? '.tour-mobile-library' : '.tour-sidebar-library',
      content: (
        <div className="text-left">
          <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">{t.onboarding.libraryTitle}</h3>
          <p className="text-slate-600 font-medium leading-relaxed">{t.onboarding.libraryDesc}</p>
        </div>
      ),
      placement: isMobile ? 'top' : 'right',
      skipBeacon: true,
    },
    {
      target: isMobile ? '.tour-mobile-stats' : '.tour-sidebar-stats',
      content: (
        <div className="text-left">
          <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">{t.onboarding.statsTitle}</h3>
          <p className="text-slate-600 font-medium leading-relaxed">{t.onboarding.statsDesc}</p>
        </div>
      ),
      placement: isMobile ? 'top' : 'right',
      skipBeacon: true,
    },
    {
      target: isMobile ? '.tour-mobile-shop' : '.tour-sidebar-shop',
      content: (
        <div className="text-left">
          <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">{t.onboarding.shopTitle}</h3>
          <p className="text-slate-600 font-medium leading-relaxed">{t.onboarding.shopDesc}</p>
        </div>
      ),
      placement: isMobile ? 'bottom' : 'right',
      skipBeacon: true,
    },
    {
      target: isMobile ? '.tour-mobile-profile' : '.tour-sidebar-profile',
      content: (
        <div className="text-left">
          <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">{t.onboarding.profileTitle}</h3>
          <p className="text-slate-600 font-medium leading-relaxed">{t.onboarding.profileDesc}</p>
        </div>
      ),
      placement: isMobile ? 'top' : 'right',
      skipBeacon: true,
    }
  ];

  const handleJoyrideCallback = (data: EventData) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      completeOnboarding();
    }
  };

  if (!user || user.onboarding_completed) return null;

  return (
    <>
      {run && (
        <button 
          onClick={() => {
            setRun(false);
            completeOnboarding();
          }}
          className="fixed top-6 left-6 md:left-auto md:right-6 z-[10001] bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-5 py-2.5 rounded-2xl font-black text-sm tracking-wide shadow-2xl active:scale-95 transition-all flex items-center gap-2"
        >
          {t.onboarding.skip}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      )}

      <Joyride
        steps={steps}
        run={run}
        continuous={true}
        onEvent={handleJoyrideCallback}
        options={{
          buttons: ['back', 'primary'],
          showProgress: true,
          spotlightPadding: 10,
          arrowColor: '#fff',
          backgroundColor: '#fff',
          overlayColor: 'rgba(15, 23, 42, 0.75)',
          primaryColor: '#10b981',
          textColor: '#1e293b',
          zIndex: 10000,
          spotlightRadius: 16,
          skipScroll: isMobile, // Replaces disableScrolling
          scrollOffset: 100,
        }}
        styles={{
          tooltip: {
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(0,0,0,0.05)',
          },
          tooltipContainer: {
            textAlign: 'left',
            padding: 0,
          },
          buttonPrimary: {
            backgroundColor: '#10b981',
            borderRadius: '12px',
            padding: '10px 24px',
            fontWeight: '900',
            fontSize: '14px',
            boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.4)',
            transition: 'transform 0.2s ease',
            outline: 'none',
          },
          buttonBack: {
            color: '#6b7280',
            fontWeight: '700',
            fontSize: '14px',
            marginRight: '12px',
          },
        }}
        locale={{
          last: t.onboarding.getStarted,
          next: t.onboarding.next,
          nextWithProgress: t.onboarding.nextWithProgress,
          back: t.onboarding.back,
          skip: t.onboarding.skip,
        }}
      />
    </>
  );
}
