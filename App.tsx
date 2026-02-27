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
import { InstallPrompt } from './components/InstallPrompt';
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

  const buildPdfHtml = (data: ItineraryPlan): string => {
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    let html = `
<div style="font-family: 'Be Vietnam Pro', sans-serif; color: #1e293b; padding: 32px 40px; max-width: 780px; margin: 0 auto; line-height: 1.6;">
  <div style="text-align: center; margin-bottom: 28px; border-bottom: 3px solid #0d9488; padding-bottom: 18px;">
    <h1 style="color: #0d9488; font-size: 26px; margin: 0 0 4px; font-weight: 800; letter-spacing: -0.5px;">MoodTrip</h1>
    <p style="font-size: 11px; color: #94a3b8; margin: 0 0 10px;">Để cảm xúc dẫn đường</p>
    <h2 style="font-size: 20px; color: #334155; margin: 0; font-weight: 700;">${esc(data.destination)}</h2>
  </div>
  <div style="background: #f0fdfa; border-left: 4px solid #0d9488; padding: 14px 18px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
    <p style="color: #475569; margin: 0; font-size: 14px;">${esc(data.overview)}</p>
  </div>`;

    // Timeline
    for (const day of data.timeline) {
      html += `
  <div style="margin-bottom: 22px; page-break-inside: avoid;">
    <h3 style="color: #0d9488; font-size: 16px; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin: 0 0 10px;">${esc(day.day)} — ${esc(day.title)}</h3>`;

      // Weather
      if (day.weather) {
        const parts: string[] = [];
        if (day.weather.temperature) parts.push(`🌡️ ${esc(day.weather.temperature)}`);
        if (day.weather.condition) parts.push(`☁️ ${esc(day.weather.condition)}`);
        if (day.weather.humidity) parts.push(`💧 ${esc(day.weather.humidity)}`);
        if (day.weather.wind) parts.push(`💨 ${esc(day.weather.wind)}`);
        html += `
    <div style="background: #f0f9ff; padding: 8px 14px; border-radius: 6px; margin-bottom: 10px; font-size: 12px; color: #475569;">${parts.join(' &nbsp;|&nbsp; ')}</div>`;
        if (day.weather.note || day.weather_note) {
          html += `
    <div style="font-size: 12px; color: #64748b; margin-bottom: 10px; padding-left: 4px;">💡 ${esc(day.weather.note || day.weather_note || '')}</div>`;
        }
      } else if (day.weather_note) {
        html += `
    <div style="font-size: 12px; color: #64748b; margin-bottom: 10px;">🌤️ ${esc(day.weather_note)}</div>`;
      }

      // Schedule
      html += `<div style="margin-left: 12px; border-left: 2px solid #d1d5db; padding-left: 14px;">`;
      for (const item of day.schedule) {
        html += `
      <div style="margin-bottom: 12px; page-break-inside: avoid;">
        <p style="font-weight: 600; color: #0d9488; margin: 0 0 2px; font-size: 13px;">${esc(item.time)}</p>
        <p style="margin: 0 0 3px; color: #1e293b; font-size: 13px;">${esc(item.activity)}</p>`;
        const meta: string[] = [];
        if (item.venue) meta.push(`📍 ${esc(item.venue)}`);
        if (item.estimated_cost) meta.push(`💰 ${esc(item.estimated_cost)}`);
        if (meta.length > 0) {
          html += `
        <p style="font-size: 11px; color: #64748b; margin: 0;">${meta.join(' &nbsp;·&nbsp; ')}</p>`;
        }
        html += `</div>`;
      }
      html += `</div></div>`;
    }

    // Food
    if (data.food.length > 0) {
      html += `
  <div style="margin-bottom: 22px; page-break-inside: avoid;">
    <h3 style="color: #0d9488; font-size: 16px; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin: 0 0 10px;">🍜 Món ăn nên thử</h3>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">`;
      for (const f of data.food) {
        html += `
      <div style="background: #fefce8; padding: 10px 14px; border-radius: 6px;">
        <p style="font-weight: 600; color: #1e293b; margin: 0 0 2px; font-size: 13px;">${esc(f.name)}</p>
        <p style="color: #64748b; margin: 0; font-size: 11px;">${esc(f.description)}</p>
      </div>`;
      }
      html += `</div></div>`;
    }

    // Accommodation
    if (data.accommodation.length > 0) {
      html += `
  <div style="margin-bottom: 22px; page-break-inside: avoid;">
    <h3 style="color: #0d9488; font-size: 16px; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin: 0 0 10px;">🏨 Gợi ý chỗ nghỉ</h3>`;
      for (const a of data.accommodation) {
        html += `
      <div style="background: #f8fafc; padding: 10px 14px; border-radius: 6px; margin-bottom: 6px;">
        <p style="font-weight: 600; color: #1e293b; margin: 0; font-size: 13px;">${esc(a.name)} <span style="font-weight: 400; color: #94a3b8; font-size: 11px;">(${esc(a.type)})</span></p>
        <p style="color: #64748b; margin: 2px 0 0; font-size: 11px;">${esc(a.reason)}</p>
      </div>`;
      }
      html += `</div>`;
    }

    // Tips
    if (data.tips.length > 0) {
      html += `
  <div style="margin-bottom: 22px; page-break-inside: avoid;">
    <h3 style="color: #0d9488; font-size: 16px; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin: 0 0 10px;">💡 Mẹo du lịch</h3>
    <ul style="margin: 0; padding-left: 20px;">`;
      for (const t of data.tips) {
        html += `<li style="color: #475569; font-size: 13px; margin-bottom: 4px;">${esc(t)}</li>`;
      }
      html += `</ul></div>`;
    }

    // Packing suggestions
    if (data.packing_suggestions && data.packing_suggestions.length > 0) {
      html += `
  <div style="margin-bottom: 22px; page-break-inside: avoid;">
    <h3 style="color: #0d9488; font-size: 16px; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin: 0 0 10px;">👕 Gợi ý trang phục & phụ kiện</h3>`;
      for (const p of data.packing_suggestions) {
        html += `
      <div style="display: flex; gap: 8px; margin-bottom: 6px; font-size: 13px;">
        <span style="color: #0d9488; font-weight: 600;">${esc(p.item)}</span>
        <span style="color: #94a3b8;">—</span>
        <span style="color: #64748b;">${esc(p.reason)}</span>
      </div>`;
      }
      html += `</div>`;
    }

    // Traffic alerts
    if (data.traffic_alerts && data.traffic_alerts.length > 0) {
      html += `
  <div style="margin-bottom: 22px; page-break-inside: avoid;">
    <h3 style="color: #d97706; font-size: 16px; font-weight: 700; border-bottom: 2px solid #fde68a; padding-bottom: 6px; margin: 0 0 10px;">🚧 Cảnh báo giao thông</h3>`;
      for (const t of data.traffic_alerts) {
        html += `
      <div style="background: #fffbeb; padding: 10px 14px; border-radius: 6px; border-left: 3px solid #f59e0b; margin-bottom: 8px;">
        <p style="font-weight: 600; color: #92400e; margin: 0 0 2px; font-size: 13px;">⚠️ ${esc(t.area)}</p>
        <p style="color: #78350f; margin: 0 0 4px; font-size: 12px;">${esc(t.issue)}</p>
        <p style="color: #0d9488; margin: 0; font-size: 12px;">→ ${esc(t.suggestion)}</p>
      </div>`;
      }
      html += `</div>`;
    }

    // Safety alerts
    if (data.safety_alerts && data.safety_alerts.length > 0) {
      html += `
  <div style="margin-bottom: 22px; page-break-inside: avoid;">
    <h3 style="color: #0d9488; font-size: 16px; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin: 0 0 10px;">🛡️ Lưu ý an toàn & sự kiện</h3>`;
      const typeEmoji: Record<string, string> = { festival: '🎉', religious: '🙏', safety: '⚠️', event: '📅' };
      const typeLabel: Record<string, string> = { festival: 'Lễ hội', religious: 'Tôn giáo', safety: 'An ninh', event: 'Sự kiện' };
      for (const s of data.safety_alerts) {
        const emoji = typeEmoji[s.type] || '📋';
        const label = typeLabel[s.type] || 'Khác';
        html += `
      <div style="background: #f8fafc; padding: 10px 14px; border-radius: 6px; border-left: 3px solid #0d9488; margin-bottom: 8px;">
        <p style="font-weight: 600; color: #334155; margin: 0 0 2px; font-size: 13px;">${emoji} [${esc(label)}] ${esc(s.title)}</p>
        <p style="color: #64748b; margin: 0 0 4px; font-size: 12px;">${esc(s.description)}</p>
        <p style="color: #0d9488; margin: 0; font-size: 12px;">💡 ${esc(s.advice)}</p>
      </div>`;
      }
      html += `</div>`;
    }

    // Budget summary
    if (data.budget_summary) {
      html += `
  <div style="margin-bottom: 22px; page-break-inside: avoid;">
    <h3 style="color: #0d9488; font-size: 16px; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin: 0 0 10px;">💰 Tổng hợp chi phí</h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <thead>
        <tr style="background: #f0fdfa;">
          <th style="text-align: left; padding: 8px 12px; color: #0d9488; font-weight: 600; border-bottom: 2px solid #0d9488;">Hạng mục</th>
          <th style="text-align: right; padding: 8px 12px; color: #0d9488; font-weight: 600; border-bottom: 2px solid #0d9488;">Chi phí</th>
          <th style="text-align: left; padding: 8px 12px; color: #0d9488; font-weight: 600; border-bottom: 2px solid #0d9488;">Ghi chú</th>
        </tr>
      </thead>
      <tbody>`;
      for (const b of data.budget_summary.breakdown) {
        html += `
        <tr>
          <td style="padding: 7px 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">${esc(b.category)}</td>
          <td style="padding: 7px 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 500; text-align: right;">${esc(b.amount)}</td>
          <td style="padding: 7px 12px; border-bottom: 1px solid #e2e8f0; color: #94a3b8; font-size: 11px;">${esc(b.note || '')}</td>
        </tr>`;
      }
      html += `
      </tbody>
      <tfoot>
        <tr style="background: #f0fdfa;">
          <td style="padding: 10px 12px; font-weight: 700; color: #1e293b; border-top: 2px solid #0d9488;">Tổng cộng</td>
          <td style="padding: 10px 12px; font-weight: 700; color: #0d9488; text-align: right; font-size: 15px; border-top: 2px solid #0d9488;">${esc(data.budget_summary.total_estimated)}</td>
          <td style="padding: 10px 12px; border-top: 2px solid #0d9488;"></td>
        </tr>
      </tfoot>
    </table>`;
      if (data.budget_summary.vs_budget_note) {
        html += `
    <div style="background: #f0fdfa; padding: 10px 14px; border-radius: 6px; margin-top: 8px; font-size: 12px; color: #0d9488;">📊 ${esc(data.budget_summary.vs_budget_note)}</div>`;
      }
      html += `</div>`;
    }

    // Footer
    html += `
  <div style="text-align: center; margin-top: 30px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
    <p style="color: #94a3b8; font-size: 11px; margin: 0;">Được tạo bởi MoodTrip — moodtrip.vercel.app</p>
  </div>
</div>`;

    return html;
  };

  const handleExportPDF = async () => {
    if (!itinerary || !window.html2pdf) {
      showToast('Không thể xuất PDF. Vui lòng thử lại.');
      return;
    }

    setIsExportingPDF(true);
    const container = document.createElement('div');
    container.id = 'pdf-export-container';
    container.style.cssText = 'position: fixed; left: -9999px; top: 0; width: 800px; background: #ffffff; z-index: -1;';
    container.innerHTML = buildPdfHtml(itinerary);
    document.body.appendChild(container);

    try {
      const opt: Html2PdfOptions = {
        margin: [10, 10, 10, 10],
        filename: `MoodTrip_${itinerary.destination.replace(/ /g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('PDF export timeout')), 30000)
      );

      await Promise.race([
        window.html2pdf().from(container).set(opt).save(),
        timeoutPromise
      ]);
    } catch (err) {
      console.error('PDF export failed:', err);
      showToast('Xuất PDF thất bại. Vui lòng thử lại.');
    } finally {
      document.body.removeChild(container);
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

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </div>
  );
}
