import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, Trash2, MapPin, Calendar, Users, ArrowLeft, Heart } from 'lucide-react';
import { RelatedPerson, User } from '../types';

interface SettingsProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onBack: () => void;
}

export default function Settings({ user, onUpdateUser, onBack }: SettingsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Omit<RelatedPerson, 'id'>>({
    relation: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    address: ''
  });

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    const newPerson: RelatedPerson = {
      ...formData,
      id: crypto.randomUUID()
    };
    
    const updatedUser = {
      ...user,
      relatedPersons: [...(user.relatedPersons || []), newPerson]
    };
    
    onUpdateUser(updatedUser);
    setIsAdding(false);
    setFormData({
      relation: '',
      firstName: '',
      lastName: '',
      birthDate: '',
      address: ''
    });
  };

  const removePerson = (id: string) => {
    const updatedUser = {
      ...user,
      relatedPersons: (user.relatedPersons || []).filter(p => p.id !== id)
    };
    onUpdateUser(updatedUser);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 text-tan hover:text-warm-brown transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Orqaga</span>
        </button>
        <h1 className="text-3xl font-serif text-deep-blue">Sozlamalar</h1>
        <div className="w-20" /> {/* Spacer */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Summary */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-border-beige flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-tan/10 flex items-center justify-center mb-4">
            <Users className="w-12 h-12 text-warm-brown" />
          </div>
          <h2 className="text-xl font-serif text-deep-blue">{user.firstName} {user.lastName}</h2>
          <p className="text-sm text-[#64748B] mb-6">{user.phone}</p>
          
          <div className="w-full pt-6 border-t border-border-beige space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">Yaqinlar soni:</span>
              <span className="font-bold text-deep-blue">{user.relatedPersons?.length || 0}</span>
            </div>
          </div>
        </div>

        {/* Related Persons List */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-deep-blue">
              <Heart className="w-5 h-5 text-red-400" />
              <h3 className="text-xl font-medium">Yaqin insonlar</h3>
            </div>
            {!isAdding && (
              <button 
                onClick={() => setIsAdding(true)}
                className="flex items-center space-x-2 text-xs font-bold text-warm-brown uppercase tracking-widest hover:text-deep-blue transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Qo'shish</span>
              </button>
            )}
          </div>

          <AnimatePresence>
            {isAdding && (
              <motion.form 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleAddPerson}
                className="bg-cream/20 p-6 rounded-2xl border border-dashed border-tan/40 grid grid-cols-2 gap-4"
              >
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-deep-blue/40 uppercase tracking-widest">Alohida unvon (Dada, Ona, Akam...)</label>
                  <input 
                    required
                    className="w-full px-4 py-2 rounded-lg border border-border-beige focus:outline-none focus:ring-2 focus:ring-warm-brown text-sm"
                    value={formData.relation}
                    onChange={e => setFormData({...formData, relation: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-deep-blue/40 uppercase tracking-widest">Ismi</label>
                  <input 
                    required
                    className="w-full px-4 py-2 rounded-lg border border-border-beige focus:outline-none focus:ring-2 focus:ring-warm-brown text-sm"
                    value={formData.firstName}
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-deep-blue/40 uppercase tracking-widest">Familiyasi</label>
                  <input 
                    className="w-full px-4 py-2 rounded-lg border border-border-beige focus:outline-none focus:ring-2 focus:ring-warm-brown text-sm"
                    value={formData.lastName}
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-deep-blue/40 uppercase tracking-widest">Tug'ilgan sanasi</label>
                  <input 
                    type="date"
                    className="w-full px-4 py-2 rounded-lg border border-border-beige focus:outline-none focus:ring-2 focus:ring-warm-brown text-sm"
                    value={formData.birthDate}
                    onChange={e => setFormData({...formData, birthDate: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-deep-blue/40 uppercase tracking-widest">Yashash manzili</label>
                  <input 
                    className="w-full px-4 py-2 rounded-lg border border-border-beige focus:outline-none focus:ring-2 focus:ring-warm-brown text-sm"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <div className="col-span-2 flex justify-end space-x-3 mt-2">
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2 text-sm font-medium text-[#64748B]"
                  >
                    Bekor qilish
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-deep-blue text-white rounded-lg text-sm font-medium hover:bg-warm-brown transition-colors"
                  >
                    Saqlash
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            {(!user.relatedPersons || user.relatedPersons.length === 0) && !isAdding && (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-tan/20">
                <Users className="w-12 h-12 text-tan/30 mx-auto mb-4" />
                <p className="text-sm text-tan">Hali hech kim qo'shilmagan</p>
              </div>
            )}
            {user.relatedPersons?.map((person) => (
              <motion.div 
                layout
                key={person.id}
                className="bg-white p-5 rounded-2xl shadow-sm border border-border-beige flex items-start justify-between group"
              >
                <div className="flex space-x-4">
                  <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center font-bold text-warm-brown">
                    {person.firstName[0]}{person.lastName?.[0] || ''}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-deep-blue">{person.firstName} {person.lastName}</span>
                      <span className="text-[10px] bg-tan/10 text-warm-brown px-2 py-0.5 rounded-full uppercase font-bold tracking-tighter">
                        {person.relation}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-[#64748B]">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{person.birthDate || 'Sana ko\'rsatilmadi'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{person.address || 'Manzil ko\'rsatilmadi'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => removePerson(person.id)}
                  className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
