import React from 'react';
import { IconLoader } from './icons';

export const LoadingAnimation: React.FC = () => {
  const messages = [
    "Đang vẽ bản đồ...",
    "Hỏi ý kiến thổ địa...",
    "Đóng gói hành lý...",
    "Kiểm tra khách sạn...",
    "Kiểm tra thời tiết...",
    "Tìm quán ăn ngon...",
  ];
  const [message, setMessage] = React.useState(messages[0]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMessage(prev => {
        const currentIndex = messages.indexOf(prev);
        const nextIndex = (currentIndex + 1) % messages.length;
        return messages[nextIndex];
      });
    }, 2000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-teal-50 text-teal-700">
      <IconLoader className="w-24 h-24 animate-spin mb-8" />
      <h2 className="text-2xl font-semibold transition-opacity duration-500">{message}</h2>
      <p className="mt-2 text-slate-500">Chuyến đi của bạn sắp sẵn sàng rồi!</p>
    </div>
  );
};
