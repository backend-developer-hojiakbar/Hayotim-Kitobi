import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Share2, RefreshCcw, User, Sparkles, Check, Edit, Headphones, Loader2 } from 'lucide-react';
import { BookContent } from '../types';
import { generateChapterTitle, textToSpeech } from '../services/geminiService';
import { pcmToWav } from '../lib/audioUtils';
// @ts-ignore - html2pdf doesn't have good TS types for the legacy build
import html2pdf from 'html2pdf.js';

interface BookPreviewProps {
  content: BookContent;
  onReset: () => void;
}

export default function BookPreview({ content, onReset }: BookPreviewProps) {
  const [bookData, setBookData] = useState<BookContent>(content);
  const [refiningTitles, setRefiningTitles] = useState<number[]>([]);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const bookRef = useRef<HTMLDivElement>(null);

  // Automatically check for generic titles and refine them
  useEffect(() => {
    const refineTitles = async () => {
      const genericKeywords = ['bob', 'chapter', 'qism', 'title', 'sarlavha', 'untitled'];
      const newChapters = [...bookData.chapters];
      let hasChanges = false;

      for (let i = 0; i < newChapters.length; i++) {
        const title = newChapters[i].title.toLowerCase();
        // More proactive check: if it's very short, or generic, or just a number
        const isGeneric = genericKeywords.some(k => title.includes(k)) && title.split(' ').length <= 2;
        const isJustNumber = /^\d+$/.test(title.trim());
        const isTooShort = title.trim().length < 4;
        
        if (isGeneric || isJustNumber || isTooShort || !newChapters[i].title) {
          hasChanges = true;
          setRefiningTitles(prev => [...prev, i]);
          try {
            // Give each generation a small delay for visual effect
            await new Promise(resolve => setTimeout(resolve, 500 * (i + 1))); 
            const newTitle = await generateChapterTitle(newChapters[i].content);
            newChapters[i].title = newTitle;
            
            // Update progressively
            setBookData(prev => {
              const updated = [...prev.chapters];
              updated[i] = { ...updated[i], title: newTitle };
              return { ...prev, chapters: updated };
            });
          } catch (error) {
            console.error(error);
          } finally {
            setRefiningTitles(prev => prev.filter(idx => idx !== i));
          }
        }
      }
    };

    refineTitles();
  }, [content]);

  const handleManualRefine = async (index: number) => {
    if (refiningTitles.includes(index)) return;
    
    setRefiningTitles(prev => [...prev, index]);
    try {
      const newTitle = await generateChapterTitle(bookData.chapters[index].content);
      const newChapters = [...bookData.chapters];
      newChapters[index].title = newTitle;
      setBookData({ ...bookData, chapters: newChapters });
    } catch (error) {
      console.error(error);
    } finally {
      setRefiningTitles(prev => prev.filter(idx => idx !== index));
    }
  };

  const downloadPDF = () => {
    const element = bookRef.current;
    if (!element) return;

    const opt = {
      margin: 10,
      filename: `${bookData.title}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(element).save();
  };

  const handleDownloadAudio = async () => {
    if (isGeneratingAudio) return;
    
    setIsGeneratingAudio(true);
    try {
      // Concatenate content to read
      const fullText = bookData.chapters.map(ch => `${ch.title}. ${ch.content}`).join("\n\n");
      
      // Limit to 5000 chars for a single TTS call to be safe with model limits
      // For a "full" experience, we could chunk it, but 5000 is a decent amount for a preview
      const base64Audio = await textToSpeech(fullText);
      const audioBlob = pcmToWav(base64Audio);
      
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${bookData.title}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Audio yaratishda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
    } finally {
      setIsGeneratingAudio(false);
    }
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
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={onReset}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-border-beige text-[#64748B] hover:bg-white transition-colors text-xs font-medium"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Qayta Boshlash</span>
          </button>
          
          <button 
            onClick={handleDownloadAudio}
            disabled={isGeneratingAudio}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl border border-tan/30 text-warm-brown font-medium hover:bg-white transition-all text-xs active:scale-95 disabled:opacity-50`}
          >
            {isGeneratingAudio ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Headphones className="w-4 h-4" />
            )}
            <span>{isGeneratingAudio ? "Yaratilmoqda..." : "Audio Yuklab Olish"}</span>
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
            className={`w-full aspect-[1/1.4] rounded-sm shadow-[20px_20px_60px_rgba(30,41,59,0.2)] relative overflow-hidden flex flex-col items-center justify-center p-8 text-center border-l-[12px] border-white/5 ${!bookData.coverImage ? 'bg-deep-blue' : ''}`}
          >
            {bookData.coverImage && (
              <img 
                src={bookData.coverImage} 
                alt="Book cover" 
                className="absolute inset-0 w-full h-full object-cover z-0" 
              />
            )}
            <div className="absolute inset-0 bg-black/40 z-[1]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent_70%)] z-[2]" />
            
            <div className="relative z-10 space-y-8">
              <div className="w-12 h-1 bg-warm-brown mx-auto" />
              <h1 className="text-4xl md:text-5xl font-bold text-cream font-serif leading-tight">
                {bookData.title}
              </h1>
              <div className="flex flex-col items-center space-y-2">
                <User className="w-6 h-6 text-warm-brown opacity-60" />
                <p className="text-sm uppercase tracking-[0.3em] font-medium text-cream/70">
                  {bookData.author}
                </p>
              </div>
            </div>

            <div className="absolute bottom-8 text-[10px] uppercase tracking-[0.4em] text-white/30 font-light z-10">
              Hayotim Kitobi • AI Edition
            </div>
          </motion.div>
          
          <div className="bg-[#F8F5F0] p-6 rounded-2xl border border-border-beige space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-warm-brown font-bold uppercase text-[10px] tracking-widest opacity-80">
                <Sparkles className="w-3 h-3" />
                <span>Mundarija</span>
              </div>
            </div>
            
            <div className="space-y-3">
              {bookData.chapters.map((ch, idx) => (
                <button
                  key={idx}
                  onClick={() => handleManualRefine(idx)}
                  className="w-full group flex items-start space-x-3 p-3 rounded-xl hover:bg-white transition-all text-left border border-transparent hover:border-border-beige"
                >
                  <div className="text-[10px] font-bold text-tan mt-1 w-4">{idx + 1}.</div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium text-deep-blue line-clamp-1 ${refiningTitles.includes(idx) ? 'animate-pulse text-warm-brown' : ''}`}>
                        {ch.title}
                      </span>
                      {refiningTitles.includes(idx) ? (
                        <RefreshCcw className="w-3 h-3 text-warm-brown animate-spin" />
                      ) : (
                        <Edit className="w-3 h-3 text-tan opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#64748B] leading-relaxed font-light italic bg-cream/50 p-3 rounded-lg border border-border-beige">
              "Sarlavhani yangilash uchun uning ustiga bosing."
            </p>
          </div>
        </div>

        {/* Right: Pages Layout (for display and capture) */}
        <div className="lg:col-span-8 h-[75vh] overflow-y-auto pr-6 space-y-8 scroll-smooth custom-scrollbar">
          <div ref={bookRef} className="space-y-0">
            {/* PDF Render Cover */}
            <div className={`book-page flex flex-col items-center justify-center text-center border-l-[16px] border-warm-brown p-20 mb-12 shadow-none relative ${!bookData.coverImage ? 'bg-deep-blue' : ''}`}>
              {bookData.coverImage && (
                <img 
                  src={bookData.coverImage} 
                  alt="Cover" 
                  className="absolute inset-0 w-full h-full object-cover" 
                  crossOrigin="anonymous"
                />
              )}
              <div className="absolute inset-0 bg-black/50" />
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-1 bg-warm-brown/30 mb-8" />
                <h1 className="text-6xl font-bold text-cream font-serif mb-12 uppercase tracking-tighter leading-tight">{bookData.title}</h1>
                <p className="text-xl uppercase tracking-[0.6em] text-cream/60 border-t border-cream/10 pt-6">{bookData.author}</p>
              </div>
            </div>

            {/* Chapters */}
            {bookData.chapters.map((chapter, index) => (
              <div key={index} className="book-page mb-12 shadow-none border border-border-beige">
                <div className="mb-16 border-b border-warm-brown/10 pb-8 relative">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] uppercase tracking-[0.5em] text-warm-brown font-bold opacity-60">BO'LIM {index + 1}</span>
                    <AnimatePresence>
                      {refiningTitles.includes(index) && (
                        <motion.div 
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center space-x-2 text-[10px] text-warm-brown font-bold uppercase tracking-widest animate-pulse"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Mavzu aniqlanmoqda...</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <h2 className={`text-5xl font-light text-deep-blue font-serif leading-none transition-all ${refiningTitles.includes(index) ? 'opacity-30 blur-[2px]' : 'opacity-100'}`}>
                    {chapter.title}
                  </h2>
                </div>

                {chapter.images && chapter.images.length > 0 && (
                  <div className={`grid gap-4 mb-12 ${chapter.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {chapter.images.map((img, i) => (
                      <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-border-beige shadow-md">
                        <img 
                          src={img} 
                          className="w-full h-full object-cover" 
                          alt={`Chapter image ${i}`} 
                          crossOrigin="anonymous" 
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="markdown-body text-lg text-deep-blue/80 leading-[1.8] font-light text-justify">
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
