import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IconMessageCircle, IconSend, IconX, IconSparkles } from './icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const PROXY_URL = 'https://proxy.hoainho.info';
const PROXY_API_KEY = 'hoainho';
const MODEL = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `Bạn là Trợ Lý Du Lịch MoodTrip — một chuyên gia du lịch thân thiện, nhiệt tình và giàu kinh nghiệm.

Nhiệm vụ của bạn:
- Tư vấn về điểm đến, lịch trình, ẩm thực, văn hóa
- Gợi ý hoạt động phù hợp với sở thích và ngân sách
- Chia sẻ mẹo du lịch hữu ích và thực tế
- Trả lời bằng tiếng Việt, thân thiện, ngắn gọn nhưng đầy đủ
- Sử dụng kiến thức mới nhất về du lịch

Định dạng trả lời:
- Sử dụng **in đậm** để nhấn mạnh điểm quan trọng
- Sử dụng danh sách có số thứ tự (1. 2. 3.) hoặc gạch đầu dòng (-) khi liệt kê
- Sử dụng bảng markdown khi so sánh (ví dụ: so sánh điểm đến, chi phí)
- Sử dụng ### tiêu đề phụ khi câu trả lời dài và có nhiều phần
- KHÔNG sử dụng code fences (\`\`\`)

Phong cách: Nhiệt tình, chuyên nghiệp, thân thiện. Trả lời ngắn gọn (2-4 câu cho câu hỏi đơn giản, chi tiết hơn khi cần).`;

async function sendChatMessage(messages: { role: string; content: string }[]): Promise<string> {
  const response = await fetch(`${PROXY_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PROXY_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from AI.');
  return content.trim();
}

const WELCOME_SUGGESTIONS = [
  'Gợi ý điểm đến cho 2 người?',
  'Du lịch Đà Lạt nên đi đâu?',
  'Mẹo tiết kiệm khi du lịch?',
];

export const ChatCompanion: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const chatHistory = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await sendChatMessage(chatHistory);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 gradient-nature rounded-full shadow-lg shadow-teal-500/30 flex items-center justify-center text-white"
            title="Trợ lý du lịch AI"
          >
            <IconMessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 sm:w-[380px] sm:h-[520px] sm:max-h-[calc(100vh-6rem)] flex flex-col bg-[rgba(10,14,26,0.95)] sm:bg-[rgba(10,14,26,0.92)] backdrop-blur-2xl border-0 sm:border border-white/[0.08] shadow-2xl shadow-black/40 overflow-hidden rounded-none sm:rounded-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 gradient-nature rounded-xl flex items-center justify-center shadow-md shadow-teal-500/20">
                  <IconSparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Trợ Lý Du Lịch</h3>
                  <p className="text-xs text-teal-400/80">Luôn sẵn sàng hỗ trợ bạn</p>
                </div>
              </div>
              <motion.button
                onClick={() => setIsOpen(false)}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <IconX className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 gradient-nature rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconSparkles className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-white font-semibold mb-2">Xin chào!</h4>
                  <p className="text-slate-400 text-sm mb-6">Tôi là trợ lý du lịch AI. Hãy hỏi tôi bất cứ điều gì về du lịch!</p>
                  <div className="space-y-2">
                    {WELCOME_SUGGESTIONS.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(suggestion)}
                        className="block w-full text-left px-4 py-2.5 text-sm text-slate-300 bg-white/5 rounded-xl hover:bg-teal-500/10 hover:text-teal-300 border border-white/5 hover:border-teal-500/20 transition-all"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'gradient-nature text-white rounded-2xl rounded-br-md'
                        : 'bg-white/5 text-slate-200 rounded-2xl rounded-bl-md border border-white/5'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <div className="chat-markdown">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/5 rounded-2xl rounded-bl-md px-4 py-3 border border-white/5">
                    <div className="flex space-x-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full bg-teal-400"
                          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-white/5 pb-safe">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Hỏi về du lịch..."
                  disabled={isLoading}
                  className="flex-1 bg-white/5 text-white text-sm rounded-xl px-4 py-2.5 border border-white/10 focus:border-teal-400/50 focus:ring-2 focus:ring-teal-400/20 outline-none placeholder-white/30 transition disabled:opacity-50"
                />
                <motion.button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  whileHover={input.trim() && !isLoading ? { scale: 1.05 } : {}}
                  whileTap={input.trim() && !isLoading ? { scale: 0.95 } : {}}
                  className="p-2.5 gradient-nature rounded-xl text-white disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
                >
                  <IconSend className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
