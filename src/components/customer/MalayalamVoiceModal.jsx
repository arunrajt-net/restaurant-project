import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Mic, MicOff, Volume2, X, Check, AlertCircle, Sparkles, Hand } from 'lucide-react';

export function MalayalamVoiceModal({ isOpen, onClose, onAddToCart, highContrast }) {
  const { lang, t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [matches, setMatches] = useState([]);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [fallbackDishes, setFallbackDishes] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);

  // Load fallback dishes
  useEffect(() => {
    if (isOpen) {
      fetch('/api/voice/fallback-dishes')
        .then(res => res.json())
        .then(data => setFallbackDishes(data || []))
        .catch(err => console.error('Error fetching fallback dishes:', err));
    }
  }, [isOpen]);

  // Web Speech API Initialization
  const startListening = () => {
    setErrorMsg('');
    setTranscript('');
    setMatches([]);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setErrorMsg('Web Speech API is not supported in this browser. Please use the Quick Tap Menu below!');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ml-IN'; // Malayalam India
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech error:', event.error);
        setIsListening(false);
        setErrorMsg('Could not capture audio clearly. Please try again or tap a dish below!');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Recognition error:', err);
      setIsListening(false);
      setSpeechSupported(false);
    }
  };

  // Perform voice match request whenever transcript finishes or manual submit
  const handleProcessTranscript = (textToMatch) => {
    const query = textToMatch || transcript;
    if (!query) return;

    fetch('/api/voice/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: query })
    })
      .then(res => res.json())
      .then(data => {
        setMatches(data.matches || []);
        setSelectedQuantity(data.quantity || 1);
        if (data.matches && data.matches.length > 0) {
          speakMatchReadback(data.matches[0].item.name_ml, data.quantity);
        } else {
          setErrorMsg('No exact match found. Please tap one of the dishes below!');
        }
      })
      .catch(err => console.error('Match error:', err));
  };

  // Text-To-Speech read back
  const speakMatchReadback = (dishName, qty) => {
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance(`${qty} ${dishName} കാർട്ടിലേക്ക് ചേർക്കട്ടെ?`);
      msg.lang = 'ml-IN';
      window.speechSynthesis.speak(msg);
    }
  };

  if (!isOpen) return null;

  return (
    <div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div class={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl transition-all max-h-[90vh] flex flex-col ${highContrast ? 'bg-zinc-950 text-yellow-300 border border-yellow-400' : 'bg-white text-slate-800'}`}>
        
        {/* Header */}
        <div class="p-4 bg-gradient-to-r from-kerala-primary to-orange-600 text-white flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <div class="p-2 bg-white/20 rounded-full">
              <Mic class="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 class="font-bold text-base leading-tight">ശബ്ദ ഓർഡർ (Malayalam Voice Assistant)</h2>
              <p class="text-xs text-orange-100 font-medium">Say dish name in Malayalam or tap quick options</p>
            </div>
          </div>
          <button onClick={onClose} class="p-1.5 rounded-full hover:bg-white/20 text-white">
            <X class="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div class="p-5 overflow-y-auto space-y-5">
          
          {/* Main Voice Mic Button Area */}
          <div class="flex flex-col items-center justify-center py-4 bg-orange-50/50 rounded-2xl border border-orange-100">
            <button
              onClick={startListening}
              class={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 transform active:scale-95 shadow-xl ${
                isListening 
                  ? 'bg-red-600 text-white pulse-mic' 
                  : 'bg-gradient-to-tr from-kerala-primary to-kerala-secondary text-white hover:shadow-orange-300/50'
              }`}
            >
              {isListening ? <MicOff class="w-10 h-10 animate-bounce" /> : <Mic class="w-10 h-10" />}
            </button>

            <p class="mt-3 font-extrabold text-sm text-kerala-primary text-center px-4">
              {isListening ? 'ശ്രദ്ധിക്കുന്നു... (Listening... Speak now)' : 'മൈക്കിൽ തൊട്ടു സംസാരിക്കുക (Tap to speak)'}
            </p>
            <p class="text-xs text-slate-500 mt-1 text-center">
              e.g., "രണ്ട് അപ്പവും മട്ടൻ സ്റ്റൂവും", "മീൻ കറി 1", "ഒരു സുലൈമാനി"
            </p>

            {/* Simulated Voice Quick Buttons for Testing */}
            <div class="mt-3 flex flex-wrap justify-center gap-1.5">
              <span class="text-[11px] font-bold text-slate-400 self-center">Try Demo Voice Input:</span>
              <button 
                onClick={() => { setTranscript('രണ്ട് പാലപ്പവും മട്ടൻ സ്റ്റൂവും'); handleProcessTranscript('രണ്ട് പാലപ്പവും മട്ടൻ സ്റ്റൂവും'); }}
                class="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 text-xs rounded-full shadow-sm hover:bg-orange-100"
              >
                🗣️ "രണ്ട് അപ്പം & സ്റ്റൂ"
              </button>
              <button 
                onClick={() => { setTranscript('ഒരു കരിമീൻ പൊള്ളിച്ചത്'); handleProcessTranscript('ഒരു കരിമീൻ പൊള്ളിച്ചത്'); }}
                class="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 text-xs rounded-full shadow-sm hover:bg-orange-100"
              >
                🗣️ "കരിമീൻ പൊള്ളിച്ചത് 1"
              </button>
              <button 
                onClick={() => { setTranscript('രണ്ട് ചായ'); handleProcessTranscript('രണ്ട് ചായ'); }}
                class="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 text-xs rounded-full shadow-sm hover:bg-orange-100"
              >
                🗣️ "രണ്ട് സുലൈമാനി ചായ"
              </button>
            </div>
          </div>

          {/* Transcript Box */}
          {transcript && (
            <div class="p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
              <div class="text-[11px] font-bold text-slate-400 uppercase">Spoken Voice Transcript:</div>
              <p class="text-sm font-semibold text-slate-800 mt-0.5">"{transcript}"</p>
              <button 
                onClick={() => handleProcessTranscript(transcript)}
                class="mt-2 text-xs font-bold text-kerala-primary hover:underline"
              >
                Search match for "{transcript}" →
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div class="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle class="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Matched Dish Results with Audio Read-back Confirmation */}
          {matches.length > 0 && (
            <div class="space-y-3">
              <h3 class="text-xs font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <Sparkles class="w-4 h-4 text-amber-500" />
                Matched Dish Confirmation (കണ്ടെത്തിയ വിഭവം):
              </h3>
              {matches.map((m, idx) => (
                <div key={m.item.id} class="p-3 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-center justify-between shadow-sm">
                  <div class="flex items-center space-x-3">
                    <img src={m.item.image_url} alt={m.item.name_en} class="w-12 h-12 rounded-xl object-cover" />
                    <div>
                      <h4 class="font-bold text-sm text-slate-900">{m.item.name_ml}</h4>
                      <p class="text-xs text-slate-500">{m.item.name_en} • ₹{m.item.price}</p>
                      <span class="inline-block mt-0.5 bg-amber-200 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        Quantity: {selectedQuantity}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onAddToCart(m.item, selectedQuantity, 'Added via Voice');
                      onClose();
                    }}
                    class="px-4 py-2 bg-kerala-leaf text-white font-extrabold text-xs rounded-xl shadow hover:bg-emerald-700 flex items-center gap-1.5"
                  >
                    <Check class="w-4 h-4" />
                    <span>Confirm Add</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Fallback Tap-to-Select Drawer (For safari iOS / older users) */}
          <div class="pt-3 border-t border-slate-200">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-xs font-extrabold text-slate-700 uppercase flex items-center gap-1.5">
                <Hand class="w-4 h-4 text-kerala-primary" />
                {t('tap_fallback_title')}
              </h3>
              <span class="text-[10px] text-slate-400">Tap to add</span>
            </div>
            <p class="text-[11px] text-slate-500 mb-3">{t('tap_fallback_desc')}</p>

            <div class="grid grid-cols-2 gap-2">
              {fallbackDishes.map((dish) => (
                <button
                  key={dish.id}
                  onClick={() => {
                    onAddToCart(dish, 1, 'Added via Quick Tap');
                    onClose();
                  }}
                  class="p-2.5 bg-slate-50 hover:bg-orange-50 border border-slate-200 rounded-xl text-left flex items-center space-x-2 transition"
                >
                  <img src={dish.image_url} alt={dish.name_en} class="w-10 h-10 rounded-lg object-cover" />
                  <div class="overflow-hidden">
                    <p class="font-bold text-xs text-slate-800 truncate">{dish.name_ml}</p>
                    <p class="text-[10px] font-bold text-kerala-primary">₹{dish.price}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
