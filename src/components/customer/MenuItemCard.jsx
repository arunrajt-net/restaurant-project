import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Plus, Flame, Check } from 'lucide-react';

export function MenuItemCard({ item, onSelect, onAddToCart, cartQuantity, highContrast }) {
  const { lang, t } = useLanguage();

  const title = lang === 'ml' ? item.name_ml : (lang === 'hi' ? item.name_hi : item.name_en);
  const subtitle = lang !== 'en' ? item.name_en : item.name_ml;

  const isSoldOut = item.in_stock === 0;

  return (
    <div 
      class={`rounded-2xl overflow-hidden transition-all duration-200 border flex flex-col justify-between ${
        isSoldOut ? 'opacity-60 grayscale' : 'hover:shadow-lg'
      } ${
        highContrast 
          ? 'bg-zinc-900 border-yellow-400 text-yellow-300' 
          : 'bg-white border-slate-100 shadow-sm'
      }`}
    >
      <div>
        {/* Dish Image & Badges */}
        <div class="relative h-40 w-full overflow-hidden bg-slate-100 cursor-pointer" onClick={() => onSelect(item)}>
          <img 
            src={item.image_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80'} 
            alt={title}
            class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />

          {/* Veg / Non-Veg Indicator Badge */}
          <div class="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur-sm p-1 rounded-md shadow-md border border-slate-200">
            <div class={`w-4 h-4 rounded-sm border-2 flex items-center justify-center ${item.veg_flag ? 'border-green-600' : 'border-red-600'}`}>
              <div class={`w-2 h-2 rounded-full ${item.veg_flag ? 'bg-green-600' : 'bg-red-600'}`}></div>
            </div>
          </div>

          {/* Spice Level Indicator */}
          {item.spice_level > 1 && (
            <div class="absolute top-2 right-2 z-10 bg-black/70 text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 backdrop-blur-sm">
              <Flame class="w-3 h-3 text-red-500 fill-red-500" />
              <span>{'🌶️'.repeat(item.spice_level)}</span>
            </div>
          )}

          {/* Sold Out Overlay */}
          {isSoldOut && (
            <div class="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
              <span class="bg-red-600 text-white font-bold text-xs uppercase px-3 py-1 rounded-md shadow">
                {t('sold_out')}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div class="p-3.5 cursor-pointer" onClick={() => onSelect(item)}>
          <div class="flex items-start justify-between gap-1">
            <div>
              <h3 class={`font-bold text-sm leading-snug ${highContrast ? 'text-yellow-300' : 'text-slate-800'}`}>
                {title}
              </h3>
              <p class={`text-[11px] font-medium ${highContrast ? 'text-yellow-500' : 'text-slate-500'}`}>
                {subtitle}
              </p>
            </div>
          </div>

          <p class={`text-xs mt-1.5 line-clamp-2 ${highContrast ? 'text-zinc-400' : 'text-slate-600'}`}>
            {item.description}
          </p>
        </div>
      </div>

      {/* Footer: Price & Add Button */}
      <div class="px-3.5 pb-3.5 pt-1 flex items-center justify-between border-t border-dashed border-slate-200/50">
        <div class="font-extrabold text-base text-kerala-primary">
          ₹{item.price}
        </div>

        <button
          disabled={isSoldOut}
          onClick={() => onAddToCart(item)}
          class={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition transform active:scale-95 shadow-sm ${
            isSoldOut 
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : cartQuantity > 0
                ? 'bg-kerala-leaf text-white hover:bg-emerald-700'
                : 'bg-kerala-primary text-white hover:bg-orange-600'
          }`}
        >
          {cartQuantity > 0 ? (
            <>
              <Check class="w-3.5 h-3.5" />
              <span>Added ({cartQuantity})</span>
            </>
          ) : (
            <>
              <Plus class="w-3.5 h-3.5" />
              <span>{t('add_to_cart')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
