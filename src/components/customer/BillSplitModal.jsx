import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { X, Users, Calculator, CheckCircle2 } from 'lucide-react';

export function BillSplitModal({ isOpen, onClose, cartSubtotal, items, highContrast }) {
  const { t } = useLanguage();
  const [splitType, setSplitType] = useState('equal'); // 'equal' or 'item'
  const [peopleCount, setPeopleCount] = useState(2);
  const [selectedItemIds, setSelectedItemIds] = useState([]);

  if (!isOpen) return null;

  const total = cartSubtotal || 0;

  const equalPerPerson = (total / peopleCount).toFixed(2);

  const itemTotal = items
    .filter(i => selectedItemIds.includes(i.id))
    .reduce((sum, i) => sum + (i.price * i.quantity), 0);

  const toggleItemSelect = (id) => {
    if (selectedItemIds.includes(id)) {
      setSelectedItemIds(selectedItemIds.filter(i => i !== id));
    } else {
      setSelectedItemIds([...selectedItemIds, id]);
    }
  };

  return (
    <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class={`w-full max-w-md rounded-3xl overflow-hidden shadow-2xl transition-all ${highContrast ? 'bg-zinc-950 text-yellow-300 border border-yellow-400' : 'bg-white text-slate-800'}`}>
        
        {/* Header */}
        <div class="p-4 bg-kerala-dark text-white flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <Calculator class="w-5 h-5 text-kerala-secondary" />
            <h2 class="font-extrabold text-base">{t('split_bill')}</h2>
          </div>
          <button onClick={onClose} class="p-1.5 text-white/80 hover:text-white rounded-full">
            <X class="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div class="p-5 space-y-5">
          
          {/* Split Type Selector */}
          <div class="flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setSplitType('equal')}
              class={`flex-1 py-2 rounded-lg font-bold text-xs transition ${splitType === 'equal' ? 'bg-kerala-primary text-white shadow' : 'text-slate-600'}`}
            >
              Split Equally
            </button>
            <button
              onClick={() => setSplitType('item')}
              class={`flex-1 py-2 rounded-lg font-bold text-xs transition ${splitType === 'item' ? 'bg-kerala-primary text-white shadow' : 'text-slate-600'}`}
            >
              Pay For My Items
            </button>
          </div>

          {/* Equal Split Controls */}
          {splitType === 'equal' ? (
            <div class="space-y-4 text-center py-2">
              <span class="text-xs font-bold text-slate-500 uppercase">Number of Diners:</span>
              <div class="flex items-center justify-center space-x-4">
                <button 
                  onClick={() => setPeopleCount(Math.max(2, peopleCount - 1))}
                  class="w-10 h-10 rounded-full bg-slate-100 font-extrabold text-lg text-slate-700 shadow"
                >
                  -
                </button>
                <span class="text-2xl font-black text-slate-900 w-12">{peopleCount}</span>
                <button 
                  onClick={() => setPeopleCount(peopleCount + 1)}
                  class="w-10 h-10 rounded-full bg-kerala-primary font-extrabold text-lg text-white shadow"
                >
                  +
                </button>
              </div>

              <div class="p-4 bg-orange-50 border border-orange-200 rounded-2xl">
                <p class="text-xs font-semibold text-orange-900">Each Diner Pays:</p>
                <p class="text-3xl font-black text-kerala-primary mt-1">₹{equalPerPerson}</p>
                <p class="text-[11px] text-slate-500 mt-1">Total Bill: ₹{total}</p>
              </div>
            </div>
          ) : (
            /* Pay by Item Selector */
            <div class="space-y-3">
              <span class="text-xs font-bold text-slate-500 uppercase">Select items you consumed:</span>
              <div class="max-h-48 overflow-y-auto space-y-2">
                {items.map((item) => {
                  const isChecked = selectedItemIds.includes(item.id);
                  return (
                    <div 
                      key={item.id}
                      onClick={() => toggleItemSelect(item.id)}
                      class={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        isChecked ? 'bg-orange-50 border-kerala-primary' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div class="flex items-center space-x-2">
                        <div class={`w-5 h-5 rounded-md border flex items-center justify-center ${isChecked ? 'bg-kerala-primary text-white' : 'border-slate-300'}`}>
                          {isChecked && <CheckCircle2 class="w-3.5 h-3.5" />}
                        </div>
                        <span class="font-bold text-xs text-slate-800">{item.name_en} (x{item.quantity})</span>
                      </div>
                      <span class="font-extrabold text-xs text-kerala-primary">₹{item.price * item.quantity}</span>
                    </div>
                  );
                })}
              </div>

              <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl flex justify-between items-center text-xs">
                <span class="font-bold text-amber-900">Your Selected Share:</span>
                <span class="font-black text-base text-kerala-primary">₹{itemTotal}</span>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            class="w-full py-3 bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow hover:bg-slate-800"
          >
            Done Splitting
          </button>
        </div>
      </div>
    </div>
  );
}
