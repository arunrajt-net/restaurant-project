import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { X, Plus, Minus, Flame, HeartHandshake } from 'lucide-react';

export function ItemDetailModal({ item, onClose, onAddToCart, highContrast }) {
  const { lang, t } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');

  if (!item) return null;

  const title = lang === 'ml' ? item.name_ml : (lang === 'hi' ? item.name_hi : item.name_en);
  const subtitle = item.name_en;

  const handleAdd = () => {
    onAddToCart(item, quantity, instructions);
    onClose();
  };

  return (
    <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div class={`w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl transition-all max-h-[90vh] flex flex-col ${highContrast ? 'bg-zinc-950 text-yellow-300 border border-yellow-400' : 'bg-white text-slate-800'}`}>
        
        {/* Header Image */}
        <div class="relative h-56 w-full bg-slate-100">
          <img 
            src={item.image_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80'} 
            alt={title}
            class="w-full h-full object-cover"
          />
          <button 
            onClick={onClose}
            class="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full backdrop-blur-md hover:bg-black/80 transition"
          >
            <X class="w-5 h-5" />
          </button>
          
          <div class="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold shadow flex items-center gap-1.5">
            <span class={`w-3 h-3 rounded-full ${item.veg_flag ? 'bg-green-600' : 'bg-red-600'}`}></span>
            <span class="text-slate-800">{item.veg_flag ? t('veg') : t('non_veg')}</span>
          </div>
        </div>

        {/* Content Details */}
        <div class="p-4 overflow-y-auto space-y-4">
          <div>
            <h2 class="text-xl font-extrabold leading-tight">{title}</h2>
            <p class="text-xs text-slate-500 font-medium">{subtitle}</p>
          </div>

          <div class="flex items-center justify-between">
            <div class="text-2xl font-black text-kerala-primary">
              ₹{item.price * quantity}
            </div>

            {/* Quantity Stepper */}
            <div class="flex items-center space-x-3 bg-slate-100 p-1.5 rounded-xl">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                class="w-8 h-8 rounded-lg bg-white shadow flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200"
              >
                <Minus class="w-4 h-4" />
              </button>
              <span class="font-bold text-base px-2">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                class="w-8 h-8 rounded-lg bg-kerala-primary text-white shadow flex items-center justify-center font-bold hover:bg-orange-600"
              >
                <Plus class="w-4 h-4" />
              </button>
            </div>
          </div>

          <p class="text-sm text-slate-600 leading-relaxed">
            {item.description}
          </p>

          {/* Spice Level Scale */}
          <div class="bg-orange-50 p-3 rounded-xl border border-orange-100 flex items-center justify-between text-xs">
            <span class="font-bold text-orange-900 flex items-center gap-1">
              <Flame class="w-4 h-4 text-red-500 fill-red-500" />
              {t('spicy')} Level:
            </span>
            <div class="font-bold text-orange-800">
              {'🌶️'.repeat(item.spice_level)} ({item.spice_level}/5)
            </div>
          </div>

          {/* Special Instructions Field */}
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <HeartHandshake class="w-4 h-4 text-kerala-primary" />
              Special Kitchen Instructions (e.g. "less spicy", "extra coconut oil"):
            </label>
            <input 
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. less salt, extra curry leaves..."
              class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-kerala-primary"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div class="p-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={handleAdd}
            class="w-full py-3.5 bg-kerala-primary hover:bg-orange-600 text-white font-extrabold rounded-2xl shadow-lg transition transform active:scale-95 text-sm flex items-center justify-center gap-2"
          >
            <span>{t('add_to_cart')}</span>
            <span>•</span>
            <span>₹{item.price * quantity}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
