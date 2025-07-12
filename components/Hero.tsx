import React from 'react';
import { Logo } from './Logo';
import { IconMapPin } from './icons';
import type { ItineraryPlan } from '../types';

interface HeroProps {
  onStart: () => void;
  savedItineraries: ItineraryPlan[];
  onLoadItinerary: (itinerary: ItineraryPlan) => void;
  onGoHome: () => void;
  onGoToRelease: () => void;
}

const gradientClasses = [
    'from-pink-500 to-rose-500',
    'from-purple-500 to-indigo-500',
    'from-teal-500 to-cyan-500',
    'from-amber-400 to-orange-500',
    'from-lime-400 to-green-500',
    'from-sky-400 to-blue-500',
];

export const Hero: React.FC<HeroProps> = ({ onStart, savedItineraries, onLoadItinerary, onGoHome, onGoToRelease }) => {
  return (
    <div className="relative flex flex-col items-center justify-center h-screen text-white overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-animated" 
        style={{ backgroundImage: "url('https://picsum.photos/1920/1080?travel,nature')" }}
      ></div>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      
      <div className="absolute top-6 left-6 z-10">
        <Logo className="text-white" onClick={onGoHome} />
      </div>

      <div className="absolute top-6 right-6 z-10">
        <button
          onClick={onGoToRelease}
          className="px-4 py-2 bg-transparent border border-white text-white rounded-lg hover:bg-white/10 transition-colors"
        >
          Phiên bản
        </button>
      </div>

      <div className="relative z-10 text-center p-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight animate-fade-in-down">
          Không biết đi đâu?
        </h1>
        <h2 className="md:!leading-[1.5] text-4xl sm:text-5xl md:text-6xl font-extrabold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-sky-400 animate-fade-in-up">
          Hãy để cảm xúc dẫn đường!
        </h2>
        <button
          onClick={onStart}
          className="px-10 py-4 bg-teal-500 text-white font-bold rounded-full text-lg shadow-lg hover:bg-teal-600 transform hover:scale-105 transition-all duration-300 animate-bounce"
        >
          Khám phá chuyến đi của bạn
        </button>
      </div>
      
      {savedItineraries && savedItineraries.length > 0 && (
        <div className="absolute bottom-0 left-0 w-full z-10 pb-8 flex flex-col items-center">
          <h3 className="text-center text-white text-lg font-semibold mb-4 tracking-wider">Lịch sử chuyến đi</h3>
          <div className="w-full max-w-7xl marquee-wrapper">
            <div className="marquee space-x-6">
              {savedItineraries.map((trip, index) => {
                const gradient = gradientClasses[index % gradientClasses.length];
                return (
                  <div 
                    key={`${trip.id}-${index}`}
                    onClick={() => onLoadItinerary(trip)}
                    className={`flex items-center space-x-3 px-6 py-3 rounded-xl shadow-lg cursor-pointer transition-transform hover:scale-105 bg-gradient-to-br ${gradient}`}
                  >
                    <IconMapPin className="w-5 h-5" />
                    <span className="font-bold whitespace-nowrap">{trip.destination}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};