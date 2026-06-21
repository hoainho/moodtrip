import { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { generateItinerary } from './services/geminiService';
import { mapGenerationError } from './services/errorCopy';
import { ItineraryErrorBoundary } from './components/ItineraryErrorBoundary';
import { Hero } from './components/Hero';
import { TripForm } from './components/TripForm';
import { LoadingAnimation } from './components/LoadingAnimation';
import { ItineraryDisplay } from './components/ItineraryDisplay';
import { IntroScreen } from './components/IntroScreen';
import { Release } from './components/Release';
import { TipsPage } from './components/TipsPage';
import { AboutPage } from './components/AboutPage';
import { Footer } from './components/Footer';
import { ChatCompanion } from './components/ChatCompanion';
import { ConsentBanner } from './components/ConsentBanner';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { CardPullOnboarding } from './components/CardPullOnboarding';
import { SharedTripView } from './components/SharedTripView';
import { DuongVeQueModal } from './components/DuongVeQueModal';
import { SundayDreamBanner } from './components/SundayDreamBanner';
import { TripMap } from './components/TripMap';
import { MoNotebookModal } from './components/MoNotebookModal';
import { PublicShareButton } from './components/PublicShareButton';
import { PersonalWorldBadge } from './components/PersonalWorldBadge';
import { PersonalWorldScene } from './components/PersonalWorldScene';
import { useMoodTheme } from './hooks/useMoodTheme';
import { AntiItineraryView } from './components/AntiItineraryView';

import { generateAntiItinerary } from './services/antiItinerary';
import { useAuth } from './services/useAuth';
import { loadPreferences, savePreferencesFromTrip } from './services/preferencesApi';
import { parseCurrentRoute, type Route } from './services/sharedTripRouter';
import { saveTrip } from './services/tripsApi';
import { ITINERARY_LS_KEY, SAVED_ITINERARIES_LS_KEY } from './constants';
import type { FormData, ItineraryPlan, Mood, ShortTripMood } from './types';
import { IconWarning, IconHome, IconGlobe, IconFeather, IconMoon } from './components/icons';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
import { AnimatePresence, motion } from 'motion/react';
import { decompressItinerary, getSharedTripParam } from './services/shareService';
import { hapticSuccess, spawnConfetti } from './services/haptics';

// Lazy load Three.js scene to prevent blocking initial render
const NatureScene = lazy(() => import('./components/three/NatureScene'));

/** Bridges the mood theme into the (lazy) 3D backdrop. Isolated so theme updates (debounced as the
 *  user types their mood) re-render only this wrapper + the scene's props — never the whole App. */
function MoodReactiveScene() {
  const moodTheme = useMoodTheme();
  return <NatureScene moodTheme={moodTheme} />;
}

// Error boundary to catch Three.js crashes without killing the whole app.
// Shared with the PersonalWorld modal — see components/three/sceneHelpers.tsx.
import { SceneErrorBoundary } from './components/three/sceneHelpers';

// Define types for html2pdf.js since it's loaded from a script
interface Html2PdfOptions {
  margin?: number | number[];
  filename?: string;
  image?: { type?: string; quality?: number };
  html2canvas?: { scale?: number; useCORS?: boolean; backgroundColor?: string };
  jsPDF?: { unit?: string; format?: string; orientation?: string };
}

interface Html2Pdf {
  from(element: HTMLElement): Html2Pdf;
  set(options: Html2PdfOptions): Html2Pdf;
  save(): Promise<void>;
}

declare global {
  interface Window {
    html2pdf: () => Html2Pdf;
  }
}

type View = 'hero' | 'card-pull' | 'form' | 'loading' | 'result' | 'error' | 'release' | 'tips' | 'about';

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [sceneReady, setSceneReady] = useState(false);
  const [view, setView] = useState<View>('hero');
  const [itinerary, setItinerary] = useState<ItineraryPlan | null>(null);
  const [savedItineraries, setSavedItineraries] = useState<ItineraryPlan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastFormData, setLastFormData] = useState<FormData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isSharedView, setIsSharedView] = useState(false);
  const [route, setRoute] = useState<Route>(() => parseCurrentRoute());
  const [cardPullPrefill, setCardPullPrefill] = useState<Partial<FormData> | null>(null);
  const [preferenceDefaults, setPreferenceDefaults] = useState<Partial<FormData> | null>(null);
  const [queModalOpen, setQueModalOpen] = useState(false);
  const [notebookOpen, setNotebookOpen] = useState(false);
  const [worldSceneOpen, setWorldSceneOpen] = useState(false);
  const [antiItineraryForm, setAntiItineraryForm] = useState<FormData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [prefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const { user } = useAuth();
  void generateAntiItinerary;

  useEffect(() => {
    const storedItinerary = localStorage.getItem(ITINERARY_LS_KEY);
    const storedSavedItineraries = localStorage.getItem(SAVED_ITINERARIES_LS_KEY);

    const isFixtureItinerary = (it: { destination?: string; overview?: string } | null): boolean => {
      if (!it) return false;
      return Boolean(
        (it.destination && it.destination.includes('[MOCK]')) ||
        (it.overview && it.overview.includes('[FIXTURE'))
      );
    };

    if (storedItinerary) {
      try {
        const parsedItinerary = JSON.parse(storedItinerary);
        if (isFixtureItinerary(parsedItinerary)) {
          console.warn('[App] Purging cached fixture itinerary; live mode will fetch fresh from Gemini.');
          localStorage.removeItem(ITINERARY_LS_KEY);
        } else {
          setItinerary(parsedItinerary);
          setView('result');
        }
      } catch (e) {
        console.error("Failed to parse stored itinerary", e);
        localStorage.removeItem(ITINERARY_LS_KEY);
      }
    }
    
    if (storedSavedItineraries) {
      try {
        const list = JSON.parse(storedSavedItineraries) as Array<{ destination?: string; overview?: string }>;
        const cleaned = list.filter((it) => !isFixtureItinerary(it));
        if (cleaned.length !== list.length) {
          console.warn(`[App] Purging ${list.length - cleaned.length} cached fixture itineraries from saved list.`);
          localStorage.setItem(SAVED_ITINERARIES_LS_KEY, JSON.stringify(cleaned));
        }
        setSavedItineraries(cleaned as ItineraryPlan[]);
      } catch (e) {
        console.error("Failed to parse saved itineraries", e);
        localStorage.removeItem(SAVED_ITINERARIES_LS_KEY);
      }
    }
  }, []);

  // Handle shared trip URL
  useEffect(() => {
    const sharedParam = getSharedTripParam();
    if (sharedParam) {
      decompressItinerary(sharedParam)
        .then((trip) => {
          setItinerary(trip);
          setIsSharedView(true);
          setView('result');
          setShowIntro(false);
          // Clean URL without reload
          window.history.replaceState({}, '', window.location.pathname);
        })
        .catch((err) => {
          console.error('Failed to load shared trip:', err);
        });
    }
  }, []);

  useEffect(() => {
    function onPop() {
      setRoute(parseCurrentRoute());
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    if (!user) {
      setPreferenceDefaults(null);
      return;
    }
    loadPreferences(user.id).then((prefs) => {
      if (!prefs) return;
      setPreferenceDefaults({
        moods: prefs.preferredMoods,
        shortMoods: prefs.preferredShortMoods,
        budget: prefs.defaultBudget ?? undefined,
        startLocation: prefs.defaultStartLocation ?? '',
      });
    });
  }, [user]);

  useEffect(() => {
    if (showIntro) return;
    const w = window as typeof window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    if (typeof w.requestIdleCallback === 'function') {
      const handle = w.requestIdleCallback(() => setSceneReady(true), { timeout: 2000 });
      return () => {
        if (typeof w.cancelIdleCallback === 'function') w.cancelIdleCallback(handle);
      };
    }
    const timer = setTimeout(() => setSceneReady(true), 800);
    return () => clearTimeout(timer);
  }, [showIntro]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleGenerateItinerary = useCallback(async (formData: FormData) => {
    // Double-submit guard: ignore re-entry while a generation is already in flight.
    if (abortRef.current) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setIsGenerating(true);
    setView('loading');
    setError(null);
    setLastFormData(formData);

    try {
      const result = await generateItinerary(formData, controller.signal);
      if (controller.signal.aborted) return; // user cancelled mid-flight

      const resultWithId = { ...result, id: `${result.destination}-${Date.now()}` };
      setItinerary(resultWithId);
      setView('result');
      // Persistence happens after a successful render (ItineraryDisplay effect), not here — so a
      // malformed itinerary that crashes the view is never cached. lastFormData is intentionally kept
      // so retry-after-error and the Anti-Itinerary affordance keep working.

      if (user) {
        try {
          await savePreferencesFromTrip(user.id, {
            moods: formData.moods,
            shortMoods: formData.shortMoods,
            budget: formData.budget,
            startLocation: formData.startLocation,
          });
          await saveTrip(user.id, resultWithId, formData, { tripMode: formData.tripMode });
        } catch (persistErr) {
          console.warn('[App] background persistence failed', persistErr);
        }
      }
    } catch (e: unknown) {
      const mapped = mapGenerationError(e);
      if (mapped.cancelled) {
        setView('form');
        return;
      }
      setError(mapped.message);
      setView(mapped.view);
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  }, [user]);

  const handleCancelGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleReset = () => {
    localStorage.removeItem(ITINERARY_LS_KEY);
    setItinerary(null);
    setError(null);
    setLastFormData(null);
    setView('form');
  };

  const handleGoHome = () => {
    setError(null);
    setView('hero');
  };

  const handleGoToRelease = () => {
    setView('release');
  };

  const handleGoToTips = () => {
    setView('tips');
  };

  const handleGoToAbout = () => {
    setView('about');
  };

  const handleExportPDF = async () => {
    const sourceEl = document.getElementById('itinerary-to-print');
    if (!sourceEl || !itinerary || !window.html2pdf) {
      showToast('Không thể xuất PDF. Vui lòng thử lại.');
      return;
    }

    setIsExportingPDF(true);

    // Clone the actual displayed content so PDF matches the app layout
    const clone = sourceEl.cloneNode(true) as HTMLElement;
    clone.id = 'pdf-export-clone';

    // Remove interactive elements from clone
    clone.querySelectorAll('button, [role="button"], input').forEach(el => el.remove());

    // Add a PDF header with destination name (since the sticky header is outside the capture area)
    const pdfHeader = document.createElement('div');
    pdfHeader.style.cssText = 'text-align: center; padding: 20px 16px 16px; border-bottom: 2px solid rgba(13,148,136,0.3); margin-bottom: 8px;';
    pdfHeader.innerHTML = `
      <h1 style="color: #0d9488; font-size: 22px; font-weight: 800; margin: 0 0 4px;">MoodTrip</h1>
      <p style="color: #94a3b8; font-size: 10px; margin: 0 0 8px;">Để cảm xúc dẫn đường</p>
      <h2 style="color: #e2e8f0; font-size: 18px; font-weight: 700; margin: 0;">${itinerary.destination}</h2>
    `;
    clone.insertBefore(pdfHeader, clone.firstChild);

    // Create a wrapper with print-friendly styles
    const wrapper = document.createElement('div');
    wrapper.id = 'pdf-export-wrapper';
    wrapper.style.cssText = 'position: absolute; top: 0; left: 0; width: 800px; z-index: -9999; pointer-events: none; background: #0a0e1a;';

    // Inject print override styles into the clone
    const styleTag = document.createElement('style');
    styleTag.textContent = `
      #pdf-export-clone * {
        animation: none !important;
        transition: none !important;
        opacity: 1 !important;
        transform: none !important;
      }
      #pdf-export-clone .glass-dark {
        background: rgba(10, 14, 26, 0.95) !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }
      #pdf-export-clone .glass {
        background: rgba(255, 255, 255, 0.12) !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }
      #pdf-export-clone .gradient-nature {
        background: linear-gradient(135deg, #0d9488, #06b6d4, #0ea5e9) !important;
      }
      #pdf-export-clone .gradient-ocean {
        background: linear-gradient(135deg, #0c4a6e, #0284c7, #06b6d4) !important;
      }
    `;
    wrapper.appendChild(styleTag);
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    try {
      const opt: Html2PdfOptions = {
        margin: [8, 5, 8, 5],
        filename: `MoodTrip_${itinerary.destination.replace(/ /g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0a0e1a' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('PDF export timeout')), 45000)
      );

      await Promise.race([
        window.html2pdf().from(clone).set(opt).save(),
        timeoutPromise
      ]);
    } catch (err) {
      console.error('PDF export failed:', err);
      showToast('Xuất PDF thất bại. Vui lòng thử lại.');
    } finally {
      document.body.removeChild(wrapper);
      setIsExportingPDF(false);
    }
  };

  const handleItineraryChange = (newItinerary: ItineraryPlan) => {
    setItinerary(newItinerary);
    localStorage.setItem(ITINERARY_LS_KEY, JSON.stringify(newItinerary));
    showToast("Đã cập nhật lịch trình!");
  };

  const handleSaveItineraryToList = () => {
    if (!itinerary) return;
    const isAlreadySaved = savedItineraries.some(i => i.id === itinerary.id);
    if (isAlreadySaved) {
      showToast("Lịch trình này đã được lưu.");
      return;
    }
    const updatedList = [...savedItineraries, itinerary];
    setSavedItineraries(updatedList);
    localStorage.setItem(SAVED_ITINERARIES_LS_KEY, JSON.stringify(updatedList));
    hapticSuccess();
    spawnConfetti();
    showToast('Đã lưu lịch trình thành công!');
  };

  const handleLoadItinerary = (itineraryToLoad: ItineraryPlan) => {
    setItinerary(itineraryToLoad);
    setView('result');
    localStorage.setItem(ITINERARY_LS_KEY, JSON.stringify(itineraryToLoad));
  };

  const handleDeleteItinerary = (id: string | number) => {
    const updatedList = savedItineraries.filter(i => i.id !== id);
    setSavedItineraries(updatedList);
    localStorage.setItem(SAVED_ITINERARIES_LS_KEY, JSON.stringify(updatedList));
    showToast('Đã xóa lịch trình.');
  };

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  if (showIntro) {
    return <IntroScreen onComplete={handleIntroComplete} />;
  }

  if (route.kind === 'shared-trip') {
    return (
      <div className="min-h-screen relative" style={{ backgroundColor: '#0a0e1a' }}>
        <SharedTripView
          slug={route.slug}
          onForkSuccess={(forked) => {
            const newItinerary = { ...(forked.itinerary), id: forked.id };
            setItinerary(newItinerary);
            localStorage.setItem(ITINERARY_LS_KEY, JSON.stringify(newItinerary));
            window.history.replaceState({}, '', '/');
            setRoute({ kind: 'app' });
            setView('result');
          }}
          onBackToApp={() => {
            window.history.replaceState({}, '', '/');
            setRoute({ kind: 'app' });
          }}
        />
      </div>
    );
  }

  const handleCardPullComplete = (result: {
    moods: Mood[];
    shortMoods: ShortTripMood[];
    narrative: string;
  }) => {
    const prefill: Partial<FormData> = {
      ...preferenceDefaults,
      moods: result.moods,
      shortMoods: result.shortMoods,
      personalNote: `Mơ rút quẻ: ${result.narrative}`,
    };
    setCardPullPrefill(prefill);
    setView('form');
  };

  const renderContent = () => {
    switch (view) {
      case 'card-pull':
        return (
          <motion.div
            key="card-pull"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <CardPullOnboarding
              onComplete={handleCardPullComplete}
              onUseTraditionalForm={() => setView('form')}
            />
          </motion.div>
        );
      case 'hero':
        return (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ minHeight: '100vh' }}
          >
            <Hero 
              onStart={() => setView('card-pull')} 
              savedItineraries={savedItineraries} 
              onLoadItinerary={handleLoadItinerary} 
              onDeleteItinerary={handleDeleteItinerary}
              onGoHome={handleGoHome} 
              onGoToRelease={handleGoToRelease}
              onGoToTips={handleGoToTips}
              onGoToAbout={handleGoToAbout}
            />
          </motion.div>
        );
      case 'form':
        return (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
          >
            <TripForm
              onSubmit={handleGenerateItinerary}
              onBack={() => itinerary ? setView('result') : setView('hero')}
              error={error}
              initialData={lastFormData ?? cardPullPrefill ?? preferenceDefaults}
              onGoHome={handleGoHome}
              isSubmitting={isGenerating}
            />
          </motion.div>
        );
      case 'loading':
        return (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5 }}
          >
            <LoadingAnimation onCancel={handleCancelGeneration} />
          </motion.div>
        );
      case 'result': {
        if (!itinerary) return null;
        const isSaved = savedItineraries.some(i => i.id === itinerary.id);
        return (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Result layout: single vertical column — the itinerary, then the map + action
                cluster stacked BELOW it (centered). ItineraryDisplay self-centers its content via
                its own `container` and keeps a full-width sticky header. */}
            <div>
              <ItineraryErrorBoundary onRecover={handleReset}>
                <ItineraryDisplay
                  itinerary={itinerary}
                  onReset={handleReset}
                  onExportPDF={handleExportPDF}
                  onSaveToList={handleSaveItineraryToList}
                  onItineraryChange={handleItineraryChange}
                  onGoHome={handleGoHome}
                  isSaved={isSaved || isSharedView}
                  isExportingPDF={isExportingPDF}
                  formData={lastFormData}
                  onOpenQue={() => setQueModalOpen(true)}
                  onOpenWorld={() => setWorldSceneOpen(true)}
                />
              </ItineraryErrorBoundary>

              <div className="max-w-3xl mx-auto px-4 mt-3 space-y-6 mb-10">
                <PersonalWorldBadge />

                <div>
                  <h3 className="text-lg font-bold text-white mb-3">Bản đồ hành trình</h3>
                  <TripMap itinerary={itinerary} />
                </div>

                <div className="flex flex-wrap items-start gap-3">
                  <PublicShareButton itinerary={itinerary} />
                  <button
                    onClick={() => setNotebookOpen(true)}
                    className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-amber-300 text-amber-900 text-sm font-semibold hover:bg-amber-400 transition-colors"
                  >
                    <IconFeather className="w-4 h-4" />
                    Mơ viết thư cho bạn
                  </button>
                  {lastFormData && (
                    <button
                      onClick={() => setAntiItineraryForm(lastFormData)}
                      className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-white/10 border border-purple-400/40 text-purple-200 hover:text-white hover:bg-white/15 text-sm font-semibold transition-colors"
                    >
                      <IconMoon className="w-4 h-4" />
                      Thử Anti-Itinerary
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );
      }
      case 'release':
        return (
          <motion.div
            key="release"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
          >
            <Release onGoHome={handleGoHome} onOpenQue={() => setQueModalOpen(true)} onOpenWorld={() => setWorldSceneOpen(true)} />
          </motion.div>
        );
      case 'tips':
        return (
          <motion.div
            key="tips"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
          >
            <TipsPage onGoHome={handleGoHome} onOpenQue={() => setQueModalOpen(true)} onOpenWorld={() => setWorldSceneOpen(true)} />
          </motion.div>
        );
      case 'about':
        return (
          <motion.div
            key="about"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
          >
            <AboutPage onGoHome={handleGoHome} onOpenQue={() => setQueModalOpen(true)} onOpenWorld={() => setWorldSceneOpen(true)} />
          </motion.div>
        );
      case 'error':
        return (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-center p-8 flex flex-col items-center justify-center h-screen">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              >
                <IconWarning className="w-20 h-20 mb-6 text-red-400" />
              </motion.div>
              <h2 className="text-3xl font-bold mb-3 text-white">Ối, có lỗi rồi!</h2>
              <p className="max-w-md mb-8 text-slate-400">{error}</p>
              <motion.button
                onClick={handleReset}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 hover:bg-red-600 transition-colors"
              >
                Thử lại
              </motion.button>
            </div>
          </motion.div>
        );
      default:
        return (
          <Hero 
            onStart={() => setView('card-pull')} 
            savedItineraries={savedItineraries} 
            onLoadItinerary={handleLoadItinerary} 
            onDeleteItinerary={handleDeleteItinerary}
            onGoHome={handleGoHome} 
            onGoToRelease={handleGoToRelease}
            onGoToTips={handleGoToTips}
            onGoToAbout={handleGoToAbout}
          />
        );
    }
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundColor: '#0a0e1a',
        minHeight: '100vh',
        position: 'relative',
      }}
    >
      {/* 3D Background Scene — delayed mount, lazy loaded, error-safe.
          Skipped entirely when the user prefers reduced motion: the WebGL render loop runs continuous
          animation that the CSS reduced-motion block cannot reach (WCAG 2.3.3). A static gradient stands
          in so the layout is unchanged. */}
      {sceneReady && !prefersReducedMotion && (
        <SceneErrorBoundary>
          <Suspense fallback={null}>
            <MoodReactiveScene />
          </Suspense>
        </SceneErrorBoundary>
      )}
      {prefersReducedMotion && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-0"
          style={{ background: 'radial-gradient(ellipse at 50% 30%, #0f2a2e 0%, #0a0e1a 60%)' }}
        />
      )}

      {/* Dark vignette overlay for text readability */}
      <div
        className="content-overlay fixed inset-0 z-[1]"
        aria-hidden="true"
      />

      <Analytics />
      <SpeedInsights />

      {/* Floating quick-actions. Hidden on pages that render their own sticky header
          (tips/about/release) — those expose Về quê / Thế giới inside their navbar via
          PageNavActions, so showing the floating cluster too would duplicate the navbar. */}
      {view !== 'hero' && view !== 'tips' && view !== 'about' && view !== 'release' && view !== 'result' && (
        <div className="fixed top-4 right-4 z-30 flex gap-2">
          <button
            type="button"
            onClick={() => setQueModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 min-w-[44px] min-h-[44px] px-2.5 sm:px-3 py-1.5 text-xs font-medium text-purple-300 hover:text-white bg-white/10 hover:bg-white/15 border border-white/10 rounded-full backdrop-blur-sm transition-colors"
            aria-label="Đường về quê"
          >
            <IconHome className="w-4 h-4" />
            <span className="hidden sm:inline">Về quê</span>
          </button>
          <button
            type="button"
            onClick={() => setWorldSceneOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 min-w-[44px] min-h-[44px] px-2.5 sm:px-3 py-1.5 text-xs font-medium text-emerald-300 hover:text-white bg-white/10 hover:bg-white/15 border border-white/10 rounded-full backdrop-blur-sm transition-colors"
            aria-label="Thế giới của bạn"
          >
            <IconGlobe className="w-4 h-4" />
            <span className="hidden sm:inline">Thế giới</span>
          </button>
        </div>
      )}

      {/* Main Content — inline styles ensure visibility even if CSS fails */}
      <main
        className="relative z-10"
        style={{
          position: 'relative',
          zIndex: 10,
          minHeight: '100vh',
        }}
      >
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </main>

      {/* Footer — show on content views, not hero/loading/error */}
      {view !== 'hero' && view !== 'loading' && view !== 'error' && (
        <Footer
          onGoHome={handleGoHome}
          onGoToRelease={handleGoToRelease}
          onGoToTips={handleGoToTips}
          onGoToAbout={handleGoToAbout}
        />
      )}


      <ChatCompanion />
      <PWAInstallPrompt />
      <ConsentBanner />
      <SundayDreamBanner onAcceptDream={() => setView('card-pull')} />
      <DuongVeQueModal
        open={queModalOpen}
        onClose={() => setQueModalOpen(false)}
        onSeed={(prefill) => {
          setCardPullPrefill(prefill);
          setView('form');
        }}
      />
      <MoNotebookModal
        open={notebookOpen}
        trip={itinerary}
        onClose={() => setNotebookOpen(false)}
      />
      <PersonalWorldScene open={worldSceneOpen} onClose={() => setWorldSceneOpen(false)} localTrips={savedItineraries} onOpenTrip={handleLoadItinerary} />
      <AntiItineraryView
        open={antiItineraryForm !== null}
        form={antiItineraryForm}
        onClose={() => setAntiItineraryForm(null)}
        onWantNormalPlan={() => {
          const f = antiItineraryForm;
          setAntiItineraryForm(null);
          if (f) void handleGenerateItinerary(f);
        }}
      />
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            role="status"
            aria-live="polite"
            className="fixed bottom-6 left-6 glass-dark px-6 py-3 rounded-xl shadow-2xl z-40 text-white font-medium border border-teal-500/20"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
