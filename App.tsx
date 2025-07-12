import React, { useState, useEffect, useCallback } from 'react';
import { generateItinerary } from './services/geminiService';
import { Hero } from './components/Hero';
import { TripForm } from './components/TripForm';
import { LoadingAnimation } from './components/LoadingAnimation';
import { ItineraryDisplay } from './components/ItineraryDisplay';
import { ApiKeyModal } from './components/ApiKeyModal';
import { Release } from './components/Release';
import { API_KEY_LS_KEY, ITINERARY_LS_KEY, SAVED_ITINERARIES_LS_KEY } from './constants';
import type { FormData, ItineraryPlan } from './types';
import { IconWarning } from './components/icons';

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
  save(): void;
}

declare global {
  interface Window {
    html2pdf: () => Html2Pdf;
  }
}

type View = 'hero' | 'form' | 'loading' | 'result' | 'error' | 'release';

export default function App() {
  const [view, setView] = useState<View>('hero');
  const [itinerary, setItinerary] = useState<ItineraryPlan | null>(null);
  const [savedItineraries, setSavedItineraries] = useState<ItineraryPlan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [lastFormData, setLastFormData] = useState<FormData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const storedApiKey = localStorage.getItem(API_KEY_LS_KEY);
    const storedItinerary = localStorage.getItem(ITINERARY_LS_KEY);
    const storedSavedItineraries = localStorage.getItem(SAVED_ITINERARIES_LS_KEY);

    if (storedApiKey) {
      setApiKey(storedApiKey);
    }

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
      const keyToUse = apiKey || process.env.API_KEY || '';
      const result = await generateItinerary(formData, keyToUse);
      
      const resultWithId = { ...result, id: `${result.destination}-${Date.now()}` };
      setItinerary(resultWithId);
      setView('result');
      localStorage.setItem(ITINERARY_LS_KEY, JSON.stringify(resultWithId));
      setLastFormData(null);
    } catch (e: unknown) {
      const err = e as Error;
      const knownApiErrors = ['API_KEY_INVALID', 'RATE_LIMIT_EXCEEDED', 'API_KEY_MISSING'];

      if (knownApiErrors.includes(err.message)) {
          let userMessage = 'Đã có lỗi xảy ra. Vui lòng cung cấp API Key hợp lệ.';
          if (err.message === 'API_KEY_INVALID') {
              userMessage = 'API Key của bạn không hợp lệ hoặc đã bị vô hiệu hóa. Vui lòng kiểm tra lại.';
          } else if (err.message === 'RATE_LIMIT_EXCEEDED') {
              userMessage = 'Bạn đã đạt đến giới hạn yêu cầu. Vui lòng thử lại sau hoặc sử dụng API Key khác.';
          } else if (err.message === 'API_KEY_MISSING') {
              userMessage = 'Vui lòng cung cấp API Key của bạn để tạo hành trình.';
          }
          setError(userMessage);
setShowApiKeyModal(true);
          setView('form');
      } else {
        setError(err.message || 'Đã có lỗi xảy ra không mong muốn. Vui lòng thử lại.');
        setView('error');
      }
    }
  }, [apiKey]);

  const handleSaveApiKey = (newKey: string) => {
    if (newKey) {
      setApiKey(newKey);
      localStorage.setItem(API_KEY_LS_KEY, newKey);
      setShowApiKeyModal(false);
      setError(null); // Clear previous error
      setView('form'); // Ensure user is on the form view to try again
    }
  };

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

  const handleExportPDF = () => {
    const element = document.getElementById('itinerary-to-print');
    if (element && window.html2pdf) {
      const opt: Html2PdfOptions = {
        margin:       0.5,
        filename:     `MoodTrip_${itinerary?.destination.replace(/ /g, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      window.html2pdf().from(element).set(opt).save();
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

  const renderContent = () => {
    switch (view) {
      case 'hero':
        return <Hero onStart={() => setView('form')} savedItineraries={savedItineraries} onLoadItinerary={handleLoadItinerary} onGoHome={handleGoHome} onGoToRelease={handleGoToRelease} />;
      case 'form':
        return <TripForm
                  onSubmit={handleGenerateItinerary}
                  onBack={() => itinerary ? setView('result') : setView('hero')}
                  error={error}
                  initialData={lastFormData}
                  onGoHome={handleGoHome}
                />;
      case 'loading':
        return <LoadingAnimation />;
      case 'result': {
        if (!itinerary) return null;
        const isSaved = savedItineraries.some(i => i.id === itinerary.id);
        return (
          <ItineraryDisplay 
            itinerary={itinerary} 
            onReset={handleReset} 
            onExportPDF={handleExportPDF} 
            onSaveToList={handleSaveItineraryToList}
            onItineraryChange={handleItineraryChange}
            onGoHome={handleGoHome}
            isSaved={isSaved}
          />
        );
      }
      case 'release':
        return <Release onGoHome={handleGoHome} />;
      case 'error':
        return (
          <div className="text-center p-8 flex flex-col items-center justify-center h-screen bg-red-50 text-red-700">
            <IconWarning className="w-16 h-16 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Ối, có lỗi rồi!</h2>
            <p className="max-w-md mb-6">{error}</p>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        );
      default:
        return <Hero onStart={() => setView('form')} savedItineraries={savedItineraries} onLoadItinerary={handleLoadItinerary} onGoHome={handleGoHome} onGoToRelease={handleGoToRelease} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main>{renderContent()}</main>
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-slate-800 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-up">
          {toastMessage}
        </div>
      )}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => {
          setShowApiKeyModal(false);
          setError(null); // Clear error message when closing modal manually
        }}
        onSave={handleSaveApiKey}
      />
    </div>
  );
}