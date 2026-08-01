import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { X, Bell, Droplet, Receipt, HelpCircle, CheckCircle2 } from 'lucide-react';

export function CallWaiterModal({ isOpen, onClose, tableId, highContrast }) {
  const { t } = useLanguage();
  const [requested, setRequested] = useState(false);

  if (!isOpen) return null;

  const handleCall = (requestType) => {
    fetch('/api/waiter/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table_id: tableId, request_type: requestType })
    })
      .then(res => res.json())
      .then(() => {
        setRequested(true);
        setTimeout(() => {
          setRequested(false);
          onClose();
        }, 2000);
      })
      .catch(err => console.error('Call waiter error:', err));
  };

  return (
    <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class={`w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl transition-all ${highContrast ? 'bg-zinc-950 text-yellow-300 border border-yellow-400' : 'bg-white text-slate-800'}`}>
        
        {/* Header */}
        <div class="p-4 bg-kerala-dark text-white flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <Bell class="w-5 h-5 text-amber-400" />
            <h2 class="font-extrabold text-base">{t('call_waiter')}</h2>
          </div>
          <button onClick={onClose} class="p-1.5 text-white/80 hover:text-white rounded-full">
            <X class="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div class="p-5 space-y-4">
          {requested ? (
            <div class="py-8 text-center space-y-2">
              <CheckCircle2 class="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
              <h3 class="font-bold text-base text-slate-900">Waiter Notified!</h3>
              <p class="text-xs text-slate-500">A staff member will arrive at Table {tableId} shortly.</p>
            </div>
          ) : (
            <>
              <p class="text-xs font-semibold text-slate-600 text-center">What do you need assistance with?</p>
              <div class="grid grid-cols-1 gap-2.5">
                <button
                  onClick={() => handleCall('water')}
                  class="p-3.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-2xl flex items-center space-x-3 transition font-bold text-xs text-slate-800"
                >
                  <Droplet class="w-5 h-5 text-blue-500" />
                  <span>Bring Water (വെള്ളം)</span>
                </button>
                <button
                  onClick={() => handleCall('bill')}
                  class="p-3.5 bg-slate-50 hover:bg-orange-50 border border-slate-200 rounded-2xl flex items-center space-x-3 transition font-bold text-xs text-slate-800"
                >
                  <Receipt class="w-5 h-5 text-orange-500" />
                  <span>Request Paper Bill (ബിൽ)</span>
                </button>
                <button
                  onClick={() => handleCall('general')}
                  class="p-3.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 rounded-2xl flex items-center space-x-3 transition font-bold text-xs text-slate-800"
                >
                  <HelpCircle class="w-5 h-5 text-emerald-500" />
                  <span>General Assistance (സഹായം)</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
