import React, { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, BookCheck, History, Trash2, Image as ImageIcon, Upload, X, Check, Mic, MicOff, PlusCircle, Tag, Edit3, Save, Play, Loader2 } from 'lucide-react';
import { Memory } from '../types';
import { AI_ENCOURAGEMENTS, generateVideoScene, textToSpeech } from '../services/geminiService';
import { pcmToWav } from '../lib/audioUtils';

const LIFE_STAGES = [
  { id: 'age-0-5', label: '0-5 yosh gacha', icon: '👣' },
  { id: 'age-5-10', label: '5-10 yosh gacha', icon: '👶' },
  { id: 'age-10-15', label: '10-15 yosh gacha', icon: '🎒' },
  { id: 'age-15-20', label: '15-20 yosh gacha', icon: '🎓' },
  { id: 'age-20-30', label: '20-30 yosh gacha', icon: '📈' },
  { id: 'age-30-50', label: '30-50 yosh gacha', icon: '💼' },
  { id: 'age-50-plus', label: '50+ yosh gacha', icon: '🏠' },
];

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
  const [interimText, setInterimText] = useState('');
  const [currentTip, setCurrentTip] = useState(AI_ENCOURAGEMENTS[0]);
  const [selectedStage, setSelectedStage] = useState('0-5 yosh gacha');
  const [customStages, setCustomStages] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');
  const [pendingMemoryImage, setPendingMemoryImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const memoryImageInputRef = useRef<HTMLInputElement>(null);
  const [videoGeneratingId, setVideoGeneratingId] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<{ memory: Memory; scene: { prompt: string; mood: string }; imageUrl: string; audioUrl?: string } | null>(null);

  const generateVideoForMemory = async (memory: Memory) => {
    setVideoGeneratingId(memory.id);
    try {
      // 1. Generate scene description
      const scene = await generateVideoScene(memory.text);
      
      // 2. Extract best keywords for a high-quality visual if memory has no image
      // We look for environment and character keywords
      const keywords = scene.prompt.split(' ')
        .filter(word => word.length > 4)
        .slice(0, 5)
        .join(',');
      
      // 3. Generate Audio for this memory
      let audioUrl = undefined;
      try {
        const audioBase64 = await textToSpeech(memory.text.replace(/^\[.*?\]\s*/, ''));
        const audioBlob = pcmToWav(audioBase64);
        audioUrl = URL.createObjectURL(audioBlob);
      } catch (e) {
        console.warn("Speech generation failed for video", e);
      }

      setActiveVideo({
        memory,
        scene,
        imageUrl: memory.imageUrl || `https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop&sig=${encodeURIComponent(keywords)}`, // Dynamic fallback
        audioUrl
      });
    } catch (error) {
      console.error("Video generation error:", error);
      alert("Video yaratishda xatolik yuz berdi.");
    } finally {
      setVideoGeneratingId(null);
    }
  };
  const recognitionRef = useRef<any>(null);

  const STAGE_PROMPTS: Record<string, string[]> = {
    '0-5 yosh gacha': ['Ilk qadamlaringiz haqida nimalarni eshitgansiz?', 'Birinchi aytgan so\'zingiz nima bo\'lgan?', 'Eng sevimli o\'yinchog\'ingiz qanday edi?'],
    '5-10 yosh gacha': ['Maktabga ilk bor borgan kuningizni tasvirlang.', 'Birinchi do\'stingiz kim bo\'lgan?', 'Bolalikdagi eng katta sho\'xligingizni eslang.'],
    '10-15 yosh gacha': ['O\'smirlik davridagi orzularingiz qanday edi?', 'Sevimli faningiz yoki qiziqishingiz nima edi?', 'Ilk bor qanday kitob sizda katta taassurot qoldirgan?'],
    '15-20 yosh gacha': ['Talabalik yillaridagi eng hayajonli lahza?', 'Ilk sevgi yoki jiddiy do\'stlik haqida yozing.', ' mustaqil hayotga ilk qadamlar qanday bo\'lgan?'],
    '20-30 yosh gacha': ['Karyerangizdagi ilk yutuq?', 'Oila qurish yoki hayotdagi jiddiy tanlovlar haqida.', 'Sayohatlar va yangi shaharlar...'],
    '30-50 yosh gacha': ['Farzandlaringiz tug\'ilishi va ularning ulg\'ayishi.', 'Hayotiy tajribangizdagi eng muhim saboq.', 'Erishilgan marralar va garmoniya.'],
    '50+ yosh gacha': ['Hayotga boqib nimalarni his qilyapsiz?', 'Nabiralar va oilaviy an\'analar haqida.', 'Hozirgi kundagi eng katta baxtingiz nima?']
  };

  const currentPrompts = STAGE_PROMPTS[selectedStage] || ['Bu bo\'lim uchun xotiralaringizni ulashing...'];

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'uz-UZ'; // Set to Uzbek as requested

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            let result = event.results[i][0].transcript;
            
            // Advanced cleanup for speech-to-text artifacts
            // 1. Remove non-sensical long numbers (5+ digits)
            result = result.replace(/\d{5,}/g, ''); 
            
            // 2. Remove immediate word repetitions (e.g., "borganman borganman")
            result = result.replace(/\b(\w+)\s+\1\b/gi, '$1');

            finalTranscript += result;
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }
        
        setInterimText(currentInterim);
        
        if (finalTranscript.trim()) {
          setInput(prev => {
            const trimmed = prev.trim();
            if (!trimmed) return finalTranscript.trim();
            
            const lastChar = trimmed.slice(-1);
            // Add appropriate spacing if missing
            const needsSpace = !['.', '!', '?', ',', ';', ':'].includes(lastChar);
            const separator = needsSpace ? ' ' : ' ';
            
            return (trimmed + separator + finalTranscript.trim()).trim();
          });
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Sizning brauzeringiz ovozli yozishni qo\'llab-quvvatlamaydi.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const currentStageLabel = [...LIFE_STAGES.map(s => s.label), ...customStages]
      .find(l => l.toLowerCase().includes(selectedStage.toLowerCase())) || selectedStage;

    const newMemory: Memory = {
      id: crypto.randomUUID(),
      text: `[${currentStageLabel}] ${input.trim()}`,
      imageUrl: pendingMemoryImage || undefined,
      timestamp: Date.now()
    };

    setMemories(prev => [...prev, newMemory]);
    setInput('');
    setPendingMemoryImage(null);
    
    const nextTip = AI_ENCOURAGEMENTS[Math.floor(Math.random() * AI_ENCOURAGEMENTS.length)];
    setCurrentTip(nextTip);
  };

  const removeMemory = (id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id));
    if (editingId === id) {
      setEditingId(null);
    }
  };

  const startEditing = (memory: Memory) => {
    setEditingId(memory.id);
    // Remove the stage tag [Stage Name] from the text for editing
    setEditInput(memory.text.replace(/^\[.*?\]\s*/, ''));
  };

  const saveEdit = (id: string) => {
    setMemories(prev => prev.map(m => {
      if (m.id === id) {
        const stageMatch = m.text.match(/^\[(.*?)\]/);
        const stage = stageMatch ? stageMatch[0] : '';
        return { ...m, text: `${stage} ${editInput.trim()}` };
      }
      return m;
    }));
    setEditingId(null);
    setEditInput('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditInput('');
  };

  const handleMemoryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPendingMemoryImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    // Reset value to allow re-uploading the same file
    e.target.value = '';
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
      className="flex h-[calc(100vh-81px)] overflow-hidden bg-[#FBF9F6]"
    >
      {/* Left: Writing Workspace */}
      <section className="w-3/5 flex flex-col border-r border-border-beige shadow-2xl z-10 bg-white">
        {/* Workspace Header */}
        <div className="px-10 pt-10 pb-6 border-b border-border-beige/50">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-2 h-8 bg-warm-brown rounded-full" />
            <h2 className="text-2xl font-serif text-deep-blue">
              {userName}, xotira sahifalari...
            </h2>
          </div>
          <p className="text-sm text-tan font-medium uppercase tracking-widest pl-5">
            Sizning hayot yo'lingiz — bebahol xazina
          </p>
        </div>

        {/* Unified Writing Area */}
        <div className="flex-1 overflow-y-auto px-10 py-6 space-y-8 scrollbar-hide">
          {/* Life Stages - Refined */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.2em] block">
              Hayot bosqichini tanlang
            </label>
            <div className="flex flex-wrap gap-2">
              {LIFE_STAGES.map((stage) => (
                <button
                  key={stage.id}
                  onClick={() => setSelectedStage(stage.label)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl border transition-all text-xs font-medium ${
                    selectedStage === stage.label 
                      ? 'bg-deep-blue border-deep-blue text-white shadow-lg shadow-deep-blue/20 scale-105' 
                      : 'bg-white border-border-beige text-deep-blue hover:border-tan hover:bg-tan/5'
                  }`}
                >
                  <span className="text-lg">{stage.icon}</span>
                  <span>{stage.label}</span>
                </button>
              ))}
              <button 
                onClick={() => {
                  const name = prompt('Yangi bo\'lim nomini kiriting:');
                  if (name) {
                    setCustomStages(prev => [...prev, name]);
                    setSelectedStage(name);
                  }
                }}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-dashed border-tan/40 text-tan hover:border-tan hover:bg-tan/5 transition-all text-xs font-medium group"
              >
                <PlusCircle className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                <span>Yangi bo'lim</span>
              </button>
            </div>
          </div>

          {/* AI Prompts - Integrated as "Thin Cards" */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-warm-brown" />
              <span className="text-[10px] font-bold text-warm-brown uppercase tracking-widest">
                AI Takliflari (Siz uchun maxsus)
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentPrompts.map((prompt, i) => (
                <button 
                  key={i}
                  onClick={() => setInput(prev => prev + (prev ? ' ' : '') + prompt)}
                  className="p-4 bg-[#FBFAF8] border border-tan/20 rounded-xl hover:border-warm-brown hover:bg-white hover:shadow-md transition-all text-left group"
                >
                  <p className="text-xs text-deep-blue leading-relaxed group-hover:text-warm-brown transition-colors">
                    {prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Writing Surface */}
          <div className="relative group min-h-[300px]">
            <div className="absolute top-4 right-4 z-[40] flex space-x-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  memoryImageInputRef.current?.click();
                }}
                className={`p-3 rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer relative overflow-hidden group ${
                  pendingMemoryImage 
                    ? 'bg-warm-brown text-white ring-4 ring-warm-brown/20' 
                    : 'bg-white/90 backdrop-blur text-tan hover:text-warm-brown border border-border-beige'
                }`}
                title="Rasm qo'shish"
              >
                <ImageIcon className="w-5 h-5 relative z-10" />
                {pendingMemoryImage && (
                  <motion.div 
                    layoutId="upload-active"
                    className="absolute inset-0 bg-white/20"
                  />
                )}
              </button>
              <button
                onClick={toggleRecording}
                className={`p-3 rounded-xl transition-all shadow-sm ${
                  isRecording 
                    ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-100' 
                    : 'bg-white text-tan hover:text-red-400 hover:shadow-md border border-border-beige'
                }`}
                title={isRecording ? "To'xtatish" : "Ovozli tasvirlash"}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>
            
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={`w-full min-h-[300px] bg-white border border-border-beige/50 rounded-2xl p-8 pt-8 pr-20 text-lg tracking-tight leading-relaxed focus:ring-0 focus:border-warm-brown/30 outline-none resize-none shadow-sm transition-all font-serif placeholder:text-tan/30 ${
                isRecording ? 'border-red-200 bg-red-50/10' : ''
              }`}
              placeholder={`${selectedStage} haqida yozing... Sahifaning kuchi sizning samimiyatingizda.`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddMemory(e);
                }
              }}
            />

            {/* Floating Notifications within the writing area */}
            <AnimatePresence>
              {pendingMemoryImage && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="absolute bottom-6 left-6 z-20 w-40 aspect-video rounded-xl overflow-hidden border-4 border-white shadow-2xl group"
                >
                  <img src={pendingMemoryImage} className="w-full h-full object-cover" alt="Memory preview" />
                  <button 
                    onClick={() => setPendingMemoryImage(null)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
              {isRecording && interimText && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-6 left-6 right-24 p-4 bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl border border-red-100 z-20"
                >
                  <div className="flex items-center space-x-2 text-[10px] font-bold text-red-500 uppercase tracking-[0.2em] mb-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span>Jonli yozib olinmoqda...</span>
                  </div>
                  <p className="text-base text-deep-blue italic font-serif leading-relaxed line-clamp-2">"{interimText}"</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex justify-between items-center pt-4 pb-10">
             <div className="flex items-center space-x-3 text-tan italic text-xs">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span>{currentTip}</span>
             </div>
             <button 
              onClick={handleAddMemory}
              disabled={!input.trim()}
              className="bg-warm-brown text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#704B30] transition-all flex items-center space-x-3 shadow-lg hover:shadow-xl hover:-translate-y-1 disabled:opacity-30 disabled:translate-y-0 disabled:shadow-none"
            >
              <span>Xotirani saqlash</span>
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>
      {/* Right: Personal Treasure Archive */}
      <section className="w-2/5 p-10 flex flex-col h-full overflow-y-auto bg-[#FBF9F6]">
        <div className="mb-10 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-serif text-deep-blue mb-1">Xotiralar xazinasi</h2>
            <div className="flex items-center space-x-2">
               <div className="w-10 h-1 bg-tan/30 rounded-full" />
               <p className="text-[10px] font-bold text-tan uppercase tracking-[0.2em]">Siz yozgan lavhalar</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-2xl font-serif text-warm-brown">{memories.length}</span>
            <span className="text-[8px] font-bold text-tan uppercase tracking-widest mt-1">Sahifalar</span>
          </div>
        </div>

        {/* Memory Grid */}
        <div className="flex-grow space-y-8 pr-2 mb-10 overflow-y-auto scrollbar-hide">
          <AnimatePresence initial={false}>
            {memories.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40 px-10"
              >
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-tan flex items-center justify-center">
                  <History className="w-10 h-10 text-tan" />
                </div>
                <p className="text-sm font-serif italic text-deep-blue leading-relaxed">
                  Sahifalar hali bo'sh. Birinchi xotirangizni qoldiring va mo'jizani boshlang.
                </p>
              </motion.div>
            ) : (
              Object.entries(
                memories.reduce((acc, m) => {
                  const stageMatch = m.text.match(/^\[(.*?)\]/);
                  const stage = stageMatch ? stageMatch[1] : 'Boshqa';
                  if (!acc[stage]) acc[stage] = [];
                  acc[stage].push(m);
                  return acc;
                }, {} as Record<string, Memory[]>)
              ).map(([stage, stageMemories]) => (
                <div key={stage} className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-xs font-bold text-warm-brown uppercase tracking-[0.3em] whitespace-nowrap">{stage}</h3>
                    <div className="h-[1px] bg-tan/20 flex-1" />
                  </div>
                  
                  <div className="grid gap-4">
                    {stageMemories.map((m) => (
                      <motion.div
                        key={m.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`bg-white p-5 rounded-2xl shadow-sm border border-border-beige/50 relative group transition-all hover:shadow-xl hover:-translate-y-1 ${editingId === m.id ? 'ring-2 ring-warm-brown border-transparent' : ''}`}
                      >
                        {editingId === m.id ? (
                          <div className="space-y-4">
                            {m.imageUrl && (
                              <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-2">
                                <img src={m.imageUrl} className="w-full h-full object-cover" alt="Memory" />
                              </div>
                            )}
                            <textarea
                              value={editInput}
                              onChange={(e) => setEditInput(e.target.value)}
                              className="w-full bg-[#FBFAF8] border border-tan/30 rounded-xl p-3 text-base text-deep-blue focus:ring-1 focus:ring-warm-brown outline-none min-h-[120px] resize-none font-serif"
                              autoFocus
                            />
                            <div className="flex justify-end space-x-3">
                              <button onClick={cancelEdit} className="text-xs font-bold text-tan hover:text-deep-blue uppercase tracking-widest">Bekor qilish</button>
                              <button onClick={() => saveEdit(m.id)} className="bg-warm-brown text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 uppercase tracking-widest"><Save className="w-3 h-3" /><span>Saqlash</span></button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-4">
                              {m.imageUrl && (
                                <div className="w-full aspect-[16/9] rounded-xl overflow-hidden border border-border-beige">
                                  <img src={m.imageUrl} className="w-full h-full object-cover" alt="Memory" />
                                </div>
                              )}
                              <p className="text-sm text-deep-blue leading-relaxed font-serif pr-8">
                                {m.text.replace(/^\[.*?\]\s*/, '')}
                              </p>
                            </div>
                            <div className="absolute top-4 right-4 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => generateVideoForMemory(m)} 
                                disabled={videoGeneratingId === m.id}
                                className="p-2 bg-white/90 backdrop-blur shadow-md text-deep-blue hover:text-warm-brown rounded-full transition-all scale-75 hover:scale-100 disabled:opacity-50"
                                title="AI Video tayyorlash"
                              >
                                {videoGeneratingId === m.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Play className="w-4 h-4 fill-current" />
                                )}
                              </button>
                              <button onClick={() => startEditing(m)} className="p-2 bg-white/90 backdrop-blur shadow-md text-tan hover:text-warm-brown rounded-full transition-all scale-75 hover:scale-100"><Edit3 className="w-4 h-4" /></button>
                              <button onClick={() => removeMemory(m.id)} className="p-2 bg-white/90 backdrop-blur shadow-md text-red-300 hover:text-red-500 rounded-full transition-all scale-75 hover:scale-100"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Footer Section: Cover & Final CTA */}
        <div className="pt-10 border-t border-border-beige/50 mt-auto bg-inherit sticky bottom-0 z-20">
          <div className="flex flex-col space-y-6">
            {/* Minimal Cover Preview */}
            <div className="flex items-center justify-between">
               <div className="space-y-1">
                  <h4 className="text-xs font-bold text-deep-blue uppercase tracking-widest">Kitob muqovasi</h4>
                  <p className="text-[10px] text-tan font-medium">Asaringiz yuzini tanlang</p>
               </div>
               <div className="flex -space-x-2 overflow-hidden">
                  {PREDEFINED_COVERS.slice(0, 4).map((url) => (
                    <button key={url} onClick={() => onCoverSelect(url)} className={`w-8 h-10 rounded-sm border-2 border-white object-cover transition-transform hover:-translate-y-2 ${selectedCover === url ? 'ring-2 ring-warm-brown z-10' : ''}`}>
                      <img src={url} className="w-full h-full object-cover rounded-sm" />
                    </button>
                  ))}
                  <button onClick={() => fileInputRef.current?.click()} className="w-8 h-10 bg-white border-2 border-dashed border-tan flex items-center justify-center rounded-sm hover:-translate-y-2 transition-transform">
                    <PlusCircle className="w-3 h-3 text-tan" />
                  </button>
               </div>
            </div>

            {/* Progress Bar - Simplified */}
            <div className="space-y-2">
               <div className="flex justify-between items-end">
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.2em]">{Math.round(progress)}% yaratildi</span>
               </div>
               <div className="h-1.5 w-full bg-border-beige rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-warm-brown shadow-[0_0_10px_rgba(151,114,84,0.5)]" />
               </div>
            </div>

            <button 
              onClick={onComplete}
              disabled={memories.length < 1}
              className="w-full bg-deep-blue text-white py-5 rounded-2xl font-bold flex items-center justify-center space-x-4 shadow-2xl hover:shadow-deep-blue/40 transition-all hover:-translate-y-1 disabled:opacity-20 disabled:translate-y-0 disabled:shadow-none uppercase tracking-[0.2em] text-xs"
            >
              <BookCheck className="w-5 h-5" />
              <span>Kitobni yaratish</span>
            </button>
          </div>
        </div>
      </section>

      {/* AI Video Modal */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-deep-blue/90 backdrop-blur-xl"
          >
            <button 
              onClick={() => setActiveVideo(null)}
              className="absolute top-8 right-8 text-white/60 hover:text-white transition-colors z-[110]"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="w-full max-w-5xl aspect-video rounded-3xl overflow-hidden shadow-2xl relative bg-black flex items-center justify-center">
              {/* Cinematic Background Layer */}
              <motion.div 
                className="absolute inset-0 z-0"
                initial={{ filter: "blur(20px) brightness(0.2) scale(1.2)" }}
                animate={{ filter: "blur(0px) brightness(0.5) scale(1)" }}
                transition={{ duration: 4, ease: "easeOut" }}
              >
                <motion.img
                  key={activeVideo.imageUrl}
                  src={activeVideo.imageUrl}
                  initial={{ scale: 1.4, x: "-10%", y: "-5%" }}
                  animate={{ 
                    scale: [1.1, 1.15, 1.1], 
                    x: ["-5%", "5%", "-5%"],
                    y: ["-3%", "3%", "-3%"],
                    filter: ["brightness(0.5) contrast(1.1)", "brightness(0.6) contrast(1.2)", "brightness(0.5) contrast(1.1)"]
                  }}
                  transition={{ 
                    duration: 30, 
                    repeat: Infinity, 
                    ease: "easeInOut"
                  }}
                  className="w-full h-full object-cover"
                />
              </motion.div>
              
              {/* Intelligent Light Leaks & Lens Flares */}
              <motion.div 
                className="absolute inset-0 z-[6] mix-blend-screen pointer-events-none"
                style={{
                  background: "radial-gradient(circle at 10% 20%, rgba(255,180,100,0.3) 0%, transparent 60%), radial-gradient(circle at 80% 90%, rgba(100,180,255,0.2) 0%, transparent 60%)"
                }}
                animate={{ 
                  opacity: [0.1, 0.4, 0.1],
                  rotate: [0, 5, 0],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 15, repeat: Infinity }}
              />

              {/* Atmosphere / Weather Particles based on mood */}
              <div className="absolute inset-0 z-[15] pointer-events-none opacity-40">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className={`absolute rounded-full blur-xl ${
                        activeVideo.scene.mood.toLowerCase().includes('happy') ? 'bg-amber-100/30' : 
                        activeVideo.scene.mood.toLowerCase().includes('sad') ? 'bg-blue-100/20' : 'bg-white/10'
                    }`}
                    style={{
                      width: Math.random() * 80 + 20,
                      height: Math.random() * 80 + 20,
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -150, 0],
                      x: [0, (Math.random() - 0.5) * 100, 0],
                      opacity: [0, 0.4, 0],
                      scale: [1, 1.5, 1],
                      filter: ["blur(10px)", "blur(20px)", "blur(10px)"]
                    }}
                    transition={{
                      duration: 12 + Math.random() * 10,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: Math.random() * 5
                    }}
                  />
                ))}
              </div>

              {/* Animated Text: Script Reveal Style */}
              <div className="relative z-20 p-12 max-w-4xl text-center">
                 <motion.div
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   transition={{ duration: 2 }}
                 >
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-center space-x-3 mb-6"
                    >
                      <div className="h-[1px] w-8 bg-warm-brown/50" />
                      <span className="text-[10px] font-bold text-warm-brown uppercase tracking-[0.6em]">
                        {activeVideo.scene.mood} • Vision
                      </span>
                      <div className="h-[1px] w-8 bg-warm-brown/50" />
                    </motion.div>
                    
                    <motion.div
                      className="space-y-6"
                      initial="hidden"
                      animate="visible"
                      variants={{
                        visible: { transition: { staggerChildren: 0.04, delayChildren: 1 } }
                      }}
                    >
                      <h3 className="text-3xl md:text-5xl font-serif text-white leading-tight font-light italic selection:bg-warm-brown/30">
                        {activeVideo.memory.text.replace(/^\[.*?\]\s*/, '').split('').map((char, i) => (
                          <motion.span
                            key={i}
                            variants={{
                              hidden: { opacity: 0, scale: 1.2, filter: "blur(8px)" },
                              visible: { opacity: 1, scale: 1, filter: "blur(0px)" }
                            }}
                          >
                            {char}
                          </motion.span>
                        ))}
                      </h3>
                    </motion.div>

                    <motion.div 
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ delay: 3, duration: 1.5 }}
                      className="h-[1px] w-32 bg-gradient-to-r from-transparent via-warm-brown/40 to-transparent mx-auto mt-12"
                    />
                    
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.6 }}
                      transition={{ delay: 4 }}
                      className="mt-8 flex items-center justify-center space-x-4"
                    >
                       <div className="w-1 h-1 bg-white rounded-full animate-ping" />
                       <span className="text-[9px] text-white/50 uppercase tracking-[0.4em] font-mono">Living Portrait Engine</span>
                       <div className="w-1 h-1 bg-white rounded-full animate-ping" />
                    </motion.div>
                 </motion.div>
              </div>

              {/* Background Music Loop */}
              <audio 
                autoPlay 
                loop 
                src="https://cdn.pixabay.com/audio/2022/03/15/audio_739265f979.mp3" // Soft cinematic ambient
                className="hidden"
                onLoadedMetadata={(e) => (e.currentTarget.volume = 0.3)} 
              />

              {/* Voice Player */}
              {activeVideo.audioUrl && (
                <audio autoPlay src={activeVideo.audioUrl} className="hidden" />
              )}

              {/* Cinematic Grain & Burn Effect overlay */}
              <div className="absolute inset-0 pointer-events-none z-[30] opacity-40 mix-blend-soft-light bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
              <div className="absolute inset-0 pointer-events-none z-[31] bg-gradient-to-t from-black/60 via-transparent to-black/30" />
            </div>
            
            {/* Share/Actions for the Video */}
            <div className="absolute bottom-12 flex space-x-4">
               <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded-full uppercase tracking-widest transition-all">Videoni ulashish</button>
               <button className="px-6 py-3 bg-warm-brown text-white text-[10px] font-bold rounded-full uppercase tracking-widest transition-all shadow-xl">Yuklab olish</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <input type="file" ref={memoryImageInputRef} onChange={handleMemoryImageUpload} accept="image/*" className="hidden" />
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
    </motion.div>
  );
}
