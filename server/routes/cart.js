import express from 'express';
import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Simple mutex map for per-table locking
const tableLocks = new Map();

async function acquireLock(tableId) {
  while (tableLocks.get(tableId)) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  tableLocks.set(tableId, true);
}

function releaseLock(tableId) {
  tableLocks.delete(tableId);
}

// Get active shared cart for a table
router.get('/:tableId', (req, res) => {
  try {
    const { tableId } = req.params;
    const items = db.prepare(`
      SELECT c.*, m.name_en, m.name_ml, m.name_hi, m.price, m.image_url, m.veg_flag, m.in_stock
      FROM table_cart_items c
      JOIN menu_items m ON c.menu_item_id = m.id
      WHERE c.table_id = ?
    `).all(tableId);

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    res.json({ tableId, items, subtotal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add item to shared table cart
router.post('/add', async (req, res) => {
  const { table_id, menu_item_id, quantity, special_instructions, added_by_session } = req.body;
  
  if (!table_id || !menu_item_id) {
    return res.status(400).json({ error: 'table_id and menu_item_id required' });
  }

  await acquireLock(table_id);
  
  try {
    const qtyToAdd = quantity && quantity > 0 ? quantity : 1;
    const instructions = special_instructions || '';

    // Atomic upsert logic
    const existing = db.prepare(`
      SELECT id FROM table_cart_items 
      WHERE table_id = ? AND menu_item_id = ? AND special_instructions = ?
    `).get(table_id, menu_item_id, instructions);

    if (existing) {
      db.prepare(`
        UPDATE table_cart_items 
        SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(qtyToAdd, existing.id);
    } else {
      const id = `cart_${uuidv4().substring(0, 8)}`;
      db.prepare(`
        INSERT INTO table_cart_items (id, table_id, menu_item_id, quantity, special_instructions, added_by_session)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, table_id, menu_item_id, qtyToAdd, instructions, added_by_session || 'guest');
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`table_${table_id}`).emit('cart_updated', { table_id });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    releaseLock(table_id);
  }
});

// Update item quantity or instructions in cart
router.put('/item/:cartItemId', async (req, res) => {
  const { cartItemId } = req.params;
  const { quantity, special_instructions } = req.body;

  const itemInfo = db.prepare('SELECT table_id FROM table_cart_items WHERE id = ?').get(cartItemId);
  if (!itemInfo) return res.status(404).json({ error: 'Cart item not found' });

  await acquireLock(itemInfo.table_id);
  try {
    if (quantity <= 0) {
      db.prepare('DELETE FROM table_cart_items WHERE id = ?').run(cartItemId);
    } else {
      db.prepare(`
        UPDATE table_cart_items
        SET quantity = ?, special_instructions = COALESCE(?, special_instructions), updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(quantity, special_instructions, cartItemId);
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`table_${itemInfo.table_id}`).emit('cart_updated', { table_id: itemInfo.table_id });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    releaseLock(itemInfo.table_id);
  }
});

// Clear cart for a table
router.delete('/:tableId', async (req, res) => {
  const { tableId } = req.params;
  await acquireLock(tableId);
  try {
    db.prepare('DELETE FROM table_cart_items WHERE table_id = ?').run(tableId);

    const io = req.app.get('io');
    if (io) {
      io.to(`table_${tableId}`).emit('cart_updated', { table_id: tableId });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    releaseLock(tableId);
  }
});

export default router;
