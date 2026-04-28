import React, { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, BookCheck, History, Trash2, Image as ImageIcon, Upload, X, Check } from 'lucide-react';
import { Memory } from '../types';
import { AI_ENCOURAGEMENTS } from '../services/geminiService';

const PREDEFINED_COVERS = [
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1474932430478-3a7fb9067bd0?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506466010722-395aa2bef877?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1491841573634-28140fc7ced7?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop',
];

interface MemoryCollectorProps {
  memories: Memory[];
  setMemories: Dispatch<SetStateAction<Memory[]>>;
  progress: number;
  userName: string;
  onComplete: () => void;
  selectedCover?: string;
  onCoverSelect: (cover: string | undefined) => void;
}

export default function MemoryCollector({ 
  memories, 
  setMemories, 
  progress, 
  onComplete,
  userName,
  selectedCover,
  onCoverSelect
}: MemoryCollectorProps) {
  const [input, setInput] = useState('');
  const [currentTip, setCurrentTip] = useState(AI_ENCOURAGEMENTS[0]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [memories]);

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMemory: Memory = {
      id: crypto.randomUUID(),
      text: input.trim(),
      timestamp: Date.now()
    };

    setMemories(prev => [...prev, newMemory]);
    setInput('');
    
    const nextTip = AI_ENCOURAGEMENTS[Math.floor(Math.random() * AI_ENCOURAGEMENTS.length)];
    setCurrentTip(nextTip);
  };

  const removeMemory = (id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onCoverSelect(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-[calc(100vh-81px)] overflow-hidden"
    >
      {/* Left: Writing & AI Chat Interface */}
      <section className="w-3/5 p-10 flex flex-col border-r border-border-beige">
        <div className="mb-8">
          <h2 className="text-4xl font-light leading-tight mb-4 text-deep-blue font-serif">
            {userName}, hayotingiz — o'qilishi kerak bo'lgan eng yaxshi asar
          </h2>
          <p className="text-lg text-[#64748B] max-w-md font-light leading-relaxed">
            Xotiralaringizni qog'ozga tushiring, AI ularni abadiy durdonaga aylantiradi.
          </p>
        </div>

        <div className="flex-1 bg-white/50 backdrop-blur-md rounded-2xl border border-border-beige p-6 flex flex-col min-h-0">
          {/* Chat History / Quick Tips */}
          <div className="flex-1 space-y-4 mb-4 overflow-hidden mask-fade-bottom">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentTip}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-start space-x-3"
              >
                <div className="w-8 h-8 rounded-full bg-tan flex-shrink-0 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none shadow-sm border border-[#F1F0EC]">
                  <p className="text-sm italic text-deep-blue/80 opacity-70">
                    {currentTip}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Input Area */}
          <div className="relative mt-auto">
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-40 bg-white border border-border-beige rounded-xl p-4 text-base focus:ring-2 focus:ring-warm-brown outline-none resize-none shadow-inner placeholder-[#94A3B8]"
              placeholder="O'sha unutilmas lahzani tasvirlab bering..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddMemory(e);
                }
              }}
            />
            <button 
              onClick={handleAddMemory}
              disabled={!input.trim()}
              className="absolute bottom-4 right-4 bg-warm-brown text-white px-6 py-2 rounded-lg font-medium hover:bg-[#704B30] transition-colors flex items-center space-x-2 disabled:opacity-30"
            >
              <span>Xotirani qo'shish</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Right: Memory Treasure & Progress */}
      <section className="w-2/5 bg-[#F8F5F0] p-10 flex flex-col h-full overflow-y-auto">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-semibold font-serif">Xotiralar xazinasi</h2>
            <p className="text-xs text-[#64748B] uppercase tracking-widest mt-1">To'plangan lavhalar</p>
          </div>
          <span className="text-xs font-mono bg-white px-2 py-1 rounded border border-border-beige">
            {memories.length} / 12 BO'LIM
          </span>
        </div>

        {/* Memory Cards Stack */}
        <div 
          className="flex-grow space-y-4 pr-2 mb-8"
        >
          <AnimatePresence initial={false}>
            {memories.length === 0 ? (
              <div className="bg-white/40 p-12 rounded-xl border border-dashed border-tan flex flex-col items-center justify-center text-center space-y-3">
                <History className="w-8 h-8 text-tan/40" />
                <span className="text-sm text-[#94A3B8] italic leading-relaxed">
                  Yangi xotira kutilmoqda. Chap tomondagi maydonga yozishni boshlang.
                </span>
              </div>
            ) : (
              memories.map((m, idx) => (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-4 rounded-xl border-l-4 shadow-sm relative group"
                  style={{ borderLeftColor: idx % 2 === 0 ? '#8B5E3C' : '#D2B48C' }}
                >
                  <p className="text-sm text-[#64748B] line-clamp-3 leading-relaxed">"{m.text}"</p>
                  <button 
                    onClick={() => removeMemory(m.id)}
                    className="absolute top-2 right-2 p-1 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Cover Selection */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#64748B] uppercase tracking-widest">
            <ImageIcon className="w-3 h-3" />
            <span>Kitob Muqovasi</span>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {PREDEFINED_COVERS.map((url, i) => (
              <button
                key={i}
                onClick={() => onCoverSelect(url)}
                className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${selectedCover === url ? 'border-warm-brown ring-2 ring-warm-brown/20 scale-[0.98]' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-[1.02]'}`}
              >
                <img src={url} alt="Cover option" className="w-full h-full object-cover" />
                {selectedCover === url && (
                  <div className="absolute inset-0 bg-warm-brown/20 flex items-center justify-center">
                    <div className="bg-warm-brown text-white p-1 rounded-full shadow-lg">
                      <Check className="w-3 h-3" />
                    </div>
                  </div>
                )}
              </button>
            ))}
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`aspect-[3/4] rounded-lg border-2 border-dashed border-tan/40 flex flex-col items-center justify-center space-y-1 text-tan hover:bg-white hover:border-tan transition-all relative ${selectedCover && !PREDEFINED_COVERS.includes(selectedCover) ? 'border-warm-brown bg-white' : ''}`}
            >
              {selectedCover && !PREDEFINED_COVERS.includes(selectedCover) ? (
                <>
                  <img src={selectedCover} className="absolute inset-0 w-full h-full object-cover opacity-20" alt="Uploaded cover" />
                  <div className="relative z-10 flex flex-col items-center">
                    <Check className="w-4 h-4 text-warm-brown mb-1" />
                    <span className="text-[8px] uppercase font-bold text-warm-brown">Tanlandi</span>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span className="text-[10px] uppercase font-bold">Yuklash</span>
                </>
              )}
            </button>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            className="hidden" 
          />
          {selectedCover && (
            <div className="flex justify-start">
              <button 
                onClick={() => onCoverSelect(undefined)}
                className="text-[10px] text-red-400 font-bold uppercase tracking-widest flex items-center space-x-1 hover:text-red-500"
              >
                <X className="w-3 h-3" />
                <span>Muqovani o'chirish</span>
              </button>
            </div>
          )}
        </div>

        {/* Progress & CTA */}
        <div className="pt-8 border-t border-border-beige flex-shrink-0">
          <div className="mb-6">
            <div className="flex justify-between text-xs font-medium mb-2 uppercase tracking-wide opacity-60">
              <span>Kitob yaratilish jarayoni</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-border-beige rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-warm-brown" 
              />
            </div>
          </div>
          
          <button 
            onClick={onComplete}
            disabled={memories.length < 1}
            className="w-full bg-deep-blue text-white py-4 rounded-xl font-semibold flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transition-all disabled:opacity-30 disabled:shadow-none active:scale-[0.98]"
          >
            <BookCheck className="w-5 h-5" />
            <span>Ma'lumotlar tugadi / Kitobni yaratish</span>
          </button>
        </div>
      </section>
    </motion.div>
  );
}
