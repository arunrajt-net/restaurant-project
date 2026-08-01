import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { X, Clock, CheckCircle2, Flame, Utensils, Star, CreditCard, Download } from 'lucide-react';

export function OrderTrackerModal({ activeOrder, onClose, onPayNow, onOpenReceipt, highContrast }) {
  const { lang, t } = useLanguage();
  const [ratings, setRatings] = useState({});

  if (!activeOrder) return null;

  const steps = [
    { key: 'placed', label: t('placed'), icon: Clock, desc: 'Order received by kitchen' },
    { key: 'preparing', label: t('preparing'), icon: Flame, desc: 'Chef is cooking your Kerala feast' },
    { key: 'ready', label: t('ready'), icon: Utensils, desc: 'Food is plated & ready' },
    { key: 'served', label: t('served'), icon: CheckCircle2, desc: 'Served at your table' },
  ];

  const currentStatus = activeOrder.status || 'placed';
  const currentStepIndex = steps.findIndex(s => s.key === currentStatus);

  const isPaid = activeOrder.payment_status === 'paid';

  const handleRating = (itemId, star) => {
    setRatings(prev => ({ ...prev, [itemId]: star }));
  };

  return (
    <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div class={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl transition-all max-h-[90vh] flex flex-col ${highContrast ? 'bg-zinc-950 text-yellow-300 border border-yellow-400' : 'bg-white text-slate-800'}`}>
        
        {/* Header */}
        <div class="p-4 bg-kerala-dark text-white flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-kerala-leaf text-white font-extrabold">
                Order #{activeOrder.order_number || '101'}
              </span>
              <span class="text-xs text-orange-200">Table {activeOrder.table_number || activeOrder.table_id}</span>
            </div>
            <h2 class="font-extrabold text-lg mt-0.5">{t('live_tracker')}</h2>
          </div>
          <button onClick={onClose} class="p-2 text-white/80 hover:text-white rounded-full">
            <X class="w-5 h-5" />
          </button>
        </div>

        {/* Tracker Body */}
        <div class="p-5 overflow-y-auto space-y-6">
          
          {/* Progress Timeline */}
          <div class="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-1 before:bg-slate-200">
            {steps.map((step, idx) => {
              const isDone = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const IconComp = step.icon;

              return (
                <div key={step.key} class="relative flex items-start space-x-3">
                  <div 
                    class={`absolute -left-6 top-0.5 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-md transition-all ${
                      isDone 
                        ? 'bg-kerala-primary text-white ring-4 ring-orange-100' 
                        : 'bg-white text-slate-400 border-2 border-slate-300'
                    }`}
                  >
                    <IconComp class="w-4 h-4" />
                  </div>

                  <div class="pl-3">
                    <h4 class={`font-extrabold text-sm ${isDone ? 'text-slate-900' : 'text-slate-400'}`}>
                      {step.label} {isCurrent && <span class="ml-2 text-xs text-kerala-primary animate-pulse">(In Progress...)</span>}
                    </h4>
                    <p class="text-xs text-slate-500">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ordered Dishes Summary */}
          <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h3 class="font-bold text-xs uppercase text-slate-500 tracking-wider">Ordered Items</h3>
            <div class="space-y-2">
              {activeOrder.items?.map((item) => (
                <div key={item.id} class="flex items-center justify-between text-xs">
                  <div class="flex items-center space-x-2">
                    <span class="font-extrabold text-kerala-primary">{item.quantity}x</span>
                    <span class="font-bold text-slate-800">{lang === 'ml' ? item.name_ml : item.name_en}</span>
                  </div>
                  <span class="font-semibold text-slate-600">₹{item.price_per_unit * item.quantity}</span>
                </div>
              ))}
            </div>

            <div class="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-extrabold text-slate-900">
              <span>Total Paid/Due:</span>
              <span class="text-kerala-primary text-base">₹{activeOrder.total_amount}</span>
            </div>
          </div>

          {/* Dish Feedback Rating Section (Active once served) */}
          {currentStatus === 'served' && (
            <div class="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
              <h3 class="font-extrabold text-xs uppercase text-amber-900 flex items-center gap-1">
                <Star class="w-4 h-4 text-amber-500 fill-amber-500" />
                {t('rate_dishes')}
              </h3>
              {activeOrder.items?.map((item) => (
                <div key={item.id} class="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl shadow-sm">
                  <span class="font-bold text-slate-800">{lang === 'ml' ? item.name_ml : item.name_en}</span>
                  <div class="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRating(item.id, star)}
                        class={`text-base transition ${
                          (ratings[item.id] || 0) >= star ? 'text-amber-400 scale-110' : 'text-slate-300'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div class="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-2">
          {!isPaid ? (
            <button
              onClick={onPayNow}
              class="flex-1 py-3 bg-kerala-primary hover:bg-orange-600 text-white font-extrabold rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-xs"
            >
              <CreditCard class="w-4 h-4" />
              <span>{t('pay_now')} (₹{activeOrder.total_amount})</span>
            </button>
          ) : (
            <div class="flex-1 text-center py-2 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-xl border border-emerald-300">
              ✓ Payment Complete
            </div>
          )}

          <button
            onClick={onOpenReceipt}
            class="px-4 py-3 bg-slate-800 text-white font-bold rounded-2xl shadow hover:bg-slate-900 text-xs flex items-center gap-1.5"
          >
            <Download class="w-4 h-4" />
            <span>{t('receipt')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
