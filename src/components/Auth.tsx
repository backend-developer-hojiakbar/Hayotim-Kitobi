import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserIcon, Lock, Phone, UserPlus, LogIn, ArrowRight } from 'lucide-react';
import { User } from '../types';

interface AuthProps {
  onAuthComplete: (user: User) => void;
}

export default function Auth({ onAuthComplete }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [matchingUser, setMatchingUser] = useState<User | null>(null);

  // Real-time lookup for user to enable validation animation
  const handlePhoneChange = (phone: string) => {
    setFormData(prev => ({ ...prev, phone }));
    const savedUsersStr = localStorage.getItem('hayotim_kitobi_users');
    if (savedUsersStr) {
      const users: User[] = JSON.parse(savedUsersStr);
      const found = users.find(u => u.phone === phone);
      setMatchingUser(found || null);
    }
  };

  const getPasswordFeedback = () => {
    if (!isLogin || !matchingUser || !formData.password) return null;
    const target = matchingUser.password || '';
    const input = formData.password;
    
    return (
      <div className="flex flex-wrap gap-1 mt-2 px-1">
        {input.split('').map((char, i) => {
          const isMatch = target[i] === char;
          return (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`w-6 h-8 rounded-md flex items-center justify-center text-xs font-bold border ${
                isMatch 
                  ? 'border-green-200 bg-green-50 text-green-600' 
                  : 'border-red-200 bg-red-50 text-red-600'
              }`}
            >
              <div className="flex flex-col items-center">
                <span>*</span>
                <div className="mt-1">
                  {isMatch ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
        {/* Placeholder dots for remaining characters if user knows lengths */}
        {target.length > input.length && isLogin && matchingUser && (
          <div className="flex gap-1 animate-pulse">
            {[...Array(target.length - input.length)].map((_, i) => (
              <div key={i} className="w-6 h-8 rounded-md border border-dashed border-tan/20 flex items-end justify-center pb-1">
                <div className="w-1 h-1 rounded-full bg-tan/40" />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const savedUsersStr = localStorage.getItem('hayotim_kitobi_users');
    const users: User[] = savedUsersStr ? JSON.parse(savedUsersStr) : [];

    if (isLogin) {
      const user = users.find(u => u.phone === formData.phone && u.password === formData.password);
      if (user) {
        onAuthComplete(user);
      } else {
        setError('Telefon raqam yoki parol xato');
      }
    } else {
      // Registration logic
      if (users.find(u => u.phone === formData.phone)) {
        setError('Bu telefon raqami allaqachon ro\'yxatdan o\'tgan');
        return;
      }

      const newUser: User = {
        id: crypto.randomUUID(),
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        password: formData.password
      };

      users.push(newUser);
      localStorage.setItem('hayotim_kitobi_users', JSON.stringify(users));
      onAuthComplete(newUser);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl border border-border-beige"
      >
        <div className="text-center mb-8 space-y-2">
          <h2 className="text-3xl font-serif text-deep-blue">
            {isLogin ? 'Xush kelibsiz' : 'Ro\'yxatdan o\'tish'}
          </h2>
          <p className="text-sm text-[#64748B] font-light">
            {isLogin 
              ? 'Davom etish uchun tizimga kiring' 
              : 'O\'z hayotingiz kitobini boshlash uchun hisob yarating'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div 
                key="register-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-deep-blue/40 uppercase tracking-widest pl-1">Ism</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tan" />
                      <input
                        required
                        type="text"
                        placeholder="Ali"
                        className="w-full pl-10 pr-4 py-3 bg-cream/30 border border-border-beige rounded-xl focus:ring-2 focus:ring-warm-brown outline-none transition-all text-sm"
                        value={formData.firstName}
                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-deep-blue/40 uppercase tracking-widest pl-1">Familiya</label>
                    <div className="relative">
                      <input
                        required
                        type="text"
                        placeholder="Valiyev"
                        className="w-full px-4 py-3 bg-cream/30 border border-border-beige rounded-xl focus:ring-2 focus:ring-warm-brown outline-none transition-all text-sm"
                        value={formData.lastName}
                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1">
            <label className="text-xs font-bold text-deep-blue/40 uppercase tracking-widest pl-1">Telefon raqam</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tan" />
              <input
                required
                type="tel"
                placeholder="+998 90 123 45 67"
                className="w-full pl-10 pr-4 py-3 bg-cream/30 border border-border-beige rounded-xl focus:ring-2 focus:ring-warm-brown outline-none transition-all text-sm"
                value={formData.phone}
                onChange={e => handlePhoneChange(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-deep-blue/40 uppercase tracking-widest pl-1">Parol</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tan" />
              <input
                required
                type="password"
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-cream/30 border border-border-beige rounded-xl focus:ring-2 focus:ring-warm-brown outline-none transition-all text-sm"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            {getPasswordFeedback()}
          </div>

          {error && (
            <p className="text-xs text-red-500 text-center font-medium">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-deep-blue text-white rounded-xl font-semibold shadow-lg hover:bg-warm-brown transition-all flex items-center justify-center space-x-2 group"
          >
            <span>{isLogin ? 'Kirish' : 'Ro\'yxatdan o\'tish'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border-beige text-center">
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-sm text-[#64748B] hover:text-warm-brown transition-colors font-medium flex items-center justify-center space-x-2 mx-auto"
          >
            {isLogin ? (
              <><UserPlus className="w-4 h-4" /> <span>Yangi hisob yaratish</span></>
            ) : (
              <><LogIn className="w-4 h-4" /> <span>Hisobingiz bormi? Kirish</span></>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
