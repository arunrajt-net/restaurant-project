import React, { createContext, useContext, useState } from 'react';

const translations = {
  en: {
    restaurant_title: "Thattukada & Spice Village",
    tagline: "Authentic Kerala Culinary Experience",
    table: "Table",
    call_waiter: "Call Waiter",
    menu: "Menu",
    cart: "Cart",
    voice_order: "Malayalam Voice Order",
    voice_mic_prompt: "Tap mic and speak dish name (e.g., 'Appam 2', 'Meen Curry')",
    search_placeholder: "Search Karimeen, Biryani, Puttu...",
    all_categories: "All Categories",
    veg: "Veg",
    non_veg: "Non-Veg",
    spicy: "Spicy",
    sold_out: "Sold Out",
    add_to_cart: "Add to Cart",
    shared_cart: "Shared Table Cart",
    items_in_cart: "items in table cart",
    subtotal: "Subtotal",
    tax_gst: "GST Tax",
    tip: "Tip / Service",
    grand_total: "Grand Total",
    send_to_kitchen: "Send Order to Kitchen",
    live_tracker: "Live Order Tracker",
    order_status: "Order Status",
    placed: "Placed",
    preparing: "Preparing in Kitchen",
    ready: "Ready to Serve",
    served: "Served",
    pay_now: "Pay Now",
    pay_later: "Pay Post-Meal",
    split_bill: "Split Bill",
    receipt: "Digital Receipt",
    rate_dishes: "Rate Dishes",
    tap_fallback_title: "Tap-to-Select Voice Fallback Menu",
    tap_fallback_desc: "Speech recognition unavailable? Tap any dish below to add instantly:",
  },
  ml: {
    restaurant_title: "തട്ടുകട & സ്‌പൈസ് വില്ലേജ്",
    tagline: "കേരള തനത് ഭക്ഷണശാല",
    table: "മേശ / ടേബിൾ",
    call_waiter: "വെയിറ്ററെ വിളിക്കുക",
    menu: "മെനു",
    cart: "കാർട്ട്",
    voice_order: "ശബ്ദ ഓർഡർ (Malayalam)",
    voice_mic_prompt: "മൈക്കിൽ തൊട്ട് വിഭവത്തിന്റെ പേര് പറയുക (ഉദാ: 'ആപ്പം 2', 'മീൻ കറി')",
    search_placeholder: "കരിമീൻ, ബിരിയാണി, പുട്ട് തിരയുക...",
    all_categories: "എല്ലാ വിഭാഗങ്ങളും",
    veg: "സസ്യാഹാരം",
    non_veg: "മാംസാഹാരം",
    spicy: "എരിവ്",
    sold_out: "തീർന്നുപോയി (Sold Out)",
    add_to_cart: "കാർട്ടിലേക്ക് ചേർക്കുക",
    shared_cart: "ടേബിൾ ഷെയർഡ് കാർട്ട്",
    items_in_cart: "വിഭവങ്ങൾ കാർട്ടിലുണ്ട്",
    subtotal: "ആകെ വില",
    tax_gst: "ജി.എസ്.ടി നികുതി (GST)",
    tip: "ടിപ്പ് / സർവീസ്",
    grand_total: "മൊത്തം തുക",
    send_to_kitchen: "അടുക്കളയിലേക്ക് ഓർഡർ അയക്കുക",
    live_tracker: "ലൈവ് ഓർഡർ ട്രാക്കർ",
    order_status: "ഓർഡർ അവസ്ഥ",
    placed: "സ്വീകരിച്ചു (Placed)",
    preparing: "തയ്യാറാക്കുന്നു (Preparing)",
    ready: "തയ്യാറാണ് (Ready)",
    served: "മേശയിലെത്തിച്ചു (Served)",
    pay_now: "ഇപ്പോൾ പണമടയ്ക്കുക",
    pay_later: "കഴിച്ചശേഷം പണമടയ്ക്കുക",
    split_bill: "ബിൽ പങ്കിടുക",
    receipt: "ഡിജിറ്റൽ രസീത്",
    rate_dishes: "അഭിപ്രായം രേഖപ്പെടുത്തുക",
    tap_fallback_title: "മലയാളം ക്വിക്ക് വിഭവപ്പട്ടിക",
    tap_fallback_desc: "ശബ്ദ തിരിച്ചറിയൽ ലഭ്യമല്ലെങ്കിൽ താഴെയുള്ള വിഭവങ്ങളിൽ തൊടുക:",
  },
  hi: {
    restaurant_title: "थट्टुकाड़ा और स्पाइस विलेज",
    tagline: "प्रामाणिक केरल व्यंजन अनुभव",
    table: "टेबल",
    call_waiter: "वेट बुलाएं",
    menu: "मेनू",
    cart: "कार्ट",
    voice_order: "वॉइस ऑर्डर (मलयालम)",
    voice_mic_prompt: "माइक दबाकर डिश का नाम बोलें (जैसे: 'Appam 2', 'Meen Curry')",
    search_placeholder: "करीमीन, बिरयानी, पुट्टू खोजें...",
    all_categories: "सभी श्रेणियां",
    veg: "शाकाहारी",
    non_veg: "मांसाहारी",
    spicy: "तीखा",
    sold_out: "समाप्त (Sold Out)",
    add_to_cart: "कार्ट में जोड़ें",
    shared_cart: "टेबल साझा कार्ट",
    items_in_cart: "कार्ट में डिश",
    subtotal: "उप-योग",
    tax_gst: "जीएसटी कर (GST)",
    tip: "टिप / सर्विस",
    grand_total: "कुल राशि",
    send_to_kitchen: "रसोई में ऑर्डर भेजें",
    live_tracker: "लाइव ऑर्डर ट्रैकर",
    order_status: "ऑर्डर स्थिति",
    placed: "स्वीकृत (Placed)",
    preparing: "तैयार हो रहा है (Preparing)",
    ready: "परोसने के लिए तैयार (Ready)",
    served: "परोसा गया (Served)",
    pay_now: "अभी भुगतान करें",
    pay_later: "भोजन के बाद भुगतान करें",
    split_bill: "बिल विभाजित करें",
    receipt: "डिजिटल रसीद",
    rate_dishes: "रेटिंग दें",
    tap_fallback_title: "मलयालम त्वरित व्यंजन मेनू",
    tap_fallback_desc: "वॉइस पहचान उपलब्ध नहीं होने पर नीचे टैप करें:",
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('ml'); // Default Malayalam

  const t = (key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
