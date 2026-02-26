import React from 'react';
import { IconHeart, IconGlobe, IconCopyright } from './icons';
import { motion } from 'motion/react';

interface FooterProps {
  onGoHome: () => void;
  onGoToRelease: () => void;
  onGoToTips?: () => void;
  onGoToAbout?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onGoHome, onGoToRelease, onGoToTips, onGoToAbout }) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="relative z-10 border-t border-white/5 mt-auto">
      <div className="glass-dark rounded-none border-0">
        <div className="container mx-auto px-6 py-12">
          {/* Top section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <h3 className="text-xl font-bold text-gradient-nature mb-3">MoodTrip</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Để cảm xúc dẫn đường — Ứng dụng lập kế hoạch du lịch thông minh với AI và trải nghiệm 3D tương tác.
              </p>
            </div>
            
            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Liên kết nhanh</h4>
              <ul className="space-y-2">
                <li>
                  <button onClick={onGoHome} className="text-slate-400 hover:text-teal-400 transition-colors text-sm">
                    Trang chủ
                  </button>
                </li>
                {onGoToTips && (
                  <li>
                    <button onClick={onGoToTips} className="text-slate-400 hover:text-teal-400 transition-colors text-sm">
                      Mẹo du lịch
                    </button>
                  </li>
                )}
                {onGoToAbout && (
                  <li>
                    <button onClick={onGoToAbout} className="text-slate-400 hover:text-teal-400 transition-colors text-sm">
                      Giới thiệu
                    </button>
                  </li>
                )}
                <li>
                  <button onClick={onGoToRelease} className="text-slate-400 hover:text-teal-400 transition-colors text-sm">
                    Phiên bản
                  </button>
                </li>
              </ul>
            </div>
            
            {/* Contact / Social */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Kết nối</h4>
              <div className="flex space-x-3">
                <motion.a
                  href="https://hoainho.info"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2.5 rounded-full bg-white/5 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 border border-white/10 transition-all"
                  title="Website"
                >
                  <IconGlobe className="w-5 h-5" />
                </motion.a>
              </div>
            </div>
          </div>
          
          {/* Divider */}
          <div className="border-t border-white/5 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
              <p className="text-slate-500 text-xs flex items-center gap-1.5">
                <IconCopyright className="w-4 h-4" />
                {currentYear} MoodTrip. Phát triển với
                <IconHeart className="w-3.5 h-3.5 text-red-400 inline" />
                bởi <a href="https://hoainho.info" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300 transition-colors font-medium">Hoài Nhớ</a>
              </p>
              <p className="text-slate-600 text-xs">
                Mọi quyền được bảo lưu.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
