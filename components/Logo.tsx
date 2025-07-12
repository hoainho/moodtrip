import React from 'react';
import LogoImage from '@/logo.png';

export const Logo: React.FC<{ className?: string, onClick?: () => void }> = ({ className, onClick }) => {
  return (
    <div 
      onClick={onClick} 
      className={`flex items-center space-x-3 ${className} ${onClick ? 'cursor-pointer' : ''}`} 
      role={onClick ? "button" : undefined} 
      tabIndex={onClick ? 0 : undefined} 
      onKeyDown={(e) => { if(onClick && e.key === 'Enter') onClick() }}
      aria-label="MoodTrip Home"
    >
      <img src={LogoImage} alt="Logo" className="w-16 h-16" />
      <span className="font-bold text-2xl tracking-tight">MoodTrip</span>
    </div>
  );
};
