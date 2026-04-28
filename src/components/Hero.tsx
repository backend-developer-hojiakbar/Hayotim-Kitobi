import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, ArrowRight } from 'lucide-react';
import { User } from '../types';

interface HeroProps {
  onStart: () => void;
  user: User | null;
}

export default function Hero({ onStart, user }: HeroProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto px-6 py-20 min-h-screen flex flex-col items-center justify-center text-center space-y-12"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-16 h-16 bg-warm-brown flex items-center justify-center rounded-full shadow-xl mb-4"
      >
        <BookOpen className="w-8 h-8 text-cream" />
      </motion.div>

      <div className="space-y-6">
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-5xl md:text-7xl font-light tracking-tight text-deep-blue leading-tight"
        >
          {user ? `Salom, ${user.firstName}!` : 'Sizning hayotingiz —'} <br />
          <span className="italic font-serif text-warm-brown">
            o'qilishi kerak bo'lgan eng yaxshi asar
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-lg text-[#64748B] max-w-2xl mx-auto font-light leading-relaxed"
        >
          Xotiralaringizni qog'ozga tushiring, AI ularni abadiy durdonaga aylantiradi.
        </motion.p>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="w-full max-w-md"
      >
        <button
          onClick={onStart}
          className="px-10 py-5 bg-deep-blue text-white rounded-2xl text-xl font-medium shadow-2xl hover:bg-warm-brown transition-all transform hover:-translate-y-1 flex items-center justify-center space-x-3 mx-auto group"
        >
          <span>Kitobni yozishni boshlash</span>
          <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="pt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left w-full border-t border-border-beige"
      >
        {[
          { title: "Oddiy va Tez", desc: "Shunchaki xotiralaringizni yozing, qolganini AIga qo'ying." },
          { title: "Professional", desc: "Tajribali yozuvchi kabi shakllantirilgan adabiy matn." },
          { title: "Mangu Xotira", desc: "Tayyor kitobni PDF formatda yuklab oling va saqlang." }
        ].map((item, i) => (
          <div key={i} className="space-y-2">
            <h3 className="font-semibold text-deep-blue text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>{item.title}</h3>
            <p className="text-sm text-[#64748B] leading-relaxed font-light">{item.desc}</p>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
