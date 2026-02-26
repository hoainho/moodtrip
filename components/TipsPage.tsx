import React from 'react';
import { motion } from 'motion/react';
import { IconChevronLeft, IconShield, IconWallet, IconGlobe, IconFood, IconMapPin, IconInfo } from './icons';

interface TipsPageProps {
  onGoHome: () => void;
}

const tipCategories = [
  {
    title: 'Hành lý thông minh',
    icon: <IconInfo className="w-6 h-6" />,
    gradient: 'from-teal-500 to-cyan-500',
    tips: [
      'Luôn mang theo một bản sao hộ chiếu và giấy tờ quan trọng.',
      'Cuộn quần áo thay vì gấp để tiết kiệm không gian vali.',
      'Mang theo túi zip-lock để đựng đồ ướt hoặc đồ dùng vệ sinh.',
      'Chuẩn bị một bộ đồ dự phòng trong hành lý xách tay phòng khi thất lạc vali.',
      'Mang theo adapter sạc đa năng phù hợp với nhiều loại ổ cắm.',
    ],
  },
  {
    title: 'An toàn khi đi du lịch',
    icon: <IconShield className="w-6 h-6" />,
    gradient: 'from-purple-500 to-indigo-500',
    tips: [
      'Chia sẻ lịch trình du lịch với người thân trước khi lên đường.',
      'Lưu số điện thoại khẩn cấp của quốc gia bạn đến.',
      'Mua bảo hiểm du lịch trước mỗi chuyến đi.',
      'Tránh đeo trang sức đắt tiền khi đi tham quan.',
      'Luôn giữ tiền ở nhiều nơi khác nhau, không để hết vào một chỗ.',
    ],
  },
  {
    title: 'Tiết kiệm chi phí',
    icon: <IconWallet className="w-6 h-6" />,
    gradient: 'from-amber-400 to-orange-500',
    tips: [
      'Đặt vé máy bay trước ít nhất 2-3 tháng để có giá tốt nhất.',
      'Sử dụng ứng dụng so sánh giá khách sạn trước khi đặt phòng.',
      'Ăn tại các quán địa phương thay vì nhà hàng du lịch.',
      'Đi vào mùa thấp điểm để tiết kiệm đáng kể chi phí.',
      'Tận dụng phương tiện công cộng thay vì taxi.',
    ],
  },
  {
    title: 'Văn hóa và phong tục',
    icon: <IconGlobe className="w-6 h-6" />,
    gradient: 'from-pink-500 to-rose-500',
    tips: [
      'Tìm hiểu văn hóa và phong tục địa phương trước khi đến.',
      'Học vài câu chào hỏi cơ bản bằng ngôn ngữ bản địa.',
      'Tôn trọng quy định về trang phục tại các địa điểm tôn giáo.',
      'Hỏi xin phép trước khi chụp ảnh người dân địa phương.',
      'Tìm hiểu về tiền tip và phong tục thanh toán tại nơi bạn đến.',
    ],
  },
  {
    title: 'Ẩm thực đường phố',
    icon: <IconFood className="w-6 h-6" />,
    gradient: 'from-lime-400 to-green-500',
    tips: [
      'Chọn quán có đông người địa phương — đó thường là dấu hiệu ngon.',
      'Thử các món ăn đường phố đặc trưng của từng vùng miền.',
      'Mang theo thuốc đau bụng phòng trường hợp thức ăn lạ.',
      'Uống nước đóng chai ở những nơi nguồn nước không đảm bảo.',
      'Hỏi người dân địa phương để biết quán ăn ngon nhất.',
    ],
  },
  {
    title: 'Điểm đến phổ biến',
    icon: <IconMapPin className="w-6 h-6" />,
    gradient: 'from-sky-400 to-blue-500',
    tips: [
      'Đà Lạt — Thành phố ngàn hoa với khí hậu mát mẻ quanh năm.',
      'Hội An — Phố cổ đèn lồng, ẩm thực phong phú và bãi biển đẹp.',
      'Phú Quốc — Đảo ngọc với biển xanh cát trắng và hải sản tươi sống.',
      'Sa Pa — Ruộng bậc thang hùng vĩ và văn hóa dân tộc độc đáo.',
      'Nha Trang — Thành phố biển sôi động với nhiều hoạt động giải trí.',
    ],
  },
];

export const TipsPage: React.FC<TipsPageProps> = ({ onGoHome }) => {
  return (
    <div className="min-h-screen pb-10">
      <header className="sticky top-0 z-30 glass-dark border-b border-white/5">
        <div className="max-w-6xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
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

      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-3 tracking-tight text-gradient-aurora text-shadow-md">
            Mẹo Du Lịch
          </h1>
          <p className="text-center text-slate-300 mb-12 max-w-2xl mx-auto text-shadow-sm">
            Những kinh nghiệm và bí kíp hữu ích giúp chuyến đi của bạn trọn vẹn hơn.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tipCategories.map((category, catIndex) => (
            <motion.div
              key={catIndex}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: catIndex * 0.1 }}
              whileHover={{ y: -5 }}
              className="glass-dark rounded-3xl p-6 border border-white/5 hover:border-teal-500/20 transition-all duration-300"
            >
              <div className="flex items-center mb-4">
                <div className={`bg-gradient-to-br ${category.gradient} text-white rounded-full p-2.5 mr-3`}>
                  {category.icon}
                </div>
                <h3 className="text-lg font-bold text-white">{category.title}</h3>
              </div>
              <ul className="space-y-3">
                {category.tips.map((tip, tipIndex) => (
                  <li key={tipIndex} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <span className="text-teal-400 mt-0.5 flex-shrink-0">•</span>
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};
