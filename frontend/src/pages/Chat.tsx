import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ChatMessage } from '../types';

const WELCOME: ChatMessage = {
  role: 'assistant',
  content: "Hi! I'm your AI product assistant. Ask me anything about the products in your catalog — prices, categories, recommendations, comparisons, and more.",
  timestamp: new Date(),
};

const SUGGESTIONS = [
  'What are the most expensive products?',
  'Show me all audio products',
  'What products are under $100?',
  'Do you have any headphones?',
];

function Bubble({ msg, userInitial }: { msg: ChatMessage; userInitial: string }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex items-end gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold ${isUser ? 'bg-gray-200 text-gray-600' : 'bg-indigo-600 text-white'}`}>
        {isUser ? userInitial : 'AI'}
      </div>
      <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white border border-gray-100 text-gray-800 shadow-sm rounded-bl-sm'}`}>
        {msg.content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5">
      <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-white">AI</div>
      <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: text.trim(), timestamp: new Date() };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post<{ reply: string }>('/chat', { message: userMsg.content });
      setMessages((m) => [...m, { role: 'assistant', content: data.reply, timestamp: new Date() }]);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      const msg = apiErr.response?.data?.error ?? 'Sorry, something went wrong. Please try again.';
      setMessages((m) => [...m, { role: 'assistant', content: msg, timestamp: new Date() }]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleSubmit = (e: FormEvent) => { e.preventDefault(); send(input); };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const userInitial = user?.email[0].toUpperCase() ?? '?';

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">AI Product Assistant</h1>
            <p className="text-xs text-gray-500">Powered by Gemini — searches your real product catalog</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-gray-50">
        {messages.map((msg, i) => (
          <Bubble key={i} msg={msg} userInitial={userInitial} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions — only shown when just the welcome message exists */}
      {messages.length === 1 && !loading && (
        <div className="px-6 pb-3 bg-gray-50 flex gap-2 flex-wrap">
          {SUGGESTIONS.map((s) => (
            <button
              key={s} onClick={() => send(s)}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-6 py-4 bg-white border-t border-gray-100 flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about products, prices, categories…"
            rows={1}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none leading-relaxed"
            style={{ maxHeight: '120px' }}
          />
          <button
            type="submit" disabled={!input.trim() || loading}
            className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 text-white p-3 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-2 text-center">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
