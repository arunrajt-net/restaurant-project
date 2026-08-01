import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { X, Trash2, Plus, Minus, Send, Users, ShieldCheck, CreditCard } from 'lucide-react';

export function SharedCartDrawer({ isOpen, onClose, cartData, restaurantConfig, onUpdateQuantity, onPlaceOrder, onOpenSplitBill, highContrast }) {
  const { lang, t } = useLanguage();
  const [tipPercent, setTipPercent] = useState(5); // Default 5% tip
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  if (!isOpen) return null;

  const items = cartData?.items || [];
  const subtotal = cartData?.subtotal || 0;

  const cgstRate = restaurantConfig?.cgst_rate || 2.5;
  const sgstRate = restaurantConfig?.sgst_rate || 2.5;

  const cgstAmount = Number((subtotal * (cgstRate / 100)).toFixed(2));
  const sgstAmount = Number((subtotal * (sgstRate / 100)).toFixed(2));
  const tipAmount = Number((subtotal * (tipPercent / 100)).toFixed(2));
  const grandTotal = Number((subtotal + cgstAmount + sgstAmount + tipAmount).toFixed(2));

  const handlePlaceOrder = () => {
    onPlaceOrder({
      tip_amount: tipAmount,
      payment_method: paymentMethod
    });
  };

  return (
    <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
      <div class={`w-full max-w-md h-full shadow-2xl flex flex-col transition-all ${highContrast ? 'bg-zinc-950 text-yellow-300 border-l border-yellow-400' : 'bg-white text-slate-800'}`}>
        
        {/* Header */}
        <div class="p-4 bg-kerala-dark text-white flex items-center justify-between border-b border-white/10">
          <div class="flex items-center space-x-2">
            <div class="p-2 bg-kerala-primary rounded-xl text-white">
              <Users class="w-5 h-5" />
            </div>
            <div>
              <h2 class="font-bold text-base leading-tight">{t('shared_cart')}</h2>
              <p class="text-xs text-orange-200 flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live Table Sync Active</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} class="p-2 text-white/80 hover:text-white rounded-full">
            <X class="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items List */}
        <div class="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div class="h-64 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
              <span class="text-4xl">🍃</span>
              <p class="font-bold text-sm">Your table cart is empty</p>
              <p class="text-xs text-slate-400">Add delicious Kerala dishes from the menu!</p>
            </div>
          ) : (
            items.map((item) => {
              const dishTitle = lang === 'ml' ? item.name_ml : (lang === 'hi' ? item.name_hi : item.name_en);
              return (
                <div key={item.id} class="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
                  <div class="flex items-center space-x-3 overflow-hidden">
                    <img src={item.image_url} alt={dishTitle} class="w-12 h-12 rounded-xl object-cover shrink-0" />
                    <div class="overflow-hidden">
                      <h4 class="font-bold text-xs text-slate-800 truncate">{dishTitle}</h4>
                      <p class="text-[11px] text-slate-500 font-medium">₹{item.price} x {item.quantity}</p>
                      {item.special_instructions && (
                        <p class="text-[10px] text-orange-700 italic truncate">"{item.special_instructions}"</p>
                      )}
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div class="flex items-center space-x-2 shrink-0 ml-2">
                    <button 
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      class="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100"
                    >
                      {item.quantity === 1 ? <Trash2 class="w-3.5 h-3.5 text-red-500" /> : <Minus class="w-3.5 h-3.5" />}
                    </button>
                    <span class="font-bold text-xs px-1">{item.quantity}</span>
                    <button 
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      class="w-7 h-7 rounded-lg bg-kerala-primary text-white flex items-center justify-center font-bold hover:bg-orange-600"
                    >
                      <Plus class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bill Summary & Breakdown */}
        {items.length > 0 && (
          <div class="p-4 border-t border-slate-200 bg-slate-50/80 space-y-3">
            
            {/* Tip Selection */}
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-slate-700">Add Tip / Service:</span>
              <div class="flex space-x-1">
                {[0, 5, 10, 15].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setTipPercent(pct)}
                    class={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      tipPercent === pct ? 'bg-kerala-primary text-white' : 'bg-white border border-slate-300 text-slate-700'
                    }`}
                  >
                    {pct === 0 ? 'No Tip' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div class="space-y-1.5 text-xs text-slate-600 border-t border-slate-200/80 pt-2">
              <div class="flex justify-between">
                <span>{t('subtotal')}:</span>
                <span class="font-bold">₹{subtotal}</span>
              </div>
              <div class="flex justify-between">
                <span>CGST ({cgstRate}%):</span>
                <span class="font-bold">₹{cgstAmount}</span>
              </div>
              <div class="flex justify-between">
                <span>SGST ({sgstRate}%):</span>
                <span class="font-bold">₹{sgstAmount}</span>
              </div>
              {tipAmount > 0 && (
                <div class="flex justify-between text-emerald-700 font-medium">
                  <span>Chef Tip ({tipPercent}%):</span>
                  <span class="font-bold">₹{tipAmount}</span>
                </div>
              )}
              <div class="flex justify-between text-sm font-extrabold text-slate-900 border-t border-slate-300 pt-1">
                <span>{t('grand_total')}:</span>
                <span class="text-kerala-primary font-black text-base">₹{grandTotal}</span>
              </div>
            </div>

            {/* Payment Method Toggle & Split Bill Trigger */}
            <div class="flex items-center justify-between gap-2 pt-1">
              <div class="flex items-center space-x-2">
                <button
                  onClick={() => setPaymentMethod('UPI')}
                  class={`px-3 py-1.5 rounded-xl text-xs font-bold border ${paymentMethod === 'UPI' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-700 border-slate-300'}`}
                >
                  ⚡ UPI (GPay/PhonePe)
                </button>
                <button
                  onClick={() => setPaymentMethod('CARD')}
                  class={`px-3 py-1.5 rounded-xl text-xs font-bold border ${paymentMethod === 'CARD' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300'}`}
                >
                  💳 Card / Cash
                </button>
              </div>

              <button
                onClick={onOpenSplitBill}
                class="text-xs font-bold text-kerala-primary underline hover:text-orange-700"
              >
                {t('split_bill')}
              </button>
            </div>

            {/* Send to Kitchen Action */}
            <button
              onClick={handlePlaceOrder}
              class="w-full py-3.5 bg-gradient-to-r from-kerala-primary to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold rounded-2xl shadow-xl transition transform active:scale-95 text-sm flex items-center justify-center gap-2"
            >
              <Send class="w-4 h-4" />
              <span>{t('send_to_kitchen')}</span>
              <span>•</span>
              <span>₹{grandTotal}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
