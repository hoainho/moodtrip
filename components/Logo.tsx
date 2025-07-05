import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <svg width="40" height="40" viewBox="0 0 40 40" className="flex-shrink-0 shadow-lg rounded-full">
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#2dd4bf' /* teal-400 */ }} />
            <stop offset="100%" style={{ stopColor: '#38bdf8' /* sky-400 */ }} />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="20" fill="url(#logoGradient)" />
        {/* Stylized M and T */}
        <path d="M10 25 V 15 L 15 20 L 20 15 V 25" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M23 15 H 29 M 26 15 V 25" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
      <span className="font-bold text-2xl tracking-tight">MoodTrip</span>
    </div>
  );
};
