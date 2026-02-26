import React, { useEffect, useState } from 'react';
import type { TravelTip } from '../types';
import { IconCar, IconBike, IconWalk, IconX, IconTip, IconChevronRight } from './icons';
import { motion, AnimatePresence } from 'motion/react';

interface TravelTipsModalProps {
  tips: TravelTip[];
  venue: string;
  onClose: () => void;
}

const getIconForMethod = (method: string): React.ReactNode => {
    const lowerMethod = method.toLowerCase();
    if (lowerMethod.includes('o to') || lowerMethod.includes('car') || lowerMethod.includes('taxi') || lowerMethod.includes('bus') || lowerMethod.includes('xe buyt') || lowerMethod.includes('tau')) {
        return <IconCar className="w-8 h-8 text-blue-400" />;
    }
    if (lowerMethod.includes('xe may') || lowerMethod.includes('bike') || lowerMethod.includes('moto')) {
        return <IconBike className="w-8 h-8 text-green-400" />;
    }
    if (lowerMethod.includes('di bo') || lowerMethod.includes('walk')) {
        return <IconWalk className="w-8 h-8 text-orange-400" />;
    }
    return <IconTip className="w-8 h-8 text-teal-400" />;
};

export const TravelTipsModal: React.FC<TravelTipsModalProps> = ({ tips, venue, onClose }) => {
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowContent(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setShowContent(false);
        setTimeout(onClose, 300);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={showContent ? { scale: 1, opacity: 1, y: 0 } : { scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="glass-dark rounded-3xl w-full max-w-lg shadow-2xl shadow-teal-500/10 border border-white/10"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-white">Mẹo di chuyển</h2>
                                <p className="text-slate-400">Tới: <span className="font-semibold text-teal-400">{venue}</span></p>
                            </div>
                            <motion.button 
                                onClick={handleClose} 
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-2 -mr-2 -mt-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                            >
                                <IconX className="w-6 h-6" />
                            </motion.button>
                        </div>

                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                            {tips.map((tip, index) => (
                                <motion.a
                                    key={index}
                                    href={tip.google_maps_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ scale: 1.02, x: 5 }}
                                    className="block p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group border border-white/5 hover:border-teal-500/30"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="mr-4 flex-shrink-0">
                                                {getIconForMethod(tip.method)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">{tip.method} - <span className="font-semibold text-teal-400">{tip.duration}</span></p>
                                                <p className="text-sm text-slate-400">{tip.notes}</p>
                                            </div>
                                        </div>
                                        <IconChevronRight className="w-5 h-5 text-slate-600 group-hover:text-teal-400 transition-colors" />
                                    </div>
                                </motion.a>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
