import { useState, useEffect, useCallback, Component, Suspense, lazy } from 'react';
import type { ReactNode } from 'react';
import { generateItinerary } from './services/geminiService';
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
import { ITINERARY_LS_KEY, SAVED_ITINERARIES_LS_KEY } from './constants';
import type { FormData, ItineraryPlan } from './types';
import { IconWarning } from './components/icons';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
import { AnimatePresence, motion } from 'motion/react';

// Lazy load Three.js scene to prevent blocking initial render
const NatureScene = lazy(() => import('./components/three/NatureScene'));

// Error boundary to catch Three.js crashes without killing the whole app
class SceneErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('[MoodTrip] 3D scene error (non-fatal):', error.message);
  }

  render() {
    if (this.state.hasError) {
      return null; // Silently fail — app works without 3D background
    }
    return this.props.children;
  }
}

// Define types for html2pdf.js since it's loaded from a script
interface Html2PdfOptions {
  margin?: number | number[];
  filename?: string;
  image?: { type?: string; quality?: number };
  html2canvas?: { scale?: number; useCORS?: boolean };
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

type View = 'hero' | 'form' | 'loading' | 'result' | 'error' | 'release' | 'tips' | 'about';

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

  useEffect(() => {
    const storedItinerary = localStorage.getItem(ITINERARY_LS_KEY);
    const storedSavedItineraries = localStorage.getItem(SAVED_ITINERARIES_LS_KEY);

    if (storedItinerary) {
      try {
        const parsedItinerary = JSON.parse(storedItinerary);
        setItinerary(parsedItinerary);
        setView('result');
      } catch (e) {
        console.error("Failed to parse stored itinerary", e);
        localStorage.removeItem(ITINERARY_LS_KEY);
      }
    }
    
    if (storedSavedItineraries) {
      try {
        setSavedItineraries(JSON.parse(storedSavedItineraries));
      } catch (e) {
        console.error("Failed to parse saved itineraries", e);
        localStorage.removeItem(SAVED_ITINERARIES_LS_KEY);
      }
    }
  }, []);

  // Delay 3D scene mount so it doesn't block initial content render
  useEffect(() => {
    if (!showIntro) {
      const timer = setTimeout(() => setSceneReady(true), 100);
      return () => clearTimeout(timer);
    }
  }, [showIntro]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleGenerateItinerary = useCallback(async (formData: FormData) => {
    setView('loading');
    setError(null);
    setLastFormData(formData);

    try {
      const result = await generateItinerary(formData);
      
      const resultWithId = { ...result, id: `${result.destination}-${Date.now()}` };
      setItinerary(resultWithId);
      setView('result');
      localStorage.setItem(ITINERARY_LS_KEY, JSON.stringify(resultWithId));
      setLastFormData(null);
    } catch (e: unknown) {
      const err = e as Error;
      const knownApiErrors = ['API_KEY_INVALID', 'RATE_LIMIT_EXCEEDED'];

      if (knownApiErrors.includes(err.message)) {
          let userMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
          if (err.message === 'API_KEY_INVALID') {
              userMessage = 'Lỗi xác thực với hệ thống AI. Vui lòng thử lại sau.';
          } else if (err.message === 'RATE_LIMIT_EXCEEDED') {
              userMessage = 'Hệ thống đang bận. Vui lòng thử lại sau ít phút.';
          }
          setError(userMessage);
          setView('form');
      } else {
        setError(err.message || 'Đã có lỗi xảy ra không mong muốn. Vui lòng thử lại.');
        setView('error');
      }
    }
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
    const element = document.getElementById('itinerary-to-print');
    if (!element || !window.html2pdf) return;
    
    setIsExportingPDF(true);
    try {
      const opt: Html2PdfOptions = {
        margin:       0.5,
        filename:     `MoodTrip_${itinerary?.destination.replace(/ /g, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      await window.html2pdf().from(element).set(opt).save();
    } catch (err) {
      console.error('PDF export failed:', err);
      showToast('Xuất PDF thất bại. Vui lòng thử lại.');
    } finally {
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
    showToast("Đã lưu lịch trình thành công!");
  };

  const handleLoadItinerary = (itineraryToLoad: ItineraryPlan) => {
    setItinerary(itineraryToLoad);
    setView('result');
    localStorage.setItem(ITINERARY_LS_KEY, JSON.stringify(itineraryToLoad));
  };

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  if (showIntro) {
    return <IntroScreen onComplete={handleIntroComplete} />;
  }

  const renderContent = () => {
    switch (view) {
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
              onStart={() => setView('form')} 
              savedItineraries={savedItineraries} 
              onLoadItinerary={handleLoadItinerary} 
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
              initialData={lastFormData}
              onGoHome={handleGoHome}
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
            <LoadingAnimation />
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
            <ItineraryDisplay 
              itinerary={itinerary} 
              onReset={handleReset} 
              onExportPDF={handleExportPDF} 
              onSaveToList={handleSaveItineraryToList}
              onItineraryChange={handleItineraryChange}
              onGoHome={handleGoHome}
              isSaved={isSaved}
              isExportingPDF={isExportingPDF}
            />
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
            <Release onGoHome={handleGoHome} />
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
            <TipsPage onGoHome={handleGoHome} />
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
            <AboutPage onGoHome={handleGoHome} />
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
            onStart={() => setView('form')} 
            savedItineraries={savedItineraries} 
            onLoadItinerary={handleLoadItinerary} 
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
      {/* 3D Background Scene — delayed mount, lazy loaded, error-safe */}
      {sceneReady && (
        <SceneErrorBoundary>
          <Suspense fallback={null}>
            <NatureScene />
          </Suspense>
        </SceneErrorBoundary>
      )}

      {/* Dark vignette overlay for text readability */}
      <div
        className="content-overlay fixed inset-0 z-[1]"
        aria-hidden="true"
      />

      {/* Analytics */}
      <Analytics />
      <SpeedInsights />

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


      {/* Chat Companion */}
      <ChatCompanion />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 left-6 glass-dark px-6 py-3 rounded-xl shadow-2xl z-40 text-white font-medium border border-teal-500/20"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
