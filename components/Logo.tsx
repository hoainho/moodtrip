import React from 'react';
import LogoImage from '@/logo.png';

export const Logo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <img src={LogoImage} alt="Logo" className="w-16 h-16" />
      <span className="font-bold text-2xl tracking-tight">MoodTrip</span>
    </div>
  );
};
