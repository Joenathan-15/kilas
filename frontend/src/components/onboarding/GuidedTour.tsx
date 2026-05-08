import { useState, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import type { EventData, Step } from 'react-joyride';
import { useTranslation } from '../../hooks/useTranslation';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useAuthStore } from '../../stores/authStore';

export default function GuidedTour() {
  const { t } = useTranslation();
  const { hasSeenOnboarding, completeOnboarding } = useOnboardingStore();
  const { user } = useAuthStore();
  const [run, setRun] = useState(false);

  // Only run if user is logged in and hasn't seen the tour
  useEffect(() => {
    if (user && !hasSeenOnboarding) {
      // Small delay to ensure the DOM is fully rendered
      const timer = setTimeout(() => setRun(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [user, hasSeenOnboarding]);

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
      target: '.tour-step-dashboard',
      content: (
        <div className="text-left">
          <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">{t.onboarding.dashboardTitle}</h3>
          <p className="text-slate-600 font-medium leading-relaxed">{t.onboarding.dashboardDesc}</p>
        </div>
      ),
      placement: 'top',
      skipBeacon: true,
    },
    {
      target: '.tour-step-decks',
      content: (
        <div className="text-left">
          <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">{t.onboarding.decksTitle}</h3>
          <p className="text-slate-600 font-medium leading-relaxed">{t.onboarding.decksDesc}</p>
        </div>
      ),
      placement: 'top',
      skipBeacon: true,
    },
    {
      target: '.tour-step-library',
      content: (
        <div className="text-left">
          <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">{t.onboarding.libraryTitle}</h3>
          <p className="text-slate-600 font-medium leading-relaxed">{t.onboarding.libraryDesc}</p>
        </div>
      ),
      placement: 'top',
      skipBeacon: true,
    },
    {
      target: '.tour-step-stats',
      content: (
        <div className="text-left">
          <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">{t.onboarding.statsTitle}</h3>
          <p className="text-slate-600 font-medium leading-relaxed">{t.onboarding.statsDesc}</p>
        </div>
      ),
      placement: 'top',
      skipBeacon: true,
    },
    {
      target: '.tour-step-profile',
      content: (
        <div className="text-left">
          <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">{t.onboarding.profileTitle}</h3>
          <p className="text-slate-600 font-medium leading-relaxed">{t.onboarding.profileDesc}</p>
        </div>
      ),
      placement: 'top',
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

  if (hasSeenOnboarding || !user) return null;

  return (
    <>
      {run && (
        <button 
          onClick={() => {
            setRun(false);
            completeOnboarding();
          }}
          className="fixed top-6 right-6 z-[10001] bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-5 py-2.5 rounded-2xl font-black text-sm tracking-wide shadow-2xl active:scale-95 transition-all flex items-center gap-2"
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
          buttons: ['back', 'primary'], // Removed 'skip' from footer
          showProgress: true,
          arrowColor: '#fff',
          backgroundColor: '#fff',
          overlayColor: 'rgba(0, 0, 0, 0.75)',
          primaryColor: '#10b981',
          textColor: '#1f2937',
          zIndex: 10000,
          spotlightRadius: 12,
        }}
        styles={{
          tooltip: {
            borderRadius: '28px',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(0,0,0,0.05)',
          },
          tooltipContainer: {
            textAlign: 'left',
            padding: 0,
          },
          buttonPrimary: {
            backgroundColor: '#10b981',
            borderRadius: '16px',
            padding: '12px 28px',
            fontWeight: '900',
            fontSize: '16px',
            boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.4)',
            transition: 'transform 0.2s ease',
            outline: 'none',
          },
          buttonBack: {
            color: '#6b7280',
            fontWeight: '700',
            fontSize: '15px',
            marginRight: '16px',
          },
          buttonClose: {
            display: 'none',
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
