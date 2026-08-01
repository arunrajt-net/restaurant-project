import express from 'express';
import { matchMalayalamVoiceInput } from '../utils/voiceMatcher.js';
import db from '../db.js';

const router = express.Router();

// Match spoken or typed Malayalam text input
router.post('/match', (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: 'transcript is required' });
    }

    const result = matchMalayalamVoiceInput(transcript);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Tap-to-Select Fallback Kerala Dishes (for browsers with no STT support)
router.get('/fallback-dishes', (req, res) => {
  try {
    const topDishes = db.prepare(`
      SELECT id, name_en, name_ml, name_hi, price, image_url, veg_flag, spice_level 
      FROM menu_items 
      WHERE in_stock = 1 
      LIMIT 10
    `).all();

    res.json(topDishes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
