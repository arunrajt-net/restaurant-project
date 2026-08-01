import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Bell, ShoppingBag, Mic, Globe, Contrast } from 'lucide-react';

export function Header({ tableNumber, cartItemCount, onOpenCart, onOpenVoice, onOpenWaiterCall, highContrast, setHighContrast }) {
  const { lang, setLang, t } = useLanguage();

  return (
    <header class={`sticky top-0 z-30 shadow-md ${highContrast ? 'bg-black text-yellow-300 border-b-2 border-yellow-400' : 'bg-kerala-dark text-white border-b border-kerala-primary/20'}`}>
      <div class="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* Restaurant Branding & Table Indicator */}
        <div class="flex items-center space-x-2">
          <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-kerala-primary to-kerala-secondary flex items-center justify-center shadow-lg font-bold text-lg text-white">
            🍛
          </div>
          <div>
            <h1 class="font-bold text-base leading-tight tracking-wide flex items-center gap-1.5">
              {t('restaurant_title')}
            </h1>
            <div class="flex items-center gap-2 text-xs opacity-90">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full font-semibold bg-kerala-leaf text-white text-[10px]">
                {t('table')} {tableNumber || 1}
              </span>
              <span class="text-kerala-secondary text-[11px] truncate max-w-[130px]">
                {t('tagline')}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div class="flex items-center space-x-2">
          
          {/* High Contrast Toggle */}
          <button 
            onClick={() => setHighContrast(!highContrast)}
            title="Toggle Accessibility High Contrast"
            class="p-2 rounded-full hover:bg-white/10 transition-colors text-amber-300"
          >
            <Contrast class="w-5 h-5" />
          </button>

          {/* Language Selector */}
          <div class="relative flex items-center bg-white/10 rounded-lg px-2 py-1 text-xs">
            <Globe class="w-3.5 h-3.5 mr-1 text-kerala-secondary" />
            <select 
              value={lang} 
              onChange={(e) => setLang(e.target.value)}
              class="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value="ml" class="bg-kerala-dark text-white">മലയാളം</option>
              <option value="en" class="bg-kerala-dark text-white">English</option>
              <option value="hi" class="bg-kerala-dark text-white">हिंदी</option>
            </select>
          </div>

          {/* Call Waiter */}
          <button
            onClick={onOpenWaiterCall}
            title={t('call_waiter')}
            class="p-2 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition"
          >
            <Bell class="w-5 h-5" />
          </button>

          {/* Floating Cart Icon */}
          <button
            onClick={onOpenCart}
            class="relative p-2.5 rounded-full bg-kerala-primary hover:bg-orange-600 text-white shadow-lg transition transform active:scale-95"
          >
            <ShoppingBag class="w-5 h-5" />
            {cartItemCount > 0 && (
              <span class="absolute -top-1 -right-1 bg-kerala-secondary text-slate-900 font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
