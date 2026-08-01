import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export function CategoryTabs({ categories, selectedCategory, onSelectCategory, highContrast }) {
  const { lang, t } = useLanguage();

  const getCategoryName = (cat) => {
    if (lang === 'ml') return cat.name_ml;
    if (lang === 'hi') return cat.name_hi;
    return cat.name_en;
  };

  const getCategoryEmoji = (id) => {
    switch (id) {
      case 'cat_bf': return '🌅';
      case 'cat_sadya': return '🍃';
      case 'cat_seafood': return '🐟';
      case 'cat_nonveg': return '🍗';
      case 'cat_snacks': return '🫓';
      case 'cat_drinks': return '☕';
      default: return '🍛';
    }
  };

  return (
    <div class={`sticky top-[60px] z-20 shadow-sm py-2.5 px-3 overflow-x-auto no-scrollbar scroll-smooth ${highContrast ? 'bg-black border-b border-yellow-500' : 'bg-white/95 backdrop-blur-md border-b border-slate-200'}`}>
      <div class="flex items-center space-x-2 max-w-md mx-auto min-w-max">
        
        {/* All Categories Tab */}
        <button
          onClick={() => onSelectCategory('all')}
          class={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
            selectedCategory === 'all'
              ? (highContrast ? 'bg-yellow-400 text-black font-extrabold ring-2 ring-yellow-300' : 'bg-kerala-primary text-white shadow-md')
              : (highContrast ? 'bg-zinc-900 text-yellow-300 border border-yellow-500' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
          }`}
        >
          <span>✨</span>
          <span>{t('all_categories')}</span>
        </button>

        {/* Dynamic Category Tabs */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              class={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isSelected
                  ? (highContrast ? 'bg-yellow-400 text-black font-extrabold ring-2 ring-yellow-300' : 'bg-kerala-primary text-white shadow-md')
                  : (highContrast ? 'bg-zinc-900 text-yellow-300 border border-yellow-500' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
              }`}
            >
              <span>{getCategoryEmoji(cat.id)}</span>
              <span>{getCategoryName(cat)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
