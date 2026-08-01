import express from 'express';
import db from '../db.js';

const router = express.Router();

// Get restaurant config and tax rates
router.get('/config', (req, res) => {
  try {
    const restaurant = db.prepare('SELECT * FROM restaurants LIMIT 1').get();
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update tax rates and restaurant settings (Admin)
router.put('/config', (req, res) => {
  try {
    const { name, tagline, phone, address, gstin, cgst_rate, sgst_rate, service_charge_rate } = req.body;
    db.prepare(`
      UPDATE restaurants
      SET name = ?, tagline = ?, phone = ?, address = ?, gstin = ?,
          cgst_rate = ?, sgst_rate = ?, service_charge_rate = ?
      WHERE id = 'rid_001'
    `).run(name, tagline, phone, address, gstin, cgst_rate, sgst_rate, service_charge_rate);

    const updated = db.prepare('SELECT * FROM restaurants WHERE id = \'rid_001\'').get();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
