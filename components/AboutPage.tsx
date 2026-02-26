import React from 'react';
import { motion } from 'motion/react';
import { IconChevronLeft, IconHeart, IconGlobe, IconSparkles, IconCopyright, IconUsers } from './icons';

interface AboutPageProps {
  onGoHome: () => void;
}

const techStack = [
  { name: 'React 19', description: 'Thư viện giao diện người dùng' },
  { name: 'TypeScript', description: 'Ngôn ngữ lập trình an toàn kiểu' },
  { name: 'Three.js + R3F', description: 'Hiệu ứng 3D tương tác' },
  { name: 'Tailwind CSS 4', description: 'Framework CSS tiện ích' },
  { name: 'Motion', description: 'Thư viện hoạt ảnh mượt mà' },
  { name: 'Gemini AI', description: 'AI tạo lịch trình thông minh' },
  { name: 'Vite', description: 'Công cụ build nhanh chóng' },
  { name: 'Vercel', description: 'Nền tảng triển khai' },
];

export const AboutPage: React.FC<AboutPageProps> = ({ onGoHome }) => {
  return (
    <div className="min-h-screen pb-10">
      <header className="sticky top-0 z-30 glass-dark border-b border-white/5">
        <div className="max-w-5xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="text-2xl font-bold text-gradient-nature">MoodTrip</div>
          <motion.button
            onClick={onGoHome}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 text-sm font-medium text-teal-400 hover:text-teal-300 flex items-center rounded-lg hover:bg-white/5 transition-colors"
          >
            <IconChevronLeft className="w-5 h-5 mr-1" />
            Quay lại trang chủ
          </motion.button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight text-gradient-aurora text-shadow-md">
            Giới Thiệu
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-shadow-sm">
            Khám phá câu chuyện đằng sau MoodTrip.
          </p>
        </motion.div>

        {/* About Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="glass-dark rounded-3xl p-8 border border-white/5 mb-8"
        >
          <div className="flex items-center mb-4">
            <div className="gradient-nature text-white rounded-full p-2.5 mr-4">
              <IconSparkles className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white">MoodTrip là gì?</h2>
          </div>
          <p className="text-slate-300 leading-relaxed mb-4">
            MoodTrip là ứng dụng lập kế hoạch du lịch thông minh, sử dụng trí tuệ nhân tạo (AI) để tạo ra hành trình du lịch hoàn hảo dựa trên tâm trạng, sở thích và ngân sách của bạn.
          </p>
          <p className="text-slate-300 leading-relaxed">
            Với giao diện 3D tương tác và thiết kế hiện đại, MoodTrip mang đến trải nghiệm lập kế hoạch du lịch hoàn toàn mới — chỉ cần cho biết bạn đang cảm thấy thế nào, AI sẽ lo phần còn lại.
          </p>
        </motion.div>

        {/* Creator Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="glass-dark rounded-3xl p-8 border border-white/5 mb-8"
        >
          <div className="flex items-center mb-4">
            <div className="bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-full p-2.5 mr-4">
              <IconUsers className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white">Nhà phát triển</h2>
          </div>
          <div>
            <h3 className="text-xl font-bold text-teal-400 mb-2">Hoài Nhớ</h3>
            <p className="text-slate-300 leading-relaxed mb-3">
              Một nhà phát triển đam mê công nghệ và du lịch. MoodTrip được tạo ra với mong muốn giúp mọi người dễ dàng lên kế hoạch cho những chuyến đi ý nghĩa.
            </p>
            <a 
              href="https://hoainho.info" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors text-sm font-medium"
            >
              <IconGlobe className="w-4 h-4" />
              hoainho.info
            </a>
          </div>
        </motion.div>

        {/* Tech Stack */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="glass-dark rounded-3xl p-8 border border-white/5 mb-8"
        >
          <div className="flex items-center mb-6">
            <div className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-full p-2.5 mr-4">
              <IconGlobe className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white">Công nghệ sử dụng</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {techStack.map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className="p-4 bg-white/5 rounded-xl border border-white/5 text-center hover:border-teal-500/20 transition-colors"
              >
                <p className="font-semibold text-white text-sm mb-1">{tech.name}</p>
                <p className="text-slate-500 text-xs">{tech.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Copyright */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center text-slate-500 text-sm flex items-center justify-center gap-2"
        >
          <IconCopyright className="w-4 h-4" />
          <span>2025-{new Date().getFullYear()} MoodTrip. Phát triển với</span>
          <IconHeart className="w-4 h-4 text-red-400" />
          <span>bởi <a href="https://hoainho.info" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300 transition-colors">Hoài Nhớ</a></span>
        </motion.div>
      </main>
    </div>
  );
};
