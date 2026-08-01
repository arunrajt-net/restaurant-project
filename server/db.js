import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const storeFilePath = path.join(dataDir, 'restaurant_store.json');

// In-Memory tables store
let store = {
  restaurants: [],
  tables: [],
  table_cart_items: [],
  waiter_calls: [],
  categories: [],
  menu_items: [],
  orders: [],
  order_items: [],
  payments: [],
  staff_users: [],
  feedback: []
};

// Load existing store if file exists
function loadStore() {
  if (fs.existsSync(storeFilePath)) {
    try {
      const raw = fs.readFileSync(storeFilePath, 'utf8');
      const loaded = JSON.parse(raw);
      store = { ...store, ...loaded };
    } catch (e) {
      console.error('Error loading store file, initializing fresh:', e);
    }
  }
}

// Persist store to disk
function saveStore() {
  try {
    fs.writeFileSync(storeFilePath, JSON.stringify(store, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving store file:', e);
  }
}

export function initDb() {
  loadStore();
  console.log('Pure JS Database engine initialized with persistence.');
}

// Helper query runner matching SQLite prepared statements
class PreparedStatement {
  constructor(sql) {
    this.sql = sql.trim();
  }

  run(...params) {
    // Standardize params array if passed as array or rest parameters
    const args = (params.length === 1 && Array.isArray(params[0])) ? params[0] : params;
    const sql = this.sql;

    if (sql.startsWith('INSERT INTO restaurants')) {
      const [id, name, tagline, address, phone, gstin, cgst_rate, sgst_rate, service_charge_rate] = args;
      store.restaurants = store.restaurants.filter(r => r.id !== id);
      store.restaurants.push({
        id, name, tagline, address, phone, gstin,
        cgst_rate: cgst_rate ?? 2.5,
        sgst_rate: sgst_rate ?? 2.5,
        service_charge_rate: service_charge_rate ?? 0.0,
        created_at: new Date().toISOString()
      });
    } else if (sql.startsWith('UPDATE restaurants')) {
      const [name, tagline, phone, address, gstin, cgst_rate, sgst_rate, service_charge_rate] = args;
      if (store.restaurants.length > 0) {
        Object.assign(store.restaurants[0], { name, tagline, phone, address, gstin, cgst_rate, sgst_rate, service_charge_rate });
      }
    } else if (sql.startsWith('INSERT INTO tables')) {
      const [id, restaurant_id, table_number, qr_token, status] = args;
      store.tables = store.tables.filter(t => t.id !== id);
      store.tables.push({ id, restaurant_id, table_number, qr_token, status: status || 'available', created_at: new Date().toISOString() });
    } else if (sql.startsWith('UPDATE tables SET status')) {
      const [status, id] = args;
      const t = store.tables.find(tbl => tbl.id === id);
      if (t) t.status = status;
    } else if (sql.startsWith('INSERT INTO categories')) {
      const [id, restaurant_id, name_en, name_ml, name_hi, display_order] = args;
      store.categories = store.categories.filter(c => c.id !== id);
      store.categories.push({ id, restaurant_id, name_en, name_ml, name_hi, display_order });
    } else if (sql.startsWith('INSERT INTO menu_items')) {
      const [id, category_id, name_en, name_ml, name_hi, description, price, veg_flag, spice_level, image_url, in_stock, station, synonyms_ml] = args;
      store.menu_items = store.menu_items.filter(m => m.id !== id);
      store.menu_items.push({ id, category_id, name_en, name_ml, name_hi, description, price, veg_flag, spice_level, image_url, in_stock: in_stock ?? 1, station, synonyms_ml });
    } else if (sql.startsWith('UPDATE menu_items SET in_stock')) {
      const [in_stock, id] = args;
      const item = store.menu_items.find(m => m.id === id);
      if (item) item.in_stock = in_stock;
    } else if (sql.startsWith('UPDATE menu_items SET category_id') || sql.startsWith('UPDATE menu_items\n      SET category_id')) {
      const [category_id, name_en, name_ml, name_hi, description, price, veg_flag, spice_level, image_url, station, synonyms_ml, id] = args;
      const item = store.menu_items.find(m => m.id === id);
      if (item) {
        Object.assign(item, { category_id, name_en, name_ml, name_hi, description, price, veg_flag, spice_level, image_url, station, synonyms_ml });
      }
    } else if (sql.startsWith('INSERT INTO table_cart_items')) {
      const [id, table_id, menu_item_id, quantity, special_instructions, added_by_session] = args;
      store.table_cart_items.push({ id, table_id, menu_item_id, quantity, special_instructions, added_by_session, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    } else if (sql.startsWith('UPDATE table_cart_items SET quantity = quantity +')) {
      const [qtyToAdd, id] = args;
      const c = store.table_cart_items.find(item => item.id === id);
      if (c) {
        c.quantity += qtyToAdd;
        c.updated_at = new Date().toISOString();
      }
    } else if (sql.startsWith('UPDATE table_cart_items SET quantity = ?')) {
      const [quantity, special_instructions, id] = args;
      const c = store.table_cart_items.find(item => item.id === id);
      if (c) {
        c.quantity = quantity;
        if (special_instructions !== undefined) c.special_instructions = special_instructions;
        c.updated_at = new Date().toISOString();
      }
    } else if (sql.startsWith('DELETE FROM table_cart_items WHERE id')) {
      const [id] = args;
      store.table_cart_items = store.table_cart_items.filter(c => c.id !== id);
    } else if (sql.startsWith('DELETE FROM table_cart_items WHERE table_id')) {
      const [table_id] = args;
      store.table_cart_items = store.table_cart_items.filter(c => c.table_id !== table_id);
    } else if (sql.startsWith('INSERT INTO waiter_calls')) {
      const [id, table_id, request_type, status] = args;
      store.waiter_calls.push({ id, table_id, request_type, status: status || 'pending', created_at: new Date().toISOString() });
    } else if (sql.startsWith('UPDATE waiter_calls SET status')) {
      const [status, id] = args;
      const call = store.waiter_calls.find(c => c.id === id);
      if (call) call.status = status;
    } else if (sql.startsWith('INSERT INTO orders')) {
      const [id, table_id, restaurant_id, order_number, total_amount, cgst_amount, sgst_amount, tip_amount, payment_status, payment_method] = args;
      store.orders.push({
        id, table_id, restaurant_id, order_number, status: 'placed',
        total_amount, cgst_amount, sgst_amount, tip_amount: tip_amount || 0,
        payment_status: payment_status || 'pending', payment_method: payment_method || 'UPI',
        created_at: new Date().toISOString()
      });
    } else if (sql.startsWith('UPDATE orders SET status')) {
      const [status, id] = args;
      const o = store.orders.find(ord => ord.id === id);
      if (o) o.status = status;
    } else if (sql.startsWith('UPDATE orders SET payment_status')) {
      const [payment_method, id] = args;
      const o = store.orders.find(ord => ord.id === id);
      if (o) {
        o.payment_status = 'paid';
        o.payment_method = payment_method;
      }
    } else if (sql.startsWith('INSERT INTO order_items')) {
      const [id, order_id, menu_item_id, quantity, special_instructions, price_per_unit, status] = args;
      store.order_items.push({ id, order_id, menu_item_id, quantity, special_instructions, price_per_unit, status: status || 'placed' });
    } else if (sql.startsWith('INSERT INTO payments')) {
      const [id, order_id, gateway_txn_id, razorpay_order_id, razorpay_payment_id, amount, method, status] = args;
      store.payments.push({ id, order_id, gateway_txn_id, razorpay_order_id, razorpay_payment_id, amount, method, status: status || 'success', created_at: new Date().toISOString() });
    } else if (sql.startsWith('INSERT INTO staff_users')) {
      const [id, restaurant_id, name, role, phone, password_hash] = args;
      store.staff_users = store.staff_users.filter(s => s.id !== id);
      store.staff_users.push({ id, restaurant_id, name, role, phone, password_hash });
    }

    saveStore();
    return { changes: 1 };
  }

  get(...params) {
    const args = (params.length === 1 && Array.isArray(params[0])) ? params[0] : params;
    const sql = this.sql;

    if (sql.includes('FROM restaurants WHERE id = ?')) {
      const [id] = args;
      return store.restaurants.find(r => r.id === id) || null;
    }
    if (sql.includes('FROM restaurants LIMIT 1')) {
      return store.restaurants[0] || null;
    }
    if (sql.includes('FROM tables WHERE table_number = ?')) {
      const [tableNum] = args;
      return store.tables.find(t => t.table_number == tableNum) || null;
    }
    if (sql.includes('FROM tables WHERE id = ?')) {
      const [id] = args;
      return store.tables.find(t => t.id === id) || null;
    }
    if (sql.includes('FROM tables WHERE qr_token = ?')) {
      const [token] = args;
      return store.tables.find(t => t.qr_token === token) || null;
    }
    if (sql.includes('FROM menu_items WHERE id = ?')) {
      const [id] = args;
      return store.menu_items.find(m => m.id === id) || null;
    }
    if (sql.includes('FROM table_cart_items') && sql.includes('table_id = ? AND menu_item_id = ?')) {
      const [table_id, menu_item_id, special_instructions] = args;
      return store.table_cart_items.find(c => c.table_id === table_id && c.menu_item_id === menu_item_id && c.special_instructions === (special_instructions || '')) || null;
    }
    if (sql.includes('FROM table_cart_items WHERE id = ?')) {
      const [id] = args;
      return store.table_cart_items.find(c => c.id === id) || null;
    }
    if (sql.includes('SELECT MAX(order_number)')) {
      if (store.orders.length === 0) return { max_num: 100 };
      const maxNum = Math.max(...store.orders.map(o => o.order_number || 100));
      return { max_num: maxNum };
    }
    if (sql.includes('FROM orders') && sql.includes('WHERE o.id = ?') || sql.includes('WHERE id = ?')) {
      const [id] = args;
      const order = store.orders.find(o => o.id === id);
      if (!order) return null;
      const table = store.tables.find(t => t.id === order.table_id);
      return { ...order, table_number: table ? table.table_number : order.table_id };
    }
    if (sql.includes('FROM orders o') && sql.includes('JOIN restaurants')) {
      const [orderId] = args;
      const order = store.orders.find(o => o.id === orderId);
      if (!order) return null;
      const table = store.tables.find(t => t.id === order.table_id);
      const restaurant = store.restaurants[0] || {};
      return {
        ...order,
        table_number: table ? table.table_number : order.table_id,
        restaurant_name: restaurant.name || 'Thattukada',
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        gstin: restaurant.gstin || ''
      };
    }
    if (sql.includes('FROM orders') && sql.includes('table_id = ? AND status NOT IN')) {
      const [tableId] = args;
      const order = store.orders.filter(o => o.table_id === tableId && !['completed', 'cancelled'].includes(o.status))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      return order || null;
    }
    if (sql.includes('SELECT COUNT(*) as cnt FROM orders')) {
      const [table_id, id] = args;
      const cnt = store.orders.filter(o => o.table_id === table_id && o.id !== id && !['completed', 'cancelled'].includes(o.status)).length;
      return { cnt };
    }
    if (sql.includes('FROM payments WHERE order_id = ?')) {
      const [orderId] = args;
      return store.payments.find(p => p.order_id === orderId) || null;
    }
    if (sql.includes('FROM payments WHERE gateway_txn_id = ?')) {
      const [txnId] = args;
      return store.payments.find(p => p.gateway_txn_id === txnId) || null;
    }

    return null;
  }

  all(...params) {
    const args = (params.length === 1 && Array.isArray(params[0])) ? params[0] : params;
    const sql = this.sql;

    if (sql.includes('FROM categories ORDER BY display_order')) {
      return [...store.categories].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }
    if (sql.includes('FROM menu_items WHERE in_stock = 1')) {
      return store.menu_items.filter(m => m.in_stock === 1);
    }
    if (sql.includes('FROM menu_items')) {
      return [...store.menu_items];
    }
    if (sql.includes('FROM tables ORDER BY table_number')) {
      return [...store.tables].sort((a, b) => a.table_number - b.table_number);
    }
    if (sql.includes('FROM table_cart_items c') && sql.includes('WHERE c.table_id = ?')) {
      const [tableId] = args;
      const items = store.table_cart_items.filter(c => c.table_id === tableId);
      return items.map(c => {
        const m = store.menu_items.find(item => item.id === c.menu_item_id) || {};
        return {
          ...c,
          name_en: m.name_en || '',
          name_ml: m.name_ml || '',
          name_hi: m.name_hi || '',
          price: m.price || 0,
          image_url: m.image_url || '',
          veg_flag: m.veg_flag || 0,
          in_stock: m.in_stock || 1
        };
      });
    }
    if (sql.includes('FROM order_items oi') && sql.includes('WHERE oi.order_id = ?')) {
      const [orderId] = args;
      const items = store.order_items.filter(oi => oi.order_id === orderId);
      return items.map(oi => {
        const m = store.menu_items.find(item => item.id === oi.menu_item_id) || {};
        return {
          ...oi,
          name_en: m.name_en || '',
          name_ml: m.name_ml || '',
          name_hi: m.name_hi || '',
          station: m.station || 'main_kitchen',
          image_url: m.image_url || '',
          veg_flag: m.veg_flag || 0
        };
      });
    }
    if (sql.includes('FROM orders o') && sql.includes("status IN ('placed', 'preparing', 'ready')")) {
      const orders = store.orders.filter(o => ['placed', 'preparing', 'ready'].includes(o.status))
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      return orders.map(o => {
        const table = store.tables.find(t => t.id === o.table_id);
        return { ...o, table_number: table ? table.table_number : o.table_id };
      });
    }
    if (sql.includes('FROM orders o') && sql.includes('ORDER BY o.created_at DESC')) {
      const orders = [...store.orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return orders.map(o => {
        const table = store.tables.find(t => t.id === o.table_id);
        return { ...o, table_number: table ? table.table_number : o.table_id };
      });
    }
    if (sql.includes('FROM waiter_calls w') && sql.includes("status = 'pending'")) {
      const calls = store.waiter_calls.filter(w => w.status === 'pending')
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      return calls.map(w => {
        const table = store.tables.find(t => t.id === w.table_id);
        return { ...w, table_number: table ? table.table_number : w.table_id };
      });
    }

    return [];
  }
}

const db = {
  prepare(sql) {
    return new PreparedStatement(sql);
  },
  exec(sql) {
    return true;
  },
  pragma(sql) {
    return true;
  },
  transaction(fn) {
    return (...args) => {
      const result = fn(...args);
      saveStore();
      return result;
    };
  }
};

export default db;
