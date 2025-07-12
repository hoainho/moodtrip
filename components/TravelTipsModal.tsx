import React, { useEffect, useState } from 'react';
import type { TravelTip } from '../types';
import { IconCar, IconBike, IconWalk, IconX, IconTip, IconChevronRight } from './icons';

interface TravelTipsModalProps {
  tips: TravelTip[];
  venue: string;
  onClose: () => void;
}

const getIconForMethod = (method: string): React.ReactNode => {
    const lowerMethod = method.toLowerCase();
    if (lowerMethod.includes('ô tô') || lowerMethod.includes('car') || lowerMethod.includes('taxi') || lowerMethod.includes('bus')) {
        return <IconCar className="w-8 h-8 text-blue-500" />;
    }
    if (lowerMethod.includes('xe máy') || lowerMethod.includes('bike') || lowerMethod.includes('moto')) {
        return <IconBike className="w-8 h-8 text-green-500" />;
    }
    if (lowerMethod.includes('đi bộ') || lowerMethod.includes('walk')) {
        return <IconWalk className="w-8 h-8 text-orange-500" />;
    }
    return <IconTip className="w-8 h-8 text-gray-500" />;
};

export const TravelTipsModal: React.FC<TravelTipsModalProps> = ({ tips, venue, onClose }) => {
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        // Delay to allow fade-in animation
        const timer = setTimeout(() => setShowContent(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setShowContent(false);
        // Delay close to allow fade-out animation
        setTimeout(onClose, 300);
    };

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-300 bg-black/60`}
            onClick={handleClose}
        >
            <div
                className={`bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-out ${showContent ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-teal-800">Mẹo di chuyển</h2>
                            <p className="text-slate-500">Tới: <span className="font-semibold">{venue}</span></p>
                        </div>
                        <button onClick={handleClose} className="p-2 -mr-2 -mt-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                            <IconX className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {tips.map((tip, index) => (
                            <a
                                key={index}
                                href={tip.google_maps_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-4 bg-slate-50 rounded-lg hover:bg-slate-100 hover:shadow-md transition-all group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="mr-4 flex-shrink-0">
                                            {getIconForMethod(tip.method)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">{tip.method} - <span className="font-semibold text-teal-600">{tip.duration}</span></p>
                                            <p className="text-sm text-slate-600">{tip.notes}</p>
                                        </div>
                                    </div>
                                    <IconChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-500 transition-colors" />
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
