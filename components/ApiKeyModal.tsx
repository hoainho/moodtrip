import React, { useState, useEffect } from 'react';
import { IconKey, IconCopy } from './icons';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave }) => {
  const [key, setKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const aiStudioUrl = "https://aistudio.google.com/app/apikey";

  useEffect(() => {
    if (isOpen) {
      // Use a timeout to allow the background to fade in first
      const timer = setTimeout(() => setShowContent(true), 50);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
      // Reset state after animation out
      const timer = setTimeout(() => {
        setKey('');
        setCopied(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (key.trim()) {
      onSave(key.trim());
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(aiStudioUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-300 ${isOpen ? 'bg-black/60' : 'bg-transparent'}`}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 ease-out ${showContent ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 space-y-6">
            <div className="text-center">
                <div className="inline-block p-4 bg-teal-100 rounded-full mb-4">
                    <IconKey className="w-12 h-12 text-teal-500"/>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Cần có API Key của bạn</h2>
                <p className="text-slate-500 mt-1">Để tiếp tục, vui lòng cung cấp khóa API Gemini của riêng bạn.</p>
            </div>
            
            <div className="text-sm text-slate-600 bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-2">
                <p className="font-semibold text-slate-700">Làm thế nào để lấy API Key?</p>
                <div className="flex justify-between items-center">
                   <p>1. Truy cập <a href={aiStudioUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-teal-600 hover:underline">Google AI Studio</a></p>
                    <button onClick={copyUrl} title="Sao chép liên kết" className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-200 rounded-md transition-colors">
                        {copied ? <span className="text-xs font-semibold text-teal-600">Đã chép!</span> : <IconCopy className="w-4 h-4" />}
                    </button>
                </div>
                <p>2. Nhấn "Create API key" để tạo khóa mới (miễn phí).</p>
                <p>3. Sao chép và dán khóa đó vào ô bên dưới.</p>
                <p className="!mt-3 pt-2 border-t border-slate-200 text-xs text-slate-500">API Key của bạn sẽ chỉ được lưu trữ trong trình duyệt này.</p>
            </div>

            <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-slate-700 mb-2">Gemini API Key</label>
                <div className="relative">
                    <input
                        type="password"
                        id="apiKey"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder="Dán API Key của bạn vào đây"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                    />
                </div>
            </div>
            
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-4">
                <button
                    onClick={onClose}
                    className="mt-2 sm:mt-0 w-full sm:w-auto px-6 py-2 text-slate-600 font-semibold rounded-lg hover:bg-slate-100 transition-colors"
                >
                    Để sau
                </button>
                <button
                    onClick={handleSave}
                    disabled={!key.trim()}
                    className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:from-slate-300 disabled:to-slate-400 disabled:shadow-none disabled:scale-100 disabled:cursor-not-allowed"
                >
                    Lưu & Tạo lại hành trình
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};