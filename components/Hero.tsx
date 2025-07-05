import React from 'react';
import { Logo } from './Logo';

interface HeroProps {
  onStart: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStart }) => {
  return (
    <div className="relative flex flex-col items-center justify-center h-screen text-white overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-animated" 
        style={{ backgroundImage: "url('https://picsum.photos/1920/1080?travel,nature')" }}
      ></div>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      
      <div className="absolute top-6 left-6 z-10">
        <Logo className="text-white" />
      </div>

      <div className="relative z-10 text-center p-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight animate-fade-in-down">
          Không biết đi đâu?
        </h1>
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-sky-400 animate-fade-in-up">
          Hãy để cảm xúc dẫn đường!
        </h2>
        <button
          onClick={onStart}
          className="px-10 py-4 bg-teal-500 text-white font-bold rounded-full text-lg shadow-lg hover:bg-teal-600 transform hover:scale-105 transition-all duration-300 animate-bounce"
        >
          Khám phá chuyến đi của bạn
        </button>
      </div>
    </div>
  );
};
