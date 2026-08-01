import express from 'express';
import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get full menu categorized
router.get('/', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY display_order ASC').all();
    const items = db.prepare('SELECT * FROM menu_items').all();

    const categorizedMenu = categories.map(cat => ({
      ...cat,
      items: items.filter(item => item.category_id === cat.id)
    }));

    res.json({ categories, items, categorizedMenu });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle Item In-Stock Status (Admin)
router.patch('/items/:id/stock', (req, res) => {
  try {
    const { id } = req.params;
    const { in_stock } = req.body;
    
    db.prepare('UPDATE menu_items SET in_stock = ? WHERE id = ?').run(in_stock ? 1 : 0, id);
    const updatedItem = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
    
    // Broadcast via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('menu_stock_updated', { itemId: id, in_stock: updatedItem.in_stock });
    }

    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new Menu Item (Admin)
router.post('/items', (req, res) => {
  try {
    const { category_id, name_en, name_ml, name_hi, description, price, veg_flag, spice_level, image_url, station, synonyms_ml } = req.body;
    const id = `item_${uuidv4().substring(0, 8)}`;

    db.prepare(`
      INSERT INTO menu_items (id, category_id, name_en, name_ml, name_hi, description, price, veg_flag, spice_level, image_url, in_stock, station, synonyms_ml)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(id, category_id, name_en, name_ml || name_en, name_hi || name_en, description, price, veg_flag ? 1 : 0, spice_level || 1, image_url || '', station || 'main_kitchen', synonyms_ml || '');

    const newItem = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
    
    const io = req.app.get('io');
    if (io) io.emit('menu_updated');

    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Menu Item (Admin)
router.put('/items/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, name_en, name_ml, name_hi, description, price, veg_flag, spice_level, image_url, station, synonyms_ml } = req.body;

    db.prepare(`
      UPDATE menu_items
      SET category_id = ?, name_en = ?, name_ml = ?, name_hi = ?, description = ?,
          price = ?, veg_flag = ?, spice_level = ?, image_url = ?, station = ?, synonyms_ml = ?
      WHERE id = ?
    `).run(category_id, name_en, name_ml, name_hi, description, price, veg_flag ? 1 : 0, spice_level, image_url, station, synonyms_ml, id);

    const updated = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
    
    const io = req.app.get('io');
    if (io) io.emit('menu_updated');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
