import db from './db.js';
import crypto from 'crypto';

export function generateQrToken(restaurantId, tableNumber) {
  const secret = process.env.JWT_SECRET || 'kerala_secret_key';
  return crypto.createHmac('sha256', secret)
    .update(`${restaurantId}_table_${tableNumber}`)
    .digest('hex').substring(0, 12);
}

export function seedData() {
  const restaurantId = 'rid_001';
  
  // Check if restaurant already exists
  const existingRes = db.prepare('SELECT id FROM restaurants WHERE id = ?').get(restaurantId);
  if (existingRes) {
    console.log('Seed data already present.');
    return;
  }

  console.log('Seeding authentic Kerala restaurant database...');

  // 1. Restaurant
  db.prepare(`
    INSERT INTO restaurants (id, name, tagline, address, phone, gstin, cgst_rate, sgst_rate, service_charge_rate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    restaurantId,
    'Thattukada & Spice Village',
    'Authentic Flavors of Malabar & Travancore',
    'Kovalam Beach Road, Thiruvananthapuram, Kerala 695527',
    '+91 98470 12345',
    '32AAAAA0000A1Z5',
    2.5,
    2.5,
    0.0
  );

  // 2. Tables & Signed QR Tokens
  const tableInsert = db.prepare(`
    INSERT INTO tables (id, restaurant_id, table_number, qr_token, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (let i = 1; i <= 15; i++) {
    const token = generateQrToken(restaurantId, i);
    tableInsert.run(`table_${i}`, restaurantId, i, token, 'available');
  }

  // 3. Categories
  const categories = [
    { id: 'cat_bf', name_en: 'Breakfast', name_ml: 'ബ്രേക്ക്ഫാസ്റ്റ്', name_hi: 'नाश्ता', order: 1 },
    { id: 'cat_sadya', name_en: 'Sadya & Meals', name_ml: 'സദ്യ & ഊണ്', name_hi: 'सद्या और भोजन', order: 2 },
    { id: 'cat_seafood', name_en: 'Seafood Specials', name_ml: 'സീഫുഡ് സ്പെഷ്യൽ', name_hi: 'सीफूड स्पेशल', order: 3 },
    { id: 'cat_nonveg', name_en: 'Malabar Non-Veg', name_ml: 'മാംസാഹാരങ്ങൾ', name_hi: 'मांसाहारी व्यंजन', order: 4 },
    { id: 'cat_snacks', name_en: 'Breads & Snacks', name_ml: 'പൊറോട്ട & ലഘുഭക്ഷണം', name_hi: 'रोटी और स्नैक्स', order: 5 },
    { id: 'cat_drinks', name_en: 'Drinks & Desserts', name_ml: 'പാനീയങ്ങൾ & പായസം', name_hi: 'पेय और मिठाई', order: 6 },
  ];

  const catInsert = db.prepare(`
    INSERT INTO categories (id, restaurant_id, name_en, name_ml, name_hi, display_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  categories.forEach(c => {
    catInsert.run(c.id, restaurantId, c.name_en, c.name_ml, c.name_hi, c.order);
  });

  // 4. Menu Items
  const menuItems = [
    // Breakfast
    {
      id: 'item_appam_stew',
      category_id: 'cat_bf',
      name_en: 'Palappam with Mutton Stew',
      name_ml: 'പാലപ്പവും മട്ടൻ സ്റ്റൂവും',
      name_hi: 'पालप्पम और मटन स्टू',
      description: 'Lacy, soft coconut rice crepes served with rich creamy coconut milk mutton stew loaded with spices and potato.',
      price: 240,
      veg_flag: 0,
      spice_level: 2,
      station: 'main_kitchen',
      synonyms_ml: 'appam,palappam,mutton stew,stew,മട്ടൻ സ്റ്റൂ,ആപ്പം',
      image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'item_puttu_kadala',
      category_id: 'cat_bf',
      name_en: 'Steamed Puttu & Kadala Curry',
      name_ml: 'പുട്ടും കറുത്ത കടലക്കറിയും',
      name_hi: 'पुट्टू और कला चना करी',
      description: 'Layered rice flour and freshly grated coconut cylinders served with spiced black chickpea gravy roasted in roasted coconut paste.',
      price: 130,
      veg_flag: 1,
      spice_level: 3,
      station: 'main_kitchen',
      synonyms_ml: 'puttu,kadala,kadala curry,പുട്ട്,കടലക്കറി',
      image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'item_idiyappam_egg',
      category_id: 'cat_bf',
      name_en: 'Idiyappam & Spicy Nadan Egg Roast',
      name_ml: 'ഇടിയാപ്പവും മുട്ട റോസ്റ്റും',
      name_hi: 'इडियाप्पम और अंडा रोस्ट',
      description: 'Steamed string hoppers paired with caramelized onion and tomato fried hard-boiled eggs infused with Kerala garam masala.',
      price: 150,
      veg_flag: 0,
      spice_level: 3,
      station: 'main_kitchen',
      synonyms_ml: 'idiyappam,egg roast,mutta roast,ഇടിയാപ്പം,മുട്ട റോസ്റ്റ്',
      image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80'
    },

    // Sadya & Meals
    {
      id: 'item_kerala_sadya',
      category_id: 'cat_sadya',
      name_en: 'Grand Kerala Banana Leaf Sadya',
      name_ml: 'കേരള പാരമ്പര്യ വാഴയില സദ്യ',
      name_hi: 'केरल केला पत्ता सद्या',
      description: 'Authentic 24-dish feast served on banana leaf featuring Rose Matta Rice, Parippu, Sambar, Avial, Thoran, Olan, Kalan, Rasam, Inji Puli, Papad, and Payasam.',
      price: 320,
      veg_flag: 1,
      spice_level: 2,
      station: 'main_kitchen',
      synonyms_ml: 'sadya,meals,ila sadya,ഊണ്,സദ്യ,വാഴയില സദ്യ',
      image_url: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'item_fish_meals',
      category_id: 'cat_sadya',
      name_en: 'Kottayam Meen Curry Rice Meal',
      name_ml: 'കോട്ടയം മീൻകറി ചോറ് ഊണ്',
      name_hi: 'कोट्टायम मछली करी चावल',
      description: 'Kerala Matta Red Rice served with spicy Kudampuli fish curry, fish fry slice, cabbage thoran, moru curry, and chammanthi.',
      price: 260,
      veg_flag: 0,
      spice_level: 4,
      station: 'seafood',
      synonyms_ml: 'fish meals,meen curry meals,oon,മീൻ കറി ഊണ്,മീൻ ഊണ്',
      image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80'
    },

    // Seafood Specials
    {
      id: 'item_karimeen_pollichathu',
      category_id: 'cat_seafood',
      name_en: 'Karimeen Pollichathu (Pearl Spot)',
      name_ml: 'കരിമീൻ വാഴയിലയിൽ പൊള്ളിച്ചത്',
      name_hi: 'करीमीन पोलिच्चतु (केले के पत्ते में सिकी मछली)',
      description: 'Fresh backwater Pearl Spot fish marinated in shallot-chili masala, wrapped in charred banana leaf and slow-cooked in cold-pressed coconut oil.',
      price: 480,
      veg_flag: 0,
      spice_level: 4,
      station: 'seafood',
      synonyms_ml: 'karimeen,pollichathu,fish pollichathu,കരിമീൻ,പൊള്ളിച്ചത്',
      image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'item_chemmeen_roast',
      category_id: 'cat_seafood',
      name_en: 'Kerala Spicy Chemmeen Roast (Prawns)',
      name_ml: 'നാടൻ ചെമ്മീൻ ഫ്രൈ റോസ്റ്റ്',
      name_hi: 'केरल झींगा रोस्ट',
      description: 'Juicy ocean prawns sautéed with coconut slices (thenga kothu), crushed curry leaves, black pepper, and garlic.',
      price: 420,
      veg_flag: 0,
      spice_level: 4,
      station: 'seafood',
      synonyms_ml: 'chemmeen,prawns,prawn roast,ചെമ്മീൻ,ചെമ്മീൻ റോസ്റ്റ്',
      image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'item_njandu_roast',
      category_id: 'cat_seafood',
      name_en: 'Malabar Crab Roast (Njandu Curry)',
      name_ml: 'മലബാർ ഞണ്ട് ഫ്രൈ റോസ്റ്റ്',
      name_hi: 'मालाबार केकड़ा रोस्ट',
      description: 'Whole mud crab tossed in thick dark roasted coconut paste, dry red chilies, fennel seed powder, and curry leaves.',
      price: 450,
      veg_flag: 0,
      spice_level: 5,
      station: 'seafood',
      synonyms_ml: 'njandu,crab,crab roast,ഞണ്ട്,ഞണ്ട് റോസ്റ്റ്',
      image_url: 'https://images.unsplash.com/photo-1559742811-822863c46f43?auto=format&fit=crop&w=600&q=80'
    },

    // Malabar Non-Veg
    {
      id: 'item_malabar_biryani',
      category_id: 'cat_nonveg',
      name_en: 'Thalassery Chicken Dum Biryani',
      name_ml: 'തലശ്ശേരി ചിക്കൻ ദം ബിരിയാണി',
      name_hi: 'थलस्सेरी चिकन दम बिरयानी',
      description: 'Aromatic short-grain Kaima/Jeerakasala rice cooked with tender chicken, fried cashews, raisins, ghee, and Malabar spices in sealed handi.',
      price: 290,
      veg_flag: 0,
      spice_level: 3,
      station: 'main_kitchen',
      synonyms_ml: 'biryani,chicken biryani,malabar biryani,thalassery biryani,ബിരിയാണി,ചിക്കൻ ബിരിയാണി',
      image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'item_beef_fry',
      category_id: 'cat_nonveg',
      name_en: 'Kerala Beef Ularthiyathu (Slow Fry)',
      name_ml: 'കേരള സ്പെഷ്യൽ ബീഫ് ഉലർത്തിയത്',
      name_hi: 'केरल बीफ फ्राई',
      description: 'Slow-roasted succulent beef chunks coated with dark roasted black pepper, crushed shallots, coconut slivers, and fresh curry leaves.',
      price: 270,
      veg_flag: 0,
      spice_level: 4,
      station: 'tandoor',
      synonyms_ml: 'beef,beef fry,beef roast,ularthiyathu,ബീഫ്,ബീഫ് ഫ്രൈ,ബീഫ് റോസ്റ്റ്',
      image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'item_duck_roast',
      category_id: 'cat_nonveg',
      name_en: 'Kuttanadan Tharavu (Duck Roast)',
      name_ml: 'കുട്ടനാടൻ താറാവ് റോസ്റ്റ്',
      name_hi: 'कुट्टनाड बत्तख रोस्ट',
      description: 'Tender farm duck slow-simmered in rich coriander-fennel gravy with potatoes and roasted pepper.',
      price: 360,
      veg_flag: 0,
      spice_level: 4,
      station: 'main_kitchen',
      synonyms_ml: 'duck,duck roast,tharavu,താറാവ്,താറാവ് റോസ്റ്റ്',
      image_url: 'https://images.unsplash.com/photo-1514944288352-fffac99f0bdf?auto=format&fit=crop&w=600&q=80'
    },

    // Breads & Snacks
    {
      id: 'item_malabar_porotta',
      category_id: 'cat_snacks',
      name_en: 'Flaky Malabar Flaky Porotta (2 pcs)',
      name_ml: 'മലബാർ ലെയർ പൊറോട്ട (2 എണ്ണം)',
      name_hi: 'मालाबार पराठा (2 पीस)',
      description: 'Hand-tossed, multi-layered crisp golden wheat/maida bread baked on hot griddle with pure ghee.',
      price: 60,
      veg_flag: 1,
      spice_level: 1,
      station: 'tandoor',
      synonyms_ml: 'porotta,parotta,malabar porotta,പൊറോട്ട,പരോട്ട',
      image_url: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'item_pazham_pori',
      category_id: 'cat_snacks',
      name_en: 'Crispy Pazham Pori (Banana Fritters - 2 pcs)',
      name_ml: 'ചൂട് ഏത്തയ്ക്ക അപ്പം / പഴംപൊരി',
      name_hi: 'केला पकोड़ा (2 पीस)',
      description: 'Ripe Nendran yellow bananas dipped in cardamom-scented batter and deep-fried till golden crunchy.',
      price: 80,
      veg_flag: 1,
      spice_level: 1,
      station: 'tandoor',
      synonyms_ml: 'pazham pori,ethakka appam,banana fry,പഴംപൊരി,ഏത്തയ്ക്ക അപ്പം',
      image_url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80'
    },

    // Drinks & Desserts
    {
      id: 'item_sulaimani',
      category_id: 'cat_drinks',
      name_en: 'Malabar Spiced Sulaimani Tea',
      name_ml: 'സുലൈമാനി കട്ടൻ ചായ (ഏലയ്ക്ക & ചെറുനാരങ്ങ)',
      name_hi: 'सुलेमानी ब्लैक टी',
      description: 'Traditional piping hot black tea infused with cardamom, mint leaves, cloves, and fresh lemon drop.',
      price: 40,
      veg_flag: 1,
      spice_level: 1,
      station: 'beverages',
      synonyms_ml: 'sulaimani,chaya,black tea,സുലൈമാനി,ചായ,കട്ടൻ ചായ',
      image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'item_kulukki_sarbath',
      category_id: 'cat_drinks',
      name_en: 'Kozhikode Kulukki Sarbath',
      name_ml: 'കോഴിക്കോടൻ കുലുക്കി സർബത്ത്',
      name_hi: 'कुलुक्की शर्बत',
      description: 'Chilled hand-shaken lime drink with basil seeds (nannari), green chili slit, and ginger crushed ice.',
      price: 60,
      veg_flag: 1,
      spice_level: 2,
      station: 'beverages',
      synonyms_ml: 'kulukki,sarbath,lime juice,കുലുക്കി സർബത്ത്,സർബത്ത്',
      image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'item_ada_pradhaman',
      category_id: 'cat_drinks',
      name_en: 'Palada / Ada Pradhaman Payasam',
      name_ml: 'നാടൻ അട പ്രഥമൻ പായസം',
      name_hi: 'अडा प्रथमन पायसम',
      description: 'Slow-cooked rice ada ribbons in jaggery nectar, thick coconut milk, roasted cashew nuts, and coconut chips.',
      price: 120,
      veg_flag: 1,
      spice_level: 1,
      station: 'desserts',
      synonyms_ml: 'payasam,ada pradhaman,dessert,പായസം,അട പ്രഥമൻ',
      image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80'
    }
  ];

  const itemInsert = db.prepare(`
    INSERT INTO menu_items (id, category_id, name_en, name_ml, name_hi, description, price, veg_flag, spice_level, image_url, in_stock, station, synonyms_ml)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);

  menuItems.forEach(item => {
    itemInsert.run(
      item.id,
      item.category_id,
      item.name_en,
      item.name_ml,
      item.name_hi,
      item.description,
      item.price,
      item.veg_flag,
      item.spice_level,
      item.image_url,
      item.station,
      item.synonyms_ml
    );
  });

  // 5. Staff Users (Admin, Kitchen, Waiter)
  const staffInsert = db.prepare(`
    INSERT INTO staff_users (id, restaurant_id, name, role, phone, password_hash)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Default staff logins (password: 123456)
  staffInsert.run('staff_admin', restaurantId, 'Chef Suresh Nair (Manager)', 'ADMIN', '9847012345', '$2a$10$wN9P31X9pQ5b.wR0Vn1D2u.123456');
  staffInsert.run('staff_kitchen', restaurantId, 'Chef Moideen (Head Chef)', 'KITCHEN', '9847054321', '$2a$10$wN9P31X9pQ5b.wR0Vn1D2u.123456');
  staffInsert.run('staff_waiter', restaurantId, 'Vishnu (Lead Waiter)', 'WAITER', '9847099999', '$2a$10$wN9P31X9pQ5b.wR0Vn1D2u.123456');

  console.log('Seeding completed successfully!');
}
