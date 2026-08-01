import db from '../db.js';

// Number words map in Malayalam (script + English transliteration)
const NUMBER_MAP = {
  'ഒന്ന്': 1, 'onnu': 1, 'one': 1, '1': 1,
  'രണ്ട്': 2, 'randu': 2, 'two': 2, '2': 2,
  'മൂന്ന്': 3, 'moonu': 3, 'three': 3, '3': 3,
  'നാല്': 4, 'naalu': 4, 'four': 4, '4': 4,
  'അഞ്ച്': 5, 'anju': 5, 'five': 5, '5': 5,
};

export function matchMalayalamVoiceInput(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') {
    return { matches: [], quantity: 1, confidence: 0 };
  }

  const text = rawInput.toLowerCase().trim();
  
  // 1. Extract Quantity
  let quantity = 1;
  for (const [key, val] of Object.entries(NUMBER_MAP)) {
    if (text.includes(key)) {
      quantity = val;
      break;
    }
  }

  // 2. Fetch all menu items
  const menuItems = db.prepare('SELECT * FROM menu_items WHERE in_stock = 1').all();

  const scoredMatches = [];

  for (const item of menuItems) {
    let score = 0;
    const nameEn = item.name_en.toLowerCase();
    const nameMl = item.name_ml.toLowerCase();
    const synonyms = (item.synonyms_ml || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);

    // Exact or substring match in Malayalam name
    if (nameMl && text.includes(nameMl)) {
      score += 100;
    }

    // Match in synonyms
    synonyms.forEach(syn => {
      if (syn && text.includes(syn)) {
        score += 80;
      } else if (syn && syn.split(' ').some(word => text.includes(word))) {
        score += 40;
      }
    });

    // Match English name or keywords
    if (text.includes(nameEn)) {
      score += 70;
    } else {
      const enWords = nameEn.split(' ').filter(w => w.length > 3);
      enWords.forEach(word => {
        if (text.includes(word)) score += 25;
      });
    }

    if (score > 0) {
      scoredMatches.push({
        item: {
          id: item.id,
          name_en: item.name_en,
          name_ml: item.name_ml,
          name_hi: item.name_hi,
          price: item.price,
          image_url: item.image_url,
          veg_flag: item.veg_flag
        },
        quantity,
        score
      });
    }
  }

  // Sort by highest score first
  scoredMatches.sort((a, b) => b.score - a.score);

  return {
    input: rawInput,
    quantity,
    matches: scoredMatches.slice(0, 4) // top 4 candidates
  };
}
