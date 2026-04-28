/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, LogOut, User as UserIcon, Settings as SettingsIcon } from 'lucide-react';
import { AppStep, Memory, BookContent, User } from './types';
import { generateBook } from './services/geminiService';
import Hero from './components/Hero';
import MemoryCollector from './components/MemoryCollector';
import ProcessingView from './components/ProcessingView';
import BookPreview from './components/BookPreview';
import Auth from './components/Auth';
import Settings from './components/Settings';

export default function App() {
  const [step, setStep] = useState<AppStep>('hero');
  const [user, setUser] = useState<User | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [selectedCover, setSelectedCover] = useState<string | undefined>(undefined);
  const [bookContent, setBookContent] = useState<BookContent | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('hayotim_kitobi_current_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const progress = useMemo(() => {
    // Progress calculation based on memory count and average length
    const countWeight = Math.min(memories.length * 10, 50);
    const lengthWeight = Math.min(
      memories.reduce((acc, m) => acc + m.text.length, 0) / 20, 
      50
    );
    return countWeight + lengthWeight;
  }, [memories]);

  const handleAuthComplete = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('hayotim_kitobi_current_user', JSON.stringify(newUser));
    setStep('collection');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('hayotim_kitobi_current_user', JSON.stringify(updatedUser));
    
    // Also update in the global users list
    const savedUsersStr = localStorage.getItem('hayotim_kitobi_users');
    if (savedUsersStr) {
      const users: User[] = JSON.parse(savedUsersStr);
      const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
      localStorage.setItem('hayotim_kitobi_users', JSON.stringify(updatedUsers));
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('hayotim_kitobi_current_user');
    setStep('hero');
    setMemories([]);
    setSelectedCover(undefined);
    setBookContent(null);
  };

  const handleStart = () => {
    if (user) {
      setStep('collection');
    } else {
      setStep('auth');
    }
  };

  const handleGenerateBook = async () => {
    if (!user) return;
    setStep('processing');
    try {
      const content = await generateBook(memories, user);
      setBookContent({ ...content, coverImage: selectedCover });
      setStep('preview');
    } catch (error) {
      console.error(error);
      setStep('collection');
    }
  };

  const handleReset = () => {
    setStep('hero');
    setMemories([]);
    setSelectedCover(undefined);
    setBookContent(null);
  };

  return (
    <div className="min-h-screen selection:bg-warm-brown selection:text-white flex flex-col">
      <nav className="px-10 py-6 flex justify-between items-center border-b border-border-beige bg-cream/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-warm-brown rounded-full flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight font-serif">Hayotim Kitobi</span>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="hidden md:flex space-x-6 text-sm font-medium opacity-70">
            <button onClick={handleReset} className="hover:text-warm-brown transition-colors">Bosh sahifa</button>
            <span className="cursor-default">Mening asarlarim</span>
            <button 
              onClick={() => user && setStep('settings')} 
              className="hover:text-warm-brown transition-colors"
            >
              Sozlamalar
            </button>
          </div>

          {user && (
            <div className="flex items-center space-x-4 pl-6 border-l border-border-beige">
              <button 
                onClick={() => setStep('settings')}
                className="flex items-center space-x-2 text-deep-blue group"
              >
                <div className="w-7 h-7 rounded-full bg-tan/20 flex items-center justify-center group-hover:bg-tan/30 transition-colors">
                  <UserIcon className="w-4 h-4 text-warm-brown" />
                </div>
                <span className="text-sm font-medium">{user.firstName}</span>
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 text-[#64748B] hover:text-red-500 transition-colors"
                title="Chiqish"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="flex-grow relative">
        <AnimatePresence mode="wait">
        {step === 'auth' && (
          <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Auth onAuthComplete={handleAuthComplete} />
          </motion.div>
        )}

        {step === 'hero' && (
          <motion.div key="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Hero onStart={handleStart} user={user} />
          </motion.div>
        )}

        {step === 'settings' && user && (
          <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Settings 
              user={user} 
              onUpdateUser={handleUpdateUser} 
              onBack={() => setStep('hero')} 
            />
          </motion.div>
        )}
        
        {step === 'collection' && user && (
          <motion.div key="collection" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <MemoryCollector 
              memories={memories}
              setMemories={setMemories}
              progress={progress}
              onComplete={handleGenerateBook}
              userName={user.firstName}
              selectedCover={selectedCover}
              onCoverSelect={setSelectedCover}
            />
          </motion.div>
        )}

        {step === 'processing' && (
          <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ProcessingView />
          </motion.div>
        )}

        {step === 'preview' && bookContent && (
          <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <BookPreview 
              content={bookContent}
              onReset={handleReset}
            />
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* Subtle Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-warm-brown/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-deep-blue/5 blur-[120px]" />
      </div>
    </div>
  );
}

