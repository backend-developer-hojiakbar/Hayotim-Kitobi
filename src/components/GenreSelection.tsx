import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, Heart, Zap, Scroll, Ghost, Sparkles, ArrowRight, MessageSquare } from 'lucide-react';
import { Genre } from '../types';

const GENRES: Genre[] = [
  { id: 'biography', label: 'Biografiya', description: 'Hayotingizning xolis va batafsil bayoni', icon: 'Book' },
  { id: 'drama', label: 'Drama', description: 'Chuqur his-tuyg\'ular va dramatik lahzalar', icon: 'Heart' },
  { id: 'adventure', label: 'Sarguzasht', description: 'Harakatlar va hayajonli voqealar markazida', icon: 'Zap' },
  { id: 'romance', label: 'Romantika', description: 'Sevgi va iliq munosabatlarga asoslangan', icon: 'Sparkles' },
  { id: 'fantasy', label: 'Fantastika', description: 'Hayoliy va sehrli elementlar bilan boyitilgan', icon: 'Ghost' },
  { id: 'other', label: 'Boshqa', description: 'O\'zingiz xohlagan uslubni tasvirlang', icon: 'Scroll' },
];

interface GenreSelectionProps {
  onSelect: (genre: string, customDescription?: string) => void;
}

export default function GenreSelection({ onSelect }: GenreSelectionProps) {
  const [selectedId, setSelectedId] = useState<string>('biography');
  const [customDescription, setCustomDescription] = useState('');

  const getIcon = (name: string) => {
    switch (name) {
      case 'Book': return <Book className="w-6 h-6" />;
      case 'Heart': return <Heart className="w-6 h-6" />;
      case 'Zap': return <Zap className="w-6 h-6" />;
      case 'Sparkles': return <Sparkles className="w-6 h-6" />;
      case 'Ghost': return <Ghost className="w-6 h-6" />;
      case 'Scroll': return <Scroll className="w-6 h-6" />;
      default: return <Book className="w-6 h-6" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 space-y-4"
      >
        <h2 className="text-3xl font-serif text-deep-blue">Kitob janrini tanlang</h2>
        <p className="text-[#64748B] max-w-lg mx-auto">
          Xotiralaringiz qanday ruhda yozilishini xohlaysiz? Tanlangan janr kitobning tiliga va atmosferasiga ta'sir qiladi.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
        {GENRES.map((genre) => (
          <motion.button
            key={genre.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedId(genre.id)}
            className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center text-center space-y-3 ${
              selectedId === genre.id 
                ? 'border-warm-brown bg-white shadow-xl ring-4 ring-warm-brown/5' 
                : 'border-border-beige bg-white/50 hover:bg-white hover:border-tan'
            }`}
          >
            <div className={`p-3 rounded-2xl ${selectedId === genre.id ? 'bg-warm-brown text-white' : 'bg-tan/10 text-warm-brown'}`}>
              {getIcon(genre.icon)}
            </div>
            <div>
              <h3 className="font-bold text-deep-blue">{genre.label}</h3>
              <p className="text-xs text-[#64748B] mt-1">{genre.description}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selectedId === 'other' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full max-w-2xl mt-8 space-y-4 overflow-hidden"
          >
            <div className="p-6 bg-white rounded-3xl border border-warm-brown/30 shadow-inner">
              <label className="flex items-center space-x-2 text-sm font-bold text-deep-blue uppercase tracking-widest mb-3">
                <Scroll className="w-4 h-4 text-warm-brown" />
                <span>Janrni tasvirlab bering</span>
              </label>
              <textarea
                autoFocus
                placeholder="Masalan: 'O'zbek xalq ertaklari uslubida yozilgan, biroz hajviy va sarguzashtga boy bo'lgan asar bo'lsin...'"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                className="w-full h-32 p-4 bg-cream/20 border border-border-beige rounded-2xl focus:outline-none focus:ring-2 focus:ring-warm-brown transition-all resize-none text-sm placeholder-tan/60"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        disabled={selectedId === 'other' && !customDescription.trim()}
        onClick={() => onSelect(selectedId, customDescription)}
        className="mt-12 px-10 py-4 bg-deep-blue text-white rounded-2xl font-bold shadow-2xl hover:bg-warm-brown transition-all flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        <span>Davom etish</span>
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </motion.button>
    </div>
  );
}
