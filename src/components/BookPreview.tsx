import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Download, Share2, RefreshCcw, User } from 'lucide-react';
import { BookContent } from '../types';
// @ts-ignore - html2pdf doesn't have good TS types for the legacy build
import html2pdf from 'html2pdf.js';

interface BookPreviewProps {
  content: BookContent;
  onReset: () => void;
}

export default function BookPreview({ content, onReset }: BookPreviewProps) {
  const bookRef = useRef<HTMLDivElement>(null);

  const downloadPDF = () => {
    const element = bookRef.current;
    if (!element) return;

    const opt = {
      margin: 10,
      filename: `${content.title}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-6 py-12"
    >
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-12 space-y-4 md:space-y-0 pb-8 border-b border-border-beige">
        <div className="space-y-1 text-center md:text-left">
          <h2 className="text-4xl font-light text-deep-blue font-serif">Kitob Tayyor!</h2>
          <p className="text-sm text-[#64748B] font-light">Xotiralaringiz endi mangu kitob shaklida.</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={onReset}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl border border-border-beige text-[#64748B] hover:bg-white transition-colors text-sm font-medium"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Qayta Boshlash</span>
          </button>
          <button 
            onClick={downloadPDF}
            className="flex items-center space-x-2 px-6 py-3 bg-warm-brown text-white rounded-xl font-medium hover:bg-[#704B30] transition-all shadow-lg active:scale-95"
          >
            <Download className="w-5 h-5" />
            <span>PDF Yuklab Olish</span>
          </button>
        </div>
      </div>

      {/* Visual Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left: Book Cover Layout */}
        <div className="lg:col-span-4 space-y-6">
          <motion.div
            initial={{ rotateX: 20, rotateY: -10, scale: 0.9 }}
            animate={{ rotateX: 0, rotateY: 0, scale: 1 }}
            className={`w-full aspect-[1/1.4] rounded-sm shadow-[20px_20px_60px_rgba(30,41,59,0.2)] relative overflow-hidden flex flex-col items-center justify-center p-8 text-center border-l-[12px] border-white/5 ${!content.coverImage ? 'bg-deep-blue' : ''}`}
          >
            {content.coverImage && (
              <img 
                src={content.coverImage} 
                alt="Book cover" 
                className="absolute inset-0 w-full h-full object-cover z-0" 
              />
            )}
            <div className="absolute inset-0 bg-black/40 z-[1]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent_70%)] z-[2]" />
            
            <div className="relative z-10 space-y-8">
              <div className="w-12 h-1 bg-warm-brown mx-auto" />
              <h1 className="text-4xl md:text-5xl font-bold text-cream font-serif leading-tight">
                {content.title}
              </h1>
              <div className="flex flex-col items-center space-y-2">
                <User className="w-6 h-6 text-warm-brown opacity-60" />
                <p className="text-sm uppercase tracking-[0.3em] font-medium text-cream/70">
                  {content.author}
                </p>
              </div>
            </div>

            <div className="absolute bottom-8 text-[10px] uppercase tracking-[0.4em] text-white/30 font-light z-10">
              Hayotim Kitobi • AI Edition
            </div>
          </motion.div>
          
          <div className="bg-[#F8F5F0] p-6 rounded-2xl border border-border-beige space-y-4">
            <div className="flex items-center space-x-3 text-warm-brown font-bold uppercase text-[10px] tracking-widest opacity-80">
              <Share2 className="w-3 h-3" />
              <span>Ma'lumot</span>
            </div>
            <p className="text-sm text-[#64748B] leading-relaxed font-light italic">
              "Ushbu kitob sizning shaxsiy xotiralaringiz asosida Gemini AI tomonidan shakllantirildi."
            </p>
          </div>
        </div>

        {/* Right: Pages Layout (for display and capture) */}
        <div className="lg:col-span-8 h-[75vh] overflow-y-auto pr-6 space-y-8 scroll-smooth custom-scrollbar">
          <div ref={bookRef} className="space-y-0">
            {/* PDF Render Cover */}
            <div className={`book-page flex flex-col items-center justify-center text-center border-l-[16px] border-warm-brown p-20 mb-12 shadow-none relative ${!content.coverImage ? 'bg-deep-blue' : ''}`}>
              {content.coverImage && (
                <img 
                  src={content.coverImage} 
                  alt="Cover" 
                  className="absolute inset-0 w-full h-full object-cover" 
                  crossOrigin="anonymous"
                />
              )}
              <div className="absolute inset-0 bg-black/50" />
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-1 bg-warm-brown/30 mb-8" />
                <h1 className="text-6xl font-bold text-cream font-serif mb-12 uppercase tracking-tighter leading-tight">{content.title}</h1>
                <p className="text-xl uppercase tracking-[0.6em] text-cream/60 border-t border-cream/10 pt-6">{content.author}</p>
              </div>
            </div>

            {/* Chapters */}
            {content.chapters.map((chapter, index) => (
              <div key={index} className="book-page mb-12 shadow-none border border-border-beige">
                <div className="mb-16 border-b border-warm-brown/10 pb-8 relative">
                  <span className="text-[10px] uppercase tracking-[0.5em] text-warm-brown block mb-4 font-bold opacity-60">BO'LIM {index + 1}</span>
                  <h2 className="text-5xl font-light text-deep-blue font-serif leading-none">{chapter.title}</h2>
                </div>
                <div className="markdown-body text-xl text-deep-blue/80 leading-[1.9] font-light text-justify">
                  {chapter.content.split('\n').map((para, i) => (
                    <p key={i} className="mb-6">{para}</p>
                  ))}
                </div>
                <div className="mt-24 pt-8 border-t border-warm-brown/5 text-center text-[10px] text-[#94A3B8] tracking-[0.4em] uppercase font-medium">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .page-break-after-always { page-break-after: always; }
          .page-break-before-always { page-break-before: always; }
        }
      `}</style>
    </motion.div>
  );
}
